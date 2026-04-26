import re

with open('src/store/slices/createOperationsSlice.js', 'r') as f:
    text = f.read()

# Fix the truncated addCustomField
broken_addCustom = r"addCustomField: \(appId, field\) => setConfig\(prev => \(\{ \.\.\.prev, customFields: \{ \.\.\.prev\.customFields,$"
fixed_addCustom = r"addCustomField: (appId, field) => get().setConfig(prev => ({ ...prev, customFields: { ...prev.customFields, [appId]: [...(prev.customFields?.[appId] || []), field] } })),"
text = re.sub(broken_addCustom, fixed_addCustom, text, flags=re.MULTILINE)

# Replace remaining setters
text = re.sub(r"(?<!get\(\)\.)\bsetSearchResults\b", "get().setSearchResults", text)
text = re.sub(r"(?<!get\(\)\.)\bsetConfig\b", "get().setConfig", text)
text = re.sub(r"(?<!get\(\)\.)\bsetGlobalSettings\b", "get().setGlobalSettings", text)

# Replace userRole, but not when it's declaring it or passed as param
# Usually `userRole !== 'SUPER_ADMIN'`
text = re.sub(r"(?<!get\(\)\.)\buserRole\b", "(get().currentUser?.role)", text)

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

print("Config setters patched.")
