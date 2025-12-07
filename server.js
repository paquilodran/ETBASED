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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hacer io accesible en las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rutas
const clientesRoutes = require('./routes/clientes');
const usuariosRoutes = require('./routes/usuarios');

// Ruta de prueba Oracle
const testRoutes = require('./routes/test');

app.use('/api/clientes', clientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/test', testRoutes);

// Socket.io
io.on('connection', (socket) => {
    console.log('✓ Cliente conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('✗ Cliente desconectado:', socket.id);
    });
});

// Inicializar conexiones y servidor
async function iniciar() {
    try {
        // Conectar a Oracle
        try {
            await oracle.initialize();
        } catch (err) {
            console.log('⚠ Oracle no disponible (continuando sin Oracle)');
        }

        // Conectar a MongoDB
        await mongodb.connect();

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}\n`);
        });
    } catch (err) {
        console.error('Error iniciando servidor:', err);
        process.exit(1);
    }
}

// Cerrar conexiones al terminar
process.on('SIGINT', async () => {
    console.log('\nCerrando conexiones...');
    await oracle.close();
    await mongodb.close();
    process.exit(0);
});

iniciar();
