import React, { createContext, useContext, useState } from "react";
import { tg } from "../boot/telegram";
import {
  convertPdfToImages,
  getAudioCoverAsBlob,
  getImageDimensionsFromFile,
  getImageDimensionsFromPdf,
  getVideoMetadataFromFile,
} from "../utils";
import { db } from "../db";
import { files } from "../schemas";
import { useQueryClient } from "@tanstack/react-query";

export type DownloadItem = {
  id: string;
  name: string;
  type: "upload" | "download";
  progress: number;
  status: "downloading" | "done" | "error" | "uploading";
};

type DownloadManagerContextType = {
  downloads: DownloadItem[];
  startDownload: (url: string, name: string) => void;
  startUpload: (
    file: File,
    userId: number,
    chatId: string | number,
    folderId: string
  ) => void;
  rmItem: (id: string) => void;
};

const DownloadManagerContext = createContext<DownloadManagerContextType | null>(
  null
);

export const useDownloadManager = () => {
  const ctx = useContext(DownloadManagerContext);
  if (!ctx) throw new Error("Must be used inside DownloadManagerProvider");
  return ctx;
};

export const DownloadManagerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const queryClient = useQueryClient();

  const rmItem = (id: string) => {
    setDownloads((prev) => prev.filter((item) => item.id !== id));
  };
  const startDownload = async (file: any | null, name: string) => {
    const id = `${Date.now()}-${name}`;
    setDownloads((prev) => [
      ...prev,
      { id, name, progress: 0, status: "downloading", type: "download" },
    ]);

    const buffer = tg.downloadAsStream(file, {
      progressCallback: (sent, total) => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  progress: total ? Math.round((sent / total) * 100) : 100,
                }
              : d
          )
        );
      },
    });

    const response = new Response(buffer);
    const blob = await response.blob();

    // Crear URL del objeto
    const url = URL.createObjectURL(blob);

    // Crear elemento <a> para descarga
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";

    // Disparar el click
    document.body.appendChild(a);
    a.click();
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: 100, status: "done" } : d
      )
    );
    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const startUpload = async (
    file: File,
    userId: number,
    chatId: string | number,
    folder: string
  ) => {
    const folderId = folder === "" ? null : folder;
    if (file.type.includes("audio")) {
      await audioUpload(file, userId, chatId, folderId);
    } else if (file.type.includes("video")) {
      await videoUpload(file, userId, chatId, folderId);
    } else if (file.type.includes("image")) {
      await imageUpload(file, userId, chatId, folderId);
    } else if (file.type.includes("pdf")) {
      await imageUploadPdf(file, userId, chatId, folderId);
    }
    queryClient.refetchQueries({ queryKey: ["files", userId ?? 0, folderId] });
  };

  const imageUpload = async (
    file: File,
    userId: number | number,
    chatId: string | number,
    folderId: string | null
  ) => {
    const id = `${Date.now()}-${file.name}`;
    setDownloads((prev) => [
      ...prev,
      { id, name: file.name, progress: 0, status: "uploading", type: "upload" },
    ]);

    const image = await getImageDimensionsFromFile(file);
    let thumbv = undefined;

    if (image?.thumbnail) {
      thumbv = await tg.uploadFile({
        file: image.thumbnail,
        fileMime: "image/jpeg",
      });
    }
    const fee = await tg.sendMedia(
      chatId,
      {
        file: file,
        type: "document",
        fileMime: file.type,
        thumb: thumbv,
      },
      {
        progressCallback: (sent, total) => {
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    progress: total ? Math.round((sent / total) * 100) : 100,
                  }
                : d
            )
          );
        },
      }
    );
    const Ffile = fee as any;
    const fileId = Ffile.media?.fileId as string;

    await db.insert(files).values({
      name: file.name,
      isFolder: false,
      parentId: folderId ?? null,
      chatId: `${chatId}`,
      mimeType: file.type,
      size: file.size,
      userId: userId,
      fileId: fileId,
      messageId: `${fee.id}`,
    });

    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: 100, status: "done" } : d
      )
    );
  };
  const imageUploadPdf = async (
    file: File,
    userId: number | number,
    chatId: string | number,
    folderId: string | null
  ) => {
    const id = `${Date.now()}-${file.name}`;
    setDownloads((prev) => [
      ...prev,
      { id, name: file.name, progress: 0, status: "uploading", type: "upload" },
    ]);

    const firstPage = await convertPdfToImages(file);

    const image = await getImageDimensionsFromPdf(firstPage);
    let thumbv = undefined;

    if (image?.thumbnail) {
      thumbv = await tg.uploadFile({
        file: image.thumbnail,
        fileMime: "image/jpeg",
      });
    }
    const fee = await tg.sendMedia(
      chatId,
      {
        file: file,
        type: "document",
        fileMime: file.type,
        thumb: thumbv,
      },
      {
        progressCallback: (sent, total) => {
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    progress: total ? Math.round((sent / total) * 100) : 100,
                  }
                : d
            )
          );
        },
      }
    );
    const Ffile = fee as any;
    const fileId = Ffile.media?.fileId as string;

    await db.insert(files).values({
      name: file.name,
      isFolder: false,
      parentId: folderId ?? null,
      chatId: `${chatId}`,
      mimeType: file.type,
      size: file.size,
      userId: userId,
      fileId: fileId,
      messageId: `${fee.id}`,
    });

    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: 100, status: "done" } : d
      )
    );
  };

  const videoUpload = async (
    file: File,
    userId: number,
    chatId: string | number,
    folderId: string | null
  ) => {
    const id = `${Date.now()}-${file.name}`;
    setDownloads((prev) => [
      ...prev,
      { id, name: file.name, progress: 0, status: "uploading", type: "upload" },
    ]);
    const video = await getVideoMetadataFromFile(file);

    //  throw new Error("error")
    //      const tsize = await getImageDimensionsFromFile(file)
    //    const izise = await getImageDimensionsFromFile(file)

    let thumbv = undefined;

    if (video?.thumbnail) {
      thumbv = await tg.uploadFile({
        file: video.thumbnail,
        fileMime: "image/jpeg",
      });
    }

    const fee = await tg.sendMedia(
      chatId,
      {
        file: file,
        type: "video",
        fileMime: file.type,
        thumb: thumbv,
        duration: video?.duration,
      },
      {
        progressCallback: (sent, total) => {
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    progress: total ? Math.round((sent / total) * 100) : 100,
                  }
                : d
            )
          );
        },
      }
    );
    const Ffile = fee as any;
    const fileId = Ffile.media?.fileId as string;

    await db.insert(files).values({
      name: file.name,
      isFolder: false,
      parentId: folderId ?? null,
      chatId: `${chatId}`,
      mimeType: file.type,
      size: file.size,
      duration: video?.duration,
      userId: userId,
      fileId: fileId,
      messageId: `${fee.id}`,
    });

    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: 100, status: "done" } : d
      )
    );
  };
  const audioUpload = async (
    file: File,
    userId: number,
    chatId: string | number,
    folderId: string | null
  ) => {
    const id = `${Date.now()}-${file.name}`;
    setDownloads((prev) => [
      ...prev,
      { id, name: file.name, progress: 0, status: "uploading", type: "upload" },
    ]);
    const audio = await getAudioCoverAsBlob(file);

    let thumbv = undefined;

    if (audio?.thumb) {
      thumbv = await tg.uploadFile({
        file: audio?.thumb as any,
        fileMime: "image/jpeg",
      });
    }

    const fee = await tg.sendMedia(
      chatId,
      {
        file: file,
        type: "audio",
        fileMime: file.type,
        thumb: thumbv,
        duration: audio?.duration,
      },
      {
        progressCallback: (sent, total) => {
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    progress: total ? Math.round((sent / total) * 100) : 100,
                  }
                : d
            )
          );
        },
      }
    );

    const Ffile = fee as any;
    const fileId = Ffile.media?.fileId as string;

    await db.insert(files).values({
      name: file.name,
      isFolder: false,
      parentId: folderId ?? null,
      chatId: `${chatId}`,
      mimeType: file.type,
      size: file.size,
      duration: audio?.duration,
      userId: userId,
      fileId: fileId,
      messageId: `${fee.id}`,
    });

    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: 100, status: "done" } : d
      )
    );
  };

  return (
    <DownloadManagerContext.Provider
      value={{ downloads, startDownload, startUpload, rmItem }}
    >
      {children}
    </DownloadManagerContext.Provider>
  );
};
