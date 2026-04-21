import os
import re

def check_animate_presence():
    src_dir = 'src'
    errors = []
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Check if <AnimatePresence is used
                        if '<AnimatePresence' in content:
                            # Check if it is imported from framer-motion
                            # Matches: import { ..., AnimatePresence, ... } from 'framer-motion'
                            # or import { AnimatePresence } from 'framer-motion'
                            import_pattern = r"import\s+\{([^}]*)\}\s+from\s+['\"]framer-motion['\"]"
                            match = re.search(import_pattern, content)
                            
                            if not match or 'AnimatePresence' not in match.group(1):
                                errors.append(path)
                except Exception as e:
                    print(f"Error reading {path}: {e}")
    
    if errors:
        print("Files using AnimatePresence without explicit import:")
        for err in errors:
            print(err)
    else:
        print("No missing AnimatePresence imports found.")

if __name__ == "__main__":
    check_animate_presence()
