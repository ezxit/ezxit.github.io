from pathlib import Path
import base64
import html
import json
import re

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
OUT = DIST / 'project'
OUT.mkdir(parents=True, exist_ok=True)
template = (ROOT / 'deck.template.html').read_text(encoding='utf-8')
manifest = json.loads((ROOT / 'assets' / 'manifest.json').read_text(encoding='utf-8-sig'))
used = re.findall(r'@@ASSET:([^@]+)@@', template)
for name in set(used):
    raw = (ROOT / 'assets' / name).read_bytes()
    mime = 'image/png' if name.endswith('.png') else 'image/jpeg'
    template = template.replace(f'@@ASSET:{name}@@', f'data:{mime};base64,{base64.b64encode(raw).decode()}')
names = {
    'volta.jpg': '第 2 頁：伏打肖像',
    'voltaic-pile.png': '第 3 頁：伏打電堆示意圖',
    'phone-charging.jpg': '第 4 頁：手機充電',
    'faraday.jpg': '第 5 頁：法拉第肖像',
    'faraday-disk.jpg': '第 6 頁：法拉第圓盤歷史繪圖',
    'generator.jpg': '第 7 頁：蒸汽輪機發電機',
}
credits = []
for name in used:
    item = next(x for x in manifest if x['file'] == name)
    author = item.get('author', '')
    if not author or 'Unknown' in author:
        author = '作者未詳'
    if name == 'phone-charging.jpg':
        author = 'LG전자（LG Electronics）'
    license_name = '公有領域' if item['license'] == 'Public domain' else item['license']
    license_url = item.get('license_url')
    if license_url:
        license_text = f'<a href="{html.escape(license_url, quote=True)}" target="_blank" rel="noopener noreferrer">{html.escape(license_name)}</a>'
    else:
        license_text = html.escape(license_name)
    credits.append(f'<li><a href="{html.escape(item["source"], quote=True)}" target="_blank" rel="noopener noreferrer">{names[name]}</a><br><small>{html.escape(author)} · {license_text}</small></li>')
template = template.replace('@@IMAGE_CREDITS@@', '\n'.join(credits))
for name in set(re.findall(r'@@BRAND:([^@]+)@@', template)):
    raw = (ROOT / 'assets' / 'branding' / name).read_bytes()
    mime = 'image/x-icon' if name.endswith('.ico') else 'image/png'
    template = template.replace(f'@@BRAND:{name}@@', f'data:{mime};base64,{base64.b64encode(raw).decode()}')
for name in set(re.findall(r'@@FONT:([^@]+)@@', template)):
    raw = (ROOT / 'assets' / 'fonts' / name).read_bytes()
    template = template.replace(f'@@FONT:{name}@@', f'data:font/woff2;base64,{base64.b64encode(raw).decode()}')
font_license = (ROOT / 'assets' / 'fonts' / 'LICENSE.txt').read_text(encoding='utf-8-sig')
template = template.replace('@@FONT_LICENSE@@', html.escape(font_license))
assert '@@ASSET:' not in template and '@@IMAGE_CREDITS@@' not in template and '@@BRAND:' not in template and '@@FONT:' not in template and '@@FONT_LICENSE@@' not in template
target = OUT / '电学报告_4人4分钟.html'
target.write_text(template, encoding='utf-8')
(OUT / 'index.html').write_text(template, encoding='utf-8')
(OUT / 'FONT-LICENSE.txt').write_text(font_license, encoding='utf-8')
for name in ['favicon.png', 'favicon.ico', 'apple-touch-icon.png']:
    (OUT / name).write_bytes((ROOT / 'assets' / 'branding' / name).read_bytes())
(DIST / '.nojekyll').touch()

# Narration is maintained separately from the presentation interface.
scripts = json.loads((ROOT / 'narration.json').read_text(encoding='utf-8-sig'))
assert len(scripts) == 8
assert [item['speaker'] for item in scripts] == [1, 1, 2, 2, 3, 3, 4, 4]
assert all(isinstance(item['title'], str) and isinstance(item['text'], str) for item in scripts)
people = ['開場與伏打的發明', '電池原理與生活影響', '電磁感應與早期發電機', '現代發電與總結']
plain_text = ['電學報告：四人分工與講稿', '',
              '題目：介紹兩位電學物理學家的發明，並說明其對現代生活的影響。',
              '人物：亞歷山德羅·伏打、邁克爾·法拉第。共 8 頁，每人負責 2 頁。', '',
              '報告分工', '']
text = ['# 電學報告：四人分工與講稿', '', '題目：介紹兩位電學物理學家的發明，並說明其對現代生活的影響。', '',
        '人物：亞歷山德羅·伏打、邁克爾·法拉第。共 8 頁，每人負責 2 頁。', '',
        '## 打開與演示', '', '打開同文件夾內的 index.html 即可在瀏覽器離線演示。所有圖片、樣式與腳本已內嵌。', '',
        '- 方向鍵或 PgUp / PgDn：翻頁；空格：下一頁。',
        '- F：進入或退出全屏；Esc：退出全屏。全屏只顯示幻燈片內容。',
        '- 講稿獨立保存在 4人分工与讲稿.txt，支持 Windows 記事本打開。',
        '- 瀏覽器打印可導出全部 8 頁。', '',
        '## 報告分工', '', '| 報告者 | 頁碼 | 內容 |', '| --- | --- | --- |']
for i, name in enumerate(people):
    plain_text.append(f'第 {i+1} 位：第 {i*2+1}、{i*2+2} 頁；{name}。')
    text.append(f'| 第 {i+1} 位 | 第 {i*2+1}、{i*2+2} 頁 | {name} |')
plain_text += ['', '逐頁講稿', '']
text += ['', '## 逐頁講稿', '']
for i, item in enumerate(scripts):
    heading = f'第 {i+1} 頁：{item["title"]}'
    speaker = f'報告者：第 {item["speaker"]} 位'
    plain_text += [heading, speaker, '', item['text'], '']
    text += [f'### {heading}', '', speaker, '', item['text'], '']
(OUT / '4人分工与讲稿.txt').write_text('\n'.join(plain_text), encoding='utf-8-sig', newline='\r\n')
text += ['## 事實與圖片資料', '',
         '- National MagLab：伏打電堆（1800）\n  https://nationalmaglab.org/magnet-academy/history-of-electricity-magnetism/museum/voltaic-pile-1800/',
         '- Royal Institution：伏打電堆館藏\n  https://www.rigb.org/explore-science/explore/collection/alessandro-voltas-voltaic-pile',
         '- Royal Institution：法拉第的發電裝置\n  https://www.rigb.org/explore-science/explore/collection/michael-faradays-generator',
         '- National MagLab：法拉第\n  https://nationalmaglab.org/magnet-academy/history-of-electricity-magnetism/pioneers/michael-faraday/', '',
         '完整圖片來源與許可位於 HTML 頂部“參考資料”。', '',
         '內容提醒：伏打發明的是早期電堆，現代鋰電池爲後續衆多研究者的成果。法拉第圓盤輸出直流電，現代多數大型發電機結構不同、通常輸出交流電。發電是能量轉換。', '']
(OUT / '4人分工与讲稿.md').write_text('\n'.join(text), encoding='utf-8')
counts = []
for i in range(4):
    counts.append(sum(len(re.findall(r'[\u4e00-\u9fff]', scripts[j]['text'])) for j in [2*i, 2*i+1]))
print(json.dumps({'html':str(target),'bytes':target.stat().st_size,'slides':len(scripts),'chinese_characters_per_speaker':counts},ensure_ascii=False))
