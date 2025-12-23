import { useEffect, useState } from "react";
import API from "./api";
import Register from "./Register";
import Login from "./Login";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField
  
} from "@mui/material";

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [page,setPage]=useState(1);
  const [totalpages,setTotalPages]=useState(1);
  const [search,setSearch]=useState("");
  const [debounceSearch,setDebounceSearch]=useState("");
  const [loading,setLoading]=useState(false);

  const [isLoggedin, setIsLoggedin] = useState(false);
  const navigate = useNavigate();

  useEffect(()=>{
    setLoading(true)
    const handleSearch=setTimeout(()=>{
      setDebounceSearch(search);
    },1000)

    return ()=>{
      clearTimeout(handleSearch);
    }
  },[search])

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decode = jwtDecode(token);
      setIsLoggedin(true);
      setUsername(decode.name);
      fetchUsers(page,debounceSearch);
    }
  }, [page,debounceSearch]);

  const fetchUsers = async (pageNumber=1,searchText="") => {
    try{
    setLoading(true);
    const res = await API.get(`/users?page=${pageNumber}&limit=5&search=${searchText}`);
    setUsers(res.data.users);
    setTotalPages(res.data.total_pages);
    }catch(err){
      console.log(err);
    }
    setLoading(false);


  };

  const handleLogOut = async () => {
    localStorage.removeItem("token");
    setIsLoggedin(false);
    setUsers([]);
    alert("User logged out");
    navigate("/");
  };

  return (
    <Box>
      {!isLoggedin && (
        <Box>
          <Register setIsLoggedin={setIsLoggedin} />
          <Login setIsLoggedin={setIsLoggedin} />
        </Box>
      )}
      {isLoggedin && (
        <>
         <Box 
         sx={{
            width:500,
            mx:"auto",
            mt:10,
            display:"flex",
            flexDirection:"column",
            textAlign:'center',
            gap:2
          }}
        >
          <Typography variant="h3" align="center" color="primary">Welcome {username}</Typography>

          <Button 
          variant="contained"
          color="error"
        
          sx={{width:"30%", ml:22,mt:2}}
           onClick={handleLogOut}>Log Out</Button>
           </Box>
       
       <Box sx={{
        maxWidth:"650px",
        margin:"auto",
        mt:4

       }}
       >
        <TextField
        label="Search based on role or name or address"
        variant="outlined"
        fullWidth
        value={search}
        onChange={(e)=>
          {
            setSearch(e.target.value);
            setPage(1);

          }}
          
        />
       </Box>

       {loading ?(
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
    <CircularProgress />
  </Box>
       ):(
       <>
       <Typography variant="h3" align="center" sx={{mt:3}}>User List</Typography>
          <hr></hr>
          <Stack spacing={4} sx={{maxWidth:"650px" ,mx:"auto"}}>
            
               {Array.isArray(users) &&
            users.map((u) => (
              <Card key={u.id} sx={{backgroundColor:"lightgray"}}>
                <CardContent>
                  <Typography variant="h4"> Name: {u.name} </Typography>
                  <Typography variant="h5"> Role:  {u.role}</Typography>
                
                <Typography variant="h6">Address: {u.address}</Typography>
                <Button variant="contained" onClick={() => navigate(`/users/${u.id}`)}>View</Button>
                </CardContent>
              </Card>
            ))}

          </Stack>
          </>
       )}

          {Array.isArray(users)&& users.length===0 && !loading &&(
            <Typography variant="h5" color="error" align="center">
              User Not Found
            </Typography>
          )}

          <Box sx={{
            display:"flex",
            justifyContent:"center",
            mt:4,
            gap:2

          }}>
            <Button variant="contained"
           disabled={page===1||loading}
           onClick={()=>setPage(page-1)}>
            previous
            </Button>
          <Typography variant="h5" sx={{display:"flex", alignItems:"center"}}>
            page {page} of {totalpages}
            </Typography>
            
          <Button variant="contained"
          disabled={page===totalpages || loading}
           onClick={()=>setPage(page+1)}>
            Next
            </Button>
          </Box>
        </>
      
      )}
       
      <hr />
    </Box>
  );
}

export default Dashboard;
