require('dotenv').config();
const oracledb = require('oracledb');

async function testOracle() {
    try {
        const connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING,
            walletLocation: process.env.ORACLE_WALLET_LOCATION
        });

        console.log('Conexión exitosa a Oracle');
        await connection.close();
    } catch (err) {
        console.error('Error conectando a Oracle:', err);
    }
}

testOracle();
