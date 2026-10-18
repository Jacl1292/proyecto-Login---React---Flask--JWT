import { createContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
    const [error, setError] = useState("");
    const path = "http://localhost:5000";

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await fetch(path + "/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (!active || localStorage.getItem("token") !== token) return;
                if (!response.ok) {
                    if (response.status === 401 || response.status === 422) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setUser(null);
                    }
                    setError(data.msg || "No se pudo verificar la sesión");
                    return;
                }
                setUser(data);
                localStorage.setItem("user", JSON.stringify(data));
            } catch {
                if (active) setError("No se pudo conectar con el servidor");
            } finally {
                if (active) setLoading(false);
            }
        };

        restoreSession();
        window.addEventListener("focus", restoreSession);
        return () => {
            active = false;
            window.removeEventListener("focus", restoreSession);
        };
    }, []);


    const login = async (credentials) => {
        try {

            setError("");

            const response = await fetch(path + "/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || "Error al iniciar sesion");
            }


            setUser(data.user);
            localStorage.setItem("token", data.acces_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            return true;

        } catch (error) {
            console.error(error.message);
            setError(error.message);
            return false;
        }
    };


    const logout = () => {
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
};
const register = async (credentials) => {

    setError(null);

    try {

        const response = await fetch(
            path +"/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setError(data.msg);
            return false;
        }

        return true;

    } catch {

        setError("Server error");
        return false;
    }
};

    const changePassword = async (credentials) => {

    setError(null);

    try {

        const token = localStorage.getItem("token");
        const response = await fetch(
            path +"/change-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(credentials)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setError(data.msg);
            return false;
        }

        return true;

    } catch {

        setError("Server error");
        return false;
    }
};

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                error,
                logout,
                changePassword,
                register,
            }}
        >
            {children}

            </AuthContext.Provider>
    );
}
