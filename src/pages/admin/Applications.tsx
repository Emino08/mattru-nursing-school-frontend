import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Application {
    id: number;
    applicant_id: number;
    email: string;
    program_type: string;
    application_status: string;
    submission_date: string;
}

export default function Applications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setIsLoading(true);
        api
            .get('/admin/applications')
            .then((res) => {
                setApplications(res.data);
                setFilteredApplications(res.data);
                setIsLoading(false);
            })
            .catch(() => {
                toast.error('Failed to load applications');
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        let result = applications;

        // Apply status filter
        if (filter !== 'all') {
            result = result.filter((app) => app.application_status === filter);
        }

        // Apply search filter
        if (search.trim() !== '') {
            const searchLower = search.toLowerCase();
            result = result.filter((app) =>
                app.email.toLowerCase().includes(searchLower) ||
                app.program_type.toLowerCase().includes(searchLower)
            );
        }

        setFilteredApplications(result);
    }, [filter, search, applications]);

    const handleScheduleInterview = async (id: number, userId: number) => {
        try {
            await api.post('/admin/schedule-interview', { id, user_id: userId });

            // Update applications state
            setApplications(apps => apps.map(app =>
                app.id === id ? { ...app, application_status: 'interview_scheduled' } : app
            ));

            toast.success('Interview scheduled successfully');
        } catch (error) {
            toast.error('Failed to schedule interview');
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
            case 'offer_issued': return 'bg-amber-100 text-amber-800';
            case 'payment_verified': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Application Management</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {filteredApplications.length} Applications
                </div>
            </div>

            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                    <CardTitle className="text-lg text-gray-800">Filter Applications</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/3">
                            <Label htmlFor="filter-status" className="text-gray-700 font-medium mb-1 block">
                                Status
                            </Label>
                            <Select onValueChange={setFilter} defaultValue="all">
                                <SelectTrigger className="h-10 border-gray-200">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Applications</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                                    <SelectItem value="offer_issued">Offer Issued</SelectItem>
                                    <SelectItem value="payment_verified">Payment Verified</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-2/3">
                            <Label htmlFor="search" className="text-gray-700 font-medium mb-1 block">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search by email or program"
                                className="h-10 border-gray-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin"></div>
                </div>
            ) : (
                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold">Applicant Email</TableHead>
                                    <TableHead className="font-semibold">Program</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Submission Date</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApplications.length > 0 ? (
                                    filteredApplications.map((app) => (
                                        <TableRow key={app.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{app.email}</TableCell>
                                            <TableCell>
                                                {app.program_type === 'diploma' && 'Diploma in Nursing'}
                                                {app.program_type === 'certificate' && 'Certificate in Nursing Assistant'}
                                                {!['diploma', 'certificate'].includes(app.program_type) && app.program_type}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                                                    {formatStatus(app.application_status)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{new Date(app.submission_date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {app.application_status === 'submitted' && (
                                                    <Button
                                                        onClick={() => handleScheduleInterview(app.id, app.applicant_id)}
                                                        className="text-white transition-all h-9"
                                                        style={{
                                                            backgroundColor: '#2563EB',
                                                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#1D4ED8';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#2563EB';
                                                        }}
                                                    >
                                                        Schedule Interview
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    className="h-9 ml-2 text-primary border-primary hover:bg-primary-light/10"
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No applications found matching your filters
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}