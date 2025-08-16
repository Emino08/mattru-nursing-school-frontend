import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '@/services/api';

export interface User {
    id: number;
    email: string;
    role: string;
    permissions: string[];
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
}

interface AuthContextType extends AuthState {
    login: (token: string) => Promise<User>;
    logout: () => void;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true,
};

type AuthAction =
    | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                loading: false,
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loading: false,
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
            };
        default:
            return state;
    }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Wrap logout in useCallback to prevent dependency issues
    const logout = useCallback(() => {
        try {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            dispatch({ type: 'LOGOUT' });
        } catch (error) {
            console.error('Error during logout:', error);
            dispatch({ type: 'LOGOUT' }); // Still dispatch logout even if localStorage fails
        }
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
            }

            // Validate token structure
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error('Invalid token format');
                logout();
                return;
            }

            // Parse and validate token payload
            const payload = JSON.parse(atob(tokenParts[1]));

            // Check if token has expired
            if (!payload.exp || payload.exp * 1000 <= Date.now()) {
                console.log('Token has expired');
                logout();
                return;
            }

            // Validate required fields
            if (!payload.id || !payload.email || !payload.role) {
                console.error('Token missing required fields');
                logout();
                return;
            }

            // Set up API authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Create user object
            const user: User = {
                id: payload.id,
                email: payload.email,
                role: payload.role,
                permissions: payload.permissions || [],
            };

            dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });

        } catch (error) {
            console.error('Error during auth check:', error);
            logout();
        }
    }, [logout]);

    // Check auth on component mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (token: string): Promise<User> => {
        try {
            // Validate token before processing
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Invalid token format');
            }

            // Parse token payload
            const payload = JSON.parse(atob(tokenParts[1]));

            // Validate required fields
            if (!payload.id || !payload.email || !payload.role) {
                throw new Error('Token missing required fields');
            }

            // Check if token is expired
            if (!payload.exp || payload.exp * 1000 <= Date.now()) {
                throw new Error('Token has expired');
            }

            // Store token and set up API
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Create user object
            const user: User = {
                id: payload.id,
                email: payload.email,
                role: payload.role,
                permissions: payload.permissions || [],
            };

            // Dispatch the login success
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });

            console.log('Login successful, user authenticated:', user);

            // Return the user object so the calling component knows login succeeded
            return user;

        } catch (error) {
            console.error('Error during login:', error);
            // Clean up on error
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            throw error; // Re-throw so the login component can handle it
        }
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};