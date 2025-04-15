import * as fs from 'fs'

export interface Config {
  nodeDomain: string
  nodePath: string
  discordWebhookUrl: string
  cronExpression: string
  symbolServiceUrl: string
  differenceHeight: number
  stopCommand: string
  runCommand: string
  timeoutMilliseconds: number
}

export function loadConfig(configFilePath: string | undefined): Config {
  try {
    const configData = fs.readFileSync(configFilePath ? configFilePath : './config.json', 'utf-8')
    const config: Config = JSON.parse(configData)

    if (config.nodePath == '' || config.nodePath == undefined) throw new Error('can not find node path')
    return JSON.parse(configData)
  } catch (error) {
    throw new Error('Error loading config file')
  }
}
