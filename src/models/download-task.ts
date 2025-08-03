export interface DownloadTask {
  id: string;
  name: string;
  size: number;
  loaded: number;
  paused: boolean;
  controller?: AbortController;
}