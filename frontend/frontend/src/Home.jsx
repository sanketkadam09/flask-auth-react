import './Home.css';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "./api";

function Home() {
  const navigate = useNavigate();
  const [isLoggedin, setIsLoggedin] = useState(false);

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    const email = "demo@test.com";
    const password = "123456";
    const res = await API.post("/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setIsLoggedin(true);
    alert("Demo user Logged in Successfully");
    navigate("/dashboard");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-heading">Welcome</h1>
        <p className="home-subheading">Login or create an account to explore your dashboard</p>

        <div className="home-buttons">
          <button className="home-btn home-btn-primary" onClick={() => navigate("/register")}>Register</button>
          <button className="home-btn home-btn-outline" onClick={() => navigate("/login")}>Login</button>
        </div>

        <button className="home-btn home-btn-demo" style={{ marginTop: '12px' }} onClick={handleDemoLogin}>
          Login With Demo
        </button>
      </div>
    </div>
  );
}

export default Home;
