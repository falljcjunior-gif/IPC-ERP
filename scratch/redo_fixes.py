import re

with open('scratch/createOps_orig.js', 'r') as f:
    text = f.read()

# 1. Truncate at CLOUD LISTENERS section
pat_listeners = r"\n\s*/\* ══════════════════════════════════════════════════════════════════════════\n\s*8\. CLOUD LISTENERS.*"
text = re.sub(pat_listeners, "\n});", text, flags=re.DOTALL)

# 2. Fix the initial consts
text = re.sub(r"\n\s*const (playRingtone|acceptCall|rejectCall) = (async )?\(\) => \{", r"\n  \1: \2() => {", text)
text = re.sub(r"const navigateTo = useCallback\(\(appId\) => setActiveApp\(appId\), \[\]\);", r"navigateTo: (appId) => get().setActiveApp(appId),", text)

# 3. Fix addCustomField
broken_addCustom = r"addCustomField: \(appId, field\) => setConfig\(prev => \(\{ \.\.\.prev, customFields: \{ \.\.\.prev\.customFields,"
fixed_addCustom = r"addCustomField: (appId, field) => get().setConfig(prev => ({ ...prev, customFields: { ...prev.customFields, [appId]: [...(prev.customFields?.[appId] || []), field] } })),"
text = re.sub(broken_addCustom, fixed_addCustom, text, flags=re.MULTILINE)

# 4. Replace external config and search setters
text = re.sub(r"(?<!get\(\)\.)\bsetSearchResults\b", "get().setSearchResults", text)
text = re.sub(r"(?<!get\(\)\.)\bsetConfig\b", "get().setConfig", text)
text = re.sub(r"(?<!get\(\)\.)\bsetGlobalSettings\b", "get().setGlobalSettings", text)
text = re.sub(r"(?<!get\(\)\.)\buserRole\b", "(get().currentUser?.role)", text)
text = re.sub(r"(?<!get\(\)\.)\bactiveCall\b", "get().activeCall", text)

# 5. Method usages
methods = [
    "addRecord", "updateRecord", "deleteRecord", "addHint", "setActiveApp", 
    "setActiveCall", "getNextSequence", "addAccountingEntry", "generateInvoiceEntry",
    "sendNotification", "formatCurrency", "logAction", "participateInEvent", 
    "likeConnectPost", "addConnectComment"
]
for method in methods:
    # Look for boundary, then method, then optional spaces, then (, AND not preceded by get().
    pat = r"(?<!get\(\)\.)\b" + method + r"\s*\("
    repl = r"get()." + method + r"("
    text = re.sub(pat, repl, text)

# 6. We do NOT run fix_comma.py! 
# We maintain all original braces and brackets!

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

print("Redone cleanly.")
