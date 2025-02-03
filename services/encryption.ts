import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const KEY = process.env.ENCRYPTION_KEY!

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Speichere IV und AuthTag zusammen mit den verschlüsselten Daten
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encryptedText] = encryptedData.split(':')
  
  const decipher = createDecipheriv(
    ALGORITHM, 
    Buffer.from(KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export class EncryptionService {
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY nicht konfiguriert')
    }
  }

  // Verschlüsselt ein komplettes Konfigurations-Objekt
  async encryptConfig(config: Record<string, any>): Promise<Record<string, any>> {
    const encryptedConfig: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(config)) {
      if (this.shouldEncrypt(key)) {
        const { encrypted, iv } = await this.encrypt(value)
        encryptedConfig[`${key}_encrypted`] = encrypted
        encryptedConfig[`${key}_iv`] = iv
      } else {
        encryptedConfig[key] = value
      }
    }

    return encryptedConfig
  }

  // Entschlüsselt ein komplettes Konfigurations-Objekt
  async decryptConfig(config: Record<string, any>): Promise<Record<string, any>> {
    const decryptedConfig: Record<string, any> = {}
    
    for (const key of Object.keys(config)) {
      if (key.endsWith('_encrypted')) {
        const baseKey = key.replace('_encrypted', '')
        const value = config[key]
        const iv = config[`${baseKey}_iv`]
        if (value && iv) {
          decryptedConfig[baseKey] = await this.decrypt(value, iv)
        }
      } else if (!key.endsWith('_iv')) {
        decryptedConfig[key] = config[key]
      }
    }

    return decryptedConfig
  }

  private shouldEncrypt(key: string): boolean {
    const sensitiveFields = ['api_key', 'username', 'password']
    return sensitiveFields.includes(key)
  }

  private async encrypt(text: string): Promise<{ encrypted: string; iv: string }> {
    const key = await this.getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encodedText = this.encoder.encode(text)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedText
    )

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer)
    }
  }

  private async decrypt(encrypted: string, iv: string): Promise<string> {
    const key = await this.getKey()
    const encryptedData = this.base64ToArrayBuffer(encrypted)
    const ivData = this.base64ToArrayBuffer(iv)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivData
      },
      key,
      encryptedData
    )

    return this.decoder.decode(decrypted)
  }

  private async getKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(process.env.ENCRYPTION_KEY),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(16),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}