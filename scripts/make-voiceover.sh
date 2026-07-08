#!/bin/bash
# ============================================================
# make-voiceover.sh — generate studio-quality walkthrough audio
#
# Reads every data-narr narration line out of index.html and
# renders one MP3 per section into assets/vo/<sectionId>.mp3
# using OpenAI's neural TTS. The site plays these automatically
# (Web Speech is only the fallback when a clip is missing).
#
# Usage:
#   OPENAI_API_KEY=sk-... ./scripts/make-voiceover.sh
#   OPENAI_API_KEY=sk-... VOICE=onyx ./scripts/make-voiceover.sh
#
# Voices worth trying: ash (warm/confident — default), onyx (deep),
# echo, alloy, nova, shimmer. Full script is ~2,000 chars ≈ $0.03.
#
# Prefer your OWN voice instead? Skip this script entirely:
# record each section (script = the data-narr text in index.html),
# save as assets/vo/s01.mp3, s02.mp3, s03.mp3, s04.mp3, s05.mp3,
# s05a–s05e.mp3, s06.mp3 — the player picks them up as-is.
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

: "${OPENAI_API_KEY:?Set OPENAI_API_KEY (platform.openai.com/api-keys)}"
VOICE="${VOICE:-ash}"
MODEL="${MODEL:-gpt-4o-mini-tts}"
INSTR="${INSTR:-Warm, confident, plain-spoken American freight agent giving a personal walkthrough. Conversational and unhurried, like explaining to a friend — not an announcer.}"

mkdir -p assets/vo

# pull "<id>\t<narration>" pairs straight from the page
python3 - <<'PY' > /tmp/vo_lines.tsv
import re
src = open('index.html').read()
for m in re.finditer(r'<section[^>]*id="([^"]+)"[^>]*data-narr="([^"]+)"', src):
    text = m.group(2).replace('&amp;','&').replace('&quot;','"')
    print(f"{m.group(1)}\t{text}")
PY

n=0
while IFS=$'\t' read -r id text; do
  n=$((n+1))
  echo "[$n] $id — ${text:0:60}…"
  curl -sf https://api.openai.com/v1/audio/speech \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json,sys;print(json.dumps({'model':'$MODEL','voice':'$VOICE','input':sys.argv[1],'instructions':sys.argv[2],'response_format':'mp3','speed':1.0}))" "$text" "$INSTR")" \
    -o "assets/vo/$id.mp3"
done < /tmp/vo_lines.tsv

echo
echo "Done — $n clips in assets/vo/ ($(du -sh assets/vo | cut -f1))."
echo "Listen locally, then: git add assets/vo && git commit && git push"
