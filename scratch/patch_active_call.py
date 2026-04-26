import re

with open('src/store/slices/createOperationsSlice.js', 'r') as f:
    text = f.read()

text = re.sub(r"(?<!get\(\)\.)\bactiveCall\b", r"get().activeCall", text)

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

print("Active call patched.")
