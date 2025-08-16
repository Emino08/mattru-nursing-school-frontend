import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

interface Role {
    id: number;
    name: string;
}

interface PermissionsResponse {
    success: boolean;
    permissions: {
        [role: string]: {
            [feature: string]: string[];
        };
    };
}

interface FormData {
    email: string;
    password: string;
    role: string;
    permissions: Record<string, string[]>;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

export default function UserManagement() {
    const { loading, logout } = useAuth();
    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            email: '',
            password: '',
            role: '',
            permissions: {}
        }
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionsData, setPermissionsData] = useState<PermissionsResponse | null>(null);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedRole = watch('role');
    const currentPermissions = watch('permissions');

    useEffect(() => {
        const fetchRolesAndPermissions = async () => {
            try {
                const [rolesResponse, permissionsResponse] = await Promise.all([
                    api.get('/admin/roles'),
                    api.get('/admin/permissions')
                ]);

                setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
                setPermissionsData(permissionsResponse.data);
            } catch (error) {
                console.error('Failed to load roles or permissions:', error);
                toast.error('Failed to load roles or permissions');
                setRoles([]);
                setPermissionsData(null);
            } finally {
                setIsLoadingRoles(false);
            }
        };
        fetchRolesAndPermissions();
    }, []);

    // Initialize permissions when role changes
    useEffect(() => {
        if (selectedRole && permissionsData) {
            const rolePermissions = permissionsData.permissions[selectedRole];
            if (rolePermissions) {
                // Initialize with empty arrays for each feature
                const initialPermissions: Record<string, string[]> = {};
                Object.keys(rolePermissions).forEach(feature => {
                    initialPermissions[feature] = [];
                });
                setValue('permissions', initialPermissions);
            }
        }
    }, [selectedRole, permissionsData, setValue]);

    const onSubmit = async (data: FormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (data.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            if (!/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password)) {
                throw new Error('Password must include uppercase, lowercase, and a number');
            }

            await api.post('/admin/create-user', {
                email: data.email,
                password: data.password,
                role: data.role,
                permissions: data.permissions
            });
            toast.success('User created successfully');
            reset();
        } catch (error) {
            const apiError = error as ApiError;
            const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to create user';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePermissionChange = (feature: string, permission: string, checked: boolean) => {
        const newPermissions = { ...currentPermissions };

        if (!newPermissions[feature]) {
            newPermissions[feature] = [];
        }

        if (checked) {
            if (!newPermissions[feature].includes(permission)) {
                newPermissions[feature] = [...newPermissions[feature], permission];
            }
        } else {
            newPermissions[feature] = newPermissions[feature].filter(p => p !== permission);
        }

        setValue('permissions', newPermissions);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        Admin Access
                    </div>
                    <Button
                        onClick={logout}
                        className="text-white transition-all"
                        style={{
                            backgroundColor: '#FF59A1',
                            boxShadow: '0 4px 6px -1px rgba(255, 89, 161, 0.25)'
                        }}
                    >
                        Logout
                    </Button>
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
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    type="email"
                                    placeholder="staff@example.com"
                                    className="h-10 border-gray-200 focus:border-primary"
                                    disabled={isSubmitting}
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Password</Label>
                                <Input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters long'
                                        },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                            message: 'Password must include uppercase, lowercase, and a number'
                                        }
                                    })}
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-10 border-gray-200 focus:border-primary"
                                    disabled={isSubmitting}
                                />
                                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Staff Role</Label>
                            <Controller
                                name="role"
                                control={control}
                                rules={{ required: 'Role is required' }}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        disabled={isLoadingRoles || isSubmitting}
                                    >
                                        <SelectTrigger className="h-10 border-gray-200 focus:border-primary">
                                            <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select role"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.name}>
                                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
                        </div>

                        {selectedRole && permissionsData?.permissions[selectedRole] && (
                            <div className="space-y-3">
                                <Label className="text-gray-700 font-medium">
                                    Permissions for {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                                </Label>
                                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                                    {Object.entries(permissionsData.permissions[selectedRole]).map(([feature, availablePerms]) => (
                                        <div key={feature} className="space-y-3 p-3 bg-white rounded border">
                                            <h4 className="font-semibold text-gray-800 border-b pb-2">
                                                {feature.charAt(0).toUpperCase() + feature.slice(1)}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {availablePerms.map((permission) => {
                                                    const isChecked = currentPermissions[feature]?.includes(permission) || false;
                                                    const checkboxKey = `${feature}-${permission}`;

                                                    return (
                                                        <div key={checkboxKey} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={checkboxKey}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) =>
                                                                    handlePermissionChange(feature, permission, checked as boolean)
                                                                }
                                                                disabled={isSubmitting}
                                                            />
                                                            <label
                                                                htmlFor={checkboxKey}
                                                                className="text-sm capitalize cursor-pointer select-none"
                                                            >
                                                                {permission}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-10 text-white transition-all"
                            style={{
                                backgroundColor: '#2563EB',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
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