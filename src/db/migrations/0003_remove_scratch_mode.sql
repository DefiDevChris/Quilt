-- Convert any existing scratch projects to layout before removing the value from the enum
UPDATE "projects" SET "mode" = 'layout' WHERE "mode" = 'scratch';
