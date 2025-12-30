import { useState } from "react";
import { Button, Box } from "@mui/material";
import API from "./api"

const ImageSlider = ({ images }) => {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return <p>No images available</p>;
  }

  const nextImage = () => {
    setCurrent((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrent((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const  handleDelete=async (e)=>{
    console.log("Document deleted")
    await API.delete(`/files/${images[current]}`)
    
  }

  return (
    <Box sx={{ textAlign: "center", mt: 2 }}>
      <img
        src={`http://127.0.0.1:5000/upload/${images[current]}`}
        
        width="300"
        height={350}
        style={{ borderRadius: "8px" }}
      />

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
        <Button variant="outlined" onClick={prevImage}>
           Previous
        </Button>
        <Button variant="outlined" onClick={nextImage}>
          Next 
        </Button>

        <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
      </Box>
    </Box>
  );
};

export default ImageSlider;
