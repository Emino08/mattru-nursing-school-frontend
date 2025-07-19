// import { Button } from '@/components/ui/Button';
// import {Input} from '@/components/ui/Input';
// import { Label } from '@/components/ui/Label';
// import { useForm } from 'react-hook-form';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import api from '@/services/api';
//
// interface FormData {
//     password: string;
//     confirmPassword: string;
// }
//
// export function ResetPassword() {
//     const { register, handleSubmit, watch } = useForm<FormData>();
//     const [searchParams] = useSearchParams();
//     const navigate = useNavigate();
//     // const { toast } = useToast();
//
//     const token = searchParams.get('token');
//     const password = watch('password');
//     const confirmPassword = watch('confirmPassword');
//
//     const onSubmit = async (data: FormData) => {
//         if (password !== confirmPassword) {
//             toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
//             return;
//         }
//
//         try {
//             await api.post('/api/reset-password', { token, password: data.password });
//             toast({ title: 'Success', description: 'Password reset successfully' });
//             navigate('/login');
//         } catch (error) {
//             toast({ title: 'Error', description: 'Invalid or expired reset token', variant: 'destructive' });
//         }
//     };
//
//     if (!token) {
//         return <div className="container mx-auto p-4">Invalid reset link</div>;
//     }
//
//     return (
//         <div className="container mx-auto p-4 max-w-md">
//             <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                 <div>
//                     <Label>New Password</Label>
//                     <Input {...register('password')} type="password" />
//                 </div>
//                 <div>
//                     <Label>Confirm Password</Label>
//                     <Input {...register('confirmPassword')} type="password" />
//                 </div>
//                 <Button type="submit">Reset Password</Button>
//             </form>
//         </div>
//     );
// }

import { Button } from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';

interface FormData {
    password: string;
    confirmPassword: string;
}

export function ResetPassword() {
    const { register, handleSubmit, watch } = useForm<FormData>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const password = watch('password');
    const confirmPassword = watch('confirmPassword');

    const onSubmit = async (data: FormData) => {
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await api.post('/api/reset-password', { token, password: data.password });
            toast.success('Password reset successfully');
            navigate('/login');
        } catch (_) {
            toast.error('Invalid or expired reset token');
        }
    };

    if (!token) {
        return <div className="container mx-auto p-4">Invalid reset link</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Label>New Password</Label>
                    <Input {...register('password')} type="password" />
                </div>
                <div>
                    <Label>Confirm Password</Label>
                    <Input {...register('confirmPassword')} type="password" />
                </div>
                <Button type="submit">Reset Password</Button>
            </form>
        </div>
    );
}