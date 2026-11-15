# Contributing to SourceWiki

Thank you for your interest in contributing to SourceWiki (WikiSourceVerifier)! We welcome contributions from developers, designers, translators, and documentation writers of all experience levels.

SourceWiki uses a hybrid development workflow:
- **Phabricator** is used for task tracking, bug reporting, and feature discussions.
- **GitHub** is used for Git version control, code review, and merging Pull Requests.

This guide outlines our end-to-end contribution workflow to help you get started quickly and smoothly.

---

## 1. Finding and Claiming a Task

Before writing any code, select an issue to work on:

1. Visit the [SourceWiki Phabricator project board](https://phabricator.wikimedia.org/tag/sourcewiki/).
2. Look for open tasks. If you are new to the codebase, check tasks tagged with [`good first task`](https://phabricator.wikimedia.org/tag/good_first_task/).
3. **Claim the task**:
   - Leave a comment on the Phabricator ticket stating that you intend to work on it.
   - Assign the task to yourself (or request assignment) and move the status to **In Progress** to avoid duplicate work with other contributors.

---

## 2. Setting Up the Local Development Environment

### Prerequisites
- **Node.js 24**: The repository provides a `.nvmrc` file pinning Node 24.
  ```bash
  nvm use
  ```
- **Git**
- **MariaDB** (or use the built-in SQLite mode for local testing)

### Fork and Clone
1. Fork the [SourceWiki repository](https://github.com/Tiisu/SourceWiki) to your personal GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/SourceWiki.git
   cd SourceWiki
   git remote add upstream https://github.com/Tiisu/SourceWiki.git
   ```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local database settings or SQLite
npm run dev
```
The backend API server will start on `http://localhost:5000`.

### Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite development server will start on `http://localhost:5173`.

---

## 3. Branch Naming Convention

Always create a dedicated feature branch from the latest `main` branch before making changes:

```bash
git checkout main
git pull upstream main
git checkout -b <branch-name>
```

**Branch naming rule**: Include the Phabricator task ID in your branch name:
- Format: `T<TaskID>-short-description` or `T<TaskID>/short-description`
- Examples:
  - `T444769-add-contributing-guide`
  - `T444772/accessible-mobile-menu-button`
  - `T444771/pin-node-24-nvmrc`

---

## 4. Making Changes & Testing Locally

1. Keep your changes focused strictly on the task you claimed. Avoid mixing unrelated refactoring or formatting changes into the same patch.
2. **Run local checks and tests before committing**:
   - **Backend tests**:
     ```bash
     cd backend
     npm test
     ```
   - **Frontend build & type checking**:
     ```bash
     cd frontend
     npm run build
     ```
3. Ensure no temporary debug logs (`console.log`), unused imports, or leftover artifacts are committed.

---

## 5. Commit Messages

Commit messages should be clear, concise, and reference the associated Phabricator task.

### Recommended Format:
```
T<TaskID>: Brief summary of the change in imperative mood

Detailed explanation of why the change was made, what was updated,
and any relevant implementation details.

Bug: T<TaskID>
```

**Example:**
```
T444771: Add .nvmrc pinning Node 24 and configure engines

Add .nvmrc at the repository root pinning Node version 24.
Add engines field to backend and frontend package.json specifying >=24.0.0.
Update README.md prerequisites and clone instructions to mention nvm use.

Bug: T444771
```

---

## 6. Opening a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push -u origin <branch-name>
   ```
2. Open a Pull Request against the `main` branch of `Tiisu/SourceWiki`.
3. Set the PR title to follow the commit convention (e.g. `T444769: Add CONTRIBUTING.md describing workflow`).
4. Fill out the Pull Request template completely:
   - Link to the Phabricator task.
   - Summarize what changed.
   - Detail the steps to test locally.
   - Include before/after screenshots for any UI changes.
   - Verify the checklist items.

---

## 7. Code Review & Landing Changes

1. **Automated Review & CI**:
   - Pull Requests are automatically evaluated by GitHub Actions for code quality, security checks (GitGuardian), and repository conventions.
   - If automated checks request changes, address them by pushing additional commits to your branch.
2. **Maintainer Review**:
   - Maintainers will review your patch and approve it (`Press Q`).
   - Once approved and verified, maintainers will merge your Pull Request into `main`.
3. **Closing the Task**:
   - When the PR is merged, the associated Phabricator task will be marked as resolved.
