import codecs
with codecs.open('index.html', 'r', 'utf-8') as f:
    c = f.read()
c = c.replace("go('archive',this)", "go('archive',this); loadArchive()")
with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(c)
