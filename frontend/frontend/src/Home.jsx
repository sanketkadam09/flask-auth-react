import { useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";

function Home() {
  const navigate = useNavigate();

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
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/register")}
      >
        Register
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate("/login")}
      >
        Login
      </Button>
    </Box>
  );
}

export default Home;
