import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Application {
    application_id: number;
    application_status: string;
    created_at: string;
    updated_at: string;
    program_type?: string;
    personal_info?: Record<string, unknown>;
    academic_info?: Record<string, unknown>;
    documents?: Record<string, unknown>;
}

interface ApplicationDetailsModalProps {
    application: Application;
    children: React.ReactNode;
}

function ApplicationDetailsModal({ application, children }: ApplicationDetailsModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Application Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Application ID</label>
                            <p className="text-gray-900 font-medium">{application.application_id}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <Badge variant="secondary" className={getStatusColor(application.application_status)}>
                                {formatStatus(application.application_status)}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                            <p className="text-gray-900">{formatDate(application.created_at)}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Last Updated</label>
                            <p className="text-gray-900">{formatDate(application.updated_at)}</p>
                        </div>
                    </div>

                    {application.program_type && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Program Type</label>
                                <p className="text-gray-900">{application.program_type}</p>
                            </div>
                        </>
                    )}

                    {application.personal_info && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Personal Information</label>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {JSON.stringify(application.personal_info, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}

                    {application.academic_info && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Academic Information</label>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {JSON.stringify(application.academic_info, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}

                    {application.documents && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Documents</label>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {JSON.stringify(application.documents, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status.toLowerCase()) {
        case 'submitted': return 'bg-blue-100 text-blue-800';
        case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
        case 'offer_issued': return 'bg-amber-100 text-amber-800';
        case 'payment_verified': return 'bg-green-100 text-green-800';
        case 'completed': return 'bg-emerald-100 text-emerald-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const formatStatus = (status: string) => {
    if (!status) return 'Unknown Status';
    return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
};

export default function Status() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api
            .get('/applicant/status')
            .then((res) => {
                try {
                    let data = res.data;
                    if (!data) {
                        setApplications([]);
                        return;
                    }

                    if (!Array.isArray(data)) {
                        data = [data];
                    }

                    const validApplications = data.filter((app: Application) =>
                        app &&
                        typeof app === 'object' &&
                        app.application_id !== undefined &&
                        app.application_status !== undefined
                    );

                    setApplications(validApplications);
                } catch (error) {
                    console.error('Error processing applications data:', error);
                    setApplications([]);
                    toast.error('Error processing application data');
                }
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('API Error:', error);
                toast.error('Failed to load applications');
                setApplications([]);
                setIsLoading(false);
            });
    }, []);

    const initiatePayment = async (applicationId: number) => {
        if (!applicationId) {
            toast.error('Invalid application ID');
            return;
        }

        try {
            const res = await api.post('/api/applicant/payment', {
                application_id: applicationId,
                amount: 100
            });

            if (res.data && res.data.pin) {
                toast.success(`Payment initiated, PIN: ${res.data.pin}`);
            } else {
                toast.success('Payment initiated successfully');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            toast.error('Failed to initiate payment');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Application Status</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {applications.length} Application{applications.length !== 1 ? 's' : ''}
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
                                        <TableRow key={app.application_id || Math.random()} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">
                                                {app.program_type || 'Program Type Not Available'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                                                    {formatStatus(app.application_status)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatDate(app.created_at)}</TableCell>
                                            <TableCell>
                                                {app.application_status === 'offer_issued' && (
                                                    <Button
                                                        onClick={() => initiatePayment(app.application_id)}
                                                        className="text-white transition-all h-9 mr-2"
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
                                                <ApplicationDetailsModal application={app}>
                                                    <Button
                                                        variant="outline"
                                                        className="h-9 text-primary border-primary hover:bg-primary-light/10"
                                                    >
                                                        View Details
                                                    </Button>
                                                </ApplicationDetailsModal>
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