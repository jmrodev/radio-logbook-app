const express = require('express');
const ConfigService = require('../services/ConfigService');
const logger = require('../utils/logger');

const router = express.Router();

// API endpoint to load configuration
router.get('/', async (req, res, next) => {
    try {
        const config = await ConfigService.loadConfig();
        logger.info('Sending configuration to frontend:', config);
        res.json(config);
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
});

// API endpoint to save configuration
router.post('/', async (req, res, next) => {
    const configData = req.body;
    try {
        const result = await ConfigService.saveConfig(configData);
        logger.info('Configuration saved successfully:', result);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;