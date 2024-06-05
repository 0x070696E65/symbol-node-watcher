import fetch from 'node-fetch'
import { exec } from 'child_process'
import { loadConfig } from './config.js'
const config = loadConfig()

const ERROR_MESSAGES = {
  SYMBOL_SERVICE_UNABILABLE: 'symbol.servicesが正常に稼働していません',
  YOUR_NODE_IS_UNABILABLE: 'あなたのノードが正常に稼働していません',
  NODE_HEIGHT: 'ブロック高が異常です',
  NODE_FINALIZED_HEIGHT: 'ファイナライズ高が異常です',
}

const NODE_STOP = 'symbol-bootstrap stop'
const NODE_RUN = 'symbol-bootstrap run -d'

type NodeInfo = {
  name: string
  height: number
  finalizedHeight: number
}

let nodesInfo: NodeInfo[] = []

const sendDiscordMessage = async (content: string) => {
  await fetch(config.discordWebhookUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'symbol node wather BOT',
      content,
      allowed_mentions: {},
    }),
  })
}

const nodeReboot = () => {
  exec(`cd ${config.nodePath} && ${NODE_STOP} && ${NODE_RUN}`, (error, stdout, stderr) => {
    if (error) {
      sendDiscordMessage(`ノード再起動エラー: ${error}`)
      return
    }
    sendDiscordMessage('正常に再起動が完了しました。確認してください。')
  })
}
export const nodeWatch = async () => {
  const symbolServiceResponce = await fetch(config.symbolServiceUrl)
  if (!symbolServiceResponce.ok) sendDiscordMessage(ERROR_MESSAGES.SYMBOL_SERVICE_UNABILABLE)
  const nodeList = await symbolServiceResponce.json()
  if (Array.isArray(nodeList)) {
    nodeList.forEach(async (item) => {
      const chainInfo = (await (await fetch(`http://${item.host}:3000/chain/info`)).json()) as any
      const node: NodeInfo = {
        name: item.host,
        height: Number(chainInfo.height),
        finalizedHeight: Number(chainInfo.latestFinalizedBlock.height),
      }
      nodesInfo.push(node)
    })
  }
  let maxNode: NodeInfo = nodesInfo[0]
  if (nodesInfo.length > 0) {
    for (let i = 1; i < nodesInfo.length; i++) {
      if (nodesInfo[i].height > maxNode.height) {
        maxNode = nodesInfo[i]
      }
    }
  }

  const yourNodeChainInfoResponce = await fetch(`http://${config.yourNode}:3000/chain/info`)
  if (!yourNodeChainInfoResponce.ok) {
    sendDiscordMessage(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
    nodeReboot()
  }

  const yourNodeChainInfo = (await yourNodeChainInfoResponce.json()) as any
  const yourNodeHeight = Number(yourNodeChainInfo.height)
  const yourNodeFinalizedHeight = Number(yourNodeChainInfo.latestFinalizedBlock.height)

  if (maxNode.height - config.differenceHeight > yourNodeHeight) {
    const errorMessage = `${ERROR_MESSAGES.NODE_HEIGHT}\nあなたのブロック高: ${yourNodeHeight}\n正常ノードのブロック高${maxNode.height}`
    sendDiscordMessage(errorMessage)
    nodeReboot()
    return
  }

  if (maxNode.finalizedHeight - config.differenceHeight > yourNodeFinalizedHeight) {
    const errorMessage = `${ERROR_MESSAGES.NODE_FINALIZED_HEIGHT}\nあなたのファイナライズブロック高: ${yourNodeFinalizedHeight}\n正常ノードのファイナライズブロック高${maxNode.finalizedHeight}`
    sendDiscordMessage(errorMessage)
    nodeReboot()
    return
  }
}
