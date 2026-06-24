import os, shutil, sys

sys.stdout.reconfigure(encoding='utf-8')

def build():
    workspace = os.path.dirname(os.path.abspath(__file__))
    OUTPUT = "برنامج مدرسة الشمامسة نهااائي.html"
    BACKUP = "برنامج مدرسة الشمامسة نهااائي.backup.html"

    print("Starting build...")

    orig = os.path.join(workspace, OUTPUT)
    bak  = os.path.join(workspace, BACKUP)
    if os.path.exists(orig) and not os.path.exists(bak):
        shutil.copyfile(orig, bak)
        print(f"  Backed up original -> {BACKUP}")

    with open(os.path.join(workspace, "index.html"), encoding="utf-8") as f:
        html = f.read()

    # ── Inline CSS ──────────────────────────────────────────────────────────
    css_files = [
        "src/core/fonts.css",
        "src/presentation/css/theme.css",
        "src/presentation/css/layouts.css",
        "src/presentation/css/animations_search.css",
        "src/presentation/css/animations_bounce.css",
        "src/presentation/css/sidebar.css",
    ]
    css_bundle = ""
    for rel in css_files:
        p = os.path.join(workspace, rel)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                css_bundle += f.read() + "\n"
        else:
            print(f"  WARNING: Missing CSS: {rel}")

    html = html.replace(
        '<link rel="stylesheet" href="./src/presentation/css/index.css">',
        f"<style>\n{css_bundle}\n</style>"
    )

    # ── Inline JS ───────────────────────────────────────────────────────────
    scripts = [
        ("public/lib/xlsx.min.js",                     '<script src="./public/lib/xlsx.min.js"></script>'),
        ("public/lib/html2canvas.min.js",              '<script src="./public/lib/html2canvas.min.js"></script>'),
        ("public/lib/jspdf.min.js",                    '<script src="./public/lib/jspdf.min.js"></script>'),
        ("public/lib/qrcode.min.js",                   '<script src="./public/lib/qrcode.min.js"></script>'),
        ("src/core/fontPatcher.js",                    '<script src="./src/core/fontPatcher.js"></script>'),
        ("src/domain/mercyBanner.js",                  '<script src="./src/domain/mercyBanner.js"></script>'),
        ("src/data/database.js",                       '<script src="./src/data/database.js"></script>'),
        ("src/domain/GradesCalculator.js",             '<script src="./src/domain/GradesCalculator.js"></script>'),
        ("src/core/config.js",                         '<script src="./src/core/config.js"></script>'),
        ("src/application/auth.js",                    '<script src="./src/application/auth.js"></script>'),
        ("src/domain/student_rules.js",                '<script src="./src/domain/student_rules.js"></script>'),
        ("src/presentation/views/ui_views.js",         '<script src="./src/presentation/views/ui_views.js"></script>'),
        ("src/application/globalSearch.js",            '<script src="./src/application/globalSearch.js"></script>'),
        ("src/data/autoBackup.js",                     '<script src="./src/data/autoBackup.js"></script>'),
        ("src/application/schedule.js",                '<script src="./src/application/schedule.js"></script>'),
        ("src/application/certificate.js",             '<script src="./src/application/certificate.js"></script>'),
        ("src/presentation/router/pageMetadata.js",    '<script src="./src/presentation/router/pageMetadata.js"></script>'),
    ]

    for rel, tag in scripts:
        p = os.path.join(workspace, rel)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                js = f.read()
            html = html.replace(tag, f"<script>\n{js}\n</script>")
        else:
            print(f"  WARNING: Missing JS: {rel}")

    dest = os.path.join(workspace, OUTPUT)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(dest) // 1024
    print(f"Build complete -> {OUTPUT}  ({size_kb} KB)")

if __name__ == "__main__":
    build()
