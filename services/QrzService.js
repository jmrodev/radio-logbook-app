const fetch = require('node-fetch').default;
const xml2js = require('xml2js');
const logger = require('../utils/logger');

class QrzService {
    async lookupCallsign(callsign, qrzUsername, qrzPassword) {
        if (!callsign) {
            throw new Error('Missing callsign parameter for QRZ lookup.');
        }

        if (!qrzUsername || !qrzPassword) {
            throw new Error('QRZ username or password not provided.');
        }

        // Step 1: Get session key
        const qrzAuthUrl = `https://xmldata.qrz.com/xml/current/?username=${qrzUsername}&password=${qrzPassword}`;
        let sessionKey = '';
        try {
            const authResponse = await fetch(qrzAuthUrl);
            const authText = await authResponse.text();
            logger.info('QRZ Auth Raw Response:', authText);

            if (!authText.trim()) {
                throw new Error('Empty response from QRZ authentication API. Check credentials or network connection.');
            }

            const authResult = await xml2js.parseStringPromise(authText);
            logger.info('QRZ Auth Parsed Result:', JSON.stringify(authResult));

            if (!authResult || !authResult.QRZDatabase || !authResult.QRZDatabase.Session || !authResult.QRZDatabase.Session[0] || !authResult.QRZDatabase.Session[0].Key || !authResult.QRZDatabase.Session[0].Key[0]) {
                throw new Error('Invalid QRZ authentication response: Missing session key or malformed XML.');
            }
            sessionKey = authResult.QRZDatabase.Session[0].Key[0];
        } catch (error) {
            logger.error('Error getting QRZ session key:', error);
            throw new Error(`Failed to get QRZ session key: ${error.message}`);
        }

        if (!sessionKey) {
            throw new Error('QRZ session key not obtained.');
        }

        // Step 2: Perform callsign lookup
        const qrzLookupUrl = `https://xmldata.qrz.com/xml/current/?s=${sessionKey}&callsign=${callsign}`;
        try {
            const lookupResponse = await fetch(qrzLookupUrl);
            const lookupText = await lookupResponse.text();
            logger.info('QRZ Lookup Raw Response:', lookupText);

            if (!lookupText.trim()) {
                throw new Error('Empty response from QRZ lookup API. Check callsign or network connection.');
            }

            const lookupResult = await xml2js.parseStringPromise(lookupText);
            logger.info('QRZ Lookup Parsed Result:', JSON.stringify(lookupResult));

            if (!lookupResult || !lookupResult.QRZDatabase || !lookupResult.QRZDatabase.Callsign || !lookupResult.QRZDatabase.Callsign[0]) {
                // Check for error message in QRZ response
                if (lookupResult && lookupResult.QRZDatabase && lookupResult.QRZDatabase.Session && lookupResult.QRZDatabase.Session[0] && lookupResult.QRZDatabase.Session[0].Error && lookupResult.QRZDatabase.Session[0].Error[0]) {
                    throw new Error(`QRZ API Error: ${lookupResult.QRZDatabase.Session[0].Error[0]}`);
                }
                throw new Error('Invalid QRZ lookup response: Missing callsign data or malformed XML.');
            }
            return lookupResult.QRZDatabase.Callsign[0];
        } catch (error) {
            logger.error('Error looking up callsign on QRZ:', error);
            throw new Error(`Failed to lookup callsign on QRZ.com: ${error.message}`);
        }
    }
}

module.exports = new QrzService();