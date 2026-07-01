const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function b64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function fromB64(value: string) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey("raw", toArrayBuffer(encoder.encode(passphrase)), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: 150000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptText(plainText: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(encoder.encode(plainText)))
  return { ciphertext: b64(new Uint8Array(cipher)), iv: b64(iv), salt: b64(salt), algorithm: "AES-GCM/PBKDF2-SHA256" }
}

export async function decryptText(ciphertext: string, iv: string, salt: string, passphrase: string) {
  const key = await deriveKey(passphrase, fromB64(salt))
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(fromB64(iv)) }, key, toArrayBuffer(fromB64(ciphertext)))
  return decoder.decode(plain)
}
