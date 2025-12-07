const express = require('express');
const router = express.Router();
const oracle = require('../config/oracle');

// Obtener todos los clientes (customers)
router.get('/', async (req, res) => {
    try {
        const result = await oracle.executeQuery(`
            SELECT 
                customer_id as ID,
                first_name || ' ' || last_name as NOMBRE,
                email as EMAIL,
                phone as TELEFONO,
                status as ESTADO,
                segment as SEGMENTO,
                city as CIUDAD
            FROM customers
            ORDER BY registration_date DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('Error obteniendo clientes:', err);
        res.status(500).json({ error: 'Error obteniendo clientes', message: err.message });
    }
});

// Obtener contador de clientes
router.get('/count', async (req, res) => {
    try {
        const result = await oracle.executeQuery('SELECT COUNT(*) as TOTAL FROM customers');
        res.json({ total: result.rows[0]?.TOTAL || 0 });
    } catch (err) {
        console.error('Error contando clientes:', err);
        res.status(500).json({ error: 'Error contando clientes', message: err.message });
    }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await oracle.executeQuery('DELETE FROM customers WHERE customer_id = :id', { id });

        // Emitir evento de Socket.io
        req.io.emit('clienteEliminado', { id });

        res.json({ success: true, message: 'Cliente eliminado' });
    } catch (err) {
        console.error('Error eliminando cliente:', err);
        res.status(500).json({ error: 'Error eliminando cliente', message: err.message });
    }
});

module.exports = router;