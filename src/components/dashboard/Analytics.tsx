import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface AnalyticsData {
    total_applications: number;
    total_payments: number;
    pending_interviews: number;
    application_status: {
        submitted: number;
        interview_scheduled: number;
        offer_issued: number;
        payment_verified: number;
        completed: number;
    };
    programs: {
        undergraduate: number;
        diploma: number;
    };
}

export default function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api
            .get('/api/admin/analytics')
            .then((res) => {
                setData(res.data);
                setIsLoading(false);
            })
            .catch((error) => {
                toast({ title: 'Error', description: 'Failed to load analytics data', variant: 'destructive' });
                setIsLoading(false);
            });
    }, []);

    // Colors for charts
    const COLORS = ['#2563EB', '#FF59A1', '#10B981', '#F59E0B', '#A855F7'];

    // Data for bar chart
    const barChartData = data ? [
        { name: 'Applications', value: data.total_applications || 0 },
        { name: 'Payments', value: data.total_payments || 0 },
        { name: 'Interviews', value: data.pending_interviews || 0 },
    ] : [];

    // Data for pie chart
    const pieChartData = data ? [
        { name: 'Submitted', value: data.application_status?.submitted || 0 },
        { name: 'Interview Scheduled', value: data.application_status?.interview_scheduled || 0 },
        { name: 'Offer Issued', value: data.application_status?.offer_issued || 0 },
        { name: 'Payment Verified', value: data.application_status?.payment_verified || 0 },
        { name: 'Completed', value: data.application_status?.completed || 0 },
    ] : [];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-2">
                                <CardTitle className="text-lg text-gray-800">Total Applications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end space-x-2 mt-2">
                                    <p className="text-3xl font-bold text-primary">{data?.total_applications || 0}</p>
                                    <p className="text-sm text-gray-500 mb-1">applications</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 pb-2">
                                <CardTitle className="text-lg text-gray-800">Total Payments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end space-x-2 mt-2">
                                    <p className="text-3xl font-bold" style={{ color: '#FF59A1' }}>${data?.total_payments || 0}</p>
                                    <p className="text-sm text-gray-500 mb-1">received</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 pb-2">
                                <CardTitle className="text-lg text-gray-800">Pending Interviews</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end space-x-2 mt-2">
                                    <p className="text-3xl font-bold text-green-600">{data?.pending_interviews || 0}</p>
                                    <p className="text-sm text-gray-500 mb-1">scheduled</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                        <Card className="border border-gray-200 shadow-sm p-4">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg text-gray-800">Application Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.375rem'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="value" fill="#2563EB" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm p-4">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg text-gray-800">Application Status</CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="h-64">
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
