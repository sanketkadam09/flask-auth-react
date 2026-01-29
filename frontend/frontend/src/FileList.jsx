import { useEffect, useState } from "react";
import API from "./api"
import ImageSlider from "./ImageSlider";
import PdfSlider from "./pdfSlider";
import {jwtDecode}from "jwt-decode";

const FileList=()=>{

    const [pdfFiles,setpdfFiles]=useState([])
    const [imageFiles,setimageFiles]=useState([])
    const [role,setRole]=useState("user");


    useEffect(()=>{
      const token=localStorage.getItem("token");
      if(token){
        const decode=jwtDecode(token);
        setRole(decode.role);
      }
    },[])

    useEffect( ()=>{
    const fetch=async()=>{
      try{
      const res=await API.get("/files");
      console.log(res.data);
      const files=res.data;
      console.log(files);

      const pdfs=[];
      const images=[];

      files.forEach((file) => {
         const ext=file.filename.split(".").pop().toLowerCase()

         if(ext==="pdf"){
            pdfs.push(file.filename);
         }else if(["png","jpg","jpeg"].includes(ext)){
          images.push(file.filename);
         }
      });

      setpdfFiles(pdfs);
      setimageFiles(images);
      }catch(err){
        console.log(err);
      }
     }
    fetch()
    },[])


    const handleDelete=async(filename)=>{
         console.log(filename);
          try{
              await API.delete(`/files/${filename}`);

              setpdfFiles((prev)=>
                      prev.filter((pdf)=>pdf!==filename)
              )
              // alert("PDf deleted successfully")
          }catch(err){
            console.log(err);
          }
   }

   const handleImageDelete=async(filename)=>{
    try{
      await API.delete(`/files/${filename}`);
      setimageFiles((prev)=>
        prev.filter((image)=>image!==filename)
      )
    }catch(err){
      console.log(err);
    }
   }
  

    return (
        <>
        <h3>pdf Section</h3>
          {/* {pdfFiles.length === 0 && <p>No pdfs</p>} */}
{/*    
        {pdfFiles.map((file,index)=>(
           <p key={index}>
             <a 
             href={`http://127.0.0.1:5000/upload/${file}`}
             >{file}</a>
            
           </p>
        ))} */}

       <h3>{role=="admin"?"All Pdf":"my pdf" }</h3> 
           <PdfSlider 
         pdfs={pdfFiles}
         onDelete={handleDelete}
        />
        

       
        <h3>Image Section</h3>
          {/* {imageFiles.length === 0 && <p>No Images</p>} */}
        {/* {imageFiles.map((file,index)=>(
          <p key={index}>
            <a
            href={`http://127.0.0.1:5000/upload/${file}`} 
            >{file}</a>
          </p>
        ))} */}
          <h3>{role=="admin"?"All Images":"my Images" }</h3> 
              <ImageSlider images={imageFiles}
               onDelete={handleImageDelete}
        
        />
        
       
        
        </>
    )
}

export default FileList;