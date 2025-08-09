import {
  Button,
  DatePicker,
  Flex,
  Image,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Typography,
  type DatePickerProps,
  type TableProps
} from 'antd'
import { useEffect, useState } from 'react'
import { db } from '../../db'
import { tg } from '../../boot/telegram'
import {
  formatBytes,
  getAudioCoverAsBlob,
  getDuration,
  getVideoMetadataFromFile,
  isNumber
} from '../../utils'
import { files, type Files as Flv } from '../../schemas/files'
import { useAuth } from '../../providers/AuthProvider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getThumbnail, saveThumbnail } from '../../utils/indexDb'
import { useDownload } from '../../useDownload'
import { Long, Message } from '@mtcute/web'
import Checkbox from 'antd/es/checkbox/Checkbox'
import {
  AppstoreOutlined,
  FolderOpenOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { Link, useSearchParams } from 'react-router'
import CardGridWithPagination from '../../components/carts'
import { shares } from '../../schemas'
import { createId } from '@paralleldrive/cuid2'

type Files = Flv & { thumb: string }
const { Link: LinkOutlined } = Typography

navigator.serviceWorker.addEventListener('message', async (e) => {
  if (e.data.type !== 'REQUEST_STREAM') return

  const { file, params } = e.data
  const stream = tg.downloadAsStream(file, params)

  // Devolvemos el stream por el MessagePort
  e.ports[0].postMessage({ stream }, [stream])
})

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
export default function Index() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const { startDownload, startUpload } = useDownload()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newGroup, setNewGroup] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<number | string | null>(
    null
  )
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isGridView, setIsGridView] = useState(false)
  const [selectGroup, setSelectGroup] = useState<boolean>(false)
  const [groups, setGroups] = useState<any>([])
  const [selectedFile, setSelectedFile] = useState<Files | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [expirationDate, setExpirationDate] = useState<Date | null>(null)

  const folderId = searchParams.get('folderId')
  const folderQuery = useQuery({
    queryKey: ['folder', folderId],
    queryFn: async () => {
      if (user) {
        if (folderId) {
          const rs = await db.query.files.findFirst({
            where: eq(files.id, folderId)
          })
          return rs ?? null
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

  const query = useQuery({
    queryKey: ['files', user?.id ?? 0, folderId],
    queryFn: async () => {
      console.log(folderId)
      const normalizedFolderId =
        folderId === undefined || folderId === '' ? null : folderId
      console.log(normalizedFolderId)
      if (user) {
        const rs = await db.query.files.findMany({
          where: and(
            eq(files.userId, user?.id ?? 0),
            normalizedFolderId === null
              ? isNull(files.parentId)
              : eq(files.parentId, folderId ?? '')
          ),
          orderBy: [desc(files.name)]
        })
        return rs.sort((a, b) => {
          // Si a es folder y b no, a va antes
          if (a.isFolder && !b.isFolder) return -1
          // Si b es folder y a no, b va antes
          if (!a.isFolder && b.isFolder) return 1
          // Si ambos son iguales respecto a isFolder, no cambia orden
          return 0
        })
      } else {
        return []
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false
  })
  const [upload, setUpload] = useState<{
    size: string
    uploaded: string
    percentage: number
  } | null>(null)
  const queryClient = useQueryClient()
  const columns: TableProps<Files>['columns'] = [
    {
      title: '',
      dataIndex: 'messageId',
      key: 'messageId',
      render: (messageId, record) => {
        if (record.isFolder) {
          return <FolderOpenOutlined style={{ fontSize: 40 }} />
        }
        if (record.thumb) {
          return <Image src={record.thumb} height={40} preview={false} />
        } else {
          return ''
        }
      }
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>
    },
    {
      title: 'Tipo',
      dataIndex: 'mimeType',
      key: 'mimeType'
    },
    {
      title: 'Tamaño',
      dataIndex: 'size',
      key: 'size',
      render: (text, record) => {
        if (
          record.mimeType?.includes('audio') ||
          record.mimeType?.includes('video')
        ) {
          return formatBytes(text)
        }
        return ''
      }
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (text, record) => {
        if (
          record.mimeType?.includes('audio') ||
          record.mimeType?.includes('video')
        ) {
          return getDuration(text)
        }
        return ''
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          {record.isFolder ? (
            <>
              <Link to={`?folderId=${record.id}`}>
                {' '}
                <Button type='primary'>ver</Button>
              </Link>
            </>
          ) : (
            <>
              <Button type='primary' onClick={() => getMessage(record)}>
                Descargar
              </Button>
              <Button type='link' onClick={() => deleteFile(record)}>
                Borrar
              </Button>
              <Button
                type='link'
                onClick={() => {
                  setSelectedFile(record)
                  setShareModalOpen(true)
                }}
              >
                Compartir
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]
  /*
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
*/
  useEffect(() => {
    if (query.data) {
      async function getThumb(fles: Flv[]) {
        const fils: Record<string, any> = {}

        const chatId = folderQuery.data?.chatId ?? 'me'
        const peerId = isNumber(chatId) ? Number(chatId) : chatId

        const message = await tg.getMessages(
          peerId,
          fles
            .filter((f) => f.isFolder === false)
            .map((f) => Number(f.messageId))
        )
        const messagesRecord: Record<number, Message | null> = {}
        for (const m of message) {
          if (m) {
            messagesRecord[m.id] = m
          }
        }
        for (const file of fles) {
          if (file.isFolder === false) {
            const cached = await getThumbnail(`${file.messageId}`)
            const message: any = messagesRecord[Number(file.messageId)]

            if (!cached) {
              //console.log(message[0].media.thumbnails[1].location)
              const buff: any = await tg.call({
                _: 'upload.getFile',
                location: message.media.thumbnails[1].location,
                offset: 0,
                limit: 32768
              })
              console.log(buff)
              //  const thumb= await tg.downloadAsBuffer("AAMCAQADGQEAAQr8D2hYRuCbTGUauAOmWC51wbmWTGRhAAIiCAAC-zHBRrtM63rZ8OINAQAHbQADNgQ")
              const base64 = await uint8ArrayToBase64(buff.bytes)

              await saveThumbnail(`${file.messageId}`, buff.bytes)
              fils[file.messageId ?? ''] = base64
            } else {
              const base64 = await uint8ArrayToBase64(cached)
              fils[file.messageId ?? ''] = base64
            }
          }
        }

        queryClient.setQueryData(
          ['files', user?.id ?? 0, folderId],
          (oldData: Files[]) => {
            if (!oldData) return []

            return oldData.map((item) => {
              if (item.isFolder === false) {
                return { ...item, thumb: fils[item.messageId ?? ''] }
              }
              return item
            })
          }
        )
      }
      void getThumb(query.data)
    }
  }, [query.data])

  const playVideo = () => {}

  const onChange = async (e: any) => {
    const file: File = e.target.files[0]
    if (file) {
      const chatId = folderQuery.data?.chatId ?? 'me'
      const peerId = isNumber(chatId) ? Number(chatId) : chatId
      //  const de= await tg.getPeer(peerId)
      //console.log(de)
      /*
  const de= await tg.getPeer(peerId)
  console.log(de)
  const peer = await tg.resolvePeer(peerId)
  console.log(peer)
*/
      //return
      startUpload(file, user?.id ?? 0, peerId, folderId ?? '')
      /*
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 400,
          useWebWorker: true
        }

        const audio = await getAudioCoverAsBlob(file)
        console.log(audio)
        //  throw new Error("error")
        //      const tsize = await getImageDimensionsFromFile(file)
        //    const izise = await getImageDimensionsFromFile(file)

        let thumbv = undefined

        if (audio?.thumb) {
          thumbv = await tg.uploadFile({
            file: audio?.thumb as any,
            fileMime: 'image/jpeg'
          })
        }

        const fee = await tg.sendMedia(
          'me',
          {
            file: file,
            type: 'audio',
            fileMime: file.type,
            thumb: thumbv,
            duration: audio?.duration
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
      */
    }
  }

  const videoUpload = async (file: File) => {
    const video = await getVideoMetadataFromFile(file)
    console.log(video)
    //  throw new Error("error")
    //      const tsize = await getImageDimensionsFromFile(file)
    //    const izise = await getImageDimensionsFromFile(file)

    let thumbv = undefined

    if (video?.thumbnail) {
      thumbv = await tg.uploadFile({
        file: video.thumbnail as any,
        fileMime: 'image/jpeg'
      })
    }

    const fee = await tg.sendMedia(
      'me',
      {
        file: file,
        type: 'video',
        fileMime: file.type,
        thumb: thumbv,
        duration: video?.duration
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

    await db.insert(files).values({
      name: file.name,
      isFolder: false,
      parentId: null,
      mimeType: file.type,
      size: file.size,
      duration: video?.duration,
      userId: user?.id,
      chatId: 'me',
      fileId: fee.media?.fileId,
      messageId: fee.id
    })
  }
  const audioUpload = async (file: File) => {
    const audio = await getAudioCoverAsBlob(file)

    let thumbv = undefined

    if (audio?.thumb) {
      thumbv = await tg.uploadFile({
        file: audio?.thumb as any,
        fileMime: 'image/jpeg'
      })
    }

    const fee = await tg.sendMedia(
      'me',
      {
        file: file,
        type: 'audio',
        fileMime: file.type,
        thumb: thumbv,
        duration: audio?.duration
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

  const getMessage = async (file: Files) => {
    const chatId = folderQuery.data?.chatId ?? 'me'
    const peerId = isNumber(chatId) ? Number(chatId) : chatId
    const message: any = await tg.getMessages(peerId, [Number(file.messageId)])
    const media = message[0].media

    startDownload(media, file.name)
  }

  const deleteFile = async (file: Files) => {
    await db.delete(files).where(eq(files.id, file.id))
    await tg.deleteMessagesById(file.chatId as string, [Number(file.messageId)])
    query.refetch()
  }

  const getGroups = async () => {
    const rs: any = await tg.call({
      _: 'messages.getDialogs',
      offsetDate: 0,
      offsetId: 0,
      offsetPeer: { _: 'inputPeerEmpty' },
      limit: 100,
      hash: Long.ZERO
    })

    const groups: any[] = []
    for (const element of rs.chats) {
      console.log(element._)
      if (element._ !== 'channel') {
        // console.log(element.id,element.title,element.username,element.usernames)
        groups.push({
          value: element.id,
          label: element.title
        })
      }
    }
    setGroups(groups)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      return false
    }
    let chatId: string | number = 'me'

    if (newGroup) {
      const newTgroup = await tg.createGroup({
        title: newFolderName,
        users: [Number(user?.id)]
      })
      chatId = -newTgroup.chat.id
    }

    if (selectedGroup) {
      chatId = selectedGroup
    }

    await db.insert(files).values({
      name: newFolderName,
      isFolder: true,
      mimeType: null,
      size: 0,
      duration: 0,
      userId: user?.id,
      chatId: `${chatId}`,
      fileId: null,
      messageId: null
    })
    query.refetch()
    setIsModalOpen(false)
    setNewFolderName('')
    setNewGroup(false)
    setSelectedGroup(null)
  }
  const openCreateFolder = () => {
    setIsModalOpen(true)
  }

  const onChangeDate: DatePickerProps['onChange'] = (date, dateString) => {
    console.log(date, dateString)
    setExpirationDate(date.toDate())
  }
  const generateLink = async () => {
    const id = createId()
    await db.insert(shares).values({
      id: id,
      ownerId: user?.id ?? 0,
      fileId: selectedFile?.id,
      expirationDate: expirationDate??null
    })
    const currentDomain = window.location.origin
    const link = `${currentDomain}/share/${id}`
    setShareLink(link)
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
        <Modal
          title='Compartir archivo'
          centered
          open={shareModalOpen}
          onCancel={() => setShareModalOpen(false)}
          footer={[
            <Button key='back' onClick={() => setShareModalOpen(false)}>
              Cerrar
            </Button>
          ]}
        >
          <div>
            <DatePicker onChange={onChangeDate} />
            <br />
            <br />
            <div>
              <Flex gap='small' wrap>
                {shareLink && (
                  <LinkOutlined href={shareLink} target='_blank'>
                    {shareLink}
                  </LinkOutlined>
                )}
                <Button type='primary' onClick={generateLink}>
                  Generar enlace
                </Button>
              </Flex>
            </div>
          </div>
        </Modal>
        <Modal
          title='Crear carpeta'
          closable={{ 'aria-label': 'Custom Close Button' }}
          open={isModalOpen}
          onOk={createFolder}
          onCancel={() => setIsModalOpen(false)}
        >
          <div>
            <Input
              placeholder='Nombre de la carpeta'
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Checkbox
              value={newGroup}
              onChange={() => {
                setNewGroup(!newGroup)
              }}
            >
              Crear en telegram como un grupo
            </Checkbox>
            <br />
            <Checkbox
              value={selectGroup}
              onChange={async () => {
                if (groups.length === 0) {
                  void getGroups()
                }
                setSelectGroup(!selectGroup)
              }}
            >
              Vincular a un grupo existente
            </Checkbox>
            <br />
            <br />
            {selectGroup && (
              <>
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  placeholder='Buscar'
                  optionFilterProp='label'
                  filterSort={(optionA: any, optionB: any) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  onChange={(val) => {
                    console.log(val)
                    setSelectedGroup(val)
                  }}
                  options={groups}
                />
              </>
            )}
          </div>
        </Modal>
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
        <div style={{ float: 'left' }}>
          <Space
            direction='horizontal'
            size='middle'
            style={{ display: 'flex' }}
          >
            <Button
              type='primary'
              onClick={() => {
                openCreateFolder()
              }}
            >
              Crear Carpeta
            </Button>
            {isGridView && (
              <Button
                onClick={() => setIsGridView(false)}
                icon={<UnorderedListOutlined />}
              >
                Lista
              </Button>
            )}
            {!isGridView && (
              <Button
                onClick={() => setIsGridView(true)}
                icon={<AppstoreOutlined />}
              ></Button>
            )}
          </Space>
        </div>
      </div>
      {isGridView ? (
        <CardGridWithPagination
          items={query.data ?? []}
          pageSize={8}
          onDownload={getMessage}
          onDelete={deleteFile}
        />
      ) : (
        <Table<Files> columns={columns} dataSource={query.data ?? []} />
      )}
      <Modal closable={false} open={upload !== null} footer={null} centered>
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
            <h5>
              {upload?.uploaded}/{upload?.size}
            </h5>
          </div>
        </div>
      </Modal>
    </div>
  )
}
