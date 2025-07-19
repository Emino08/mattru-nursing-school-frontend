import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from "@/components/ui/Button";
import { toast } from 'sonner';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Application {
    id: number;
    program_type: string;
    application_status: string;
    submission_date: string;
}

export default function Status() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api
            .get('/applicant/status')
            .then((res) => {
                setApplications(res.data);
                setIsLoading(false);
            })
            .catch(() => {
                toast({ title: 'Error', description: 'Failed to load applications', variant: 'destructive' });
                setIsLoading(false);
            });
    }, []);

    const initiatePayment = async (applicationId: number) => {
        try {
            const res = await api.post('/api/applicant/payment', { application_id: applicationId, amount: 100 });
            toast({ title: 'Success', description: `Payment initiated, PIN: ${res.data.pin}` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to initiate payment', variant: 'destructive' });
        }
    };

    const getProgramName = (programType: string) => {
        switch(programType) {
            case 'diploma': return 'Diploma in Nursing';
            case 'bachelors': return 'Bachelor of Science in Nursing';
            case 'certificate': return 'Certificate in Nursing Assistant';
            default: return programType;
        }
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

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Application Status</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {applications.length} Applications
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin"></div>
                </div>
            ) : (
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                        <CardTitle className="text-lg text-gray-800">Your Applications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold">Program</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Submission Date</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.length > 0 ? (
                                    applications.map((app) => (
                                        <TableRow key={app.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{getProgramName(app.program_type)}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                                                    {formatStatus(app.application_status)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{new Date(app.submission_date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {app.application_status === 'offer_issued' && (
                                                    <Button
                                                        onClick={() => initiatePayment(app.id)}
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
                                                        Initiate Payment
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
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No applications found
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