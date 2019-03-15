var mapping = require('./mapping.json');
const StringBuilder = require('string-builder');
module.exports = {
    createQuery: async (results, conversationData) => {
        var prevConv = false;
        var currConv = false;
        var andQuery = '';
        var topQueryIntent = results.luisResult.topScoringIntent.intent;
        //If the intent is count or previous, we append the query saved in earlier conversation
        //with the current conversation. This is to keep the continuation of context
        if (topQueryIntent.indexOf("CountOfCars") != -1 || topQueryIntent.indexOf("PreviousCars") != -1 || conversationData.continueContext == true) {
            currConv = true;
            if (conversationData.query != '' && topQueryIntent.indexOf("PreviousCars") == -1)
                andQuery = conversationData.query + ' AND ';
            else
                andQuery = conversationData.query
        }
        var entityDetails = '';
        Object.keys(results.entities).forEach(function (prop) {
            var luisEntity = results.entities[prop];
            //regex to convert the date in german app to SQL date format. It accepts ,/-
            var pattern = /([0-9]{1,2})[-|\/|.]{1}([0-9]{1,2})[-|\/|.]{1}([0-9]{2,4})/;

            //In some instances Luis returns only part of composite entity, we ignore that
            //this doesnt happen if Luis is configured correctly but this will not break the code
            if (prop != '$instance' && prop != 'entityValue' && prop != 'datetime' && prop != 'datetimeV2') {
                //entityValue is only used in composite and that is used to determine if entity 
                //is composite. Composite can be array or object. Below checks if entityvalue is present
                //in the entity returned by Luis
                const checkEntity = obj => 'entityValue' in obj;                
                var isEntityArray = luisEntity[0] instanceof Array;
                var isEntityObject = luisEntity[0] instanceof Object;

                var isComposite = false;
                if(isEntityArray || isEntityObject)
                {
                     isComposite = luisEntity.some(checkEntity);
                }
                //In most cases Luis returns entity with length 1 but misconfiguration
                //may return length 2. hence kept both the cases.Mostly else part will not be 
                //used in normal scenarios
                if (luisEntity.length == 1) {
                    if (isComposite) {
                        //find the position of entityValue within the entity object
                        //to get the calue of entity
                        var pos = luisEntity.map(function (e) { return e.entityValue; });
                        var valueEntity = pos[0];
                        entityDetails = entityDetails + prop + '-' + valueEntity[0] + ',';
                    }
                    else {
                        //for datetime in English bot
                        if (luisEntity[0]['datetime'] != null) {
                            entityDetails = entityDetails + prop + '-' + luisEntity[0]['datetime'][0]['timex'][0] + ',';
                        }
                        //for datetime in German bot
                        else if (luisEntity[0]['dateRegex'] != null) {
                            var dt = new Date(luisEntity[0]['dateRegex'][0].replace(pattern,'$3-$2-$1'));
                            entityDetails = entityDetails + prop + '-' + dt.toISOString().slice(0,10)  + ',';
                        }
                        else {
                            entityDetails = entityDetails + prop + '-' + luisEntity[0] + ',';
                        }
                    }
                }
                else {
                    if (isComposite) {
                        var pos = luisEntity.map(function (e) { return e.entityValue; });
                        var valueEntity = pos[1];
                        entityDetails = entityDetails + prop + '-' + valueEntity[0] + ',';
                    }
                    if (luisEntity[0]['datetime'] != null) {
                        entityDetails = entityDetails + prop + '-' + luisEntity[0]['datetime'][0]['timex'][0] + ',';
                    }
                    else if (luisEntity[0]['dateRegex'] != null) {
                        var dt = new Date(luisEntity[0]['dateRegex'][0].replace(pattern,'$3-$2-$1'));
                        entityDetails = entityDetails + prop + '-' + dt.toISOString().slice(0,10)  + ',';
                    }
                    else {
                        entityDetails = entityDetails + prop + '-' + luisEntity[0] + ',';
                    }
                }
            }
        });
        if (entityDetails != '') {
            entityDetails = entityDetails.replace('( ','(').replace(' )',')').replace(' - ','-');
            entityDetails = entityDetails.substr(0, entityDetails.length - 1);
        }

        var entityValues = [];

        if (entityDetails != '')
            entityValues = entityDetails.split(',');
        var sb = new StringBuilder();
        //build query for count or details based on the intent
        var carsQuery = 'select * from vehicles'
        if (topQueryIntent.indexOf('CountOfCars') != -1) {
            carsQuery = 'select count(*) from vehicles'
        }
        sb.append(carsQuery);
        if (topQueryIntent.indexOf("PreviousCars") != -1 && andQuery != '') {
            sb.append(' WHERE ');
            sb.append(andQuery)
        }
        //this logic is not for previous cars as in previous cars we just execute the previous
        //query created by count
        if ((entityValues != null && entityValues.length > 0) && (topQueryIntent.indexOf("PreviousCars") == -1)) {

            sb.append(' WHERE ');
            for (var i = 0; i < entityValues.length; ++i) {
                var entityType = entityValues[i].substr(0, entityValues[i].indexOf('-')).trim();
                //take the database column name from mapping
                var dbColumn = mapping[entityType];
                if (currConv)
                    andQuery = andQuery + dbColumn + ' = \'' + entityValues[i].substr(entityValues[i].indexOf('-') + 1) + '\'';
                else
                    andQuery = andQuery + dbColumn + ' = \'' + entityValues[i].substr(entityValues[i].indexOf('-') + 1) + '\'';
                if (i < entityValues.length - 1)
                    andQuery = andQuery + ' AND ';
            }
            sb.append(andQuery);

        }
        //For Previous cars
        else if (andQuery != '' && andQuery.endsWith('AND '))
        {
            andQuery = andQuery.substr(0,andQuery.length - 4)
            sb.append(' WHERE ');
            sb.append(andQuery);
        }

        var selectQueryCount = sb.toString();
        //var selectQueryDetails = sb.toString().replace('count(*)', '*');
        //save the intent and query to conversation state so that it can be used later
        conversationData.intent = results.luisResult.topScoringIntent.intent;
        conversationData.query = andQuery;
        return selectQueryCount;
    }
}

