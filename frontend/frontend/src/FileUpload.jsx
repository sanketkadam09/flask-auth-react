import { useState,useRef } from "react";
import API from "./api";
import FileList from "./FileList";
import { Box, Button, TextField } from "@mui/material";

const FileUpload = () => {

  const [file, setFile] = useState("");
  // const [fileUrl, setFileUrl] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [refreshkey,setRefreshkey]=useState(0);

  const fileInputRef=useRef(null);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/upload", formData);
      // setFileUrl(res.data.file_url);
     console.log(res)
      setRefreshkey((prev)=>prev+1)
      alert("Document uploaded successfully");
       fileInputRef.current.value="";
       setFile("");
     
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    }
  };

 return (
  <Box className="file-upload-wrapper">
    
    <Box className="file-upload-row">
      <TextField
        type="file"
        inputRef={fileInputRef}
        onChange={handleChange}
        fullWidth
      />

      <Button
        variant="contained"
        className="upload-btn"
        onClick={handleUpload}
      >
        Upload
      </Button>
    </Box>

    <Button
      variant="outlined"
      className="view-files-btn"
      onClick={() => setShowFiles(!showFiles)}
    >
      {showFiles ? "Hide Documents" : "View All Documents"}
    </Button>

    {showFiles && <FileList key={refreshkey} />}
  </Box>
);

};

export default FileUpload;
