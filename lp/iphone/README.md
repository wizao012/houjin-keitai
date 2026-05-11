# 法人携帯の窓口 LP

## ファイル構成

```
houjin-keitai-lp/
├── index.html       ← メインLP
├── thanks.html      ← 送信完了ページ
├── css/
│   └── style.css    ← 全スタイル
├── js/
│   └── main.js      ← フォーム送信・モーダル等
├── images/          ← 画像14枚（下記参照）
└── README.md
```

## セットアップ手順

### 1. 画像を `images/` フォルダに配置する

`images` フォルダを作成し、以下の名前にリネームした画像を入れてください。

| 元のファイル名 | リネーム後 |
|---|---|
| 法人携帯lp-meta-logo.png | logo.png |
| 法人携帯lp-meta-iphone.png | iphone.png |
| 法人携帯lp-meta-back.png | fv-bg.png |
| 法人携帯lp-meta-icon-1.png | icon-01-truck.png |
| 法人携帯lp-meta-icon8.png | icon-02-0yen.png |
| 法人携帯lp-meta-icon-2.png | icon-03-business.png |
| 法人携帯lp-meta-icon-3.png | icon-04-number.png |
| 法人携帯lp-meta-icon-4.png | icon-05-online.png |
| 法人携帯lp-meta-icon-5.png | icon-06-phone.png |
| 法人携帯lp-meta-icon-6.png | icon-07-shield.png |
| 法人携帯lp-meta-icon-7.png | icon-08-japan.png |

### 2. ローカルで動作確認する

`index.html` をブラウザで開きます。

**注意**：画像が表示されない場合は、ファイル名が正しいか確認してください。  
※フォーム送信は実際に動くため、テスト時はZapierに本物のデータが届きます。

### 3. GitHub Pages で公開する

`deployment-guide.md`（前のチャットで配布したもの）の手順に従って公開してください。

## 設定変更について

### Webhook URL を変更する場合

`js/main.js` の先頭：

```javascript
const CONFIG = {
  ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.com/hooks/catch/12525485/4ydff70/',
  ...
};
```

### SEO・メタ情報を変更する場合

`index.html` の `<head>` セクション内の `<title>` と `<meta>` タグ。

### 電話番号を変更する場合

- `js/main.js` 内の `CONFIG.TEL`（送信失敗時のアラート表示用）
- `thanks.html` 内の `<a href="tel:05017916247">` と表示文字

## デザインの調整

カラーやサイズはすべて `css/style.css` の冒頭の CSS変数（`:root`）にまとまっています。  
たとえば紺色を変える場合：

```css
:root {
  --navy-deep: #071b3a;  /* ここを変更 */
  ...
}
```

## 動作仕様

- スマホ縦表示専用（最大幅 420px）
- PCで表示した場合は、中央にスマホ幅で表示、左右に薄いグレー背景
- フォーム送信時は確認モーダルが表示され、「送信する」を押すとZapierへPOST
- 送信成功時：`thanks.html` へ遷移
- 送信失敗時：アラートで電話番号を案内

## 個人事業主の条件付き表示

「会社形態」で「個人事業主」を選択すると、注意書きが自動表示されます。  
他の選択肢に戻すと非表示になります。
