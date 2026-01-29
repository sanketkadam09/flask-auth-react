import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ fileUrl, pageNumber, highlights }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

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
        pdfViewer.currentPageNumber = pageNumber;

        if (highlights) {
          eventBus.dispatch("find", {
            query: highlights,
            highlightAll: true,
            caseSensitive: false,
          });
        }
      });
    });
  }, [fileUrl, pageNumber, highlights]);

  return (
   
    <div
      style={{
        position: "relative",
        height: "500px",
        border: "2px solid #a2c463",
      }}
    >
     
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "auto",
           
        }}
      >
      
        <div ref={viewerRef} className="pdfViewer" />
      </div>
    </div>
  );
}
