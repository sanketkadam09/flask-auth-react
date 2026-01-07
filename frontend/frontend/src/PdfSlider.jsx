import { useState } from "react";
import { Button, Box } from "@mui/material";
// import API from "./api"
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';


const PdfSlider=({pdfs,onDelete})=>{
       
    const [currentPdf,setCurrentPdf]=useState(0);

    if (!pdfs || pdfs.length === 0) {
    return <p>No pdfs available</p>;
  }

    const PrevPdf=()=>{
        setCurrentPdf((prev)=>
          prev===0?pdfs.length-1:prev-1
        )
    }

    const NextPdf=()=>{
        setCurrentPdf((prev)=>
           prev===pdfs.length-1?0:prev+1
        )
    }

    const handleDelete= ()=>{
    //    await  API.delete(`files/${pdfs[currentPdf]}`)
         const fileDelete=pdfs[currentPdf];
         onDelete(fileDelete);
      

        if(currentPdf>0){
            setCurrentPdf(currentPdf-1);
        }
    }

    return(
        <Box sx={{ textAlign: "center", mt: 2 }}>
             <iframe src={`http://127.0.0.1:5000/upload/${pdfs[currentPdf]}`} width="500" height={550} style={{ borderRadius: "10px" }} />


         <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
               
        <Button variant="contained" onClick={PrevPdf} >
            Prev
        </Button>

    
        <Button variant="contained" onClick={NextPdf} >Next</Button>
        <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        

         </Box>
        </Box>
    )
}

export default PdfSlider;