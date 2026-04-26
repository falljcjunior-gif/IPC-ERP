import re

with open('src/store/slices/createOperationsSlice.js', 'r') as f:
    text = f.read()

# Only replace `  };` (exactly 2 spaces indent) with `  },`
text = re.sub(r"^  \};\s*$", r"  },", text, flags=re.MULTILINE)

with open('src/store/slices/createOperationsSlice.js', 'w') as f:
    f.write(text)

print("Endings fixed.")
