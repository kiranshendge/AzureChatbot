const sql = require('mssql');
const config = require('./config');
module.exports = {
    // var connection = new Connection(config);
    getVehicles: async (query) => {
        try {
            await sql.connect(config.sqlConfig);
            // const data = await sql.query(`SELECT v.knr , v.Aggregate, v.seats, v.color FROM [dbo].[vehicles] v where 1=1 ${query}`);
            const data = await sql.query(`${query}`);

            // console.dir(data);
            // console.log(JSON.stringify(data.recordsets, null, 2));
            result = JSON.stringify(data.recordsets, null, 2);
            sql.close();
            return result;
        } catch (err) {
            console.error(err);
            sql.close();
        }
    }
}
