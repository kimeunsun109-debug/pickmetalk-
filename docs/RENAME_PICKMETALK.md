# Rename guide — clear PickMeTalk names

Old names were easy to mix up. Use these going forward:

| Role | Old GitHub / folder | **New name** |
|------|---------------------|--------------|
| Product (this app) | `app_girl-friend` | **`pickmetalk`** |
| Ops (Windows MJ) | `ai_girlfriend_app` | **`pickmetalk-ops`** |

Brand / Android id stay the same: `com.pickmetalk.app`, `pickmetalk.com`.

---

## A. Rename GitHub repositories (you do this in the browser)

### 1) Product
1. Open https://github.com/kimeunsun109-debug/app_girl-friend/settings
2. Scroll to **Repository name** → set `pickmetalk` → **Rename**
3. GitHub keeps redirects from the old URL for git/clone for a while

### 2) Ops
1. Open https://github.com/kimeunsun109-debug/ai_girlfriend_app/settings
2. Rename to `pickmetalk-ops` → **Rename**

### 3) After rename — reconnect
- **Vercel**: Project → Settings → Git → confirm repo is `pickmetalk` (usually auto)
- **Cursor Cloud Agents**: re-select `pickmetalk` / `pickmetalk-ops` if the agent environment still points at old names
- **Supabase**: no change (project is separate from GitHub name)

---

## B. Rename local Windows folders (PowerShell)

```powershell
# Close Cursor/VS Code windows that have these folders open first.

# Product
Rename-Item -Path "C:\Users\user\app_girl-friend" -NewName "pickmetalk"
cd C:\Users\user\pickmetalk
git remote set-url origin https://github.com/kimeunsun109-debug/pickmetalk.git
git remote -v

# Ops (if you have a local clone under the old name)
if (Test-Path "C:\Users\user\ai_girlfriend_app") {
  Rename-Item -Path "C:\Users\user\ai_girlfriend_app" -NewName "pickmetalk-ops"
  cd C:\Users\user\pickmetalk-ops
  git remote set-url origin https://github.com/kimeunsun109-debug/pickmetalk-ops.git
  git remote -v
}
```

If ops was never cloned:

```powershell
cd C:\Users\user
git clone https://github.com/kimeunsun109-debug/pickmetalk-ops.git
```

---

## C. What breaks if you only rename the folder (not GitHub)

| Thing | Effect |
|-------|--------|
| `git push` / `git pull` | Still works (remote URL unchanged) |
| Cursor / IDE recent paths | Need to **File → Open Folder** on the new path |
| Shortcuts / Task Scheduler | Update any `.bat` / scheduled tasks pointing at old path |
| Ops `backup-local-before-sync.ps1` | Updated to `C:\Users\user\pickmetalk-ops` |

## D. What breaks if you rename GitHub but not local remotes

`git push` fails until:

```powershell
git remote set-url origin https://github.com/kimeunsun109-debug/pickmetalk.git
```

---

## E. npm package names (already updated in code)

- Product `package.json` → `"name": "pickmetalk"`
- Ops `package.json` → `"name": "pickmetalk-ops"`

These do **not** require republishing; they are private apps.
