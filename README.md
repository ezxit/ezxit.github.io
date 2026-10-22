# 电学报告：伏打与法拉第

介绍伏打、法拉第的发明、原理，以及对现代生活的影响。共 8 页，每位报告者负责两页。

## 在线演示

https://ezxit.github.io/project/

网站通过 GitHub Pages 发布。`main` 分支保存项目源码，`gh-pages` 分支保存 `dist/` 中的演示成品。演示稿与讲稿位于 `/project/`，旧首页自动跳转至新地址并保留页码。

## 直接使用

打开 `dist/project/index.html`，浏览器即可离线演示。旧文件名 `dist/project/电学报告_4人4分钟.html` 保留为同内容的兼容入口。

方向键或 PgUp / PgDn 翻页，空格进入下一页。按 F 进入或退出全屏，按 Esc 退出全屏。全屏只显示幻灯片内容。

完整分工与逐页讲稿单独保存在 `dist/project/4人分工与讲稿.txt`，采用带 BOM 的 UTF-8 编码，可直接用 Windows 记事本打开。`dist/project/4人分工与讲稿.md` 保留为 Markdown 阅读版。

## 修改与构建

修改 `deck.template.html` 中的幻灯片文字与布局，讲稿在 `narration.json` 中独立维护，然后在本目录执行：

```powershell
py -3 build.py
```

生成的 HTML 和讲稿保存在本项目的 `dist/project/` 文件夹。构建只使用 Python 标准库，图片会自动嵌入 HTML。`dist/project/index.html` 与中文文件名的离线演示稿内容相同，`dist/index.html` 是旧首页的跳转入口。

## 目录

- `deck.template.html`：幻灯片与交互功能源文件。
- `narration.json`：按页保存的报告者、标题与讲稿正文。
- `redirect.html`：旧首页跳转至 `/project/` 的入口。
- `build.py`：生成离线单文件 HTML 和分工讲稿。
- `assets/`：原始图片与来源许可清单。
- `dist/`：网站发布目录，演示稿与讲稿位于其中的 `project/`。
- `qa.cjs`、`qa-final.cjs`：浏览器验证脚本。
- `output/playwright/`、`.playwright-cli/`：开发时的排版截图与验证记录。
