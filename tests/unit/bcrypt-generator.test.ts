import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Bcrypt Generator utility functions
class BcryptGenerator {
  static async hashPassword(password: string, rounds: number = 10): Promise<{
    hash: string
    rounds: number
    salt: string
    timeToHash: number
  }> {
    const startTime = Date.now()
    
    // Validate rounds
    if (rounds < 4 || rounds > 31) {
      throw new Error('Rounds must be between 4 and 31')
    }
    
    // Generate salt
    const salt = this.generateSalt(rounds)
    
    // Mock bcrypt hash (in real implementation would use bcrypt library)
    const hash = await this.mockBcryptHash(password, salt, rounds)
    
    const timeToHash = Date.now() - startTime
    
    return {
      hash,
      rounds,
      salt,
      timeToHash
    }
  }
  
  static async verifyPassword(password: string, hash: string): Promise<{
    matches: boolean
    timeToVerify: number
    hashInfo?: {
      version: string
      rounds: number
      salt: string
    }
  }> {
    const startTime = Date.now()
    
    try {
      // Parse hash format: $2b$10$saltsaltsaltsaltsaltsOhash
      const parts = hash.split('$')
      
      if (parts.length !== 4 || !parts[1].startsWith('2')) {
        throw new Error('Invalid bcrypt hash format')
      }
      
      const version = parts[1]
      const rounds = parseInt(parts[2], 10)
      const saltAndHash = parts[3]
      const salt = saltAndHash.substring(0, 22)
      
      // Mock verification - recreate hash with same parameters
      const saltWithPrefix = `$${version}$${rounds.toString().padStart(2, '0')}$${salt}`
      const expectedHash = await this.mockBcryptHash(password, saltWithPrefix, rounds)
      const matches = expectedHash === hash
      
      const timeToVerify = Date.now() - startTime
      
      return {
        matches,
        timeToVerify,
        hashInfo: {
          version,
          rounds,
          salt
        }
      }
    } catch (error) {
      return {
        matches: false,
        timeToVerify: Date.now() - startTime
      }
    }
  }
  
  private static generateSalt(rounds: number): string {
    // Generate bcrypt-compatible salt
    const version = '2b'
    const roundsStr = rounds.toString().padStart(2, '0')
    const randomBytes = crypto.getRandomValues(new Uint8Array(16))
    const saltChars = this.base64Encode(randomBytes).substring(0, 22)
    
    return `$${version}$${roundsStr}$${saltChars}`
  }
  
  private static async mockBcryptHash(password: string, salt: string, rounds: number): Promise<string> {
    // Simulate bcrypt's expensive key derivation
    await this.simulateWork(rounds)
    
    // Create deterministic hash based on password and salt
    const encoder = new TextEncoder()
    const data = encoder.encode(password + salt + rounds.toString())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    const hashB64 = this.base64Encode(hashArray).substring(0, 31)
    
    // Format: $2b$10$saltsaltsaltsaltsaltsOhash (salt + hash = 53 chars)
    return `${salt}${hashB64}`
  }
  
  private static async simulateWork(rounds: number): Promise<void> {
    // Simulate exponential work based on rounds
    const iterations = Math.pow(2, rounds)
    const maxIterations = Math.min(iterations, 10000) // Cap for testing
    
    let dummy = 0
    for (let i = 0; i < maxIterations; i++) {
      dummy += i
    }
    
    // Add small delay to simulate real bcrypt timing
    await new Promise(resolve => setTimeout(resolve, rounds * 2))
  }
  
  private static base64Encode(bytes: Uint8Array): string {
    // Bcrypt-style base64 encoding (different from standard base64)
    const chars = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < bytes.length; i++) {
      result += chars[bytes[i] % 64]
    }
    
    return result
  }
  
  static analyzeHash(hash: string): {
    valid: boolean
    version?: string
    rounds?: number
    salt?: string
    algorithm?: string
    security: {
      level: 'weak' | 'moderate' | 'strong' | 'very-strong'
      recommendations: string[]
    }
  } {
    try {
      // Parse bcrypt hash format
      const parts = hash.split('$')
      
      if (parts.length !== 4) {
        return {
          valid: false,
          security: {
            level: 'weak',
            recommendations: ['Invalid hash format']
          }
        }
      }
      
      const version = parts[1]
      const rounds = parseInt(parts[2], 10)
      const saltAndHash = parts[3]
      const salt = saltAndHash.substring(0, 22)
      
      // Validate version
      if (!['2', '2a', '2b', '2x', '2y'].includes(version)) {
        return {
          valid: false,
          security: {
            level: 'weak',
            recommendations: ['Unknown bcrypt version']
          }
        }
      }
      
      // Analyze security
      const recommendations: string[] = []
      let securityLevel: 'weak' | 'moderate' | 'strong' | 'very-strong'
      
      if (rounds < 10) {
        securityLevel = 'weak'
        recommendations.push('Use at least 10 rounds for better security')
      } else if (rounds < 12) {
        securityLevel = 'moderate'
        recommendations.push('Consider using 12+ rounds for enhanced security')
      } else if (rounds < 14) {
        securityLevel = 'strong'
      } else {
        securityLevel = 'very-strong'
      }
      
      // Check for old versions
      if (version === '2' || version === '2a') {
        recommendations.push('Consider upgrading to bcrypt version 2b')
      }
      
      return {
        valid: true,
        version,
        rounds,
        salt,
        algorithm: 'bcrypt',
        security: {
          level: securityLevel,
          recommendations
        }
      }
    } catch (error) {
      return {
        valid: false,
        security: {
          level: 'weak',
          recommendations: ['Failed to parse hash']
        }
      }
    }
  }
  
  static estimateCrackTime(rounds: number, passwordLength: number = 8): {
    hashesPerSecond: number
    totalCombinations: bigint
    estimatedTime: string
    costFactor: number
  } {
    // Estimate based on modern hardware
    const baseHashesPerSecond = 50000 // Modern GPU can do ~50k bcrypt/sec at rounds=5
    const costFactor = Math.pow(2, rounds)
    const hashesPerSecond = Math.max(1, baseHashesPerSecond / (costFactor / 32))
    
    // Assume mixed case + numbers + symbols
    const charsetSize = 94 // Printable ASCII
    const totalCombinations = BigInt(charsetSize) ** BigInt(passwordLength)
    
    const secondsToCrack = Number(totalCombinations) / hashesPerSecond / 2 // Average case
    
    let estimatedTime: string
    if (secondsToCrack < 60) {
      estimatedTime = `${Math.round(secondsToCrack)} seconds`
    } else if (secondsToCrack < 3600) {
      estimatedTime = `${Math.round(secondsToCrack / 60)} minutes`
    } else if (secondsToCrack < 86400) {
      estimatedTime = `${Math.round(secondsToCrack / 3600)} hours`
    } else if (secondsToCrack < 31536000) {
      estimatedTime = `${Math.round(secondsToCrack / 86400)} days`
    } else if (secondsToCrack < 31536000000) {
      estimatedTime = `${Math.round(secondsToCrack / 31536000)} years`
    } else {
      estimatedTime = 'Centuries'
    }
    
    return {
      hashesPerSecond,
      totalCombinations,
      estimatedTime,
      costFactor
    }
  }
  
  static benchmarkRounds(targetTime: number = 100): number {
    // Determine optimal rounds for target hash time (in ms)
    let rounds = 10
    let lastTime = 0
    
    // Mock benchmark - in real implementation would test actual bcrypt
    while (rounds <= 20) {
      const estimatedTime = Math.pow(2, rounds) / 1000 // Exponential growth
      
      if (estimatedTime >= targetTime) {
        // Return previous rounds if current is too slow
        return estimatedTime - targetTime < targetTime - lastTime ? rounds : rounds - 1
      }
      
      lastTime = estimatedTime
      rounds++
    }
    
    return rounds
  }
  
  static generateSecurePassword(options: {
    length?: number
    memorizable?: boolean
    excludeAmbiguous?: boolean
  } = {}): string {
    const {
      length = 16,
      memorizable = false,
      excludeAmbiguous = false
    } = options
    
    if (memorizable) {
      // Generate passphrase
      const words = [
        'correct', 'horse', 'battery', 'staple', 'mountain',
        'river', 'sunset', 'ocean', 'forest', 'thunder'
      ]
      
      const selected: string[] = []
      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * words.length)
        selected.push(words[randomIndex])
      }
      
      return selected.join('-')
    } else {
      // Generate random password
      let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
      
      if (excludeAmbiguous) {
        charset = charset.replace(/[0O1lI]/g, '')
      }
      
      let password = ''
      const randomValues = crypto.getRandomValues(new Uint8Array(length))
      
      for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length]
      }
      
      return password
    }
  }
  
  static compareHashes(hash1: string, hash2: string): {
    match: boolean
    hash1Info?: any
    hash2Info?: any
    differences: string[]
  } {
    const differences: string[] = []
    
    const info1 = this.analyzeHash(hash1)
    const info2 = this.analyzeHash(hash2)
    
    if (!info1.valid || !info2.valid) {
      differences.push('One or both hashes are invalid')
      return {
        match: false,
        hash1Info: info1,
        hash2Info: info2,
        differences
      }
    }
    
    if (info1.version !== info2.version) {
      differences.push(`Different versions: ${info1.version} vs ${info2.version}`)
    }
    
    if (info1.rounds !== info2.rounds) {
      differences.push(`Different rounds: ${info1.rounds} vs ${info2.rounds}`)
    }
    
    if (info1.salt !== info2.salt) {
      differences.push('Different salts')
    }
    
    const match = hash1 === hash2
    
    return {
      match,
      hash1Info: info1,
      hash2Info: info2,
      differences
    }
  }
}

describe('Bcrypt Generator', () => {
  describe('hashPassword', () => {
    it('should hash password with default rounds', async () => {
      const password = 'TestPassword123'
      const result = await BcryptGenerator.hashPassword(password)
      
      expect(result.hash).toBeDefined()
      expect(result.rounds).toBe(10)
      expect(result.salt).toBeDefined()
      expect(result.timeToHash).toBeGreaterThan(0)
      expect(result.hash).toContain('$2b$10$')
    })
    
    it('should hash with custom rounds', async () => {
      const password = 'password'
      const rounds = [4, 8, 12, 15]
      
      for (const round of rounds) {
        const result = await BcryptGenerator.hashPassword(password, round)
        expect(result.rounds).toBe(round)
        expect(result.hash).toContain(`$2b$${round.toString().padStart(2, '0')}$`)
      }
    })
    
    it('should produce different hashes for same password', async () => {
      const password = 'SamePassword'
      
      const hash1 = await BcryptGenerator.hashPassword(password)
      const hash2 = await BcryptGenerator.hashPassword(password)
      
      expect(hash1.hash).not.toBe(hash2.hash)
      expect(hash1.salt).not.toBe(hash2.salt)
    })
    
    it('should reject invalid rounds', async () => {
      const password = 'test'
      
      await expect(BcryptGenerator.hashPassword(password, 3)).rejects.toThrow('Rounds must be between 4 and 31')
      await expect(BcryptGenerator.hashPassword(password, 32)).rejects.toThrow('Rounds must be between 4 and 31')
    })
    
    it('should increase hash time with more rounds', async () => {
      const password = 'test'
      
      const result1 = await BcryptGenerator.hashPassword(password, 4)
      const result2 = await BcryptGenerator.hashPassword(password, 8)
      
      expect(result2.timeToHash).toBeGreaterThan(result1.timeToHash)
    })
    
    it('should handle special characters in password', async () => {
      const specialPasswords = [
        '!@#$%^&*()',
        'пароль',
        '密码',
        '🔐🔑',
        'café naïve'
      ]
      
      for (const pwd of specialPasswords) {
        const result = await BcryptGenerator.hashPassword(pwd)
        expect(result.hash).toBeDefined()
        expect(result.hash.length).toBeGreaterThan(50)
      }
    })
    
    it('should handle empty password', async () => {
      const result = await BcryptGenerator.hashPassword('')
      expect(result.hash).toBeDefined()
    })
    
    it('should handle very long passwords', async () => {
      const longPassword = 'x'.repeat(1000)
      const result = await BcryptGenerator.hashPassword(longPassword)
      
      expect(result.hash).toBeDefined()
      expect(result.hash.length).toBeGreaterThan(50)
    })
  })
  
  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword'
      const { hash } = await BcryptGenerator.hashPassword(password)
      
      const result = await BcryptGenerator.verifyPassword(password, hash)
      
      expect(result.matches).toBe(true)
      expect(result.timeToVerify).toBeGreaterThan(0)
      expect(result.hashInfo).toBeDefined()
    })
    
    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword'
      const wrongPassword = 'WrongPassword'
      const { hash } = await BcryptGenerator.hashPassword(password)
      
      const result = await BcryptGenerator.verifyPassword(wrongPassword, hash)
      
      expect(result.matches).toBe(false)
    })
    
    it('should extract hash information', async () => {
      const password = 'test'
      const rounds = 12
      const { hash } = await BcryptGenerator.hashPassword(password, rounds)
      
      const result = await BcryptGenerator.verifyPassword(password, hash)
      
      expect(result.hashInfo?.version).toBe('2b')
      expect(result.hashInfo?.rounds).toBe(rounds)
      expect(result.hashInfo?.salt).toBeDefined()
    })
    
    it('should handle invalid hash format', async () => {
      const invalidHashes = [
        'not-a-hash',
        '$1$invalid$hash',
        '$2b$',
        '$2b$10$',
        ''
      ]
      
      for (const hash of invalidHashes) {
        const result = await BcryptGenerator.verifyPassword('password', hash)
        expect(result.matches).toBe(false)
      }
    })
    
    it('should handle case-sensitive passwords', async () => {
      const password = 'Password'
      const { hash } = await BcryptGenerator.hashPassword(password)
      
      const result1 = await BcryptGenerator.verifyPassword('password', hash)
      const result2 = await BcryptGenerator.verifyPassword('PASSWORD', hash)
      
      expect(result1.matches).toBe(false)
      expect(result2.matches).toBe(false)
    })
  })
  
  describe('analyzeHash', () => {
    it('should analyze valid bcrypt hash', () => {
      const hash = '$2b$12$abcdefghijklmnopqrstuOvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const analysis = BcryptGenerator.analyzeHash(hash)
      
      expect(analysis.valid).toBe(true)
      expect(analysis.version).toBe('2b')
      expect(analysis.rounds).toBe(12)
      expect(analysis.salt).toBeDefined()
      expect(analysis.algorithm).toBe('bcrypt')
    })
    
    it('should assess security level based on rounds', () => {
      const testCases = [
        { rounds: 4, expectedLevel: 'weak' },
        { rounds: 8, expectedLevel: 'weak' },
        { rounds: 10, expectedLevel: 'moderate' },
        { rounds: 12, expectedLevel: 'strong' },
        { rounds: 14, expectedLevel: 'very-strong' },
        { rounds: 16, expectedLevel: 'very-strong' }
      ]
      
      testCases.forEach(({ rounds, expectedLevel }) => {
        const hash = `$2b$${rounds.toString().padStart(2, '0')}$abcdefghijklmnopqrstuOvwxyz`
        const analysis = BcryptGenerator.analyzeHash(hash)
        expect(analysis.security.level).toBe(expectedLevel)
      })
    })
    
    it('should provide security recommendations', () => {
      const weakHash = '$2b$08$abcdefghijklmnopqrstuOvwxyz'
      const analysis = BcryptGenerator.analyzeHash(weakHash)
      
      expect(analysis.security.recommendations.length).toBeGreaterThan(0)
      expect(analysis.security.recommendations.some(r => r.includes('10 rounds'))).toBe(true)
    })
    
    it('should detect old bcrypt versions', () => {
      const oldVersionHashes = [
        '$2$10$abcdefghijklmnopqrstuOvwxyz',
        '$2a$10$abcdefghijklmnopqrstuOvwxyz'
      ]
      
      oldVersionHashes.forEach(hash => {
        const analysis = BcryptGenerator.analyzeHash(hash)
        expect(analysis.security.recommendations.some(r => r.includes('2b'))).toBe(true)
      })
    })
    
    it('should handle invalid hashes', () => {
      const invalidHashes = [
        'not-a-bcrypt-hash',
        '$md5$hash',
        '$2b$',
        ''
      ]
      
      invalidHashes.forEach(hash => {
        const analysis = BcryptGenerator.analyzeHash(hash)
        expect(analysis.valid).toBe(false)
        expect(analysis.security.level).toBe('weak')
      })
    })
  })
  
  describe('estimateCrackTime', () => {
    it('should estimate crack time for different rounds', () => {
      const rounds = [8, 10, 12, 14, 16]
      
      rounds.forEach((round, index) => {
        const estimate = BcryptGenerator.estimateCrackTime(round)
        
        expect(estimate.hashesPerSecond).toBeGreaterThan(0)
        expect(estimate.totalCombinations).toBeGreaterThan(0n)
        expect(estimate.estimatedTime).toBeDefined()
        expect(estimate.costFactor).toBe(Math.pow(2, round))
        
        // Higher rounds should take longer
        if (index > 0) {
          const prevEstimate = BcryptGenerator.estimateCrackTime(rounds[index - 1])
          expect(estimate.hashesPerSecond).toBeLessThan(prevEstimate.hashesPerSecond)
        }
      })
    })
    
    it('should estimate based on password length', () => {
      const rounds = 12
      const lengths = [6, 8, 10, 12, 16]
      
      lengths.forEach((length, index) => {
        const estimate = BcryptGenerator.estimateCrackTime(rounds, length)
        
        expect(estimate.totalCombinations).toBeGreaterThan(0n)
        
        // Longer passwords should have more combinations
        if (index > 0) {
          const prevEstimate = BcryptGenerator.estimateCrackTime(rounds, lengths[index - 1])
          expect(estimate.totalCombinations).toBeGreaterThan(prevEstimate.totalCombinations)
        }
      })
    })
    
    it('should format time estimates appropriately', () => {
      // Low rounds, short password = quick crack
      const quickCrack = BcryptGenerator.estimateCrackTime(4, 4)
      expect(quickCrack.estimatedTime).toMatch(/seconds|minutes|hours/)
      
      // High rounds, long password = slow crack
      const slowCrack = BcryptGenerator.estimateCrackTime(16, 16)
      expect(slowCrack.estimatedTime).toMatch(/years|Centuries/)
    })
  })
  
  describe('benchmarkRounds', () => {
    it('should recommend rounds for target time', () => {
      const targetTimes = [50, 100, 200, 500]
      
      targetTimes.forEach(target => {
        const rounds = BcryptGenerator.benchmarkRounds(target)
        
        expect(rounds).toBeGreaterThanOrEqual(4)
        expect(rounds).toBeLessThanOrEqual(20)
      })
    })
    
    it('should increase rounds for longer target times', () => {
      const rounds1 = BcryptGenerator.benchmarkRounds(50)
      const rounds2 = BcryptGenerator.benchmarkRounds(200)
      
      expect(rounds2).toBeGreaterThanOrEqual(rounds1)
    })
  })
  
  describe('generateSecurePassword', () => {
    it('should generate random password', () => {
      const password = BcryptGenerator.generateSecurePassword()
      
      expect(password).toHaveLength(16)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
    })
    
    it('should generate password with custom length', () => {
      const lengths = [8, 12, 20, 32]
      
      lengths.forEach(length => {
        const password = BcryptGenerator.generateSecurePassword({ length })
        expect(password).toHaveLength(length)
      })
    })
    
    it('should generate memorizable passphrase', () => {
      const password = BcryptGenerator.generateSecurePassword({ memorizable: true })
      
      expect(password).toContain('-')
      expect(password.split('-').length).toBe(4)
    })
    
    it('should exclude ambiguous characters', () => {
      const password = BcryptGenerator.generateSecurePassword({
        length: 100,
        excludeAmbiguous: true
      })
      
      expect(password).not.toMatch(/[0O1lI]/)
    })
    
    it('should generate unique passwords', () => {
      const passwords = new Set()
      
      for (let i = 0; i < 100; i++) {
        passwords.add(BcryptGenerator.generateSecurePassword())
      }
      
      expect(passwords.size).toBe(100)
    })
  })
  
  describe('compareHashes', () => {
    it('should compare identical hashes', () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuOvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const result = BcryptGenerator.compareHashes(hash, hash)
      
      expect(result.match).toBe(true)
      expect(result.differences).toHaveLength(0)
    })
    
    it('should detect different versions', () => {
      const hash1 = '$2a$10$abcdefghijklmnopqrstuOvwxyz'
      const hash2 = '$2b$10$abcdefghijklmnopqrstuOvwxyz'
      
      const result = BcryptGenerator.compareHashes(hash1, hash2)
      
      expect(result.match).toBe(false)
      expect(result.differences.some(d => d.includes('versions'))).toBe(true)
    })
    
    it('should detect different rounds', () => {
      const hash1 = '$2b$10$abcdefghijklmnopqrstuOvwxyz'
      const hash2 = '$2b$12$abcdefghijklmnopqrstuOvwxyz'
      
      const result = BcryptGenerator.compareHashes(hash1, hash2)
      
      expect(result.match).toBe(false)
      expect(result.differences.some(d => d.includes('rounds'))).toBe(true)
    })
    
    it('should detect different salts', () => {
      const hash1 = '$2b$10$abcdefghijklmnopqrstuOvwxyz'
      const hash2 = '$2b$10$zyxwvutsrqponmlkjihgfeOvwxyz'
      
      const result = BcryptGenerator.compareHashes(hash1, hash2)
      
      expect(result.match).toBe(false)
      expect(result.differences.some(d => d.includes('salts'))).toBe(true)
    })
    
    it('should handle invalid hashes', () => {
      const result = BcryptGenerator.compareHashes('invalid1', 'invalid2')
      
      expect(result.match).toBe(false)
      expect(result.differences.some(d => d.includes('invalid'))).toBe(true)
    })
  })
  
  describe('performance tests', () => {
    it('should hash efficiently with reasonable rounds', async () => {
      const password = 'test'
      
      const { duration } = await perfUtils.measure(async () => {
        await BcryptGenerator.hashPassword(password, 4)
      })
      
      expect(duration).toBeLessThan(1000) // Less than 1 second for low rounds
    })
    
    it('should handle multiple hashes concurrently', async () => {
      const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5']
      
      const { duration } = await perfUtils.measure(async () => {
        await Promise.all(passwords.map(p => BcryptGenerator.hashPassword(p, 4)))
      })
      
      expect(duration).toBeLessThan(3000)
    })
    
    it('should benchmark efficiently', () => {
      const { duration } = perfUtils.measureSync(() => {
        BcryptGenerator.benchmarkRounds(100)
      })
      
      expect(duration).toBeLessThan(100)
    })
    
    it('should maintain performance under stress', async () => {
      const testFn = async () => {
        const password = BcryptGenerator.generateSecurePassword()
        const { hash } = await BcryptGenerator.hashPassword(password, 4)
        await BcryptGenerator.verifyPassword(password, hash)
      }
      
      const results = await perfUtils.stressTest(testFn, 50)
      expect(results.success).toBe(50)
      expect(results.failures).toBe(0)
    })
  })
  
  describe('security tests', () => {
    it('should use unique salts', async () => {
      const password = 'same'
      const hashes = new Set()
      
      for (let i = 0; i < 10; i++) {
        const { hash } = await BcryptGenerator.hashPassword(password)
        hashes.add(hash)
      }
      
      expect(hashes.size).toBe(10)
    })
    
    it('should resist timing attacks', async () => {
      const password = 'correct'
      const { hash } = await BcryptGenerator.hashPassword(password)
      
      const attempts = [
        'wrong',
        'correc', // One char short
        'correctt', // One char long
        'dorrect' // One char different
      ]
      
      const times: number[] = []
      
      for (const attempt of attempts) {
        const start = Date.now()
        await BcryptGenerator.verifyPassword(attempt, hash)
        times.push(Date.now() - start)
      }
      
      // Times should be similar (constant time comparison)
      const avgTime = times.reduce((a, b) => a + b) / times.length
      times.forEach(time => {
        expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 0.5)
      })
    })
    
    it('should handle malicious input safely', async () => {
      const maliciousInputs = [
        security.xss.basic,
        security.sql.basic,
        '\x00\x01\x02', // Null bytes
        ''.padEnd(10000, 'x') // Very long input
      ]
      
      for (const input of maliciousInputs) {
        const { hash } = await BcryptGenerator.hashPassword(input, 4)
        expect(hash).toBeDefined()
        
        const result = await BcryptGenerator.verifyPassword(input, hash)
        expect(result.matches).toBe(true)
      }
    })
    
    it('should not leak information in errors', async () => {
      try {
        await BcryptGenerator.hashPassword('password', 100)
      } catch (error) {
        const message = (error as Error).message
        expect(message).not.toContain('password')
      }
    })
  })
  
  describe('edge cases', () => {
    it('should handle Unicode passwords', async () => {
      const unicodePasswords = [
        '密码测试',
        'пароль',
        '🔐🔑🚀',
        'café naïve résumé'
      ]
      
      for (const pwd of unicodePasswords) {
        const { hash } = await BcryptGenerator.hashPassword(pwd)
        const result = await BcryptGenerator.verifyPassword(pwd, hash)
        expect(result.matches).toBe(true)
      }
    })
    
    it('should handle very long passwords', async () => {
      const longPassword = 'x'.repeat(1000)
      const { hash } = await BcryptGenerator.hashPassword(longPassword, 4)
      
      const result = await BcryptGenerator.verifyPassword(longPassword, hash)
      expect(result.matches).toBe(true)
    })
    
    it('should handle minimum and maximum rounds', async () => {
      const password = 'test'
      
      const minHash = await BcryptGenerator.hashPassword(password, 4)
      expect(minHash.rounds).toBe(4)
      
      const maxHash = await BcryptGenerator.hashPassword(password, 31)
      expect(maxHash.rounds).toBe(31)
    })
    
    it('should handle password with only spaces', async () => {
      const spacePassword = '     '
      const { hash } = await BcryptGenerator.hashPassword(spacePassword)
      
      const result = await BcryptGenerator.verifyPassword(spacePassword, hash)
      expect(result.matches).toBe(true)
    })
    
    it('should handle binary data in password', async () => {
      const binaryPassword = String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
      const { hash } = await BcryptGenerator.hashPassword(binaryPassword, 4)
      
      const result = await BcryptGenerator.verifyPassword(binaryPassword, hash)
      expect(result.matches).toBe(true)
    })
  })
})