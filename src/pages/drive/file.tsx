import { Card, Button, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useAuth } from '../../providers/AuthProvider'
import { useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '../../db'
import { and, eq } from 'drizzle-orm'
import { files, type Files as Flv } from '../../schemas'
import { useEffect } from 'react'
import { getThumbnail, saveThumbnail } from '../../utils/indexDb'
import { tg } from '../../boot/telegram'
import { getDuration, getFileSize, isNumber } from '../../utils'
import { useDownload } from '../../useDownload'

const { Title, Text } = Typography
type Files = Flv & { thumb: string }

function uint8ArrayToBase64(
  data: Uint8Array,
  mimeType = 'image/jpeg'
): Promise<string> {
  const blob = new Blob([data], { type: mimeType })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      resolve(reader.result as string) // Esto será algo como: "data:image/jpeg;base64,..."
    }

    reader.onerror = (err) => {
      reject(err)
    }

    reader.readAsDataURL(blob)
  })
}
const FilePage = () => {
  const { user } = useAuth()
  const { fileId } = useParams()
  const queryClient = useQueryClient()
  const { startDownload } = useDownload()
  const folderQuery = useQuery<Files | null>({
    queryKey: ['files', user?.id ?? 0, fileId],
    queryFn: async () => {
      if (user) {
        if (fileId) {
          const rs = await db.query.files.findFirst({
            where: and(eq(files.id, fileId), eq(files.userId, user?.id ?? 0))
          })
          return rs ? { ...rs, t: '', thumb: '' } : null
        } else {
          return null
        }
      } else {
        return null
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false
  })

  useEffect(() => {
    if (folderQuery.data) {
      async function getThumb(data: Files) {
        const cached = await getThumbnail(`${data.messageId}`)
        let image: string | null = null
        if (!cached) {
          const chatId = folderQuery.data?.chatId ?? 'me'
          const peerId = isNumber(chatId) ? Number(chatId) : chatId
          const messages = await tg.getMessages(peerId, [
            Number(data.messageId)
          ])
          const message: any = messages[0]
          const buff: any = await tg.call({
            _: 'upload.getFile',
            location: message.media.thumbnails[1].location,
            offset: 0,
            limit: 32768
          })
          console.log(buff)
          //  const thumb= await tg.downloadAsBuffer("AAMCAQADGQEAAQr8D2hYRuCbTGUauAOmWC51wbmWTGRhAAIiCAAC-zHBRrtM63rZ8OINAQAHbQADNgQ")
          const base64 = await uint8ArrayToBase64(buff.bytes)

          await saveThumbnail(`${data.messageId}`, buff.bytes)
          image = base64
        } else {
          const base64 = await uint8ArrayToBase64(cached)
          image = base64
        }

        queryClient.setQueryData(
          ['files', user?.id ?? 0, fileId],
          (oldData: Files) => {
            if (!oldData) return null

            return { ...oldData, thumb: image }
          }
        )
      }
      void getThumb(folderQuery.data)
    }
  }, [folderQuery.data])

  const handleDownload = async () => {
    const chatId = folderQuery.data?.chatId ?? 'me'
    const peerId = isNumber(chatId) ? Number(chatId) : chatId
    const message: any = await tg.getMessages(peerId, [
      Number(folderQuery.data?.messageId)
    ])
    const media = message[0].media

    startDownload(media, folderQuery.data?.name ?? '')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
      }}
    >
      {folderQuery.data ? (
        <Card
          style={{ width: 360 }}
          cover={
            <img
              alt='preview'
              src={folderQuery.data.thumb}
        
            />
          }
          actions={[
            <Button
              type='primary'
              icon={<DownloadOutlined />}
              size='large'
              block
              onClick={handleDownload}
            >
              Descargar
            </Button>
          ]}
        >
          <Title level={4}>{folderQuery.data?.name}</Title>
          <Text type='secondary'>
            <strong>Tamaño:</strong> {getFileSize(folderQuery.data?.size ?? 0)}
          </Text>
          <br />
          <Text type='secondary'>
            <strong>Tipo:</strong> {folderQuery.data?.mimeType}
          </Text>
          {folderQuery.data.duration && (
            <>
              <br />
              <Text type='secondary'>
                <strong>Duración:</strong>{' '}
                {getDuration(folderQuery.data?.duration ?? 0)}
              </Text>
            </>
          )}
        </Card>
      ) : (
        <div>Carpeta no encontrada</div>
      )}
    </div>
  )
}

export default FilePage
