import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import { useEffect, useState } from 'react';

interface FormData {
    email: string;
    password: string;
    captchaAnswer: string;
    profile: {
        first_name: string;
        last_name: string;
        phone: string;
        address: { country: string; province: string; district: string; town: string };
        date_of_birth: string;
        nationality: string;
        emergency_contact: { name: string; phone: string };
    };
}

export default function Register() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const navigate = useNavigate();
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });

    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ num1, num2, answer: num1 + num2 });
    };

    const onSubmit = async (data: FormData) => {
        try {
            // Verify the captcha
            if (parseInt(data.captchaAnswer) !== captcha.answer) {
                toast.error('Incorrect captcha answer. Please try again.');
                generateCaptcha();
                return;
            }

            await api.post('/register', {
                email: data.email,
                password: data.password,
                profile: data.profile
            });

            toast.success('Registration successful, please verify your email');
            navigate('/login');
        } catch (err) {
            toast.error('Registration failed');
            generateCaptcha();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-8 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-card overflow-hidden animate-fadeIn">
                <div className="md:flex">
                    <div className="md:w-1/3 bg-gradient-to-b from-[#2563EB] to-[#FF59A1] p-8 text-white">
                        <h2 className="text-2xl font-bold mb-6">Join Us Today</h2>
                        <p className="mb-4">Create your account and start your journey with Mattru Nursing School.</p>
                        <p className="text-sm opacity-80">Already registered?</p>
                        <Link
                            to="/login"
                            className="inline-block mt-2 text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-all"
                            style={{ backdropFilter: 'blur(8px)' }}
                        >
                            Sign In
                        </Link>
                    </div>

                    <div className="md:w-2/3 p-8">
                        <h1 className="text-2xl font-bold mb-6 text-gray-800">Create Account</h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-700">First Name</Label>
                                    <Input
                                        {...register('profile.first_name', { required: 'First name is required' })}
                                        className="border-gray-200"
                                        style={{ borderRadius: '0.375rem' }}
                                    />
                                    {errors.profile?.first_name && <p className="text-red-500 text-sm mt-1">{errors.profile.first_name.message}</p>}
                                </div>
                                <div>
                                    <Label className="text-gray-700">Last Name</Label>
                                    <Input
                                        {...register('profile.last_name', { required: 'Last name is required' })}
                                        className="border-gray-200"
                                        style={{ borderRadius: '0.375rem' }}
                                    />
                                    {errors.profile?.last_name && <p className="text-red-500 text-sm mt-1">{errors.profile.last_name.message}</p>}
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-700">Email</Label>
                                <Input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address"
                                        }
                                    })}
                                    type="email"
                                    className="border-gray-200"
                                    style={{ borderRadius: '0.375rem' }}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <Label className="text-gray-700">Password</Label>
                                <Input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                                    })}
                                    type="password"
                                    className="border-gray-200"
                                    style={{ borderRadius: '0.375rem' }}
                                />
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                            </div>

                            {/* Rest of the form fields */}
                            {/* ... */}

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-medium text-gray-800 mb-2">Emergency Contact</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-700">Name</Label>
                                        <Input
                                            {...register('profile.emergency_contact.name')}
                                            className="border-gray-200"
                                            style={{ borderRadius: '0.375rem' }}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-700">Phone</Label>
                                        <Input
                                            {...register('profile.emergency_contact.phone')}
                                            className="border-gray-200"
                                            style={{ borderRadius: '0.375rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-700">Security Check</Label>
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded-md text-lg font-medium select-none">
                                        {captcha.num1} + {captcha.num2} = ?
                                    </div>
                                    <Input
                                        {...register('captchaAnswer', {
                                            required: 'Please solve the captcha',
                                            pattern: {
                                                value: /^[0-9]+$/,
                                                message: 'Please enter a number'
                                            }
                                        })}
                                        type="text"
                                        className="border-gray-200 max-w-[100px]"
                                        style={{ borderRadius: '0.375rem' }}
                                        placeholder="Answer"
                                    />
                                    <Button
                                        type="button"
                                        onClick={generateCaptcha}
                                        variant="outline"
                                        className="h-10 px-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                            <path d="M21 3v5h-5"></path>
                                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                            <path d="M8 16H3v5"></path>
                                        </svg>
                                    </Button>
                                </div>
                                {errors.captchaAnswer && <p className="text-red-500 text-sm mt-1">{errors.captchaAnswer.message}</p>}
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
                                Create Account
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}