import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.mjs`;

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function isNumber(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export const readFileData = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("File could not be read as a string."));
      }
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};

export const convertPdfToImages = async (file: File) => {
  const data = await file.arrayBuffer(); // Simplifica readFileData
  const pdf = await getDocument({ data }).promise;

  const page = await pdf.getPage(1); // Solo la primera página
  const viewport = page.getViewport({ scale: 2 }); // Mejor resolución

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context!, viewport }).promise;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg")
  );

  canvas.remove();

  if (!blob) throw new Error("No se pudo generar la imagen");

  return new File([blob], "pagina1.jpg", { type: "image/jpeg" });
};
