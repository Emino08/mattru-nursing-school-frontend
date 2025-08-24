import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Loader2, Building2, User as UserIcon, Phone, MapPin, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';

// Geographic data
const COUNTRIES = [
    'Sierra Leone', 'Ghana', 'Nigeria', 'Liberia', 'Guinea', 'Mali', 'Burkina Faso',
    'Ivory Coast', 'Senegal', 'Gambia', 'Cape Verde', 'United Kingdom', 'United States'
].sort();

const SIERRA_LEONE_DISTRICTS = [
    'Western Area', 'Bo', 'Kenema', 'Kailahun', 'Kono', 'Bombali', 'Tonkolili',
    'Port Loko', 'Kambia', 'Moyamba', 'Bonthe', 'Pujehun', 'Falaba', 'Karene', 'Koinadugu'
].sort();

const CITIES_BY_DISTRICT: Record<string, string[]> = {
    'Western Area': ['Freetown', 'Waterloo', 'Wellington', 'Hastings', 'Kent', 'Jui'],
    'Bo': ['Bo', 'Baoma', 'Kakua', 'Wunde'],
    'Kenema': ['Kenema', 'Blama', 'Ngiehun', 'Tongo'],
    'Kailahun': ['Kailahun', 'Segbwema', 'Pendembu', 'Koindu'],
    'Kono': ['Koidu', 'Yengema', 'Motema', 'Tombodu'],
    'Bombali': ['Makeni', 'Kamakwie', 'Kamabai', 'Binkolo'],
    'Tonkolili': ['Magburaka', 'Yele', 'Mile 91', 'Matotoka'],
    'Port Loko': ['Port Loko', 'Lunsar', 'Pepel', 'Mange'],
    'Kambia': ['Kambia', 'Kukuna', 'Rokupr'],
    'Moyamba': ['Moyamba', 'Njala', 'Rotifunk', 'Shenge'],
    'Bonthe': ['Bonthe', 'Mattru Jong', 'Talia'],
    'Pujehun': ['Pujehun', 'Zimmi', 'Potoru'],
    'Falaba': ['Falaba', 'Bendugu', 'Mongo'],
    'Karene': ['Karene', 'Kamalo', 'Rokupr'],
    'Koinadugu': ['Kabala', 'Fadugu', 'Sinkunia']
};

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    captcha: string;
    profile: {
        first_name: string;
        last_name: string;
        phone: string;
        address: {
            street: string;
            city: string;
            district: string;
            country: string;
        };
        date_of_birth: string;
        nationality: string;
        emergency_contact: {
            name: string;
            phone: string;
        };
        profile_picture: File | null;
    };
}

export default function Register() {
    const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<FormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const { loading } = useAuth();
    const navigate = useNavigate();

    const password = watch('password');
    const confirmPassword = watch('confirmPassword');
    const watchedCountry = watch('profile.address.country');
    const totalSteps = 3;

    // Helper function to calculate age
    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    // Get max date for 16+ age requirement
    const getMaxDate = (): string => {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
        return maxDate.toISOString().split('T')[0];
    };

    const validateStep = async (step: number) => {
        const formData = watch();

        switch (step) {
            case 1: {
                const step1Valid = await trigger(['email', 'password', 'confirmPassword']);
                const hasRequiredFields = formData.email && formData.password && formData.confirmPassword;
                const passwordsMatch = formData.password === formData.confirmPassword;

                if (!hasRequiredFields) {
                    toast.error('Please fill in all required fields');
                    return false;
                }

                if (!passwordsMatch) {
                    toast.error('Passwords do not match');
                    return false;
                }

                return step1Valid;
            }

            case 2: {
                const step2Valid = await trigger(['profile.first_name', 'profile.last_name', 'profile.phone', 'profile.date_of_birth', 'profile.nationality']);
                const hasStep2Fields = formData.profile?.first_name && formData.profile?.last_name &&
                    formData.profile?.phone && formData.profile?.date_of_birth && formData.profile?.nationality;

                if (!hasStep2Fields) {
                    toast.error('Please fill in all required fields');
                    return false;
                }

                // Validate age (minimum 16 years)
                if (formData.profile?.date_of_birth) {
                    const age = calculateAge(formData.profile.date_of_birth);
                    if (age < 16) {
                        toast.error('You must be at least 16 years old to register');
                        return false;
                    }
                }

                return step2Valid;
            }

            case 3: {
                const step3Valid = await trigger(['profile.address.street', 'profile.address.city', 'profile.address.district', 'profile.address.country', 'profile.emergency_contact.name', 'profile.emergency_contact.phone']);
                const hasStep3Fields = formData.profile?.address?.street && formData.profile?.address?.city &&
                    formData.profile?.address?.district && formData.profile?.address?.country &&
                    formData.profile?.emergency_contact?.name && formData.profile?.emergency_contact?.phone;

                if (!hasStep3Fields) {
                    toast.error('Please fill in all required fields');
                    return false;
                }

                return step3Valid;
            }

            default:
                return false;
        }
    };

    const nextStep = async () => {
        const isValid = await validateStep(currentStep);
        if (isValid && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleCountryChange = (value: string) => {
        setSelectedCountry(value);
        setValue('profile.address.country', value);
        setSelectedDistrict('');
        setValue('profile.address.district', '');
        setValue('profile.address.city', '');
    };

    const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value);
        setValue('profile.address.district', value);
        setValue('profile.address.city', '');
    };

    const simulateCaptcha = () => {
        setTimeout(() => {
            setCaptchaVerified(true);
            setValue('captcha', 'valid_captcha');
            toast.success('Captcha verified!');
        }, 1500);
    };

    const onSubmit = async (data: FormData) => {
        if (isSubmitting) return;
        if (!captchaVerified) {
            toast.error('Please verify the captcha first');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();

            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('captcha', data.captcha);

            formData.append('profile[first_name]', data.profile.first_name);
            formData.append('profile[last_name]', data.profile.last_name);
            formData.append('profile[phone]', data.profile.phone);
            formData.append('profile[date_of_birth]', data.profile.date_of_birth);
            formData.append('profile[nationality]', data.profile.nationality);

            formData.append('profile[address][street]', data.profile.address.street);
            formData.append('profile[address][city]', data.profile.address.city);
            formData.append('profile[address][district]', data.profile.address.district);
            formData.append('profile[address][country]', data.profile.address.country);

            formData.append('profile[emergency_contact][name]', data.profile.emergency_contact.name);
            formData.append('profile[emergency_contact][phone]', data.profile.emergency_contact.phone);

            if (data.profile.profile_picture) {
                formData.append('profile[profile_picture]', data.profile.profile_picture);
            }

            const res = await api.post('/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Registration successful!', {
                description: res.data.message || 'Please check your email to verify your account.'
            });

            navigate('/login', {
                replace: true,
                state: {
                    message: 'Registration successful! Please check your email to verify your account before logging in.',
                    email: data.email
                }
            });

        } catch (error: unknown) {
            console.error('Registration error:', error);

            let errorMessage = 'An error occurred during registration';
            let errorTitle = 'Registration Failed';

            if (typeof error === 'object' && error !== null && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { message?: string; error?: string };
                        status?: number
                    }
                };

                if (axiosError.response?.status === 409) {
                    errorTitle = 'Account Already Exists';
                    errorMessage = 'A user with this email address is already registered. Please try logging in instead.';
                } else if (axiosError.response?.status === 400) {
                    errorTitle = 'Invalid Information';
                    errorMessage = axiosError.response.data?.message || 'Please check your information and try again.';
                } else if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                } else if (axiosError.response?.data?.error) {
                    errorMessage = axiosError.response.data.error;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorTitle, {
                description: errorMessage,
                duration: 5000,
                action: errorTitle === 'Account Already Exists' ? {
                    label: 'Go to Login',
                    onClick: () => navigate('/login', {
                        state: { email: data.email }
                    })
                } : undefined
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <p className="text-gray-500">Setting up your account</p>
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

            <div className="w-full max-w-2xl relative z-10">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 rounded-3xl"></div>

                    <div className="relative z-10">
                        {/* Header Section */}
                        <div className="text-center mb-8">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-110">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3">
                                Join Our Community
                            </h1>
                            <p className="text-gray-600 font-medium text-lg">Create your account to get started</p>
                            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4 shadow-sm"></div>
                        </div>

                        {/* Progress Steps */}
                        <div className="mb-8">
                            <div className="flex items-center justify-center space-x-4">
                                {[1, 2, 3].map((step, index) => (
                                    <div key={step} className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                                            currentStep >= step
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                                        </div>
                                        {index < 2 && (
                                            <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                                                currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'
                                            }`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center mt-3">
                                <span className="text-sm text-gray-500">
                                    Step {currentStep} of {totalSteps}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Step 1: Account Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Account Information</h2>
                                        <p className="text-gray-600">Set up your login credentials</p>
                                    </div>

                                    {/* Email Field */}
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
                                                        ? 'border-red-300 bg-red-50/50 focus:border-red-500'
                                                        : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                                                } shadow-sm focus:shadow-md`}
                                            />
                                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-3">
                                        <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm" htmlFor="password">
                                            <Lock className="w-4 h-4 text-blue-600" />
                                            Password
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                id="password"
                                                {...register('password', {
                                                    required: 'Password is required',
                                                    minLength: {
                                                        value: 8,
                                                        message: 'Password must be at least 8 characters'
                                                    },
                                                    pattern: {
                                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                        message: 'Password must contain uppercase, lowercase, and number'
                                                    }
                                                })}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className={`h-12 pl-12 pr-12 border-2 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm text-gray-700 ${
                                                    errors.password
                                                        ? 'border-red-300 bg-red-50/50 focus:border-red-500'
                                                        : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                                                } shadow-sm focus:shadow-md`}
                                            />
                                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="space-y-3">
                                        <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm" htmlFor="confirmPassword">
                                            <Lock className="w-4 h-4 text-blue-600" />
                                            Confirm Password
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                id="confirmPassword"
                                                {...register('confirmPassword', {
                                                    required: 'Please confirm your password',
                                                    validate: value => value === password || 'Passwords do not match'
                                                })}
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className={`h-12 pl-12 pr-12 border-2 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm text-gray-700 ${
                                                    errors.confirmPassword || (confirmPassword && password !== confirmPassword)
                                                        ? 'border-red-300 bg-red-50/50 focus:border-red-500'
                                                        : confirmPassword && password === confirmPassword
                                                            ? 'border-green-300 bg-green-50/50 focus:border-green-500'
                                                            : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                                                } shadow-sm focus:shadow-md`}
                                            />
                                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            {confirmPassword && password === confirmPassword && (
                                                <CheckCircle className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.confirmPassword.message}
                                            </p>
                                        )}
                                        {!errors.confirmPassword && confirmPassword && password === confirmPassword && (
                                            <p className="text-sm text-green-600 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Passwords match
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Personal Information */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Personal Information</h2>
                                        <p className="text-gray-600">Tell us about yourself</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* First Name */}
                                        <div className="space-y-3">
                                            <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm">
                                                <UserIcon className="w-4 h-4 text-blue-600" />
                                                First Name
                                            </Label>
                                            <Input
                                                {...register('profile.first_name', { required: 'First name is required' })}
                                                placeholder="Emmanuel"
                                                className={`h-12 border-2 rounded-xl bg-white/70 transition-all duration-300 ${
                                                    errors.profile?.first_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                                                }`}
                                            />
                                            {errors.profile?.first_name && (
                                                <p className="text-sm text-red-600 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errors.profile.first_name.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Last Name */}
                                        <div className="space-y-3">
                                            <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm">
                                                <UserIcon className="w-4 h-4 text-blue-600" />
                                                Last Name
                                            </Label>
                                            <Input
                                                {...register('profile.last_name', { required: 'Last name is required' })}
                                                placeholder="Koroma"
                                                className={`h-12 border-2 rounded-xl bg-white/70 transition-all duration-300 ${
                                                    errors.profile?.last_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                                                }`}
                                            />
                                            {errors.profile?.last_name && (
                                                <p className="text-sm text-red-600 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errors.profile.last_name.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-3">
                                        <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            {...register('profile.phone', {
                                                required: 'Phone number is required',
                                                pattern: {
                                                    value: /^\+?[1-9]\d{1,14}$/,
                                                    message: 'Invalid phone number format'
                                                }
                                            })}
                                            placeholder="+23278618435"
                                            className={`h-12 border-2 rounded-xl bg-white/70 transition-all duration-300 ${
                                                errors.profile?.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                                            }`}
                                        />
                                        {errors.profile?.phone && (
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.profile.phone.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Date of Birth */}
                                        <div className="space-y-3">
                                            <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                Date of Birth (Must be 16+)
                                            </Label>
                                            <Input
                                                {...register('profile.date_of_birth', {
                                                    required: 'Date of birth is required',
                                                    validate: value => {
                                                        const age = calculateAge(value);
                                                        return age >= 16 || 'You must be at least 16 years old';
                                                    }
                                                })}
                                                type="date"
                                                max={getMaxDate()}
                                                className={`h-12 border-2 rounded-xl bg-white/70 transition-all duration-300 ${
                                                    errors.profile?.date_of_birth ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                                                }`}
                                            />
                                            {errors.profile?.date_of_birth && (
                                                <p className="text-sm text-red-600 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errors.profile.date_of_birth.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Nationality */}
                                        <div className="space-y-3">
                                            <Label className="text-gray-800 font-semibold flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-blue-600" />
                                                Nationality
                                            </Label>
                                            <Select onValueChange={(value) => setValue('profile.nationality', value)}>
                                                <SelectTrigger className={`h-12 border-2 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm hover:from-blue-100/50 hover:to-indigo-100/50 transition-all duration-300 ${
                                                    errors.profile?.nationality ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                                                } shadow-sm hover:shadow-md`}>
                                                    <SelectValue placeholder="Select nationality" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
                                                    {COUNTRIES.map(country => (
                                                        <SelectItem
                                                            key={country}
                                                            value={country.toLowerCase()}
                                                            className="hover:bg-blue-50/80 focus:bg-blue-50/80 transition-colors duration-200"
                                                        >
                                                            {country}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.profile?.nationality && (
                                                <p className="text-sm text-red-600 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errors.profile.nationality.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Address & Emergency Contact */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Address & Emergency Contact</h2>
                                        <p className="text-gray-600">Complete your profile</p>
                                    </div>

                                    {/* Address Section */}
                                    <div className="bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-indigo-50/40 p-6 rounded-xl border border-blue-200/50 shadow-sm backdrop-blur-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                            Address Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <Label className="text-gray-700 font-medium text-sm mb-2 block">Street Address</Label>
                                                <Input
                                                    {...register('profile.address.street', { required: 'Street address is required' })}
                                                    placeholder="6 Hancil Road"
                                                    className="h-11 border-2 rounded-lg bg-white/80 transition-all duration-300"
                                                />
                                            </div>

                                            {/* Country */}
                                            <div className="md:col-span-2">
                                                <Label className="text-gray-700 font-medium text-sm mb-2 block">Country</Label>
                                                <Select onValueChange={handleCountryChange}>
                                                    <SelectTrigger className="h-11 border-2 rounded-lg bg-gradient-to-r from-green-50/50 to-emerald-50/50 backdrop-blur-sm hover:from-green-100/50 hover:to-emerald-100/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                                        <SelectValue placeholder="Select country" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
                                                        {COUNTRIES.map(country => (
                                                            <SelectItem
                                                                key={country}
                                                                value={country}
                                                                className="hover:bg-green-50/80 focus:bg-green-50/80 transition-colors duration-200"
                                                            >
                                                                {country}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* District - Only show if Sierra Leone is selected */}
                                            {(selectedCountry === 'Sierra Leone' || watchedCountry === 'Sierra Leone') && (
                                                <div>
                                                    <Label className="text-gray-700 font-medium text-sm mb-2 block">District</Label>
                                                    <Select onValueChange={handleDistrictChange}>
                                                        <SelectTrigger className="h-11 border-2 rounded-lg bg-gradient-to-r from-purple-50/50 to-violet-50/50 backdrop-blur-sm hover:from-purple-100/50 hover:to-violet-100/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                                            <SelectValue placeholder="Select district" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
                                                            {SIERRA_LEONE_DISTRICTS.map(district => (
                                                                <SelectItem
                                                                    key={district}
                                                                    value={district}
                                                                    className="hover:bg-purple-50/80 focus:bg-purple-50/80 transition-colors duration-200"
                                                                >
                                                                    {district}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* City */}
                                            <div>
                                                <Label className="text-gray-700 font-medium text-sm mb-2 block">City</Label>
                                                {(selectedCountry === 'Sierra Leone' || watchedCountry === 'Sierra Leone') && selectedDistrict ? (
                                                    <Select onValueChange={(value) => setValue('profile.address.city', value)}>
                                                        <SelectTrigger className="h-11 border-2 rounded-lg bg-gradient-to-r from-pink-50/50 to-rose-50/50 backdrop-blur-sm hover:from-pink-100/50 hover:to-rose-100/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                                            <SelectValue placeholder="Select city" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
                                                            {CITIES_BY_DISTRICT[selectedDistrict]?.map(city => (
                                                                <SelectItem
                                                                    key={city}
                                                                    value={city}
                                                                    className="hover:bg-pink-50/80 focus:bg-pink-50/80 transition-colors duration-200"
                                                                >
                                                                    {city}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        {...register('profile.address.city', { required: 'City is required' })}
                                                        placeholder={selectedCountry === 'Sierra Leone' ? 'Select district first' : 'Enter city'}
                                                        disabled={selectedCountry === 'Sierra Leone' && !selectedDistrict}
                                                        className="h-11 border-2 rounded-lg bg-white/80 transition-all duration-300"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact Section */}
                                    <div className="bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-pink-50/40 p-6 rounded-xl border border-purple-200/50 shadow-sm backdrop-blur-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            Emergency Contact
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-gray-700 font-medium text-sm mb-2 block">Contact Name</Label>
                                                <Input
                                                    {...register('profile.emergency_contact.name', { required: 'Emergency contact name is required' })}
                                                    placeholder="Emmanuel Koroma"
                                                    className="h-11 border-2 rounded-lg bg-white/80 transition-all duration-300"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-700 font-medium text-sm mb-2 block">Contact Phone</Label>
                                                <Input
                                                    {...register('profile.emergency_contact.phone', { required: 'Emergency contact phone is required' })}
                                                    placeholder="+23278618435"
                                                    className="h-11 border-2 rounded-lg bg-white/80 transition-all duration-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Captcha Verification */}
                                    <div className="bg-gradient-to-br from-green-50/80 via-green-50/60 to-emerald-50/40 p-6 rounded-xl border border-green-200/50 shadow-sm backdrop-blur-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-green-600" />
                                            Security Verification
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="button"
                                                onClick={simulateCaptcha}
                                                disabled={captchaVerified}
                                                className={`h-12 px-6 rounded-lg transition-all duration-300 ${
                                                    captchaVerified
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default shadow-lg'
                                                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md'
                                                }`}
                                            >
                                                {captchaVerified ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 mr-2" />
                                                        Verified
                                                    </>
                                                ) : (
                                                    'Verify I\'m Human'
                                                )}
                                            </Button>
                                            <span className="text-sm text-gray-600">
                                                {captchaVerified ? 'Security check passed' : 'Click to verify you\'re human'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between pt-6">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        onClick={prevStep}
                                        variant="outline"
                                        className="h-12 px-8 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md"
                                    >
                                        Previous
                                    </Button>
                                )}

                                {currentStep < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold transition-all duration-300 hover:from-blue-600 hover:to-purple-700 ml-auto flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Next Step
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !captchaVerified}
                                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold transition-all duration-300 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto flex items-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Creating Account...
                                            </>
                                        ) : (
                                            <>
                                                Create Account
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-all duration-200 hover:scale-105 inline-block"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}