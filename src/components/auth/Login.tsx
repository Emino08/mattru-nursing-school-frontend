import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, User } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Loader2, Building2 } from 'lucide-react';

interface FormData {
    email: string;
    password: string;
}

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
            const res = await api.post('/login', data);
            const { token } = res.data;

            if (!token) {
                throw new Error('No token received from server');
            }

            const user = await login(token);

            toast.success('Login successful!', {
                description: 'Redirecting to your dashboard...'
            });

                const redirectPath = getRedirectPath(user);
                navigate(redirectPath, { replace: true });
            // Use setTimeout to ensure state updates are complete
            // setTimeout(() => {
            //     const redirectPath = getRedirectPath(user);
            //     navigate(redirectPath, { replace: true });
            // }, 100);

        } catch (error: unknown) {
            console.error('Login error:', error);

            let errorMessage = 'An error occurred during login';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
                if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                } else if (axiosError.response?.status === 401) {
                    errorMessage = 'Invalid credentials or unverified email';
                }
            }

            toast.error('Login failed', {
                description: errorMessage,
                duration: 4000
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    // Show loading state with enhanced design
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h3>
                        <p className="text-gray-500">Authenticating your session</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-100/30 to-transparent rounded-full transform rotate-12"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-100/30 to-transparent rounded-full transform -rotate-12"></div>
                <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-purple-200/20 rounded-full blur-xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 relative overflow-hidden">
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 rounded-3xl"></div>

                    <div className="relative z-10">
                        {/* Header Section */}
                        <div className="text-center mb-10">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-110">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3 animate-fade-in">
                                Welcome Back
                            </h1>
                            <p className="text-gray-600 font-medium text-lg">Sign in to access your account</p>
                            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4 shadow-sm"></div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>                            {/* Email Field */}
                            <div className="space-y-3">
                                <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm" htmlFor="email">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                    Email Address
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address'
                                            }
                                        })}
                                        type="email"
                                        placeholder="name@example.com"
                                        className={`h-12 pl-12 pr-4 border-2 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm text-gray-700 placeholder:text-gray-400 ${
                                            errors.email
                                                ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200 shadow-red-100'
                                                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 hover:border-blue-300'
                                        } shadow-sm focus:shadow-md group-hover:shadow-md`}
                                        disabled={isSubmitting}
                                    />
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-600 flex items-center gap-2 animate-fade-in">
                                        <span className="w-4 h-4 flex items-center justify-center bg-red-100 rounded-full text-xs">!</span>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm" htmlFor="password">
                                        <Lock className="w-4 h-4 text-blue-600" />
                                        Password
                                    </Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline transition-all duration-200 hover:scale-105"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Input
                                        id="password"
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`h-12 pl-12 pr-12 border-2 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm text-gray-700 placeholder:text-gray-400 ${
                                            errors.password
                                                ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-200 shadow-red-100'
                                                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 hover:border-blue-300'
                                        } shadow-sm focus:shadow-md group-hover:shadow-md`}
                                        disabled={isSubmitting}
                                    />
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 focus:outline-none focus:text-blue-500"
                                        disabled={isSubmitting}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 flex items-center gap-2 animate-fade-in">
                                        <span className="w-4 h-4 flex items-center justify-center bg-red-100 rounded-full text-xs">!</span>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] text-lg relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <div className="relative z-10 flex items-center gap-3">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Signing In...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                            Sign In
                                        </>
                                    )}
                                </div>
                            </Button>
                        </form>

                        {/* Security Notice */}
                        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-blue-900 mb-1">Secure Login</p>
                                    <p className="text-blue-700 leading-relaxed">Your credentials are encrypted and protected with industry-standard security measures.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-all duration-200 hover:scale-105 inline-block"
                                >
                                    Create Account
                                </Link>
                            </p>
                        </div>

                        {/* Additional Links */}
                        <div className="mt-6 flex justify-center space-x-6 text-sm">
                            <Link
                                to="/privacy"
                                className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:underline"
                            >
                                Privacy Policy
                            </Link>
                            <span className="text-gray-300">•</span>
                            <Link
                                to="/terms"
                                className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:underline"
                            >
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom decorative element */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500/80 backdrop-blur-sm">
                        © {
                        new Date().getFullYear()
                    } Mattru Nursing School. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}