import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Payments from '@/pages/bank/Payments';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function BankDashboard() {
    const { user, loading, isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Redirect if user is not authenticated or not a bank user
    if (!isAuthenticated || !user || user.role !== 'bank') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="bg-gradient-to-r from-[#2563EB] to-[#FF59A1] p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: '#2563EB' }}>Bank Portal</h1>
                            <p className="text-sm text-gray-600">Welcome, {user?.email}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        className="text-white transition-all"
                        style={{
                            backgroundColor: '#FF59A1',
                            boxShadow: '0 4px 6px -1px rgba(255, 89, 161, 0.25)'
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </header>

            <nav className="bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex">
                        <NavLink
                            to="/bank/payments"
                            className={({ isActive }) =>
                                `px-4 py-3 font-medium rounded-t-md transition-all ${
                                    isActive
                                        ? "border-b-2 text-[#2563EB] border-[#2563EB]"
                                        : "text-gray-600 hover:text-[#2563EB] hover:bg-blue-50"
                                }`
                            }
                        >
                            Payment Management
                        </NavLink>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-6">
                <div className="bg-white rounded-lg shadow-card p-6 animate-fadeIn">
                    <Routes>
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/" element={<Navigate to="/bank/payments" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}