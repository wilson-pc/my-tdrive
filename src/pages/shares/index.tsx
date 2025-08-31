import { Card, Button, Typography, List, Skeleton, Flex } from "antd";
import {
  AudioOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Link, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { files, shares, type Files } from "../../schemas";

import { getDuration, getFileSize } from "../../utils";
const icons: Record<string, React.ReactNode> = {
  audio: <AudioOutlined />,
  video: <VideoCameraOutlined />,
  image: <PictureOutlined />,
  document: <FileTextOutlined />,
  folder: <FolderOpenOutlined />,
};
const { Title, Text, Link: LinkOutlined } = Typography;

const SharePage = () => {
  const { shareId } = useParams();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("folderId");

  const { data, isLoading } = useQuery<Files | null>({
    queryKey: ["share", shareId],
    queryFn: async () => {
      if (shareId) {
        const rs = await db.query.shares.findFirst({
          where: eq(shares.id, shareId),
        });
        console.log(rs);
        if (rs) {
          if (
            rs.expirationDate &&
            new Date(rs.expirationDate).getTime() < new Date().getTime()
          ) {
            await db.delete(shares).where(eq(shares.id, shareId));
            return null;
          } else {
            const file = await db.query.files.findFirst({
              where: eq(files.id, rs.fileId ?? ""),
            });
            if (file) {
              return file;
            } else {
              return null;
            }
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
  const queryFolder = useQuery<Files[]>({
    queryKey: ["share-folder", data?.userId ?? 0, data?.id, folderId],
    queryFn: async () => {
      if (data) {
        const rs = await db.query.files.findMany({
          where: and(eq(files.parentId, folderId ? folderId : data?.id)),
        });
        console.log(rs);
        return rs
          .sort((a, b) => {
            // Si a es folder y b no, a va antes
            if (a.isFolder && !b.isFolder) return -1;
            // Si b es folder y a no, b va antes
            if (!a.isFolder && b.isFolder) return 1;
            // Si ambos son iguales respecto a isFolder, no cambia orden
            return 0;
          })
          .map((item) => {
            if (item.isFolder) {
              return { ...item, thumb: "" };
            } else {
              return { ...item, thumb: "" };
            }
          });
      } else {
        return [];
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: !!data?.id,
  });

  const handleDownload = async (id: string) => {
    const a = document.getElementById("download-link");
    a?.setAttribute(
      "href",
      `${import.meta.env.VITE_API_URL}/file/download/${id}`
    );
    a?.click();
  };

  return (
    <Flex
      style={{
        height: "100vh",
        background: "#f5f5f5",
        paddingTop: 100, // sube el card hacia arriba
      }}
      justify="center"
      align="flex-start" // alinea arriba
    >
      {" "}
      <Card
        title="Archivos"
        style={{
          width: 700, // más ancho
          minHeight: 400, // más alto
        }}
      >
        <a href="" id="download-link"></a>
        {data && (
          <>
            {" "}
            {data.isFolder === false && (
              <div
                style={{
                  textAlign: "center",
                  alignContent: "center",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                }}
              >
                <Card
                  style={{}}
                  actions={[
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      size="large"
                      block
                      onClick={() => handleDownload(data?.id)}
                    >
                      Descargar
                    </Button>,
                  ]}
                >
                  <Title level={4}>{data?.name}</Title>
                  <Text type="secondary">
                    <strong>Tamaño:</strong> {getFileSize(data?.size ?? 0)}
                  </Text>
                  <br />
                  <Text type="secondary">
                    <strong>Tipo:</strong> {data?.mimeType}
                  </Text>
                  {data.duration && (
                    <>
                      <br />
                      <Text type="secondary">
                        <strong>Duración:</strong>{" "}
                        {getDuration(data?.duration ?? 0)}
                      </Text>
                    </>
                  )}
                </Card>
              </div>
            )}
            {data.isFolder === true && (
              <List
                className="demo-loadmore-list"
                loading={queryFolder.isLoading}
                itemLayout="horizontal"
                dataSource={queryFolder?.data ?? []}
                renderItem={(item) => (
                  <List.Item>
                    <Skeleton
                      avatar
                      title={false}
                      loading={queryFolder.isLoading}
                      active
                    >
                      <List.Item.Meta
                        avatar={icons[item.mimeType?.split("/")[0] ?? "folder"]}
                        title={
                          item.isFolder ? (
                            <>
                              <Link to={`?folderId=${item.id}`}>
                                {item.name}
                              </Link>{" "}
                            </>
                          ) : (
                            <LinkOutlined>{item.name}</LinkOutlined>
                          )
                        }
                        description={
                          item.isFolder ? (
                            <></>
                          ) : (
                            <>
                              <span>
                                {" "}
                                {getFileSize(item?.size ?? 0)} -{" "}
                                {item.mimeType}{" "}
                              </span>
                              <br />
                              {item.duration && (
                                <>
                                  <Text type="secondary">
                                    <strong>Duración:</strong>{" "}
                                    {getDuration(item?.duration ?? 0)}
                                  </Text>
                                </>
                              )}
                              &nbsp;&nbsp;
                              {/* Botón de descarga con icono */}
                              <Button
                                type="link"
                                onClick={() => handleDownload(item?.id)}
                                icon={<DownloadOutlined />}
                              >
                                Descargar
                              </Button>
                            </>
                          )
                        }
                      />
                    </Skeleton>
                  </List.Item>
                )}
              />
            )}
          </>
        )}

        {data === null && isLoading === false && (
          <div>Recurso compartido no encontrado</div>
        )}
      </Card>
    </Flex>
  );
};

export default SharePage;
