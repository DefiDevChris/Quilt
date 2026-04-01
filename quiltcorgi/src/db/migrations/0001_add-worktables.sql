-- Add worktables column to projects table
ALTER TABLE "projects" ADD COLUMN "worktables" jsonb DEFAULT '[{"id":"main","name":"Main","canvasData":{},"order":0}]'::jsonb NOT NULL;

-- Migrate existing canvasData to worktables format for existing projects
UPDATE "projects" 
SET "worktables" = jsonb_build_array(
  jsonb_build_object(
    'id', 'main',
    'name', 'Main',
    'canvasData', COALESCE("canvasData", '{}'::jsonb),
    'order', 0
  )
)
WHERE "worktables" = '[{"id":"main","name":"Main","canvasData":{},"order":0}]'::jsonb;
