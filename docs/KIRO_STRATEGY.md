# Kiro Strategy — When to Use Which Approach

This guide helps you choose the **right prompting strategy** depending on your situation.

---

## Decision Tree

### Are you starting a new phase?

**YES** → Use STRUCTURED PHASE PROMPT
- File: `/docs/KIRO_QUICK_PROMPTS.md` (Phase N section)
- Why: Gives Kiro full context, checklist, and expectations
- Expected time: 3–8 hours depending on phase
- Output: Structured results in `/docs/phase-outputs/`

**NO** → Continue reading...

---

### Are you fixing a failing test from a previous phase?

**YES** → Use ROOT CAUSE ANALYSIS PROMPT
```
CONTEXT: [Phase N] failed test: [describe failure]
Expected: [what should happen]
Actual: [what's happening instead]

Root cause analysis:
1. [Investigation step 1]
2. [Investigation step 2]
3. Find the root cause

FIX:
Make the minimal change to pass the test.

RE-TEST:
Confirm test now passes.

Report: Fixed / Still failing
```

**NO** → Continue reading...

---

### Are you asking Kiro to refactor or improve existing code?

**YES** → Use CODE IMPROVEMENT PROMPT
```
FILE: /src/path/to/file.ts
ISSUE: [describe problem]
GOAL: [what should improve]

CONSTRAINTS:
- Don't break existing functionality
- Match current code style
- No new dependencies unless necessary

APPROACH:
1. Understand current implementation
2. Identify improvement opportunity
3. Implement change
4. Test to ensure no regression

OUTPUT: Show me the before/after diff
```

**NO** → Continue reading...

---

### Are you asking Kiro to debug something specific?

**YES** → Use DEBUG PROMPT
```
FILE: /src/path/to/file.ts (or route: /endpoint)
SYMPTOM: [what goes wrong]
EXPECTED: [correct behavior]
ACTUAL: [what's happening]

INVESTIGATION:
1. Check [specific code area]
2. Look for [common issues]
3. Test [hypothesis]

If found, fix. If not, report findings.
```

**NO** → Continue reading...

---

### Are you asking Kiro to implement a small feature or fix?

**YES** → Use SCOPED IMPLEMENTATION PROMPT
```
TASK: [What to implement]
FILES INVOLVED: [list specific files]
REQUIREMENTS:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

TESTING:
- [Test 1]
- [Test 2]

Show me: [expected output format]
```

**NO** → Continue reading...

---

### Are you asking Kiro to perform visual inspection/design work?

**YES** → Use VISUAL VERIFICATION PROMPT
```
TASK: [Visual task - screenshot, inspect, compare]
PAGES: [list pages to inspect]
VIEWPORTS: [1440×900, 1280×800, 1024×768, 768×1024, 390×844]

INSPECTION POINTS:
- Hierarchy: [what to check]
- Spacing: [measurements to verify]
- Typography: [font sizes, weights]
- Colors: [palette consistency]
- Focus states: [keyboard Tab navigation]

Use: Playwright (screenshots) + Chrome DevTools (inspection)

DELIVERABLE: /docs/screenshots/[screenshot-name].png
```

**NO** → Continue reading...

---

### Are you asking Kiro to test something?

**YES** → Use TEST & VERIFICATION PROMPT
```
TASK: Test [feature/behavior]
SCENARIO: [describe scenario]
SETUP: [how to set up test]
STEPS:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED OUTCOME: [what should happen]
TOOLS: [Playwright, Chrome DevTools, etc.]

REPORT: Pass/Fail + reason
```

**NO** → Continue reading...

---

### Are you asking for documentation or analysis?

**YES** → Use DOCUMENTATION PROMPT
```
TASK: [Document what]
SCOPE: [what to include]
FORMAT: [markdown, table, structured]

SECTIONS:
1. [Section 1]
2. [Section 2]
3. [Section 3]

AUDIENCE: [who reads this?]

OUTPUT: /docs/[filename].md
```

**NO** → You have a highly custom request. Write a custom prompt.

---

## Quick Reference: Which Prompt Type for Each Situation

| Situation | Prompt Type | File | Time |
|-----------|-----------|------|------|
| Starting Phase 0–10 | Structured phase prompt | QUICK_PROMPTS.md | 3–8h |
| Test is failing | Root cause analysis | Custom | 1–2h |
| Improve code quality | Code improvement | Custom | 1–3h |
| App behaves wrong | Debug prompt | Custom | 1–4h |
| Small feature to add | Scoped implementation | Custom | 0.5–2h |
| Check UI visually | Visual verification | Custom | 0.5–1h |
| Run security test | Test & verification | Custom | 0.5–1h |
| Create reference docs | Documentation | Custom | 0.5–1h |

---

## Best Practices by Situation

### Situation 1: You're starting Phase N

**Do this:**

1. Open `/docs/KIRO_QUICK_PROMPTS.md`
2. Find your phase section
3. Copy the entire prompt
4. Paste into Kiro chat
5. Let Kiro run to completion (don't interrupt)
6. Review output file
7. Commit results

**Don't do this:**

- ❌ Ask Kiro to "implement phase N" without structure
- ❌ Give Kiro scattered requirements
- ❌ Interrupt mid-execution
- ❌ Skip reviewing output before proceeding

---

### Situation 2: A test failed mid-phase

**Do this:**

1. Capture what failed (error message, test name)
2. Write a root cause analysis prompt
3. Give Kiro concrete details:
   - Expected behavior
   - Actual behavior
   - Where to investigate
4. Let Kiro investigate and fix
5. Re-run test to confirm fix
6. Commit fix

**Example:**

```
PHASE 1 TEST FAILURE: Logout invalidates session

Expected: After logout, protected fetch returns 401
Actual: Protected fetch returns 200 (access succeeded)

Investigation:
1. Is logout calling Supabase.auth.signOut()? [check /src/app/customer/actions.ts]
2. Are cookies being cleared? [check DevTools]
3. Is middleware checking for valid session? [check /src/middleware.ts]

If logout not calling signOut, that's the bug. Fix it.
Re-test to confirm logout now returns 401.
```

---

### Situation 3: You want to improve UI design consistency

**Do this:**

1. Use visual verification prompt
2. Screenshot current state
3. Identify specific problems
4. Ask Kiro to fix top 3 defects
5. Screenshot after
6. Compare before/after
7. Commit improvements

**Example:**

```
TASK: Fix typography hierarchy on /customer dashboard

INSPECTION (Chrome DevTools):
- Current: h1=24px, body=16px, caption=12px
- Problem: captions too small (12px), should be 14px for readability
- Problem: inconsistent heading weights

FIX:
- Update caption: 12px → 14px
- Update h2: font-weight 600 → 700
- Verify contrast (captions should have proper contrast)

VERIFY: Screenshot before/after at 1440×900 and 390×844
```

---

### Situation 4: A feature isn't working as expected

**Do this:**

1. Describe the symptom clearly
2. Use debug prompt
3. Give specific file paths
4. Include error messages if any
5. Ask Kiro to investigate and fix
6. Test fix manually
7. Commit fix

**Example:**

```
FILE: /src/app/customer/page.tsx
SYMPTOM: Customer dashboard shows loading spinner forever, never loads data
EXPECTED: Jobs should load in <2 seconds
ACTUAL: Spinner stuck indefinitely

Investigation:
1. Check fetchCustomerJobs() server action (/src/app/customer/actions.ts)
   - Does it complete without hanging?
   - Does it have error handling?
2. Check page component
   - Is it calling the server action?
   - Is it handling response correctly?
3. Check browser console
   - Any errors logged?

Find and fix the issue.
Test: reload /customer, verify jobs load.
```

---

### Situation 5: You want to verify security

**Do this:**

1. Use test & verification prompt
2. Specify the security concern
3. Ask Kiro to run automated test using Playwright
4. Provide expected outcome
5. Report pass/fail

**Example:**

```
TASK: Security test — Customer A cannot read Customer B's property

SETUP:
- Create test customer A and B (with different properties)
- Kiro logs in as Customer A
- Kiro attempts to fetch Customer B's property by ID

EXPECTED: DENIED (401 or 403)

TOOLS: Playwright (for login), Supabase MCP (for direct query test)

If result is ALLOWED:
- Find where authorization is missing
- Add authorization check
- Re-test

Report: Pass/Fail + reason
```

---

### Situation 6: You want to add a small feature

**Do this:**

1. Use scoped implementation prompt
2. Be specific about what/where/why
3. List requirements
4. Describe testing approach
5. Ask for clear output format

**Example:**

```
TASK: Add "Copy to clipboard" button on job ID

FILES:
- /src/components/JobCard.tsx (add button)
- /src/lib/utils.ts (add copy function if needed)

REQUIREMENTS:
- Button appears next to job ID
- Clicking copies job ID to clipboard
- Show "Copied!" toast for 2 seconds
- Use Fixify design token (button styling)

TESTING:
- Click button
- Verify clipboard contains job ID
- Verify toast appears

DELIVERABLE: Show me the updated JobCard.tsx with the new button
```

---

### Situation 7: You need to review/document the current architecture

**Do this:**

1. Use documentation prompt
2. Specify what to document
3. Request structured format
4. Target audience
5. Save output file

**Example:**

```
TASK: Document current RLS policies

SCOPE:
- List all RLS policies currently in place
- For each: table, policy name, SQL, purpose
- Format: markdown table

AUDIENCE: Developer onboarding

OUTPUT: /docs/RLS_POLICIES.md
```

---

## Troubleshooting Prompts

### "Kiro isn't understanding what I want"

**Fix:** Make your prompt MORE specific, not less.

❌ "Make the dashboard look better"
✅ "The job card spacing is inconsistent (12px top, 16px bottom). Update to 16px all sides. Use Chrome DevTools to verify. Screenshot before/after."

### "Kiro finished but didn't do what I wanted"

**Fix:** Review the output file Kiro created. If it's not right, write a follow-up prompt:

```
FOLLOW-UP: [What was supposed to happen] vs [What actually happened]

Revise: [What to change]
Re-test: [How to verify]
```

### "Kiro is taking too long"

**Fix:** You might be giving a task that's too big for one prompt. Break it into smaller prompts.

**Don't do this:**
```
TASK: Build the entire customer dashboard
[30 requirements listed]
```

**Do this instead:**
```
TASK: Phase 4 — Customer Dashboard Real Data Binding
[Structured phase prompt with checklist]
```

### "Build/Lint/Test is failing"

**Fix:** Ask Kiro explicitly to:
1. Run the failing command
2. Capture the error
3. Investigate the root cause
4. Fix it
5. Re-run to confirm it passes

---

## Example: Full Day Workflow with Kiro

### Morning (9 AM)

```
Kiro, I'm starting Phase 2 (RLS) today.
Phase 1 is complete. Here's the prompt for Phase 2:
[paste from QUICK_PROMPTS.md — PHASE 2 section]
```

**Kiro runs Phase 2** (usually 4–8 hours depending on complexity)

### Mid-day (1 PM)

```
Kiro, I reviewed your Phase 1 output. One test is failing:
[describe test failure]

Root cause analysis:
1. Check [specific file]
2. Look for [specific issue]
3. Fix if found

Re-test to confirm.
```

**Kiro investigates and fixes** (usually 1–2 hours)

### Afternoon (3 PM)

```
Great! Phase 2 is done. All tests passing.

Now let's start Phase 3 (State Machine). Here's the prompt:
[paste from QUICK_PROMPTS.md — PHASE 3 section]
```

**Kiro runs Phase 3** (4–8 hours)

### End of Day (5 PM)

Review Kiro's output:
- ✅ Read `/docs/phase-outputs/phase2-rls-results.md` — all tests passing
- ✅ Check `/docs/phase-outputs/phase3-state-machine-results.md` — progress made
- ✅ Commit both phases:
  ```bash
  git add .
  git commit -m "Phase 2 & 3: RLS and state machine verified"
  ```

---

## Summary: Choose Your Prompt Wisely

| Goal | Prompt Type | Speed | Risk |
|------|-----------|-------|------|
| Execute full phase | Structured phase prompt | 3–8h | Low (Kiro knows exactly what to do) |
| Fix a bug | Root cause analysis | 1–2h | Low (focused investigation) |
| Improve code quality | Code improvement | 1–3h | Medium (make sure no regression) |
| Verify security | Test & verification | 0.5–1h | Low (automated tests are repeatable) |
| Check UI visually | Visual verification | 0.5–1h | Low (screenshots prove it) |
| Add small feature | Scoped implementation | 0.5–2h | Medium (ensure it matches requirements) |
| Debug issue | Debug prompt | 1–4h | Medium (depends on issue complexity) |
| Create docs | Documentation | 0.5–1h | Low (docs are easy to verify) |

**Rule of thumb:** 
- **Structured prompts** (phase prompts) → Use when starting new work
- **Focused prompts** (custom) → Use when fixing or improving existing work

**Key principle:** The more context you give Kiro upfront, the better the output. Always include:
1. What's already been done (context)
2. What should be true when finished (goals)
3. How to verify it works (testing)
4. What to output (deliverables)

Happy prompting! 🚀
