import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast.error(error.message);
      } else {
        // Wait a moment for admin status to be checked
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 3000);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 bg-white/95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-xl flex items-center justify-center">
              <Shield size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to access the BlinkQ Admin Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Admin Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="Enter your admin email"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            loading={loading}
            size="lg"
          >
            Access Admin Portal
          </Button>

          <div className="text-center">
            <Link to="/" className="text-sm text-blue-600 hover:text-blue-500">
              ← Back to Store
            </Link>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Access:</h3>
          <p className="text-xs text-blue-700">
            Email: admin@blinkq.com<br/>
            Password: Create this account first or contact system administrator.
          </p>
        </div>
      </Card>
    </div>
  );
}