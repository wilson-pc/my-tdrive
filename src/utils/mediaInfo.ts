import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
declare global {
  interface Window {
    jsmediatags: any;
  }
}
const jsmediatags = window.jsmediatags;
export function getAudioDurationFromFile(
  file: File
): Promise<number | undefined> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration); // duración en segundos (puede incluir decimales)
    };

    audio.onerror = () => {
      resolve(undefined);
    };
  });
}

export function getAudioCoverAsBlob(
  file: File
): Promise<{ thumb: Blob | null; duration: number | undefined } | null> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const duration = await getAudioDurationFromFile(file);
    console.log(duration);
    jsmediatags.read(file, {
      onSuccess: async function (tag: any) {
        const picture = tag.tags.picture;
        if (picture) {
          const { data, format } = picture;

          // Convertimos array-like a Uint8Array
          const byteArray = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) {
            byteArray[i] = data[i];
          }

          const blob = new Blob([byteArray], { type: format });
          resolve({
            thumb: blob,
            duration: duration,
          });

          // Si quieres un File en lugar de Blob:
          // const coverFile = new File([blob], 'cover.jpg', { type: format });
          // resolve(coverFile);
        } else {
          resolve({
            thumb: null,
            duration: duration,
          });
        }
      },
      onError: function () {
        resolve({
          thumb: null,
          duration: duration,
        });
      },
    });
  });
}
export function getImageDimensionsFromPdf(
  file: File
): Promise<{ width: number; height: number; thumbnail: Blob | null } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = function (e: any) {
      const img = new Image();

      img.onload = function () {
        const width = img.width;
        const height = img.height;

        // Tamaño máximo del thumbnail
        const maxThumbWidth = 1200;
        const maxThumbHeight = 720;

        // Calcular proporción manteniendo el aspecto
        let thumbWidth = maxThumbWidth;
        let thumbHeight = maxThumbHeight;

        const imgRatio = width / height;
        const thumbRatio = maxThumbWidth / maxThumbHeight;

        if (imgRatio > thumbRatio) {
          // Imagen es más ancha que el thumbnail
          thumbWidth = maxThumbWidth;
          thumbHeight = maxThumbWidth / imgRatio;
        } else {
          // Imagen es más alta o igual en relación al thumbnail
          thumbHeight = maxThumbHeight;
          thumbWidth = maxThumbHeight * imgRatio;
        }

        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;

        const ctx = thumbCanvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        thumbCanvas.toBlob(
          (thumbBlob) => {
            resolve({
              width,
              height,
              thumbnail: thumbBlob,
            });
          },
          "image/jpeg",
          0.8
        );
      };

      img.onerror = () => {
        console.log("No se pudo cargar la imagen.");
        resolve(null);
      };
      img.src = e.target.result;
    };

    reader.onerror = () => {
      console.log("No se pudo cargar la imagen.");
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}
export function getImageDimensionsFromFile(
  file: File
): Promise<{ width: number; height: number; thumbnail: Blob | null } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = function (e: any) {
      const img = new Image();

      img.onload = function () {
        const width = img.width;
        const height = img.height;

        // Tamaño máximo del thumbnail
        const maxThumbWidth = 320;
        const maxThumbHeight = 240;

        // Calcular proporción manteniendo el aspecto
        let thumbWidth = maxThumbWidth;
        let thumbHeight = maxThumbHeight;

        const imgRatio = width / height;
        const thumbRatio = maxThumbWidth / maxThumbHeight;

        if (imgRatio > thumbRatio) {
          // Imagen es más ancha que el thumbnail
          thumbWidth = maxThumbWidth;
          thumbHeight = maxThumbWidth / imgRatio;
        } else {
          // Imagen es más alta o igual en relación al thumbnail
          thumbHeight = maxThumbHeight;
          thumbWidth = maxThumbHeight * imgRatio;
        }

        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;

        const ctx = thumbCanvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        thumbCanvas.toBlob(
          (thumbBlob) => {
            resolve({
              width,
              height,
              thumbnail: thumbBlob,
            });
          },
          "image/jpeg",
          0.8
        );
      };

      img.onerror = () => {
        console.log("No se pudo cargar la imagen.");
        resolve(null);
      };
      img.src = e.target.result;
    };

    reader.onerror = () => {
      console.log("No se pudo cargar la imagen.");
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}
export function getVideoMetadataFromFile(file: File): Promise<{
  width: number;
  height: number;
  duration: number;
  thumbnail: Blob | null;
  thumbnailSmall: Blob | null;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const midpoint = video.duration / 2;
      video.currentTime = midpoint;
    };

    video.onseeked = () => {
      const originalCanvas = document.createElement("canvas");
      originalCanvas.width = video.videoWidth;
      originalCanvas.height = video.videoHeight;

      const originalCtx = originalCanvas.getContext("2d");
      originalCtx?.drawImage(
        video,
        0,
        0,
        originalCanvas.width,
        originalCanvas.height
      );

      // Mini thumbnail 320x240
      const smallCanvas = document.createElement("canvas");
      smallCanvas.width = 320;
      smallCanvas.height = 240;

      const smallCtx = smallCanvas.getContext("2d");
      smallCtx?.drawImage(video, 0, 0, smallCanvas.width, smallCanvas.height);

      // Obtener ambos blobs
      Promise.all([
        new Promise((res) => originalCanvas.toBlob(res, "image/jpeg", 0.8)),
        new Promise((res) => smallCanvas.toBlob(res, "image/jpeg", 0.8)),
      ])
        .then(([originalThumb, smallThumb]) => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            thumbnail: originalThumb as any,
            thumbnailSmall: smallThumb as any,
          });
          URL.revokeObjectURL(video.src);
        })
        .catch(reject);
    };

    video.onerror = () => reject(new Error("Error al cargar el video."));
  });
}

export function getFileSize(size: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (size === 0) return "0 Byte";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

export function getDuration(duration: number) {
  return dayjs
    .duration(Number(duration), "seconds")
    .format("H:mm:ss")
    .padStart(4, "0:0");
}
