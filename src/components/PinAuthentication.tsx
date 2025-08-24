import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Lock, Key, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import {useAuth} from "@/context/AuthContext";

interface PinAuthenticationProps {
    onAuthSuccess: (paymentData: any) => void;
    onSkip?: () => void; // Optional for development/testing
}

interface PaymentData {
    pin: string;
    paymentData: any; // You may want to define this more specifically based on your API response
    verified: boolean;
}
interface PinAuthenticationProps {
    onAuthSuccess: (paymentData: PaymentData) => void;
    onSkip?: () => void;
}

export default function PinAuthentication({ onAuthSuccess, onSkip }: PinAuthenticationProps) {
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();

    const formatPin = (value: string) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Add hyphens every 4 digits
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1-');

        // Limit to 19 characters (16 digits + 3 hyphens)
        return formatted.substring(0, 19);
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedPin = formatPin(e.target.value);
        setPin(formattedPin);
        setError('');
    };

    const verifyPin = async () => {
        if (!pin.trim()) {
            setError('Please enter your 16-digit Application PIN');
            return;
        }

        // Remove hyphens for verification
        const cleanPin = pin.replace(/-/g, '');

        if (cleanPin.length !== 16) {
            setError('PIN must be exactly 16 digits');
            return;
        }

        setIsVerifying(true);
        try {
            const response = await api.post('/applicant/verify-application-pin', {
                application_pin: pin,
                user_id: user?.id
            });

            if (response.data.success) {
                toast.success('PIN verified successfully!');
                onAuthSuccess({
                    pin: pin,
                    paymentData: response.data.payment,
                    verified: true
                });
            } else {
                setError(response.data.message || 'Invalid PIN. Please check and try again.');
            }
        } catch (error: unknown) {
            console.error('PIN verification error:', error);
            if (error.response?.status === 404) {
                setError('Invalid PIN. Please check your payment receipt and try again.');
            } else if (error.response?.status === 410) {
                setError('This PIN has expired. Please make a new payment to get a fresh PIN.');
            } else {
                setError('Unable to verify PIN. Please try again or contact support.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            verifyPin();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Application Access
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            Enter your 16-digit PIN from your payment receipt to begin your application
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="text-sm font-medium text-gray-700">
                                Application PIN
                            </Label>
                            <div className="relative">
                                <Input
                                    id="pin"
                                    type="text"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={pin}
                                    onChange={handlePinChange}
                                    onKeyPress={handleKeyPress}
                                    className="text-center text-lg font-mono tracking-wider h-12 border-2 focus:border-blue-500"
                                    maxLength={19} // 16 digits + 3 hyphens
                                />
                                <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900 mb-1">Where to find your PIN:</p>
                                    <ul className="text-blue-700 space-y-1">
                                        <li>• Check your payment receipt from the bank</li>
                                        <li>• Look for the 16-digit "Application Access PIN"</li>
                                        <li>• PIN format: XXXX-XXXX-XXXX-XXXX</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={verifyPin}
                            disabled={isVerifying || pin.replace(/-/g, '').length !== 16}
                            className={`w-full h-12 text-lg font-medium transition-all duration-200 ${
                                isVerifying
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : pin.replace(/-/g, '').length === 16
                                        ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-400 cursor-not-allowed'
                            } text-white`}
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Verifying PIN...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5 mr-2" />
                                    Verify PIN & Start Application
                                </>
                            )}
                        </Button>

                        {onSkip && (
                            <Button
                                onClick={onSkip}
                                variant="outline"
                                className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                            >
                                Skip for Development
                            </Button>
                        )}

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Need help? Contact our admissions office at{' '}
                                <a href="mailto:admissions@msn.edu.sl" className="text-blue-600 hover:underline">
                                    admissions@msn.edu.sl
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">🏦 Make a Payment</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Don't have a PIN yet? Visit Rokel Commercial Bank to make your application fee payment.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                            <div>
                                <p className="font-medium">Bank Hours:</p>
                                <p>Mon-Fri: 8AM-3:30PM</p>
                            </div>
                            <div>
                                <p className="font-medium">Location:</p>
                                <p>Bojon Street - Bo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}