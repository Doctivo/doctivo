# DOCTIVO - Management Portal

## VS Code & GitHub Setup
To check which GitHub account is logged in with VS Code:
1. Click the **Accounts** icon (person silhouette) in the bottom-left corner of VS Code.
2. It will show **"Signed in as [Your GitHub Username]"**.
3. Alternatively, open the terminal and type `gh auth status` (if GitHub CLI is installed).

## Development
- Run `npm run dev` to start the app.
- Standard port is now set to **3000** for better compatibility with cloud workstations.

## Database Repairs
If you encounter "Missing Column" or "Constraint" errors:
1. Go to `/admin/admins`.
2. Click **"Repair DB"**.
