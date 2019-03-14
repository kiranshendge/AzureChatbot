﻿var mapping = require('./mapping.json');
const StringBuilder = require('string-builder');
module.exports = {
    createQuery: async (results, conversationData) => {
        var prevConv = false;
        var currConv = false;
        var andQuery = '';
        var topQueryIntent = results.luisResult.topScoringIntent.intent;
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
            var pattern = /([0-9]{1,2})[-|\/|.]{1}([0-9]{1,2})[-|\/|.]{1}([0-9]{2,4})/;

            if (prop != '$instance' && prop != 'entityValue' && prop != 'datetime' && prop != 'datetimeV2') {
                const checkEntity = obj => 'entityValue' in obj;                
                var isEntityArray = luisEntity[0] instanceof Array;
                var isEntityObject = luisEntity[0] instanceof Object;

                var isComposite = false;
                if(isEntityArray || isEntityObject)
                {
                     isComposite = luisEntity.some(checkEntity);
                }
                if (luisEntity.length == 1) {
                    if (isComposite) {
                        var pos = luisEntity.map(function (e) { return e.entityValue; });
                        var valueEntity = pos[0];
                        entityDetails = entityDetails + prop + '-' + valueEntity[0] + ',';
                    }
                    else {
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
        var carsQuery = 'select * from vehicles'
        if (topQueryIntent.indexOf('CountOfCars') != -1) {
            carsQuery = 'select count(*) from vehicles'
        }
        sb.append(carsQuery);
        if (topQueryIntent.indexOf("PreviousCars") != -1 && andQuery != '') {
            sb.append(' WHERE ');
            sb.append(andQuery)
        }
        if ((entityValues != null && entityValues.length > 0) && (topQueryIntent.indexOf("PreviousCars") == -1)) {

            sb.append(' WHERE ');
            for (var i = 0; i < entityValues.length; ++i) {
                var entityType = entityValues[i].substr(0, entityValues[i].indexOf('-')).trim();
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
        else if (andQuery != '' && andQuery.endsWith('AND '))
        {
            andQuery = andQuery.substr(0,andQuery.length - 4)
            sb.append(' WHERE ');
            sb.append(andQuery);
        }

        var selectQueryCount = sb.toString();
        //var selectQueryDetails = sb.toString().replace('count(*)', '*');
        conversationData.intent = results.luisResult.topScoringIntent.intent;
        conversationData.query = andQuery;
        return selectQueryCount;
    }
}

