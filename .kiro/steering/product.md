# Product Overview

QuiltCorgi is a browser-based quilt design application that helps quilters design quilts, calculate yardage, and generate print-ready patterns with seam allowances.

## Core Features

- **Design Studio**: Pick layout templates or use freeform canvas. Configure borders, sashing, cornerstones, and block cells. Two modes: Worktable (full quilt) and Block Builder (custom blocks with grid-snapped drawing tools)
- **Block Library**: 35 traditional quilt block SVGs plus custom block creation and photo block uploads
- **Photo-to-Design**: OpenCV-powered feature to recreate quilts from photos
- **Yardage & Cutting**: Automatic fabric calculations with rotary cutting guides
- **Print-Ready Patterns**: PDF export with 1:1 scale cutting templates including seam allowance
- **Social Feed**: Share designs, discover inspiration, likes and comments

## Product Tiers

- **Free**: 20 blocks, 10 fabrics, no save/export
- **Pro** ($8/mo or $60/yr): Full library, save, export (PDF/PNG/SVG), Photo-to-Design, cutting charts, yardage estimator, social posting

## User Roles

Defined in `src/lib/trust-engine.ts`:
- `free`: like, save, comment (cannot post)
- `pro`: like, save, comment, post
- `admin`: all permissions + moderation

## Platform Support

- **Desktop**: Full studio experience
- **Mobile**: Limited to Home, Upload FAB, Profile/Sign In (studio is desktop-only, `StudioGate` redirects mobile users)

## Brand Voice

Warm, quilter-friendly, conversational — like a knowledgeable friend in a quilt shop. Address quilters directly ("you"/"your"). Use quilting vocabulary naturally (seam allowance, yardage, WOF, fat quarter). Lead with what the quilter gets, not what the software does.
