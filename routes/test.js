const express = require('express');
const router = express.Router();
const oracle = require('../config/oracle');

router.get('/oracle', async (req, res) => {
    try {
        const result = await oracle.executeQuery('SELECT sysdate AS fecha_actual FROM dual');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
