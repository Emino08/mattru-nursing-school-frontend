import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
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

export default function Profile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.get('/applicant/profile')
            .then(res => {
                setProfile(res.data);
                setIsLoading(false);
            })
            .catch(() => {
                toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!profile) return;

        const { name, value } = e.target;

        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setProfile({
                ...profile,
                [section]: {
                    ...profile[section as keyof Profile] as Record<string, any>,
                    [field]: value
                }
            });
        } else {
            setProfile({
                ...profile,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.put('/applicant/profile', profile);
            toast({ title: 'Success', description: 'Profile updated successfully' });
            setIsEditing(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">My Profile</h2>
                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-white transition-all h-9"
                    style={{
                        backgroundColor: isEditing ? '#FF59A1' : '#2563EB',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = isEditing ? '#E0338A' : '#1D4ED8';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = isEditing ? '#FF59A1' : '#2563EB';
                    }}
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            {profile && (
                <form onSubmit={handleSubmit}>
                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                            <CardTitle className="text-lg text-gray-800">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="first_name" className="text-gray-700 font-medium mb-1 block">First Name</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={profile.first_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="last_name" className="text-gray-700 font-medium mb-1 block">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={profile.last_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone" className="text-gray-700 font-medium mb-1 block">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date_of_birth" className="text-gray-700 font-medium mb-1 block">Date of Birth</Label>
                                    <Input
                                        id="date_of_birth"
                                        name="date_of_birth"
                                        type="date"
                                        value={profile.date_of_birth}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nationality" className="text-gray-700 font-medium mb-1 block">Nationality</Label>
                                    <Input
                                        id="nationality"
                                        name="nationality"
                                        value={profile.nationality}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm mt-6">
                        <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                            <CardTitle className="text-lg text-gray-800">Address Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="address.country" className="text-gray-700 font-medium mb-1 block">Country</Label>
                                    <Input
                                        id="address.country"
                                        name="address.country"
                                        value={profile.address.country}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address.province" className="text-gray-700 font-medium mb-1 block">Province</Label>
                                    <Input
                                        id="address.province"
                                        name="address.province"
                                        value={profile.address.province}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address.district" className="text-gray-700 font-medium mb-1 block">District</Label>
                                    <Input
                                        id="address.district"
                                        name="address.district"
                                        value={profile.address.district}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address.town" className="text-gray-700 font-medium mb-1 block">Town</Label>
                                    <Input
                                        id="address.town"
                                        name="address.town"
                                        value={profile.address.town}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm mt-6">
                        <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                            <CardTitle className="text-lg text-gray-800">Emergency Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="emergency_contact.name" className="text-gray-700 font-medium mb-1 block">Name</Label>
                                    <Input
                                        id="emergency_contact.name"
                                        name="emergency_contact.name"
                                        value={profile.emergency_contact.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergency_contact.phone" className="text-gray-700 font-medium mb-1 block">Phone</Label>
                                    <Input
                                        id="emergency_contact.phone"
                                        name="emergency_contact.phone"
                                        value={profile.emergency_contact.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="h-10 border-gray-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isEditing && (
                        <div className="flex justify-end mt-6">
                            <Button
                                type="submit"
                                className="text-white transition-all h-10 px-6"
                                style={{
                                    backgroundColor: '#10B981',
                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#059669';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#10B981';
                                }}
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}