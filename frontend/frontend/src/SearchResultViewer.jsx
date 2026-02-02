import { useState, useRef, useEffect } from "react";
import API from "./api";
import { Box, TextField, Button, Typography } from "@mui/material";
import PDFViewer from "./PdfViewer";
import "./pdf.css";

function SearchNavigator() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [index, setIndex] = useState(0);
  const [wordBoxes, setWordBoxes] = useState([]);

  const resultTopRef = useRef(null);

  const isPDF = (filename) => /\.pdf$/i.test(filename);
  const isImage = (filename) => /\.(jpg|jpeg|png)$/i.test(filename);

  // ================= HIGHLIGHT FUNCTION =================
  const highlight = (text, word) => {
    if (!text || !word) return text;
    const regex = new RegExp(`(${word})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  // ================= HANDLE SEARCH =================
  const handleSearch = async () => {
    const trimmedQuery = query.trim();

    // Clear results if query is empty
    if (!trimmedQuery) {
      setResults([]);
      setIndex(0);
      setWordBoxes([]);
      return;
    }

    try {
      const res = await API.get(`/search?q=${trimmedQuery}`);
      setResults(res.data || []);
      setIndex(0);
      setWordBoxes([]); // Reset OCR boxes
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      setIndex(0);
      setWordBoxes([]);
    }
  };

  // ================= AUTO SCROLL WHEN RESULT CHANGES =================
  useEffect(() => {
    if (resultTopRef.current) {
      resultTopRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [index]);

  // ================= CLEAR RESULTS WHEN INPUT CLEARED =================
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIndex(0);
      setWordBoxes([]);
    }
  }, [query]);

  const current = results[index];

  return (
    <Box p={2}>
      {/* ================= SEARCH INPUT ================= */}
      <TextField
        fullWidth
        label="Search word"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Button
        sx={{ mt: 1 }}
        variant="contained"
        onClick={handleSearch}
        disabled={!query.trim()}
      >
        Search
      </Button>

      {/* ================= RESULTS ================= */}
      {query.trim() && results.length > 0 && current && (
        <Box ref={resultTopRef} sx={{ mt: 3 }}>
          {/* ================= PDF VIEW ================= */}
          {isPDF(current.filename) && (
            <PDFViewer
              fileUrl={`http://localhost:5000/upload/${current.filename}`}
              pageNumber={current.page_number}
              highlights={query}
            />
          )}

          {/* ================= IMAGE VIEW ================= */}
          {isImage(current.filename) && (
            <Box
              sx={{
                mt: 2,
                position: "relative",
                display: "inline-block",
                border: "2px solid #a2c463",
              }}
            >
              <img
                src={`http://localhost:5000/upload/${current.filename}`}
                alt="Uploaded"
                style={{ maxWidth: "100%", maxHeight: "500px" }}
              />

              {/* OCR HIGHLIGHT BOXES */}
              {wordBoxes
                .filter((w) =>
                  w.text.toLowerCase().includes(query.toLowerCase())
                )
                .map((word, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: "absolute",
                      left: `${word.x}px`,
                      top: `${word.y}px`,
                      width: `${word.w}px`,
                      height: `${word.h}px`,
                      border: "2px solid red",
                      backgroundColor: "rgba(169, 205, 109, 0.2) !important ",
                      pointerEvents: "none",
                    }}
                  />
                ))}
            </Box>
          )}

          {/* ================= MATCHED TEXT ================= */}
          {/* <Typography sx={{ mt: 2 }}>
            <strong>Matched Text:</strong>
          </Typography>

          <Typography
            dangerouslySetInnerHTML={{
              __html: highlight(current.matched_text, query),
            }}
            sx={{ background: "#f5f5f5", padding: 2 }}
          /> */}

          {/* ================= NAVIGATION ================= */}
          <Box sx={{ mt: 2 }}>
            <Button
              disabled={index === 0}
              onClick={() => setIndex((prev) => prev - 1)}
            >
              Previous
            </Button>

            <Button
              sx={{ ml: 2 }}
              disabled={index === results.length - 1}
              onClick={() => setIndex((prev) => prev + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default SearchNavigator;
