const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./utils/logger');

const CONFIG_FILE = path.join(__dirname, 'config.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const qsoRouter = require('./routes/qso');
const qrzRouter = require('./routes/qrz');
const configRouter = require('./routes/config');

app.use('/api/qso', qsoRouter);
app.use('/api/qrz-lookup', qrzRouter);
app.use('/api/config', configRouter);

const errorHandler = require('./middleware/errorHandler');

// Serve the main HTML file for any other requests
app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'config.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

app.get('/qso-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'qso-list.html'));
});

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});
