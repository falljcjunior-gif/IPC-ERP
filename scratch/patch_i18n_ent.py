import re

with open('src/components/EnterpriseView.jsx', 'r') as f:
    text = f.read()

# Add the import if not exists
if "import { useTranslation } from 'react-i18next';" not in text:
    text = text.replace("import { useStore } from '../store';", "import { useStore } from '../store';\nimport { useTranslation } from 'react-i18next';")

# Add the hook call inside EnterpriseView
if "const { t } = useTranslation();" not in text:
    pat = r"const EnterpriseView = \(\{[\s\S]*?\}\) => \{"
    repl = r"\g<0>\n  const { t } = useTranslation();"
    text = re.sub(pat, repl, text)

# Replace field.label with t(field.label) or something similar.
text = text.replace("{modelSchema.fields?.[col]?.label || col}", "{t(modelSchema.fields?.[col]?.label || col)}")

with open('src/components/EnterpriseView.jsx', 'w') as f:
    f.write(text)

print("EnterpriseView i18n patched.")
