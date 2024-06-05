import * as fs from 'fs';
export function loadConfig(configFilePath) {
    try {
        const configData = fs.readFileSync(configFilePath ? configFilePath : './config.json', 'utf-8');
        const config = JSON.parse(configData);
        if (config.nodePath == '' || config.yourNode == '')
            throw new Error();
        return JSON.parse(configData);
    }
    catch (error) {
        throw new Error('Error loading config file');
    }
}
