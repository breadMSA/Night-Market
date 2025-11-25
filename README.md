# 士林夜市 - AI 導遊夜市介紹網站

一個沉浸式、高互動性的一頁式夜市導覽網站，使用 AI 代理人模擬在地嚮導的體驗。

## 功能特色

- 🎨 **霓虹燈風格設計** - 使用高飽和度的亮黃色、霓虹粉和霓虹藍，模擬夜市燈火璀璨的氛圍
- 🍜 **必吃美食介紹** - 展示 6 個士林夜市最受歡迎的美食，包含價格和評分
- 🎯 **特色攤位 & 遊戲** - 介紹射氣球、手工藝品、古早味飲品等特色攤位
- 🗺️ **交通資訊** - 提供詳細的地址、大眾運輸和停車資訊，並嵌入 Google 地圖
- 🤖 **AI 在地嚮導** - 透過 Gemini AI 提供即時問答服務，回答遊客各種問題
- 📱 **響應式設計** - 完美適配手機、平板和桌面裝置

## 技術架構

### 前端（GitHub Pages）
- **HTML/CSS/JavaScript** - 純前端實現
- **Tailwind CSS** - 透過 CDN 使用，快速樣式設計
- **自訂 CSS** - 霓虹燈效果和動畫

### 後端（Vercel Functions）
- **Serverless Function** - 使用 Vercel 的無伺服器函數
- **Gemini AI API** - 整合 Google Gemini Pro 模型
- **CORS 支援** - 允許前端跨域請求

## 部署步驟

### 1. 前端部署到 GitHub Pages

1. 將專案推送到 GitHub 倉庫
2. 在 GitHub 倉庫設定中啟用 GitHub Pages
3. 選擇 `main` 分支作為來源

### 2. 後端部署到 Vercel

1. 安裝 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 在專案根目錄登入 Vercel：
   ```bash
   vercel login
   ```

3. 部署專案：
   ```bash
   vercel
   ```

4. 設定環境變數：
   - 前往 Vercel 專案設定頁面
   - 在「Environment Variables」中新增：
     - `GEMINI_API_KEY`: 你的 Google Gemini API Key
   
   取得 Gemini API Key：
   - 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 建立新的 API Key

### 3. 更新前端 API URL

部署 Vercel 後，你會得到一個 URL（例如：`https://your-app.vercel.app`）

在 `script.js` 中更新 API URL：
```javascript
const response = await fetch('https://your-vercel-app.vercel.app/api/chat', {
    // ...
});
```

將 `https://your-vercel-app.vercel.app` 替換為你的實際 Vercel 部署 URL。

## 專案結構

```
.
├── index.html          # 主頁面
├── script.js          # 前端 JavaScript
├── api/
│   └── chat.js        # Vercel Function (AI 聊天 API)
├── vercel.json        # Vercel 設定檔
└── README.md          # 說明文件
```

## 本地開發

### 前端測試

由於是靜態網站，可以直接用瀏覽器開啟 `index.html`，或使用本地伺服器：

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve
```

### 後端測試

使用 Vercel CLI 在本地測試：

```bash
vercel dev
```

這會啟動本地開發伺服器，並可以測試 API 端點。

## 注意事項

1. **API Key 安全**：確保 `GEMINI_API_KEY` 只設定在 Vercel 環境變數中，不要提交到 GitHub
2. **CORS**：Vercel Function 已設定 CORS 標頭，允許跨域請求
3. **API 限制**：注意 Gemini API 的使用限制和費用
4. **地圖嵌入**：Google Maps iframe 可能需要調整座標以正確顯示士林夜市位置

## 自訂內容

### 修改美食資訊

編輯 `index.html` 中的美食卡片區塊（`#food` section）

### 修改特色攤位

編輯 `index.html` 中的特色攤位區塊（`#fun` section）

### 調整 AI 提示詞

編輯 `api/chat.js` 中的 `systemPrompt` 變數

## 技術支援

- **前端框架**：純 HTML/CSS/JavaScript
- **樣式框架**：Tailwind CSS (CDN)
- **後端**：Vercel Serverless Functions
- **AI 模型**：Google Gemini Pro
- **部署**：GitHub Pages (前端) + Vercel (後端)

## 授權

MIT License

