import { useEffect, useState } from "react";
import API from "./api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <Box className="ocr-search-section px-3 mt-4">
      {/* Search Card */}
      <Card elevation={3}>
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
        <Box className="ocr-results mt-3 px-3">
          <Typography variant="h6">Search Results</Typography>
          <Box>
            {results.map((res, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  {/* Header row with View button */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle1">
                      <strong>File:</strong> {res.filename} |{" "}
                      <strong>Page:</strong> {res.page}
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        minWidth: "auto",
                        ml:6,
                        padding: "5px 2px",
                        fontSize: "10px",
                        lineHeight: 1,
                      }}
                      onClick={() => {
                        const pdfUrl = `http://localhost:5000/upload/${res.filename}#page=${res.page}`;
                        window.open(pdfUrl, "_blank");
                      }}
                    >
                      View
                    </Button>
                  </Box>

                  {/* Extracted info */}
                  {res.extracted_info && (
                    <Box mt={1}>
                      {res.extracted_info.name && (
                        <Typography
                          dangerouslySetInnerHTML={{
                            __html: `<strong>Name:</strong> ${highlightText(
                              res.extracted_info.name,
                              query
                            )}`,
                          }}
                        />
                      )}
                      {res.extracted_info.email && (
                        <Typography
                          dangerouslySetInnerHTML={{
                            __html: `<strong>Email:</strong> ${highlightText(
                              res.extracted_info.email,
                              query
                            )}`,
                          }}
                        />
                      )}
                      {res.extracted_info.phone && (
                        <Typography
                          dangerouslySetInnerHTML={{
                            __html: `<strong>Phone:</strong> ${highlightText(
                              res.extracted_info.phone,
                              query
                            )}`,
                          }}
                        />
                      )}
                      {res.extracted_info.skills &&
                        res.extracted_info.skills.length > 0 && (
                          <Typography
                            dangerouslySetInnerHTML={{
                              __html: `<strong>Skills:</strong> ${res.extracted_info.skills
                                .map((skill) =>
                                  highlightText(skill, query)
                                )
                                .join(", ")}`,
                            }}
                          />
                        )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
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
