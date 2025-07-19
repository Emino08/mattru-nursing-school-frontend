import { Routes, Route, NavLink } from 'react-router-dom';
import Profile from '@/pages/applicant/Profile';
import Application from '@/pages/applicant/Application';
import Status from '@/pages/applicant/Status';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function ApplicantDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#FF59A1] flex items-center justify-center text-white font-bold mr-3">
                            MS
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: '#2563EB' }}>Applicant Portal</h1>
                    </div>
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

            <nav className="bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex space-x-1">
                        {[
                            { path: "/applicant/profile", label: "My Profile" },
                            { path: "/applicant/application", label: "New Application" },
                            { path: "/applicant/status", label: "Application Status" }
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

            <main className="container mx-auto p-6">
                <div className="bg-white rounded-lg shadow-card p-6 animate-fadeIn">
                    <Routes>
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/application" element={<Application />} />
                        <Route path="/status" element={<Status />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}