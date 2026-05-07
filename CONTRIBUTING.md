# Contributing Guide

> This doc is the source of truth for how we work together. Read it once, follow it always.

---

## The Golden Rules

- **Never push directly to `main`**
- **Every change goes through a PR**
- **At least 1 person reviews before merge**
- **Keep branches short-lived — open, do the work, merge, done**

---

## Branch Naming

```
feature/what-you-are-building
fix/what-you-are-fixing
chore/what-you-are-cleaning-up
```

Examples:
```
feature/auth-login
fix/navbar-mobile-break
chore/remove-unused-deps
```

---

## Day-to-Day Flow

### 1. Start fresh from main
```bash
git checkout main
git pull origin main
```

### 2. Create your branch
```bash
git checkout -b feature/your-thing
```

### 3. Work and commit often
```bash
git add .
git commit -m "feat: add login form validation"
```

### 4. Before pushing — sync with main
```bash
git fetch origin
git rebase origin/main
# fix conflicts here if any, then:
git rebase --continue
```

### 5. Push and open a PR
```bash
git push origin feature/your-thing
```
Then open a PR on GitHub. Fill in what you did and why.

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/). Keep them short and use present tense.

| Prefix | When to use |
|--------|-------------|
| `feat:` | new feature |
| `fix:` | bug fix |
| `chore:` | cleanup, deps, config |
| `refactor:` | code change, no behavior change |
| `docs:` | docs only |
| `style:` | formatting only |

**Write the WHY, not the what.** The diff already shows what changed.

```
# bad
git commit -m "changed button color"

# good
git commit -m "fix: button was invisible on dark backgrounds"
```

---

## Pull Requests

- **Title**: Same format as a commit message (`feat: ...`, `fix: ...`)
- **Description**: What did you change and why? Any context the reviewer needs?
- **Size**: Keep PRs small. One feature / one fix per PR. Big PRs don't get reviewed properly.
- **Reviews**: At least **1 approval** required before merging. Tag someone explicitly.

---

## Code Review

When reviewing someone's PR:
- Check if the code does what it says
- Look for obvious bugs or edge cases
- Don't nitpick style unless it actually matters
- Approve or request changes — don't leave it in limbo

When your PR is reviewed:
- Don't take feedback personally
- Respond to every comment (resolve or discuss)
- Don't merge until approved

---

## Resolving Conflicts

If your branch has conflicts with main:

```bash
git fetch origin
git rebase origin/main
# open the conflicting files, fix them
git add .
git rebase --continue
git push origin feature/your-thing --force-with-lease
```

**Never use `--force` alone. Always use `--force-with-lease`.**

---

## What NOT to Commit

Add these to `.gitignore` and never push them:

```
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
```

**Never commit secrets, API keys, or passwords. Ever.**

---

## GitHub Branch Protection (set this up once)

Go to **Settings → Branches → Add rule on `main`**:

- ✅ Require a pull request before merging
- ✅ Require at least 1 approval
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

---

## Communication

Git workflow only works if we talk. Before touching a file someone else might be working on — just say so in the group chat. Two minutes of heads-up saves two hours of merge hell.

---

*Questions or want to change something in this doc? Open a PR.*
