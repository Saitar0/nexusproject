import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(['client', 'developer']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'client',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError('');

    const result = await registerUser({
      email: data.email,
      username: data.username,
      password: data.password,
      role: data.role,
    });

    if (result.success) {
      navigate('/store');
    } else {
      setApiError(result.error || 'Erro desconhecido ao registrar');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-sidebar border-slate-700">
        <CardHeader>
          <CardTitle className="text-accent">Criar Conta</CardTitle>
          <CardDescription>Registre-se no MinhaLoja</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-md text-red-200 text-sm">
                {apiError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className="bg-background border-slate-700"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Username
              </label>
              <Input
                type="text"
                placeholder="seu_usuario"
                {...register('username')}
                className="bg-background border-slate-700"
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="bg-background border-slate-700"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Confirmar Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="bg-background border-slate-700"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tipo de Conta
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 bg-background border border-slate-700 rounded-md text-white"
              >
                <option value="client">Cliente</option>
                <option value="developer">Desenvolvedor</option>
              </select>
              {errors.role && (
                <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Registrar'}
            </Button>

            <div className="text-center text-slate-400 text-sm">
              Já tem conta?{' '}
              <Link to="/login" className="text-accent hover:underline">
                Faça login aqui
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
