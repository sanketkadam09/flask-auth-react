import { useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";
import { useState } from "react";
import API from "./api"

function Home() {
  const navigate = useNavigate();
  const [isLoggedin,setIsLoggedin]=useState(false);

   const handleDemoLogin=async (e)=>{
    e.preventDefault();
    const email="demo@test.com";
    const password="123456";
    const res=await API.post("/login",{email,password});
    localStorage.setItem("token",res.data.token);
    setIsLoggedin(true);
    alert(("Demo user Logged in Successfully"));
    navigate("/dashboard");
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap:2
      }}
    >
      <Typography sx={{fontSize:"100px"}} variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>

      <Box sx={{ml:1}}>
        <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/register")}
        sx={{mr:1}}
      >
        Register
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate("/login")}
        sx={{ml:1}}
      >
        Login
      </Button>

    
        <Button variant="contained" color="secondary" sx={{ml:2}} onClick={handleDemoLogin}>Login With Demo</Button>
      </Box>

      
    </Box>
  );
}

export default Home;
