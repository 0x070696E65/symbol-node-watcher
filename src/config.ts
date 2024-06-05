import * as fs from 'fs'

interface Config {
  yourNode: string
  nodePath: string
  discordWebhookUrl: string
  repeatSeconds: number
  symbolServiceUrl: string
  differenceHeight: number
}

const configFilePath = '../config.json'

export function loadConfig(): Config {
  try {
    const configData = fs.readFileSync(configFilePath, 'utf-8')
    const config: Config = JSON.parse(configData)
    if (config.nodePath == undefined || config.yourNode == undefined || config.discordWebhookUrl)
      throw new Error('some config is undefind')
    return JSON.parse(configData)
  } catch (error) {
    throw new Error('Error loading config file')
  }
}
