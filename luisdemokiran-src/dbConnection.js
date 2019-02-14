const sql = require('mssql');

const config =
{
    user: 'sqladmin', // update me
    password: 'pass@1234', // update me
    server: 'demokiran.database.windows.net',
    database: 'vehicles', // update me
    options:
    {
        database: 'vehicles', //update me
        encrypt: true
    }
}
module.exports = {
    // var connection = new Connection(config);

    getVehicles: async (query) => {
        try {
            await sql.connect(config);
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
