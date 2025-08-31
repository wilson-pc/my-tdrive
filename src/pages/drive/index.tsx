import {
  Alert,
  Button,
  DatePicker,
  Flex,
  Image,
  Input,
  List,
  Modal,
  Progress,
  Select,
  Space,
  Typography,
  type DatePickerProps,
} from "antd";
import { useEffect, useState } from "react";
import { db } from "../../db";
import { tg } from "../../boot/telegram";
import { getDuration, getFileSize, isNumber, readFileData } from "../../utils";
import { files, type Files as Flv } from "../../schemas/files";
import { useAuth } from "../../providers/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getThumbnail, saveThumbnail } from "../../utils/indexDb";
import { useDownload } from "../../useDownload";
import { Long, Message } from "@mtcute/web";
import Checkbox from "antd/es/checkbox/Checkbox";
import {
  AppstoreOutlined,
  AudioOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  ShareAltOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Link, useSearchParams } from "react-router";
import CardGridWithPagination from "../../components/carts";
import { shares } from "../../schemas";
import { createId } from "@paralleldrive/cuid2";
import { useAtom } from "jotai/react";
import { gridModeAtom } from "../../store";

const { Text } = Typography;
type Files = Flv & { thumb: string };
const { Link: LinkOutlined } = Typography;

const icons: Record<string, React.ReactNode> = {
  audio: <AudioOutlined />,
  video: <VideoCameraOutlined />,
  image: <PictureOutlined />,
  document: <FileTextOutlined />,
  folder: <FolderOpenOutlined />,
};

navigator.serviceWorker.addEventListener("message", async (e) => {
  if (e.data.type !== "REQUEST_STREAM") return;

  const { file, params } = e.data;
  const stream = tg.downloadAsStream(file, params);

  // Devolvemos el stream por el MessagePort
  e.ports[0].postMessage({ stream }, [stream]);
});

function uint8ArrayToBase64(
  data: Uint8Array,
  mimeType = "image/jpeg"
): Promise<string> {
  const blob = new Blob([data], { type: mimeType });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string); // Esto será algo como: "data:image/jpeg;base64,..."
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(blob);
  });
}
export default function Index() {
  const { user, dUser } = useAuth();
  const [searchParams] = useSearchParams();
  const { startDownload, startUpload } = useDownload();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newGroup, setNewGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | string | null>(
    null
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isGridView, setIsGridView] = useAtom(gridModeAtom);
  const [selectGroup, setSelectGroup] = useState<boolean>(false);
  const [groups, setGroups] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState<Files | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const [requeridLoginServer, setRequeridLoginServer] = useState(false);

  const folderId = searchParams.get("folderId");
  const folderQuery = useQuery({
    queryKey: ["folder", folderId],
    queryFn: async () => {
      if (user) {
        if (folderId) {
          const rs = await db.query.files.findFirst({
            where: eq(files.id, folderId),
          });
          return rs ?? null;
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

  const query = useQuery<Files[]>({
    queryKey: ["files", user?.id ?? 0, folderId],
    queryFn: async () => {
      console.log(folderId);
      const normalizedFolderId =
        folderId === undefined || folderId === "" ? null : folderId;
      console.log(normalizedFolderId);
      if (user) {
        const rs = await db.query.files.findMany({
          where: and(
            eq(files.userId, user?.id ?? 0),
            normalizedFolderId === null
              ? isNull(files.parentId)
              : eq(files.parentId, folderId ?? "")
          ),
          orderBy: [desc(files.name)],
        });
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
  });
  const [upload] = useState<{
    size: string;
    uploaded: string;
    percentage: number;
  } | null>(null);
  const queryClient = useQueryClient();

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
        const fils: Record<string, any> = {};

        const chatId = folderQuery.data?.chatId ?? "me";
        const peerId = isNumber(chatId) ? Number(chatId) : chatId;

        const message = await tg.getMessages(
          peerId,
          fles
            .filter((f) => f.messageId !== null)
            .map((f) => Number(f.messageId))
        );
        const messagesRecord: Record<number, Message | null> = {};
        for (const m of message) {
          if (m) {
            messagesRecord[m.id] = m;
          }
        }
        for (const file of fles) {
          if (file.isFolder === false) {
            const cached = await getThumbnail(`${file.messageId}`);
            const message: any = messagesRecord[Number(file.messageId)];

            if (!cached) {
              //console.log(message[0].media.thumbnails[1].location)
              const buff: any = await tg.call({
                _: "upload.getFile",
                location: message.media.thumbnails[1].location,
                offset: 0,
                limit: 32768,
              });

              //  const thumb= await tg.downloadAsBuffer("AAMCAQADGQEAAQr8D2hYRuCbTGUauAOmWC51wbmWTGRhAAIiCAAC-zHBRrtM63rZ8OINAQAHbQADNgQ")
              const base64 = await uint8ArrayToBase64(buff.bytes);

              await saveThumbnail(`${file.messageId}`, buff.bytes);
              fils[file.messageId ?? ""] = base64;
            } else {
              const base64 = await uint8ArrayToBase64(cached);
              fils[file.messageId ?? ""] = base64;
            }
          } else {
            if (file.messageId) {
              const cached = await getThumbnail(`${file.messageId}`);
              const message: any = messagesRecord[Number(file.messageId)];

              if (!cached) {
                //console.log(message[0].media.thumbnails[1].location)
                const buff: any = await tg.call({
                  _: "upload.getFile",
                  location: message.media.location,
                  offset: 0,
                  limit: 32768,
                });

                //  const thumb= await tg.downloadAsBuffer("AAMCAQADGQEAAQr8D2hYRuCbTGUauAOmWC51wbmWTGRhAAIiCAAC-zHBRrtM63rZ8OINAQAHbQADNgQ")
                const base64 = await uint8ArrayToBase64(buff.bytes);

                await saveThumbnail(`${file.messageId}`, buff.bytes);
                fils[file.messageId ?? ""] = base64;
              } else {
                const base64 = await uint8ArrayToBase64(cached);
                fils[file.messageId ?? ""] = base64;
              }
            }
          }
        }

        queryClient.setQueryData(
          ["files", user?.id ?? 0, folderId],
          (oldData: Files[]) => {
            if (!oldData) return [];

            return oldData.map((item) => {
              if (item.messageId) {
                return { ...item, thumb: fils[item.messageId ?? ""] };
              }
              return item;
            });
          }
        );
      }
      void getThumb(query.data);
    }
  }, [query.data]);

  const onChangeCover = async (e: any) => {
    const file: File = e.target.files[0];
    if (file && selectedFile) {
      const chatId = folderQuery.data?.chatId ?? "me";
      const peerId = isNumber(chatId) ? Number(chatId) : chatId;
      const image = await readFileData(file);
      queryClient.setQueryData(
        ["files", user?.id ?? 0, folderId],
        (oldData: Files[]) => {
          if (!oldData) return [];

          return oldData.map((item) => {
            if (item.id === selectedFile.id) {
              return { ...item, thumb: image };
            }
            return item;
          });
        }
      );
      const fee = await tg.sendMedia(peerId ?? 0, {
        file: file,
        type: "photo",
        fileMime: file.type,
        caption: `Caratula de ${selectedFile?.name}`,
      });

      await db
        .update(files)
        .set({
          messageId: `${fee.id}`,
        })
        .where(eq(files.id, selectedFile.id));
    }
  };

  const onChange = async (e: any) => {
    const file: File = e.target.files[0];
    if (file) {
      const chatId = folderQuery.data?.chatId ?? "me";
      const peerId = isNumber(chatId) ? Number(chatId) : chatId;
      //  const de= await tg.getPeer(peerId)
      //console.log(de)
      /*
  const de= await tg.getPeer(peerId)
  console.log(de)
  const peer = await tg.resolvePeer(peerId)
  console.log(peer)
*/
      //return
      startUpload(file, user?.id ?? 0, peerId, folderId ?? "");
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
  };

  const getMessage = async (file: Files) => {
    const chatId = folderQuery.data?.chatId ?? "me";
    const peerId = isNumber(chatId) ? Number(chatId) : chatId;
    const message: any = await tg.getMessages(peerId, [Number(file.messageId)]);
    const media = message[0].media;

    startDownload(media, file.name);
  };

  const deleteFile = async (file: Files) => {
    await db.delete(files).where(eq(files.id, file.id));

    const chatId = folderQuery.data?.chatId ?? "me";
    const peerId = isNumber(chatId) ? Number(chatId) : chatId;
    await tg.deleteMessagesById(peerId as string, [Number(file.messageId)]);
    query.refetch();
  };

  const getGroups = async () => {
    const rs: any = await tg.call({
      _: "messages.getDialogs",
      offsetDate: 0,
      offsetId: 0,
      offsetPeer: { _: "inputPeerEmpty" },
      limit: 100,
      hash: Long.ZERO,
    });

    const groups: any[] = [];
    for (const element of rs.chats) {
      console.log(element._);
      if (element._ !== "channel") {
        // console.log(element.id,element.title,element.username,element.usernames)
        groups.push({
          value: element.id,
          label: element.title,
        });
      }
    }
    setGroups(groups);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      return false;
    }
    let chatId = folderQuery.data?.chatId ?? "me";

    if (newGroup) {
      const newTgroup = await tg.createGroup({
        title: newFolderName,
        users: [Number(user?.id)],
      });
      chatId = String(newTgroup.chat.id);
    }

    if (selectedGroup) {
      chatId = String(selectedGroup);
    }

    await db.insert(files).values({
      name: newFolderName,
      isFolder: true,
      mimeType: null,
      size: 0,
      duration: 0,
      userId: user?.id,
      chatId: String(chatId),
      fileId: null,
      messageId: null,
      parentId: folderId ?? null,
    });
    query.refetch();
    setIsModalOpen(false);
    setNewFolderName("");
    setNewGroup(false);
    setSelectedGroup(null);
  };
  const openCreateFolder = () => {
    setIsModalOpen(true);
  };

  const onChangeDate: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
    setExpirationDate(date.toDate());
  };
  const generateLink = async () => {
    const id = createId();
    await db.insert(shares).values({
      id: id,
      ownerId: user?.id ?? 0,
      fileId: selectedFile?.id,
      expirationDate: expirationDate ?? null,
    });
    const currentDomain = window.location.origin;
    const link = `${currentDomain}/share/${id}`;
    setShareLink(link);
  };
  return (
    <div className="p-2">
      <input
        style={{ display: "none" }}
        type="file"
        id="file-upload"
        onChange={onChange}
      ></input>

      <input
        style={{ display: "none" }}
        type="file"
        id="file-upload-cover"
        onChange={onChangeCover}
      ></input>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {shareModalOpen && (
          <Modal
            title="Compartir archivo"
            centered
            open={shareModalOpen}
            onCancel={() => setShareModalOpen(false)}
            footer={[
              <Button key="back" onClick={() => setShareModalOpen(false)}>
                Cerrar
              </Button>,
            ]}
          >
            <div>
              <DatePicker onChange={onChangeDate} />
              <br />
              <br />
              <div>
                <Flex gap="small" wrap>
                  {shareLink && (
                    <LinkOutlined href={shareLink} target="_blank">
                      {shareLink}
                    </LinkOutlined>
                  )}
                  <Button type="primary" onClick={generateLink}>
                    Generar enlace
                  </Button>
                </Flex>
              </div>
            </div>
          </Modal>
        )}

        <Modal
          title="Requisito para compartir"
          closable={{ "aria-label": "Custom Close Button" }}
          open={requeridLoginServer}
          onOk={() => setRequeridLoginServer(false)}
          onCancel={() => setRequeridLoginServer(false)}
        >
          <div>
            <Alert message="Para compartir archivos y carpeta es necesario que inice session el servidor" />
            <br />
            <Button type="primary">
              <Link to={`/server-login`}>Iniciar sesión</Link>
            </Button>
          </div>
        </Modal>
        <Modal
          title="Crear carpeta"
          closable={{ "aria-label": "Custom Close Button" }}
          open={isModalOpen}
          onOk={createFolder}
          onCancel={() => setIsModalOpen(false)}
        >
          <div>
            <Input
              placeholder="Nombre de la carpeta"
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Checkbox
              value={newGroup}
              onChange={() => {
                setNewGroup(!newGroup);
              }}
            >
              Crear en telegram como un grupo
            </Checkbox>
            <br />
            <Checkbox
              value={selectGroup}
              onChange={async () => {
                if (groups.length === 0) {
                  void getGroups();
                }
                setSelectGroup(!selectGroup);
              }}
            >
              Vincular a un grupo existente
            </Checkbox>
            <br />
            <br />
            {selectGroup && (
              <>
                <Select
                  style={{ width: "100%" }}
                  showSearch
                  placeholder="Buscar"
                  optionFilterProp="label"
                  filterSort={(optionA: any, optionB: any) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  onChange={(val) => {
                    console.log(val);
                    setSelectedGroup(val);
                  }}
                  options={groups}
                />
              </>
            )}
          </div>
        </Modal>
        <div style={{ float: "right" }}>
          <Button
            type="primary"
            onClick={() => {
              const input = document.getElementById("file-upload");
              input?.click();
            }}
            style={{ marginBottom: 16 }}
          >
            subir archivo
          </Button>
        </div>
        <div style={{ float: "left" }}>
          <Space
            direction="horizontal"
            size="middle"
            style={{ display: "flex" }}
          >
            <Button
              type="primary"
              onClick={() => {
                openCreateFolder();
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
          onShare={(file: Files) => {
            if (dUser?.serverSession) {
              setSelectedFile(file);
              setShareModalOpen(true);
            } else {
              setRequeridLoginServer(true);
            }
          }}
          onChangeIcon={(file: Files) => {
            setSelectedFile(file);
            const input = document.getElementById("file-upload-cover");
            input?.click();
          }}
        />
      ) : (
        <div
          style={{
            backgroundColor: "#f5f5f5",
          }}
        >
          <List
            className="demo-loadmore-list"
            itemLayout="horizontal"
            dataSource={query.data ?? []}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.isFolder ? (
                      <>
                        {item.thumb ? (
                          <img
                            alt={item.name}
                            src={item.thumb}
                            style={{
                              height: 80,
                              width: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FolderOpenOutlined
                            style={{ fontSize: 80, color: "#999" }}
                          />
                        )}
                      </>
                    ) : item.thumb ? (
                      <Image src={item.thumb} height={80} preview={false} />
                    ) : (
                      icons[item.mimeType?.split("/")[0] ?? "folder"]
                    )
                  }
                  title={
                    item.isFolder ? (
                      <>
                        <Link to={`?folderId=${item.id}`}>
                          {item.name}
                        </Link>{" "}
                      </>
                    ) : (
                      <Link to={`/file/${item.id}`}> {item.name} </Link>
                    )
                  }
                  description={
                    item.isFolder ? (
                      <>
                        {" "}
                        <Text type="secondary">
                          <strong>creacion:</strong>{" "}
                          {item.createdAt.toLocaleString()}
                        </Text>
                      </>
                    ) : (
                      <>
                        <span>
                          {" "}
                          {getFileSize(item?.size ?? 0)} - {item.mimeType}{" "}
                        </span>
                        <br />
                        <span> {item.createdAt.toLocaleString()}</span>
                        <br />
                        {item.duration && (
                          <>
                            <Text type="secondary">
                              <strong>Duración:</strong>{" "}
                              {getDuration(item?.duration ?? 0)}
                            </Text>
                          </>
                        )}
                      </>
                    )
                  }
                />
                <Flex
                  gap="small"
                  wrap
                  style={{ alignItems: "center", margin: 0, padding: 0 }}
                >
                  <Button
                    type="link"
                    onClick={() => getMessage(item as Files)}
                    icon={<DownloadOutlined />}
                  >
                    Descargar
                  </Button>
                  <Button
                    type="link"
                    onClick={() => deleteFile(item as Files)}
                    icon={<DeleteOutlined />}
                  >
                    Borrar
                  </Button>
                  <Button
                    type="link"
                    onClick={() => {
                      setShareLink("");
                      if (dUser?.serverSession) {
                        setSelectedFile(item);
                        setShareModalOpen(true);
                      } else {
                        setRequeridLoginServer(true);
                      }
                    }}
                    icon={<ShareAltOutlined />}
                  >
                    Compartir
                  </Button>
                </Flex>
              </List.Item>
            )}
          />
        </div>
      )}
      <Modal closable={false} open={upload !== null} footer={null} centered>
        <div style={{ textAlign: "center" }}>
          <div>
            <h3>Subiendo archivo</h3>
          </div>
          <div>
            <Progress
              type="circle"
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
  );
}
