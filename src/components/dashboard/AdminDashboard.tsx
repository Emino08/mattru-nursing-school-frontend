import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Applications from '@/pages/admin/Applications';
import Interviews from '@/pages/admin/Interviews';
import OfferLetters from '@/pages/admin/OfferLetters';
import Analytics from './Analytics';
import UserManagement from './UserManagement';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import QuestionManagement from "@/pages/admin/Question";

interface NavItem {
    path: string;
    label: string;
}

interface PermissionsResponse {
    success: boolean;
    permissions: string[];
    navbar_items: NavItem[];
    user_role: string;
}

export default function AdminDashboard() {
    const { user, loading, isAuthenticated, logout } = useAuth();
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(true);

    const allowedRoles = ['admin', 'it', 'registrar', 'finance', 'principal'];

    useEffect(() => {
        if (isAuthenticated && allowedRoles.includes(user?.role || '')) {
            loadPermissions();
        }
    }, [isAuthenticated, user?.role]);

    const loadPermissions = async () => {
        try {
            const response = await api.get<PermissionsResponse>('/admin/permissions');
            if (response.data.success) {
                setPermissions(response.data.permissions);
                setNavItems(response.data.navbar_items);
            }
        } catch (error) {
            console.error('Failed to load permissions:', error);
            // Fallback to default navigation
            setNavItems([
                { path: '/admin/applications', label: 'Applications' },
                { path: '/admin/analytics', label: 'Analytics' }
            ]);
        } finally {
            setPermissionsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (loading || permissionsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated || !allowedRoles.includes(user?.role || '')) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has permission for a specific action
    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#FF59A1] flex items-center justify-center text-white font-bold mr-3">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: '#2563EB' }}>Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">
                                Welcome, {user?.email} ({user?.role})
                            </p>
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
                    <div className="flex space-x-1">
                        {navItems.map((item) => (
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
                        <Route
                            path="/applications"
                            element={
                                hasPermission('application_management') ?
                                    <Applications /> :
                                    <div className="text-center py-8 text-gray-500">Access Denied</div>
                            }
                        />
                        <Route
                            path="/interviews"
                            element={
                                hasPermission('interview_scheduling') ?
                                    <Interviews /> :
                                    <div className="text-center py-8 text-gray-500">Access Denied</div>
                            }
                        />
                        <Route
                            path="/offer-letters"
                            element={
                                hasPermission('offer_letter_management') ?
                                    <OfferLetters /> :
                                    <div className="text-center py-8 text-gray-500">Access Denied</div>
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                hasPermission('analytics_dashboard') ?
                                    <Analytics /> :
                                    <div className="text-center py-8 text-gray-500">Access Denied</div>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                hasPermission('user_management') ?
                                    <UserManagement /> :
                                    <div className="text-center py-8 text-gray-500">Access Denied</div>
                            }
                        />
                        <Route
                            path="/questions"
                            element={
                                hasPermission('question_management') ?
                                    <QuestionManagement />:
                                    <div className="text-center py-8 text-gray-500">Access Denied</div>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <Navigate
                                    to={navItems.length > 0 ? navItems[0].path : '/admin/applications'}
                                    replace
                                />
                            }
                        />
                    </Routes>
                </div>
            </main>
        </div>
    );
}