import * as fs from 'fs';
const configFilePath = '../config.json';
export function loadConfig() {
    try {
        const configData = fs.readFileSync(configFilePath, 'utf-8');
        const config = JSON.parse(configData);
        if (config.nodePath == undefined || config.yourNode == undefined || config.discordWebhookUrl)
            throw new Error('some config is undefind');
        return JSON.parse(configData);
    }
    catch (error) {
        throw new Error('Error loading config file');
    }
}
