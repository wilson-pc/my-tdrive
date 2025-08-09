import { Card, Button, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { db } from '../../db'
import { eq } from 'drizzle-orm'
import { files, shares, type Files } from '../../schemas'

import { getDuration, getFileSize } from '../../utils'

const { Title, Text } = Typography

const SharePage = () => {
  const { shareId } = useParams()

  const { data, isLoading } = useQuery<Files | null>({
    queryKey: ['share', shareId],
    queryFn: async () => {
      if (shareId) {
        const rs = await db.query.shares.findFirst({
          where: eq(shares.id, shareId)
        })
        console.log(rs)
        if (rs) {
          if (
            rs.expirationDate &&
            new Date(rs.expirationDate).getTime() < new Date().getTime()
          ) {
            await db.delete(shares).where(eq(shares.id, shareId))
            return null
          } else {
            const file = await db.query.files.findFirst({
              where: eq(files.id, rs.fileId ?? '')
            })
            if (file) {
              return file
            } else {
              return null
            }
          }
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

  const handleDownload = async () => {
    const a=document.getElementById('download-link')
    a?.setAttribute('href',`${import.meta.env.VITE_API_URL}/file/download/${data?.id}`)
    a?.click()
    
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
      <a href="" id='download-link'></a>
      {data && (
        <Card
          style={{ width: 360 }}
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
          <Title level={4}>{data?.name}</Title>
          <Text type='secondary'>
            <strong>Tamaño:</strong> {getFileSize(data?.size ?? 0)}
          </Text>
          <br />
          <Text type='secondary'>
            <strong>Tipo:</strong> {data?.mimeType}
          </Text>
          {data.duration && (
            <>
              <br />
              <Text type='secondary'>
                <strong>Duración:</strong> {getDuration(data?.duration ?? 0)}
              </Text>
            </>
          )}
        </Card>
      )}

      {data === null && isLoading===false && (
        <div>Recurso compartido no encontrado</div>
      )}
    </div>
  )
}

export default SharePage
