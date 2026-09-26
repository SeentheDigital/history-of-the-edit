#!/usr/bin/env python3
"""
Bundle the project into ONE self-contained HTML file, for sharing or
uploading somewhere that only accepts a single file.

    python3 tools/build.py                 -> dist/history-of-the-edit.html
    python3 tools/build.py --embed-media   -> also packs files from media/ and
                                              audio/ into the page (keep them small)

YouTube tapes keep working in the bundle only where the host allows
YouTube embeds; local video and image files work anywhere once embedded.
"""
import base64, mimetypes, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "dist")
OUT = os.path.join(OUT_DIR, "history-of-the-edit.html")
EMBED = "--embed-media" in sys.argv


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def embed_media(js):
    total = 0

    def swap(m):
        nonlocal total
        quote, rel = m.group(1), m.group(2)
        path = os.path.join(ROOT, rel)
        if not os.path.isfile(path):
            print("  missing, left as is:", rel)
            return m.group(0)
        data = open(path, "rb").read()
        total += len(data)
        mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
        print("  embedded %s (%.1f MB)" % (rel, len(data) / 1e6))
        return quote + "data:%s;base64,%s" % (mime, base64.b64encode(data).decode()) + quote

    # any quoted path starting with media/ or audio/ (tapes, soundtrack, sound effects)
    js = re.sub(r"([\"'])((?:media|audio)/[^\"'\s]+)\1", swap, js)
    if total > 12e6:
        print("  warning: %.1f MB of media. Many hosts cap single pages around 16 MB." % (total / 1e6))
    return js


html = read("index.html")
html = html.replace('<link rel="stylesheet" href="css/style.css">', "<style>\n" + read("css/style.css") + "</style>")
for name in ["data", "icons", "audio", "app"]:
    js = read("js/%s.js" % name)
    if name == "data" and EMBED:
        js = embed_media(js)
    js = js.replace("</script", "<\\/script")
    html = html.replace('<script src="js/%s.js"></script>' % name, "<script>\n" + js + "\n</script>")

os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print("Built", os.path.relpath(OUT, ROOT), "(%.0f KB)" % (os.path.getsize(OUT) / 1024))
