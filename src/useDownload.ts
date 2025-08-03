import { useDownloadManager } from "./conexts/downloadConext";

export const useDownload = () => {
  const { startDownload,startUpload } = useDownloadManager();
  return {
    startDownload,
    startUpload
  }
};