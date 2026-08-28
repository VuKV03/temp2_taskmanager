import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button, Input, Label, Select } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { useRegister } from '../hooks/useRegister';
import { ROUTES } from '../../../routes/routes';

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) Hà Nội, Hồ Chí Minh' },
  { value: 'Asia/Bangkok', label: '(GMT+7) Bangkok' },
  { value: 'Asia/Singapore', label: '(GMT+8) Singapore' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' },
  { value: 'UTC', label: '(UTC) Giờ quốc tế' },
];

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(100),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Mật khẩu phải có cả chữ và số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    timezone: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { timezone: 'Asia/Ho_Chi_Minh' },
  });
  const { mutate, isPending, error } = useRegister();

  const onSubmit = (values: RegisterFormValues) => {
    mutate(
      { email: values.email, password: values.password, fullName: values.fullName, timezone: values.timezone },
      {
        onSuccess: () => {
          toast.success('Đăng ký thành công, vui lòng đăng nhập');
          navigate(ROUTES.LOGIN);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border border-border bg-surface p-6 shadow-sm">
      <div>
        <Label htmlFor="fullName">Họ tên</Label>
        <Input id="fullName" autoComplete="name" error={!!errors.fullName} {...register('fullName')} />
        {errors.fullName && <p className="mt-1 text-small text-red-600">{errors.fullName.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={!!errors.email} {...register('email')} />
        {errors.email && <p className="mt-1 text-small text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          error={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-small text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="mt-1 text-small text-red-600">{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <Label htmlFor="timezone">Múi giờ</Label>
        <Select id="timezone" {...register('timezone')}>
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="text-small text-red-600">{getErrorMessage(error.code)}</p>}

      <Button type="submit" isLoading={isPending} className="w-full">
        Đăng ký
      </Button>

      <p className="text-center text-small text-text-muted">
        Đã có tài khoản?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
};
