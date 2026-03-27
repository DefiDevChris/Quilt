# QuiltCorgi — Project Overview
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Executive summary, vision, scope, and glossary for the QuiltCorgi quilt design platform.

---

## Vision

QuiltCorgi is a modern, browser-based quilt design studio that replaces legacy desktop software (Electric Quilt / EQ8) with a real-time canvas engine, generative block tools, precision 1:1 PDF pattern export, and a community sharing board. It is designed for quilters of all ages — from kids learning the craft to experienced designers who have outgrown dated desktop tools — delivering professional-grade capabilities through an intuitive, accessible web interface that requires no download and no upfront purchase.

## Problem Statement

The dominant quilt design software, Electric Quilt (EQ8), is a 30+ year-old desktop application that requires a $200+ upfront purchase, runs only on Windows/macOS (no web, no mobile, no Chromebook), has a dated interface that intimidates new users, and cannot be accessed from multiple devices. Quilters who want to design digitally are locked into expensive, platform-specific software with no modern collaboration or sharing features. There is no competitive web-based alternative that combines professional drawing tools, fabric visualization, yardage calculation, and 1:1 pattern printing in a single, accessible application.

## Target Users

- **Young Quilters (Kids/Teens):** Students learning quilting in schools, camps, or at home. Need a simple, free entry point with visual, drag-and-drop tools. Zero tolerance for complexity.
- **Hobbyist Quilters (All Ages):** Home quilters designing personal projects. Want fabric preview, yardage estimates, and printable patterns without expensive software. Range from beginners to experienced crafters.
- **Professional Quilters / Pattern Designers:** Experienced designers who publish patterns, sell designs, or teach quilting. Need precision tools: exact measurements, seam allowances, 1:1 PDF export, and DPI image export for publications.
- **Quilting Educators / Guild Leaders:** Teachers and group leaders who need a free, browser-based tool students can access without installing software or purchasing licenses.

## Core Value Proposition

QuiltCorgi eliminates every barrier that EQ8 puts in front of quilters: no $200+ purchase (free to start, low-cost monthly Pro), no download or installation (runs in any modern browser), no outdated interface (clean, modern UI with quilting-themed branding), and no isolation (community board for sharing designs). It matches EQ8's professional feature set — block libraries, fabric visualization, yardage calculation, 1:1 pattern printing — while adding generative design tools, social login, and the ability to access projects from any device.

## Scope

### In Scope
- Full vector drawing canvas with Fabric.js (shapes, Bezier curves, snapping, grid)
- Pre-loaded block library (6,000+ categorized blocks) with search and drag-to-canvas
- Custom block drafting (polygons, Bezier curves, appliqué shapes)
- Fabric upload, processing (crop/scale/straighten), and pattern fill mapping
- Layout engine (grid, sashing, on-point, free-form, custom borders)
- Auto-complete symmetry engine (mirror/radial/linear)
- Serendipity block generator (polygon intersection via polygon-clipping)
- Global unit toggle (Imperial ↔ Metric) with fraction calculator
- Yardage estimator (WOF, fat quarter, waste margin calculations)
- Printlist queue with curated shapes and quantities
- 1:1 scale PDF export with seam allowances (Clipper.js), auto-packing, and validation square
- Image export at 72–600 DPI
- Freemium model with Stripe subscription (free tier + Pro tier)
- Social OAuth login (Google, Facebook, Apple, X) + Email/Password
- Community quilt board (post designs, descriptions, likes — admin moderated)
- User dashboard with saved projects, auto-save + manual save
- Undo/redo canvas history
- In-app notifications
- Custom context menu (right-click actions)
- Quick-Info inspector panel (live dimensions/area/angles)

### Out of Scope
- Native mobile apps (iOS/Android)
- Desktop application (Electron)
- Real-time multi-user collaboration (Google Docs-style)
- Video tutorials or embedded learning platform
- E-commerce / pattern marketplace (buying/selling patterns)
- Embroidery or longarm machine integration
- Print-on-demand fabric ordering
- Commenting system on community board
- Multi-language / internationalization
- Public API for third-party integrations

## Glossary

| Term | Definition |
|------|-----------|
| **Appliqué** | A quilting technique where fabric shapes are sewn onto a background fabric, as opposed to piecing where shapes are sewn edge-to-edge. |
| **Bezier Curve** | A mathematically defined curve used in vector graphics. In QuiltCorgi, used for drawing curved seams (e.g., Drunkard's Path blocks). |
| **Block** | A single repeating unit of a quilt design, typically a square containing geometric shapes. Blocks are arranged in layouts to form a full quilt. |
| **Canvas** | The main interactive drawing area powered by Fabric.js where users design quilts. |
| **Clipper.js** | A JavaScript polygon clipping and offsetting library used to calculate seam allowances on exported patterns. |
| **Community Board** | A public gallery where users share completed quilt designs for others to browse and like. |
| **Fabric (material)** | Physical textile material used in quilting. In QuiltCorgi, represented as raster images mapped as pattern fills onto vector shapes. |
| **Fabric.js** | The JavaScript HTML5 canvas library powering the drawing engine. Not to be confused with quilting fabric. |
| **Fat Quarter** | A pre-cut fabric piece measuring 18" × 22" (half-yard cut in half again). A standard unit in yardage calculations. |
| **Free-form Mode** | A canvas layout mode with no predefined grid — users place blocks anywhere with optional snap-to-grid. |
| **Grid** | The underlying measurement grid on the canvas. Users can set custom sizes or disable it entirely. |
| **Imperial** | Measurement system using inches, feet, and yards. |
| **Metric** | Measurement system using centimeters and meters. |
| **On-Point** | A quilt layout where blocks are rotated 45° so they appear as diamonds rather than squares. |
| **Pattern Fill** | Mapping a raster fabric image as a repeating fill inside a vector shape to simulate how the quilt will look with real fabric. |
| **PDF Points** | The unit of measurement in PDF files. 72 PDF points = 1 physical inch. Critical for 1:1 scale printing. |
| **Printlist** | A curated queue of specific shapes and quantities the user wants to print as 1:1 scale cutting templates. |
| **Pro Tier** | The paid subscription level unlocking all features, tools, and the full block/fabric library. |
| **Sashing** | Strips of fabric sewn between quilt blocks to frame and separate them. A layout option in the layout engine. |
| **Seam Allowance** | Extra fabric added around a pattern piece (typically ¼") to allow for sewing seams. Calculated by Clipper.js and rendered as a dashed outline on exports. |
| **Serendipity** | The generative block tool that intersects two existing shapes/blocks to auto-generate new, unique block variations. Named after the equivalent EQ8 feature. |
| **SVG Path** | Scalable Vector Graphics path data defining complex shapes including curves. The native format for block geometry. |
| **Unit Toggle** | The global control switching all measurements and calculations between Imperial and Metric. |
| **Validation Square** | A mandatory 1" × 1" square printed on page 1 of PDF exports so users can verify their printer is producing accurate 1:1 scale. |
| **WOF (Width of Fabric)** | The standard width of fabric on a bolt, typically 42"–45". Used in yardage calculations. |
| **Yardage Estimator** | The calculation engine that determines how much fabric is needed for a quilt design, factoring in WOF, fat quarters, and waste margins. |

## Document Index

| # | Document | Filename | Purpose |
|---|----------|----------|---------|
| 1 | Project Overview | `01-PROJECT-OVERVIEW.md` | This document — vision, scope, glossary |
| 2 | Architecture Blueprint | `02-ARCHITECTURE.md` | System architecture, tech stack, infrastructure |
| 3 | Data Model Specification | `03-DATA-MODEL.md` | Every entity, field, type, relationship, constraint |
| 4 | Feature Specification | `04-FEATURES.md` | Every feature with full behavioral spec and acceptance criteria |
| 5 | API Specification | `05-API-SPEC.md` | Every endpoint, request/response schema, error codes |
| 6 | UI/UX Specification | `06-UI-UX-SPEC.md` | Every screen, component, layout, navigation flow |
| 7 | Auth & Security Spec | `07-AUTH-SECURITY.md` | Auth flow, permissions matrix, security measures |
| 8 | DevOps & Deployment Guide | `08-DEVOPS.md` | Environment setup, deployment steps, monitoring |
| 9 | Project Structure | `09-PROJECT-STRUCTURE.md` | File tree, naming conventions, coding standards |
| 10 | Build Phases & Milestones | `10-BUILD-PHASES.md` | Ordered build plan with phases, tasks, acceptance gates |
| 11 | Agent Build Prompts | `11-AGENT-PROMPTS.md` | Ready-to-use prompts for AI agents to build each phase |
| 12 | Environment & Config Setup | `12-ENV-CONFIG.md` | Every env variable, config file, API key, setup instruction |
| 13 | Master Decision Log | `13-DECISION-LOG.md` | Every decision made during blueprinting with rationale |
