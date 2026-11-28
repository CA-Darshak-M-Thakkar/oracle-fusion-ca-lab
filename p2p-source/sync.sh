#!/usr/bin/env bash
# One command: regenerate the lab's EBS/Fusion screen data from the YAML here, then check the lab builds.
# usage:  ./sync.sh            (inside <lab-repo>/p2p-source)   or   ./sync.sh /path/to/oracle-fusion-ca-lab
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
LAB="${1:-$(dirname "$HERE")}"
python3 "$HERE/build.py" "$LAB"
cd "$LAB" && npm run build
echo "Lab data regenerated from $HERE and the site builds. Commit src/data/ebs/*.json and push to publish."
