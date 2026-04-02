# Manual Testing Quick Reference

Use this checklist to complete the remaining accessibility tests that require hands-on verification.

---

## 🎨 Visual Testing (30 minutes)

### Color Contrast
**Tool:** Chrome DevTools or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

1. Open QuiltCorgi in Chrome
2. Right-click any text → Inspect → Accessibility pane
3. Check contrast ratio for:
   - [ ] Body text (should be 7:1 for AAA)
   - [ ] Button text (should be 4.5:1 minimum)
   - [ ] Icon colors (should be 3:1 minimum)
   - [ ] Focus indicators (should be 3:1 minimum)
   - [ ] Placeholder text (should be 4.5:1 minimum)

### Zoom Testing
**Tool:** Browser zoom (Ctrl/Cmd + Plus/Minus)

1. [ ] Test at 100% zoom - everything works
2. [ ] Test at 200% zoom - no horizontal scrolling, text readable
3. [ ] Test at 400% zoom - layout adapts gracefully

### Glassmorphism Effects
1. [ ] Glass effects don't obscure text
2. [ ] Overlays are readable against all backgrounds
3. [ ] Hover states are visible

---

## ⌨️ Keyboard Testing (20 minutes)

### Navigation
1. [ ] Tab moves focus forward through all interactive elements
2. [ ] Shift+Tab moves focus backward
3. [ ] Focus indicators are visible on all elements
4. [ ] Focus order is logical (left to right, top to bottom)

### Canvas Shortcuts
1. [ ] Space + Drag pans the canvas
2. [ ] Ctrl + Scroll zooms in/out
3. [ ] Ctrl + 0 resets zoom (if implemented)

### Editing Shortcuts
1. [ ] Ctrl + Z undoes
2. [ ] Ctrl + Shift + Z redoes
3. [ ] Ctrl + Y redoes (alternative)
4. [ ] Ctrl + C copies
5. [ ] Ctrl + V pastes
6. [ ] Delete removes selected object
7. [ ] Ctrl + A selects all
8. [ ] Ctrl + D duplicates

### Tool Shortcuts
1. [ ] V activates select tool
2. [ ] R activates rectangle tool
3. [ ] T activates triangle tool
4. [ ] P activates polygon tool
5. [ ] L activates line tool
6. [ ] C activates curve tool
7. [ ] X activates text tool
8. [ ] Esc cancels tool/selection

### Panel Shortcuts
1. [ ] B toggles Blocks panel
2. [ ] F toggles Fabrics panel
3. [ ] I toggles Puzzle view

### Project Shortcuts
1. [ ] Ctrl + S saves project
2. [ ] Ctrl + E exports (if implemented)

---

## 🔊 Screen Reader Testing (45 minutes)

### Setup
- **Windows:** Download [NVDA](https://www.nvaccess.org/download/) (free)
- **Mac:** Enable VoiceOver (Cmd + F5)

### Dashboard Quick Start
1. [ ] Navigate to dashboard
2. [ ] Tab to Quick Start section
3. [ ] Verify each card announces its purpose
4. [ ] Verify Pro badge is announced on Photo to Pattern

### Studio Canvas
1. [ ] Navigate to studio
2. [ ] Tab through toolbar
3. [ ] Verify each tool name is announced
4. [ ] Verify active tool state is announced

### Tap-to-Place
1. [ ] Click a block in the library
2. [ ] Verify indicator message is announced (aria-live)
3. [ ] Tab to cancel button
4. [ ] Verify "Cancel selection" is announced

### Undo/Redo
1. [ ] Tab to Undo/Redo overlay
2. [ ] Verify "Undo (Ctrl+Z)" is announced
3. [ ] Verify disabled state is announced when stack is empty

### Focus Management
1. [ ] Open a modal
2. [ ] Verify focus moves into modal
3. [ ] Press Esc to close
4. [ ] Verify focus returns to trigger element

---

## 📱 Touch/Mobile Testing (15 minutes)

### Touch Targets
**Tool:** Chrome DevTools → Device Toolbar (Ctrl+Shift+M)

1. [ ] Set to iPhone 12 Pro
2. [ ] Measure touch targets (should be 44×44px minimum):
   - [ ] Dashboard Quick Start cards
   - [ ] Toolbar buttons
   - [ ] Undo/Redo buttons
   - [ ] Tap-to-Place cancel button
   - [ ] Block/Fabric library items

### Mobile Redirect
1. [ ] Navigate to /studio on mobile viewport
2. [ ] Verify redirect to dashboard (as designed)

---

## 🌐 Cross-Browser Testing (30 minutes)

### Chrome/Edge
1. [ ] All features work
2. [ ] Visual appearance correct
3. [ ] Performance good

### Firefox
1. [ ] All features work
2. [ ] Visual appearance correct
3. [ ] Performance good

### Safari (Mac/iOS)
1. [ ] All features work
2. [ ] Visual appearance correct
3. [ ] Touch events work on iOS

---

## 🚀 Lighthouse Audit (5 minutes)

1. Open Chrome DevTools → Lighthouse tab
2. Select "Accessibility" category
3. Run audit
4. [ ] Score should be 90+ (aim for 95+)
5. Review any flagged issues

---

## 📊 Results Template

Copy this to document your findings:

```
## Manual Testing Results
**Date:** [Date]
**Tester:** [Name]

### Color Contrast
- Body text: [ratio] - [Pass/Fail]
- Button text: [ratio] - [Pass/Fail]
- Icons: [ratio] - [Pass/Fail]
- Focus indicators: [ratio] - [Pass/Fail]

### Keyboard Navigation
- All shortcuts work: [Yes/No]
- Focus indicators visible: [Yes/No]
- Focus order logical: [Yes/No]
- Issues found: [List any issues]

### Screen Reader (NVDA/VoiceOver)
- Dashboard announces correctly: [Yes/No]
- Toolbar announces correctly: [Yes/No]
- Tap-to-place announces: [Yes/No]
- Undo/Redo announces: [Yes/No]
- Issues found: [List any issues]

### Touch Targets
- All targets 44×44px+: [Yes/No]
- Issues found: [List any issues]

### Cross-Browser
- Chrome: [Pass/Fail]
- Firefox: [Pass/Fail]
- Safari: [Pass/Fail]
- Issues found: [List any issues]

### Lighthouse Score
- Accessibility: [Score]/100
- Issues flagged: [List any issues]

### Overall Assessment
[Pass/Fail] - [Notes]
```

---

## 🎯 Priority Order

If time is limited, test in this order:

1. **Lighthouse Audit** (5 min) - Quick automated check
2. **Keyboard Navigation** (20 min) - Critical for accessibility
3. **Color Contrast** (30 min) - WCAG requirement
4. **Screen Reader** (45 min) - Most important for users with disabilities
5. **Touch Targets** (15 min) - Mobile usability
6. **Cross-Browser** (30 min) - Compatibility check

**Total Time:** ~2.5 hours for complete manual testing

---

## ✅ When You're Done

1. Fill out the results template above
2. Update `ACCESSIBILITY_AUDIT_RESULTS.md` with findings
3. Create GitHub issues for any problems found
4. Update the sign-off checklist in the audit results
5. Schedule follow-up testing after fixes

---

**Questions?** Refer to:
- ACCESSIBILITY_AUDIT_RESULTS.md (detailed findings)
- KEYBOARD_SHORTCUTS.md (shortcuts reference)
- ACCESSIBILITY_TESTING_SUMMARY.md (overview)
