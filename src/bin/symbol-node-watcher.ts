#!/usr/bin/env node

import cron from 'node-cron'
import NodeWatch from '../nodeWatch.js'
import { loadConfig } from '../config.js'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, writeFileSync } from 'fs'

let task: cron.ScheduledTask

const args = process.argv.slice(2)
const config = loadConfig(args[1])
const REPEAT_SECONDS = config.repeatSeconds
const PID_FILE_PATH = './process.pid'

if (args[0] === 'start') {
  if (args.includes('-d') || args.includes('--detached')) {
    startDetached()
  } else {
    startTask()
  }
} else if (args[0] === 'stop') {
  stopTask()
} else {
  console.error('Unknown command')
}

function startTask() {
  const cronExpression = `*/${REPEAT_SECONDS} * * * * *`
  console.log(config)
  const nodeWatch = new NodeWatch(config)
  task = cron.schedule(cronExpression, () => {
    nodeWatch.start()
  })
  task.start()
  console.log('started to watch node.')
  writeFileSync(PID_FILE_PATH, process.pid.toString())
}

function stopTask() {
  if (existsSync(PID_FILE_PATH)) {
    const pid = parseInt(readFileSync(PID_FILE_PATH, 'utf8').trim())
    process.kill(pid) // PIDを使ってプロセスを終了させる
    console.log('stopped to watch node.')
  } else {
    console.log('not watching.')
  }
}

function startDetached() {
  const command = process.argv[0]
  const scriptPath = fileURLToPath(import.meta.url)
  const args = [scriptPath, 'start']

  const subprocess = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  })

  subprocess.unref()
  console.log('started to watch node. in detached mode.')

  process.exit(0)
}
