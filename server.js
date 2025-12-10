require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const oracle = require('./config/oracle');
const mongodb = require('./config/mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

// Estado de las conexiones
let oracleConnected = false;
let mongoConnected = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hacer io accesible en las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Endpoint de estado de conexiones
app.get('/api/status', (req, res) => {
    res.json({
        oracle: oracleConnected,
        mongodb: mongoConnected,
        timestamp: new Date().toISOString()
    });
});

// Rutas
const clientesRoutes = require('./routes/clientes');
const usuariosRoutes = require('./routes/usuarios');
const testRoutes = require('./routes/test');

app.use('/api/clientes', clientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/test', testRoutes);

// Socket.io
io.on('connection', (socket) => {
    console.log('✓ Cliente conectado:', socket.id);
    
    // Enviar estado de conexiones al cliente
    socket.emit('connectionStatus', {
        oracle: oracleConnected,
        mongodb: mongoConnected
    });

    socket.on('disconnect', () => {
        console.log('✗ Cliente desconectado:', socket.id);
    });
});

// Inicializar conexiones y servidor
async function iniciar() {
    console.log('\n=== Iniciando servidor ===\n');
    
    // Verificar variables de entorno
    console.log('Variables de entorno:');
    console.log('- ORACLE_USER:', process.env.ORACLE_USER ? '✓' : '✗');
    console.log('- ORACLE_PASSWORD:', process.env.ORACLE_PASSWORD ? '✓' : '✗');
    console.log('- ORACLE_CONNECTION_STRING:', process.env.ORACLE_CONNECTION_STRING || '✗');
    console.log('- ORACLE_WALLET_LOCATION:', process.env.ORACLE_WALLET_LOCATION || '✗');
    console.log('- MONGO_URI:', process.env.MONGO_URI ? '✓' : '✗');
    console.log('');

    // Intentar conectar a Oracle
    try {
        console.log('Conectando a Oracle...');
        await oracle.initialize();
        oracleConnected = true;
        console.log('');
    } catch (err) {
        console.error('⚠ Oracle no disponible:', err.message);
        console.log('⚠ El servidor continuará sin Oracle\n');
        oracleConnected = false;
    }

    // Conectar a MongoDB
    try {
        console.log('Conectando a MongoDB...');
        await mongodb.connect();
        mongoConnected = true;
        console.log('');
    } catch (err) {
        console.error('✗ Error conectando a MongoDB:', err.message);
        mongoConnected = false;
    }

    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log('=== Estado del servidor ===');
        console.log(`🚀 Servidor: http://localhost:${PORT}`);
        console.log(`📊 Oracle: ${oracleConnected ? '✓ Conectado' : '✗ Desconectado'}`);
        console.log(`📊 MongoDB: ${mongoConnected ? '✓ Conectado' : '✗ Desconectado'}`);
        console.log('===========================\n');
    });
}

// Cerrar conexiones al terminar
process.on('SIGINT', async () => {
    console.log('\n\nCerrando conexiones...');
    
    if (oracleConnected) {
        await oracle.close();
    }
    
    if (mongoConnected) {
        await mongodb.close();
    }
    
    console.log('✓ Servidor cerrado correctamente\n');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
});

iniciar();