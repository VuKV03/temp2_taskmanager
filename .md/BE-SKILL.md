---
name: be-crud
description: >
  Generate CRUD for a backend feature/entity. Creates entity, controller,
  service, repository, DTOs, module, and migration following project conventions.
  Use when user says "create crud", "add feature", "generate entity",
  "tạo crud", or wants to add new backend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Backend CRUD

**Scope:** Creates complete CRUD for one feature/entity.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `task`, `task-list`, `activity`)
2. **Project initialized?** Check `src/features/` folder exists
   - If not → Suggest: "Run `/init-base backend` first"
3. **Feature already exists?** Check `src/features/{feature-name}/`
   - If exists → Ask: "Feature exists. Add to it or overwrite?"
4. **Entity in DATABASE.md?** Check the table is documented
   - If not → Ask user for schema before generating

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `v1-docs/DATABASE.md` | Entity schema, columns, relationships, indexes, naming conventions |
| `v1-docs/API_SPEC.md` | Endpoints, request/response format, error codes, **Business Rules** |
| `backend-nest/docs/BE-PROJECT-RULES.md` | Coding patterns, anti-patterns, naming conventions |
| `backend-nest/docs/BE-ARCHITECTURE.md` | Folder structure, feature boundaries, transaction rules |

**Bắt buộc đọc mục "Business Rules" trong API_SPEC.md.** Đó là nơi ghi các quyết định dễ làm sai (timezone, `completed_at`, soft delete, ghi activity trong transaction).

---

## Workflow

### Step 1: Gather Information

Ask user (if not clear from context):
- Entity name (singular): `Task`, `TaskList`, `Tag`
- Fields/columns (or reference DATABASE.md)
- Relationships (belongs to, has many, self-referencing)
- Endpoint nào cần auth? Endpoint nào chỉ admin (`/admin/*`)?
- Thay đổi trên entity này có cần ghi `task_activities` không?

### Step 2: Check Existing Code

- Read existing features in `src/features/` for patterns
- Check how other features structure their files
- Follow the same patterns exactly
- Đọc `src/shared/constants/error-codes.constant.ts` để lấy mã lỗi có sẵn

### Step 3: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/{feature}.module.ts
- src/features/{feature-name}/{feature}.controller.ts
- src/features/{feature-name}/{feature}.service.ts
- src/features/{feature-name}/repositories/{entity}.repository.ts
- src/features/{feature-name}/entities/{entity}.entity.ts
- src/features/{feature-name}/dto/create-{entity}.dto.ts
- src/features/{feature-name}/dto/update-{entity}.dto.ts
- src/features/{feature-name}/dto/query-{entity}.dto.ts  (if applicable)
- src/features/{feature-name}/types/{feature}.types.ts   (if applicable)
- src/database/migrations/{timestamp}-create-{table}.ts
- src/features/{feature-name}/CONTEXT.md

📝 Files to be UPDATED:
- src/app.module.ts                              → add {FeatureName}Module to imports
- src/shared/constants/error-codes.constant.ts   → add {PREFIX}_00X codes
- v1-docs/API_SPEC.md                            → add endpoints (if new)

⚠️  {N} files will be created, {M} files will be updated.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative)
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 4

### Step 4: Generate Files

Create in order:

```
src/features/{feature-name}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── admin-{feature}.controller.ts   (if feature has /admin/* endpoints)
├── {feature}.service.ts
├── repositories/
│   └── {entity}.repository.ts
├── entities/
│   └── {entity}.entity.ts
├── dto/
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── query-{entity}.dto.ts (if needed)
├── types/
│   └── {feature}.types.ts (if needed)
├── processors/
│   └── {job}.processor.ts (if feature owns a background job)
└── CONTEXT.md (brief feature documentation)
```

### Step 5: Implement Each File

**Entity:** Follow DATABASE.md schema exactly
- Use TypeORM decorators, `bigint` PK với `@PrimaryGeneratedColumn('increment')`
- Cột DB `snake_case` khai báo qua `@Column({ name: 'due_date' })`
- Định nghĩa quan hệ, thêm `@Index()` đúng danh sách index trong DATABASE.md
- Soft delete bằng `is_archived` / `is_active`, **không** dùng hard delete

**DTOs:** Follow API_SPEC.md
- class-validator decorators, không dùng `any`
- **Không** khai báo field lấy từ token (`creatorId`, `userId`) trong Create DTO
- Query DTO kế thừa `PaginationQueryDto` của `shared/dto`
- `sort`/`order` phải qua whitelist enum

**Repository:** Complex queries only
- QueryBuilder, `leftJoinAndSelect`, filter, pagination
- Nhận `start`/`end` đã tính sẵn cho truy vấn theo ngày — **không** dùng `CURDATE()`/`NOW()`
- Không kiểm tra quyền, không ném lỗi nghiệp vụ

**Service:** Business logic
- Kiểm tra ownership tại đây (`creatorId`/`assigneeId`/`role === 'admin'`)
- Ném `AppException(ERROR_CODES.XXX, HttpStatus.YYY)` theo bảng trong API_SPEC.md
- Thao tác ghi có nhiều bước → bọc `this.dataSource.transaction()`
- Nếu entity là `tasks` hoặc liên quan: ghi `activityLogger.log(manager, ...)` **trong cùng transaction**

**Controller:** Routing + validation
- RESTful endpoints per API_SPEC.md
- `@UseGuards(JwtAuthGuard)`, thêm `RolesGuard` + `@Roles('admin')` cho `/admin/*`
- `@CurrentUser()` để lấy user, không nhận `userId` từ query/body
- Swagger: `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- Không tự bọc `{ success, data }` — `TransformInterceptor` đã làm

**Module:** Wire everything
- Import dependencies (`ActivityModule` nếu cần ghi log)
- Export service nếu feature khác dùng

**Migration:** `npm run migration:generate -- src/database/migrations/create-{table}`
- Kiểm tra file sinh ra có đủ cả `up()` và `down()`
- Đối chiếu index với DATABASE.md, bổ sung nếu thiếu

**CONTEXT.md:** ≈1 trang gồm bảng DB feature sở hữu, danh sách endpoint, quy tắc nghiệp vụ riêng, feature phụ thuộc

### Step 6: Register Module

Update `app.module.ts`:
- Import new feature module
- Add to imports array

---

## Output

```
✅ Feature "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/
  ├── {feature}.module.ts
  ├── {feature}.controller.ts
  ├── {feature}.service.ts
  ├── repositories/{entity}.repository.ts
  ├── entities/{entity}.entity.ts
  ├── dto/create-{entity}.dto.ts
  ├── dto/update-{entity}.dto.ts
  └── CONTEXT.md
- src/database/migrations/{timestamp}-create-{table}.ts

📝 Updated:
- src/app.module.ts (added import)
- src/shared/constants/error-codes.constant.ts (added codes)

🚀 Next steps:
1. Review generated code
2. Run `npm run migration:run`
3. Run `npm run start:dev` to verify
4. Test endpoints at /api/docs (Swagger)
5. Run `/be-test {feature-name}` to generate tests
```

---

## Important Rules

1. **Follow existing patterns** - Read other features first
2. **Match DATABASE.md exactly** - Column names, types, relationships, indexes
3. **Match API_SPEC.md exactly** - Endpoints, response format, error codes
4. **No `any` types** - Use proper TypeScript types
5. **Validation in DTOs** - Use class-validator, bật `whitelist`
6. **Error handling** - `AppException` + mã lỗi, **không** dùng `NotFoundException` trần
7. **Ownership in service** - `userId` luôn lấy từ token, không từ payload
8. **Activity log in transaction** - `log(manager, ...)`, không dùng EventEmitter
9. **Timezone** - mốc ngày tính ở service theo `users.timezone`
10. **Soft delete** - `is_archived = true`, không `DELETE`

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/be-crud task`" |
| DATABASE.md not found | Ask user for entity schema |
| Feature already exists | Ask: "Overwrite or add to existing?" |
| Endpoint chưa có trong API_SPEC.md | Đề xuất bản nháp spec, hỏi xác nhận trước khi code |
| Mã lỗi chưa có trong error-codes | Đề xuất mã mới theo tiền tố feature, hỏi xác nhận |
| Migration generate ra rỗng | Cảnh báo: entity chưa được đăng ký trong DataSource |
