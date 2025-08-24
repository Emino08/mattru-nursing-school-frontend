import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, School, CheckCircle } from 'lucide-react';

export default function PinValidationPage({ onValidated }) {
    const [pin, setPin] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [paymentInfo, setPaymentInfo] = useState(null);

    const handlePinChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Only digits

        // Format as XXXX-XXXX-XXXX-XXXX
        if (value.length > 0) {
            value = value.match(/.{1,4}/g)?.join('-') || value;
        }

        if (value.replace(/-/g, '').length <= 16) {
            setPin(value);
            setError('');
        }
    };

    const validatePin = async () => {
        if (!pin || pin.replace(/-/g, '').length !== 16) {
            setError('Please enter a valid 16-digit PIN');
            return;
        }

        setIsValidating(true);
        setError('');

        try {
            // Simulate API call - replace with actual API endpoint
            const response = await fetch('/applicant/verify-application-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ application_pin: pin })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setPaymentInfo(data.payment);

                // Start application with verified PIN
                const startResponse = await fetch('/api/applicant/start-application', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ application_pin: pin })
                });

                const startData = await startResponse.json();

                if (startResponse.ok && startData.success) {
                    // Store application context
                    localStorage.setItem('application_id', startData.application_id);
                    localStorage.setItem('payment_verified', 'true');

                    // Call parent component to proceed to main form
                    if (onValidated) {
                        onValidated({
                            applicationId: startData.application_id,
                            paymentInfo: data.payment,
                            pin: pin
                        });
                    }
                } else {
                    setError(startData.error || 'Failed to start application');
                }
            } else {
                setError(data.error || 'Invalid PIN. Please check your payment receipt.');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        validatePin();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                            <School className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Mattru Nursing School
                        </CardTitle>
                        <p className="text-gray-600 mt-2">Enter your application PIN to continue</p>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {paymentInfo && (
                            <Alert className="mb-6 border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    PIN verified! Payment of Le {paymentInfo.amount} by {paymentInfo.depositor_name} confirmed.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-sm font-medium text-gray-700">
                                    Application PIN
                                </Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="pin"
                                        type="text"
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                        value={pin}
                                        onChange={handlePinChange}
                                        className="pl-10 text-center font-mono text-lg tracking-wider"
                                        disabled={isValidating}
                                        maxLength={19}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                validatePin();
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Enter the 16-digit PIN from your payment receipt
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="button"
                                onClick={validatePin}
                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                disabled={isValidating || pin.replace(/-/g, '').length !== 16}
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Validating PIN...
                                    </>
                                ) : (
                                    'Start Application'
                                )}
                            </Button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-3">Need help?</p>
                                <div className="space-y-1 text-xs text-gray-500">
                                    <p>Contact: +232-XX-XXXXXX</p>
                                    <p>Email: admissions@mattru.edu</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0">
                                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <span className="text-yellow-800 text-xs font-bold">!</span>
                                    </div>
                                </div>
                                <div className="text-xs text-yellow-800">
                                    <p className="font-medium mb-1">Important Notes:</p>
                                    <ul className="space-y-1">
                                        <li>• PINs expire 30 days after payment</li>
                                        <li>• Each PIN can only be used once</li>
                                        <li>• Keep your payment receipt safe</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}