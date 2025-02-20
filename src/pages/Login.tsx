import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Link,
} from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Mail, Lock } from 'lucide-react';
import { signIn } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const { user, session } = await signIn(data.email, data.password);
      
      dispatch(setCredentials({
        user,
        token: session.access_token,
      }));
      
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex gap-3 justify-center p-5">
          <CreditCard className="text-primary" size={40} />
          <div className="flex flex-col items-center">
            <p className="text-xl font-bold">CreditGest</p>
            <p className="text-small text-default-500">
              Sistema de Gestión de Créditos
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {error && (
              <div className="text-danger text-center text-small">{error}</div>
            )}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Correo electrónico"
                  placeholder="correo@ejemplo.com"
                  startContent={<Mail className="text-default-400" size={16} />}
                  errorMessage={errors.email?.message}
                  isInvalid={!!errors.email}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  label="Contraseña"
                  placeholder="Ingrese su contraseña"
                  startContent={<Lock className="text-default-400" size={16} />}
                  errorMessage={errors.password?.message}
                  isInvalid={!!errors.password}
                />
              )}
            />
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="mt-2"
            >
              Iniciar sesión
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}