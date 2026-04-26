import re

with open('src/store/slices/createOperationsSlice.js', 'r') as f:
    text = f.read()

# Replace `};` with `},` globally except at the very end of the file.
# Actually, inside an object literal, `};` is wrong everywhere except inner scopes!
# Wait, let's target just these specific ones.
methods = ["playRingtone", "acceptCall", "rejectCall", "resetAllData", "seedDemoData"]

# Replace `};` right before the next method name.
# Or just replace `};` if it's placed indented at 2 spaces?
text = re.sub(r"^\s*\}\;\s*$", r"  },", text, flags=re.MULTILINE)

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

print("Fixed semicolons.")
