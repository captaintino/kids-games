#!/usr/bin/env python3
"""Refresh the offline file list in sw.js and bump its VERSION.

Run this after adding, removing or changing any game file:

    python3 tools/update-sw.py

Every file the games need is listed, so the whole collection works offline
after the first visit. Docs, tools and the _template folder are left out.
"""
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'.git', 'tools', '_template', 'node_modules', '.github'}
SKIP_FILES = {'sw.js', '.nojekyll', 'CNAME'}
SKIP_EXT = {'.md', '.txt', '.py'}

# Files git knows about (committed, staged or new but not ignored), so stray
# local files never end up in the offline cache.
out = subprocess.run(
    ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout
files = sorted(f for f in out.splitlines() if os.path.exists(os.path.join(ROOT, f)))

assets = ['./']
for rel in files:
    parts = rel.split('/')
    name = parts[-1]
    if parts[0] in SKIP_DIRS or any(p.startswith('.') for p in parts):
        continue
    if name in SKIP_FILES or os.path.splitext(name)[1] in SKIP_EXT:
        continue
    if name == 'index.html' and len(parts) > 1:
        assets.append('./' + '/'.join(parts[:-1]) + '/')
    assets.append('./' + rel)

path = os.path.join(ROOT, 'sw.js')
src = open(path, encoding='utf-8').read()
listing = 'const ASSETS = [\n' + ''.join(f"  '{a}',\n" for a in assets) + '];'
src = re.sub(r'const ASSETS = \[.*?\];', lambda m: listing, src, count=1, flags=re.S)
m = re.search(r"const VERSION = 'v(\d+)';", src)
version = int(m.group(1)) + 1
src = src.replace(m.group(0), f"const VERSION = 'v{version}';")
open(path, 'w', encoding='utf-8').write(src)
print(f'sw.js: {len(assets)} files, version v{version}')
