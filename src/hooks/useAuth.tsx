// import { useState, useEffect } from 'react';
// import api from '@/services/api';
//
// interface User {
//     id: number;
//     email: string;
//     role: string;
//     permissions: string[];
// }
//
// export function useAuth() {
//     const [user, setUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             try {
//                 const payload = JSON.parse(atob(token.split('.')[1]));
//                 setUser({
//                     id: payload.id,
//                     email: payload.email,
//                     role: payload.role,
//                     permissions: payload.permissions,
//                 });
//             } catch (error) {
//                 console.error('Invalid token');
//             }
//         }
//         setLoading(false);
//     }, []);
//
//     const logout = () => {
//         localStorage.removeItem('token');
//         setUser(null);
//     };
//
//     return { user, loading, logout };
// }

// import { useState, useEffect } from 'react';
// import api from '@/services/api';
//
// interface User {
//     id: number;
//     email: string;
//     role: string;
//     permissions: string[];
// }
//
// export function useAuth() {
//     const [user, setUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             try {
//                 const payload = JSON.parse(atob(token.split('.')[1]));
//                 if (payload.exp * 1000 > Date.now()) {
//                     setUser({
//                         id: payload.id,
//                         email: payload.email,
//                         role: payload.role,
//                         permissions: payload.permissions,
//                     });
//                 } else {
//                     localStorage.removeItem('token');
//                 }
//             } catch (error) {
//                 console.error('Invalid token');
//                 localStorage.removeItem('token');
//             }
//         }
//         setLoading(false);
//     }, []);
//
//     const logout = () => {
//         localStorage.removeItem('token');
//         setUser(null);
//     };
//
//     return { user, loading, logout };
// }