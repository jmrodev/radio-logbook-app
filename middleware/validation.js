function validateLdaSubmission(req, res, next) {
    const { user, pass, micall, sucall, banda, modo, fecha, hora, rst } = req.body;

    if (!user || !pass || !micall || !sucall || !banda || !modo || !fecha || !hora || !rst) {
        return res.status(400).json({ error: 'Missing required LdA parameters.' });
    }
    next();
}

function validateQrzLookup(req, res, next) {
    const { callsign, qrzUsername, qrzPassword } = req.query;

    if (!callsign) {
        return res.status(400).json({ error: 'Missing callsign parameter for QRZ lookup.' });
    }

    if (!qrzUsername || !qrzPassword) {
        return res.status(400).json({ error: 'QRZ username or password not provided.' });
    }
    next();
}

// No specific validation for config loading (GET) as it returns defaults if file not found
// For config saving (POST), we can add more specific validation if needed, but for now,
// we'll assume the client sends the correct structure.

module.exports = {
    validateLdaSubmission,
    validateQrzLookup,
};