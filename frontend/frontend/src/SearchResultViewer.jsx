import { useState } from "react";
import API from "./api";
import { Box, TextField, Button, Typography } from "@mui/material";
import PDFViewer from "./PdfViewer";
import "./pdf.css";


function SearchNavigator() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [index, setIndex] = useState(0);

  const handleSearch = async () => {
    const res = await API.get(`/search?q=${query}`);
    setResults(res.data);
    setIndex(0);
  };

  const current = results[index];

  const highlight = (text, word) => {
    if (!text || !word) return text;
    const regex = new RegExp(`(${word})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <Box p={2}>
      <TextField
        fullWidth
        label="Search word"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button sx={{ mt: 1 }} variant="contained" onClick={handleSearch}>
        Search
      </Button>

   {current && (
  <>
   <PDFViewer
  fileUrl={`http://localhost:5000/upload/${current.filename}`}
  pageNumber={current.page_number}
  highlights={query} 
/>


    <Typography sx={{ mt: 2 }}>
      <strong>Matched Text:</strong>
    </Typography>
    <Typography
      dangerouslySetInnerHTML={{
        __html: highlight(current.matched_text, query),
      }}
      sx={{ background: "#f5f5f5", padding: 2 }}
    />

    <Box sx={{ mt: 2 }}>
      <Button disabled={index === 0} onClick={() => setIndex(index - 1)}>
        Previous
      </Button>
      <Button
        sx={{ ml: 2 }}
        disabled={index === results.length - 1}
        onClick={() => setIndex(index + 1)}
      >
        Next
      </Button>
    </Box>
  </>
)}

    </Box>
  );
}

export default SearchNavigator;







 {/* <iframe
            key={`${current.filename}-${current.page_number}`}
            src={`http://localhost:5000/upload/${current.filename}#page=${current.page_number}`}
            width="100%"
            height="400px"
            /> */}