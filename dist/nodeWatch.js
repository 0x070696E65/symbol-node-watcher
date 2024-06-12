import fetch from 'node-fetch';
import { exec } from 'child_process';
const ERROR_MESSAGES = {
    SYMBOL_SERVICE_UNABILABLE: 'symbol.servicesが正常に稼働していません',
    YOUR_NODE_IS_UNABILABLE: 'あなたのノードが正常に稼働していません',
    NODE_HEIGHT: 'ブロック高が異常です',
    NODE_FINALIZED_HEIGHT: 'ファイナライズ高が異常です',
};
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
        const command = `cd ${this.config.nodePath} && ${this.config.stopCommand} && ${this.config.runCommand}`;
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
    fetchJSON = async (url) => {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`Failed to fetch ${url}`);
        return response.json();
    };
    start = async () => {
        try {
            let nodeList;
            try {
                const symbolServiceResponse = await this.fetchJSON(this.config.symbolServiceUrl);
                nodeList = symbolServiceResponse;
            }
            catch (e) {
                this.sendDiscordMessage(`${ERROR_MESSAGES.SYMBOL_SERVICE_UNABILABLE}: ${e.message}`);
                console.error(e.message);
            }
            if (Array.isArray(nodeList)) {
                for (const node of nodeList) {
                    try {
                        const chainInfo = (await this.fetchJSON(`http://${node.host}:3000/chain/info`));
                        nodesInfo.push({
                            name: node.host,
                            height: Number(chainInfo.height),
                            finalizedHeight: Number(chainInfo.latestFinalizedBlock.height),
                        });
                    }
                    catch (e) {
                        console.error(`Error fetching chain info for node ${node.host}: ${e.message}`);
                    }
                }
            }
            const maxNode = nodesInfo.reduce((max, node) => (node.height > max.height ? node : max), nodesInfo[0]);
            let yourNodeChainInfoResponce;
            try {
                yourNodeChainInfoResponce = await fetch(`http://localhost:3000/chain/info`);
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
        }
        catch (e) {
            this.sendDiscordMessage(e.message);
            console.error(e.message);
        }
    };
}
