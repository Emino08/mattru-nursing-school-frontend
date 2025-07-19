import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            api
                .get(`/verify?token=${token}`)
                .then(() => {
                    toast({ title: 'Success', description: 'Email verified successfully' });
                    setVerificationStatus('success');
                    // Navigate after a short delay to show the success message
                    setTimeout(() => navigate('/login'), 3000);
                })
                .catch(() => {
                    toast({ title: 'Error', description: 'Invalid verification token', variant: 'destructive' });
                    setVerificationStatus('error');
                });
        } else {
            setVerificationStatus('error');
            toast({ title: 'Error', description: 'No verification token provided', variant: 'destructive' });
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-card p-8 text-center animate-fadeIn">
                {verificationStatus === 'verifying' && (
                    <>
                        <div className="w-20 h-20 border-4 border-t-[#2563EB] border-r-[#2563EB] border-b-[#FF59A1] border-l-[#FF59A1] rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-3">Verifying Your Email</h1>
                        <p className="text-gray-600">Please wait while we verify your email address...</p>
                    </>
                )}

                {verificationStatus === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-3">Email Verified!</h1>
                        <p className="text-gray-600 mb-6">Your email has been successfully verified. You can now log in to your account.</p>
                        <Link
                            to="/login"
                            style={{ backgroundColor: '#2563EB' }}
                            className="inline-block px-6 py-3 rounded-md text-white font-medium transition-all hover:bg-opacity-90"
                        >
                            Go to Login
                        </Link>
                    </>
                )}

                {verificationStatus === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-3">Verification Failed</h1>
                        <p className="text-gray-600 mb-6">We couldn't verify your email address. The verification link may be expired or invalid.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/login"
                                className="px-6 py-3 rounded-md text-[#2563EB] font-medium border border-[#2563EB] transition-all hover:bg-blue-50"
                            >
                                Go to Login
                            </Link>
                            <Link
                                to="/register"
                                style={{ backgroundColor: '#FF59A1' }}
                                className="px-6 py-3 rounded-md text-white font-medium transition-all hover:bg-opacity-90"
                            >
                                Register Again
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}