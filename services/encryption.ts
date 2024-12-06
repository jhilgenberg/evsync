import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export class EncryptionService {
  private algorithm = 'aes-256-cbc'
  private key: Buffer

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY nicht konfiguriert')
    }
    
    // Überprüfe die Schlüssellänge
    if (encryptionKey.length !== 64) { // 32 Bytes = 64 Hex-Zeichen
      throw new Error('ENCRYPTION_KEY muss 32 Bytes (64 Hex-Zeichen) lang sein')
    }
    
    try {
      this.key = Buffer.from(encryptionKey, 'hex')
    } catch (error) {
      throw new Error('ENCRYPTION_KEY muss ein gültiger Hex-String sein')
    }
  }

  // Verschlüsselt ein komplettes Konfigurations-Objekt
  encryptConfig(config: Record<string, any>): Record<string, any> {
    const encryptedConfig: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(config)) {
      if (this.shouldEncrypt(key)) {
        const { encrypted, iv } = this.encrypt(value)
        encryptedConfig[`${key}_encrypted`] = encrypted
        encryptedConfig[`${key}_iv`] = iv
      } else {
        encryptedConfig[key] = value
      }
    }

    return encryptedConfig
  }

  // Entschlüsselt ein komplettes Konfigurations-Objekt
  decryptConfig(config: Record<string, any>): Record<string, any> {
    const decryptedConfig: Record<string, any> = {}
    
    for (const key of Object.keys(config)) {
      if (key.endsWith('_encrypted')) {
        const baseKey = key.replace('_encrypted', '')
        const value = config[key]
        const iv = config[`${baseKey}_iv`]
        if (value && iv) {
          decryptedConfig[baseKey] = this.decrypt(value, iv)
        }
      } else if (!key.endsWith('_iv')) {
        decryptedConfig[key] = config[key]
      }
    }

    return decryptedConfig
  }

  private shouldEncrypt(key: string): boolean {
    // Liste der zu verschlüsselnden Felder
    const sensitiveFields = ['api_key', 'username', 'password']
    return sensitiveFields.includes(key)
  }

  private encrypt(text: string): { encrypted: string; iv: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.algorithm, this.key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return {
      encrypted,
      iv: iv.toString('hex')
    }
  }

  private decrypt(encrypted: string, iv: string): string {
    const decipher = createDecipheriv(
      this.algorithm, 
      this.key, 
      Buffer.from(iv, 'hex')
    )
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}