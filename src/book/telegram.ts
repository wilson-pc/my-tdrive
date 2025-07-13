import { TelegramClient, tl } from "@mtcute/web";

export const tg = new TelegramClient({
    apiId: 3454052,
    apiHash: 'cba31f242e6b16063f7db572fe388cb3',
    storage: 'my-account' // will use IndexedDB-based storage
  })

 export async function checkSignedIn() {
    try {
      // Try calling any method that requires authorization
      console.log(window.MediaSource)
      return await tg.getMe()
    } catch (e) {
      if (tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) {
        // Not signed in, continue
        return null
      } else {
        // Some other error, rethrow
        throw e
      }
    }
  }