import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import { Link } from 'react-router-dom';

interface FormData {
    email: string;
    password: string;
}

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const navigate = useNavigate();

    const onSubmit = async (data: FormData) => {
        try {
            const res = await api.post('/login', data);
            localStorage.setItem('token', res.data.token);
            const role = JSON.parse(atob(res.data.token.split('.')[1])).role;
            toast({ title: 'Success', description: 'Logged in successfully' });
            navigate(role === 'applicant' ? '/applicant' : role === 'bank' ? '/bank' : '/admin');
        } catch (error) {
            toast({ title: 'Error', description: 'Invalid credentials or unverified email', variant: 'destructive' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-card p-8 animate-fadeIn">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold" style={{ color: '#2563EB' }}>Welcome Back</h1>
                        <p className="text-gray-500 mt-2">Sign in to continue to your account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium" htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                                placeholder="name@example.com"
                                className="h-12 px-4 border-gray-200"
                            />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-gray-700 font-medium" htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: '#FF59A1' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                {...register('password', {
                                    required: 'Password is required'
                                })}
                                type="password"
                                placeholder="••••••••"
                                className="h-12 px-4 border-gray-200"
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-white transition-all"
                            style={{
                                backgroundColor: '#2563EB',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#1D4ED8';
                                e.currentTarget.style.boxShadow = '0 8px 9px -4px rgba(37, 99, 235, 0.2), 0 4px 18px 0 rgba(37, 99, 235, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563EB';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.25)';
                            }}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="hover:underline" style={{ color: '#FF59A1' }}>
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}