// PdfToImage.jsx
import React, { useRef, useEffect } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';


GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const PdfToImage = ({ file }:{file:any}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const renderAndExport = async () => {
      const pdf = await getDocument(file).promise;
      const page = await pdf.getPage(1); // Página 1

      const viewport = page.getViewport({ scale: 2 });
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      // Convertir canvas a imagen
      const imgData = canvas.toDataURL('image/png');

      // Descargar imagen
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'pagina1.png';
      link.click();
    };

    renderAndExport();
  }, [file]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};

export default PdfToImage;