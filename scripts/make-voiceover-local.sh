#!/bin/bash
# ============================================================
# make-voiceover-local.sh — FREE offline voiceover (macOS)
#
# Renders every data-narr line in index.html to assets/vo/<id>.m4a
# using the built-in macOS `say` voice + afconvert. No API key, no
# internet. Quality is decent-but-synthetic (Samantha) — a stopgap
# so the walkthrough always has real, reliable audio. For a truly
# natural voice, use scripts/make-voiceover.sh (neural TTS) instead;
# it writes the SAME filenames, so it's a drop-in upgrade.
#
# Usage:  ./scripts/make-voiceover-local.sh          # Samantha
#         VOICE=Alex ./scripts/make-voiceover-local.sh
#
# List installed voices:  say -v '?'
# Better voices install via System Settings ▸ Accessibility ▸
# Spoken Content ▸ System Voice ▸ Manage Voices (English • Premium).
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."
VOICE="${VOICE:-Samantha}"
RATE="${RATE:-172}"          # words/min — lower = calmer
PAGE="${PAGE:-index.html}"   # source HTML to read narration from
OUTDIR="${OUTDIR:-assets/vo}"   # where the .m4a clips are written
mkdir -p "$OUTDIR"
tmp="$(mktemp -d)"

PAGE="$PAGE" python3 - <<'PY' > "$tmp/lines.tsv"
import re, os
src = open(os.environ['PAGE']).read()
for m in re.finditer(r'<section[^>]*id="([^"]+)"[^>]*data-narr="([^"]+)"', src):
    text = m.group(2).replace('&amp;','&').replace('&quot;','"')
    print(f"{m.group(1)}\t{text}")
PY

n=0
while IFS=$'\t' read -r id text; do
  n=$((n+1))
  echo "[$n] $id — ${text:0:56}…"
  say -v "$VOICE" -r "$RATE" -o "$tmp/$id.aiff" "$text"
  afconvert "$tmp/$id.aiff" "$OUTDIR/$id.m4a" -f m4af -d aac >/dev/null
done < "$tmp/lines.tsv"

rm -rf "$tmp"
echo
echo "Done — $n clips in assets/vo/ ($(du -sh assets/vo | cut -f1))."
