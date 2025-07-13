import {
  Button,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  type TableProps
} from 'antd'
import { useEffect, useState } from 'react'
import { db } from '../../db'
import { sql } from 'drizzle-orm'
import { tg } from '../../book/telegram'
import {  formatBytes, getAudioCoverAsBlob } from '../../utils'

declare global {
  interface Window {
    jsmediatags: any;
  }
}
const jsmediatags = window.jsmediatags;
function downloadUint8Array(data: Uint8Array, filename: string) {
  // Crear un Blob con los datos
  const blob = new Blob([data], { type: 'image/jpeg' })

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

export default function Index() {
  const [upload, setUpload] = useState<{
    size: string
    uploaded: string
    percentage: number
  } | null>(null)

  interface DataType {
    key: string
    name: string
    age: number
    address: string
    tags: string[]
  }

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: 'Tags',
      key: 'tags',
      dataIndex: 'tags',
      render: (_, { tags }) => (
        <>
          {tags.map((tag) => {
            let color = tag.length > 5 ? 'geekblue' : 'green'
            if (tag === 'loser') {
              color = 'volcano'
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            )
          })}
        </>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          <a>Invite {record.name}</a>
          <a>Delete</a>
        </Space>
      )
    }
  ]

  const data: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
      tags: ['nice', 'developer']
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
      tags: ['loser']
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sydney No. 1 Lake Park',
      tags: ['cool', 'teacher']
    }
  ]

  useEffect(() => {
    async function init() {
      const result = await db.query.users.findMany()
      console.log(result)
      const message: any = await tg.getMessages('me', [6122215])
      console.log(message[0])
      //console.log(message[0].media.thumbnails[1].location)
      const buff: any = await tg.call({
        _: 'upload.getFile',
        location: message[0].media.thumbnails[1].location,
        offset: 0,
        limit: 32768
      })
      console.log(buff)
      //  const thumb= await tg.downloadAsBuffer("AAMCAQADGQEAAQr8D2hYRuCbTGUauAOmWC51wbmWTGRhAAIiCAAC-zHBRrtM63rZ8OINAQAHbQADNgQ")
      downloadUint8Array(buff.bytes, 'thumb.jpg')
    }
    init()
  }, [])

  const onChange = async (e: any) => {
    const file: File = e.target.files[0]
    if (file) {
      console.log(file)
      /*
      const media = await tg.uploadFile({
        file: file,
        fileSize: file.size,
        progressCallback: (sent, total) => {
          console.log(`Sent ${sent} of ${total}`)
        }
      })
      console.log(media)*/
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true
      }

    const audio=await getAudioCoverAsBlob(file)
    console.log(audio) 
    throw new Error("error")
//      const tsize = await getImageDimensionsFromFile(file)
  //    const izise = await getImageDimensionsFromFile(file)

      const thumbv = await tg.uploadFile({ file: audio as any,fileMime:"image/jpeg" })

    
      const fee = await tg.sendMedia(
        'me',
        {
          file: file,
          type: 'audio',
          fileMime: file.type,
          thumb: thumbv
        },
        {
          progressCallback: (sent, total) => {
            setUpload({
              size: formatBytes(file.size),
              uploaded: formatBytes(sent),
              percentage: Math.round((sent / total) * 100)
            })
          }
        }
      )
      setUpload(null)
      console.log(fee)
      console.log(fee.media?.id)
    }
  }
  return (
    <div className='p-2'>
      <input
        style={{ display: 'none' }}
        type='file'
        id='file-upload'
        onChange={onChange}
      ></input>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div style={{ float: 'right' }}>
          <Button
            type='primary'
            onClick={() => {
              const input = document.getElementById('file-upload')
              input?.click()
            }}
            style={{ marginBottom: 16 }}
          >
            subir archivo
          </Button>
        </div>
      </div>
      <Table<DataType> columns={columns} dataSource={data} />
      <Modal closable={false} open={upload!==null} footer={null} centered>
        <div style={{ textAlign: 'center' }}>
          <div>
            <h3>Subiendo archivo</h3>
          </div>
          <div>
            <Progress
              type='circle'
              percent={upload?.percentage}
              format={(percent) => `${percent} / 100`}
            />
          </div>
          <div>
           <h5>{upload?.uploaded}/{upload?.size}</h5>
          </div>
        </div>
      </Modal>
    </div>
  )
}
