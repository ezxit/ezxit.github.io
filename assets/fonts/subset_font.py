"""Regenerate the project font with fonttools[woff] (fonttools + brotli)."""

from pathlib import Path
import hashlib
import html
import json
import sys
import unicodedata

HERE = Path(__file__).resolve().parent
if (HERE / '.tools').is_dir():
    sys.path.insert(0, str(HERE / '.tools'))

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = HERE.parent.parent
SOURCE = HERE / 'SourceHanSerifTC-Light.otf'
TARGET = HERE / 'SourceHanSerifTC-Light.project.woff2'
INPUTS = ['deck.template.html', 'build.py', 'narration.json']
SOURCE_URL = 'https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/OTF/TraditionalChinese/SourceHanSerifTC-Light.otf'
LICENSE_URL = 'https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/LICENSE.txt'


def names(font, identifiers):
    result = {}
    for identifier in identifiers:
        result[str(identifier)] = sorted({record.toUnicode() for record in font['name'].names if record.nameID == identifier})
    return result


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def character_record(codepoint):
    return {'codepoint': f'U+{codepoint:04X}', 'character': chr(codepoint), 'name': unicodedata.name(chr(codepoint), '')}


required = set(range(0x20, 0x7F))
input_hashes = {}
for filename in INPUTS:
    path = ROOT / filename
    content = path.read_text(encoding='utf-8-sig')
    if filename.endswith('.json'):
        content += json.dumps(json.loads(content), ensure_ascii=False)
    required.update(ord(character) for character in html.unescape(content) if character.isprintable())
    input_hashes[filename] = digest(path)

font = TTFont(SOURCE)
source_names = names(font, [0, 1, 2, 4, 5, 6, 16, 17])
source_cmap = font.getBestCmap()
missing_original = sorted(required - set(source_cmap))
if missing_original:
    raise RuntimeError('Original font lacks required characters: ' + json.dumps([character_record(codepoint) for codepoint in missing_original], ensure_ascii=True))
if font['OS/2'].usWeightClass != 300 or 'fvar' in font:
    raise RuntimeError('Expected a static Light font with OS/2 weight 300')

options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
options.name_IDs = ['*']
options.name_languages = ['*']
options.notdef_glyph = True
options.notdef_outline = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=required)
subsetter.subset(font)

# OFL reserves "Source"; the modified subset receives independent primary names.
renamed = {
    1: 'Electricity Serif Light',
    2: 'Regular',
    3: 'Electricity Serif Light; 2.003; ProjectSubset',
    4: 'Electricity Serif Light',
    6: 'ElectricitySerif-Light',
    16: 'Electricity Serif',
    17: 'Light',
    18: 'Electricity Serif Light',
    21: 'Electricity Serif',
    22: 'Light',
    25: 'ElectricitySerif',
}
for identifier, value in renamed.items():
    font['name'].removeNames(nameID=identifier)
    font['name'].setName(value, identifier, 3, 1, 0x0409)
if 'CFF ' in font:
    cff = font['CFF '].cff
    cff.fontNames = ['ElectricitySerif-Light']
    for top_dictionary in cff.topDictIndex:
        top_dictionary.FamilyName = 'Electricity Serif'
        top_dictionary.FullName = 'Electricity Serif Light'
        top_dictionary.Weight = 'Light'
font.flavor = 'woff2'
font.save(TARGET)

verified = TTFont(TARGET)
subset_cmap = verified.getBestCmap()
missing_subset = sorted(required - set(subset_cmap))
if missing_subset or verified['OS/2'].usWeightClass != 300:
    raise RuntimeError('Subset failed coverage or weight validation')
primary_names = names(verified, list(renamed))
if any('Source' in value for values in primary_names.values() for value in values):
    raise RuntimeError('A reserved primary font name remains in the modified subset')

metadata = {
    'source': {
        'family': 'Source Han Serif TC',
        'style': 'Light',
        'version': source_names['5'],
        'file': SOURCE.name,
        'bytes': SOURCE.stat().st_size,
        'sha256': digest(SOURCE),
        'github_blob_sha': 'd470b0edf43e02a659a9287774956f9ca400cf19',
        'repository': 'https://github.com/adobe-fonts/source-han-serif',
        'download_url': SOURCE_URL,
        'names': source_names,
        'weight_class': 300,
        'static': True,
        'embedding_fsType': font['OS/2'].fsType,
    },
    'license': {
        'name': 'SIL Open Font License 1.1',
        'file': 'LICENSE.txt',
        'source_url': LICENSE_URL,
        'reserved_font_name': 'Source',
        'subset_renamed': True,
    },
    'subset': {
        'file': TARGET.name,
        'bytes': TARGET.stat().st_size,
        'sha256': digest(TARGET),
        'weight_class': verified['OS/2'].usWeightClass,
        'family': 'Electricity Serif Light',
        'typographic_family': 'Electricity Serif',
        'postscript_name': 'ElectricitySerif-Light',
        'names': primary_names,
        'required_character_count': len(required),
        'encoded_character_count': len(subset_cmap),
        'glyph_count': verified['maxp'].numGlyphs,
        'missing_characters': [character_record(codepoint) for codepoint in missing_subset],
        'ascii_included': 'U+0020-U+007E',
        'coverage': 'All printable characters in deck.template.html, build.py, narration.json, including HTML entities; all printable ASCII.',
        'inputs_sha256': input_hashes,
        'unicode_codepoints': [f'U+{codepoint:04X}' for codepoint in sorted(required)],
        'css_recommendation': 'Declare font-weight: 300 and use a CJK-only unicode-range; retain existing Latin and numeral fonts. Disable synthesized bold for Chinese.',
    },
}
(HERE / 'font-metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({
    'original_bytes': SOURCE.stat().st_size,
    'subset_bytes': TARGET.stat().st_size,
    'weight_class': verified['OS/2'].usWeightClass,
    'required_characters': len(required),
    'missing': len(missing_subset),
    'family': 'Electricity Serif Light',
}, ensure_ascii=True))
