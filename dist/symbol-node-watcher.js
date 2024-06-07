import cron from 'node-cron';
import NodeWatch from './nodeWatch.js';
import { loadConfig } from './config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
const args = process.argv.slice(2);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(dirname(__filename));
const PID_FILE_PATH = join(__dirname, 'process.pid');
if (args[0] === 'start') {
    startTask();
}
else if (args[0] === 'stop') {
    stopTask();
}
else {
    console.error('Unknown command');
}
function startTask() {
    const config = loadConfig(args[1]);
    const cronExpression = config.cronExpression;
    console.log(config);
    const nodeWatch = new NodeWatch(config);
    cron.schedule(cronExpression, () => {
        nodeWatch.start();
    });
    console.log('started to watch node.');
    writeFileSync(PID_FILE_PATH, process.pid.toString());
}
function stopTask() {
    if (existsSync(PID_FILE_PATH)) {
        const pid = parseInt(readFileSync(PID_FILE_PATH, 'utf8').trim());
        process.kill(pid);
        console.log('stopped to watch node.');
    }
    else {
        console.log('not watching.');
    }
}
