import { decrypt, encrypt } from "./crypto"

let token: string | null = null


export function setLocalStorage(key: string, value: string | Record<string, string>): void {
  let data = ''
  if (typeof value === 'string') {
    data = encrypt(value)
  } else {
    data = encrypt(JSON.stringify(value))
  }
  localStorage.setItem(key, data)
  token = null
}

export function getTokenFromLocalStorage(key: string): string | null {
  if (token === null) {
    try {
      const data = localStorage.getItem(key)

      if (data) {
        token = decrypt(data)
        return decrypt(data)
      } else {
        return null
      }
    } catch (error) {
      return null
    }
  } else {
    return token
  }
}


export function removeFromLocalStorage(key: string): void {
  localStorage.removeItem(key)
  token = null
}
