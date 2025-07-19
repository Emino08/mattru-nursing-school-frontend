// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
//
// function App() {
//   const [count, setCount] = useState(0)
//
//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }
//
// export default App

import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import VerifyEmail from '@/components/auth/VerifyEmail';
import ApplicantDashboard from '@/components/dashboard/ApplicantDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import BankDashboard from '@/components/dashboard/BankDashboard';
import {useAuth} from "@/hooks/useAuth";
import {ForgotPassword} from "@/components/auth/ForgotPassword";
import {ResetPassword} from "@/components/auth/ResetPassword";

function App() {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    const getRedirectPath = () => {
        if (!user) return null;
        if (user.role === 'applicant') return '/applicant';
        if (user.role === 'bank') return '/bank';
        return '/admin';
    };

    const redirectPath = getRedirectPath();

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={user ? <Navigate to={redirectPath!} replace /> : <Login />}
                />
                <Route
                    path="/register"
                    element={user ? <Navigate to={redirectPath!} replace /> : <Register />}
                />
                <Route
                    path="/verify"
                    element={user ? <Navigate to={redirectPath!} replace /> : <VerifyEmail />}
                />
                <Route
                    path="/forgot-password"
                    element={user ? <Navigate to={redirectPath!} replace /> : <ForgotPassword />}
                />
                <Route
                    path="/reset-password"
                    element={user ? <Navigate to={redirectPath!} replace /> : <ResetPassword />}
                />
                <Route path="/applicant/*" element={user ? <ApplicantDashboard /> : <Navigate to="/login" replace />} />
                <Route path="/admin/*" element={user ? <AdminDashboard /> : <Navigate to="/login" replace />} />
                <Route path="/bank/*" element={user ? <BankDashboard /> : <Navigate to="/login" replace />} />
                <Route path="/" element={<Navigate to={user ? redirectPath! : '/login'} replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;