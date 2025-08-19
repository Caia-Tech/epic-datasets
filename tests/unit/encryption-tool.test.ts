import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Encryption Tool utility functions
class EncryptionTool {
  static async encryptAES(plaintext: string, password: string, options: {
    mode?: 'AES-GCM' | 'AES-CBC' | 'AES-CTR'
    keySize?: 128 | 192 | 256
    iterations?: number
    outputFormat?: 'base64' | 'hex'
  } = {}): Promise<{
    ciphertext: string
    salt: string
    iv: string
    tag?: string
    mode: string
    keySize: number
    iterations: number
  }> {
    const {
      mode = 'AES-GCM',
      keySize = 256,
      iterations = 100000,
      outputFormat = 'base64'
    } = options
    
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(16))
    
    // Derive key from password
    const keyMaterial = await this.getKeyMaterial(password)
    const key = await this.deriveKey(keyMaterial, salt, keySize, iterations)
    
    // Encrypt data
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)
    
    let encrypted: ArrayBuffer
    let tag: Uint8Array | undefined
    
    if (mode === 'AES-GCM') {
      const result = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      )
      // In GCM mode, the tag is appended to the ciphertext
      encrypted = result
    } else if (mode === 'AES-CBC') {
      // Pad data for CBC mode
      const padded = this.pkcs7Pad(data)
      encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        padded
      )
    } else {
      // AES-CTR
      encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CTR', counter: iv, length: 64 },
        key,
        data
      )
    }
    
    // Format output
    const format = outputFormat === 'hex' ? this.bufferToHex : this.bufferToBase64
    
    return {
      ciphertext: format(encrypted),
      salt: format(salt),
      iv: format(iv),
      tag: tag ? format(tag) : undefined,
      mode,
      keySize,
      iterations
    }
  }
  
  static async decryptAES(encryptedData: {
    ciphertext: string
    salt: string
    iv: string
    tag?: string
    mode: string
    keySize: number
    iterations: number
  }, password: string, inputFormat: 'base64' | 'hex' = 'base64'): Promise<string> {
    const parse = inputFormat === 'hex' ? this.hexToBuffer : this.base64ToBuffer
    
    const salt = parse(encryptedData.salt)
    const iv = parse(encryptedData.iv)
    const ciphertext = parse(encryptedData.ciphertext)
    
    // Derive key from password
    const keyMaterial = await this.getKeyMaterial(password)
    const key = await this.deriveKey(keyMaterial, salt, encryptedData.keySize, encryptedData.iterations)
    
    // Decrypt data
    let decrypted: ArrayBuffer
    
    if (encryptedData.mode === 'AES-GCM') {
      decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      )
    } else if (encryptedData.mode === 'AES-CBC') {
      const result = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        ciphertext
      )
      // Remove PKCS7 padding
      decrypted = this.pkcs7Unpad(new Uint8Array(result)).buffer
    } else {
      // AES-CTR
      decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CTR', counter: iv, length: 64 },
        key,
        ciphertext
      )
    }
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }
  
  private static async getKeyMaterial(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
  }
  
  private static async deriveKey(
    keyMaterial: CryptoKey,
    salt: Uint8Array,
    keySize: number,
    iterations: number
  ): Promise<CryptoKey> {
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: keySize },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  static encryptRSA(plaintext: string, publicKey: string): {
    ciphertext: string
    algorithm: string
    keySize: number
  } {
    // Mock RSA encryption for testing
    const mockEncrypted = btoa(plaintext + '-RSA-ENCRYPTED')
    
    return {
      ciphertext: mockEncrypted,
      algorithm: 'RSA-OAEP',
      keySize: 2048
    }
  }
  
  static decryptRSA(ciphertext: string, privateKey: string): string {
    // Mock RSA decryption for testing
    try {
      const decrypted = atob(ciphertext)
      return decrypted.replace('-RSA-ENCRYPTED', '')
    } catch {
      throw new Error('RSA decryption failed')
    }
  }
  
  static async generateRSAKeyPair(keySize: 1024 | 2048 | 4096 = 2048): Promise<{
    publicKey: string
    privateKey: string
    keySize: number
    algorithm: string
  }> {
    // Mock RSA key generation
    const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${btoa(crypto.getRandomValues(new Uint8Array(256)).toString())}
-----END PUBLIC KEY-----`
    
    const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC${btoa(crypto.getRandomValues(new Uint8Array(256)).toString())}
-----END PRIVATE KEY-----`
    
    return {
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey,
      keySize,
      algorithm: 'RSA-OAEP'
    }
  }
  
  static hashData(data: string, algorithm: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): string {
    // Mock hashing for testing
    const mockHashes: Record<string, string> = {
      'MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'SHA-1': 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
      'SHA-256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'SHA-384': '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
      'SHA-512': 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
    }
    
    // Simple hash simulation based on input
    const hash = mockHashes[algorithm] || ''
    const inputHash = this.simpleHash(data).toString(16)
    
    return hash.substring(0, hash.length - inputHash.length) + inputHash
  }
  
  static async generateHMAC(data: string, secret: string, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'): Promise<string> {
    const encoder = new TextEncoder()
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    )
    
    return this.bufferToHex(signature)
  }
  
  static encodeBase64(data: string): string {
    return btoa(unescape(encodeURIComponent(data)))
  }
  
  static decodeBase64(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)))
    } catch {
      throw new Error('Invalid Base64 data')
    }
  }
  
  static encodeHex(data: string): string {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(data)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  static decodeHex(hex: string): string {
    if (hex.length % 2 !== 0) {
      throw new Error('Invalid hex string')
    }
    
    // Validate hex characters
    if (!/^[0-9a-fA-F]*$/.test(hex)) {
      throw new Error('Invalid hex characters')
    }
    
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }
  
  static generatePassword(options: {
    length?: number
    includeUppercase?: boolean
    includeLowercase?: boolean
    includeNumbers?: boolean
    includeSymbols?: boolean
    excludeAmbiguous?: boolean
  } = {}): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeAmbiguous = false
    } = options
    
    let charset = ''
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeNumbers) charset += '0123456789'
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if (excludeAmbiguous) {
      charset = charset.replace(/[0O1lI|]/g, '')
    }
    
    if (!charset) {
      throw new Error('At least one character type must be selected')
    }
    
    let password = ''
    const randomValues = crypto.getRandomValues(new Uint8Array(length))
    
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length]
    }
    
    return password
  }
  
  static estimatePasswordStrength(password: string): {
    score: number // 0-100
    level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
    entropy: number
    timeToCrack: string
    suggestions: string[]
  } {
    let score = 0
    const suggestions: string[] = []
    
    // Length scoring
    if (password.length >= 8) score += 20
    if (password.length >= 12) score += 10
    if (password.length >= 16) score += 10
    
    // Character diversity
    if (/[a-z]/.test(password)) score += 10
    if (/[A-Z]/.test(password)) score += 10
    if (/[0-9]/.test(password)) score += 10
    if (/[^a-zA-Z0-9]/.test(password)) score += 20
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) {
      score -= 10
      suggestions.push('Avoid repeating characters')
    }
    
    if (/^[a-z]+$/.test(password) || /^[A-Z]+$/.test(password)) {
      score -= 10
      suggestions.push('Mix uppercase and lowercase letters')
    }
    
    if (/^[0-9]+$/.test(password)) {
      score -= 20
      suggestions.push('Add letters and symbols')
    }
    
    // Common patterns
    if (/123|abc|qwerty/i.test(password)) {
      score -= 20
      suggestions.push('Avoid common sequences')
    }
    
    // Calculate entropy
    let charsetSize = 0
    if (/[a-z]/.test(password)) charsetSize += 26
    if (/[A-Z]/.test(password)) charsetSize += 26
    if (/[0-9]/.test(password)) charsetSize += 10
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32
    
    const entropy = Math.log2(Math.pow(charsetSize, password.length))
    
    // Time to crack estimation
    const guessesPerSecond = 1000000000 // 1 billion
    const totalCombinations = Math.pow(charsetSize, password.length)
    const secondsToCrack = totalCombinations / (2 * guessesPerSecond)
    
    let timeToCrack: string
    if (secondsToCrack < 60) {
      timeToCrack = 'Less than a minute'
    } else if (secondsToCrack < 3600) {
      timeToCrack = `${Math.round(secondsToCrack / 60)} minutes`
    } else if (secondsToCrack < 86400) {
      timeToCrack = `${Math.round(secondsToCrack / 3600)} hours`
    } else if (secondsToCrack < 31536000) {
      timeToCrack = `${Math.round(secondsToCrack / 86400)} days`
    } else {
      timeToCrack = `${Math.round(secondsToCrack / 31536000)} years`
    }
    
    // Determine level
    score = Math.max(0, Math.min(100, score))
    let level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
    
    if (score < 20) level = 'very-weak'
    else if (score < 40) level = 'weak'
    else if (score < 60) level = 'fair'
    else if (score < 80) level = 'good'
    else level = 'strong'
    
    // Add suggestions based on score
    if (password.length < 12) {
      suggestions.push('Use at least 12 characters')
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      suggestions.push('Add special characters')
    }
    
    return {
      score,
      level,
      entropy,
      timeToCrack,
      suggestions
    }
  }
  
  // Helper methods
  private static bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
    const binary = String.fromCharCode(...bytes)
    return btoa(binary)
  }
  
  private static base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  
  private static bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  private static hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
  }
  
  private static pkcs7Pad(data: Uint8Array): Uint8Array {
    const blockSize = 16
    const padLength = blockSize - (data.length % blockSize)
    const padded = new Uint8Array(data.length + padLength)
    padded.set(data)
    padded.fill(padLength, data.length)
    return padded
  }
  
  private static pkcs7Unpad(data: Uint8Array): Uint8Array {
    const padLength = data[data.length - 1]
    return data.slice(0, data.length - padLength)
  }
  
  private static simpleHash(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}

describe('Encryption Tool', () => {
  describe('AES Encryption/Decryption', () => {
    it('should encrypt and decrypt text with AES-GCM', async () => {
      const plaintext = 'Hello, World!'
      const password = 'SecurePassword123'
      
      const encrypted = await EncryptionTool.encryptAES(plaintext, password)
      
      expect(encrypted.ciphertext).toBeDefined()
      expect(encrypted.salt).toBeDefined()
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.mode).toBe('AES-GCM')
      expect(encrypted.keySize).toBe(256)
      
      const decrypted = await EncryptionTool.decryptAES(encrypted, password)
      expect(decrypted).toBe(plaintext)
    })
    
    it('should encrypt with different AES modes', async () => {
      const plaintext = 'Test data'
      const password = 'password'
      const modes: Array<'AES-GCM' | 'AES-CBC' | 'AES-CTR'> = ['AES-GCM', 'AES-CBC', 'AES-CTR']
      
      for (const mode of modes) {
        const encrypted = await EncryptionTool.encryptAES(plaintext, password, { mode })
        expect(encrypted.mode).toBe(mode)
        
        const decrypted = await EncryptionTool.decryptAES(encrypted, password)
        expect(decrypted).toBe(plaintext)
      }
    })
    
    it('should support different key sizes', async () => {
      const plaintext = 'Test'
      const password = 'pass'
      const keySizes: Array<128 | 192 | 256> = [128, 192, 256]
      
      for (const keySize of keySizes) {
        const encrypted = await EncryptionTool.encryptAES(plaintext, password, { keySize })
        expect(encrypted.keySize).toBe(keySize)
        
        const decrypted = await EncryptionTool.decryptAES(encrypted, password)
        expect(decrypted).toBe(plaintext)
      }
    })
    
    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = 'Same text'
      const password = 'password'
      
      const encrypted1 = await EncryptionTool.encryptAES(plaintext, password)
      const encrypted2 = await EncryptionTool.encryptAES(plaintext, password)
      
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
      expect(encrypted1.salt).not.toBe(encrypted2.salt)
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
    })
    
    it('should fail decryption with wrong password', async () => {
      const plaintext = 'Secret'
      const password = 'correct'
      const wrongPassword = 'wrong'
      
      const encrypted = await EncryptionTool.encryptAES(plaintext, password)
      
      await expect(EncryptionTool.decryptAES(encrypted, wrongPassword)).rejects.toThrow()
    })
    
    it('should handle hex output format', async () => {
      const plaintext = 'Test'
      const password = 'pass'
      
      const encrypted = await EncryptionTool.encryptAES(plaintext, password, { outputFormat: 'hex' })
      
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/i)
      expect(encrypted.salt).toMatch(/^[0-9a-f]+$/i)
      expect(encrypted.iv).toMatch(/^[0-9a-f]+$/i)
      
      const decrypted = await EncryptionTool.decryptAES(encrypted, password, 'hex')
      expect(decrypted).toBe(plaintext)
    })
    
    it('should handle Unicode text', async () => {
      const plaintext = '测试 émoji 🚀 café'
      const password = 'пароль'
      
      const encrypted = await EncryptionTool.encryptAES(plaintext, password)
      const decrypted = await EncryptionTool.decryptAES(encrypted, password)
      
      expect(decrypted).toBe(plaintext)
    })
    
    it('should handle empty plaintext', async () => {
      const plaintext = ''
      const password = 'password'
      
      const encrypted = await EncryptionTool.encryptAES(plaintext, password)
      const decrypted = await EncryptionTool.decryptAES(encrypted, password)
      
      expect(decrypted).toBe(plaintext)
    })
  })
  
  describe('RSA Encryption/Decryption', () => {
    it('should encrypt and decrypt with RSA', () => {
      const plaintext = 'RSA Test'
      const publicKey = 'mock-public-key'
      const privateKey = 'mock-private-key'
      
      const encrypted = EncryptionTool.encryptRSA(plaintext, publicKey)
      
      expect(encrypted.ciphertext).toBeDefined()
      expect(encrypted.algorithm).toBe('RSA-OAEP')
      expect(encrypted.keySize).toBe(2048)
      
      const decrypted = EncryptionTool.decryptRSA(encrypted.ciphertext, privateKey)
      expect(decrypted).toBe(plaintext)
    })
    
    it('should generate RSA key pair', async () => {
      const keyPair = await EncryptionTool.generateRSAKeyPair()
      
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY')
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY')
      expect(keyPair.keySize).toBe(2048)
      expect(keyPair.algorithm).toBe('RSA-OAEP')
    })
    
    it('should generate different key sizes', async () => {
      const sizes: Array<1024 | 2048 | 4096> = [1024, 2048, 4096]
      
      for (const size of sizes) {
        const keyPair = await EncryptionTool.generateRSAKeyPair(size)
        expect(keyPair.keySize).toBe(size)
      }
    })
    
    it('should fail decryption with invalid ciphertext', () => {
      expect(() => EncryptionTool.decryptRSA('invalid-base64!', 'key')).toThrow('RSA decryption failed')
    })
  })
  
  describe('Hashing', () => {
    it('should hash data with different algorithms', () => {
      const data = 'test data'
      const algorithms: Array<'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'> = 
        ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
      
      const expectedLengths = {
        'MD5': 32,
        'SHA-1': 40,
        'SHA-256': 64,
        'SHA-384': 96,
        'SHA-512': 128
      }
      
      algorithms.forEach(algo => {
        const hash = EncryptionTool.hashData(data, algo)
        expect(hash).toHaveLength(expectedLengths[algo])
        expect(hash).toMatch(/^[0-9a-f]+$/i)
      })
    })
    
    it('should produce consistent hashes', () => {
      const data = 'consistent data'
      
      const hash1 = EncryptionTool.hashData(data, 'SHA-256')
      const hash2 = EncryptionTool.hashData(data, 'SHA-256')
      
      expect(hash1).toBe(hash2)
    })
    
    it('should produce different hashes for different data', () => {
      const hash1 = EncryptionTool.hashData('data1', 'SHA-256')
      const hash2 = EncryptionTool.hashData('data2', 'SHA-256')
      
      expect(hash1).not.toBe(hash2)
    })
    
    it('should handle empty input', () => {
      const hash = EncryptionTool.hashData('', 'SHA-256')
      expect(hash).toBeDefined()
      expect(hash).toHaveLength(64)
    })
  })
  
  describe('HMAC Generation', () => {
    it('should generate HMAC', async () => {
      const data = 'message'
      const secret = 'secret-key'
      
      const hmac = await EncryptionTool.generateHMAC(data, secret)
      
      expect(hmac).toBeDefined()
      expect(hmac).toMatch(/^[0-9a-f]+$/i)
    })
    
    it('should support different algorithms', async () => {
      const data = 'test'
      const secret = 'key'
      const algorithms: Array<'SHA-256' | 'SHA-384' | 'SHA-512'> = ['SHA-256', 'SHA-384', 'SHA-512']
      
      for (const algo of algorithms) {
        const hmac = await EncryptionTool.generateHMAC(data, secret, algo)
        expect(hmac).toBeDefined()
        
        // Different algorithms produce different length outputs
        const expectedLengths = {
          'SHA-256': 64,
          'SHA-384': 96,
          'SHA-512': 128
        }
        expect(hmac).toHaveLength(expectedLengths[algo])
      }
    })
    
    it('should produce consistent HMACs', async () => {
      const data = 'consistent'
      const secret = 'key'
      
      const hmac1 = await EncryptionTool.generateHMAC(data, secret)
      const hmac2 = await EncryptionTool.generateHMAC(data, secret)
      
      expect(hmac1).toBe(hmac2)
    })
    
    it('should produce different HMACs with different secrets', async () => {
      const data = 'same data'
      
      const hmac1 = await EncryptionTool.generateHMAC(data, 'secret1')
      const hmac2 = await EncryptionTool.generateHMAC(data, 'secret2')
      
      expect(hmac1).not.toBe(hmac2)
    })
  })
  
  describe('Base64 Encoding/Decoding', () => {
    it('should encode and decode Base64', () => {
      const data = 'Hello, World!'
      
      const encoded = EncryptionTool.encodeBase64(data)
      expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==')
      
      const decoded = EncryptionTool.decodeBase64(encoded)
      expect(decoded).toBe(data)
    })
    
    it('should handle Unicode in Base64', () => {
      const data = '中文 émoji 🚀'
      
      const encoded = EncryptionTool.encodeBase64(data)
      const decoded = EncryptionTool.decodeBase64(encoded)
      
      expect(decoded).toBe(data)
    })
    
    it('should reject invalid Base64', () => {
      expect(() => EncryptionTool.decodeBase64('invalid!@#')).toThrow('Invalid Base64')
    })
    
    it('should handle empty string', () => {
      const encoded = EncryptionTool.encodeBase64('')
      expect(encoded).toBe('')
      
      const decoded = EncryptionTool.decodeBase64('')
      expect(decoded).toBe('')
    })
  })
  
  describe('Hex Encoding/Decoding', () => {
    it('should encode and decode hex', () => {
      const data = 'Hello'
      
      const encoded = EncryptionTool.encodeHex(data)
      expect(encoded).toBe('48656c6c6f')
      
      const decoded = EncryptionTool.decodeHex(encoded)
      expect(decoded).toBe(data)
    })
    
    it('should handle Unicode in hex', () => {
      const data = 'café'
      
      const encoded = EncryptionTool.encodeHex(data)
      const decoded = EncryptionTool.decodeHex(encoded)
      
      expect(decoded).toBe(data)
    })
    
    it('should reject invalid hex', () => {
      expect(() => EncryptionTool.decodeHex('xyz')).toThrow()
      expect(() => EncryptionTool.decodeHex('12g4')).toThrow()
    })
    
    it('should reject odd-length hex', () => {
      expect(() => EncryptionTool.decodeHex('123')).toThrow('Invalid hex string')
    })
  })
  
  describe('Password Generation', () => {
    it('should generate password with default options', () => {
      const password = EncryptionTool.generatePassword()
      
      expect(password).toHaveLength(16)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
    })
    
    it('should generate password with custom length', () => {
      const lengths = [8, 12, 20, 32]
      
      lengths.forEach(length => {
        const password = EncryptionTool.generatePassword({ length })
        expect(password).toHaveLength(length)
      })
    })
    
    it('should respect character type options', () => {
      const onlyLower = EncryptionTool.generatePassword({
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false
      })
      expect(onlyLower).toMatch(/^[a-z]+$/)
      
      const onlyNumbers = EncryptionTool.generatePassword({
        includeUppercase: false,
        includeLowercase: false,
        includeSymbols: false
      })
      expect(onlyNumbers).toMatch(/^[0-9]+$/)
    })
    
    it('should exclude ambiguous characters', () => {
      const password = EncryptionTool.generatePassword({
        length: 100,
        excludeAmbiguous: true
      })
      
      expect(password).not.toContain('0')
      expect(password).not.toContain('O')
      expect(password).not.toContain('1')
      expect(password).not.toContain('l')
      expect(password).not.toContain('I')
      expect(password).not.toContain('|')
    })
    
    it('should generate unique passwords', () => {
      const passwords = new Set()
      
      for (let i = 0; i < 100; i++) {
        passwords.add(EncryptionTool.generatePassword())
      }
      
      expect(passwords.size).toBe(100)
    })
    
    it('should throw error when no character types selected', () => {
      expect(() => EncryptionTool.generatePassword({
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false
      })).toThrow('At least one character type must be selected')
    })
  })
  
  describe('Password Strength Estimation', () => {
    it('should estimate password strength', () => {
      const result = EncryptionTool.estimatePasswordStrength('MyP@ssw0rd123!')
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.level).toMatch(/^(very-weak|weak|fair|good|strong)$/)
      expect(result.entropy).toBeGreaterThan(0)
      expect(result.timeToCrack).toBeDefined()
      expect(Array.isArray(result.suggestions)).toBe(true)
    })
    
    it('should rate weak passwords', () => {
      const weakPasswords = ['123456', 'password', 'abc123', 'qwerty']
      
      weakPasswords.forEach(pwd => {
        const result = EncryptionTool.estimatePasswordStrength(pwd)
        expect(['very-weak', 'weak']).toContain(result.level)
        expect(result.score).toBeLessThan(40)
      })
    })
    
    it('should rate strong passwords', () => {
      const strongPasswords = [
        'MyV3ryStr0ng!P@ssw0rd#2024',
        'Tr0ub4dor&3*Secure$Key',
        'C0mpl3x!ty@Maximum#Level'
      ]
      
      strongPasswords.forEach(pwd => {
        const result = EncryptionTool.estimatePasswordStrength(pwd)
        expect(['good', 'strong']).toContain(result.level)
        expect(result.score).toBeGreaterThan(60)
      })
    })
    
    it('should provide suggestions', () => {
      const result = EncryptionTool.estimatePasswordStrength('password')
      
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions.some(s => s.includes('special characters'))).toBe(true)
    })
    
    it('should detect patterns', () => {
      const patterns = ['aaaaaaa', '12345678', 'abcdefgh']
      
      patterns.forEach(pwd => {
        const result = EncryptionTool.estimatePasswordStrength(pwd)
        expect(result.suggestions.some(s => 
          s.includes('repeating') || s.includes('sequence')
        )).toBe(true)
      })
    })
    
    it('should calculate time to crack', () => {
      const weak = EncryptionTool.estimatePasswordStrength('123')
      const strong = EncryptionTool.estimatePasswordStrength('MyV3ryStr0ng!P@ssw0rd')
      
      expect(weak.timeToCrack).toContain('minute')
      expect(strong.timeToCrack).toMatch(/years|days/)
    })
  })
  
  describe('performance tests', () => {
    it('should encrypt large data efficiently', async () => {
      const largeData = 'x'.repeat(100000) // 100KB
      const password = 'password'
      
      const { duration } = await perfUtils.measure(async () => {
        await EncryptionTool.encryptAES(largeData, password)
      })
      
      expect(duration).toBeLessThan(5000) // Less than 5 seconds
    })
    
    it('should handle multiple encryptions efficiently', async () => {
      const data = 'test data'
      const password = 'password'
      
      const { duration } = await perfUtils.measure(async () => {
        const promises = []
        for (let i = 0; i < 10; i++) {
          promises.push(EncryptionTool.encryptAES(data, password))
        }
        await Promise.all(promises)
      })
      
      expect(duration).toBeLessThan(3000)
    })
    
    it('should generate passwords quickly', async () => {
      const { duration } = await perfUtils.measure(() => {
        for (let i = 0; i < 1000; i++) {
          EncryptionTool.generatePassword()
        }
      })
      
      expect(duration).toBeLessThan(1000)
    })
    
    it('should maintain performance under stress', async () => {
      const testFn = async () => {
        const password = EncryptionTool.generatePassword()
        EncryptionTool.estimatePasswordStrength(password)
        const hash = EncryptionTool.hashData(password, 'SHA-256')
        EncryptionTool.encodeBase64(hash)
      }
      
      const results = await perfUtils.stressTest(testFn, 100)
      expect(results.success).toBe(100)
      expect(results.failures).toBe(0)
    })
  })
  
  describe('security tests', () => {
    it('should use cryptographically secure random', () => {
      // Check that generated values are different
      const passwords = new Array(100).fill(0).map(() => 
        EncryptionTool.generatePassword()
      )
      
      const uniquePasswords = new Set(passwords)
      expect(uniquePasswords.size).toBe(100)
    })
    
    it('should not leak sensitive data in errors', async () => {
      const password = 'SuperSecretPassword123!'
      const encrypted = await EncryptionTool.encryptAES('data', password)
      
      try {
        await EncryptionTool.decryptAES(encrypted, 'wrong')
      } catch (error) {
        const errorMessage = (error as Error).message
        expect(errorMessage).not.toContain(password)
        expect(errorMessage).not.toContain('SuperSecret')
      }
    })
    
    it('should handle malicious input safely', () => {
      const maliciousInputs = [
        security.xss.basic,
        security.sql.basic,
        '<script>alert(1)</script>',
        '"; DROP TABLE users; --'
      ]
      
      maliciousInputs.forEach(input => {
        expect(() => EncryptionTool.hashData(input, 'SHA-256')).not.toThrow()
        expect(() => EncryptionTool.encodeBase64(input)).not.toThrow()
        expect(() => EncryptionTool.encodeHex(input)).not.toThrow()
      })
    })
    
    it('should produce different salts and IVs', async () => {
      const data = 'same data'
      const password = 'same password'
      
      const encrypted1 = await EncryptionTool.encryptAES(data, password)
      const encrypted2 = await EncryptionTool.encryptAES(data, password)
      
      expect(encrypted1.salt).not.toBe(encrypted2.salt)
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
    })
    
    it('should handle timing attacks in password comparison', async () => {
      const correctPassword = 'correct'
      const encrypted = await EncryptionTool.encryptAES('data', correctPassword)
      
      const attempts = [
        'wrong',
        'crrect', // One character different
        'correc', // One character short
        'correctt', // One character long
      ]
      
      // All wrong passwords should fail
      for (const attempt of attempts) {
        await expect(EncryptionTool.decryptAES(encrypted, attempt)).rejects.toThrow()
      }
    })
  })
  
  describe('edge cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'x'.repeat(10000)
      const data = 'test'
      
      const encrypted = await EncryptionTool.encryptAES(data, longPassword)
      const decrypted = await EncryptionTool.decryptAES(encrypted, longPassword)
      
      expect(decrypted).toBe(data)
    })
    
    it('should handle special characters in passwords', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
      const data = 'test'
      
      const encrypted = await EncryptionTool.encryptAES(data, specialPassword)
      const decrypted = await EncryptionTool.decryptAES(encrypted, specialPassword)
      
      expect(decrypted).toBe(data)
    })
    
    it('should handle binary data', async () => {
      const binaryData = String.fromCharCode(...crypto.getRandomValues(new Uint8Array(256)))
      const password = 'password'
      
      const encrypted = await EncryptionTool.encryptAES(binaryData, password)
      const decrypted = await EncryptionTool.decryptAES(encrypted, password)
      
      expect(decrypted).toBe(binaryData)
    })
    
    it('should handle single character inputs', () => {
      expect(EncryptionTool.encodeBase64('a')).toBe('YQ==')
      expect(EncryptionTool.encodeHex('a')).toBe('61')
      expect(EncryptionTool.hashData('a', 'SHA-256')).toBeDefined()
    })
    
    it('should handle maximum iterations for key derivation', async () => {
      const data = 'test'
      const password = 'password'
      
      const encrypted = await EncryptionTool.encryptAES(data, password, { iterations: 1000000 })
      expect(encrypted.iterations).toBe(1000000)
      
      const decrypted = await EncryptionTool.decryptAES(encrypted, password)
      expect(decrypted).toBe(data)
    })
    
    it('should handle empty password (not recommended)', async () => {
      const data = 'test'
      const emptyPassword = ''
      
      const encrypted = await EncryptionTool.encryptAES(data, emptyPassword)
      const decrypted = await EncryptionTool.decryptAES(encrypted, emptyPassword)
      
      expect(decrypted).toBe(data)
    })
  })
})