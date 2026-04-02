# Accessibility Testing Checklist

Use this checklist to verify all accessibility features are working correctly.

## Dashboard Quick Start Workflows

### Visual Testing
- [ ] Three workflow cards are visible above the bento grid
- [ ] Each card has a large icon (64px), title, and description
- [ ] Cards have glassmorphism effect (glass-card, glass-elevated)
- [ ] Hover animations work (scale, shadow elevation)
- [ ] Pro badge shows on Photo to Pattern for free users
- [ ] Cards are responsive (stack vertically on mobile)

### Interaction Testing
- [ ] Photo to Pattern opens modal (or shows upgrade prompt for free users)
- [ ] Start from Template switches to patterns tab
- [ ] Blank Project opens new project dialog
- [ ] All cards are keyboard accessible (Tab to focus, Enter to activate)
- [ ] Focus indicators are visible (blue ring)

### Accessibility Testing
- [ ] Each card has proper aria-label
- [ ] Minimum touch target is 44×44px (measure in DevTools)
- [ ] Text contrast meets WCAG AAA (7:1 for normal text)
- [ ] Screen reader announces card purpose correctly

## Tap-to-Place Blocks

### Selection Testing
- [ ] Clicking a block highlights it with blue border + ring
- [ ] Only one block can be selected at a time
- [ ] Clicking another block switches selection
- [ ] Clicking the same block again does NOT deselect (by design)
- [ ] Locked blocks cannot be selected

### Placement Testing
- [ ] Floating indicator appears: "Tap canvas to place [Block Name]"
- [ ] Clicking canvas places block at click coordinates
- [ ] Grid snapping works if enabled
- [ ] Block scales to 1 inch (96px at 100% zoom)
- [ ] Block can be placed multiple times without re-selecting
- [ ] Undo state is pushed on each placement
- [ ] Placed block is automatically selected (select tool activated)

### Cancellation Testing
- [ ] X button in indicator cancels selection
- [ ] Indicator disappears when canceled
- [ ] Block highlight is removed
- [ ] Clicking canvas after cancel does nothing

### Visual Feedback Testing
- [ ] Selected block has blue border + ring + background tint
- [ ] Indicator has glassmorphism effect
- [ ] Indicator is positioned at top-center, doesn't block canvas
- [ ] Indicator has proper z-index (appears above canvas, below modals)

## Tap-to-Place Fabrics

### Selection Testing
- [ ] Clicking a fabric highlights it with blue border + ring
- [ ] Only one fabric can be selected at a time
- [ ] Clicking another fabric switches selection
- [ ] Fabric stays selected for multi-fill

### Application Testing
- [ ] Floating indicator appears: "Tap a patch to fill with [Fabric Name]"
- [ ] Clicking a patch fills it with the fabric pattern
- [ ] Pattern repeats correctly
- [ ] Multiple patches can be filled without re-selecting
- [ ] Undo state is pushed on each fill
- [ ] Clicking empty canvas does nothing (only patches are fillable)

### Cancellation Testing
- [ ] X button in indicator cancels selection
- [ ] Indicator disappears when canceled
- [ ] Fabric highlight is removed

## Undo/Redo Overlay

### Visual Testing
- [ ] Overlay is visible at top-center of canvas
- [ ] Two buttons: Undo (left) and Redo (right)
- [ ] Each button is 48×48px minimum
- [ ] Icon + text label for each button
- [ ] Glassmorphism effect (glass-elevated)
- [ ] Separator line between buttons
- [ ] Overlay doesn't block canvas interaction

### Functionality Testing
- [ ] Undo button is disabled when undoStack is empty
- [ ] Redo button is disabled when redoStack is empty
- [ ] Clicking Undo reverts last action
- [ ] Clicking Redo reapplies undone action
- [ ] Disabled buttons are grayed out (opacity-30)
- [ ] Hover effect works on enabled buttons
- [ ] Active scale effect on click (active:scale-95)

### Keyboard Testing
- [ ] Ctrl+Z triggers undo
- [ ] Ctrl+Shift+Z triggers redo
- [ ] Ctrl+Y triggers redo (alternative)
- [ ] Keyboard shortcuts work even when overlay is not focused
- [ ] Tooltips show keyboard shortcuts on hover

### Accessibility Testing
- [ ] Overlay has role="toolbar"
- [ ] Buttons have proper aria-label
- [ ] Disabled state is announced by screen reader
- [ ] Focus indicators are visible

## Drag-and-Drop Visual Feedback

### Block Dragging
- [ ] Block card becomes semi-transparent (opacity-50) during drag
- [ ] Block card scales down slightly during drag
- [ ] Cursor changes to 'grab' on hover
- [ ] Cursor changes to 'grabbing' during drag
- [ ] Cursor changes to 'copy' over canvas drop zone
- [ ] Cursor resets after drop

### Fabric Dragging
- [ ] Fabric card becomes semi-transparent during drag
- [ ] Cursor changes appropriately
- [ ] Visual feedback is consistent with blocks

### Canvas Drop Zone
- [ ] Canvas shows visual feedback on dragover (if implemented)
- [ ] Drop zone is clearly indicated
- [ ] Invalid drop zones show appropriate cursor

## Toolbar Text Labels

### Visual Testing
- [ ] All toolbar icons have text labels beneath them
- [ ] Labels are 9px font size
- [ ] Labels are center-aligned
- [ ] Labels truncate if too long
- [ ] Icon + label fit within button bounds

### Interaction Testing
- [ ] Buttons are 44×44px minimum (measure in DevTools)
- [ ] Active tool has blue background + ring
- [ ] Hover effect works (background color change)
- [ ] Labels don't cause layout shift

### Accessibility Testing
- [ ] Labels are readable at 100% zoom
- [ ] Labels are readable at 200% zoom (WCAG requirement)
- [ ] Tooltips provide additional context
- [ ] Screen reader announces tool name correctly

## Keyboard Navigation

### Canvas Navigation
- [ ] Space + Drag pans the canvas
- [ ] Ctrl + Scroll zooms in/out
- [ ] Ctrl + 0 resets zoom to 100%

### Editing Shortcuts
- [ ] Ctrl + Z undoes
- [ ] Ctrl + Shift + Z redoes
- [ ] Ctrl + Y redoes (alternative)
- [ ] Ctrl + C copies selected object
- [ ] Ctrl + V pastes copied object
- [ ] Ctrl + X cuts selected object
- [ ] Delete removes selected object
- [ ] Backspace removes selected object
- [ ] Ctrl + A selects all objects
- [ ] Ctrl + D duplicates selected object

### Tool Shortcuts
- [ ] V activates select tool
- [ ] R activates rectangle tool
- [ ] C activates circle tool
- [ ] L activates line tool
- [ ] T activates text tool
- [ ] Esc cancels current tool/selection

### Project Shortcuts
- [ ] Ctrl + S saves project
- [ ] Ctrl + E exports image

## Screen Reader Testing

### NVDA/JAWS (Windows) or VoiceOver (Mac)
- [ ] Dashboard workflow cards are announced with purpose
- [ ] Block selection is announced
- [ ] Fabric selection is announced
- [ ] Tap-to-place indicators are announced (aria-live)
- [ ] Undo/Redo buttons are announced with state
- [ ] Toolbar tools are announced with active state
- [ ] Focus order is logical (left to right, top to bottom)
- [ ] All interactive elements are reachable via keyboard

## Responsive Design

### Desktop (1920×1080)
- [ ] All features work correctly
- [ ] Layout is not cramped
- [ ] Touch targets are adequate

### Laptop (1366×768)
- [ ] All features work correctly
- [ ] Overlays don't overlap
- [ ] Text is readable

### Tablet (768×1024)
- [ ] Touch targets are 44×44px minimum
- [ ] Tap-to-place works with touch
- [ ] Drag-and-drop works with touch
- [ ] Overlays are positioned correctly

### Mobile (375×667)
- [ ] Studio redirects to dashboard (as designed)
- [ ] Dashboard Quick Start cards stack vertically
- [ ] All cards are tappable

## Zoom Testing

### 100% Zoom
- [ ] All features work correctly
- [ ] Text is readable
- [ ] Touch targets are adequate

### 200% Zoom (WCAG Requirement)
- [ ] Layout doesn't break
- [ ] Text is still readable
- [ ] No horizontal scrolling on canvas
- [ ] Touch targets are still adequate
- [ ] Overlays are still visible

### 400% Zoom
- [ ] Layout adapts gracefully
- [ ] Critical features remain accessible

## Color Contrast Testing

Use browser DevTools or a contrast checker tool:

### Text Contrast
- [ ] Normal text (14px): 7:1 ratio (WCAG AAA)
- [ ] Large text (18px+): 4.5:1 ratio (WCAG AAA)
- [ ] Button text: 4.5:1 ratio minimum
- [ ] Placeholder text: 4.5:1 ratio minimum

### UI Element Contrast
- [ ] Focus indicators: 3:1 ratio minimum
- [ ] Button borders: 3:1 ratio minimum
- [ ] Icon contrast: 3:1 ratio minimum

### Test in Different Modes
- [ ] Light mode (if applicable)
- [ ] Dark mode (if applicable)
- [ ] High contrast mode (Windows)

## Focus Indicators

### Visual Testing
- [ ] All interactive elements show focus indicator
- [ ] Focus indicator is blue ring (ring-2 ring-primary)
- [ ] Focus indicator is visible against all backgrounds
- [ ] Focus indicator doesn't clip or overflow

### Keyboard Navigation
- [ ] Tab moves focus forward
- [ ] Shift+Tab moves focus backward
- [ ] Focus order is logical
- [ ] Focus is never trapped (except in modals)
- [ ] Esc closes modals and returns focus

## Accessibility Documentation

### Content Testing
- [ ] Documentation is comprehensive
- [ ] All features are documented
- [ ] Keyboard shortcuts are listed
- [ ] Interaction modes are explained
- [ ] Examples are clear

### Access Testing
- [ ] Documentation is linked from Help Panel
- [ ] Documentation is easy to find
- [ ] Documentation is readable
- [ ] Documentation is up-to-date

## Performance Testing

### Interaction Responsiveness
- [ ] Tap-to-place is instant (no lag)
- [ ] Undo/Redo is instant
- [ ] Drag-and-drop is smooth
- [ ] Hover effects are smooth
- [ ] No janky animations

### Canvas Performance
- [ ] Canvas renders smoothly with 100+ objects
- [ ] Zoom/pan is smooth
- [ ] No memory leaks (check DevTools)

## Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Visual appearance is correct
- [ ] Performance is good

### Firefox
- [ ] All features work
- [ ] Visual appearance is correct
- [ ] Performance is good

### Safari (Mac/iOS)
- [ ] All features work
- [ ] Visual appearance is correct
- [ ] Performance is good
- [ ] Touch events work on iOS

## Edge Cases

### Empty States
- [ ] Empty undo stack disables undo button
- [ ] Empty redo stack disables redo button
- [ ] No blocks selected: tap-to-place inactive
- [ ] No fabrics selected: tap-to-place inactive

### Error States
- [ ] Failed block load: graceful error
- [ ] Failed fabric load: graceful error
- [ ] Network error: user is notified

### Concurrent Actions
- [ ] Selecting block while fabric is selected: fabric deselects
- [ ] Selecting fabric while block is selected: block deselects
- [ ] Dragging while tap-to-place is active: works correctly
- [ ] Undo during tap-to-place: works correctly

## Sign-Off

- [ ] All critical issues resolved
- [ ] All high-priority issues resolved
- [ ] Medium/low issues documented for future work
- [ ] Accessibility audit passed
- [ ] User testing completed
- [ ] Documentation reviewed
- [ ] Ready for production

---

**Tested By**: _______________  
**Date**: _______________  
**Browser/OS**: _______________  
**Notes**: _______________
