## TestSprite Consolidated Report

### Run Scope
- Backend suite: auth + health API smoke tests
- Frontend suite: student-focused UI flows (`TC001` to `TC007`)
- Environment: `frontend http://localhost:3000`, `backend http://localhost:4000`

### Overall Summary
- Total tests: **11**
- Passed: **9**
- Failed: **2**
- Overall pass rate: **81.82%**

### Backend Summary
- Total: **4**
- Passed: **4**
- Failed: **0**
- Pass rate: **100.00%**

Passed backend tests:
- API001: Backend health endpoint responds
- API002: Valid student loginId credentials
- API003: Invalid login rejection
- API004: Authenticated profile endpoint

Backend run links:
- API001: [result](https://www.testsprite.com/dashboard/mcp/tests/774f303c-d089-4280-b5db-42eef34b70b9/975a0ef1-7796-407c-a787-7149144089a9)
- API002: [result](https://www.testsprite.com/dashboard/mcp/tests/774f303c-d089-4280-b5db-42eef34b70b9/a6c4fcc1-6c70-404e-acc5-5d41d14ec789)
- API003: [result](https://www.testsprite.com/dashboard/mcp/tests/774f303c-d089-4280-b5db-42eef34b70b9/782ec548-ab3c-4fbb-b773-e6fa60238c1f)
- API004: [result](https://www.testsprite.com/dashboard/mcp/tests/774f303c-d089-4280-b5db-42eef34b70b9/b708da92-7e63-4e2b-91f5-6d98fbcf7dc4)

### Frontend Summary
- Total: **7**
- Passed: **5**
- Failed: **2**
- Pass rate: **71.43%**

Passed frontend tests:
- TC001: Student login success and role redirect
- TC003: Student dashboard renders tabs and cards
- TC004: Question bank search and sort interaction
- TC006: Get started form validation
- TC007: Student test series list loads

Failed frontend tests:
- TC002: Invalid login shows inline error
  - Failure reason: test used valid credentials while asserting invalid-login error behavior.
  - Result: [link](https://www.testsprite.com/dashboard/mcp/tests/d8a9dd76-74c3-4484-bd1c-321ce428df56/4f9869c6-5d55-40ab-88d4-66bd046bf98d)
- TC005: Student profile settings open
  - Failure reason: execution timed out.
  - Result: [link](https://www.testsprite.com/dashboard/mcp/tests/d8a9dd76-74c3-4484-bd1c-321ce428df56/af07e5d4-e1e3-44ef-bbea-1b3fbf367a3c)

### Recommended Next Fixes
- Update `TC002` test input to truly invalid credentials (for example wrong password) so assertion matches intent.
- Stabilize `TC005` with deterministic waits/selectors for profile/settings render after login.
- Re-run only failed frontend IDs (`TC002`, `TC005`) for a fast path to full green.
