import { useState } from "react";
import API from "./api";
import { useNavigate } from "react-router-dom";
import {Box,TextField,Typography,Button} from "@mui/material"

function Login({ setIsLoggedin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setIsLoggedin(true);
      alert("User logged in successfully");
      navigate("/dashboard");
    } catch(err){
      console.log(err);
      alert("User not logged in");
    }
  };

  return (
    <Box
    sx={{
    width:500,
    mx:"auto",
    mt:10,
    display:"flex",
    flexDirection:"column"
    }}
    >
      <Typography variant="h2" align="center">Login</Typography>
      <br></br>
      <form onSubmit={handleLogin}>
        <TextField 
        label="Enter your email" 
        value={email} 
        fullWidth
        onChange={(e) => setEmail(e.target.value)}
         />
         <br></br><br></br>
        <TextField
          label=" password"
          type="password"
          value={password}
          fullWidth
          onChange={(e) => setPassword(e.target.value)}
        />
        <br></br><br></br>
        <Button type="submit" variant="contained" color="primary" sx={{width:"100%"}}>Login</Button>
      </form>
    </Box>
  );
}

export default Login;
