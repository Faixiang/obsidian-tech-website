# 任務 T-01：補齊評分表點名的三項 JS 組件

> 投喂對象：執行層（WorkBuddy 國內版）
> 依據：`docs/網頁策劃.md` v1.1 第九節 · P0
> 產出方：決策層（WorkBuddy 國際版）

---

## 0 範圍

**只改這四個檔案**：

| 檔案 | 改動性質 |
|---|---|
| `support.html` | FAQ 區塊改為手風琴 |
| `index.html` | `.mn-hero__visual` 改為輪播 |
| `products.html` | 產品卡片圖片補懸停效果（僅加 class，不改結構） |
| `assets/css/style.css` | 追加樣式 |
| `assets/js/main.js` | 追加手風琴與輪播邏輯 |

**不准碰**：

- 其餘 12 個 HTML 頁面
- `assets/js/auth.js`、`assets/js/cart.js`
- `docs/` 下任何檔案（除工程日誌）
- 任何頁面的文案文字、`<h1>`、信息結構

---

## 1 背景（已定案，不需要你重新判斷）

`Website Rubric` 的 A 檔在「Use of CSS & JavaScript」一項明確點名五項組件：
Hamburger menu / Accordion / Interactive button·menu / Mouseover image / Image slider。

現況：Hamburger ✅、Interactive button/menu ✅、**其餘三項缺失**。本任務就是補這三項。

完整脈絡見 `docs/網頁策劃.md` v1.1 第七節（G7–G9）與第九節（落點與驗收標準）。

---

## 2 要做的事

### 2.1 Accordion — `support.html` 常見問題區塊

**現況**：`<div class="grid grid--2">` 內有 6 個 `<article class="card">`，每張卡是「`Q1` 編號 + `h3.card__title` 問題 + `p.card__text` 答案 + `p.caption` 更新日期」的靜態結構。

**改為**：單開手風琴（同一時間只展開一項），預設全部收起。

**結構要求**（WAI-ARIA Accordion 模式）：

```html
<div class="acc">
  <div class="acc__item">
    <h3 class="acc__h">
      <button class="acc__trigger" type="button"
              id="acc-btn-1" aria-expanded="false" aria-controls="acc-panel-1">
        <span class="card__no">Q1</span>
        <span class="acc__title">S1 離線，但面板仍顯示上次讀數</span>
        <span class="acc__icon" aria-hidden="true"></span>
      </button>
    </h3>
    <div class="acc__panel" id="acc-panel-1" role="region" aria-labelledby="acc-btn-1" hidden>
      <p class="card__text">（原文照搬）</p>
      <p class="caption">更新於 2026-08-14</p>
    </div>
  </div>
  <!-- 其餘 5 項同構，id 遞增至 acc-btn-6 / acc-panel-6 -->
</div>
```

**硬要求**：

1. 六條問答的**文字一字不改**，只換承載結構
2. `h3` 必須保留（評分含語義化標籤），`button` 包在 `h3` 內
3. 展開時 `aria-expanded="true"` 且移除 `hidden`；收起時反之，三者必須同步
4. 單開：展開一項時，其餘自動收起
5. 鍵盤：`Tab` 可聚焦、`Enter` / `Space` 可切換
6. 展開動效 0.3s ease，只做 `grid-template-rows` 或 `max-height`，**禁止** `height: auto` 硬過渡
7. `prefers-reduced-motion: reduce` 下取消過渡，直接顯示

---

### 2.2 Image slider — `index.html` 首屏右側

**現況**：`.mn-hero__visual` 內是單張 `<img src="assets/img/network.svg">`。

**改為**：三幀輪播，循環播放 S1 / G2 / E3 三張產品圖。

**結構要求**：

```html
<div class="mn-hero__visual">
  <div class="slider" data-slider>
    <div class="slider__track" data-slider-track>
      <figure class="slider__slide">
        <img src="assets/img/product-s1.svg" alt="環境感測終端 S1" width="800" height="600">
        <figcaption class="slider__cap">S1 / 環境感測終端</figcaption>
      </figure>
      <!-- G2、E3 各一幀，圖片路徑 product-g2.svg / product-e3.svg -->
    </div>
    <button class="slider__nav slider__nav--prev" type="button" aria-label="上一張"></button>
    <button class="slider__nav slider__nav--next" type="button" aria-label="下一張"></button>
    <div class="slider__dots" role="tablist" aria-label="輪播切換">
      <button class="slider__dot is-active" type="button" role="tab" aria-selected="true" aria-label="第 1 張"></button>
      <!-- 共 3 個 -->
    </div>
  </div>
</div>
```

**硬要求**：

1. 自動播放間隔 **4000ms**，`linear` 位移，循環無跳變
2. 圓點可點擊直接跳轉，`aria-selected` 同步
3. 左右按鈕可切換
4. 滑鼠懸停或鍵盤聚焦時**暫停**，離開恢復
5. `prefers-reduced-motion: reduce` 下**停止自動播放**，僅保留手動切換
6. 圖片必須 `object-fit: contain`，不得變形、不得撐破 `.mn-hero__visual`
7. `alt` 用產品名，`figcaption` 用「型號 / 中文名」，不得寫宣傳語
8. 不得改動 `.mn-hero` 的 grid 佈局與其他子元素

---

### 2.3 Mouseover image — `products.html` 產品卡片

**現況**：`.card__media` 內為 `<img>`，無任何懸停反應。

**改為**：CSS 懸停效果，**不新增任何文字、不改 HTML 結構**。

**效果要求**：

1. 圖片 `transform: scale(1.06)`，`transition: transform .4s ease`
2. 圖片 `filter: brightness(1.08)`，同 0.4s
3. 容器疊加 1px 青色描邊（用 `::after` + `border-color` 過渡，`pointer-events: none`）
4. 青色必須用既有變數 `var(--cyan)`，**禁止硬編碼色值**
5. `.card__media` 需 `overflow: hidden` 且 `position: relative`，確保放大不溢出
6. 放大不得引起卡片尺寸變化或佈局位移
7. `prefers-reduced-motion: reduce` 下取消縮放與過渡，只保留描邊

---

## 3 硬約束（違反即退回）

| # | 約束 |
|---|---|
| 1 | 全站維持**繁體中文** `lang="zh-Hant"`。**禁止任何簡繁轉換**，禁止把「聯繫」改成「联系」、「網關」改成「网关」 |
| 2 | 不刪改任何既有 class 名與 id（`.card` `.card__media` `.card__body` `.card__no` `.card__title` `.card__text` `.mn-hero__visual` 等） |
| 3 | 不新增任何 script 標籤；所有 JS 追加到 `assets/js/main.js` |
| 4 | 新增顏色一律用 `style.css` 既有 `:root` 變數，禁止硬編碼色值 |
| 5 | 所有 `transition` 必須寫明具體屬性，**禁止 `transition: all`** |
| 6 | 每個 `animation-name` 必須有真實存在的 `@keyframes`，禁止死關鍵幀 |
| 7 | 改動前把三個 HTML 與 css/js 備份到 `.backup/`，檔名加 `.2026-10-22.bak` |
| 8 | 完成後更新 `docs/工程日志.md`，追加當日條目（格式照既有慣例） |
| 9 | commit message 一律英文：`feat(ui): add accordion, hero slider and card hover states` |

---

## 4 驗收（自己先跑一遍，逐條回報）

| # | 項目 | 判定方式 | 通過標準 |
|---|---|---|---|
| 1 | 手風琴存在 | 打開 `support.html` | 六項可展開收起，同時只開一項 |
| 2 | 手風琴無障礙 | 檢查 DOM | `aria-expanded` / `hidden` / `aria-controls` 三者同步 |
| 3 | 手風琴鍵盤 | Tab + Enter | 可聚焦、可切換、焦點環可見 |
| 4 | 手風琴文案 | 對照原文 | 六條問答一字未改 |
| 5 | 輪播存在 | 打開 `index.html` | 三幀自動輪播，4000ms 一換 |
| 6 | 輪播可控 | 點圓點 / 按左右 | 正常跳轉，`aria-selected` 同步 |
| 7 | 輪播暫停 | 滑鼠移入 | 停止自動播放，移出恢復 |
| 8 | 圖片懸停 | 滑鼠移入產品卡 | 放大 + 描邊 + 提亮，0.4s |
| 9 | 無佈局位移 | 懸停時觀察 | 卡片尺寸不變、無抖動 |
| 10 | reduced-motion | 系統開啟「減少動態效果」 | 手風琴無過渡、輪播不自播、懸停不縮放 |
| 11 | 簡體掃描 | 全文搜尋 | `联系` `网关` `数据` `这` `为` 等簡體字零命中 |
| 12 | 三檔視口 | 1920 / 768 / 390 | 無橫向溢出，輪播不撐破容器 |
| 13 | 控制台 | F12 Console | 零錯誤 |
| 14 | 其他頁面 | 隨機開 5 頁 | 導航、佈局、腳本行為均未變 |

---

## 5 衝突處理

1. **不確定時保持現狀，在回報裡列出，禁止自行猜測改動**
2. 需要改本清單外的檔案 → **停手，回報，等指示**
3. 現有樣式與本規格衝突 → 以「不破壞既有視覺」為優先，回報衝突點
4. 若某項做不到，**不要用近似方案頂替**，直接回報「未完成 + 原因」

---

## 6 回報格式

逐條列出，不要寫過程旁白：

```
T-01 回報
1. Accordion    檔案: support.html  行: xx-xx  自測: 通過/未通過
2. Slider       檔案: index.html    行: xx-xx  自測: 通過/未通過
3. Mouseover    檔案: products.html 行: xx-xx  自測: 通過/未通過
4. 驗收 14 項   通過 13 / 未通過 1（第 x 項，原因：…）
5. 未完成或衝突 …
6. 下一步建議 …
```
