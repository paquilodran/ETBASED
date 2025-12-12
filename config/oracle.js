const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
let pool = null;
let clientInitialized = false;

async function initialize() {
    try {
        let walletLocation = process.env.ORACLE_WALLET_LOCATION;
        
        if (!walletLocation) {
            throw new Error('ORACLE_WALLET_LOCATION no está definido en .env');
        }

        walletLocation = walletLocation.replace(/['"]/g, '').replace(/\\/g, '/');
        
        const fs = require('fs');
        if (!fs.existsSync(walletLocation)) {
            throw new Error(`El directorio del wallet no existe: ${walletLocation}`);
        }

        const requiredFiles = ['cwallet.sso', 'tnsnames.ora'];
        for (const file of requiredFiles) {
            const filePath = `${walletLocation}/${file}`;
            if (!fs.existsSync(filePath)) {
                throw new Error(`Archivo requerido no encontrado: ${filePath}`);
            }
        }

        console.log(`✓ Wallet encontrado en: ${walletLocation}`);

        // ====== AGREGAR ESTAS LÍNEAS ======
        // Configurar TNS_ADMIN para esta sesión
        process.env.TNS_ADMIN = walletLocation.replace(/\//g, '\\');
        console.log(`✓ TNS_ADMIN configurado: ${process.env.TNS_ADMIN}`);
        // ==================================

        if (!clientInitialized) {
            try {
                oracledb.initOracleClient({ 
                    configDir: walletLocation,
                    libDir: process.env.ORACLE_CLIENT_LIB_DIR
                });
                clientInitialized = true;
                console.log('✓ Oracle Client inicializado');
            } catch (err) {
                if (!err.message.includes('already been initialized')) {
                    throw err;
                }
                clientInitialized = true;
            }
        }

        // Crear pool con configuración adicional
        pool = await oracledb.createPool({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING,
            // ====== COMENTAR ESTAS DOS LÍNEAS ======
            // walletLocation: walletLocation,
            // walletPassword: process.env.ORACLE_WALLET_PASSWORD || "",
            // =======================================
            poolMin: 1,
            poolMax: 5,
            poolIncrement: 1,
            poolTimeout: 60,
            enableStatistics: true
        });

        const connection = await pool.getConnection();
        const result = await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
        
        console.log('✓ Conectado a Oracle Database (Cloud con Wallet)');
        console.log(`✓ Pool creado - Min: 1, Max: 5`);
        
        return true;
    } catch (err) {
        console.error('✗ Error conectando a Oracle:', err.message);
        console.error('Detalles:', {
            user: process.env.ORACLE_USER,
            connectString: process.env.ORACLE_CONNECTION_STRING,
            walletLocation: process.env.ORACLE_WALLET_LOCATION
        });
        throw err;
    }
}

async function executeQuery(query, binds = {}, options = {}) {
    if (!pool) {
        throw new Error('Pool de Oracle no inicializado. Llama a initialize() primero.');
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        const result = await connection.execute(query, binds, { 
            autoCommit: true, 
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            ...options 
        });
        return result;
    } catch (err) {
        console.error('Error ejecutando query Oracle:', err.message);
        console.error('Query:', query);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error cerrando conexión:', err);
            }
        }
    }
}

async function close() {
    if (pool) {
        try {
            await pool.close(10);
            console.log('✓ Pool de Oracle cerrado');
        } catch (err) {
            console.error('Error cerrando pool:', err);
        }
    }
}

// Función para verificar el estado del pool
async function getPoolStats() {
    if (pool) {
        return {
            connectionsOpen: pool.connectionsOpen,
            connectionsInUse: pool.connectionsInUse,
            poolMin: pool.poolMin,
            poolMax: pool.poolMax
        };
    }
    return null;
}

module.exports = { 
    initialize, 
    executeQuery, 
    close,
    getPoolStats 
};