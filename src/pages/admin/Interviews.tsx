import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface Interview {
    id: number;
    applicant_id: number;
    email: string;
    program_type: string;
    application_status: string;
    interview_date: string;
    interview_time: string;
}

export default function Interviews() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const COLORS = ['#2563EB', '#FF59A1', '#10B981', '#F59E0B', '#A855F7'];

    useEffect(() => {
        setIsLoading(true);
        api
            .get('/admin/interviews')
            .then((res) => {
                setInterviews(res.data);
                setIsLoading(false);
            })
            .catch(() => {
                toast.error('Failed to load interviews');
                setIsLoading(false);
            });
    }, []);

    const handleCompleteInterview = async (id: number) => {
        try {
            await api.put(`/admin/interviews/${id}/complete`);

            // Update local state
            setInterviews(interviews.map(interview =>
                interview.id === id
                    ? { ...interview, application_status: 'offer_issued' }
                    : interview
            ));

            toast.success( 'Interview completed and offer issued', {
                description: 'The applicant has been notified and the offer letter is ready.'
            });
        } catch (error) {
            toast.error('Failed to complete interview', {
                description: 'Please try again later or contact support.'});
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        return timeString;
    };

    // Prepare data for pie chart
    const programCounts: Record<string, number> = {};
    interviews.forEach((interview) => {
        const program = interview.program_type;
        programCounts[program] = (programCounts[program] || 0) + 1;
    });

    const pieChartData = Object.keys(programCounts).map((key) => ({
        name: key === 'diploma' ? 'Diploma in Nursing' :
            key === 'bachelors' ? 'Bachelor of Science in Nursing' :
                key === 'certificate' ? 'Certificate in Nursing Assistant' : key,
        value: programCounts[key]
    }));

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Interview Management</h2>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {interviews.length} Scheduled Interviews
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                                <CardTitle className="text-lg text-gray-800">Upcoming Interviews</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-semibold">Applicant</TableHead>
                                            <TableHead className="font-semibold">Date</TableHead>
                                            <TableHead className="font-semibold">Time</TableHead>
                                            <TableHead className="font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {interviews.length > 0 ? (
                                            interviews.map((interview) => (
                                                <TableRow key={interview.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">{interview.email}</TableCell>
                                                    <TableCell>{formatDate(interview.interview_date)}</TableCell>
                                                    <TableCell>{formatTime(interview.interview_time)}</TableCell>
                                                    <TableCell>
                                                        {interview.application_status === 'interview_scheduled' && (
                                                            <Button
                                                                onClick={() => handleCompleteInterview(interview.id)}
                                                                className="text-white transition-all h-9"
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
                                                                Complete & Issue Offer
                                                            </Button>
                                                        )}
                                                        {interview.application_status === 'offer_issued' && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                                Offer Issued
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                    No interviews scheduled
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 pb-4">
                                <CardTitle className="text-lg text-gray-800">Program Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.375rem'
                                                }}
                                                formatter={(value, name) => [`${value} applications`, name]}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}