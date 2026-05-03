#!/usr/bin/env python3
"""Remove emoji and decorative unicode symbols from TSX UI files."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "app"

# Broad emoji / pictographic ranges + variation selector
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"  # Misc symbols + supplemental
    "\U00002600-\U000026FF"  # Misc symbols
    "\U00002700-\U000027BF"  # Dingbats
    "\U0001F600-\U0001F64F"  # Emoticons
    "\U0001F680-\U0001F6FF"  # Transport & map
    "\U0001F900-\U0001F9FF"  # Supplemental symbols
    "\uFE0F"  # VS16
    "]+",
    re.UNICODE,
)

# Standalone symbols often used like emoji
EXTRA_SYMS = "✓✔✗✖★☆⚠🔧😬🎯📌✂📝🏠💊🏋️💄📱⏱▲▼🟢🟡🟠🔴🗺️🌟😤"

count_files = 0
for path in sorted(ROOT.rglob("*.tsx")):
    text = path.read_text(encoding="utf-8")
    orig = text
    text = EMOJI_RE.sub("", text)
    for ch in EXTRA_SYMS:
        text = text.replace(ch, "")
    # Tidy double spaces in strings (conservative)
    text = re.sub(r" {2,}", " ", text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        count_files += 1

print(f"Processed TSX files under src/app; modified {count_files} files.", file=sys.stderr)
