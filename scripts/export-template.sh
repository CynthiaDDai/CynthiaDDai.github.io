#!/usr/bin/env bash
# Refresh the public template (the `upstream` branch) from this site (`main`).
# Every file tracked on main is copied, except the personal paths below, which keep the template's own versions.
# Publish afterwards with: git push template upstream:main
set -euo pipefail

personal=(
  src/content src/config/site.json src/styles/fonts.css config.jsonc LICENSE
  public/cv.pdf public/assets public/notes public/fonts/README.txt public/fonts/huiwen-mincho.woff2 public/fonts/huiwen-mincho-LICENSE.txt
  docs/audits terminal_personal_website_master_spec.md scripts/export-template.sh
)
# Words that only appear in personal content; the export stops if any of them would reach the template.
markers='waterloo|d9dai|meow-thematics|satriano|cynthiaddai\.github\.io'

exclude=()
for path in "${personal[@]}"; do exclude+=(":(exclude)$path"); done
source=$(git rev-parse --short main)
worktree=$(mktemp -d)
git worktree add -q "$worktree" upstream
trap 'git worktree remove --force "$worktree"' EXIT
cd "$worktree"

# Remove, then restore from main, so files deleted on main disappear from the template too.
git rm -r -q --ignore-unmatch -- . "${exclude[@]}"
git checkout main -- . "${exclude[@]}"
# git grep exits 0 on a match, 1 on none, and higher on an error; only 1 may continue.
status=0
git grep --cached -I -n -i -E "$markers" || status=$?
if [ "$status" -ne 1 ]; then
  [ "$status" -eq 0 ] && echo "Personal text would reach the template (above). Add its file to the personal list, or remove the text." >&2
  exit 1
fi
if git diff --cached --quiet; then
  echo "The template is already up to date with main ($source)."
else
  git diff --cached --stat
  git commit -q -m "Update from the personal site ($source)"
  echo "Committed to upstream. Publish with: git push template upstream:main"
fi
