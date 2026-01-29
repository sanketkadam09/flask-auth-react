import { useEffect, useState } from "react";
import API from "./api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
} from "@mui/material";

function OCRSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // ---------------- Debounce search ----------------
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query) fetchResults(query);
      else setResults([]);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  // ---------------- Fetch results from backend ----------------
  const fetchResults = async (searchText) => {
    try {
      const res = await API.get(`/search?q=${searchText}`);
      setResults(res.data);
    } catch (err) {
      console.log(err);
      setResults([]);
    }
  };

  // ---------------- Highlight matched keywords ----------------
  const highlightText = (text, keyword) => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.replace(regex, "<mark style='background-color: #ffd54f'>$1</mark>");
  };

  return (
    <Box className="ocr-search-section px-3 mt-4">
      {/* Search Card */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Uploaded Documents
          </Typography>
          <TextField
            label="Search documents (name, email, phone, skill...)"
            variant="outlined"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Grid container spacing={2}>
          {results.map((res, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    File: {res.filename} | Page: {res.page_number}
                  </Typography>

                  {res.matched_text && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                      dangerouslySetInnerHTML={{
                        __html: highlightText(res.matched_text, query),
                      }}
                    />
                  )}

                  {/* {res.meta_info && (
                    <Typography variant="caption" display="block" color="textSecondary" mt={1}>
                      {JSON.stringify(res.meta_info)}
                    </Typography>
                  )} */}

                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    fullWidth
                    onClick={() => {
                      const pdfUrl = `http://localhost:5000/upload/${res.filename}#page=${res.page_number}`;
                      window.open(pdfUrl, "_blank");
                    }}
                  >
                    View File
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* No results message */}
      {results.length === 0 && query && (
        <Typography variant="body2" color="error" align="center" mt={2}>
          No results found
        </Typography>
      )}
    </Box>
  );
}

export default OCRSearch;
