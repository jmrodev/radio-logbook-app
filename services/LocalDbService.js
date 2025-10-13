const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const LOCAL_DB_FILE = path.join(__dirname, '../local_qso_db.json');

class LocalDbService {
    constructor() {
        this.initPromise = this.initializeDb();
    }

    async initializeDb() {
        try {
            await fs.access(LOCAL_DB_FILE);
            logger.info('Local QSO DB file exists.');
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.info('Local QSO DB file not found, creating an empty one.');
                await fs.writeFile(LOCAL_DB_FILE, JSON.stringify([], null, 2), 'utf8');
            } else {
                logger.error('Error accessing local QSO DB file:', error);
            }
        }
    }

    async saveQso(qsoData) {
        await this.initPromise;
        try {
            const data = await fs.readFile(LOCAL_DB_FILE, 'utf8');
            const qsoList = JSON.parse(data);
            qsoList.push({ timestamp: new Date().toISOString(), ...qsoData });
            await fs.writeFile(LOCAL_DB_FILE, JSON.stringify(qsoList, null, 2), 'utf8');
            logger.info('QSO saved to local DB.');
            return { success: true, message: 'QSO saved to local DB.' };
        } catch (error) {
            logger.error('Error saving QSO to local DB:', error);
            throw new Error('Failed to save QSO to local DB.');
        }
    }

    async getAllQSOs() {
        await this.initPromise;
        try {
            const data = await fs.readFile(LOCAL_DB_FILE, 'utf8');
            if (data.trim() === '') {
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            logger.error('Error reading local QSO DB file:', error);
            throw new Error('Failed to read local QSO DB.');
        }
    }
}

module.exports = new LocalDbService();