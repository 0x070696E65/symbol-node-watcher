import fetch from 'node-fetch';
import { exec } from 'child_process';
const ERROR_MESSAGES = {
    SYMBOL_SERVICE_UNABILABLE: 'symbol.servicesが正常に稼働していません',
    YOUR_NODE_IS_UNABILABLE: 'あなたのノードが正常に稼働していません',
    NODE_HEIGHT: 'ブロック高が異常です',
    NODE_FINALIZED_HEIGHT: 'ファイナライズ高が異常です',
};
const NODE_STOP = 'symbol-bootstrap stop';
const NODE_RUN = 'symbol-bootstrap run -d';
let nodesInfo = [];
export default class NodeWatch {
    config;
    constructor(config) {
        this.config = config;
    }
    sendDiscordMessage = async (content) => {
        if (!this.config.discordWebhookUrl)
            return;
        await fetch(this.config.discordWebhookUrl, {
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
        });
    };
    nodeReboot = () => {
        const timeoutMilliseconds = 120000;
        const command = `cd ${this.config.nodePath} && ${NODE_STOP} && ${NODE_RUN}`;
        const childProcess = exec(command, (error, stdout, stderr) => {
            if (error) {
                this.sendDiscordMessage(`ノード再起動エラー: ${error}`);
                return;
            }
            this.sendDiscordMessage('正常に再起動が完了しました。確認してください。');
        });
        const timeout = setTimeout(() => {
            childProcess.kill();
            this.sendDiscordMessage('ノード再起動がタイムアウトしました。');
        }, timeoutMilliseconds);
        childProcess.on('exit', () => {
            clearTimeout(timeout);
        });
    };
    start = async () => {
        const symbolServiceResponce = await fetch(this.config.symbolServiceUrl);
        if (!symbolServiceResponce.ok)
            this.sendDiscordMessage(ERROR_MESSAGES.SYMBOL_SERVICE_UNABILABLE);
        const nodeList = await symbolServiceResponce.json();
        if (Array.isArray(nodeList)) {
            for (let i = 0; i < nodeList.length; i++) {
                const chainInfo = (await (await fetch(`http://${nodeList[i].host}:3000/chain/info`)).json());
                const node = {
                    name: nodeList[i].host,
                    height: Number(chainInfo.height),
                    finalizedHeight: Number(chainInfo.latestFinalizedBlock.height),
                };
                nodesInfo.push(node);
            }
        }
        let maxNode = nodesInfo[0];
        if (nodesInfo.length > 0) {
            for (let i = 1; i < nodesInfo.length; i++) {
                if (nodesInfo[i].height > maxNode.height) {
                    maxNode = nodesInfo[i];
                }
            }
        }
        let yourNodeChainInfoResponce;
        try {
            yourNodeChainInfoResponce = await fetch(`http://${this.config.yourNode}:3000/chain/info`);
        }
        catch {
            this.sendDiscordMessage(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE);
            this.nodeReboot();
            return;
        }
        if (yourNodeChainInfoResponce == undefined || !yourNodeChainInfoResponce.ok) {
            this.sendDiscordMessage(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE);
            this.nodeReboot();
            return;
        }
        const yourNodeChainInfo = (await yourNodeChainInfoResponce.json());
        const yourNodeHeight = Number(yourNodeChainInfo.height);
        const yourNodeFinalizedHeight = Number(yourNodeChainInfo.latestFinalizedBlock.height);
        if (maxNode.height - this.config.differenceHeight > yourNodeHeight) {
            const errorMessage = `${ERROR_MESSAGES.NODE_HEIGHT}\nあなたのブロック高: ${yourNodeHeight}\n正常ノードのブロック高${maxNode.height}`;
            this.sendDiscordMessage(errorMessage);
            this.nodeReboot();
            return;
        }
        if (maxNode.finalizedHeight - this.config.differenceHeight > yourNodeFinalizedHeight) {
            const errorMessage = `${ERROR_MESSAGES.NODE_FINALIZED_HEIGHT}\nあなたのファイナライズブロック高: ${yourNodeFinalizedHeight}\n正常ノードのファイナライズブロック高${maxNode.finalizedHeight}`;
            this.sendDiscordMessage(errorMessage);
            this.nodeReboot();
            return;
        }
    };
}
