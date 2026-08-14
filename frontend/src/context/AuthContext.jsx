import React, { createContext, useState, useEffect, useContext } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signIn, signOut, signUp, confirmSignUp, getCurrentUser, resetPassword, confirmResetPassword } from 'aws-amplify/auth';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_CLIENT_ID,
        }
    }
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                const session = await fetchAuthSession();
                const groups = session.tokens.accessToken.payload['cognito:groups'] || [];
                const role = groups.includes('ADMIN') ? 'ADMIN' : (groups.includes('EDITOR') ? 'EDITOR' : 'VIEWER');

                setUser({
                    name: session.tokens.idToken.payload.name || currentUser.signInDetails?.loginId || currentUser.username,
                    email: currentUser.signInDetails?.loginId || currentUser.username,
                    role,
                    groups,
                    token: session.tokens.idToken.toString()
                });
            } catch (err) {
                console.log("No existing session directly found.");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        // Aggressively destroy any zombie sessions clinging to local storage
        try { await signOut(); } catch (e) { }

        const { isSignedIn, nextStep } = await signIn({ username: email, password });

        if (!isSignedIn) {
            throw new Error(`Login incomplete: Account may need verification (${nextStep?.signInStep || 'Unknown'})`);
        }

        // Immediately fetch explicit session to get groups properly
        const session = await fetchAuthSession();
        if (!session.tokens) {
            throw new Error("Session established but tokens are missing.");
        }

        const groups = session.tokens.accessToken.payload['cognito:groups'] || [];
        const role = groups.includes('ADMIN') ? 'ADMIN' : (groups.includes('EDITOR') ? 'EDITOR' : 'VIEWER');

        setUser({
            name: session.tokens.idToken.payload.name || email,
            email,
            role,
            groups,
            token: session.tokens.idToken.toString()
        });
    };

    const register = async (name, email, password) => {
        await signUp({
            username: email,
            password,
            options: { userAttributes: { email, name } }
        });
        return true;
    };

    const verifyOtp = async (email, code) => {
        const { isSignUpComplete } = await confirmSignUp({ username: email, confirmationCode: code });
        return isSignUpComplete;
    };

    const sendPasswordReset = async (email) => {
        await resetPassword({ username: email });
        return true;
    };

    const confirmPasswordResetCode = async (email, confirmationCode, newPassword) => {
        await confirmResetPassword({ username: email, confirmationCode, newPassword });
        return true;
    };

    const logout = async () => {
        await signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, sendPasswordReset, confirmPasswordResetCode, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
