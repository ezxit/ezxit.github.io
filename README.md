# 電學報告：伏打與法拉第

介紹伏打、法拉第的發明、原理，以及對現代生活的影響。共 8 頁，每位報告者負責兩頁。

## 在線演示

https://ezxit.github.io/project/

網站通過 GitHub Pages 發佈。`main` 分支保存項目源碼，`gh-pages` 分支保存 `dist/` 中的演示成品。演示稿與講稿位於 `/project/`，根目錄不再提供首頁或跳轉，直接訪問根網址會顯示 GitHub Pages 的 404 頁面。

## 直接使用

打開 `dist/project/index.html`，瀏覽器即可離線演示。舊文件名 `dist/project/电学报告_4人4分钟.html` 保留爲同內容的兼容入口。

方向鍵或 PgUp / PgDn 翻頁，空格進入下一頁。按 F 進入或退出全屏，按 Esc 退出全屏。全屏只顯示幻燈片內容。

完整分工與逐頁講稿單獨保存在 `dist/project/4人分工与讲稿.txt`，採用帶 BOM 的 UTF-8 編碼，可直接用 Windows 記事本打開。`dist/project/4人分工与讲稿.md` 保留爲 Markdown 閱讀版。

## 修改與構建

修改 `deck.template.html` 中的幻燈片文字與佈局，講稿在 `narration.json` 中獨立維護，然後在本目錄執行：

```powershell
py -3 build.py
```

生成的 HTML 和講稿保存在本項目的 `dist/project/` 文件夾。構建只使用 Python 標準庫，圖片與字體會自動嵌入 HTML。`dist/project/index.html` 與中文文件名的離線演示稿內容相同，頁面和講稿內容使用繁體中文。

中文使用 Adobe 思源宋體繁體版 Light（字重 300），包含於單文件 HTML，離線演示也有相同字形。英文、年份與頁碼保留原字體，中文停用瀏覽器合成粗體。字體依 SIL Open Font License 1.1 使用，完整許可隨 HTML 內嵌，並另存於 `dist/project/FONT-LICENSE.txt`。

新增文字時，先安裝開發用的 `fonttools` 與 `brotli`，執行 `py -3 assets/fonts/subset_font.py` 更新字體子集，再執行構建。官方原始字體、來源紀錄及重建方式位於 `assets/fonts/`，一般構建不需要安裝字體工具。

## 目錄

- `deck.template.html`：幻燈片與交互功能源文件。
- `narration.json`：按頁保存的報告者、標題與講稿正文。
- `build.py`：生成離線單文件 HTML 和分工講稿。
- `assets/`：原始圖片、思源宋體字體檔案與來源許可清單。
- `dist/`：網站發佈目錄，演示稿與講稿位於其中的 `project/`。
- `qa.cjs`、`qa-final.cjs`：瀏覽器驗證腳本。
- `output/playwright/`、`.playwright-cli/`：開發時的排版截圖與驗證記錄。
