#!/usr/bin/env python3
"""Refresh the offline file list in sw.js and bump its VERSION.

Run this after adding, removing or changing any game file:

    python3 tools/update-sw.py

Every file the games need is listed, so the whole collection works offline
after the first visit. Docs, tools and the _template folder are left out.

It also writes js/version.js, so the grown-up corner can show which version
is running (handy when debugging an installed copy).
"""
import datetime
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'.git', 'tools', '_template', 'node_modules', '.github'}
SKIP_FILES = {'sw.js', '.nojekyll', 'CNAME'}
SKIP_EXT = {'.md', '.txt', '.py'}

path = os.path.join(ROOT, 'sw.js')
src = open(path, encoding='utf-8').read()
m = re.search(r"const VERSION = 'v(\d+)';", src)
version = int(m.group(1)) + 1

# js/version.js is written first, so a brand-new copy of it is in the list below.
today = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
with open(os.path.join(ROOT, 'js', 'version.js'), 'w', encoding='utf-8') as f:
    f.write('// Written by tools/update-sw.py: shown in the grown-up corner. Matches VERSION in sw.js.\n'
            f"export const VERSION = 'v{version}';\n"
            f"export const BUILT = '{today}';\n")

# ...and the same version goes into the About card's text in index.html, so it shows even
# when the scripts are an older copy.
hub = os.path.join(ROOT, 'index.html')
html = open(hub, encoding='utf-8').read()
html, n = re.subn(r'(<div class="gu-note gu-version" id="gu-version" data-version=")[^"]*(">)[^<]*(</div>)',
                  lambda m: f'{m.group(1)}v{version}{m.group(2)}Version v{version} ({today}){m.group(3)}', html)
if n != 1:
    raise SystemExit('index.html: could not find the version card (#gu-version)')
open(hub, 'w', encoding='utf-8').write(html)

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

listing = 'const ASSETS = [\n' + ''.join(f"  '{a}',\n" for a in assets) + '];'
src = re.sub(r'const ASSETS = \[.*?\];', lambda m: listing, src, count=1, flags=re.S)
src = src.replace(m.group(0), f"const VERSION = 'v{version}';")
open(path, 'w', encoding='utf-8').write(src)
print(f'sw.js: {len(assets)} files, version v{version}')
