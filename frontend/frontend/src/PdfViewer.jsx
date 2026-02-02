import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import "pdfjs-dist/web/pdf_viewer.css";
import API from "./api"; // For fetching OCR words

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ fileUrl, pageNumber, highlights, fileId }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [ocrWords, setOcrWords] = useState([]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!fileUrl || !pageNumber) return;

    const eventBus = new pdfjsViewer.EventBus();
    const linkService = new pdfjsViewer.PDFLinkService({ eventBus });
    const findController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService,
    });

    const pdfViewer = new pdfjsViewer.PDFViewer({
      container: containerRef.current,
      viewer: viewerRef.current,
      eventBus,
      linkService,
      findController,
      textLayerMode: 2,
    });

    linkService.setViewer(pdfViewer);

    pdfjsLib.getDocument(fileUrl).promise.then((pdf) => {
      pdfViewer.setDocument(pdf);
      linkService.setDocument(pdf);

      eventBus.on("pagesinit", () => {
        pdfViewer.currentScaleValue = "page-width";
        setScale(pdfViewer._currentScale); // Save scale for OCR overlay
        pdfViewer.currentPageNumber = pageNumber;

        // Text-based PDFs: use PDF.js search
        if (highlights && !fileId) {
          eventBus.dispatch("find", {
            query: highlights,
            highlightAll: true,
            caseSensitive: false,
          });
        }
      });
    });
  }, [fileUrl, pageNumber, highlights, fileId]);

  // Fetch OCR words for scanned PDFs
  useEffect(() => {
    if (!fileId) return;
    async function fetchOCRWords() {
      try {
        const res = await API.get(`/ocr_words?file_id=${fileId}&page_number=${pageNumber}`);
        setOcrWords(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchOCRWords();
  }, [fileId, pageNumber]);

  return (
    <div style={{ position: "relative", height: "500px", border: "2px solid #a2c463" }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, overflow: "auto" }}
      >
        <div ref={viewerRef} className="pdfViewer" />
      </div>

      {/* OCR highlights overlay */}
      {fileId && highlights && ocrWords.map(word => {
        if (!word.text.toLowerCase().includes(highlights.toLowerCase())) return null;
        return (
          <div
            key={word.id}
            style={{
              position: "absolute",
              left: word.x * scale + "px",
              top: word.y * scale + "px",
              width: word.w * scale + "px",
              height: word.h * scale + "px",
              backgroundColor: "rgba(219, 106, 14, 0.5)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        );
      })}
    </div>
  );
}
