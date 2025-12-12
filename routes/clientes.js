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

// Eliminar cliente (con eliminación en cascada)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Eliminar en orden inverso de dependencias
        // 1. Eliminar alertas y recomendaciones
        await oracle.executeQuery(
            'DELETE FROM alerts_recommendations WHERE customer_id = :id', 
            { id }
        );
        
        // 2. Eliminar interacciones con productos
        await oracle.executeQuery(
            'DELETE FROM product_interactions WHERE customer_id = :id', 
            { id }
        );
        
        // 3. Eliminar interacciones de soporte
        await oracle.executeQuery(
            'DELETE FROM support_interactions WHERE customer_id = :id', 
            { id }
        );
        
        // 4. Eliminar documentos comerciales
        await oracle.executeQuery(
            'DELETE FROM commercial_documents WHERE customer_id = :id', 
            { id }
        );
        
        // 5. Eliminar actividades del cliente
        await oracle.executeQuery(
            'DELETE FROM customer_activity_log WHERE customer_id = :id', 
            { id }
        );
        
        // 6. Eliminar planes del cliente
        await oracle.executeQuery(
            'DELETE FROM customer_plans WHERE customer_id = :id', 
            { id }
        );
        
        // 7. Finalmente eliminar el cliente
        await oracle.executeQuery(
            'DELETE FROM customers WHERE customer_id = :id', 
            { id }
        );

        // Emitir evento de Socket.io
        req.io.emit('clienteEliminado', { id });

        res.json({ 
            success: true, 
            message: 'Cliente y todos sus registros relacionados eliminados correctamente' 
        });
    } catch (err) {
        console.error('Error eliminando cliente:', err);
        res.status(500).json({ 
            error: 'Error eliminando cliente', 
            message: err.message 
        });
    }
    
});

// En routes/clientes.js - ejemplo de uso del package
router.get('/reporte-mensual', async (req, res) => {
    try {
        await oracle.executeQuery(`
            BEGIN
                pkg_gestion_comercial.sp_generar_reporte_mensual;
            END;
        `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Usar funciones
router.get('/total-ventas', async (req, res) => {
    const result = await oracle.executeQuery(`
        SELECT fn_total_ventas_mes_actual() as total FROM dual
    `);
    res.json({ total: result.rows[0].TOTAL });
});

module.exports = router;