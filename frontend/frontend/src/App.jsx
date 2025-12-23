import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./Home"
import Show from "./Show";
import Register from "./Register";
import Login from "./Login";
import Dashboard from "./Dashboard";



function App(){
  const [isLoggedin, setIsLoggedin] = useState(false);
  return (
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/register" element={<Register/>}/>
        <Route path="/login" element={<Login setIsLoggedin={setIsLoggedin} />} />
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/users/:id" element={<Show/>}/>
    </Routes>
  )
}
export default App;