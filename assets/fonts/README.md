# Project Font

`SourceHanSerifTC-Light.otf` is the original static Traditional Chinese Light
font from Adobe's official source-han-serif release branch. It is retained to
regenerate the project subset after text changes. Its weight class is 300.

`SourceHanSerifTC-Light.project.woff2` contains every printable character used
in `deck.template.html`, `build.py`, and `narration.json`, plus printable ASCII.
The modified subset is internally named **Electricity Serif Light**, with
PostScript name **ElectricitySerif-Light**, to respect the reserved font name
"Source" in the SIL Open Font License 1.1. Keep `LICENSE.txt` with redistributed
font files. Full source details, hashes, name tables, and coverage results are
in `font-metadata.json`.

To regenerate after changing project text, install `fonttools` and `brotli`
for a Python environment, then run:

```powershell
python assets/fonts/subset_font.py
```

The script reads the three project source files, checks original coverage,
creates the WOFF2 subset, applies independent names, and verifies weight and
coverage again. Production HTML generation only needs the existing WOFF2;
fonttools is a development dependency.

For the presentation, use weight 300 and a CJK-only CSS `unicode-range` so
existing Latin and numeral typography is retained. Do not synthesize bold for
Chinese text. ASCII is present in the subset for reuse and does not override
other families when excluded by CSS `unicode-range`.

Official sources:

- https://github.com/adobe-fonts/source-han-serif
- https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/OTF/TraditionalChinese/SourceHanSerifTC-Light.otf
- https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/LICENSE.txt
