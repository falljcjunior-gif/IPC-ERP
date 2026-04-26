import re

def deduplicate_imports(filepath):
    with open(filepath, 'r') as f:
        text = f.read()
    
    # Remove all instances of the import and then add exactly one at the top.
    import_str_1 = "import { useStore } from '../store';"
    import_str_2 = 'import { useStore } from "../store";'
    import_str_3 = "import { useStore } from '../../store';"
    
    cnt1 = text.count(import_str_1)
    cnt2 = text.count(import_str_2)
    cnt3 = text.count(import_str_3)
    
    if cnt1 > 1:
        text = text.replace(import_str_1 + "\n", "", cnt1 - 1)
    if cnt2 > 1:
        text = text.replace(import_str_2 + "\n", "", cnt2 - 1)
    if cnt3 > 1:
        text = text.replace(import_str_3 + "\n", "", cnt3 - 1)
    
    # Also fix PlatformShell.jsx: "Identifier `useStore` has already been declared" at line 9.
    # It might be exactly consecutive. 
    text = re.sub(r"(import\s+\{\s*useStore\s*\}\s+from\s+['\"].*?['\"];\s*)+", r"\1", text)

    with open(filepath, 'w') as f:
        f.write(text)

deduplicate_imports('src/components/PlatformShell.jsx')
deduplicate_imports('src/modules/production/Production.jsx')
print("Duplicates removed.")
