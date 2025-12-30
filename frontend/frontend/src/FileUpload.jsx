import { useState } from "react";
import API from "./api";
import FileList from "./FileList";
import { Button, TextField } from "@mui/material";

const FileUpload = () => {

  const [file, setFile] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [refreshkey,setRefreshkey]=useState(0);

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
      setFileUrl(res.data.file_url);
       setFile("");
      setRefreshkey((prev)=>prev+1)
      alert("Document uploaded successfully");
     
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    }
  };

  return (
    <>
      <TextField type="file" sx={{fontSize:"20px"}} onChange={handleChange} />
      <Button variant="contained" sx={{ml:4,fontSize:"15px"}} onClick={handleUpload}>
        Upload
      </Button>

      {/* {fileUrl && (
        <p>
          Uploaded File:{" "}
          <a href={fileUrl} target="_blank" rel="noreferrer">
            View
          </a>
        </p>
      )} */}

      <Button
        variant="contained"
        sx={{ mt: 3,ml:15 ,fontSize:"15px"}}
        onClick={() => setShowFiles(!showFiles)}
      >
        {showFiles ? "Hide Documents" : "View All Documents"}
      </Button>

      {showFiles && <FileList key={refreshkey} />}
    </>
  );
};

export default FileUpload;
