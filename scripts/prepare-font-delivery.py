from pathlib import Path
import hashlib, re, json
root=Path(__file__).resolve().parent.parent
source=root/'scripts/fonts/delivery'
metadata=root/'lib/site-font-delivery.ts'
text=metadata.read_text()
preloads={}
files=root/'public/fonts/delivery/files';files.mkdir(exist_ok=True)
for locale in ['latin','arabic']:
    css=(source/(locale+'.css')).read_text().rstrip('\n')
    urls=[]
    def publish(match):
        path=match[1]
        if path.startswith('/'): return match[0]
        data=(source/path).resolve().read_bytes()
        name=hashlib.sha256(data).hexdigest()[:16]+'.woff2'
        (files/name).write_bytes(data)
        url='/fonts/delivery/files/'+name
        urls.append(url)
        return 'url('+url+')'
    css=re.sub(r'url\(([^)]+)\)',publish,css)
    name=locale+'.'+hashlib.sha256(css.encode()).hexdigest()[:12]+'.css'
    (root/'public/fonts/delivery'/name).write_text(css)
    text=re.sub('"'+locale+'": "[^"]+"', '"'+locale+'": "/fonts/delivery/'+name+'"', text)
    # The Latin-extension face stays available on demand; the Latin face covers French accents.
    if locale=='latin':
        ext=re.search(r'@font-face\{font-family:Manrope;[^}]*unicode-range:U\+100-2BA[^}]*\}',css)
        if ext:
            url=re.search(r'url\(([^)]+)\)',ext[0])[1];urls=[x for x in urls if x!=url]
    if locale=='latin':
        for face in re.findall(r'@font-face\{font-family:Cormorant Garamond;[^}]*font-weight:600;[^}]*\}',css):
            url=re.search(r'url\(([^)]+)\)',face)[1];urls=[x for x in urls if x!=url]
    preloads[locale]=list(dict.fromkeys(urls)) if locale=='latin' else []
text=re.sub(r'\nexport const fontPreloads = .*? as const\n','\n',text)
text+='\nexport const fontPreloads = '+json.dumps(preloads)+' as const\n'
metadata.write_text(text)
