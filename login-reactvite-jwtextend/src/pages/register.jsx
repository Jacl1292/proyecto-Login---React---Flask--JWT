import { useState } from "react";
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom";

function Register() {


  const navigate = useNavigate();
  const { register, error } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    lastname: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await register(formData);

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
          <h1>Register</h1>
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
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input type="text" className="form-control" id="name" value={formData.name}
                onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="lastname" className="form-label">Last Name</label>
              <input type="text" className="form-control" id="lastname" value={formData.lastname}
                onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary w-100">Register</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register