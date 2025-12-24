import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "./api";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  
} from "@mui/material";

function Show() {
  const [user, setUser] = useState(null);
  const [editMode, setEditmode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return null;
  }
  const decode = jwtDecode(token);
  const isAdmin = decode.role === "admin";
  const isdemo=decode.role==="demo";
  const isSelf = decode.sub === id;

  const canEdit = isAdmin || isSelf;
  const canDelete = (isAdmin && !isSelf) || (!isAdmin && isSelf);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await API.get(`/users/${id}`);
      setUser(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setAddress(res.data.address);
    };
    fetchUser();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await API.put(`/users/${id}`, { name, email, address });
    alert("User updated successfully");
    setUser({ ...user, name, email, address });
    setEditmode(false);
    navigate(0);
  };

  const handleDelete = async () => {
    await API.delete(`/users/${id}`);
    alert("User deleted successfully");
    if(isAdmin){
          navigate("/dashboard");
          return;
    }
    navigate("/");
    
  };
  const handleCancel=async ()=>{
    navigate(-1)
  }

  if (!user) return <h3>Loading ....</h3>;

  return (
  <Box sx={{ mt: 5, display: "flex",  justifyContent: "center" }}>
    <Card sx={{ width: 350, p:5,backgroundColor:"lightgray"}}>
      <CardContent>
        <Typography variant="h4" align="center" gutterBottom>
          User Information
        </Typography>

        {!editMode && (
          <Stack spacing={2}>
            <Typography>
              <b>Name:</b> {user.name}
            </Typography>
            <Typography>
              <b>Email:</b> {user.email}
            </Typography>
            <Typography>
              <b>Address:</b> {user.address}
            </Typography>
            <Typography>
              <b>Role:</b> {user.role}
            </Typography>

            
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 2,
              }}
            >
              {canEdit && (
                <Button
                  variant="contained"
                  disabled={isdemo}
                  onClick={() => setEditmode(true)}
                >
                  Edit
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="contained"
                  disabled={isdemo}
                  color="error"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </Box>
          </Stack>
        )}

        {editMode && (
          <Stack spacing={2} component="form" onSubmit={handleUpdate}>
            <Typography variant="h6" align="center">
              Edit User
            </Typography>

            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="Name"
            />
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
            />
            <TextField
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              label="Address"
            />

            <Button type="submit" variant="contained" disabled={isdemo}>
              Update
            </Button>
             <Button onClick={handleCancel} variant="contained" disabled={isdemo}>
              Cancel
            </Button>
            
          </Stack>
        )}
      </CardContent>
    </Card>
  </Box>
);

}

export default Show;
