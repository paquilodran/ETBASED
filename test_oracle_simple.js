require('dotenv').config();
const oracledb = require('oracledb');
const fs = require('fs');

console.log('\n=== TEST ORACLE SIMPLIFICADO ===\n');

// Verificar variables
console.log('1. Variables de entorno:');
console.log(`   USER: ${process.env.ORACLE_USER}`);
console.log(`   PASSWORD: ${process.env.ORACLE_PASSWORD ? '***' : 'NO DEFINIDO'}`);
console.log(`   CONNECTION: ${process.env.ORACLE_CONNECTION_STRING}`);
console.log(`   WALLET: ${process.env.ORACLE_WALLET_LOCATION}`);
console.log(`   CLIENT: ${process.env.ORACLE_CLIENT_LIB_DIR}`);

// Verificar wallet
const walletPath = process.env.ORACLE_WALLET_LOCATION;
console.log('\n2. Archivos del wallet:');
if (fs.existsSync(walletPath)) {
    ['cwallet.sso', 'tnsnames.ora', 'sqlnet.ora'].forEach(file => {
        const exists = fs.existsSync(`${walletPath}/${file}`);
        console.log(`   ${exists ? '✓' : '✗'} ${file}`);
    });
} else {
    console.log('   ✗ Carpeta no existe!');
}

// Intentar conexión
console.log('\n3. Probando conexión...\n');

async function test() {
    let connection;
    try {
        // Inicializar Oracle Client
        if (process.platform === 'win32') {
            oracledb.initOracleClient({
                configDir: process.env.ORACLE_WALLET_LOCATION,
                libDir: process.env.ORACLE_CLIENT_LIB_DIR
            });
            console.log('   ✓ Oracle Client inicializado');
        }

        // Conectar
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING,
            walletLocation: process.env.ORACLE_WALLET_LOCATION,
            walletPassword: ""
        });

        console.log('   ✓ Conexión establecida');

        // Query de prueba
        const result = await connection.execute(
            "SELECT 'Conexión exitosa' as mensaje, SYSDATE as fecha FROM DUAL"
        );

        console.log('\n4. Resultado:');
        console.log('   ', result.rows[0]);
        console.log('\n=== ✓ TODO FUNCIONA ===\n');

    } catch (err) {
        console.error('\n✗ ERROR:', err.message);
        
        if (err.message.includes('DPI-1047')) {
            console.log('\n💡 Solución:');
            console.log('   1. Reinicia tu PC');
            console.log('   2. Verifica que el PATH incluya: C:\\oracle\\instantclient');
            console.log('   3. Verifica que oci.dll existe en esa carpeta');
        }
        
        if (err.message.includes('ORA-28759')) {
            console.log('\n💡 Solución:');
            console.log('   1. Ejecuta en PowerShell (como Admin):');
            console.log('      icacls "C:\\oracle\\wallet" /grant Everyone:F /T');
            console.log('   2. Verifica que cwallet.sso no esté corrupto');
            console.log('   3. Re-descarga el wallet si es necesario');
        }
        
        if (err.message.includes('ORA-12541') || err.message.includes('TNS')) {
            console.log('\n💡 Solución:');
            console.log('   1. Verifica que desarrolloadb_tp existe en tnsnames.ora');
            console.log('   2. Verifica tu conexión a internet');
            console.log('   3. Verifica que tu IP esté permitida en Oracle Cloud');
        }
        
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

test();