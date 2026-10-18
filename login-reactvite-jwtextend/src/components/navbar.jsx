import { Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"


function Navbar() {

    const { user, logout } = useAuth();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">My App</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        {user?.role === "admin" && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/users">Administrar usuarios</Link>
                            </li>
                        )}
                    </ul>
                    <form className="d-flex me-2" role="search">
                        <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                        <button className="btn btn-outline-success" type="submit">Search</button>
                    </form>
                    <ul className="navbar-nav mb-2 mb-lg-0">

                        <li className="nav-item dropdown">
                            <Link
                                className="nav-link dropdown-toggle"
                                to="#"
                                role="button"
                                data-bs-toggle="dropdown"
                            >
                                {user ? user.username : "Username"}
                                {user && (
                                    <span className="badge bg-secondary ms-2">
                                        {user.role === "admin" ? "Administrador" : "Usuario"}
                                    </span>
                                )}
                            </Link>

                            <ul className="dropdown-menu dropdown-menu-end">

                                {!user ? (
                                    <>
                                        <li >
                                            <Link className="dropdown-item" to="/login">
                                                Login
                                            </Link>
                                        </li>

                                        <li><hr className="dropdown-divider" /></li>

                                        <li>
                                            <Link className="dropdown-item" to="/register">
                                                Register
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <Link className="dropdown-item" to="/change-password">
                                                Change Password
                                            </Link>
                                        </li>

                                        <li><hr className="dropdown-divider" /></li>

                                        <li>
                                            <Link className="dropdown-item " onClick={logout} to="/login">
                                                Logout
                                            </Link>
                                        </li>
                                    </>
                                )}

                            </ul>
                        </li>

                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
