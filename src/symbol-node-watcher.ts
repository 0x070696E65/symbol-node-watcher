import cron from 'node-cron'
import NodeWatch from './nodeWatch.js'
import { loadConfig } from './config.js'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
const args = process.argv.slice(2)

const workingDir = process.cwd()
const PID_FILE_PATH = join(workingDir, '/process.pid')

function getFormattedTime(): string {
  const now = new Date();
  return now.toISOString();
}

if (args[0] === 'start') {
  startTask()
} else if (args[0] === 'stop') {
  stopTask()
} else {
  console.error(`${getFormattedTime()} - Unknown command`)
}
function startTask() {
  const config = loadConfig(args[1])
  const cronExpression = config.cronExpression
  console.log(`${getFormattedTime()} - Config loaded:`, config);
  const nodeWatch = new NodeWatch(config)
  cron.schedule(cronExpression, () => {
    nodeWatch.start()
  })
  console.log(`${getFormattedTime()} - Started to watch node.`);
  writeFileSync(PID_FILE_PATH, process.pid.toString())
}
function stopTask() {
  if (existsSync(PID_FILE_PATH)) {
    const pid = parseInt(readFileSync(PID_FILE_PATH, 'utf8').trim())
    process.kill(pid)
    console.log(`${getFormattedTime()} - Stopped to watch node.`);
  } else {
    console.log(`${getFormattedTime()} - Not watching.`);
  }
}
