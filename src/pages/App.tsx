import { useEffect, useState } from 'react'
import { TelegramClient, tl, User } from '@mtcute/web'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Dispatcher, filters } from '@mtcute/dispatcher'
import { Button } from 'antd'

function downloadUint8Array(data: Uint8Array, filename: string) {
  // Crear un Blob con los datos
  const blob = new Blob([data], { type: 'video/mp4' })

  // Crear un enlace de descarga
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename

  // Disparar el evento de click para iniciar la descarga
  document.body.appendChild(a)
  a.click()

  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
async function playVideoIterable(
  iterable: AsyncIterableIterator<Uint8Array>,
  mimeType = 'video/mp4; codecs="avc1.64001E, mp4a.40.2"'
) {
  const video = document.getElementById('video') as HTMLVideoElement
  const mediaSource = new MediaSource()
  video.src = URL.createObjectURL(mediaSource)

  mediaSource.addEventListener('sourceopen', async () => {
    const sourceBuffer = mediaSource.addSourceBuffer(mimeType)

    // Cola para chunks
    const queue: Uint8Array[] = []
    let isAppending = false
    let isDone = false

    const appendNext = async () => {
      if (isAppending || sourceBuffer.updating || queue.length === 0) return

      isAppending = true
      const chunk = queue.shift()!
      sourceBuffer.appendBuffer(chunk)

      sourceBuffer.addEventListener(
        'updateend',
        () => {
          isAppending = false
          if (queue.length > 0) {
            appendNext()
          } else if (isDone) {
            // Ya no hay más chunks y todos fueron procesados
            mediaSource.endOfStream()
          }
        },
        { once: true }
      )
    }

    try {
      for await (const chunk of iterable) {
        queue.push(chunk)
        appendNext()
      }

      // Cuando se terminan todos los chunks
      isDone = true

      // Si ya no hay nada pendiente, cerramos el stream
      if (!sourceBuffer.updating && queue.length === 0) {
        mediaSource.endOfStream()
      }
    } catch (err) {
      console.error('Error al hacer streaming:', err)
      try {
        mediaSource.endOfStream('decode')
      } catch (_) {}
    }
  })
}
async function downloadStream(
  stream: ReadableStream<Uint8Array>,
  filename: string
) {
  // Convertir el stream a un Blob
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  // Crear un Blob con todos los chunks
  const blob = new Blob(chunks, { type: 'video/mp4' })

  // Crear enlace de descarga
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename

  // Iniciar descarga
  document.body.appendChild(a)
  a.click()

  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

async function downloadStreamWithSize(
  stream: ReadableStream<Uint8Array>,
  filename: string,
  size?: number
) {
  const blob = await new Response(stream).blob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename

  // Opcional: establecer atributo de tamaño para el gestor
  if (size) a.setAttribute('data-size', size.toString())

  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
const tg = new TelegramClient({
  apiId: 3454052,
  apiHash: 'cba31f242e6b16063f7db572fe388cb3',
  storage: 'my-account' // will use IndexedDB-based storage
})

async function downloadTelegramFile(file: any, filename = 'video.mp4') {
  const iterable = await tg.downloadAsIterable(file)

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  for await (const chunk of iterable) {
    chunks.push(chunk)
    totalBytes += chunk.length
    console.log(`Descargado: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
  }

  // Unir los chunks en un solo Blob
  const blob = new Blob(chunks, {
    type: file.mime_type ?? 'application/octet-stream'
  })

  // Crear URL y disparar descarga
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function streamTelegramFile(file: any, filename = 'video.mp4') {
  console.log(window.MediaSource)
  if (!window.MediaSource) {
    console.error('MediaSource API no soportada en este navegador.')
    alert(
      'Tu navegador no soporta la reproducción de video mientras se descarga. Se intentará la descarga completa.'
    )
    // Si MediaSource no está disponible, revertir a la descarga completa.
    return downloadTelegramFile(file, filename)
  }

  const videoElement = document.createElement('video')
  videoElement.controls = true
  videoElement.autoplay = true // Opcional: iniciar reproducción automáticamente
  videoElement.style.width = '100%'
  document.body.appendChild(videoElement) // Asegúrate de añadir el video al DOM

  const mediaSource = new MediaSource()
  videoElement.src = URL.createObjectURL(mediaSource)

  mediaSource.addEventListener('sourceopen', async () => {
    try {
      const mimeType = file.mime_type ?? 'video/mp4' // Asumimos mp4 si no hay tipo MIME
      if (!MediaSource.isTypeSupported(mimeType)) {
        console.error(`Tipo MIME no soportado por MediaSource: ${mimeType}`)
        alert(
          `El tipo de archivo (${mimeType}) no es soportado para streaming. Se intentará la descarga completa.`
        )
        // Si el tipo MIME no es soportado, revertir a la descarga completa y eliminar el video
        document.body.removeChild(videoElement)
        return downloadTelegramFile(file, filename)
      }

      const sourceBuffer = mediaSource.addSourceBuffer(mimeType)
      const iterable = await tg.downloadAsIterable(file)
      let totalBytes = 0

      for await (const chunk of iterable) {
        if (mediaSource.readyState === 'open') {
          // Asegurarse de que el SourceBuffer esté listo para actualizar
          if (!sourceBuffer.updating) {
            sourceBuffer.appendBuffer(chunk)
            totalBytes += chunk.length
            console.log(
              `Descargado y en buffer: ${(totalBytes / 1024 / 1024).toFixed(
                2
              )} MB`
            )
          } else {
            // Si el buffer está ocupado, esperar un poco o intentar de nuevo
            console.log('SourceBuffer ocupado, esperando...')
            await new Promise((resolve) => setTimeout(resolve, 100)) // Pequeña pausa
            // Podrías implementar una cola para los chunks si es necesario un manejo más robusto
            sourceBuffer.appendBuffer(chunk) // Reintentar
            totalBytes += chunk.length
            console.log(
              `Descargado y en buffer: ${(totalBytes / 1024 / 1024).toFixed(
                2
              )} MB`
            )
          }
        } else {
          console.warn("MediaSource no está 'open', deteniendo el append.")
          break // Salir del bucle si MediaSource ya no está abierto (ej. por error o fin)
        }
      }

      // Cuando todos los chunks se han añadido, señalamos el final del stream
      if (mediaSource.readyState === 'open') {
        sourceBuffer.addEventListener(
          'updateend',
          () => {
            if (mediaSource.readyState === 'open') {
              mediaSource.endOfStream()
              console.log('Fin del stream de MediaSource.')
              // Opcional: ofrecer descarga si el usuario quiere guardar el archivo
              // downloadTelegramFile(file, filename); // Esto descargaría de nuevo
            }
          },
          { once: true }
        ) // Usar once para que se ejecute solo una vez
      }
    } catch (error) {
      console.error('Error durante el streaming:', error)
      if (mediaSource.readyState === 'open') {
        mediaSource.endOfStream('decode') // Terminar el stream con un error
      }
      alert(
        'Ocurrió un error al intentar reproducir el video. Se intentará la descarga completa.'
      )
      document.body.removeChild(videoElement)
      // En caso de error, revertir a la descarga completa
      downloadTelegramFile(file, filename)
    }
  })

  mediaSource.addEventListener('sourceended', () => {
    console.log('MediaSource ended. Video should be fully buffered.')
  })

  mediaSource.addEventListener('error', (e) => {
    console.error('MediaSource error:', e)
    alert(
      'Ocurrió un error con la fuente de medios. Se intentará la descarga completa.'
    )
    document.body.removeChild(videoElement)
    downloadTelegramFile(file, filename)
  })
}

// Asegúrate de que tu función original para descargar el archivo completo sigue existiendo
async function downloadTelegramFile2(file: any, filename = 'video.mp4') {
  const iterable = await tg.downloadAsIterable(file)

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  for await (const chunk of iterable) {
    chunks.push(chunk)
    totalBytes += chunk.length
    console.log(`Descargado: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
  }

  const blob = new Blob(chunks, {
    type: file.mime_type ?? 'application/octet-stream'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  console.log('Descarga completa iniciada.')
}
function App() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('phone') // 'phone', 'code', 'logged'
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkSignedIn() {
      try {
        // Try calling any method that requires authorization
        console.log(window.MediaSource)
        return await tg.getMe()
      } catch (e) {
        if (tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) {
          // Not signed in, continue
          return null
        } else {
          // Some other error, rethrow
          throw e
        }
      }
    }

    async function init() {
      setLoading(true)
      try {
        const self = await checkSignedIn()
        if (self) {
          setUser(self)
          setStep('logged')
          console.log(`Logged in as ${self.displayName}`)
        } else {
          setStep('phone')
        }
      } catch (error) {
        console.error('Error checking login status:', error)
        setError('Error al verificar el estado de inicio de sesión')
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [])
  const dp = Dispatcher.for(tg)

  dp.onNewMessage(filters.media, async (msg) => {
    console.log(msg.media)
  })
  const handlePhoneSubmit = async (e: any) => {
    e.preventDefault()
    if (!phoneNumber) {
      setError('Por favor ingresa tu número de teléfono')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Send the phone number to Telegram to request a code
      await tg.sendCode({
        phone: phoneNumber
      })
      setStep('code')
    } catch (error) {
      console.error('Error sending code:', error)
      setError('Error al enviar el código. Verifica tu número de teléfono.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: any) => {
    e.preventDefault()
    if (!code) {
      setError('Por favor ingresa el código de verificación')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Sign in with the phone number and verification code
      const self = await tg.start({
        phone: phoneNumber,
        code: code
      })
      setUser(self)
      setStep('logged')
    } catch (error) {
      console.error('Error signing in:', error)
      setError('Error al iniciar sesión. Verifica el código ingresado.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await tg.logOut()
      setStep('phone')
      setUser(null)
      setPhoneNumber('')
      setCode('')
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Error al cerrar sesión')
    } finally {
      setLoading(false)
    }
  }

  const onChange = async (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const media = await tg.uploadFile({
        file: file,
        fileSize: file.size,
        progressCallback: (sent, total) => {
          console.log(`Sent ${sent} of ${total}`)
        }
      })

      await tg.sendMedia('me', {
        file: media,
        type: 'video',
        fileMime: 'video/mp4'
      })
    }
  }
  return (
    <div className='container'>
      <div className='header'>
        <a href='https://vite.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
        <h1>Telegram Login</h1>
      </div>
      <video
        id='video'
        controls
        src='http://localhost:3002/download/lite/ajof6ig2pdhk9c2cbj9coiin'
      ></video>
      {loading && <div className='loading'>Cargando...</div>}

      {error && <div className='error'>{error}</div>}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className='login-form'>
          <div className='form-group'>
            <label htmlFor='phone'>
              Número de teléfono (con código de país):
            </label>
            <input
              id='phone'
              type='text'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder='+59176482155'
              disabled={loading}
            />
          </div>
          <button type='submit' disabled={loading}>
            Enviar código
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className='login-form'>
          <div className='form-group'>
            <label htmlFor='code'>Código de verificación:</label>
            <input
              id='code'
              type='text'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder='12345'
              disabled={loading}
            />
          </div>
          <button type='submit' disabled={loading}>
            Iniciar sesión
          </button>
          <button
            type='button'
            onClick={() => setStep('phone')}
            disabled={loading}
            className='secondary-button'
          >
            Volver
          </button>
        </form>
      )}

      {step === 'logged' && user && (
        <div className='logged-in'>
          <h2>¡Bienvenido, {user.displayName || 'Usuario'}!</h2>
          <Button type="primary">Button</Button>
          <p>Has iniciado sesión correctamente en Telegram.</p>
          <button onClick={handleLogout} disabled={loading}>
            Cerrar sesión
          </button>

          <button
            onClick={async () => {
              const peer = await tg.resolvePeer('yankong5')
              console.log('peer', peer)
              const [msg] = await tg.getMessages(peer, [6672])
              console.log('msg', msg)
              const media = msg?.media as any
              /*
          const fe= await  tg.downloadAsBuffer(media,{
            progressCallback: (p)=>{
              console.log(p)
            }
          })*/

              streamTelegramFile(media)
              /*
        const fe =  tg.downloadAsIterable(media,{

            progressCallback: (p)=>{
              console.log(p)
            }
          })
          playVideoIterable(fe)
  */
            }}
            disabled={loading}
          >
            descargar
          </button>
          <input type='file' id='finput' onChange={onChange}></input>
          <button
            onClick={async () => {
              const input = document.getElementById(
                'finput'
              ) as HTMLInputElement
              input.click()
            }}
            disabled={loading}
          >
            cargar
          </button>
        </div>
      )}
    </div>
  )
}

export default App
