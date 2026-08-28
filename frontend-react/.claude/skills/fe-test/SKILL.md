---
name: fe-test
description: >
  Generate tests for frontend feature. Creates component tests, hook tests,
  and integration tests following project conventions.
  Use when user says "write test", "add tests", "test feature",
  "viết test", or wants to add tests for frontend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Frontend Tests

**Scope:** Creates component tests + hook tests for one feature.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `product`, `auth`)
2. **Feature exists?** Check `src/features/{feature-name}/`
   - If not → Error: "Feature not found. Run `/fe-crud {feature}` first"
3. **Tests already exist?** Check for `.test.tsx` files
   - If exists → Ask: "Tests exist. Add more or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `frontend-react/docs/FE-PROJECT-RULES.md` | Testing patterns, what to test |
| `src/features/{feature-name}/` | All files to understand what to test |

---

## Workflow

### Step 1: Analyze Feature

Read and understand:
- Components (UI logic to test)
- Hooks (data fetching, mutations)
- Pages (integration of components)
- User interactions (clicks, forms)

### Step 2: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Test plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/components/{Feature}List.test.tsx
- src/features/{feature-name}/components/{Feature}Form.test.tsx
- src/features/{feature-name}/hooks/use{Feature}s.test.ts
- src/features/{feature-name}/hooks/useCreate{Feature}.test.ts
- src/features/{feature-name}/pages/{Feature}ListPage.test.tsx  (if applicable)

⚠️  {N} test files will be created.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative)
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 3

### Step 3: Generate Test Files

```
src/features/{feature-name}/
├── components/
│   ├── {Feature}List.tsx
│   ├── {Feature}List.test.tsx        # Component test
│   ├── {Feature}Form.tsx
│   └── {Feature}Form.test.tsx        # Form test
├── hooks/
│   ├── use{Feature}s.ts
│   ├── use{Feature}s.test.ts         # Hook test
│   └── ...
└── pages/
    ├── {Feature}ListPage.tsx
    └── {Feature}ListPage.test.tsx    # Page test (integration)
```

### Step 4: Write Component Tests

**Structure:**
```typescript
describe('{Feature}List', () => {
  it('should render loading state', () => {});
  it('should render empty state when no data', () => {});
  it('should render list of items', () => {});
  it('should call onSelect when item clicked', () => {});
  it('should handle pagination', () => {});
});

describe('{Feature}Form', () => {
  it('should render all form fields', () => {});
  it('should show validation errors', () => {});
  it('should call onSubmit with form data', () => {});
  it('should disable submit button when loading', () => {});
});
```

**Testing patterns:**
- Use React Testing Library
- Test user behavior, not implementation
- Mock hooks with jest.mock()
- Use `screen.getByRole`, `getByText`

### Step 5: Write Hook Tests

**Structure:**
```typescript
describe('use{Feature}s', () => {
  it('should fetch data on mount', async () => {});
  it('should return loading state initially', () => {});
  it('should return data on success', async () => {});
  it('should return error on failure', async () => {});
  it('should refetch when params change', async () => {});
});

describe('useCreate{Feature}', () => {
  it('should call API on mutate', async () => {});
  it('should invalidate queries on success', async () => {});
  it('should return error on failure', async () => {});
});
```

**Testing patterns:**
- Use @testing-library/react-hooks or renderHook
- Mock API calls with MSW or jest.mock
- Test loading → success flow
- Test error handling

### Step 6: Write Page Tests (Integration)

**Structure:**
```typescript
describe('{Feature}ListPage', () => {
  it('should render page title', () => {});
  it('should fetch and display data', async () => {});
  it('should navigate to detail on click', async () => {});
  it('should filter results', async () => {});
});
```

**Testing patterns:**
- Mock router (useNavigate, useParams)
- Test full user flows
- Use waitFor for async operations

---

## Test Coverage Targets

| Layer | Target | Focus |
|-------|--------|-------|
| Components | 80%+ | User interactions, states |
| Hooks | 70%+ | Data fetching, mutations |
| Pages | Critical paths | Happy path + main errors |

---

## Output

```
✅ Tests for "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/
  ├── components/
  │   ├── {Feature}List.test.tsx
  │   └── {Feature}Form.test.tsx
  ├── hooks/
  │   ├── use{Feature}s.test.ts
  │   └── useCreate{Feature}.test.ts
  └── pages/
      └── {Feature}ListPage.test.tsx

🧪 Run tests:
- All tests: `npm run test`
- This feature: `npm run test {feature}`
- Watch mode: `npm run test -- --watch`
- Coverage: `npm run test -- --coverage`

📊 Expected coverage: 80%+ for components, 70%+ for hooks
```

---

## Important Rules

1. **Test user behavior** - Not implementation details
2. **Use Testing Library queries** - getByRole, getByText (not getByTestId)
3. **Mock external dependencies** - API calls, router, context
4. **Test all states** - Loading, error, empty, success
5. **Descriptive names** - "should show error when API fails"
6. **Independent tests** - Each test can run alone

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/fe-test product`" |
| Feature not found | Suggest: "Run `/fe-crud {feature}` first" |
| Testing library not installed | Run: `npm install -D vitest @testing-library/react` |
