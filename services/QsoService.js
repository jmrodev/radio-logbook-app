const fetch = require('node-fetch').default;
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const LocalDbService = require('./LocalDbService');

const CONFIG_FILE = path.join(__dirname, '../config.json');

class QsoService {
    async submitQso(qsoData, submitToLda, submitToQrz, submitToEqsl, saveToLocal) {
        const results = {};
        const config = require('./ConfigService'); // Dynamically import ConfigService to avoid circular dependency
        const appConfig = await config.loadConfig();

        if (submitToLda) {
            try {
                results.lda = await this.submitLdaQso(qsoData);
            } catch (error) {
                logger.error('Error submitting to LdA:', error);
                results.lda = { success: false, message: error.message };
            }
        }

        if (submitToQrz) {
            results.qrz = await this.submitQrzLogbook(qsoData, appConfig.qrzApiKey, appConfig.qrzHasSubscription);
        }

        if (submitToEqsl) {
            if (appConfig.eqslUsername && appConfig.eqslPassword) {
                results.eqsl = await this.submitToEqsl(qsoData, appConfig.eqslUsername, appConfig.eqslPassword);
            } else {
                logger.info('eQSL.cc submission skipped: Username or Password missing in config.');
                results.eqsl = { success: false, message: 'eQSL.cc submission skipped: Username or Password missing.' };
            }
        }

        if (saveToLocal) {
            try {
                const { pass, ...qsoDataToSave } = qsoData;
                results.localDb = await LocalDbService.saveQso(qsoDataToSave);
            } catch (error) {
                logger.error('Error saving to local DB:', error);
                results.localDb = { success: false, message: error.message };
            }
        }
        return results;
    }

    async submitToEqsl(qsoData, eqslUsername, eqslPassword) {
        const { micall, sucall, banda, modo, fecha, hora, rst, prop, x_qslMSG } = qsoData;

        // eQSL expects YYYYMMDD for date and HHMM for time
        const eqslDate = fecha.split('/').reverse().join(''); // Convert DD/MM/YYYY to YYYYMMDD
        const eqslTime = hora; // HHMM format

        const adif = `
<ADIF_VERS:5>3.0.8
<PROGRAMID:12>Radio API App
<EOH>
<CALL:${sucall.length}>${sucall}
<QSO_DATE:8>${eqslDate}
<TIME_ON:4>${eqslTime}
<BAND:${banda.length}>${banda}
<MODE:${modo.length}>${modo}
<RST_SENT:${rst.length}>${rst}
<STATION_CALLSIGN:${micall.length}>${micall}
${prop ? `<PROP_MODE:${prop.length}>${prop}` : ''}
${x_qslMSG ? `<COMMENT:${x_qslMSG.length}>${x_qslMSG}` : ''}
<EOR>
        `.trim();

        const eqslApiUrl = 'https://www.eqsl.cc/qslcard/PostQSO.cfm';
        const params = new URLSearchParams();
        params.append('EQSL_USER', eqslUsername);
        params.append('EQSL_PSWD', eqslPassword);
        params.append('ADIFData', adif);

        try {
            const response = await fetch(eqslApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });
            const text = await response.text();
            logger.info('eQSL API Response:', text);
            return { success: true, message: text };
        } catch (error) {
            logger.error('Error submitting to eQSL API:', error);
            return { success: false, message: error.message };
        }
    }

    async submitLdaQso(qsoData) {
        const { user, pass, micall, sucall, banda, modo, fecha, hora, rst, prop, x_qslMSG } = qsoData;

        // Basic validation (you might want more robust validation)
        if (!user || !pass || !micall || !sucall || !banda || !modo || !fecha || !hora || !rst) {
            throw new Error('Missing required LdA parameters.');
        }

        const ldaApiUrl = `https://www.lda.ar/php/subeqso.php?user=${user}&pass=${pass}&micall=${micall}&sucall=${sucall}&banda=${banda}&modo=${modo}&fecha=${fecha}&hora=${hora}&rst=${rst}${prop ? `&prop=${prop}` : ''}${x_qslMSG ? `&x_qslMSG=${x_qslMSG}` : ''}`;

        try {
            const response = await fetch(ldaApiUrl);
            const text = await response.text();
            return { success: true, message: text };
        } catch (error) {
            logger.error('Error submitting to LdA API:', error);
            throw new Error('Failed to submit QSO to LdA API.');
        }
    }

    async submitQrzLogbook(qsoData, qrzApiKey, qrzHasSubscription) {
        const { user, micall, banda, modo, fecha, hora, rst, x_qslMSG } = qsoData;

        if (qrzHasSubscription && qrzApiKey) {
            logger.info('Attempting to submit QSO to QRZ.com Logbook...');
            const adif = `
<ADIF_VERS:5>3.0.8
<PROGRAMID:12>Radio API App
<EOH>
<CALL:${micall.length}>${micall}
<QSO_DATE:8>${fecha.split('/').reverse().join('')}
<TIME_ON:4>${hora}
<BAND:${banda.length}>${banda}
<MODE:${modo.length}>${modo}
<RST_SENT:${rst.length}>${rst}
<STATION_CALLSIGN:${micall.length}>${micall}
<OPERATOR:${user.length}>${user}
<MY_RIG:7>Unknown
<COMMENT:${x_qslMSG ? x_qslMSG.length : 0}>${x_qslMSG || ''}
<EOR>
            `.trim();

            const qrzLogbookApiUrl = 'https://logbook.qrz.com/api';
            const qrzLogbookResponse = await fetch(qrzLogbookApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Agent': 'Radio API App/1.0' // Recommended User-Agent
                },
                body: `KEY=${qrzApiKey}&ACTION=INSERT&ADIF=${encodeURIComponent(adif)}`
            });

            const qrzLogbookText = await qrzLogbookResponse.text();
            logger.info('QRZ.com Logbook API Response:', qrzLogbookText);
            return { success: true, message: qrzLogbookText };
        } else {
            logger.info('QRZ.com Logbook submission skipped: Subscription not enabled or API Key missing.');
            return { success: false, message: 'QRZ.com Logbook submission skipped.' };
        }
    }
}

module.exports = new QsoService();