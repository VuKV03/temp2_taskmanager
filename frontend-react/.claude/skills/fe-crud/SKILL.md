---
name: fe-crud
description: >
  Generate CRUD for a frontend feature. Creates pages, components, hooks,
  services, and types following project conventions.
  Use when user says "create crud", "add feature", "generate pages",
  "tạo crud", or wants to add new frontend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Frontend CRUD

**Scope:** Creates complete CRUD UI for one feature.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `task`, `task-list`, `activity`)
2. **Project initialized?** Check `src/features/` folder exists
   - If not → Suggest: "Run `/init-base frontend` first"
3. **Feature already exists?** Check `src/features/{feature-name}/`
   - If exists → Ask: "Feature exists. Add to it or overwrite?"
4. **Backend endpoint sẵn sàng?** Check API_SPEC.md có mục cho feature này
   - If not → Vẫn sinh được, dùng type mock và ghi chú `// TODO: khớp API_SPEC`

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `v1-docs/API_SPEC.md` | Endpoints to call, request/response format, **error codes** |
| `frontend-react/docs/FE-PROJECT-RULES.md` | Coding patterns, state management rules, anti-patterns |
| `frontend-react/docs/FE-ARCHITECTURE.md` | Folder structure, query key conventions, component organization |

**Bắt buộc đọc mục "Query Key Conventions"** trong FE-ARCHITECTURE.md để đặt key và invalidate đúng.

---

## Workflow

### Step 1: Gather Information

Ask user (if not clear from context):
- Feature name: `task`, `task-list`, `activity`
- Which pages needed? (list, detail, create, edit)
- Need admin pages too?
- Bộ lọc nào cần đưa vào URL params?
- Có thao tác nào cần optimistic update không? (tick hoàn thành, kéo-thả sắp xếp)

### Step 2: Check Existing Code

- Read existing features in `src/features/` for patterns
- Check shared components available (`src/shared/components/ui`)
- Follow the same patterns exactly

### Step 3: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/index.ts
- src/features/{feature-name}/types/{feature}.types.ts
- src/features/{feature-name}/services/{feature}.service.ts
- src/features/{feature-name}/hooks/use{Feature}s.ts
- src/features/{feature-name}/hooks/use{Feature}.ts
- src/features/{feature-name}/hooks/useCreate{Feature}.ts
- src/features/{feature-name}/hooks/useUpdate{Feature}.ts
- src/features/{feature-name}/hooks/useDelete{Feature}.ts
- src/features/{feature-name}/components/{Feature}List.tsx
- src/features/{feature-name}/components/{Feature}Item.tsx
- src/features/{feature-name}/components/{Feature}Form.tsx
- src/features/{feature-name}/components/{Feature}Filters.tsx
- src/features/{feature-name}/components/{Feature}ListSkeleton.tsx
- src/features/{feature-name}/pages/{Feature}ListPage.tsx
- src/features/{feature-name}/pages/{Feature}DetailPage.tsx
- src/features/{feature-name}/CONTEXT.md

📝 Files to be UPDATED:
- src/routes/routes.ts                     → add route constants
- src/routes/index.tsx                     → add route entries
- src/shared/constants/error-messages.ts   → add {PREFIX}_00X messages (tiếng Việt)
- src/shared/components/layout/Sidebar.tsx → add nav item (if applicable)

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
├── index.ts                          # Barrel exports
├── components/
│   ├── {Feature}List.tsx            # List/table component
│   ├── {Feature}Item.tsx            # Row/card item
│   ├── {Feature}Form.tsx            # Create/Edit form (React Hook Form + Zod)
│   ├── {Feature}Filters.tsx         # Filter/search → URL params
│   └── {Feature}ListSkeleton.tsx    # Loading state
├── pages/
│   ├── {Feature}ListPage.tsx
│   ├── {Feature}DetailPage.tsx
│   ├── {Feature}CreatePage.tsx      # (if needed — ưu tiên modal hơn page riêng)
│   └── {Feature}EditPage.tsx        # (if needed)
├── hooks/
│   ├── use{Feature}s.ts             # List query hook
│   ├── use{Feature}.ts              # Single item query hook
│   ├── useCreate{Feature}.ts        # Create mutation hook
│   ├── useUpdate{Feature}.ts        # Update mutation hook
│   └── useDelete{Feature}.ts        # Delete mutation hook
├── services/
│   └── {feature}.service.ts         # API calls
├── types/
│   └── {feature}.types.ts           # TypeScript types
└── CONTEXT.md
```

### Step 5: Implement Each Layer

**Types:** Match API_SPEC.md response
```typescript
interface Task {
  id: number;
  title: string;
  status: TaskStatus;        // 'todo' | 'in_progress' | 'done' | 'cancelled'
  dueDate: string | null;    // ISO 8601 UTC, KHÔNG dùng Date
  // ... from API_SPEC.md
}
```
- Enum giữ nguyên `snake_case` từ API, nhãn tiếng Việt để riêng ở `*_LABEL`
- Ngày giờ luôn là `string` (ISO), quy đổi khi hiển thị

**Service:** API calls using shared axios
```typescript
export const taskService = {
  getAll: (params: TaskParams) => axios.get<PaginatedResponse<Task>>('/tasks', { params }),
  getById: (id: number) => axios.get<Task>(`/tasks/${id}`),
  create: (data: CreateTaskDto) => axios.post<Task>('/tasks', data),
  update: (id: number, data: UpdateTaskDto) => axios.patch<Task>(`/tasks/${id}`, data),
  remove: (id: number) => axios.delete(`/tasks/${id}`),
};
```

**Hooks:** TanStack Query wrappers
```typescript
export const useTasks = (params: TaskParams) =>
  useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getAll(params),
  });
```
- Mutation phải khai báo đủ danh sách invalidate. Với task: `['tasks']`, `['stats']`, `['activities']`
- Thao tác tần suất cao (tick hoàn thành, kéo-thả) → optimistic update kèm `onError` rollback

**Components:** Reusable UI pieces
- Use shared components from `src/shared/components/`
- Tailwind CSS for styling, không inline style
- Handle loading, error, empty states — **cả ba đều bắt buộc**
- Component tối đa 200 dòng

**Pages:** Connect everything
- Đọc filter từ `useSearchParams`, không dùng `useState`
- Truyền dữ liệu xuống component, giữ logic tối thiểu

**Error messages:** thêm vào `shared/constants/error-messages.ts`
```typescript
TASK_005: 'Còn công việc con chưa hoàn thành',
```
Không hiển thị `error.message` thô từ server.

### Step 6: Add Routes

Update `src/routes/`:
- Add route constants to `routes.ts`
- Add routes to router config (đúng nhánh: public / `ProtectedRoute` / `AdminRoute`)
- Add to navigation (if applicable)

---

## Output

```
✅ Feature "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/
  ├── index.ts
  ├── components/
  │   ├── {Feature}List.tsx
  │   ├── {Feature}Item.tsx
  │   └── {Feature}Form.tsx
  ├── pages/
  │   ├── {Feature}ListPage.tsx
  │   └── {Feature}DetailPage.tsx
  ├── hooks/
  │   ├── use{Feature}s.ts
  │   └── use{Feature}.ts
  ├── services/{feature}.service.ts
  ├── types/{feature}.types.ts
  └── CONTEXT.md

📝 Updated:
- src/routes/routes.ts (added constants)
- src/routes/index.tsx (added routes)
- src/shared/constants/error-messages.ts (added messages)

🚀 Next steps:
1. Review generated code
2. Run `npm run dev` to verify
3. Navigate to /{feature} to test
4. Kiểm tra 3 trạng thái: loading / error / empty
5. Run `/fe-test {feature}` to generate tests
```

---

## Important Rules

1. **Follow existing patterns** - Read other features first
2. **Match API_SPEC.md** - Types match API response exactly
3. **Use TanStack Query** - No `useEffect` for data fetching
4. **Use shared components** - Don't reinvent Button, Input, Modal
5. **Handle all states** - Loading, error, empty, success
6. **No `any` types** - Proper TypeScript types
7. **Filters in URL** - `useSearchParams`, không `useState`
8. **Map error by code** - Dùng `ERROR_MESSAGES[error.code]`, không hiện message thô
9. **Không tự tính ngày** - Tin mốc ngày server trả về (`/tasks/today`)
10. **Invalidate đủ** - Đổi task phải invalidate cả `stats` và `activities`
11. **`import from 'react-router'`** - không phải `react-router-dom`

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/fe-crud task`" |
| API_SPEC.md not found | Ask user for endpoint details |
| Feature already exists | Ask: "Overwrite or add to existing?" |
| Backend not ready | Can still generate with mock types |
| Shared component chưa có | Đề xuất thêm vào `shared/components/ui`, hỏi trước khi tạo |
| Không rõ nên invalidate key nào | Hỏi user thay vì đoán — invalidate thiếu gây dữ liệu cũ trên UI |
