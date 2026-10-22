# 电学报告：4 人 · 4 分钟

介绍伏打、法拉第的发明、原理，以及对现代生活的影响。8 页，每位报告者负责两页，预计各 1 分钟。

## 在线演示

https://ezxit.github.io/

网站通过 GitHub Pages 发布。`main` 分支保存项目源码，`gh-pages` 分支保存 `dist/` 中的演示成品。

## 直接使用

打开 `dist/电学报告_4人4分钟.html`，浏览器即可离线演示。完整分工与讲稿位于 `dist/4人分工与讲稿.md`。

方向键翻页，N 查看讲稿，F 全屏，T 开始或暂停计时。

## 修改与构建

修改 `deck.template.html` 中的文字、布局与逐页讲稿，然后在本目录执行：

```powershell
py -3 build.py
```

生成的 HTML 和讲稿保存在本项目的 `dist/` 文件夹。构建只使用 Python 标准库，图片会自动嵌入 HTML。`dist/index.html` 是网站首页，与中文文件名的离线演示稿内容相同。

## 目录

- `deck.template.html`：幻灯片、交互功能与讲稿源文件。
- `build.py`：生成离线单文件 HTML 和分工讲稿。
- `assets/`：原始图片与来源许可清单。
- `dist/`：可直接使用的演示稿与讲稿。
- `qa.cjs`、`qa-final.cjs`：浏览器验证脚本。
- `output/playwright/`、`.playwright-cli/`：开发时的排版截图与验证记录。
