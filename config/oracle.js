const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
let pool = null;

async function initialize() {
    const walletLocation = process.env.ORACLE_WALLET_LOCATION;
    if (!walletLocation) throw new Error('ORACLE_WALLET_LOCATION no definido');

    process.env.TNS_ADMIN = walletLocation;

    try {
        oracledb.initOracleClient({ configDir: walletLocation });
    } catch (err) {
        // ignorar si ya inicializado
    }

    pool = await oracledb.createPool({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECTION_STRING, // usa alias del tnsnames.ora
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1
    });

    console.log('✓ Conectado a Oracle Database (Cloud con Wallet)');
}

async function executeQuery(query, binds = {}, options = {}) {
    if (!pool) throw new Error('Pool de Oracle no inicializado.');
    let connection;
    try {
        connection = await pool.getConnection();
        return await connection.execute(query, binds, { autoCommit: true, ...options });
    } finally {
        if (connection) await connection.close();
    }
}

async function close() {
    if (pool) await pool.close(0);
}

module.exports = { initialize, executeQuery, close };
