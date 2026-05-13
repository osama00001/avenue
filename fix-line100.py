path = '/var/www/vhosts/avenuebookstore.com/httpdocs/src/scripts/sync-biblio.js'
lines = open(path).readlines()
print("BEFORE:", repr(lines[99]))

# Build the reference without writing it literally (Cowork auto-links allFiles.map)
ref = 'all' + 'Files' + '.' + 'map'
correct = (
    "      console.log(`[sync-biblio] All extracted files: ${"
    + ref
    + "(f => path.basename(f)).join(', ')}`);\n"
)

lines[99] = correct
open(path, 'w').write(''.join(lines))
print("AFTER: ", repr(lines[99]))
