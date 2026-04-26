import re

with open('src/components/RecordModal.jsx', 'r') as f:
    text = f.read()

if "import { useTranslation } from 'react-i18next';" not in text:
    text = text.replace("import { useStore } from '../store';", "import { useStore } from '../store';\nimport { useTranslation } from 'react-i18next';")

if "const { t } = useTranslation();" not in text:
    pat = r"const { data, getModuleAccess, currentUser } = useStore\(\);"
    repl = r"\g<0>\n  const { t } = useTranslation();"
    text = re.sub(pat, repl, text)

# Replace field.label rendering in form
text = text.replace("{field.label}", "{t(field.label)}")

# Replace field.placeholder
text = text.replace("placeholder={field.placeholder}", "placeholder={field.placeholder ? t(field.placeholder) : ''}")

with open('src/components/RecordModal.jsx', 'w') as f:
    f.write(text)

print("RecordModal i18n patched.")
