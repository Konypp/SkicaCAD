#!/usr/bin/env python3
"""Builds js/manual.js (the in-app manual, Nápověda) from tools/prirucka.md, the markdown export of the user manual doc.
Run after every change of the manual:  python3 tools/manual.py"""
import json, os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
md = open(os.path.join(root, 'tools', 'prirucka.md'), encoding='utf8').read()
# the byline under the title (date and author chips) is left out
md = re.sub(r'^(# .*\n\n)[A-Z][a-z]{2} \d{1,2}, \d{4} · @.*\n\n', r'\1', md)
open(os.path.join(root, 'js', 'manual.js'), 'w', encoding='utf8').write(
    '/* SkicaCAD – uživatelská příručka pro Nápovědu v aplikaci. Generováno z tools/prirucka.md (tools/manual.py), neupravovat ručně. */\n'
    'self.SKICA_MANUAL = ' + json.dumps(md, ensure_ascii=False) + ';\n')
print('manual.js', len(md))
