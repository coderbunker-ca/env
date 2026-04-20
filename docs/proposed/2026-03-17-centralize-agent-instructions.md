# Proposal: Centralize Agent Instructions

**Date**: 2026-03-17
**Status**: In Progress
**Repository**: `cv-env` (Central), all others (Referencing)

## Motivation

Currently, development instructions and rules of engagement (such as no-auto-commit rules, tech stack explanations, and best practices) are scattered across multiple `.agent` directories in various repositories. This lead to:

- Redundancy and duplication of information.
- Risk of inconsistency when rules are updated in one place but not others.
- Higher maintenance overhead for keeping agent context accurate.
- Confusion for new agents/developers on which set of rules takes precedence.

## Technical Plan

1. **Centralize**: Create a single `PROCESS.md` in `cv-env/.agent/` that contains all shared rules, philosophy, and tech stack information.
2. **Reference**: Update all other repositories to remove their redundant local rules and instead point to the centralized `PROCESS.md`.
3. **Standardize**: Add a `centralized-process.md` rule in each repo's `.agent/rules/` that explicitly tells agents to read the central document.
4. **Refactor**: Update `AGENTS.md` (where it exists) to act as a high-level overview that redirects to the centralized process for detail.

## Timeline & Progress

- **2026-03-17**:
  - Initial research of `.agent` directories across 6 repositories.
  - Identified redundant files (`no-auto-commit.md`, `prefer-bun.md`, etc.).
  - Created centralized `PROCESS.md` in `cv-env`.
  - Received user feedback to include documentation process and 'next' (Next.js) in the tech stack.
  - Updated `PROCESS.md` and created this proposal document.
  - **Final updates**: Incorporated rules for commit permissions scope, testing hierarchy (unit/integration), shell scripting best practices, subshell awareness, and Docker Compose profile usage.

## Issues Encountered

- **Inconsistent Paming**: Some repos had `.agent/rules/no-auto-commit.md` while others had slightly different versions or names.
- **Redundant AGENTS.md**: `cv` had a very detailed `AGENTS.md` which was effectively the source of truth, while others were lagging behind.
