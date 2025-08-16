import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';

interface Payment {
    id: number;
    applicant_id?: number;
    bank_user_id?: number;
    amount: number;
    payment_method: string;
    transaction_reference: string;
    bank_confirmation_pin: string;
    payment_status: string;
    depositor_name?: string;
    depositor_phone?: string;
    payment_date: string;
}

interface FormData {
    amount: number;
    depositor_name: string;
    depositor_phone?: string;
    bank_confirmation_pin: string;
}

export default function Payments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

    useEffect(() => {
        loadPayments();
        generateTransactionRef();
    }, []);

    const loadPayments = async () => {
        try {
            const res = await api.get('/bank/payments');
            setPayments(res.data.payments || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load payments', variant: 'destructive' });
        }
    };

    const generateTransactionRef = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        const ref = `TXN${timestamp}${random}`;
        setTransactionRef(ref);
    };

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);
            await api.post('/bank/create-payment', {
                amount: data.amount,
                depositor_name: data.depositor_name,
                depositor_phone: data.depositor_phone || null,
                bank_confirmation_pin: data.bank_confirmation_pin,
                transaction_reference: transactionRef,
                payment_method: 'bank'
            });

            await loadPayments();
            toast({ title: 'Success', description: 'Payment record created successfully' });
            reset();
            generateTransactionRef();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create payment record. Please try again.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Payment Management</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Bank Portal
                </div>
            </div>

            <Card className="border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 rounded-t-lg">
                    <CardTitle className="text-lg font-medium">Record New Payment Deposit</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Amount (SLE)</Label>
                                <Input
                                    {...register('amount', {
                                        required: 'Amount is required',
                                        valueAsNumber: true,
                                        min: { value: 1, message: 'Amount must be greater than 0' }
                                    })}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-10 border-gray-200 focus:border-primary"
                                />
                                {errors.amount && (
                                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Bank Confirmation PIN</Label>
                                <Input
                                    {...register('bank_confirmation_pin', {
                                        required: 'Bank confirmation PIN is required'
                                    })}
                                    type="text"
                                    placeholder="Enter bank confirmation PIN"
                                    className="h-10 border-gray-200 focus:border-primary"
                                />
                                {errors.bank_confirmation_pin && (
                                    <p className="text-sm text-red-500">{errors.bank_confirmation_pin.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Depositor Name</Label>
                                <Input
                                    {...register('depositor_name', {
                                        required: 'Depositor name is required'
                                    })}
                                    type="text"
                                    placeholder="Full name of person who made deposit"
                                    className="h-10 border-gray-200 focus:border-primary"
                                />
                                {errors.depositor_name && (
                                    <p className="text-sm text-red-500">{errors.depositor_name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Depositor Phone (Optional)</Label>
                                <Input
                                    {...register('depositor_phone')}
                                    type="tel"
                                    placeholder="+232 XX XXX XXXX"
                                    className="h-10 border-gray-200 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Generated Transaction Reference</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={transactionRef}
                                    readOnly
                                    className="h-10 border-gray-200 bg-gray-50 font-mono flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={generateTransactionRef}
                                    className="h-10 border-gray-200"
                                >
                                    Generate New
                                </Button>
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
                        >
                            {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border border-gray-200">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Payment Records</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Payment ID</TableHead>
                                    <TableHead className="font-semibold">Bank User</TableHead>
                                    <TableHead className="font-semibold">Amount</TableHead>
                                    <TableHead className="font-semibold">Transaction Ref</TableHead>
                                    <TableHead className="font-semibold">Depositor</TableHead>
                                    <TableHead className="font-semibold">Phone</TableHead>
                                    <TableHead className="font-semibold">PIN</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">#{payment.id}</TableCell>
                                        <TableCell>
                                            {payment.bank_user_id ? `Bank User #${payment.bank_user_id}` :
                                                (payment.applicant_id ? `Applicant #${payment.applicant_id}` : 'N/A')}
                                        </TableCell>
                                        <TableCell>SLE {payment.amount?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell className="font-mono text-sm">{payment.transaction_reference || 'N/A'}</TableCell>
                                        <TableCell>{payment.depositor_name || 'N/A'}</TableCell>
                                        <TableCell>{payment.depositor_phone || 'N/A'}</TableCell>
                                        <TableCell className="font-mono text-sm">{payment.bank_confirmation_pin}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                payment.payment_status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {payment.payment_status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {formatDate(payment.payment_date)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                            No payment records found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}