# Auto

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

**Debug requests, questions, and investigations:** answer or investigate first. Do not create a plan upfront — the user needs an answer, not a plan. A plan may become relevant later once the investigation reveals what needs to change.

**For all other tasks**, before writing any code, assess the scope of the actual change (not the prompt length — a one-sentence prompt can describe a large feature). Scale your approach:

- **Trivial** (typo, config tweak, single obvious change): implement directly, no plan needed.
- **Small** (a few files, clear what to do): write 2–3 sentences in `plan.md` describing what and why, then implement. No substeps.
- **Medium** (multiple components, design decisions, edge cases): write a plan in `plan.md` with requirements, affected files, key decisions, verification. Break into 3–5 steps.
- **Large** (new feature, cross-cutting, unclear scope): gather requirements and write a technical spec first (`requirements.md`, `spec.md` in `{@artifacts_path}/`). Then write `plan.md` with concrete steps referencing the spec.

**Skip planning and implement directly when** the task is trivial, or the user explicitly asks to "just do it" / gives a clear direct instruction.

To reflect the actual purpose of the first step, you can rename it to something more relevant (e.g., Planning, Investigation). Do NOT remove meta information like comments for any step.

Rule of thumb for step size: each step = a coherent unit of work (component, endpoint, test suite). Not too granular (single function), not too broad (entire feature). Unit tests are part of each step, not separate.

Update `{@artifacts_path}/plan.md` if it makes sense to have a plan and task has more than 1 big step.

## Implementation Plan

### [x] Step: Simplify the studio shell around explicit Quilt and Block Builder modes
- Replace the current breadcrumb/worktable affordance with two top-level tabs in the studio header.
- Keep mode switching inside the existing `activeWorktable` store path so save/load behavior stays compatible.
- Preserve the current studio layout patterns instead of introducing a new route.

### [x] Step: Make Quilt layout controls simpler and removable for side borders
- Tighten the layout selector UX so border rows can be removed directly and layouts without side borders are easy to configure.
- Keep the Quilt canvas focused on square block layouts and simpler controls inspired by Picture My Blocks.
- Avoid reintroducing removed panels or extra chrome.

### [x] Step: Rework Block Builder into a square drafting workspace tied to My Blocks
- Use the existing block-builder canvas and save flow, but expose it as a first-class tab with a square work surface.
- Keep the drafting tools aligned with the studio tool language while removing quilt-only layout options like sashing, borders, and edging.
- Ensure saving a drafted block refreshes My Blocks cleanly.

### [x] Step: Validate the studio changes and sync task artifacts
- Run the project checks for the touched area (`build`, `type-check`, `lint`) after verifying `.gitignore` coverage.
- Mark completed plan steps in this file before finishing the task.
