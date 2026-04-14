# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc.spec.ts >> Session Timeout >> expired session redirects to signin
- Location: tests/e2e/misc.spec.ts:115:7

# Error details

```
Error: page.evaluate: SecurityError: Failed to read the 'cookie' property from 'Document': Access is denied for this document.
    at eval (eval at evaluate (:302:30), <anonymous>:2:16)
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```