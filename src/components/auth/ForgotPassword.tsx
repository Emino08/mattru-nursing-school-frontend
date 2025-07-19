import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Form validation schema
const formSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof formSchema>;

export function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '' },
    });

    const navigate = useNavigate();

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            await api.post('/forgot-password', data);
            toast.success('Password reset email sent');
            navigate('/login');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'User not found or service unavailable';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-card p-8 animate-fadeIn">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold" style={{ color: '#2563EB' }}>Forgot Password</h1>
                        <p className="text-gray-500 mt-2">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium" htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                {...register('email')}
                                type="email"
                                autoComplete="email"
                                placeholder="name@example.com"
                                className="h-12 px-4 border-gray-200"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email.message}</p>
                            )}
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
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <div className="text-center text-sm">
                            <Link to="/login" className="hover:underline" style={{ color: '#FF59A1' }}>
                                Back to login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}