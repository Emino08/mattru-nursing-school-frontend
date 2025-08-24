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
    id: number;
    application_number: string | null;
    applicant_id: number;
    program_type: string | null;
    application_status: string;
    form_data: string;
    submission_date: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    status: string;
}

interface ParsedFormData {
    personal_info: Record<string, any>;
    academic_info: Record<string, any>;
    documents: string[];
    wassce_info: Record<string, any>;
    other_info: Record<string, any>;
}

interface ApplicationDetailsModalProps {
    application: Application;
    children: React.ReactNode;
}

function ApplicationDetailsModal({ application, children }: ApplicationDetailsModalProps) {
    const [parsedData, setParsedData] = useState<ParsedFormData | null>(null);

    useEffect(() => {
        try {
            const formData = JSON.parse(application.form_data);

            // Parse and categorize the form data
            const personal_info: Record<string, any> = {};
            const academic_info: Record<string, any> = {};
            const documents: string[] = [];
            const wassce_info: Record<string, any> = {};
            const other_info: Record<string, any> = {};

            Object.entries(formData).forEach(([key, value]) => {
                if (key.includes('wassce')) {
                    wassce_info[key] = value;
                } else if (typeof value === 'string' && (value.includes('.jpeg') || value.includes('.pdf') || value.includes('.png'))) {
                    documents.push(`${key}: ${value}`);
                } else if (key.startsWith('question_')) {
                    const questionNum = parseInt(key.replace('question_', ''));
                    // Categorize based on question numbers (you might need to adjust these ranges)
                    if (questionNum >= 4 && questionNum <= 22) {
                        personal_info[key] = value;
                    } else if (questionNum >= 23 && questionNum <= 35) {
                        academic_info[key] = value;
                    } else {
                        other_info[key] = value;
                    }
                } else {
                    other_info[key] = value;
                }
            });

            setParsedData({
                personal_info,
                academic_info,
                documents,
                wassce_info,
                other_info
            });
        } catch (error) {
            console.error('Error parsing form data:', error);
            setParsedData(null);
        }
    }, [application.form_data]);

    const renderFormSection = (title: string, data: Record<string, any>) => {
        if (!data || Object.keys(data).length === 0) return null;

        return (
            <>
                <Separator />
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600">{title}</label>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                        {Object.entries(data).map(([key, value]) => (
                            <div key={key} className="flex flex-col space-y-1">
                                <span className="text-xs font-medium text-gray-500 uppercase">{key.replace(/question_|_/g, ' ')}</span>
                                <span className="text-sm text-gray-700">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Application Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Application ID</label>
                            <p className="text-gray-900 font-medium">
                                {application.application_number || `APP-${application.id}`}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <Badge variant="secondary" className={getStatusColor(application.application_status)}>
                                {formatStatus(application.application_status)}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                            <p className="text-gray-900">{formatDate(application.submission_date || application.created_at)}</p>
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

                    {parsedData && (
                        <>
                            {renderFormSection('Personal Information', parsedData.personal_info)}
                            {renderFormSection('Academic Information', parsedData.academic_info)}
                            {renderFormSection('WASSCE Information', parsedData.wassce_info)}

                            {parsedData.documents.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-600">Uploaded Documents</label>
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <ul className="space-y-1">
                                                {parsedData.documents.map((doc, index) => (
                                                    <li key={index} className="text-sm text-gray-700">• {doc}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}

                            {renderFormSection('Other Information', parsedData.other_info)}
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
        case 'under_review': return 'bg-yellow-100 text-yellow-800';
        case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
        case 'offer_issued': return 'bg-amber-100 text-amber-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'draft': return 'bg-gray-100 text-gray-800';
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
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

                    // Filter to only show submitted applications
                    const submittedApplications = data.filter((app: Application) =>
                        app &&
                        typeof app === 'object' &&
                        app.id !== undefined &&
                        app.application_status === 'submitted'
                    );

                    // Sort by submission date (newest first)
                    submittedApplications.sort((a: Application, b: Application) => {
                        const dateA = new Date(a.submission_date || a.created_at).getTime();
                        const dateB = new Date(b.submission_date || b.created_at).getTime();
                        return dateB - dateA;
                    });

                    setApplications(submittedApplications);
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
            const res = await api.post('/applicant/payment', {
                application_id: applicationId,
                amount: 500 // Adjust amount as needed
            });

            if (res.data && res.data.pin) {
                toast.success(`Payment initiated successfully. PIN: ${res.data.pin}`, {
                    duration: 10000 // Show for 10 seconds
                });
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
                    {applications.length} Submitted Application{applications.length !== 1 ? 's' : ''}
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin"></div>
                </div>
            ) : (
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                        <CardTitle className="text-lg text-gray-800">Your Submitted Applications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold">Application ID</TableHead>
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
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {app.application_number || `APP-${app.id}`}
                                                    </span>
                                                    <span className="text-xs text-gray-500">ID: {app.id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {app.program_type || 'Nursing Program'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                                                    {formatStatus(app.application_status)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{formatDate(app.submission_date || app.created_at)}</span>
                                                    {app.updated_at !== app.created_at && (
                                                        <span className="text-xs text-gray-500">
                                                            Updated: {formatDate(app.updated_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
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
                                                    <ApplicationDetailsModal application={app}>
                                                        <Button
                                                            variant="outline"
                                                            className="h-9 text-primary border-primary hover:bg-primary-light/10"
                                                        >
                                                            View Details
                                                        </Button>
                                                    </ApplicationDetailsModal>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-lg font-medium text-gray-900">No submitted applications</h3>
                                                    <p className="text-gray-500">You haven't submitted any applications yet.</p>
                                                </div>
                                            </div>
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