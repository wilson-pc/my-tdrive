import React, { useState } from 'react'
import { Card, Row, Col, Pagination, Space, Dropdown, Typography } from 'antd'
import { type Files as Flv } from '../schemas/files'
import {
  AudioOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  PictureOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import { Link } from 'react-router'
import { getDuration, getFileSize } from '../utils'

const { Text } = Typography

type Files = Flv & { thumb: string }

type Props = {
  items: Files[]
  pageSize?: number
  onDelete: (file: Files) => void
  onDownload: (file: Files) => void
}

const icons: Record<string, React.ReactNode> = {
  audio: <AudioOutlined />,
  video: <VideoCameraOutlined />,
  image: <PictureOutlined />,
  document: <FileTextOutlined />,
  folder: <FolderOpenOutlined />
}

const CardGridWithPagination: React.FC<Props> = ({
  items,
  pageSize = 8,
  onDownload,
  onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1)

  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const currentItems = items.slice(start, end)

  return (
    <>
      <Row gutter={[16, 16]}>
        {currentItems.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              extra={
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        icon: <DownloadOutlined />,
                        label: (
                          <a
                            onClick={(e) => {
                              e.preventDefault()
                              onDownload(item)
                            }}
                          >
                            Descargar
                          </a>
                        ),
                        key: '0'
                      },
                      {
                        icon: <DeleteOutlined />,
                        label: (
                          <a
                            onClick={(e) => {
                              e.preventDefault()
                              onDelete(item)
                            }}
                          >
                            Borrar
                          </a>
                        ),
                        key: '1'
                      }
                    ]
                  }}
                >
                  <a onClick={(e) => e.preventDefault()}>
                    <Space>
                      <MoreOutlined />
                    </Space>
                  </a>
                </Dropdown>
              }
              cover={
                item.isFolder ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Link to={`?folderId=${item.id}`}>
                      <FolderOpenOutlined
                        style={{ fontSize: 80, color: '#999' }}
                      />
                    </Link>
                  </div>
                ) : item.thumb ? (
                  <Link to={`/file/${item.id}`}>
                    <img
                      alt={item.name}
                      src={item.thumb}
                      style={{ maxHeight: 180, objectFit: 'cover' }}
                    />
                  </Link>
                ) : null
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.thumb &&
                    icons[item.mimeType?.split('/')[0] ?? 'folder']}
                  <span>{item.name}</span>
                </div>
              }
            >
              {item.isFolder === false && (
                <div style={{ paddingTop: 0 }}>
                  <Text type='secondary'>
                    <strong>Tamaño:</strong> {getFileSize(item.size ?? 0)}
                  </Text>
                  <br />
                  <Text type='secondary'>
                    <strong>Tipo:</strong> {item.mimeType}
                  </Text>
                  {item.duration && (
                    <>
                      <br />
                      <Text type='secondary'>
                        <strong>Duración:</strong>{' '}
                        {getDuration(item?.duration ?? 0)}
                      </Text>
                    </>
                  )}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={items.length}
          onChange={setCurrentPage}
          showSizeChanger={false}
        />
      </div>
    </>
  )
}

export default CardGridWithPagination
