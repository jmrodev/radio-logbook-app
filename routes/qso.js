const express = require('express');
const QsoService = require('../services/QsoService');
const { validateLdaSubmission } = require('../middleware/validation');
const logger = require('../utils/logger');
const LocalDbService = require('../services/LocalDbService');

const router = express.Router();

// QSO Submission API endpoint
router.post('/', validateLdaSubmission, async (req, res, next) => {
    logger.info('QSO Submission Request Body:', req.body);
    const { submitToLda, submitToQrz, submitToEqsl, saveToLocal, ...qsoData } = req.body;

    try {
        const results = await QsoService.submitQso(qsoData, submitToLda, submitToQrz, submitToEqsl, saveToLocal);
        res.json({ message: 'QSO submission process completed.', results });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
});

router.get('/list', async (req, res, next) => {
    try {
        const qsos = await LocalDbService.getAllQSOs();
        res.json(qsos);
    } catch (error) {
        next(error);
    }
});

module.exports = router;