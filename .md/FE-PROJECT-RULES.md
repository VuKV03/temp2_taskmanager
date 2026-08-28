# Frontend Project Rules

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 + Vite | Framework |
| TypeScript (strict) | Language |
| Zustand | Global state (auth, UI preference) |
| TanStack Query | Server state |
| Tailwind CSS | Styling |
| React Hook Form + Zod | Forms |
| React Router v7 | Routing |
| Axios | HTTP client |
| Recharts | Biểu đồ thống kê |
| dnd-kit | Kéo-thả sắp xếp task |
| Luxon | Xử lý ngày giờ theo timezone |

---

## 1. Feature Structure

```
src/
├── features/
│   ├── auth/               # login, register, JWT, phân quyền
│   ├── task-list/          # danh sách (list) CRUD, sidebar
│   ├── task/               # task CRUD, hôm nay, quá hạn, tag, subtask
│   ├── activity/           # lịch sử thao tác
│   ├── statistic/          # dashboard thống kê
│   ├── notification/       # thông báo, nhắc hạn
│   └── user-management/    # quản lý người dùng (admin only)
├── shared/
│   ├── components/         # Button, Input, Modal
│   ├── hooks/              # useDebounce, useMediaQuery
│   ├── layouts/            # MainLayout, AuthLayout, AdminLayout
│   ├── lib/                # axios instance, queryClient, datetime
│   ├── constants/          # error messages, page size
│   └── types/              # common types
├── routes/
│   ├── index.tsx           # createBrowserRouter
│   ├── routes.ts           # ROUTES constants
│   ├── ProtectedRoute.tsx
│   └── AdminRoute.tsx
└── config/
```

**Each feature folder:**
```
features/[feature-name]/
├── components/         # Feature-specific components
├── hooks/              # TanStack Query hooks
├── services/           # API calls
├── stores/             # Zustand (if needed)
├── types/
├── pages/
├── index.ts            # Barrel exports
└── CONTEXT.md
```

Tên feature FE **trùng tên feature BE**. Chỉ `auth` ở FE có `stores/` — các feature khác không cần global state.

---

## 2. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Feature folders | kebab-case | `task-list/`, `user-management/` |
| Components | PascalCase | `TaskItem.tsx` |
| Hooks | camelCase + use | `useTodayTasks.ts` |
| Services | .service suffix | `task.service.ts` |
| Stores | .store suffix | `auth.store.ts` |
| Types | .types suffix | `task.types.ts` |
| Pages | PascalCase + Page | `TaskListPage.tsx` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `PAGE_SIZE` |
| Route paths | UPPER_SNAKE_CASE | `ROUTES.TASK_DETAIL` |
| Query keys | mảng, danh từ số nhiều | `['tasks', 'today']` |
| Boolean props | is/has/can prefix | `isLoading`, `canEdit` |
| Handler props | on prefix | `onSelect`, `onStatusChange` |

**Enum từ API giữ nguyên `snake_case`** (`in_progress`), chỉ đổi sang nhãn tiếng Việt ở tầng hiển thị:

```ts
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};
```

---

## 3. Feature Rules

### Feature Boundaries

| Feature | Owns |
|---------|------|
| auth | login, register, logout, auth state, đổi mật khẩu |
| task-list | CRUD danh sách, sắp xếp sidebar |
| task | CRUD task, hôm nay, quá hạn, subtask, tag, filter |
| activity | trang lịch sử, timeline trong chi tiết task |
| statistic | dashboard, biểu đồ, chọn khoảng ngày |
| notification | dropdown thông báo, badge chưa đọc |
| user-management | danh sách user, đổi role, khoá tài khoản (admin) |

### Cross-Feature Communication

```tsx
// ✅ DO: Import from barrel file
import { useAuthStore } from '@/features/auth';

// ✅ DO: Use URL state
const [searchParams] = useSearchParams();
const status = searchParams.get('status');

// ❌ DON'T: Import internal files
import { TaskItem } from '../task/components/TaskItem'; // WRONG
```

---

## 4. Code Patterns

### API Calls (Services + TanStack Query)

```tsx
// services/task.service.ts
export const taskService = {
  getAll: (params: TaskParams) =>
    axios.get<PaginatedResponse<Task>>('/tasks', { params }),
  getToday: () =>
    axios.get<TodayTasks>('/tasks/today'),
  updateStatus: (id: number, status: TaskStatus) =>
    axios.patch<Task>(`/tasks/${id}/status`, { status }),
};

// hooks/useTasks.ts
export const useTasks = (params: TaskParams) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getAll(params),
  });
};

// ❌ DON'T: API calls in components
useEffect(() => { axios.get('/tasks')... }, []); // WRONG
```

### Optimistic Update (tick hoàn thành)

```tsx
export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateStatusVars) =>
      taskService.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueriesData({ queryKey: ['tasks'] });
      qc.setQueriesData({ queryKey: ['tasks'] }, updateTaskInCache(id, { status }));
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Không cập nhật được trạng thái');
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });      // ĐỪNG QUÊN
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};
```

### Error Handling

```tsx
// ✅ DO: map theo error.code, không hiển thị message thô từ server
export const ERROR_MESSAGES: Record<string, string> = {
  TASK_003: 'Không thể chuyển sang trạng thái này',
  TASK_005: 'Còn công việc con chưa hoàn thành',
  AUTH_004: 'Bạn không có quyền thực hiện thao tác này',
  AUTH_006: 'Tài khoản đã bị khoá',
};

const message = ERROR_MESSAGES[error.code] ?? 'Có lỗi xảy ra, vui lòng thử lại';

// ❌ DON'T
toast.error(error.response.data.error.message); // WRONG — tiếng Anh, lộ chi tiết nội bộ
```

### Date & Timezone

```tsx
// ✅ DO: gửi ISO 8601 UTC lên server, hiển thị theo giờ local
const dueDate = DateTime.fromJSDate(picked).toUTC().toISO();
const label = DateTime.fromISO(task.dueDate).toLocal().toFormat('dd/MM HH:mm');

// ✅ DO: tin mốc ngày do server tính
const { data } = useTodayTasks();   // đã tách sẵn overdue / today

// ❌ DON'T: FE tự lọc lại theo ngày
tasks.filter((t) => new Date(t.dueDate).toDateString() === new Date().toDateString());
```

### State Management

```tsx
// ✅ Local state first
const [isDrawerOpen, setDrawerOpen] = useState(false);

// ✅ Server state: TanStack Query
const { data, isLoading } = useTasks(params);

// ✅ Global state: Zustand (auth, UI preference only)
const { user, logout } = useAuthStore();

// ✅ URL state: filters, pagination
const [searchParams, setSearchParams] = useSearchParams();
```

### Routing (React Router v7)

```tsx
// routes/routes.ts
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  TODAY: '/',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:id',
  LIST_DETAIL: '/lists/:id',
  STATISTIC: '/statistic',
  HISTORY: '/history',
  ADMIN_USERS: '/admin/users',
} as const;

// Usage
import { useNavigate, useParams } from 'react-router'; // NOT react-router-dom

const navigate = useNavigate();
const { id } = useParams<{ id: string }>();

navigate(ROUTES.TASK_DETAIL.replace(':id', String(id)));
```

### Form Handling

```tsx
// ✅ DO: React Hook Form + Zod
const taskSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(255),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().datetime().optional(),
  listId: z.number().optional(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(taskSchema),
});
```

Zod schema phải khớp với DTO của BE. Lệch schema → user điền xong mới nhận lỗi `SYS_002` từ server.

### Authentication

```tsx
// ✅ Axios interceptor for auto-refresh (chỉ gọi refresh 1 lần)
let refreshPromise: Promise<void> | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      refreshPromise ??= refreshToken().finally(() => { refreshPromise = null; });
      await refreshPromise;
      return axiosInstance(error.config);
    }
    return Promise.reject(error);
  },
);

// ✅ ProtectedRoute with Navigate
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Outlet />;
};

// ✅ AdminRoute — chỉ là UX, server vẫn chặn độc lập
const AdminRoute = () => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to={ROUTES.TODAY} replace />;
  return <Outlet />;
};
```

---

## 5. Anti-Patterns (DON'T)

| ❌ DON'T | ✅ DO |
|----------|-------|
| Import feature internals | Use barrel exports (index.ts) |
| API calls in components | Use services + hooks |
| `useEffect` for fetching | Use TanStack Query |
| Server data in Zustand | Use TanStack Query cache |
| Hardcode route paths | Use `ROUTES` constants |
| `import from 'react-router-dom'` | `import from 'react-router'` |
| Inline styles | Use Tailwind classes |
| Use `any` type | Enable strict mode |
| localStorage for tokens | httpOnly cookie + memory |
| Deep prop drilling | Use context or composition |
| FE tự lọc task theo "hôm nay" | Dùng `/tasks/today` của server |
| Hiển thị message lỗi thô từ API | Map theo `error.code` |
| Ẩn nút admin coi như đã phân quyền | Server chặn bằng guard, FE chỉ ẩn cho gọn |
| Quên invalidate `['stats']` sau khi đổi task | Invalidate cả `tasks`, `stats`, `activities` |
| Gửi `Date` object lên API | Gửi chuỗi ISO 8601 UTC |
| Lưu filter trong `useState` | Đưa vào URL params |

---

## 6. Component Rules

```tsx
// Structure: Imports → Types → Component → Export

// 1. Imports
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { StatusBadge } from './StatusBadge';

// 2. Types
interface Props {
  task: Task;
  onOpenDetail: (id: number) => void;
}

// 3. Component (max 200 lines)
export const TaskItem = ({ task, onOpenDetail }: Props) => {
  const { mutate, isPending } = useUpdateTaskStatus();

  const toggle = () =>
    mutate({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' });

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
      <input
        type="checkbox"
        checked={task.status === 'done'}
        disabled={isPending}
        onChange={toggle}
        aria-label={`Đánh dấu hoàn thành: ${task.title}`}
      />
      <button onClick={() => onOpenDetail(task.id)} className="flex-1 text-left">
        {task.title}
      </button>
      <StatusBadge status={task.status} />
    </div>
  );
};
```

**Bắt buộc:** mọi trang có 3 trạng thái — `isLoading` → Skeleton, `isError` → thông báo lỗi kèm nút thử lại, `data.length === 0` → EmptyState có nút hành động.

---

## 7. Git Workflow

### Branch Naming
```
feature/task-today-page
fix/status-toggle-rollback
refactor/task-filters-url-state
```

### Commit Messages
```
feat: add today page with overdue section
fix: rollback optimistic update on status error
style: improve task item spacing on mobile
```

### PR Requirements
- ✅ One feature/fix per PR
- ✅ Screenshots for UI changes
- ✅ Update CONTEXT.md if logic changes
- ✅ Không còn `console.log`, không còn `any`
- ✅ Đã kiểm tra 3 trạng thái loading / error / empty

---

## 8. Testing

| Focus Area | Priority |
|------------|----------|
| Optimistic update + rollback khi lỗi | Critical |
| Auth flow (login, refresh, logout) | Critical |
| Phân quyền route admin | High |
| Bộ lọc đồng bộ với URL | High |
| Form validations | Medium |

```tsx
// TaskItem.test.tsx
describe('TaskItem', () => {
  it('should revert checkbox when the request fails', async () => {
    server.use(http.patch('/api/v1/tasks/1/status', () => HttpResponse.error()));
    render(<TaskItem task={mockTask} onOpenDetail={vi.fn()} />);

    await userEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());
  });
});
```

**Skip testing**: Pure UI components, third-party wrappers
