# Modern Resume Development Process & Rules

This document defines the core philosophy, technical standards, and rules of engagement for AI agents and human developers working across the Modern Resume project suite.

## 1. Rules of Engagement (Agent-User Collaboration)

### **Conversation Kick-off**

- When starting a new work conversation, the agent **MUST** notify the user that it has loaded the centralized development process into the current context and is aware of the team-specific guidelines.
- Always reference the document using its public URL: `https://github.com/coderbunker/modern-resume-env/blob/main/.agent/PROCESS.md` (not the local file path).

### **No Automatic Commits or Pushes**

The AI agent **MUST NOT** automatically execute `git commit` or `git push` commands.

- **Stage changes only**: The agent may use `git add` to prepare changes if requested, but should generally leave this to the user.
- **Inform the user**: After making file modifications, the agent should inform the user which files were changed and suggest the next steps (e.g., running tests, reviewing diffs).
- **User control**: The final decision to commit and push code belongs to the user. The agent should only provide the command for the user to run or wait for explicit confirmation to run it on their behalf.
- **Conditional Permissions**: The user may grant the agent temporary permission to commit/push (e.g., for batch fixes). However, the agent MUST only exercise this permission within the scope of a well-defined, already agreed-upon, and documented task list.
- **Feature Branches**: All changes MUST be made on specialized feature branches (e.g., `feat/`, `fix/`, `chore/`).
  - **Synchronization**: Before starting work and before proposing changes, ensure the current feature branch is up-to-date with the `main` branch (e.g., via `git merge main` or `git rebase main`).

### **Proactive but Respectful**

- **Approval Process**: Request approval via an `implementation_plan.md` artifact before execution.
  - **Exception**: For ongoing evaluations or complex architectural changes already documented in a proposal (e.g., in `docs/proposed/`), prefer **additive changes directly to the proposal document** to maintain a complete project history in one place.
- **Proactive Document Maintenance**: When new general guidelines or technical standards are established during a task, the agent should proactively update this `PROCESS.md` file to ensure the centralized knowledge remains current.
- **Documentation & Tests**: Every significant change MUST be accompanied by:
  - Updates to relevant documentation (READMEs, `docs/`, etc.).
  - **Unit Tests**: Fast, isolated tests with no external dependencies.
  - **Integration Tests**: Tests that verify interaction with infrastructure services (DB, Gateway, etc.).
- **Quality Enforcement**: Proactively run linting (Biome) and type-checking before proposing changes. Ensure all new code adheres to project standards.

## 2. Technical Stack & Philosophy

### **Core Technologies**

- **Language**: TypeScript (Strict usage, avoid `any`).
- **Runtime**: **Bun** (Preferred over Node.js/npm). Use `bun install`, `bun run`.
- **Environment**: **Nix** (via `flake.nix` and `direnv`). Use `nix develop` for portable environments.
- **Frontend**: Vue 3 (Composition API with `<script setup>`) or **Next.js** for main apps, Vite for building.
- **Backend**: Bun-based APIs, Orval/hey-api for SDK generation.
- **Code Quality**: Biome for linting and formatting (Preferred over ESLint/Prettier).

### **Best Practices**

- **Knowledge Discovery**: Always check existing **Knowledge Items (KIs)** before starting new research.
- **Terminal Optimization**: Minimize frequent `cd` commands to avoid repetitive `direnv` initialization overhead.
  - **Absolute Paths**: Use absolute paths for all file operations to avoid `cd` entirely where possible.
  - **Direnv Exec**: For non-interactive commands, prefer `direnv exec /absolute/path/to/repo <command>` over `cd <repo> && <command>`. This bypasses shell hook execution and prompt evaluations.
- **Internationalization**: Use `vue-i18n` for all user-facing text.
- **Schema Validation**: Use **Zod** for runtime data validation.

## 3. Workflow & Infrastructure

### **Secret Management**

- **SOPS**: Prefer SOPS-encrypted files for secrets. Use `sops --set` for efficient updates.

### **Testing & Quality**

- Use **Vitest** for unit/integration tests and **Puppeteer/Playwright** for browser-based integration tests.
- **Test Hierarchy**:
  - **Unit**: Fast, no external network or file system dependencies (stubs/mocks).
  - **Integration**: Verifies interaction between components or with infrastructure (Docker-backed).
- **Quality Gates**: Always run `bun run check` (Biome lint + format) before finishing a task.

### **Shell Usage & Scripting**

- **Complex Operations**: For complex or multi-step shell operations, prefer creating a shell script in `scripts/` or `/tmp/` rather than execution long strings in the terminal.
- **User Choice**: Present the script to the user and offer them the choice to run it themselves or have the agent execute it.
- **Subshell Awareness**: Be extremely careful with environment variables and directory changes in subshells; ensure they propagate correctly or are explicitly handled.

### **Docker Compose & Profiles**

- **Orchestration**: Use `docker-compose.yml` in `modern-resume-env` or individual repos to manage the stack.
- **Profiles**: Utilize Docker Compose **profiles** to bring up specific parts of the stack (e.g., `db-only`, `api-only`, `frontend-only`) or to run tests in an isolated environment.
- **Standard Command**: `docker compose --profile <profile> up -d`.

## 4. Repository Structure

The project consists of several specialized repositories:

- `modern-resume`: Main user frontend.
- `modern-resume-admin`: Admin frontend.
- `modern-resume-backend`: Core API.
- `modern-resume-admin-backend`: Admin-specific API.
- `modern-resume-env`: Shared environment and CI/CD configurations.
- `modern-resume-infra`: Infrastructure and deployment (K8s, Flux).

---
*For repository-specific details, refer to the local `README.md` or `docs/` folder in each repository.*
