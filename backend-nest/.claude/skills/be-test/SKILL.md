---
name: be-test
description: >
  Generate tests for backend feature. Creates unit tests for service,
  controller tests, and integration tests following project conventions.
  Use when user says "write test", "add tests", "test feature",
  "viết test", or wants to add tests for backend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Backend Tests

**Scope:** Creates unit tests + integration tests for one feature.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `product`, `auth`)
2. **Feature exists?** Check `src/features/{feature-name}/`
   - If not → Error: "Feature not found. Run `/be-crud {feature}` first"
3. **Tests already exist?** Check `src/features/{feature-name}/tests/`
   - If exists → Ask: "Tests exist. Add more or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `backend-nest/docs/BE-PROJECT-RULES.md` | Testing patterns, coverage requirements |
| `src/features/{feature-name}/` | All files to understand what to test |

---

## Workflow

### Step 1: Analyze Feature

Read and understand:
- Service methods (business logic to test)
- Controller endpoints (request/response to test)
- DTOs (validation to test)
- Repository queries (if complex)

### Step 2: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Test plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/tests/{feature}.service.spec.ts
- src/features/{feature-name}/tests/{feature}.controller.spec.ts
- src/features/{feature-name}/tests/{feature}.e2e.spec.ts  (if applicable)

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
src/features/{feature-name}/tests/
├── {feature}.service.spec.ts      # Unit tests for service
├── {feature}.controller.spec.ts   # Unit tests for controller
└── {feature}.e2e.spec.ts          # Integration/E2E tests (optional)
```

### Step 4: Write Service Tests

**Structure:**
```typescript
describe('{Feature}Service', () => {
  describe('create', () => {
    it('should create entity successfully', async () => {});
    it('should throw error if invalid data', async () => {});
  });
  
  describe('findAll', () => {
    it('should return paginated list', async () => {});
    it('should filter by criteria', async () => {});
  });
  
  describe('findOne', () => {
    it('should return entity by id', async () => {});
    it('should throw NotFoundException if not found', async () => {});
  });
  
  describe('update', () => {
    it('should update entity successfully', async () => {});
    it('should throw error if not found', async () => {});
  });
  
  describe('remove', () => {
    it('should soft delete entity', async () => {});
    it('should throw error if not found', async () => {});
  });
});
```

**Testing patterns:**
- Mock repository using jest.mock()
- Test happy path + error cases
- Test edge cases (empty, null, invalid)
- Use beforeEach for setup

### Step 5: Write Controller Tests

**Structure:**
```typescript
describe('{Feature}Controller', () => {
  describe('POST /{feature}', () => {
    it('should create and return 201', async () => {});
    it('should return 400 for invalid body', async () => {});
    it('should return 401 if unauthorized', async () => {});
  });
  
  describe('GET /{feature}', () => {
    it('should return paginated list', async () => {});
  });
  
  describe('GET /{feature}/:id', () => {
    it('should return entity by id', async () => {});
    it('should return 404 if not found', async () => {});
  });
  
  // ... update, delete
});
```

**Testing patterns:**
- Mock service
- Test HTTP status codes
- Test response structure
- Test validation errors

### Step 6: Write E2E Tests (Optional)

For critical features, add integration tests:
- Test full request → database flow
- Use test database
- Clean up after tests

---

## Test Coverage Targets

| Layer | Target | Focus |
|-------|--------|-------|
| Service | 80%+ | Business logic, error handling |
| Controller | 70%+ | Request/response, validation |
| Repository | 60%+ | Complex queries only |

---

## Output

```
✅ Tests for "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/tests/
  ├── {feature}.service.spec.ts
  ├── {feature}.controller.spec.ts
  └── {feature}.e2e.spec.ts (if applicable)

🧪 Run tests:
- All tests: `npm run test`
- This feature: `npm run test -- --testPathPattern={feature}`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:cov`

📊 Expected coverage: 80%+ for service, 70%+ for controller
```

---

## Important Rules

1. **Follow AAA pattern** - Arrange, Act, Assert
2. **Mock dependencies** - Don't hit real database in unit tests
3. **Test edge cases** - Empty arrays, null values, invalid IDs
4. **Descriptive names** - "should return 404 when product not found"
5. **Independent tests** - Each test can run alone

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/be-test product`" |
| Feature not found | Suggest: "Run `/be-crud {feature}` first" |
| Test framework not setup | Run: `npm install -D @nestjs/testing jest` |
