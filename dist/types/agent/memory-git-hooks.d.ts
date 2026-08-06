/**
 * Git hook scripts installed into memfs memory repos.
 *
 * The pre-commit hook validates memory markdown frontmatter; the post-commit
 * hook mirrors commits to an optional user-configured memory-repository
 * remote. Both are (re)installed by the CLI harness on clone/pull/init —
 * see memory-git.ts.
 */
/**
 * Bash pre-commit hook that validates frontmatter in memory .md files.
 *
 * Rules:
 * - Frontmatter is REQUIRED (must start with ---)
 * - Must be properly closed with ---
 * - Required fields: description (non-empty string)
 * - read_only is a PROTECTED field: agent cannot add, remove, or change it.
 *   Files where HEAD has read_only: true cannot be modified at all.
 * - Only allowed agent-editable key: description
 * - Legacy key 'limit' is tolerated for backward compatibility
 * - read_only may exist (from server) but agent must not change it
 */
export declare const PRE_COMMIT_HOOK_SCRIPT = "#!/usr/bin/env bash\n# Validate frontmatter in staged memory .md files\n# Installed by Letta Code CLI\n\nAGENT_EDITABLE_KEYS=\"description\"\nPROTECTED_KEYS=\"read_only\"\nALL_KNOWN_KEYS=\"description read_only limit\"\nerrors=\"\"\n\n# Skills must always be directories: skills/<name>/SKILL.md\n# Reject legacy flat skill files (both current and legacy repo layouts).\nfor file in $(git diff --cached --name-only --diff-filter=ACMR | grep -E '^(memory/)?skills/[^/]+\\.md$' || true); do\n  errors=\"$errors\\n  $file: invalid skill path (skills must be folders). Use skills/<name>/SKILL.md\"\ndone\n\n# Helper: extract a frontmatter value from content\nget_fm_value() {\n  local content=\"$1\" key=\"$2\"\n  local closing_line\n  closing_line=$(echo \"$content\" | tail -n +2 | grep -n '^---$' | head -1 | cut -d: -f1)\n  [ -z \"$closing_line\" ] && return\n  echo \"$content\" | tail -n +2 | head -n $((closing_line - 1)) | grep \"^$key:\" | cut -d: -f2- | sed 's/^ *//;s/ *$//'\n}\n\n# Match .md files under system/ or reference/ (with optional memory/ prefix).\n# Skip skill SKILL.md files \u2014 they use a different frontmatter format.\nfor file in $(git diff --cached --name-only --diff-filter=ACM | grep -E '^(memory/)?(system|reference)/.*\\.md$'); do\n  staged=$(git show \":$file\")\n\n  # Frontmatter is required\n  first_line=$(echo \"$staged\" | head -1)\n  if [ \"$first_line\" != \"---\" ]; then\n    errors=\"$errors\\n  $file: missing frontmatter (must start with ---)\"\n    continue\n  fi\n\n  # Check frontmatter is properly closed\n  closing_line=$(echo \"$staged\" | tail -n +2 | grep -n '^---$' | head -1 | cut -d: -f1)\n  if [ -z \"$closing_line\" ]; then\n    errors=\"$errors\\n  $file: frontmatter opened but never closed (missing closing ---)\"\n    continue\n  fi\n\n  # Check read_only protection against HEAD version\n  head_content=$(git show \"HEAD:$file\" 2>/dev/null || true)\n  if [ -n \"$head_content\" ]; then\n    head_ro=$(get_fm_value \"$head_content\" \"read_only\")\n    if [ \"$head_ro\" = \"true\" ]; then\n      errors=\"$errors\\n  $file: file is read_only and cannot be modified\"\n      continue\n    fi\n  fi\n\n  # Extract frontmatter lines\n  frontmatter=$(echo \"$staged\" | tail -n +2 | head -n $((closing_line - 1)))\n\n  # Track required fields\n  has_description=false\n\n  # Validate each line\n  while IFS= read -r line; do\n    [ -z \"$line\" ] && continue\n    # Skip YAML multiline continuation lines (indented lines that continue a previous value)\n    case \"$line\" in\n      \" \"*|$'\t'*) continue ;;\n    esac\n\n    key=$(echo \"$line\" | cut -d: -f1 | tr -d ' ')\n    value=$(echo \"$line\" | cut -d: -f2- | sed 's/^ *//;s/ *$//')\n\n    # Check key is known\n    known=false\n    for k in $ALL_KNOWN_KEYS; do\n      if [ \"$key\" = \"$k\" ]; then\n        known=true\n        break\n      fi\n    done\n    if [ \"$known\" = \"false\" ]; then\n      errors=\"$errors\\n  $file: unknown frontmatter key '$key' (allowed: $ALL_KNOWN_KEYS)\"\n      continue\n    fi\n\n    # Check if agent is trying to modify a protected key\n    for k in $PROTECTED_KEYS; do\n      if [ \"$key\" = \"$k\" ]; then\n        # Compare against HEAD \u2014 if value changed (or key was added), reject\n        if [ -n \"$head_content\" ]; then\n          head_val=$(get_fm_value \"$head_content\" \"$key\")\n          if [ \"$value\" != \"$head_val\" ]; then\n            errors=\"$errors\\n  $file: '$key' is a protected field and cannot be changed by the agent\"\n          fi\n        else\n          # New file with read_only \u2014 agent shouldn't set this\n          errors=\"$errors\\n  $file: '$key' is a protected field and cannot be set by the agent\"\n        fi\n      fi\n    done\n\n    # Validate value types\n    case \"$key\" in\n      limit)\n        # Legacy field accepted for backward compatibility.\n        ;;\n      description)\n        has_description=true\n        if [ -z \"$value\" ]; then\n          errors=\"$errors\\n  $file: 'description' must not be empty\"\n        fi\n        ;;\n    esac\n  done <<< \"$frontmatter\"\n\n  # Check required fields\n  if [ \"$has_description\" = \"false\" ]; then\n    errors=\"$errors\\n  $file: missing required field 'description'\"\n  fi\n\n  # Check if protected keys were removed (existed in HEAD but not in staged)\n  if [ -n \"$head_content\" ]; then\n    for k in $PROTECTED_KEYS; do\n      head_val=$(get_fm_value \"$head_content\" \"$k\")\n      if [ -n \"$head_val\" ]; then\n        staged_val=$(get_fm_value \"$staged\" \"$k\")\n        if [ -z \"$staged_val\" ]; then\n          errors=\"$errors\\n  $file: '$k' is a protected field and cannot be removed by the agent\"\n        fi\n      fi\n    done\n  fi\ndone\n\nif [ -n \"$errors\" ]; then\n  echo \"Frontmatter validation failed:\"\n  echo -e \"$errors\"\n  exit 1\nfi\n";
/**
 * Install the pre-commit hook for frontmatter validation.
 */
export declare function installPreCommitHook(dir: string): void;
/**
 * Bash post-commit hook that pushes memfs commits to an optional additional
 * git remote (the "memory repository" endpoint).
 *
 * Reads the remote URL from the repo's local git config
 * (`letta.memoryRepository.url`). No-op when the key is unset. Push runs
 * asynchronously in the background so commits stay fast, and failures are
 * logged to `.git/memory-repository-push.log` without blocking the user.
 *
 * URL is per-repo by design: each agent's memfs repo has its own `.git/config`,
 * so the endpoint is scoped to a single agent automatically.
 */
export declare const POST_COMMIT_HOOK_SCRIPT = "#!/usr/bin/env bash\n# Letta Code: push memfs commits to the configured memory-repository remote.\n# Installed by Letta Code CLI. Do not edit by hand \u2014 regenerated on startup.\nurl=$(git config --local --get letta.memoryRepository.url 2>/dev/null)\n[ -z \"$url\" ] && exit 0\nbranch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null) || exit 0\n[ -z \"$branch\" ] && exit 0\n# Reflection and other harness worktrees commit on temporary branches; only the\n# main MemFS checkout should push to the optional memory repository remote.\n[ \"$branch\" != \"main\" ] && exit 0\nlog=\"$(git rev-parse --git-dir)/memory-repository-push.log\"\n(\n  {\n    printf '\\n--- %s %s on %s ---\\n' \"$(date '+%Y-%m-%dT%H:%M:%S%z')\" \"$(git rev-parse --short HEAD)\" \"$branch\"\n    git push --quiet \"$url\" \"$branch\":\"$branch\" 2>&1\n    echo \"exit=$?\"\n  } >> \"$log\" 2>&1\n) &\ndisown 2>/dev/null || true\nexit 0\n";
/**
 * Install the post-commit hook that pushes to `letta.memoryRepository.url`.
 * Hook is harmless when the config key is unset (no-ops on every commit).
 */
export declare function installPostCommitHook(dir: string): void;
//# sourceMappingURL=memory-git-hooks.d.ts.map