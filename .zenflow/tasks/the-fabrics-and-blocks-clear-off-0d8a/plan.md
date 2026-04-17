# Auto

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

## Plan
### [x] Step: Investigate current studio flow
- Confirm how layout changes currently clear placed blocks and why the canvas is created before layout selection.
- Identify the files responsible for quilt setup, layout application, block drops, and fabric drops.

### [x] Step: Confirm product decisions
- Lock the standard layout after setup unless the user starts over.
- Keep block and fabric placement directly on the quilt areas rather than adding a staging tray.
- Support a free-form mode with no fence, persistent grid snapping, and adjustable grid size.
- Make added borders expand final quilt dimensions evenly around the current design.

### [x] Step: Rework studio setup and layout application
- Move first-time quilt setup to a layout-first flow that collects layout choice and size before the quilt canvas is initialized.
- Prevent normal layout changes from wiping out placed blocks by treating layout selection as setup-time configuration.
- Add free-form setup behavior that keeps the canvas open for shape drawing and free block placement along grid lines.
- Make border actions update the final canvas dimensions around the existing quilt content.

### [ ] Step: Validate and finish
- Ran `npm run type-check` successfully.
- Ran targeted lint for the touched files successfully aside from existing max-lines/complexity warnings and one pre-existing `img` warning in the studio shell.
- Ran repo-wide `npm run lint`, which still fails because of unrelated pre-existing errors elsewhere in the repo, including `tests/unit/lib/save-project.test.ts:11` duplicate import.
- Ran `npm run build`, which still fails on `/shop/catalog` because the current database connection expects SSL while the local server does not support SSL.
