import { useState } from "react";
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();
  const { login, error } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await login(formData);

    if (success){
      navigate("/")
    }
  };

  return (
    <div className="container">
      {
        error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <strong>Error:</strong> {error}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )
      }
      <div className="row">
        <div className="col-md-4 offset-md-4">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input type="text" className="form-control" id="username" value={formData.username}
                onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" className="form-control" id="password" value={formData.password}
                onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login