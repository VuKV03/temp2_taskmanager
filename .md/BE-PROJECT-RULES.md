# Backend Project Rules

## Tech Stack

| Technology | Version |
|------------|---------|
| Language | TypeScript |
| Framework | NestJS v11 |
| ORM | TypeORM |
| Database | MySQL 8.x |
| Cache / Queue | Redis 7 + BullMQ |

---

## 1. Feature Structure

```
src/
├── features/
│   ├── auth/               # roles, users, refresh_tokens, JWT, guards
│   ├── user-management/    # admin CRUD user, đổi role, khoá tài khoản
│   ├── task-list/          # task_lists
│   ├── task/               # tasks, tags, task_tags, today, overdue
│   ├── collaboration/      # task_comments, task_attachments
│   ├── activity/           # task_activities (lịch sử, append-only)
│   ├── statistic/          # user_daily_stats, dashboard
│   └── notification/       # notifications, nhắc hạn
├── shared/                 # cross-feature utilities
│   ├── decorators/         # @CurrentUser(), @Roles(), @Public()
│   ├── filters/            # global exception filter
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── interceptors/       # response transformation
│   ├── pipes/              # validation, transformation
│   ├── constants/          # error codes, enums dùng chung
│   └── utils/              # pagination, hash, date-range
├── core/                   # infrastructure modules
│   ├── database/           # TypeORM connection
│   ├── logger/             # Pino, requestId
│   ├── cache/              # Redis cache manager
│   ├── queue/              # BullMQ registration
│   └── storage/            # local | S3 driver
└── config/                 # environment configs
```

**Each feature folder:**
```
features/[feature-name]/
├── [feature].module.ts
├── [feature].controller.ts
├── [feature].service.ts
├── repositories/[entity].repository.ts
├── dto/create-[entity].dto.ts
├── entities/[entity].entity.ts
├── types/[feature].types.ts
├── processors/[job].processor.ts    # nếu feature có job nền
├── tests/[feature].service.spec.ts
└── CONTEXT.md
```

**Feature phức tạp** (nhiều controller/service, ví dụ `task/`): tách `controllers/`, `services/` thành thư mục. Ngưỡng: một service vượt ~300 dòng hoặc phục vụ 2 trường hợp sử dụng không liên quan.

---

## 2. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Feature folders | kebab-case | `task-list/`, `user-management/` |
| Files | kebab-case | `create-task.dto.ts`, `task.entity.ts` |
| Classes | PascalCase | `TaskService`, `CreateTaskDto` |
| Functions/Methods | camelCase | `findById()`, `updateStatus()` |
| Variables | camelCase | `taskId`, `dueDate` |
| Constants | UPPER_SNAKE_CASE | `MAX_SUBTASK_DEPTH`, `ERROR_CODES` |
| Interfaces/Types | PascalCase + prefix/suffix | `IJwtPayload`, `TaskStatusType` |
| Entities | PascalCase singular | `Task`, `TaskActivity` |
| DB columns | snake_case | `due_date`, `completed_at` |
| JSON response | camelCase | `dueDate`, `completedAt` |
| Enum values | snake_case (giữ nguyên khi trả về API) | `in_progress`, `status_changed` |

**Ranh giới đặt tên**: DB dùng `snake_case`, API trả `camelCase`. Việc chuyển đổi làm ở tầng DTO, không dùng naming strategy tự động của TypeORM (khó debug khi query thủ công).

---

## 3. Feature Rules

### Feature Boundaries

| Feature | Owns | Notes |
|---------|------|-------|
| auth | roles, users, refresh_tokens | JWT, guards, session |
| user-management | (không sở hữu bảng) | Đọc/ghi `users` qua `AuthModule` export |
| task-list | task_lists | Chỉ owner truy cập |
| task | tasks, tags, task_tags | Trung tâm nghiệp vụ |
| collaboration | task_comments, task_attachments | Luôn gắn với 1 task |
| activity | task_activities | **Append-only**, có snapshot `task_title` |
| statistic | user_daily_stats | **Chỉ đọc** bảng của feature khác |
| notification | notifications | Sinh từ event + cron |

### Cross-Feature Communication

```typescript
// ✅ DO: Use NestJS module imports
@Module({
  imports: [TaskListModule, ActivityModule], // explicit dependency
  providers: [TaskService],
})
export class TaskModule {}

// ✅ DO: Use EventEmitter for async (việc phụ, mất cũng không sao)
this.eventEmitter.emit('task.assigned', { taskId, assigneeId });

// ❌ DON'T: Direct internal imports
import { TaskRepository } from '../task/repositories/task.repository'; // WRONG
```

### Exception: Activity Logging

Ghi lịch sử **không** dùng EventEmitter. Log phải nằm cùng transaction với thao tác chính, nếu không transaction rollback mà log vẫn ghi.

```typescript
// ✅ DO: truyền EntityManager xuống logger
async log(manager: EntityManager, payload: LogActivityPayload): Promise<void>

// ❌ DON'T
this.eventEmitter.emit('task.updated', payload); // log có thể ghi khi rollback
```

---

## 4. Code Patterns

### Error Handling

```typescript
// ✅ DO: AppException kèm error code trong shared/constants
throw new AppException(ERROR_CODES.TASK_NOT_FOUND, HttpStatus.NOT_FOUND);
throw new AppException(ERROR_CODES.TASK_INVALID_TRANSITION, HttpStatus.BAD_REQUEST, {
  from: task.status,
  to: newStatus,
});

// ✅ DO: Custom exception cho lỗi lặp lại nhiều nơi
export class TaskNotFoundException extends AppException {
  constructor(id: number) {
    super(ERROR_CODES.TASK_NOT_FOUND, HttpStatus.NOT_FOUND, { taskId: id });
  }
}

// ❌ DON'T: NestJS exception trần — FE không có mã lỗi để xử lý
throw new NotFoundException(`Task #${id} not found`); // WRONG
```

Mọi mã lỗi khai báo tập trung tại `shared/constants/error-codes.constant.ts`, khớp 1-1 với bảng trong `API_SPEC.md`.

### Validation (DTOs)

```typescript
// ✅ DO: class-validator in DTOs
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @IsInt({ each: true })
  @IsOptional()
  tagIds?: number[];
}

// ❌ DON'T: nhận field nhạy cảm từ client
export class CreateTaskDto {
  creatorId: number; // WRONG — lấy từ token
}
```

### Response Format

```typescript
// Success
{ success: true, data: {...}, message: 'Created successfully' }

// Error
{ success: false, error: { code: 'TASK_001', message: 'Task not found', details: {} } }

// Pagination
{ success: true, data: [...], meta: { page: 1, limit: 20, total: 95, totalPages: 5 } }
```

Format do `TransformInterceptor` + `HttpExceptionFilter` bọc tự động. **Service và controller không tự dựng object này.**

### Repository Pattern

```typescript
// ✅ DO: Complex queries in repository
@Injectable()
export class TaskRepository {
  async findTodayTasks(userId: number, start: Date, end: Date): Promise<Task[]> {
    return this.createQueryBuilder('task')
      .leftJoinAndSelect('task.list', 'list')
      .leftJoinAndSelect('task.tags', 'tag')
      .where('task.assignee_id = :userId', { userId })
      .andWhere('task.due_date >= :start AND task.due_date < :end', { start, end })
      .andWhere('task.status NOT IN (:...done)', { done: ['done', 'cancelled'] })
      .andWhere('task.is_archived = false')
      .getMany();
  }
}

// ❌ DON'T: Queries in service
// this.taskRepo.createQueryBuilder()... // WRONG place
```

Repository **không** kiểm tra quyền và **không** ném lỗi nghiệp vụ — đó là việc của service.

### Ownership Check

```typescript
// ✅ DO: kiểm tra ở service, userId lấy từ token
async findOne(user: IJwtPayload, id: number): Promise<Task> {
  const task = await this.taskRepository.findById(id);
  if (!task) throw new TaskNotFoundException(id);
  if (task.creatorId !== user.id && task.assigneeId !== user.id && user.role !== 'admin') {
    throw new AppException(ERROR_CODES.TASK_FORBIDDEN, HttpStatus.FORBIDDEN);
  }
  return task;
}

// ❌ DON'T: tin userId từ query/body
async findOne(@Query('userId') userId: number) {} // WRONG — IDOR
```

### Date & Timezone

```typescript
// ✅ DO: tính mốc ngày ở service theo timezone user
const { start, end } = getDayRange(user.timezone);
return this.taskRepository.findTodayTasks(user.id, start, end);

// ❌ DON'T: dùng hàm ngày của MySQL trong logic nghiệp vụ
.andWhere('DATE(task.due_date) = CURDATE()') // WRONG — sai với user khác múi giờ
```

### Transaction

```typescript
// ✅ DO: mọi thay đổi trên tasks đi kèm ghi activity, cùng 1 transaction
return this.dataSource.transaction(async (manager) => {
  await manager.save(task);
  await this.activityLogger.log(manager, { ...payload });
});
```

### Logging

```typescript
// ✅ DO: Logger at service level
private readonly logger = new Logger(TaskService.name);

async updateStatus(userId: number, taskId: number) {
  this.logger.log(`User ${userId} updating status of task ${taskId}`);
}

// ❌ DON'T: log dữ liệu nhạy cảm
this.logger.log(`Login: ${dto.email} / ${dto.password}`); // WRONG
```

---

## 5. Anti-Patterns (DON'T)

| ❌ DON'T | ✅ DO |
|----------|-------|
| Import from another feature's internal files | Use module exports/imports |
| Business logic in controllers | Keep logic in services |
| Raw SQL in services | Use repository pattern |
| Hardcode configs | Use `ConfigService` |
| Store plain passwords | Use Argon2id hash |
| Lấy `userId` từ body/query | Lấy từ JWT qua `@CurrentUser()` |
| Nhận `role` từ DTO đăng ký | Gán cứng `member` ở service |
| Dùng `CURDATE()`/`NOW()` cho logic theo ngày | Tính `start`/`end` theo `users.timezone` |
| Thống kê dựa trên `updated_at` | Dựa trên `completed_at` |
| Xoá cứng task | Soft delete `is_archived = true` |
| Ghi activity bằng event bất đồng bộ | Truyền `EntityManager` vào logger |
| JOIN `tasks` để lấy tên trong trang lịch sử | Đọc snapshot `task_title` |
| Subtask lồng nhiều cấp | Giới hạn 1 cấp (`TASK_004`) |
| `synchronize: true` | Migration có `up()` và `down()` |
| Chạy migration trong `main.ts` | Bước riêng khi deploy |
| Circular feature dependencies | Use EventEmitter for decoupling |

---

## 6. Git Workflow

### Branch Naming

```
[type]/[feature]-[short-description]

feature/task-today-view
fix/activity-log-rollback
refactor/task-status-state-machine
```

### Commit Messages

```
[type]: [description]

feat: add today view with timezone-aware date range
fix: prevent activity log write on transaction rollback
refactor: extract status transition to state machine service
```

### PR Requirements

- ✅ Linked to issue/task
- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ Migration có cả `up()` và `down()`
- ✅ Cập nhật `CONTEXT.md` nếu đổi ranh giới feature
- ✅ Cập nhật `API_SPEC.md` nếu đổi request/response
- ✅ 1+ team member review

---

## 7. Testing

| Layer | Coverage | Location |
|-------|----------|----------|
| Services | 80%+ | `tests/[feature].service.spec.ts` |
| Controllers | 70%+ | `tests/[feature].controller.spec.ts` |
| Repositories | 60%+ | `tests/[entity].repository.spec.ts` |

**Bắt buộc có test cho:**
- State machine của task (mọi transition hợp lệ và không hợp lệ)
- Phân quyền admin / member trên từng endpoint `/admin/*`
- Tính mốc ngày theo timezone (ít nhất 2 múi giờ khác nhau)
- `completionRate` khi mẫu số bằng 0
- Rollback transaction không để lại bản ghi `task_activities`

### Test Structure

```typescript
describe('TaskStatusService', () => {
  describe('updateStatus', () => {
    it('should set completedAt when moving to done', async () => {
      // Arrange
      const task = createTask({ status: 'in_progress' });

      // Act
      const result = await service.updateStatus(user, task.id, 'done');

      // Assert
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should throw TASK_003 when reopening a cancelled task', async () => {
      const task = createTask({ status: 'cancelled' });

      await expect(service.updateStatus(user, task.id, 'todo')).rejects.toMatchObject({
        code: 'TASK_003',
      });
    });
  });
});
```

---

## 8. NestJS Decorators Quick Reference

```typescript
// Custom decorators
@CurrentUser()      // Get user from request (id, role, timezone)
@Roles('admin')     // Role-based access
@Public()           // Skip auth guard

// Guards
@UseGuards(JwtAuthGuard, RolesGuard)

// Rate limit (auth endpoints)
@Throttle({ default: { limit: 5, ttl: 60000 } })

// Transactions (status change, checkout-like flows)
await this.dataSource.transaction(async (manager) => {
  const task = await manager.findOneOrFail(Task, { where: { id } });
  task.status = TaskStatus.DONE;
  task.completedAt = new Date();
  await manager.save(task);
  await this.activityLogger.log(manager, { taskId: task.id, action: 'status_changed' });
});

// Cron job (chỉ chạy ở 1 instance — cần distributed lock)
@Cron('5 0 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
async generateRecurringTasks() {}
```
