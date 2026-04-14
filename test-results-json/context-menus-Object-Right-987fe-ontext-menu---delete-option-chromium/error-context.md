# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: context-menus.spec.ts >> Object Right-Click Context Menu >> context menu - delete option
- Location: tests/e2e/context-menus.spec.ts:99:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('canvas')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - paragraph [ref=e6]: Failed to load project
    - link "Return to Dashboard" [ref=e7] [cursor=pointer]:
      - /url: /dashboard
  - generic "Notifications"
  - generic [ref=e12] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e13]:
      - img [ref=e14]
    - generic [ref=e17]:
      - button "Open issues overlay" [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: "0"
          - generic [ref=e21]: "1"
        - generic [ref=e22]: Issue
      - button "Collapse issues badge" [ref=e23]:
        - img [ref=e24]
  - alert [ref=e26]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Canvas Right-Click Context Menu', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |     await mockCanvas(page);
  8   |     await page.goto('/studio/test-project-1');
  9   |     await page.waitForTimeout(2000);
  10  |   });
  11  | 
  12  |   test('right-click on canvas shows context menu', async ({ page }) => {
  13  |     const canvas = page.locator('canvas');
  14  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  15  |     await page.waitForTimeout(500);
  16  | 
  17  |     const contextMenu = page.locator('[role="menu"]');
  18  |     if (await contextMenu.isVisible({ timeout: 2000 })) {
  19  |       await expect(contextMenu).toBeVisible();
  20  |     }
  21  |   });
  22  | 
  23  |   test('context menu - paste option', async ({ page }) => {
  24  |     const canvas = page.locator('canvas');
  25  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  26  |     await page.waitForTimeout(500);
  27  | 
  28  |     const pasteOption = page.getByRole('menuitem', { name: /paste/i });
  29  |     if (await pasteOption.isVisible({ timeout: 2000 })) {
  30  |       await expect(pasteOption).toBeVisible();
  31  |     }
  32  |   });
  33  | 
  34  |   test('context menu - select all option', async ({ page }) => {
  35  |     const canvas = page.locator('canvas');
  36  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  37  |     await page.waitForTimeout(500);
  38  | 
  39  |     const selectAllOption = page.getByRole('menuitem', { name: /select all/i });
  40  |     if (await selectAllOption.isVisible({ timeout: 2000 })) {
  41  |       await expect(selectAllOption).toBeVisible();
  42  |     }
  43  |   });
  44  | });
  45  | 
  46  | test.describe('Object Right-Click Context Menu', () => {
  47  |   test.beforeEach(async ({ page }) => {
  48  |     await mockAuth(page, 'pro');
  49  |     await mockCanvas(page);
  50  |     await page.goto('/studio/test-project-1');
  51  |     await page.waitForTimeout(2000);
  52  |   });
  53  | 
  54  |   test('right-click on object shows context menu', async ({ page }) => {
  55  |     const canvas = page.locator('canvas');
  56  |     await canvas.click({ position: { x: 100, y: 100 } });
  57  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  58  |     await page.waitForTimeout(500);
  59  | 
  60  |     const contextMenu = page.locator('[role="menu"]');
  61  |     if (await contextMenu.isVisible({ timeout: 2000 })) {
  62  |       await expect(contextMenu).toBeVisible();
  63  |     }
  64  |   });
  65  | 
  66  |   test('context menu - cut option', async ({ page }) => {
  67  |     const canvas = page.locator('canvas');
  68  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  69  |     await page.waitForTimeout(500);
  70  | 
  71  |     const cutOption = page.getByRole('menuitem', { name: /cut/i });
  72  |     if (await cutOption.isVisible({ timeout: 2000 })) {
  73  |       await expect(cutOption).toBeVisible();
  74  |     }
  75  |   });
  76  | 
  77  |   test('context menu - copy option', async ({ page }) => {
  78  |     const canvas = page.locator('canvas');
  79  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  80  |     await page.waitForTimeout(500);
  81  | 
  82  |     const copyOption = page.getByRole('menuitem', { name: /copy/i });
  83  |     if (await copyOption.isVisible({ timeout: 2000 })) {
  84  |       await expect(copyOption).toBeVisible();
  85  |     }
  86  |   });
  87  | 
  88  |   test('context menu - duplicate option', async ({ page }) => {
  89  |     const canvas = page.locator('canvas');
  90  |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  91  |     await page.waitForTimeout(500);
  92  | 
  93  |     const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
  94  |     if (await duplicateOption.isVisible({ timeout: 2000 })) {
  95  |       await expect(duplicateOption).toBeVisible();
  96  |     }
  97  |   });
  98  | 
  99  |   test('context menu - delete option', async ({ page }) => {
  100 |     const canvas = page.locator('canvas');
> 101 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
      |                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  102 |     await page.waitForTimeout(500);
  103 | 
  104 |     const deleteOption = page.getByRole('menuitem', { name: /delete/i });
  105 |     if (await deleteOption.isVisible({ timeout: 2000 })) {
  106 |       await expect(deleteOption).toBeVisible();
  107 |     }
  108 |   });
  109 | 
  110 |   test('context menu - group option', async ({ page }) => {
  111 |     const canvas = page.locator('canvas');
  112 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  113 |     await page.waitForTimeout(500);
  114 | 
  115 |     const groupOption = page.getByRole('menuitem', { name: /group/i });
  116 |     if (await groupOption.isVisible({ timeout: 2000 })) {
  117 |       await expect(groupOption).toBeVisible();
  118 |     }
  119 |   });
  120 | 
  121 |   test('context menu - ungroup option', async ({ page }) => {
  122 |     const canvas = page.locator('canvas');
  123 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  124 |     await page.waitForTimeout(500);
  125 | 
  126 |     const ungroupOption = page.getByRole('menuitem', { name: /ungroup/i });
  127 |     if (await ungroupOption.isVisible({ timeout: 2000 })) {
  128 |       await expect(ungroupOption).toBeVisible();
  129 |     }
  130 |   });
  131 | 
  132 |   test('context menu - bring to front option', async ({ page }) => {
  133 |     const canvas = page.locator('canvas');
  134 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  135 |     await page.waitForTimeout(500);
  136 | 
  137 |     const frontOption = page.getByRole('menuitem', { name: /bring to front/i });
  138 |     if (await frontOption.isVisible({ timeout: 2000 })) {
  139 |       await expect(frontOption).toBeVisible();
  140 |     }
  141 |   });
  142 | 
  143 |   test('context menu - send to back option', async ({ page }) => {
  144 |     const canvas = page.locator('canvas');
  145 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  146 |     await page.waitForTimeout(500);
  147 | 
  148 |     const backOption = page.getByRole('menuitem', { name: /send to back/i });
  149 |     if (await backOption.isVisible({ timeout: 2000 })) {
  150 |       await expect(backOption).toBeVisible();
  151 |     }
  152 |   });
  153 | 
  154 |   test('context menu - lock option', async ({ page }) => {
  155 |     const canvas = page.locator('canvas');
  156 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  157 |     await page.waitForTimeout(500);
  158 | 
  159 |     const lockOption = page.getByRole('menuitem', { name: /lock/i });
  160 |     if (await lockOption.isVisible({ timeout: 2000 })) {
  161 |       await expect(lockOption).toBeVisible();
  162 |     }
  163 |   });
  164 | 
  165 |   test('context menu - unlock option', async ({ page }) => {
  166 |     const canvas = page.locator('canvas');
  167 |     await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
  168 |     await page.waitForTimeout(500);
  169 | 
  170 |     const unlockOption = page.getByRole('menuitem', { name: /unlock/i });
  171 |     if (await unlockOption.isVisible({ timeout: 2000 })) {
  172 |       await expect(unlockOption).toBeVisible();
  173 |     }
  174 |   });
  175 | });
  176 | 
  177 | test.describe('Worktable Tab Right-Click Menu', () => {
  178 |   test.beforeEach(async ({ page }) => {
  179 |     await mockAuth(page, 'pro');
  180 |     await mockCanvas(page);
  181 |     await page.goto('/studio/test-project-1');
  182 |     await page.waitForTimeout(2000);
  183 |   });
  184 | 
  185 |   test('right-click on worktable tab shows menu', async ({ page }) => {
  186 |     const tab = page.getByRole('tab', { name: /worktable/i }).first();
  187 |     if (await tab.isVisible()) {
  188 |       await tab.click({ button: 'right' });
  189 |       await page.waitForTimeout(500);
  190 | 
  191 |       const contextMenu = page.locator('[role="menu"]');
  192 |       if (await contextMenu.isVisible({ timeout: 2000 })) {
  193 |         await expect(contextMenu).toBeVisible();
  194 |       }
  195 |     }
  196 |   });
  197 | 
  198 |   test('worktable context menu - rename option', async ({ page }) => {
  199 |     const tab = page.getByRole('tab', { name: /worktable/i }).first();
  200 |     if (await tab.isVisible()) {
  201 |       await tab.click({ button: 'right' });
```