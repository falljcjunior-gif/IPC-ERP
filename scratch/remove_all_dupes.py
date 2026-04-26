import os, glob

def dedupe_file(filepath):
    with open(filepath, 'r') as f:
        text = f.read()
    
    lines = text.split('\n')
    new_lines = []
    seen = False
    changed = False
    
    for line in lines:
        if 'import { useStore }' in line:
            if not seen:
                seen = True
                new_lines.append(line)
            else:
                changed = True
                continue
        else:
            new_lines.append(line)
            
    if changed:
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
        print("Fixed", filepath)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            dedupe_file(os.path.join(root, file))

