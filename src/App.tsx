import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import VerifyEmail from '@/components/auth/VerifyEmail';
import ApplicantDashboard from '@/components/dashboard/ApplicantDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import BankDashboard from '@/components/dashboard/BankDashboard';
import { useAuth, User } from '@/context/AuthContext';
import { ForgotPassword } from '@/components/auth/ForgotPassword';
import { ResetPassword } from '@/components/auth/ResetPassword';
import { Toaster } from 'sonner';

const getRedirectPath = (user: User | null): string => {
    if (!user) return '/login';
    switch (user.role) {
        case 'applicant': return '/applicant';
        case 'bank': return '/bank';
        case 'admin': return '/admin';
        case 'registrar': return '/admin';
        case 'principal': return '/admin';
        case 'it': return '/admin';
        case 'finance': return '/admin';
        default: return '/login';
    }
};

const AppRoutes = () => {
    const { user, loading } = useAuth();
    const redirectPath = getRedirectPath(user);

    if (loading) return <div>Loading...</div>;

    return (
        <Routes>
            <Route
                path="/login"
                element={user ? <Navigate to={redirectPath} replace /> : <Login />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to={redirectPath} replace /> : <Register />}
            />
            <Route
                path="/verify"
                element={user ? <Navigate to={redirectPath} replace /> : <VerifyEmail />}
            />
            <Route
                path="/forgot-password"
                element={user ? <Navigate to={redirectPath} replace /> : <ForgotPassword />}
            />
            <Route
                path="/reset-password"
                element={user ? <Navigate to={redirectPath} replace /> : <ResetPassword />}
            />
            <Route path="/applicant/*" element={user ? <ApplicantDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/admin/*" element={user ? <AdminDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/bank/*" element={user ? <BankDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/" element={<Navigate to={user ? redirectPath : '/login'} replace />} />
        </Routes>
    );
};

function App() {
    return (
            <BrowserRouter>
                <AppRoutes />
                <Toaster />
            </BrowserRouter>
    );
}

export default App;