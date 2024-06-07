import * as fs from 'fs'

export interface Config {
  yourNode: string
  nodePath: string
  discordWebhookUrl: string
  cronExpression: string
  symbolServiceUrl: string
  differenceHeight: number
}

export function loadConfig(configFilePath: string | undefined): Config {
  try {
    const configData = fs.readFileSync(configFilePath ? configFilePath : './config.json', 'utf-8')
    const config: Config = JSON.parse(configData)

    if (config.nodePath == '' || config.yourNode == '') throw new Error()
    return JSON.parse(configData)
  } catch (error) {
    throw new Error('Error loading config file')
  }
}
