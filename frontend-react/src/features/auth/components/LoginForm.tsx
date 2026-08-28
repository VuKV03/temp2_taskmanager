import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router';
import { Button, Input, Label } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { useLogin } from '../hooks/useLogin';
import { ROUTES } from '../../../routes/routes';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const { mutate, isPending, error } = useLogin();

  const onSubmit = (values: LoginFormValues) => mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border border-border bg-surface p-6 shadow-sm">
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
          autoComplete="current-password"
          error={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-small text-red-600">{errors.password.message}</p>}
      </div>

      {error && <p className="text-small text-red-600">{getErrorMessage(error.code)}</p>}

      <Button type="submit" isLoading={isPending} className="w-full">
        Đăng nhập
      </Button>

      <p className="text-center text-small text-text-muted">
        Chưa có tài khoản?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium">
          Đăng ký
        </Link>
      </p>
    </form>
  );
};
