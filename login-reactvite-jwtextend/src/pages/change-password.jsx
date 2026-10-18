import { useState } from "react";
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom";

function Change_Password() {

  const navigate = useNavigate();
  const { changePassword, error } = useAuth();

  const [formData, setFormData] = useState({
    oldpassword: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }


    const success = await changePassword(formData);

    if (success) {
      navigate("/");
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
        <div className="col-md-5 offset-md-4">
          <h1>Change Password</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="oldpassword" className="form-label">Current Password</label>
              <input type="password" className="form-control" id="oldpassword" value={formData.oldpassword}
                onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">New Password</label>
              <input type="password" className="form-control" id="password" value={formData.password}
                onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input type="password" className="form-control" id="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary w-100">Change</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Change_Password