import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface FormData {
    email: string;
    password: string;
    role: string;
    permissions: string[];
}

export default function UserManagement() {
    const { register, handleSubmit, reset, control } = useForm<FormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);
            await api.post('/api/admin/create-user', data);
            toast({ title: 'Success', description: 'User created successfully' });
            reset(); // Clear the form after successful submission
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create user', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const permissionsList = [
        'application_management',
        'document_review',
        'interview_scheduling',
        'offer_letter_management',
        'payment_verification',
        'financial_reports',
        'user_management',
        'system_settings',
        'analytics_dashboard',
        'notification_management',
        'document_download',
        'bulk_operations',
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Admin Access
                </div>
            </div>

            <Card className="border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 rounded-t-lg">
                    <CardTitle className="text-lg font-medium">Create New Staff Account</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Email Address</Label>
                                <Input
                                    {...register('email', { required: true })}
                                    type="email"
                                    placeholder="staff@example.com"
                                    className="h-10 border-gray-200 focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Password</Label>
                                <Input
                                    {...register('password', { required: true })}
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-10 border-gray-200 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Staff Role</Label>
                            <Controller
                                name="role"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <SelectTrigger className="h-10 border-gray-200 focus:border-primary">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="finance">Finance Department</SelectItem>
                                            <SelectItem value="it">IT Department</SelectItem>
                                            <SelectItem value="registrar">Registrar</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="faculty">Faculty Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-gray-700 font-medium">Permissions</Label>
                            <div className="grid md:grid-cols-3 gap-2 border border-gray-200 rounded-md p-4 bg-gray-50">
                                {permissionsList.map((permission) => (
                                    <div key={permission} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={permission}
                                            value={permission}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                            {...register('permissions')}
                                        />
                                        <label htmlFor={permission} className="text-sm text-gray-700">
                                            {permission.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-10 text-white transition-all"
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
                            {isSubmitting ? 'Creating User...' : 'Create User'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}