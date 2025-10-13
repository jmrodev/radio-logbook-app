const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

const CONFIG_FILE = path.join(__dirname, '../config.json');

class ConfigService {
    async loadConfig() {
        try {
            const configData = await fs.readFile(CONFIG_FILE, 'utf8');
            const config = JSON.parse(configData);
            logger.info('Configuration loaded from file:', config);
            return config;
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.info('config.json not found, returning default empty config.');
                return { qrzApiKey: '', qrzHasSubscription: false, myCallsign: '', ldaUser: '', ldaPass: '', qrzUsername: '', qrzPassword: '', timezone: 'UTC', lastBanda: '', lastModo: '', lastRst: '599', lastProp: '', lastX_qslMSG: '', eqslUsername: '', eqslPassword: '' };
            }
            logger.error('Error loading configuration:', error);
            throw new Error('Failed to load configuration.');
        }
    }

    async saveConfig(config) {
        try {
            logger.info('Saving configuration to file:', config);
            await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
            return { message: 'Configuration saved successfully.' };
        } catch (error) {
            logger.error('Error saving configuration:', error);
            throw new Error('Failed to save configuration.');
        }
    }
}

module.exports = new ConfigService();