import { createContext, useState, PropsWithChildren, useContext } from "react";
import { UserPublic } from "@micio/shared";

type AuthContextType = {
    accessToken: string | null;
    user: UserPublic | null;
    login: (token: string, userData: UserPublic) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider( { children }: PropsWithChildren) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserPublic | null>(null);

    const login = (token: string, userData: UserPublic) => {
        setAccessToken(token);
        setUser(userData);
    }

    const logout = () => {
        setAccessToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ accessToken, user, login, logout }}>
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