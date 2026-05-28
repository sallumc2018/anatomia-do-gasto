# Change Provenance

`changes.csv` is the public, sanitized signature log for project changes.

Every agent or AI-assisted tool that changes the project must leave a clear
trace of who changed what:

- actor or agent name;
- tool or surface used, such as Codex, Claude Code, VS Code, Antigravity, or a
  script;
- model name or model family when known, such as GPT-5, Gemini, Opus, Sonnet,
  or Haiku;
- environment;
- changed paths or sanitized path group;
- validation performed;
- privacy status.

This log is not a substitute for Git history. It exists to make concurrent AI
work auditable before commit and across local tools.

Do not write prompts, credentials, private operational logs, personal files,
raw secrets, unpublished sensitive data, or full conversations here. If the
work is private or operational, write only a public sanitized row and keep the
detailed trace under `.local/memory/`.
