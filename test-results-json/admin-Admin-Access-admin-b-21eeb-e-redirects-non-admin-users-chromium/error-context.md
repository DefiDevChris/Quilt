# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Access >> admin blocks page redirects non-admin users
- Location: tests/e2e/admin.spec.ts:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/admin/blocks"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - link "Admin" [ref=e6] [cursor=pointer]:
        - /url: /admin
        - img [ref=e8]
        - generic [ref=e10]: Admin
      - navigation [ref=e11]:
        - link "Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /admin
          - img [ref=e13]
          - text: Dashboard
        - link "Blocks" [ref=e15] [cursor=pointer]:
          - /url: /admin/blocks
          - img [ref=e16]
          - text: Blocks
        - link "Layouts" [ref=e18] [cursor=pointer]:
          - /url: /admin/layouts
          - img [ref=e19]
          - text: Layouts
        - link "Blog" [ref=e21] [cursor=pointer]:
          - /url: /admin/blog
          - img [ref=e22]
          - text: Blog
        - link "Libraries" [ref=e24] [cursor=pointer]:
          - /url: /admin/libraries
          - img [ref=e25]
          - text: Libraries
        - link "Settings" [ref=e27] [cursor=pointer]:
          - /url: /admin/settings
          - img [ref=e28]
          - text: Settings
      - link "Back to Dashboard" [ref=e32] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e33]
        - text: Back to Dashboard
    - generic [ref=e35]:
      - banner [ref=e36]:
        - heading "Blocks" [level=3] [ref=e38]
        - link "Exit Admin" [ref=e39] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e40]
          - text: Exit Admin
      - main [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - heading "System Blocks" [level=1] [ref=e46]
              - paragraph [ref=e47]: Manage the quilt block library available to all users
            - button "Add Block" [ref=e48]:
              - img [ref=e49]
              - text: Add Block
          - table [ref=e52]:
            - rowgroup [ref=e53]:
              - row "Block Category Tags Created Actions" [ref=e54]:
                - columnheader "Block" [ref=e55]
                - columnheader "Category" [ref=e56]
                - columnheader "Tags" [ref=e57]
                - columnheader "Created" [ref=e58]
                - columnheader "Actions" [ref=e59]
            - rowgroup [ref=e60]:
              - row "Churn Dash Traditional intermediate churn +1 4/10/2026 Edit Delete" [ref=e61]:
                - cell "Churn Dash" [ref=e62]:
                  - generic [ref=e63]:
                    - img [ref=e65]
                    - paragraph [ref=e68]: Churn Dash
                - cell "Traditional" [ref=e69]
                - cell "intermediate churn +1" [ref=e70]:
                  - generic [ref=e71]:
                    - generic [ref=e72]: intermediate
                    - generic [ref=e73]: churn
                    - generic [ref=e74]: "+1"
                - cell "4/10/2026" [ref=e75]
                - cell "Edit Delete" [ref=e76]:
                  - generic [ref=e77]:
                    - button "Edit" [ref=e78]
                    - button "Delete" [ref=e79]
              - row "Log Cabin Traditional Log Cabin intermediate log +1 4/10/2026 Edit Delete" [ref=e80]:
                - cell "Log Cabin Traditional" [ref=e81]:
                  - generic [ref=e82]:
                    - img [ref=e84]
                    - generic [ref=e86]:
                      - paragraph [ref=e87]: Log Cabin
                      - paragraph [ref=e88]: Traditional
                - cell "Log Cabin" [ref=e89]
                - cell "intermediate log +1" [ref=e90]:
                  - generic [ref=e91]:
                    - generic [ref=e92]: intermediate
                    - generic [ref=e93]: log
                    - generic [ref=e94]: "+1"
                - cell "4/10/2026" [ref=e95]
                - cell "Edit Delete" [ref=e96]:
                  - generic [ref=e97]:
                    - button "Edit" [ref=e98]
                    - button "Delete" [ref=e99]
              - row "Ohio Star Traditional Stars intermediate ohio +1 4/10/2026 Edit Delete" [ref=e100]:
                - cell "Ohio Star Traditional" [ref=e101]:
                  - generic [ref=e102]:
                    - img [ref=e104]
                    - generic [ref=e106]:
                      - paragraph [ref=e107]: Ohio Star
                      - paragraph [ref=e108]: Traditional
                - cell "Stars" [ref=e109]
                - cell "intermediate ohio +1" [ref=e110]:
                  - generic [ref=e111]:
                    - generic [ref=e112]: intermediate
                    - generic [ref=e113]: ohio
                    - generic [ref=e114]: "+1"
                - cell "4/10/2026" [ref=e115]
                - cell "Edit Delete" [ref=e116]:
                  - generic [ref=e117]:
                    - button "Edit" [ref=e118]
                    - button "Delete" [ref=e119]
              - row "Double Star Traditional Stars advanced double +1 4/10/2026 Edit Delete" [ref=e120]:
                - cell "Double Star Traditional" [ref=e121]:
                  - generic [ref=e122]:
                    - img [ref=e124]
                    - generic [ref=e126]:
                      - paragraph [ref=e127]: Double Star
                      - paragraph [ref=e128]: Traditional
                - cell "Stars" [ref=e129]
                - cell "advanced double +1" [ref=e130]:
                  - generic [ref=e131]:
                    - generic [ref=e132]: advanced
                    - generic [ref=e133]: double
                    - generic [ref=e134]: "+1"
                - cell "4/10/2026" [ref=e135]
                - cell "Edit Delete" [ref=e136]:
                  - generic [ref=e137]:
                    - button "Edit" [ref=e138]
                    - button "Delete" [ref=e139]
              - row "Bear Paw Traditional intermediate bear +1 4/10/2026 Edit Delete" [ref=e140]:
                - cell "Bear Paw" [ref=e141]:
                  - generic [ref=e142]:
                    - img [ref=e144]
                    - paragraph [ref=e147]: Bear Paw
                - cell "Traditional" [ref=e148]
                - cell "intermediate bear +1" [ref=e149]:
                  - generic [ref=e150]:
                    - generic [ref=e151]: intermediate
                    - generic [ref=e152]: bear
                    - generic [ref=e153]: "+1"
                - cell "4/10/2026" [ref=e154]
                - cell "Edit Delete" [ref=e155]:
                  - generic [ref=e156]:
                    - button "Edit" [ref=e157]
                    - button "Delete" [ref=e158]
              - row "Sawtooth Star Traditional Stars intermediate sawtooth +1 4/10/2026 Edit Delete" [ref=e159]:
                - cell "Sawtooth Star Traditional" [ref=e160]:
                  - generic [ref=e161]:
                    - img [ref=e163]
                    - generic [ref=e165]:
                      - paragraph [ref=e166]: Sawtooth Star
                      - paragraph [ref=e167]: Traditional
                - cell "Stars" [ref=e168]
                - cell "intermediate sawtooth +1" [ref=e169]:
                  - generic [ref=e170]:
                    - generic [ref=e171]: intermediate
                    - generic [ref=e172]: sawtooth
                    - generic [ref=e173]: "+1"
                - cell "4/10/2026" [ref=e174]
                - cell "Edit Delete" [ref=e175]:
                  - generic [ref=e176]:
                    - button "Edit" [ref=e177]
                    - button "Delete" [ref=e178]
              - row "Flying Geese Traditional Triangles beginner flying +1 4/10/2026 Edit Delete" [ref=e179]:
                - cell "Flying Geese Traditional" [ref=e180]:
                  - generic [ref=e181]:
                    - img [ref=e183]
                    - generic [ref=e185]:
                      - paragraph [ref=e186]: Flying Geese
                      - paragraph [ref=e187]: Traditional
                - cell "Triangles" [ref=e188]
                - cell "beginner flying +1" [ref=e189]:
                  - generic [ref=e190]:
                    - generic [ref=e191]: beginner
                    - generic [ref=e192]: flying
                    - generic [ref=e193]: "+1"
                - cell "4/10/2026" [ref=e194]
                - cell "Edit Delete" [ref=e195]:
                  - generic [ref=e196]:
                    - button "Edit" [ref=e197]
                    - button "Delete" [ref=e198]
              - row "Drunkard's Path Traditional Curves advanced drunkards +1 4/10/2026 Edit Delete" [ref=e199]:
                - cell "Drunkard's Path Traditional" [ref=e200]:
                  - generic [ref=e201]:
                    - img [ref=e203]
                    - generic [ref=e205]:
                      - paragraph [ref=e206]: Drunkard's Path
                      - paragraph [ref=e207]: Traditional
                - cell "Curves" [ref=e208]
                - cell "advanced drunkards +1" [ref=e209]:
                  - generic [ref=e210]:
                    - generic [ref=e211]: advanced
                    - generic [ref=e212]: drunkards
                    - generic [ref=e213]: "+1"
                - cell "4/10/2026" [ref=e214]
                - cell "Edit Delete" [ref=e215]:
                  - generic [ref=e216]:
                    - button "Edit" [ref=e217]
                    - button "Delete" [ref=e218]
              - row "Half-Square Triangle Traditional Triangles beginner hst 4/10/2026 Edit Delete" [ref=e219]:
                - cell "Half-Square Triangle Traditional" [ref=e220]:
                  - generic [ref=e221]:
                    - img [ref=e223]
                    - generic [ref=e225]:
                      - paragraph [ref=e226]: Half-Square Triangle
                      - paragraph [ref=e227]: Traditional
                - cell "Triangles" [ref=e228]
                - cell "beginner hst" [ref=e229]:
                  - generic [ref=e230]:
                    - generic [ref=e231]: beginner
                    - generic [ref=e232]: hst
                - cell "4/10/2026" [ref=e233]
                - cell "Edit Delete" [ref=e234]:
                  - generic [ref=e235]:
                    - button "Edit" [ref=e236]
                    - button "Delete" [ref=e237]
              - row "Four Patch Traditional Patches beginner four +1 4/10/2026 Edit Delete" [ref=e238]:
                - cell "Four Patch Traditional" [ref=e239]:
                  - generic [ref=e240]:
                    - img [ref=e242]
                    - generic [ref=e244]:
                      - paragraph [ref=e245]: Four Patch
                      - paragraph [ref=e246]: Traditional
                - cell "Patches" [ref=e247]
                - cell "beginner four +1" [ref=e248]:
                  - generic [ref=e249]:
                    - generic [ref=e250]: beginner
                    - generic [ref=e251]: four
                    - generic [ref=e252]: "+1"
                - cell "4/10/2026" [ref=e253]
                - cell "Edit Delete" [ref=e254]:
                  - generic [ref=e255]:
                    - button "Edit" [ref=e256]
                    - button "Delete" [ref=e257]
              - row "Friendship Star Traditional Stars beginner friendship +1 4/10/2026 Edit Delete" [ref=e258]:
                - cell "Friendship Star Traditional" [ref=e259]:
                  - generic [ref=e260]:
                    - img [ref=e262]
                    - generic [ref=e264]:
                      - paragraph [ref=e265]: Friendship Star
                      - paragraph [ref=e266]: Traditional
                - cell "Stars" [ref=e267]
                - cell "beginner friendship +1" [ref=e268]:
                  - generic [ref=e269]:
                    - generic [ref=e270]: beginner
                    - generic [ref=e271]: friendship
                    - generic [ref=e272]: "+1"
                - cell "4/10/2026" [ref=e273]
                - cell "Edit Delete" [ref=e274]:
                  - generic [ref=e275]:
                    - button "Edit" [ref=e276]
                    - button "Delete" [ref=e277]
              - row "Bow Tie Traditional beginner bow +1 4/10/2026 Edit Delete" [ref=e278]:
                - cell "Bow Tie" [ref=e279]:
                  - generic [ref=e280]:
                    - img [ref=e282]
                    - paragraph [ref=e285]: Bow Tie
                - cell "Traditional" [ref=e286]
                - cell "beginner bow +1" [ref=e287]:
                  - generic [ref=e288]:
                    - generic [ref=e289]: beginner
                    - generic [ref=e290]: bow
                    - generic [ref=e291]: "+1"
                - cell "4/10/2026" [ref=e292]
                - cell "Edit Delete" [ref=e293]:
                  - generic [ref=e294]:
                    - button "Edit" [ref=e295]
                    - button "Delete" [ref=e296]
              - row "Hourglass Traditional Triangles beginner hourglass 4/10/2026 Edit Delete" [ref=e297]:
                - cell "Hourglass Traditional" [ref=e298]:
                  - generic [ref=e299]:
                    - img [ref=e301]
                    - generic [ref=e303]:
                      - paragraph [ref=e304]: Hourglass
                      - paragraph [ref=e305]: Traditional
                - cell "Triangles" [ref=e306]
                - cell "beginner hourglass" [ref=e307]:
                  - generic [ref=e308]:
                    - generic [ref=e309]: beginner
                    - generic [ref=e310]: hourglass
                - cell "4/10/2026" [ref=e311]
                - cell "Edit Delete" [ref=e312]:
                  - generic [ref=e313]:
                    - button "Edit" [ref=e314]
                    - button "Delete" [ref=e315]
              - row "Broken Dishes Traditional beginner broken +1 4/10/2026 Edit Delete" [ref=e316]:
                - cell "Broken Dishes" [ref=e317]:
                  - generic [ref=e318]:
                    - img [ref=e320]
                    - paragraph [ref=e323]: Broken Dishes
                - cell "Traditional" [ref=e324]
                - cell "beginner broken +1" [ref=e325]:
                  - generic [ref=e326]:
                    - generic [ref=e327]: beginner
                    - generic [ref=e328]: broken
                    - generic [ref=e329]: "+1"
                - cell "4/10/2026" [ref=e330]
                - cell "Edit Delete" [ref=e331]:
                  - generic [ref=e332]:
                    - button "Edit" [ref=e333]
                    - button "Delete" [ref=e334]
              - row "Economy Block Traditional beginner economy +1 4/10/2026 Edit Delete" [ref=e335]:
                - cell "Economy Block" [ref=e336]:
                  - generic [ref=e337]:
                    - img [ref=e339]
                    - paragraph [ref=e342]: Economy Block
                - cell "Traditional" [ref=e343]
                - cell "beginner economy +1" [ref=e344]:
                  - generic [ref=e345]:
                    - generic [ref=e346]: beginner
                    - generic [ref=e347]: economy
                    - generic [ref=e348]: "+1"
                - cell "4/10/2026" [ref=e349]
                - cell "Edit Delete" [ref=e350]:
                  - generic [ref=e351]:
                    - button "Edit" [ref=e352]
                    - button "Delete" [ref=e353]
              - row "Dutchman's Puzzle Traditional intermediate dutchmans +1 4/10/2026 Edit Delete" [ref=e354]:
                - cell "Dutchman's Puzzle" [ref=e355]:
                  - generic [ref=e356]:
                    - img [ref=e358]
                    - paragraph [ref=e361]: Dutchman's Puzzle
                - cell "Traditional" [ref=e362]
                - cell "intermediate dutchmans +1" [ref=e363]:
                  - generic [ref=e364]:
                    - generic [ref=e365]: intermediate
                    - generic [ref=e366]: dutchmans
                    - generic [ref=e367]: "+1"
                - cell "4/10/2026" [ref=e368]
                - cell "Edit Delete" [ref=e369]:
                  - generic [ref=e370]:
                    - button "Edit" [ref=e371]
                    - button "Delete" [ref=e372]
              - row "Dresden Plate Traditional Curves advanced dresden +1 4/10/2026 Edit Delete" [ref=e373]:
                - cell "Dresden Plate Traditional" [ref=e374]:
                  - generic [ref=e375]:
                    - img [ref=e377]
                    - generic [ref=e379]:
                      - paragraph [ref=e380]: Dresden Plate
                      - paragraph [ref=e381]: Traditional
                - cell "Curves" [ref=e382]
                - cell "advanced dresden +1" [ref=e383]:
                  - generic [ref=e384]:
                    - generic [ref=e385]: advanced
                    - generic [ref=e386]: dresden
                    - generic [ref=e387]: "+1"
                - cell "4/10/2026" [ref=e388]
                - cell "Edit Delete" [ref=e389]:
                  - generic [ref=e390]:
                    - button "Edit" [ref=e391]
                    - button "Delete" [ref=e392]
              - row "Anvil Traditional intermediate anvil 4/10/2026 Edit Delete" [ref=e393]:
                - cell "Anvil" [ref=e394]:
                  - generic [ref=e395]:
                    - img [ref=e397]
                    - paragraph [ref=e400]: Anvil
                - cell "Traditional" [ref=e401]
                - cell "intermediate anvil" [ref=e402]:
                  - generic [ref=e403]:
                    - generic [ref=e404]: intermediate
                    - generic [ref=e405]: anvil
                - cell "4/10/2026" [ref=e406]
                - cell "Edit Delete" [ref=e407]:
                  - generic [ref=e408]:
                    - button "Edit" [ref=e409]
                    - button "Delete" [ref=e410]
              - row "Puss in the Corner Traditional intermediate puss +2 4/10/2026 Edit Delete" [ref=e411]:
                - cell "Puss in the Corner" [ref=e412]:
                  - generic [ref=e413]:
                    - img [ref=e415]
                    - paragraph [ref=e418]: Puss in the Corner
                - cell "Traditional" [ref=e419]
                - cell "intermediate puss +2" [ref=e420]:
                  - generic [ref=e421]:
                    - generic [ref=e422]: intermediate
                    - generic [ref=e423]: puss
                    - generic [ref=e424]: "+2"
                - cell "4/10/2026" [ref=e425]
                - cell "Edit Delete" [ref=e426]:
                  - generic [ref=e427]:
                    - button "Edit" [ref=e428]
                    - button "Delete" [ref=e429]
              - row "Nine Patch Traditional Patches beginner nine +1 4/10/2026 Edit Delete" [ref=e430]:
                - cell "Nine Patch Traditional" [ref=e431]:
                  - generic [ref=e432]:
                    - img [ref=e434]
                    - generic [ref=e436]:
                      - paragraph [ref=e437]: Nine Patch
                      - paragraph [ref=e438]: Traditional
                - cell "Patches" [ref=e439]
                - cell "beginner nine +1" [ref=e440]:
                  - generic [ref=e441]:
                    - generic [ref=e442]: beginner
                    - generic [ref=e443]: nine
                    - generic [ref=e444]: "+1"
                - cell "4/10/2026" [ref=e445]
                - cell "Edit Delete" [ref=e446]:
                  - generic [ref=e447]:
                    - button "Edit" [ref=e448]
                    - button "Delete" [ref=e449]
          - generic [ref=e450]:
            - paragraph [ref=e451]: Showing 1 to 20 of 50 blocks
            - generic [ref=e452]:
              - button "Previous" [disabled] [ref=e453]
              - button "Next" [ref=e454]
  - generic "Notifications"
  - generic [ref=e459] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e460]:
      - img [ref=e461]
    - generic [ref=e464]:
      - button "Open issues overlay" [ref=e465]:
        - generic [ref=e466]:
          - generic [ref=e467]: "0"
          - generic [ref=e468]: "1"
        - generic [ref=e469]: Issue
      - button "Collapse issues badge" [ref=e470]:
        - img [ref=e471]
  - alert [ref=e473]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Admin Access', () => {
  5   |   test('admin page redirects non-admin users', async ({ page }) => {
  6   |     await mockAuth(page, 'free');
  7   |     await page.goto('/admin');
  8   |     await page.waitForURL(/signin|unauthorized|forbidden/);
  9   |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  10  |   });
  11  | 
  12  |   test('admin moderation page redirects non-admin users', async ({ page }) => {
  13  |     await mockAuth(page, 'free');
  14  |     await page.goto('/admin/moderation');
  15  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  16  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  17  |   });
  18  | 
  19  |   test('admin blog page redirects non-admin users', async ({ page }) => {
  20  |     await mockAuth(page, 'free');
  21  |     await page.goto('/admin/blog');
  22  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  23  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  24  |   });
  25  | 
  26  |   test('admin blocks page redirects non-admin users', async ({ page }) => {
  27  |     await mockAuth(page, 'free');
  28  |     await page.goto('/admin/blocks');
> 29  |     await page.waitForURL(/signin|unauthorized|forbidden/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  30  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  31  |   });
  32  | 
  33  |   test('admin layouts page redirects non-admin users', async ({ page }) => {
  34  |     await mockAuth(page, 'free');
  35  |     await page.goto('/admin/layouts');
  36  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  37  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  38  |   });
  39  | 
  40  |   test('admin libraries page redirects non-admin users', async ({ page }) => {
  41  |     await mockAuth(page, 'free');
  42  |     await page.goto('/admin/libraries');
  43  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  44  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  45  |   });
  46  | 
  47  |   test('admin settings page redirects non-admin users', async ({ page }) => {
  48  |     await mockAuth(page, 'free');
  49  |     await page.goto('/admin/settings');
  50  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  51  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Admin Features (Admin Role)', () => {
  56  |   test.beforeEach(async ({ page }) => {
  57  |     await mockAuth(page, 'admin');
  58  |     await page.route('**/api/admin/**', async (route) => {
  59  |       await route.fulfill({
  60  |         status: 200,
  61  |         contentType: 'application/json',
  62  |         body: JSON.stringify({ success: true, data: [] }),
  63  |       });
  64  |     });
  65  |     await page.route('**/api/admin/blog/**', async (route) => {
  66  |       await route.fulfill({
  67  |         status: 200,
  68  |         contentType: 'application/json',
  69  |         body: JSON.stringify({ success: true, data: [] }),
  70  |       });
  71  |     });
  72  |   });
  73  | 
  74  |   test('admin dashboard loads', async ({ page }) => {
  75  |     await page.goto('/admin');
  76  |     await expect(page.getByText(/admin|dashboard/i)).toBeVisible();
  77  |   });
  78  | 
  79  |   test('moderation queue loads', async ({ page }) => {
  80  |     await page.goto('/admin');
  81  |     await expect(page.getByText(/moderation|queue|approve/i)).toBeVisible();
  82  |   });
  83  | 
  84  |   test('admin can approve posts', async ({ page }) => {
  85  |     await page.goto('/admin');
  86  |     const approveButton = page.getByRole('button', { name: /approve/i }).first();
  87  |     if (await approveButton.isVisible()) {
  88  |       await expect(approveButton).toBeVisible();
  89  |     }
  90  |   });
  91  | 
  92  |   test('admin can reject posts', async ({ page }) => {
  93  |     await page.goto('/admin');
  94  |     const rejectButton = page.getByRole('button', { name: /reject/i }).first();
  95  |     if (await rejectButton.isVisible()) {
  96  |       await expect(rejectButton).toBeVisible();
  97  |     }
  98  |   });
  99  | 
  100 |   test('admin can delete posts', async ({ page }) => {
  101 |     await page.goto('/admin');
  102 |     const deleteButton = page.getByRole('button', { name: /delete/i }).first();
  103 |     if (await deleteButton.isVisible()) {
  104 |       await expect(deleteButton).toBeVisible();
  105 |     }
  106 |   });
  107 | 
  108 |   test('admin can create blog posts', async ({ page }) => {
  109 |     await page.goto('/admin/blog');
  110 |     const createButton = page.getByRole('button', { name: /create post|new post|create/i });
  111 |     if (await createButton.isVisible()) {
  112 |       await expect(createButton).toBeVisible();
  113 |     }
  114 |   });
  115 | 
  116 |   test('admin can edit blog posts', async ({ page }) => {
  117 |     await page.goto('/admin/blog');
  118 |     const editButton = page.getByRole('button', { name: /edit/i }).first();
  119 |     if (await editButton.isVisible()) {
  120 |       await expect(editButton).toBeVisible();
  121 |     }
  122 |   });
  123 | 
  124 |   test('admin can delete blog posts', async ({ page }) => {
  125 |     await page.goto('/admin/blog');
  126 |     const deleteButton = page.getByRole('button', { name: /delete/i }).first();
  127 |     if (await deleteButton.isVisible()) {
  128 |       await expect(deleteButton).toBeVisible();
  129 |     }
```