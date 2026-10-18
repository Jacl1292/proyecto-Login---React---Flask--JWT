import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

const path = "http://localhost:5000";

function Users() {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const loadUsers = async () => {
            try {
                const response = await fetch(path + "/users", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    signal: controller.signal,
                });
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 403) setForbidden(true);
                    throw new Error(data.msg || "No se pudieron cargar los usuarios");
                }
                setUsers(data);
                setRoles(Object.fromEntries(data.map((account) => [account.id, account.role])));
            } catch (error) {
                if (!controller.signal.aborted) setError(error.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        loadUsers();
        return () => controller.abort();
    }, []);

    const saveRole = async (account) => {
        setSaving(account.id);
        setError("");
        setMessage("");
        try {
            const response = await fetch(`${path}/users/${account.id}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ role: roles[account.id] }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 422) logout();
                if (response.status === 403) setForbidden(true);
                throw new Error(data.msg || "No se pudo actualizar el rol");
            }
            setUsers((current) => current.map((item) => item.id === data.id ? data : item));
            setRoles((current) => ({ ...current, [data.id]: data.role }));
            setMessage(`Rol de ${data.username} actualizado correctamente.`);
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(null);
        }
    };

    const deleteAccount = async (account) => {
        if (account.id === user.id || saving !== null || deleting !== null) return;
        if (!window.confirm(`¿Eliminar la cuenta de ${account.username}? Esta acción es permanente y no se puede deshacer.`)) return;

        setDeleting(account.id);
        setError("");
        setMessage("");
        try {
            const response = await fetch(`${path}/users/${account.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) {
                const data = await response.json();
                if (response.status === 401 || response.status === 422) logout();
                if (response.status === 403) setForbidden(true);
                throw new Error(data.msg || "No se pudo eliminar la cuenta");
            }
            setUsers((current) => current.filter((item) => item.id !== account.id));
            setRoles((current) => {
                const next = { ...current };
                delete next[account.id];
                return next;
            });
            setMessage(`Cuenta de ${account.username} eliminada correctamente.`);
        } catch (error) {
            setError(error.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="container py-4">
            <h1>Administrar usuarios</h1>
            <p>Las cuentas nuevas reciben el rol Usuario. Aquí puedes asignar permisos de administrador y eliminar cuentas.</p>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {message && <div className="alert alert-success" role="status">{message}</div>}
            {loading ? <p role="status">Cargando usuarios...</p> : !forbidden && (
                <div className="table-responsive">
                    <table className="table align-middle">
                        <thead>
                            <tr><th scope="col">Usuario</th><th scope="col">Nombre</th><th scope="col">Rol</th><th scope="col">Acciones</th></tr>
                        </thead>
                        <tbody>
                            {users.map((account) => (
                                <tr key={account.id}>
                                    <td>{account.username}{account.id === user.id && " (tú)"}</td>
                                    <td>{account.name} {account.lastname}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            aria-label={`Rol de ${account.username}`}
                                            value={roles[account.id]}
                                            disabled={account.id === user.id || saving !== null || deleting !== null}
                                            onChange={(event) => setRoles({ ...roles, [account.id]: event.target.value })}
                                        >
                                            <option value="user">Usuario</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-primary"
                                            disabled={account.id === user.id || saving !== null || deleting !== null || roles[account.id] === account.role}
                                            onClick={() => saveRole(account)}
                                        >
                                            {saving === account.id ? "Guardando..." : "Guardar"}
                                        </button>
                                        <button
                                            className="btn btn-outline-danger ms-2"
                                            aria-label={`Eliminar cuenta de ${account.username}`}
                                            disabled={account.id === user.id || saving !== null || deleting !== null}
                                            onClick={() => deleteAccount(account)}
                                        >
                                            {deleting === account.id ? "Eliminando..." : "Eliminar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="4">No hay usuarios para mostrar.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="text-body-secondary">No puedes quitarte tu propio rol de administrador ni eliminar tu propia cuenta.</p>
        </div>
    );
}

export default Users;
