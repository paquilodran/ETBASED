const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const mongodb = require('../config/mongodb');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const db = mongodb.getDb();
        const usuarios = await db.collection('activity_events').find().toArray();
        res.json(usuarios);
    } catch (err) {
        console.error('Error obteniendo usuarios:', err);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

// Obtener contador de usuarios
router.get('/count', async (req, res) => {
    try {
        const db = mongodb.getDb();
        const total = await db.collection('activity_events').countDocuments();
        res.json({ total });
    } catch (err) {
        console.error('Error contando usuarios:', err);
        res.status(500).json({ error: 'Error contando usuarios' });
    }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = mongodb.getDb();
        await db.collection('activity_events').deleteOne({ _id: new ObjectId(id) });

        // Emitir evento de Socket.io
        req.io.emit('usuarioEliminado', { id });

        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});

module.exports = router;