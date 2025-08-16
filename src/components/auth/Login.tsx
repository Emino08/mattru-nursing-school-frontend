// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Label } from '@/components/ui/Label';
// import { useForm } from 'react-hook-form';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import api from '@/services/api';
// import { Link } from 'react-router-dom';
//
// interface FormData {
//     email: string;
//     password: string;
// }
//
// export default function Login() {
//     const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
//     const navigate = useNavigate();
//
//     const onSubmit = async (data: FormData) => {
//         try {
//             const res = await api.post('/login', data);
//             localStorage.setItem('token', res.data.token);
//             const role = JSON.parse(atob(res.data.token.split('.')[1])).role;
//             toast({ title: 'Success', description: 'Logged in successfully' });
//             navigate(role === 'applicant' ? '/applicant' : role === 'bank' ? '/bank' : '/admin');
//         } catch (error) {
//             toast({ title: 'Error', description: 'Invalid credentials or unverified email', variant: 'destructive' });
//         }
//     };
//
//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
//             <div className="w-full max-w-md">
//                 <div className="bg-white rounded-lg shadow-card p-8 animate-fadeIn">
//                     <div className="text-center mb-8">
//                         <h1 className="text-3xl font-bold" style={{ color: '#2563EB' }}>Welcome Back</h1>
//                         <p className="text-gray-500 mt-2">Sign in to continue to your account</p>
//                     </div>
//
//                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//                         <div className="space-y-2">
//                             <Label className="text-gray-700 font-medium" htmlFor="email">Email Address</Label>
//                             <Input
//                                 id="email"
//                                 {...register('email', {
//                                     required: 'Email is required',
//                                     pattern: {
//                                         value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                                         message: "Invalid email address"
//                                     }
//                                 })}
//                                 placeholder="name@example.com"
//                                 className="h-12 px-4 border-gray-200"
//                             />
//                             {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
//                         </div>
//
//                         <div className="space-y-2">
//                             <div className="flex justify-between">
//                                 <Label className="text-gray-700 font-medium" htmlFor="password">Password</Label>
//                                 <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: '#FF59A1' }}>
//                                     Forgot password?
//                                 </Link>
//                             </div>
//                             <Input
//                                 id="password"
//                                 {...register('password', {
//                                     required: 'Password is required'
//                                 })}
//                                 type="password"
//                                 placeholder="••••••••"
//                                 className="h-12 px-4 border-gray-200"
//                             />
//                             {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
//                         </div>
//
//                         <Button
//                             type="submit"
//                             className="w-full h-12 text-white transition-all"
//                             style={{
//                                 backgroundColor: '#2563EB',
//                                 boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
//                             }}
//                             onMouseOver={(e) => {
//                                 e.currentTarget.style.backgroundColor = '#1D4ED8';
//                                 e.currentTarget.style.boxShadow = '0 8px 9px -4px rgba(37, 99, 235, 0.2), 0 4px 18px 0 rgba(37, 99, 235, 0.1)';
//                             }}
//                             onMouseOut={(e) => {
//                                 e.currentTarget.style.backgroundColor = '#2563EB';
//                                 e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.25)';
//                             }}
//                         >
//                             Sign In
//                         </Button>
//                     </form>
//
//                     <div className="mt-6 text-center">
//                         <p className="text-gray-500">
//                             Don't have an account?{' '}
//                             <Link to="/register" className="hover:underline" style={{ color: '#FF59A1' }}>
//                                 Sign up now
//                             </Link>
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth, User } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FormData {
    email: string;
    password: string;
}

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const getRedirectPath = (user: User) => {
        switch (user.role) {
            case 'applicant': return '/applicant';
            case 'bank': return '/bank';
            case 'admin': return '/admin';
            default: return '/login';
        }
    };

    const onSubmit = async (data: FormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            console.log('Attempting login...');
            const res = await api.post('/login', data);
            const { token } = res.data;

            if (!token) {
                throw new Error('No token received from server');
            }

            console.log('Token received, calling login function...');

            // Await the login function to ensure state is updated
            const user = await login(token);

            console.log('Login function completed, user:', user);

            toast.success('Login successful!', {
                description: 'Redirecting to your dashboard...'
            });

            // Navigate immediately after login is complete
            const redirectPath = getRedirectPath(user);
            console.log('Redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });

        } catch (error: never) {
            console.error('Login error:', error);

            let errorMessage = 'An error occurred during login';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Invalid credentials or unverified email';
            }

            toast.error('Login failed', {
                description: errorMessage,
                duration: 4000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }

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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 text-white transition-all"
                            style={{
                                backgroundColor: isSubmitting ? '#9CA3AF' : '#2563EB',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
                            }}
                        >
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
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