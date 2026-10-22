from pathlib import Path
import base64
import html
import json
import re

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'dist'
OUT.mkdir(parents=True, exist_ok=True)
template = (ROOT / 'deck.template.html').read_text(encoding='utf-8')
manifest = json.loads((ROOT / 'assets' / 'manifest.json').read_text(encoding='utf-8-sig'))
used = re.findall(r'@@ASSET:([^@]+)@@', template)
for name in set(used):
    raw = (ROOT / 'assets' / name).read_bytes()
    mime = 'image/png' if name.endswith('.png') else 'image/jpeg'
    template = template.replace(f'@@ASSET:{name}@@', f'data:{mime};base64,{base64.b64encode(raw).decode()}')
names = {
    'volta.jpg': '第 2 页：伏打肖像',
    'voltaic-pile.png': '第 3 页：伏打电堆示意图',
    'phone-charging.jpg': '第 4 页：手机充电',
    'faraday.jpg': '第 5 页：法拉第肖像',
    'faraday-disk.jpg': '第 6 页：法拉第圆盘历史绘图',
    'generator.jpg': '第 7 页：蒸汽轮机发电机',
}
credits = []
for name in used:
    item = next(x for x in manifest if x['file'] == name)
    author = item.get('author', '')
    if not author or 'Unknown' in author:
        author = '作者未详'
    if name == 'phone-charging.jpg':
        author = 'LG전자（LG Electronics）'
    license_name = '公有领域' if item['license'] == 'Public domain' else item['license']
    license_url = item.get('license_url')
    if license_url:
        license_text = f'<a href="{html.escape(license_url, quote=True)}" target="_blank" rel="noopener noreferrer">{html.escape(license_name)}</a>'
    else:
        license_text = html.escape(license_name)
    credits.append(f'<li><a href="{html.escape(item["source"], quote=True)}" target="_blank" rel="noopener noreferrer">{names[name]}</a><br><small>{html.escape(author)} · {license_text}</small></li>')
template = template.replace('@@IMAGE_CREDITS@@', '\n'.join(credits))
assert '@@ASSET:' not in template and '@@IMAGE_CREDITS@@' not in template
target = OUT / '电学报告_4人4分钟.html'
target.write_text(template, encoding='utf-8')
(OUT / 'index.html').write_text(template, encoding='utf-8')
(OUT / '.nojekyll').touch()

# The rehearsal sheet uses exactly the scripts embedded in the slide deck.
original = (ROOT / 'deck.template.html').read_text(encoding='utf-8')
scripts = re.findall(r"\{speaker:(\d),title:'([^']+)',text:'([^']+)',cue:'([^']+)'", original)
assert len(scripts) == 8
people = ['开场与伏打的发明', '电池原理与生活影响', '电磁感应与早期发电机', '现代发电与总结']
text = ['# 电学报告：4 人 · 4 分钟', '', '题目：介绍两位电学物理学家的发明，并说明其对现代生活的影响。', '',
        '人物：亚历山德罗·伏打、迈克尔·法拉第。共 8 页，每人 2 页；每页建议约 30 秒。', '',
        '## 打开与演示', '', '双击同文件夹内的 HTML 即可在浏览器离线打开。所有图片、样式与脚本已内嵌。', '',
        '- ← / → 或 PgUp / PgDn：翻页；空格：下一页。',
        '- N：讲稿；O：总览；F：全屏；T：开始或暂停 4 分钟倒计时。',
        '- 开始计时前，先返回第 1 页。默认手动翻页。',
        '- 需要自动翻页时，在讲稿栏勾选“计时中每 30 秒自动翻页”。',
        '- 浏览器打印可导出全部 8 页。', '',
        '## 报告分工', '', '| 报告者 | 页码 | 时间 | 内容 |', '| --- | --- | --- | --- |']
for i, name in enumerate(people):
    text.append(f'| 第 {i+1} 位 | 第 {i*2+1}、{i*2+2} 页 | {i:02}:00 - {i+1:02}:00 | {name} |')
text += ['', '## 逐页讲稿', '', '按每分钟约 230–260 字及换页停顿设计；请以实际排练微调语速。计时建议是节奏参考。', '']
for i, (speaker, title, script, cue) in enumerate(scripts):
    start = f'{i*30//60:02}:{i*30%60:02}'
    end = f'{(i+1)*30//60:02}:{(i+1)*30%60:02}'
    text += [f'### 第 {i+1} 页 · {title}', '', f'第 {speaker} 位 / {start} - {end}', '', script, '', f'提示：{cue}', '']
text += ['## 事实与图片资料', '',
         '- National MagLab：伏打电堆（1800）\n  https://nationalmaglab.org/magnet-academy/history-of-electricity-magnetism/museum/voltaic-pile-1800/',
         '- Royal Institution：伏打电堆馆藏\n  https://www.rigb.org/explore-science/explore/collection/alessandro-voltas-voltaic-pile',
         '- Royal Institution：法拉第的发电装置\n  https://www.rigb.org/explore-science/explore/collection/michael-faradays-generator',
         '- National MagLab：法拉第\n  https://nationalmaglab.org/magnet-academy/history-of-electricity-magnetism/pioneers/michael-faraday/', '',
         '完整图片来源与许可位于 HTML 顶部“参考资料”。', '',
         '内容提醒：伏打发明的是早期电堆，现代锂电池为后续众多研究者的成果。法拉第圆盘输出直流电，现代多数大型发电机结构不同、通常输出交流电。发电是能量转换。', '']
(OUT / '4人分工与讲稿.md').write_text('\n'.join(text), encoding='utf-8')
counts = []
for i in range(4):
    counts.append(sum(len(re.findall(r'[\u4e00-\u9fff]', scripts[j][2])) for j in [2*i, 2*i+1]))
print(json.dumps({'html':str(target),'bytes':target.stat().st_size,'slides':len(scripts),'chinese_characters_per_speaker':counts},ensure_ascii=False))
