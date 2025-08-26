import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, MapPin, Phone, Save, Edit, X } from 'lucide-react';
import api from '@/services/api';

interface Profile {
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string;
    nationality: string;
    address: {
        country: string;
        province: string;
        district: string;
        town: string;
    };
    emergency_contact: {
        name: string;
        phone: string;
    };
}

const defaultProfile: Profile = {
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    address: {
        country: '',
        province: '',
        district: '',
        town: ''
    },
    emergency_contact: {
        name: '',
        phone: ''
    }
};

export default function Profile() {
    const [profile, setProfile] = useState<Profile>(defaultProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        api.get('/applicant/profile')
            .then(res => {
                // Safely merge the response data with default structure
                const profileData = res.data || {};
                setProfile({
                    ...defaultProfile,
                    ...profileData,
                    address: {
                        ...defaultProfile.address,
                        ...(profileData.address || {})
                    },
                    emergency_contact: {
                        ...defaultProfile.emergency_contact,
                        ...(profileData.emergency_contact || {})
                    }
                });
                setIsLoading(false);
            })
            .catch(() => {
                toast.error('Failed to load profile');
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setProfile(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section as keyof Profile] as Record<string, string>),
                    [field]: value
                }
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await api.put('/applicant/profile', profile);
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                                    <p className="text-blue-100">Manage your personal information</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setIsEditing(!isEditing)}
                                variant={isEditing ? "secondary" : "default"}
                                className={`
                                    transition-all duration-200 flex items-center space-x-2
                                    ${isEditing
                                    ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                                    : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                                }
                                `}
                            >
                                {isEditing ? (
                                    <>
                                        <X className="w-4 h-4" />
                                        <span>Cancel</span>
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Profile</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card className="shadow-lg border-0 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                            <CardTitle className="flex items-center space-x-2 text-gray-800">
                                <User className="w-5 h-5 text-blue-600" />
                                <span>Personal Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                                        First Name *
                                    </Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={profile.first_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your first name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                                        Last Name *
                                    </Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={profile.last_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your last name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                        Phone Number *
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">
                                        Date of Birth *
                                    </Label>
                                    <Input
                                        id="date_of_birth"
                                        name="date_of_birth"
                                        type="date"
                                        value={profile.date_of_birth}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="nationality" className="text-sm font-medium text-gray-700">
                                        Nationality *
                                    </Label>
                                    <Input
                                        id="nationality"
                                        name="nationality"
                                        value={profile.nationality}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your nationality"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card className="shadow-lg border-0 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                            <CardTitle className="flex items-center space-x-2 text-gray-800">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <span>Address Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address.country" className="text-sm font-medium text-gray-700">
                                        Country *
                                    </Label>
                                    <Input
                                        id="address.country"
                                        name="address.country"
                                        value={profile.address?.country || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your country"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address.province" className="text-sm font-medium text-gray-700">
                                        Province/State *
                                    </Label>
                                    <Input
                                        id="address.province"
                                        name="address.province"
                                        value={profile.address?.province || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your province/state"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address.district" className="text-sm font-medium text-gray-700">
                                        District *
                                    </Label>
                                    <Input
                                        id="address.district"
                                        name="address.district"
                                        value={profile.address?.district || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your district"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address.town" className="text-sm font-medium text-gray-700">
                                        Town/City *
                                    </Label>
                                    <Input
                                        id="address.town"
                                        name="address.town"
                                        value={profile.address?.town || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your town/city"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card className="shadow-lg border-0 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                            <CardTitle className="flex items-center space-x-2 text-gray-800">
                                <Phone className="w-5 h-5 text-blue-600" />
                                <span>Emergency Contact</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact.name" className="text-sm font-medium text-gray-700">
                                        Contact Name *
                                    </Label>
                                    <Input
                                        id="emergency_contact.name"
                                        name="emergency_contact.name"
                                        value={profile.emergency_contact?.name || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter emergency contact name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact.phone" className="text-sm font-medium text-gray-700">
                                        Contact Phone *
                                    </Label>
                                    <Input
                                        id="emergency_contact.phone"
                                        name="emergency_contact.phone"
                                        type="tel"
                                        value={profile.emergency_contact?.phone || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                        placeholder="Enter emergency contact phone"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    {isEditing && (
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 h-auto font-medium shadow-lg transition-all duration-200"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}