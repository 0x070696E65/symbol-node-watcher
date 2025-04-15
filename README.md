# 何が出来るのか

設定したノードの稼働を監視します。
もし、他のノードと大きくブロック高が離れていたら`symbol-shoestring`を`docker-compose down`し`up -d`します。また、設定していれば Discord にて通知します。
※bootstrap でも使えます。run と stop コマンドを書き換えてください。

なお、本ライブラリは自身で使うために作成したものです。不具合等一切の責任は取りませんことをあらかじめご了承ください。
MIT ライセンスです、お好きにご利用ください。

# install

```sh
npm install symbol-node-watcher -g
```

# Usage

## `config` の設定

以下雛形に沿って`config.json`を作成してください。もしくはライブラリ内にある`config.json`を編集してください。場所はどこでも良いです（起動時にパスを指定する）

```
{
  "nodeDomain": "test.com",
  "discordWebhookUrl": "https://discord.com/api/webhooks/1247840486480****/xwcTXEKBL-NC9fXoByZZbb-s5A8qxLAhmD5ikToCBwz79aX3WBYWEF3k7xX4M******",
  "cronExpression": "0 0 * * * *",
  "symbolServiceUrl": "https://symbol.services/nodes?filter=suggested&limit=5",
  "differenceHeight": 5,
  "stopCommand": "docker-compose down",
  "runCommand": "docker-compose up -d",
}
```

- `nodeDomain` あなたのノードのドメインです。`http`や`:3000`などは不要
- `nodePath` あなたのノードのパスです。普段`symbol-shoestring` コマンドを実行している箇所
- `discordWebhookUrl` Discord 通知用の WebhookURL を設定してください。空だと何も起こりません。

  `サーバー設定 -> 連携サービス -> ウェブフック` で新たなウェブフックを作成可能です

- `cronExpression` cron の設定 秒/分/時/日/月/曜日
- `symbolServiceUrl` ここから他のノードの情報を取得しています、基本的にはこのままで良い。ここが停止すると使えない。
- `differenceHeight` 他のノード群の最大ブロックと自分のブロックの差がこれ以上になると異常と判断します
- `stopCommand` shoestring の場合はこのままで OK
- `runCommand` shoestring の場合はこのままで OK

## 起動

```sh
symbol-node-watcher start /path/to/config.json
or
symbol-node-watcher start
```

もしライブラリ内の config.json を書き換えた場合はオプションの config.json へのパスは不要です。

## 停止

```sh
symbol-node-watcher stop
```

## さいごに

LINE 通知やメール送信など自由に改変出来ると思います。また、PR も可能な限り対応します。
