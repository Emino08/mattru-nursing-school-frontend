import { useState } from 'react';
import MultiStepForm from '@/components/forms/MultiStepForm';
import PinAuthentication from '@/components/PinAuthentication';

export default function Application() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    const handleAuthSuccess = (authData: any) => {
        setIsAuthenticated(true);
        setPaymentData(authData.paymentData);
    };

    // Show PIN authentication if not authenticated
    if (!isAuthenticated) {
        return <PinAuthentication onAuthSuccess={handleAuthSuccess} />;
    }

    // Show application form after successful authentication
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">New Application</h2>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    PIN Verified ✓
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">Complete Your Application</h3>
                    <p className="text-gray-600 text-sm mt-1">
                        Please fill out all required information to submit your application
                    </p>
                </div>
                <div className="p-6">
                    <MultiStepForm paymentData={paymentData} />
                </div>
            </div>
        </div>
    );
}