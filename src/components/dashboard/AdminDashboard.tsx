import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Applications from '@/pages/admin/Applications';
import Interviews from '@/pages/admin/Interviews';
import OfferLetters from '@/pages/admin/OfferLetters';
import Analytics from './Analytics';
import UserManagement from './UserManagement';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold" style={{ color: '#2563EB' }}>Admin Dashboard</h1>
                    <Button
                        onClick={handleLogout}
                        className="text-white transition-all"
                        style={{
                            backgroundColor: '#FF59A1',
                            boxShadow: '0 4px 6px -1px rgba(255, 89, 161, 0.25)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#E0338A';
                            e.currentTarget.style.boxShadow = '0 8px 9px -4px rgba(255, 89, 161, 0.2), 0 4px 18px 0 rgba(255, 89, 161, 0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#FF59A1';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(255, 89, 161, 0.25)';
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </header>

            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-4 overflow-x-auto">
                    <div className="flex space-x-1">
                        {[
                            { path: "/admin/applications", label: "Applications" },
                            { path: "/admin/interviews", label: "Interviews" },
                            { path: "/admin/offer-letters", label: "Offer Letters" },
                            { path: "/admin/analytics", label: "Analytics" },
                            { path: "/admin/users", label: "User Management" }
                        ].map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `px-4 py-3 font-medium rounded-t-md transition-all ${
                                        isActive
                                            ? "border-b-2 text-[#2563EB] border-[#2563EB]"
                                            : "text-gray-600 hover:text-[#2563EB] hover:bg-blue-50"
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-4 bg-white rounded-lg shadow-sm mt-6 mb-6 animate-fadeIn">
                <Routes>
                    <Route path="/applications" element={<Applications />} />
                    <Route path="/interviews" element={<Interviews />} />
                    <Route path="/offer-letters" element={<OfferLetters />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/users" element={<UserManagement />} />
                </Routes>
            </main>
        </div>
    );
}