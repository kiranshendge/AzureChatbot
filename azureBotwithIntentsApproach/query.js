var mapping = require('./mapping.json');
const StringBuilder = require('string-builder');
module.exports = {
    createQuery: async(results, conversationData) => {
    var prevConv = false;
    var currConv = false;
    var andQuery = '';
    var topQueryIntent = results.luisResult.topScoringIntent.intent;
    if (topQueryIntent.indexOf("CountOfCars") != -1 || topQueryIntent.indexOf("PreviousCars") != -1) {
        currConv = true;
        if (conversationData.query != '' && topQueryIntent.indexOf("PreviousCars") == -1)
            andQuery = conversationData.query + ' AND ';
        else
            andQuery = conversationData.query
    }
    var entityDetails = '';
    Object.keys(results.entities).forEach(function (prop) {
        var luisEntity = results.entities[prop];

        if (prop != '$instance') {
            entityDetails = entityDetails + prop + '-' + luisEntity[0] + ',';
        }
    });
    if (entityDetails != '') {
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
    if (entityValues != null && entityValues.length > 0) {

        sb.append(' WHERE ');
        for (var i = 0; i < entityValues.length; ++i) {
            var entityType = entityValues[i].substr(0, entityValues[i].indexOf('-')).trim();
            var dbColumn = mapping[entityType];
            if (currConv)
                andQuery = andQuery + dbColumn + ' = \'' + entityValues[i].substr(entityValues[i].indexOf('-') + 1) + '\'';
            else
                andQuery = dbColumn + ' = \'' + entityValues[i].substr(entityValues[i].indexOf('-') + 1) + '\'';
            if (i < entityValues.length - 1)
                andQuery = andQuery + ' AND ';
            sb.append(andQuery);
        }
    }
    var selectQueryCount = sb.toString();
    //var selectQueryDetails = sb.toString().replace('count(*)', '*');
    conversationData.intent = results.luisResult.topScoringIntent.intent;
    conversationData.query = andQuery;
    return selectQueryCount;
}
}

