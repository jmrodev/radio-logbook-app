const express = require('express');
const QrzService = require('../services/QrzService');
const { validateQrzLookup } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// QRZ.com API endpoint
router.get('/', validateQrzLookup, async (req, res, next) => {
    const { callsign, qrzUsername, qrzPassword } = req.query;

    try {
        const callsignData = await QrzService.lookupCallsign(callsign, qrzUsername, qrzPassword);
        res.json(callsignData);
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
});

module.exports = router;