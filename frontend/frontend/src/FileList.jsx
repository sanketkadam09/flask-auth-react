import { useEffect, useState } from "react";
import API from "./api"
import ImageSlider from "./ImageSlider";

const FileList=()=>{

    const [pdfFiles,setpdfFiles]=useState([])
    const [imageFiles,setimageFiles]=useState([])



    useEffect( ()=>{
    const fetch=async()=>{
      try{
      const res=await API.get("/files");
      console.log(res.data);
      const files=res.data;

      const pdfs=[];
      const images=[];

      files.forEach((file) => {
         const ext=file.split(".").pop().toLowerCase()

         if(ext==="pdf"){
            pdfs.push(file);
         }else if(["png","jpg","jpeg"].includes(ext)){
          images.push(file);
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

    return (
        <>
        <h3>pdf Section</h3>
          {/* {pdfFiles.length === 0 && <p>No pdfs</p>} */}
    {pdfFiles.length===0}
        {pdfFiles.map((file,index)=>(
           <p key={index}>
             <a 
             href={`http://127.0.0.1:5000/upload/${file}`}
             >{file}</a>
            
           </p>
        ))}
        <h3>Image Section</h3>
          {/* {imageFiles.length === 0 && <p>No Images</p>} */}
        {/* {imageFiles.map((file,index)=>(
          <p key={index}>
            <a
            href={`http://127.0.0.1:5000/upload/${file}`} 
            >{file}</a>
          </p>
        ))} */}
        <ImageSlider images={imageFiles}/>
        
        </>
    )
}

export default FileList;