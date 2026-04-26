import re

with open('src/store/slices/createOperationsSlice.js', 'r') as f:
    text = f.read()

methods = [
    "addRecord", "updateRecord", "deleteRecord", "addHint", "setActiveApp", 
    "setActiveCall", "getNextSequence", "addAccountingEntry", "generateInvoiceEntry",
    "sendNotification", "formatCurrency", "logAction", "participateInEvent", 
    "likeConnectPost", "addConnectComment"
]

for method in methods:
    # Only replace usages like method(...) but not declarations like method: (
    # wait! Javascript allows spaces: ` method  (`
    # Let's use regex: r"\b" + method + r"\s*\("
    # But ONLY replace if it isn't `get().method(` already.
    pat = r"(?<!get\(\)\.)\b" + method + r"\s*\("
    repl = r"get()." + method + r"("
    text = re.sub(pat, repl, text)

# There is a problem: if the method is passed as a callback: `c => addRecord(...)`. It has `(`. So it works.
# What about destructuring? `const { addRecord } = get();` ? Python regex is blind to that. But in the slice we did not destructure.

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

print("Slice Methods Patched")
