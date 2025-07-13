declare global {
  interface Window {
    jsmediatags: any
  }
}
const jsmediatags = window.jsmediatags
export function getAudioDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration); // duración en segundos (puede incluir decimales)
    };

    audio.onerror = () => {
      reject(new Error('No se pudo cargar el archivo de audio'));
    };
  });
}

export function getAudioCoverAsBlob(file: File): Promise<{thumb:Blob | null,duration:number}|null> {

  return new Promise((resolve) => {
    jsmediatags.read(file, {

      onSuccess: async function (tag: any) {
        const duration= await getAudioDurationFromFile(file);

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
            thumb:blob,
            duration:duration
          });

          // Si quieres un File en lugar de Blob:
          // const coverFile = new File([blob], 'cover.jpg', { type: format });
          // resolve(coverFile);
        } else {
          resolve(null);
        }
      },
      onError: function () {
        resolve(null);
      }
    });
  });
}

export function getImageDimensionsFromFile(
  file: File
): Promise<{ width: number; height: number; thumbnail: Blob | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = function (e: any) {
      const img = new Image()

      img.onload = function () {
        // Canvas para la imagen original (opcional, en este caso no la usamos)
        const width = img.width
        const height = img.height

        // Canvas para thumbnail 320x240
        const thumbCanvas = document.createElement('canvas')
        thumbCanvas.width = 320
        thumbCanvas.height = 240

        const ctx = thumbCanvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height)

        thumbCanvas.toBlob(
          (thumbBlob) => {
            resolve({
              width,
              height,
              thumbnail: thumbBlob
            })
          },
          'image/jpeg',
          0.8
        )
      }

      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

export function getVideoMetadataFromFile(file: File): Promise<{
  width: number
  height: number
  duration: number
  thumbnail: Blob | null
  thumbnailSmall: Blob | null
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      const midpoint = video.duration / 2
      video.currentTime = midpoint
    }

    video.onseeked = () => {
      const originalCanvas = document.createElement('canvas')
      originalCanvas.width = video.videoWidth
      originalCanvas.height = video.videoHeight

      const originalCtx = originalCanvas.getContext('2d')
      originalCtx?.drawImage(
        video,
        0,
        0,
        originalCanvas.width,
        originalCanvas.height
      )

      // Mini thumbnail 320x240
      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = 320
      smallCanvas.height = 240

      const smallCtx = smallCanvas.getContext('2d')
      smallCtx?.drawImage(video, 0, 0, smallCanvas.width, smallCanvas.height)

      // Obtener ambos blobs
      Promise.all([
        new Promise((res) => originalCanvas.toBlob(res, 'image/jpeg', 0.8)),
        new Promise((res) => smallCanvas.toBlob(res, 'image/jpeg', 0.8))
      ])
        .then(([originalThumb, smallThumb]) => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            thumbnail: originalThumb as any,
            thumbnailSmall: smallThumb as any
          })
          URL.revokeObjectURL(video.src)
        })
        .catch(reject)
    }

    video.onerror = () => reject(new Error('Error al cargar el video.'))
  })
}
