function openThumbnailDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ThumbnailDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("thumbnails")) {
        db.createObjectStore("thumbnails", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveThumbnail(id: string, blob: Blob): Promise<void> {
  const db = await openThumbnailDB();
  const tx = db.transaction("thumbnails", "readwrite");
  const store = tx.objectStore("thumbnails");

  store.put({ id, image: blob });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getThumbnail(id: string): Promise<Uint8Array | null> {
  const db = await openThumbnailDB();
  const tx = db.transaction("thumbnails", "readonly");
  const store = tx.objectStore("thumbnails");

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.image ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}