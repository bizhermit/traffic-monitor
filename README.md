# Traffic Monitor

SNMPを使用した監視ツール  

## 開発

### tsファイル監視

VSCodeのビルドタスクを利用してください。

### 実行（確認）

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 実行

```bash
npm run start
```

## 設定

/src/bin/config.tsのconfigを変更する。

### サンプル

```ts
const config: Config = {
    targets: [{
        name: "NAME",                   // ユニーク名
        host: "localhost",              // ホスト
        community: "private",           // コミュニティー名（デフォルト：public）
        version: "2c",                  // snmpのバージョン（"1" | "2c" | "3"）
        oids: ["1.3.6.1.2.1.1.5.0"],    // oidの配列
        validation: (value, index) => {
            // value：snmpの戻り値
            // index：oidの配列のインデックス
            // falseを返すとエラー関数をコール
            return true;
        },
    }, {
        name: "RAM",
        host: "localhost",
        community: "private",
        version: "2c",
        oids: ["1.3.6.1.2.1.25.2.2.0"],
    }, {
        name: "Storage",
        host: "localhost",
        community: "private",
        version: "2c",
        oids: ["1.3.6.1.2.1.25.2.3.1.5", "1.3.6.1.2.1.25.2.3.1.6"]
    }],
};
```

参考：[http://oidref.com/](http://oidref.com/)