import re

with open('src/store/slices/createOperationsSlice.js', 'r') as f:
    text = f.read()

# Fix the `const xxx = ` into `xxx:` for functions that are supposed to be methods
text = re.sub(r"\n\s*const (playRingtone|acceptCall|rejectCall|resetAllData|seedDemoData) = (async )?\([^)]*\)\s*=>\s*\{", r"\n  \1: \2() => {", text)
text = re.sub(r"const navigateTo = useCallback\(\(appId\) => setActiveApp\(appId\), \[\]\);", r"navigateTo: (appId) => get().setActiveApp(appId),", text)

# Delete useEffect blocks
# Easiest way is to remove from: `  useEffect(() => {` up to `    const clientNoms = ["Industries Ouest",`? Wait, `seedDemoData` starts near there.
# Let's completely remove the `8. CLOUD LISTENERS` section.
pat_listeners = r"/\* ══════════════════════════════════════════════════════════════════════════\s*8\. CLOUD LISTENERS.*?(?=\n\s*(resetAllData|seedDemoData):|const (resetAllData|seedDemoData))"
text = re.sub(pat_listeners, "", text, flags=re.DOTALL)

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

