# Ponytail AI → Antigravity Integration Walkthrough

## Overview

Ponytail AI is **not a sub-agent**, but an **Antigravity Plugin** consisting of six independent Skills.

Its primary purpose is to force the AI to think like a **lazy senior developer** by always preferring the **simplest, smallest, and most maintainable solution** before introducing additional complexity.

---

# Architecture

## Before

```text
C:\Users\fgcyb\OneDrive\Documents\G Project\ponytail\
```

- Isolated project
- Not globally registered
- Only available manually

---

## After

```text
C:\Users\fgcyb\.gemini\
└── config
    └── plugins
        └── ponytail
            ├── plugin.json
            ├── AGENTS.md
            └── skills
                ├── ponytail
                │   └── SKILL.md
                ├── ponytail-review
                │   └── SKILL.md
                ├── ponytail-audit
                │   └── SKILL.md
                ├── ponytail-debt
                │   └── SKILL.md
                ├── ponytail-gain
                │   └── SKILL.md
                └── ponytail-help
                    └── SKILL.md
```

Now the plugin is installed **globally**, making it available in every Antigravity project automatically.

---

# File Changes

| File | Action | Description |
|------|--------|-------------|
| `plugins/ponytail/plugin.json` | **Created** | Plugin manifest (name, version, description) |
| `plugins/ponytail/AGENTS.md` | **Created** | Global Ponytail rules automatically loaded in every session |
| `plugins/ponytail/skills/ponytail/SKILL.md` | **Created** | Main Ponytail skill (Lite / Full / Ultra modes) |
| `plugins/ponytail/skills/ponytail-review/SKILL.md` | **Created** | Reviews code changes for over-engineering |
| `plugins/ponytail/skills/ponytail-audit/SKILL.md` | **Created** | Audits an entire repository for unnecessary complexity |
| `plugins/ponytail/skills/ponytail-debt/SKILL.md` | **Created** | Tracks technical debt using `ponytail:` comments |
| `plugins/ponytail/skills/ponytail-gain/SKILL.md` | **Created** | Generates benchmark and impact scoreboard |
| `plugins/ponytail/skills/ponytail-help/SKILL.md` | **Created** | Quick reference for all Ponytail commands |

---

# How It Works

After restarting the Antigravity session, Ponytail is automatically loaded for **every project**.

Default mode:

```text
Full
```

Decision ladder:

```text
YAGNI
    ↓
Standard Library
    ↓
Native Solution
    ↓
One-Liner
    ↓
Minimum Maintainable Code
```

The AI always attempts the smallest possible solution before proposing more complex alternatives.

---

# Available Commands

| Command | Effect |
|----------|--------|
| `ponytail` | Enable Ponytail mode |
| `be lazy` | Activate lazy senior developer reasoning |
| `simplest solution` | Force minimal implementation |
| `ponytail lite` | Lightweight mode with suggestions only |
| `ponytail ultra` | Aggressively challenges every requirement using YAGNI |
| `stop ponytail` | Disable Ponytail mode |
| `normal mode` | Return to standard behavior |
| `ponytail review` | Review current changes for over-engineering |
| `/ponytail-review` | Same as above |
| `audit this codebase` | Scan the repository for unnecessary complexity |
| `/ponytail-audit` | Same as above |
| `ponytail debt` | Show all `ponytail:` technical debt comments |
| `/ponytail-debt` | Same as above |
| `ponytail gain` | Display performance and simplification scoreboard |
| `/ponytail-gain` | Same as above |
| `ponytail help` | Show quick reference guide |
| `/ponytail-help` | Same as above |

---

# Example

### User

```text
ponytail - add a cache for API responses
```

### AI

```python
@lru_cache(maxsize=1000)
def fetch(...):
    ...
```

**Explanation**

Instead of creating a custom caching layer, Ponytail chooses the built-in `functools.lru_cache()` implementation because it is:

- Simpler
- Faster to implement
- Easier to maintain

Additional complexity should only be introduced if benchmarking proves the standard solution is insufficient.

---

# Philosophy

Ponytail follows this mindset:

> **The best code is the code you never had to write.**

Every implementation is evaluated in the following order:

1. Can it be removed?
2. Can the requirement be simplified?
3. Can the standard library solve it?
4. Can native APIs solve it?
5. Can it be reduced to a one-liner?
6. Only then should custom code be written.

---

# Notes

- No `requirements.txt` is required.
- Ponytail is **100% prompt/skill-based**.
- No additional Python packages are needed.
- The plugin is installed **globally**, making it available in every workspace—not only `couple_private_web`.
- Restart the Antigravity IDE session after installation so the plugin is detected.
- If using the **agy CLI**, open a new terminal after installation so the updated `PATH` is recognized.