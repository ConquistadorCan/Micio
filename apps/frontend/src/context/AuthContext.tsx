import { createContext, useState, useEffect, PropsWithChildren, useContext } from "react";
import { UserPublic } from "@micio/shared";
import { decodeJwt } from "@/utils/jwt";

const BASE_URL = import.meta.env.VITE_API_URL;

type AuthContextType = {
    accessToken: string | null;
    user: UserPublic | null;
    isInitializing: boolean;
    login: (token: string, userData: UserPublic) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: PropsWithChildren) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserPublic | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        async function silentRefresh() {
            try {
                const response = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (response.ok) {
                    const { accessToken: newToken } = await response.json();
                    setAccessToken(newToken);
                    setUser(decodeJwt<UserPublic>(newToken));
                }
            } catch {
            } finally {
                setIsInitializing(false);
            }
        }
        silentRefresh();
    }, []);

    const login = (token: string, userData: UserPublic) => {
        setAccessToken(token);
        setUser(userData);
    }

    const logout = () => {
        setAccessToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ accessToken, user, isInitializing, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export { AuthProvider };
