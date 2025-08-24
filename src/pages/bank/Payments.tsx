import { useEffect, useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Printer, Eye, Download, Receipt, CreditCard, CheckCircle, RefreshCw, Building2, DollarSign, User, Phone, Shield, Loader2, TrendingUp, Calendar } from 'lucide-react';
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
    application_fee_pin?: string;
}

interface FormData {
    amount: number;
    depositor_name: string;
    depositor_phone?: string;
    bank_confirmation_pin: string;
}

export default function EnhancedBankingSystem() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
    const [showPinModal, setShowPinModal] = useState(false);
    const [generatedPayment, setGeneratedPayment] = useState<Payment | null>(null);


    useEffect(() => {
        loadPayments();
        generateTransactionRef();
    }, []);

    const loadPayments = async () => {
        try {
            const response = await api.get('/bank/payments-id');
            setPayments(response.data.payments || []); // Access nested payments array
        } catch (loadError) {
            console.error('Failed to load payments:', loadError);
            toast.error('Failed to load payment records');
        }
    };

    const generateTransactionRef = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        const ref = `TXN${timestamp}${random}`;
        setTransactionRef(ref);
    };

    const generateApplicationPin = (): string => {
        const segments = [];
        for (let i = 0; i < 4; i++) {
            segments.push(Math.floor(1000 + Math.random() * 9000).toString());
        }
        return segments.join('-');
    };

    const onSubmit = async (data: FormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const applicationPin = generateApplicationPin();
            const paymentData = {
                ...data,
                transaction_reference: transactionRef,
                payment_method: 'Bank Deposit',
                payment_status: 'confirmed',
                application_fee_pin: applicationPin,
                payment_date: new Date().toISOString()
            };

            const response = await api.post('/bank/create-payment', paymentData);

            // Access the payment data from the correct path in response
            const paymentFromApi = response.data.payment;

            // Ensure we have the complete payment object with proper data types
            const newPayment = {
                ...paymentFromApi,
                amount: Number(paymentFromApi.amount), // Convert string to number
                application_fee_pin: paymentFromApi.application_fee_pin || applicationPin // Ensure PIN is available
            };

            // Show PIN modal immediately
            setGeneratedPayment(newPayment);
            setShowPinModal(true);

            toast.success('Payment recorded successfully!', {
                description: 'Application PIN generated and receipt ready for printing'
            });

            setPayments(prev => [newPayment, ...prev]);
            reset();
            generateTransactionRef();

        } catch (submitError) {
            console.error('Failed to submit payment:', submitError);
            toast.error('Failed to record payment', {
                description: 'Please check the details and try again'
            });
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

    const printReceipt = (payment: Payment) => {
        const receiptHtml = generateReceiptHtml(payment);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const generateReceiptHtml = (payment: Payment) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt - ${payment.transaction_reference}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            color: #1a1a1a;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 25px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 8px;
        }
        .logo {
            font-size: 22px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
        }
        .receipt-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .label {
            font-weight: 600;
            color: #374151;
        }
        .value {
            color: #1f2937;
            font-weight: 500;
        }
        .pin-section {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
        }
        .pin-code {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 15px 0;
            background: white;
            padding: 15px;
            border: 2px solid #2563eb;
            border-radius: 8px;
            color: #2563eb;
            font-family: 'Courier New', monospace;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.25);
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        .instructions {
            background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
            border: 1px solid #d97706;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            font-size: 14px;
            color: #92400e;
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🏥 MATTRU NURSING SCHOOL</div>
        <div style="color: #6b7280; font-size: 14px;">Banking Services Department</div>
        <div style="font-size: 12px; color: #9ca3af;">Mattru Jong, Bonthe District</div>
    </div>

    <div class="receipt-title">📄 OFFICIAL PAYMENT RECEIPT</div>

    <div class="amount">SLE ${Number(payment.amount).toFixed(2)}</div>

    <div class="row">
        <span class="label">Transaction Reference:</span>
        <span class="value">${payment.transaction_reference}</span>
    </div>
    <div class="row">
        <span class="label">Date & Time:</span>
        <span class="value">${formatDate(payment.payment_date)}</span>
    </div>
    <div class="row">
        <span class="label">Depositor Name:</span>
        <span class="value">${payment.depositor_name}</span>
    </div>
    <div class="row">
        <span class="label">Contact Number:</span>
        <span class="value">${payment.depositor_phone || 'Not provided'}</span>
    </div>
    <div class="row">
        <span class="label">Payment Method:</span>
        <span class="value">Bank Deposit</span>
    </div>
    <div class="row">
        <span class="label">Status:</span>
        <span class="value" style="color: #059669; font-weight: bold;">✅ Confirmed</span>
    </div>

    <div class="pin-section">
        <div style="font-weight: bold; margin-bottom: 15px; color: #2563eb; font-size: 16px;">
            🔐 APPLICATION ACCESS PIN
        </div>
        <div class="pin-code">${payment.application_fee_pin || 'N/A'}</div>
        <div style="font-size: 12px; margin-top: 15px; color: #374151;">
            <strong>Important:</strong> Keep this PIN secure - required for application access
        </div>
    </div>

    <div class="instructions">
        <strong style="color: #92400e;">📋 NEXT STEPS:</strong><br><br>
        <strong>1.</strong> Visit our online application portal<br>
        <strong>2.</strong> Enter your 16-digit PIN to begin<br>
        <strong>3.</strong> Complete all required sections<br>
        <strong>4.</strong> Submit for review and processing<br><br>
        <strong style="color: #dc2626;">⚠️ Important Notice:</strong> This PIN expires 30 days from issue date.
    </div>

    <div class="footer">
        <div style="margin-bottom: 15px; font-weight: bold; color: #374151;">
            Contact Information
        </div>
        <div>📞 +232-78-618435 / +232-78-863342</div>
        <div>📧 support.msn.edu.sl</div>
        <div>🌐 https://admission.msn.edu.sl</div>
        <div style="margin-top: 20px; font-size: 10px; color: #9ca3af;">
            Receipt generated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
    };

    const downloadTableAsPdf = () => {
        const tableHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Records</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .header { text-align: center; margin-bottom: 30px; }
        .pin { font-family: 'Courier New', monospace; font-weight: bold; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Mattru Nursing School - Payment Records</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Depositor</th>
                <th>Amount</th>
                <th>PIN</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${payments.map(payment => `
                <tr>
                    <td>${formatDate(payment.payment_date)}</td>
                    <td>${payment.transaction_reference}</td>
                    <td>${payment.depositor_name}</td>
                    <td>SLE ${Number(payment.amount).toFixed(2)}</td>
                    <td class="pin">${payment.application_fee_pin || 'N/A'}</td>
                    <td>${payment.payment_status}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(tableHtml);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            Banking Payment System
                        </h1>
                        <p className="text-gray-600 text-lg">Process application fee payments and generate access PINs</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date().toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {payments.length} Total Payments
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            System Active
                        </div>
                        <Button
                            onClick={downloadTableAsPdf}
                            variant="outline"
                            className="flex items-center gap-2 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                        >
                            <Download className="w-4 h-4" />
                            Export Records
                        </Button>
                    </div>
                </div>

                {/* Payment Form Card */}
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-t-lg">
                        <CardTitle className="text-2xl font-bold flex items-center gap-3">
                            <CreditCard className="w-6 h-6" />
                            New Payment Entry
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            {/* Transaction Reference */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-semibold text-blue-900">Transaction Reference</Label>
                                        <p className="text-xl font-mono font-bold text-blue-700">{transactionRef}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={generateTransactionRef}
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Amount Field */}
                                <div className="space-y-3">
                                    <Label className="text-gray-800 font-semibold flex items-center gap-2" htmlFor="amount">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        Payment Amount (SLE)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            {...register('amount', {
                                                required: 'Amount is required',
                                                min: { value: 1, message: 'Amount must be positive' }
                                            })}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className={`h-12 pl-10 pr-4 border-2 rounded-xl transition-all duration-200 bg-white/80 ${
                                                errors.amount
                                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                    : 'border-gray-200 focus:border-emerald-500 hover:border-emerald-300'
                                            }`}
                                            disabled={isSubmitting}
                                        />
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    {errors.amount && (
                                        <p className="text-sm text-red-600 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                            {errors.amount.message}
                                        </p>
                                    )}
                                </div>

                                {/* Bank Confirmation PIN */}
                                <div className="space-y-3">
                                    <Label className="text-gray-800 font-semibold flex items-center gap-2" htmlFor="bank_confirmation_pin">
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        Bank Confirmation PIN
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="bank_confirmation_pin"
                                            {...register('bank_confirmation_pin', {
                                                required: 'Bank confirmation PIN is required'
                                            })}
                                            type="text"
                                            placeholder="Enter bank PIN"
                                            className={`h-12 pl-10 pr-4 border-2 rounded-xl transition-all duration-200 bg-white/80 ${
                                                errors.bank_confirmation_pin
                                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                    : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                                            }`}
                                            disabled={isSubmitting}
                                        />
                                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    {errors.bank_confirmation_pin && (
                                        <p className="text-sm text-red-600 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                            {errors.bank_confirmation_pin.message}
                                        </p>
                                    )}
                                </div>

                                {/* Depositor Name */}
                                <div className="space-y-3">
                                    <Label className="text-gray-800 font-semibold flex items-center gap-2" htmlFor="depositor_name">
                                        <User className="w-4 h-4 text-purple-600" />
                                        Depositor Name
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="depositor_name"
                                            {...register('depositor_name', {
                                                required: 'Depositor name is required'
                                            })}
                                            type="text"
                                            placeholder="Full name"
                                            className={`h-12 pl-10 pr-4 border-2 rounded-xl transition-all duration-200 bg-white/80 ${
                                                errors.depositor_name
                                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                    : 'border-gray-200 focus:border-purple-500 hover:border-purple-300'
                                            }`}
                                            disabled={isSubmitting}
                                        />
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    {errors.depositor_name && (
                                        <p className="text-sm text-red-600 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                            {errors.depositor_name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Depositor Phone */}
                                <div className="space-y-3">
                                    <Label className="text-gray-800 font-semibold flex items-center gap-2" htmlFor="depositor_phone">
                                        <Phone className="w-4 h-4 text-green-600" />
                                        Contact Number (Optional)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="depositor_phone"
                                            {...register('depositor_phone')}
                                            type="tel"
                                            placeholder="+232 XX XXX XXXX"
                                            className="h-12 pl-10 pr-4 border-2 border-gray-200 rounded-xl transition-all duration-200 bg-white/80 focus:border-green-500 hover:border-green-300"
                                            disabled={isSubmitting}
                                        />
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 text-white font-bold text-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing Payment...
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="w-5 h-5" />
                                        Record Payment & Generate PIN
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Payment Records Table */}
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                        <CardTitle className="text-xl font-bold flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Receipt className="w-6 h-6 text-gray-700" />
                                Payment Records
                            </div>
                            <span className="text-sm font-normal bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                {payments.length} records
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80">
                                        <TableHead className="font-bold text-gray-800">Date</TableHead>
                                        <TableHead className="font-bold text-gray-800">Reference</TableHead>
                                        <TableHead className="font-bold text-gray-800">Depositor</TableHead>
                                        <TableHead className="font-bold text-gray-800">Amount</TableHead>
                                        <TableHead className="font-bold text-gray-800">Application PIN</TableHead>
                                        <TableHead className="font-bold text-gray-800">Status</TableHead>
                                        <TableHead className="font-bold text-gray-800">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                                            <TableCell className="font-medium">
                                                {formatDate(payment.payment_date)}
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                                    {payment.transaction_reference}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{payment.depositor_name}</div>
                                                    {payment.depositor_phone && (
                                                        <div className="text-sm text-gray-500">{payment.depositor_phone}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-emerald-600">
                                                    SLE {Number(payment.amount).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                                                    {payment.application_fee_pin || 'N/A'}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {payment.payment_status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => printReceipt(payment)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setShowReceiptModal(true);
                                                        }}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Receipt Modal */}
                <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="w-5 h-5" />
                                Payment Receipt
                            </DialogTitle>
                        </DialogHeader>
                        {selectedPayment && (
                            <div ref={receiptRef} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <h3 className="font-bold text-lg">Mattru Nursing School</h3>
                                    <p className="text-sm text-gray-600">Payment Receipt</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Amount:</span>
                                        <span className="font-bold">SLE {Number(selectedPayment.amount).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Reference:</span>
                                        <span className="font-mono text-sm">{selectedPayment.transaction_reference}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Date:</span>
                                        <span>{formatDate(selectedPayment.payment_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Depositor:</span>
                                        <span>{selectedPayment.depositor_name}</span>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                        <div className="text-sm font-medium text-blue-900">Application PIN</div>
                                        <div className="font-mono font-bold text-blue-700">
                                            {selectedPayment.application_fee_pin}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => printReceipt(selectedPayment)}
                                    className="w-full flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Receipt
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* PIN Display Modal with Enhanced Background */}
                <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
                    <DialogContent className="max-w-md border-0 p-0 overflow-hidden bg-transparent">
                        {/* Animated Background Container */}
                        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl">
                            {/* Animated Background Elements */}
                            <div className="absolute inset-0 overflow-hidden rounded-2xl">
                                {/* Floating Circles */}
                                <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
                                <div className="absolute -top-5 right-10 w-12 h-12 bg-yellow-300/20 rounded-full animate-bounce"></div>
                                <div className="absolute bottom-10 -right-5 w-16 h-16 bg-pink-300/15 rounded-full animate-pulse"></div>
                                <div className="absolute bottom-5 left-5 w-8 h-8 bg-green-300/20 rounded-full animate-bounce"></div>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>

                                {/* Sparkle Effect */}
                                <div className="absolute top-4 right-4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                                <div className="absolute top-12 right-8 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                                <div className="absolute top-8 right-12 w-1 h-1 bg-pink-300 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                            </div>

                            {/* Content Container */}
                            <div className="relative z-10 p-6">
                                <DialogHeader className="text-center mb-6">
                                    <DialogTitle className="flex flex-col items-center gap-3 text-white">
                                        <div className="relative">
                                            {/* Success Icon with Glow Effect */}
                                            <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg animate-pulse">
                                                <CheckCircle className="w-8 h-8 text-white" />
                                            </div>
                                            {/* Glow Ring */}
                                            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse"></div>
                                        </div>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                            Payment Successful!
                        </span>
                                    </DialogTitle>
                                </DialogHeader>

                                {generatedPayment && (
                                    <div className="space-y-6">
                                        {/* Success Message */}
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
                                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                                                    <CheckCircle className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-white/90 font-medium">Your payment has been successfully processed</p>
                                        </div>

                                        {/* Payment Summary Card */}
                                        <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 space-y-3 border border-white/20 shadow-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-white/80">Amount Paid</span>
                                                <span className="text-xl font-bold text-emerald-300">
                                    SLE {Number(generatedPayment.amount).toFixed(2)}
                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-white/80">Transaction ID</span>
                                                <code className="text-sm bg-white/20 backdrop-blur-sm px-2 py-1 rounded border border-white/30 font-mono text-white">
                                                    {generatedPayment.transaction_reference}
                                                </code>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-white/80">Depositor</span>
                                                <span className="text-sm font-medium text-white">{generatedPayment.depositor_name}</span>
                                            </div>
                                        </div>

                                        {/* PIN Display Card */}
                                        <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-xl p-6 text-center space-y-4 shadow-xl">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center gap-2 text-white">
                                                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                                        <Shield className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-semibold">Application Access PIN</span>
                                                </div>
                                                <p className="text-xs text-white/80">Keep this PIN secure - required for application access</p>
                                            </div>

                                            {/* PIN Code Display */}
                                            <div className="relative">
                                                <div className="bg-white/95 backdrop-blur-sm border-2 border-blue-200 rounded-lg p-4 shadow-inner">
                                                    <div className="text-2xl font-bold font-mono text-blue-900 tracking-wider select-all bg-white px-2 py-1 rounded border border-blue-300">
                                                        {generatedPayment?.application_fee_pin || 'PIN-ERROR'}
                                                    </div>
                                                </div>
                                                {/* Shine Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-lg transform -skew-x-12 animate-shine"></div>
                                            </div>

                                            {/* Warning Message */}
                                            <div className="bg-amber-400/20 backdrop-blur-sm border border-amber-300/30 rounded-lg p-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0 animate-pulse"></div>
                                                    <div className="text-xs text-amber-100">
                                                        <strong>Important:</strong> This PIN expires in 30 days. Use it to access the online application portal.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedPayment.application_fee_pin || '');
                                                    toast.success('PIN copied to clipboard!');
                                                }}
                                                variant="outline"
                                                className="flex-1 flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 text-white hover:text-white transition-all duration-300"
                                            >
                                                <span className="text-sm">📋</span>
                                                Copy PIN
                                            </Button>

                                            <Button
                                                onClick={() => {
                                                    printReceipt(generatedPayment);
                                                    setShowPinModal(false);
                                                }}
                                                className="flex-1 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Print Receipt
                                            </Button>
                                        </div>

                                        {/* Progress Steps */}
                                        <div className="text-center space-y-3">
                                            <p className="text-sm text-white/90 font-medium">Next Steps</p>
                                            <div className="flex items-center justify-center gap-4 text-xs">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold border border-white/30">1</div>
                                                    <span className="text-white/80">Visit portal</span>
                                                </div>
                                                <div className="w-6 h-0.5 bg-white/30"></div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold border border-white/30">2</div>
                                                    <span className="text-white/80">Enter PIN</span>
                                                </div>
                                                <div className="w-6 h-0.5 bg-white/30"></div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold border border-white/30">3</div>
                                                    <span className="text-white/80">Complete</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Close Button */}
                                        <Button
                                            onClick={() => setShowPinModal(false)}
                                            variant="ghost"
                                            className="w-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}