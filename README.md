# 曜石智能科技企業官網

CIS222 Web Design and Development
Group Project — 企業官網 E-Commerce 型網站

**虛擬公司**：曜石智能科技（OBSIDIAN Technologies）
**設計規範**：`曜石智能科技_品牌规范与项目方案_V1.1.1.md`
**GitHub**：https://github.com/Faixiang/obsidian-tech-website （private）
**截止日期**：2026-12-20 23:59
**課程要求**：≥ 15 個 HTML 頁面，覆蓋登入 / 會員註冊 / 產品展示 / 購買跳轉 / 聯繫我們 / 站點地圖

---

## 當前狀態

**16 個 HTML 頁面全部建成，導航無死鏈。**

| 層級 | 頁面 |
|---|---|
| 一級 | `index` |
| 二級 | `about` `products` `services` `support` `news` `contact` `careers` |
| 三級 | `product-detail` |
| 功能頁 | `login` `register` `register-done` `cart` `order-confirm` `sitemap` `404` |

---

## 快速開始

直接雙擊 `index.html` 即可瀏覽，無需伺服器、無需安裝依賴。

如需本地伺服器（推薦，便於開發者工具除錯）：

```bash
python -m http.server 8000
# 或
npx serve .
```

然後訪問 `http://localhost:8000`。

---

## 目錄結構

```
Group Project/
├── index.html                首頁（康陶式長滾動）
├── about.html                關於我們
├── products.html             產品與服務
├── product-detail.html       產品詳情（按 ?code= 切換型號）
├── services.html             服務方案
├── contact.html              聯繫我們（諮詢 / 評論 / 投訴）
├── support.html              技術支持
├── news.html                 企業動態
├── careers.html              加入我們
├── login.html                員工 / 客戶登入
├── register.html             會員註冊
├── register-done.html        註冊資訊展示（跳轉目標）
├── cart.html                 購物車
├── order-confirm.html        訂單確認展示（跳轉目標）
├── sitemap.html              站點地圖
├── 404.html                  錯誤頁
│
├── assets/
│   ├── css/style.css         全站設計系統（CSS 變量統一令牌）
│   ├── js/
│   │   ├── main.js           導航 / 滾動進度條 / Tab / 進場動畫
│   │   ├── auth.js           會話 / 校驗 / 跨頁數據
│   │   └── cart.js           購物車 / 訂單
│   └── img/                  手寫 SVG（標誌、產品圖、拓撲圖）
│
├── docs/
│   ├── 工程日志.md            每日改動記錄
│   ├── 验收清单.md            逐項自檢表 + 對比度求解結果
│   ├── 报告大纲.md            2000 字報告框架
│   └── contrast.pyWCAG 對比度自動求解器
│
├── CIS222_CIS282_Group_Project_计划书.md
├── 曜石智能科技_品牌规范与项目方案_V1.1.1.md
├── .gitignore
└── README.md
```

---

## 功能鏈路

課程要求「表單提交至另一 HTML 頁面展示」與「點擊跳轉另一頁面展示購買資訊」，本站以三條鏈路實現：

**會員註冊**
```
register.html  →  校驗 + 寫入 localStorage  →  register-done.html  回顯資料
```

**購買流程**
```
product-detail.html?code=S1|G2|E3  →  加入採購單  →  cart.html
        →  結算校驗 + 寫入 localStorage  →  order-confirm.html  回顯訂單
```

**身分切換**
```
login.html  →  寫入會話  →  全站導航顯示身分
```

---

## 設計系統

全站視覺依據 V1.1 規範，通過 CSS 變量統一管理：

```css
/* 5 級深色縱深 */
--night: #02020A;  --deep: #0B1F3A;  --slate: #16294A;
--graphite: #1C2530;  --metal: #1E2A44;

/* 雙強調色 */
--cyan: #00D4B8;    /* 主鏈路 */
--purple: #7B2FFF;  /* 創新線 */

/* 紫色階梯 */
--purple-deep: #2E1065;  --purple-mid: #3B1D8A;
--purple-bright: #A855F7;  --purple-pale: #E9D5FF;
```

改主題只需改變量值，無需改動組件樣式。

### 顏色變體由腳本生成

CSS 中的 30 個文字色變體**全部由 `docs/contrast.py` 按 WCAG 2.1 公式自動求解**，
保持品牌色相不變，僅沿亮度軸調整至達標。

```bash
python docs/contrast.py
```

**修改色值請重跑腳本，不要手動改 CSS 中的顏色變量。**

---

## 技術說明

- **無框架**：原生 HTML5 + CSS3 + JavaScript
- **無後端**：所有數據存於瀏覽器 `localStorage`，清除瀏覽器數據即丟失
- **無外部資源**：字體走 Google Fonts CDN（帶系統字體回退），其餘全部本地化
- **無支付**：購物車為流程演示，不接入任何支付網關，不索取支付資訊

### 前端校驗 ≠ 安全

本專案的表單校驗在瀏覽器端運行，**任何客戶端校驗都可被繞過**。
真實的登入、註冊、訂單必須由後端校驗，密碼須加鹽雜湊儲存，全程 HTTPS 傳輸。
詳見 `docs/报告大纲.md` 第七章。

---

## 每日工作流程

1. **改動** — 寫程式碼 / 頁面 / 素材
2. **記錄** — 更新 `docs/工程日志.md`（無改動的日子不記錄）
3. **上傳** — commit + push 到 GitHub

提交前掃一遍 `docs/验收清单.md`，即知還差什麼。

---

## 已知問題

**V1.1 §3.7 有3 組對比度聲明實測不達標**（霓虹紫 2.90:1、亮紫 4.17:1、鋼灰 3.99:1），
另有 9 組規範未覆蓋的組合不達標。

已用 `docs/contrast.py` 自動求解並在 CSS 中落實，全部達標。
**待辦**：把求解結果寫回 V1.1 §3.7，讓規範與實現一致。

詳見 `docs/验收清单.md` 第五節。