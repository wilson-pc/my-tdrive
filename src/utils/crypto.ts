import CryptoJS from 'crypto-js'

export function encrypt(txt: string) {
  return CryptoJS.AES.encrypt(txt, import.meta.env.VITE_CRYPTO_KEY).toString()
}

export function decrypt(txtToDecrypt: string) {
  return CryptoJS.AES.decrypt(txtToDecrypt, import.meta.env.VITE_CRYPTO_KEY).toString(CryptoJS.enc.Utf8)
}
