import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {Input} from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';

interface Payment {
    id: number;
    applicant_id: number;
    amount: number;
    bank_confirmation_pin: string;
    payment_status: string;
}

interface FormData {
    application_id: number;
    pin: string;
}

export default function Payments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const { register, handleSubmit, reset } = useForm<FormData>();
    // const { toast } = useToast();

    useEffect(() => {
        api
            .get('/api/bank/analytics')
            .then((res) => setPayments([...res.data.pending_payments, ...res.data.confirmed_payments]))
            .catch(() => toast({ title: 'Error', description: 'Failed to load payments', variant: 'destructive' }));
    }, [toast]);

    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/api/bank/confirm-payment', data);
            setPayments((pays) =>
                pays.map((p) => (p.applicant_id === data.application_id ? { ...p, payment_status: 'confirmed' } : p))
            );
            toast({ title: 'Success', description: 'Payment confirmed' });
            reset();
        } catch (error) {
            toast({ title: 'Error', description: 'Invalid PIN or application ID', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payments</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
                <div>
                    <Label>Application ID</Label>
                    <Input {...register('application_id')} type="number" />
                </div>
                <div>
                    <Label>Payment PIN</Label>
                    <Input {...register('pin')} />
                </div>
                <Button type="submit">Confirm Payment</Button>
            </form>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Application ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>PIN</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell>{payment.applicant_id}</TableCell>
                            <TableCell>${payment.amount}</TableCell>
                            <TableCell>{payment.bank_confirmation_pin}</TableCell>
                            <TableCell>{payment.payment_status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}