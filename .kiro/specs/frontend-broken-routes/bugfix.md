# Bugfix Requirements Document

## Introduction

Two navigation links in the QuiltCorgi Next.js app produce silent redirects to `/dashboard` instead of reaching their intended destinations. The first is the "Open in Studio" card on community post detail pages, which uses a query-param URL (`/studio?project=<id>`) instead of the correct dynamic segment URL (`/studio/<id>`). The second is the "Design on Desktop" link in the mobile drawer, which points to `/studio` with no project ID — a route that requires a project ID and therefore always redirects away. Both issues leave users stranded on the dashboard with no indication of what went wrong.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the "Open in Studio" linked project card on a community post detail page THEN the system navigates to `/studio?project=<projectId>` which does not match the `/studio/[projectId]` dynamic route and redirects to `/dashboard`

1.2 WHEN an authenticated mobile user clicks "Design on Desktop" in the mobile drawer THEN the system navigates to `/studio` with no project ID segment, which does not match the `/studio/[projectId]` dynamic route and redirects to `/dashboard`

### Expected Behavior (Correct)

2.1 WHEN a user clicks the "Open in Studio" linked project card on a community post detail page THEN the system SHALL navigate to `/studio/<projectId>` using the dynamic route segment, opening the correct project in the studio

2.2 WHEN an authenticated mobile user clicks "Design on Desktop" in the mobile drawer THEN the system SHALL navigate to `/dashboard` where the user can select a project to open in the studio

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user navigates to a valid `/studio/<projectId>` URL directly THEN the system SHALL CONTINUE TO load the studio canvas for that project

3.2 WHEN an unauthenticated user attempts to access a protected studio route THEN the system SHALL CONTINUE TO redirect to `/auth/signin` with the appropriate `callbackUrl`

3.3 WHEN a user clicks any other navigation link in the mobile drawer (Dashboard, Social Threads, Blog, Profile) THEN the system SHALL CONTINUE TO navigate to the correct route without change

3.4 WHEN a user views a community post detail page with no linked project THEN the system SHALL CONTINUE TO render the post without a linked project card
