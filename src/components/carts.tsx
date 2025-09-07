import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Pagination,
  Space,
  Dropdown,
  Typography,
  Button,
} from "antd";
import { type Files as Flv } from "../schemas/files";
import {
  AudioOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  PictureOutlined,
  ShareAltOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Link } from "react-router";
import { getDuration, getFileSize } from "../utils";

const { Text } = Typography;

type Files = Flv & { thumb: string };

type Props = {
  items: Files[];
  pageSize?: number;
  onDelete: (file: Files) => void;
  onDownload: (file: Files) => void;
  onShare: (file: Files) => void;
  onChangeIcon: (file: Files) => void;
};

const icons: Record<string, React.ReactNode> = {
  audio: <AudioOutlined style={{ fontSize: 18, color: "#1677ff" }} />,
  video: <VideoCameraOutlined style={{ fontSize: 18, color: "#1677ff" }} />,
  image: <PictureOutlined style={{ fontSize: 18, color: "#1677ff" }} />,
  document: <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />,
  folder: <FolderOpenOutlined style={{ fontSize: 18, color: "#999" }} />,
};

const CardGridWithPagination: React.FC<Props> = ({
  items,
  pageSize = 8,
  onDownload,
  onDelete,
  onShare,
  onChangeIcon,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const currentItems = items.slice(start, end);

  return (
    <>
      <Row gutter={[16, 16]} justify="start" align="top" wrap>
        {currentItems.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              hoverable
              extra={
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: item.isFolder
                      ? [
                          {
                            icon: <ShareAltOutlined />,
                            label: (
                              <a
                                onClick={() => {
                                  onShare(item);
                                }}
                              >
                                Comparitr
                              </a>
                            ),
                            key: "3",
                          },
                          {
                            label: (
                              <a
                                onClick={() => {
                                  onChangeIcon(item);
                                }}
                              >
                                Cambiar caratula
                              </a>
                            ),
                            key: "4",
                          },
                        ]
                      : [
                          {
                            icon: <DownloadOutlined />,
                            label: (
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  onDownload(item);
                                }}
                              >
                                Descargar{" "}
                              </a>
                            ),
                            key: "0",
                          },
                          {
                            icon: <DeleteOutlined />,
                            label: (
                              <a
                                onClick={(e) => {
                                  e.preventDefault();
                                  onDelete(item);
                                }}
                              >
                                Borrar{" "}
                              </a>
                            ),
                            key: "1",
                          },
                        ],
                  }}
                >
                  <a onClick={(e) => e.preventDefault()}>
                    <Space>
                      <MoreOutlined />
                    </Space>
                  </a>
                </Dropdown>
              }
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {item.thumb &&
                    icons[item.mimeType?.split("/")[0] ?? "folder"]}{" "}
                  <span>{item.name}</span>{" "}
                </div>
              }
              style={{
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                maxWidth: 260,
                height: 400,
                margin: "0 auto",
                paddingBottom: 19,
              }}
              cover={
                item.isFolder ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      height: 160,
                    }}
                  >
                    <Link to={`?folderId=${item.id}`}>
                      {item.thumb ? (
                        <img
                          alt={item.name}
                          src={item.thumb}
                          style={{
                            height: 160,
                            width: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FolderOpenOutlined
                          style={{ fontSize: 80, color: "#999" }}
                        />
                      )}
                    </Link>
                  </div>
                ) : item.thumb ? (
                  <Link to={`/file/${item.id}`}>
                    <img
                      alt={item.name}
                      src={item.thumb}
                      style={{
                        height: 160,
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Link>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      height: 160,
                    }}
                  >
                    {icons[item.mimeType?.split("/")[0] ?? "folder"]}
                  </div>
                )
              }
              actions={[
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={() => onDownload(item)}
                />,
                <Button
                  type="text"
                  color="primary"
                  icon={<ShareAltOutlined />}
                  onClick={() => onShare(item)}
                />,
              ]}
            >
              <Card.Meta
                description={
                  !item.isFolder ? (
                    <>
                      <Text type="secondary">
                        <strong>Tamaño:</strong> {getFileSize(item.size ?? 0)}
                      </Text>
                      <br />
                      <Text type="secondary">
                        <strong>Tipo:</strong> {item.mimeType}
                      </Text>
                      {item.duration && (
                        <>
                          <br />
                          <Text type="secondary">
                            <strong>Duración:</strong>{" "}
                            {getDuration(item.duration)}
                          </Text>
                        </>
                      )}
                      <br />
                      <Text type="secondary">
                        <strong>Fecha:</strong>{" "}
                        {item.createdAt.toLocaleString()}
                      </Text>
                    </>
                  ) : (
                    <>
                      <br />
                      <Text type="secondary">
                        <strong>Fecha:</strong>{" "}
                        {item.createdAt.toLocaleString()}
                      </Text>
                    </>
                  )
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={items.length}
          onChange={setCurrentPage}
          showSizeChanger={false}
        />
      </div>
    </>
  );
};

export default CardGridWithPagination;
