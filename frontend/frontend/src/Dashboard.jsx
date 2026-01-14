import { useEffect, useState } from "react";
import API from "./api";
import Register from "./Register";
import Login from "./Login";
import FileUpload from "./FileUpload";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { CircularProgress,  } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "./styles/dashboard.css";
import OCRSearch from "./OCRSearch";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  // Stack,
  TextField
  
} from "@mui/material";
import { blue, lightBlue } from "@mui/material/colors";

ModuleRegistry.registerModules([AllCommunityModule]);

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  // const [page,setPage]=useState(1);
  // const [totalpages,setTotalPages]=useState(1);
  const [search,setSearch]=useState("");
  const [debounceSearch,setDebounceSearch]=useState("");
  const [loading,setLoading]=useState(false);
  const [currentUser,setCurrentUser]=useState(null);
  const [isLoggedin, setIsLoggedin] = useState(false);
  const navigate = useNavigate();
  const [gridApi,setgridApi]=useState(null);


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
      setCurrentUser({
        id:decode.sub,
        role:decode.role
      });
      fetchUsers(debounceSearch);
    }
  }, [debounceSearch]);

  const fetchUsers = async (searchText="") => {
    setLoading(true);
    try{
    
    const res = await API.get(`/users?&search=${searchText}`);
    setUsers(res.data.users);
    // setTotalPages(res.data.total_pages);
    }catch(err){
      console.log(err);
    }
    setLoading(false);


  };

  const handleDelete = async (id) => {
  const confirmDelete = window.confirm("User:Are you sure you want to delete?");
  if (!confirmDelete) return;

  try {
    
    await API.delete(`/users/${id}`);
    alert("User deleted successfully");
 
    if(currentUser.role!=="admin"){
      navigate("/register");
    }
    // reload current page
    fetchUsers( debounceSearch);
    

  } catch (error) {
    console.error(error);
    alert("Failed to delete user");
  }
};

const handleBulkdelete=async()=>{

  if(!gridApi) return;
  const selectedRows=gridApi.getSelectedRows();
  console.log(selectedRows)

  if(selectedRows.length===0){
    alert("Please select atleast one row");
    return ;

  }
  
     try{
    const ids=selectedRows.map((row)=>row.id);

    for(let id of ids){
      await API.delete(`/users/${id}`);

    }

    setUsers((prev)=>prev.filter((user)=>!ids.includes(user.id)));
    gridApi.deselectAll();
    alert("all selected are deleted successfully");
  }catch(err){
    console.log(err);
}
  }




  const handleUpdate = async (params) => {
  const { id,name, address } = params.data;
      const {currentUserId,isAdmin}=params.context;
    const isSelf=params.data.id===Number(currentUserId);

    if(!isAdmin && !isSelf){
      alert("You are not authorized user for update this");
      return;
    }

  try {
    
    await API.put(`/users/${id}`, {
      name,
      address
    });

    alert("User updated successfully");
  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};



  const handleLogOut = async () => {
    localStorage.removeItem("token");
    setIsLoggedin(false);
    setUsers([]);
    alert("User logged out");
    navigate("/");
  };

  const DeleteButtonRenderer = (params) => {
    const {currentUserId,isAdmin}=params.context;
    const isSelf=params.data.id===Number(currentUserId);

            if(!isAdmin && !isSelf)return null;
          return (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleDelete(params.data.id)}
            >
              Delete
            </Button>
          );
        };

    const columnDefs = [
    { field: "name",
      flex:1 ,
      headerName:"Full Name",
       sortable:true,
       filter:true,
      //  hide: window.innerWidth < 768?false:false,
       floatingFilter:true,
       checkboxSelection:(params)=>params.context.isAdmin,
       editable:(params)=>params.context.isAdmin || params.data.id===Number(params.context.currentUserId)
      },

    { field: "email",
      flex:1,
      headerName:"Email-Address",
      sortable:true,
      // hide: window.innerWidth < 768,
      filter:true,
      floatingFilter:true
     },

    { field: "role",
      flex:1,
      headerName:"Role",
      // hide: window.innerWidth < 768,
      sortable:true,
      filter:true,
      floatingFilter:true 
    },

    { field: "address",
      flex:1,
      headerName:"Address",
      
      sortable:true,
      filter:true,
      floatingFilter:true,
      editable:(params)=>params.context.isAdmin || params.data.id===Number(params.context.currentUserId)
    },
    
  {
    headerName: "Actions",
    field: "actions",
    cellRenderer: DeleteButtonRenderer,
    
    filter: false,
    sortable: false
  }
 
  ];

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
        {/* <div></div> */}
        <Box className="dashboard-header">
  <Typography variant="h3" color="primary" className="welcome-text">
    Welcome {username}
  </Typography>

  <Button
    variant="contained"
    color="error"
    className="logout-btn mt-3"
    onClick={handleLogOut}
  >
    Log Out
  </Button>
</Box>

      <Box className="search-sticky">
     <Box className="search-box px-3" style={{borderRadius:"50px"}}>
  <TextField
    label="Search based on role or name or address"
    variant="outlined"
    fullWidth
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</Box>
</Box> 

     <Box className="upload-section px-3">
        <Card elevation={3}>
          <CardContent>
            <Typography variant="" align="center" gutterBottom>
              Upload Document
            </Typography>
             <OCRSearch/>
            <FileUpload />
           
          </CardContent>
        </Card>
      </Box>

       {loading ?(
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
    <CircularProgress />
  </Box>
       ):(
       <>
       <Typography variant="h3" align="center"sx={{marginTop:4,color:lightBlue[400]}}>User List</Typography>
          <hr></hr>
       

         <Box className="grid-wrapper">
  {currentUser?.role === "admin" && (
    <Box className="mb-3">
      <Button variant="contained" color="error" onClick={handleBulkdelete}>
        Delete all selected users
      </Button>
    </Box>
  )}

  <Box
    className="ag-theme-alpine grid-container"
    // style={{ height: "450px", width: "100%" }}
  >
    <AgGridReact
      rowData={users}
      columnDefs={columnDefs}
      context={{
        currentUserId: currentUser?.id,
        isAdmin: currentUser?.role === "admin",
      }}
      onGridReady={(params) => setgridApi(params.api)}
      onCellValueChanged={handleUpdate}
      rowSelection="multiple"
      theme="alpine"
      pagination={true}
      paginationPageSize={5}
      paginationPageSizeSelector={[5, 10, 15, 20, 25]}
    />

    
  </Box>
</Box>
  </>
       )}

          {Array.isArray(users)&& users.length===0 && !loading &&(
            <Typography variant="h5" color="error" align="center">
              User Not Found
            </Typography>
          )}

        </>
      
      )}
       
      <hr />
    </Box>
  );
}

export default Dashboard;






{/* 
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
          </Box> */}