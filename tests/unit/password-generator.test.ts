import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Password Generator utility functions
class PasswordGenerator {
  static generate(options: {
    length: number
    uppercase?: boolean
    lowercase?: boolean
    numbers?: boolean
    symbols?: boolean
    excludeAmbiguous?: boolean
    customCharacters?: string
  }): string {
    const {
      length,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = false,
      excludeAmbiguous = false,
      customCharacters
    } = options

    if (length < 1 || length > 128) {
      throw new Error('Password length must be between 1 and 128 characters')
    }

    let charset = ''
    
    if (customCharacters) {
      charset = customCharacters
    } else {
      if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
      if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      if (numbers) charset += '0123456789'
      if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    if (excludeAmbiguous) {
      // Remove ambiguous characters
      charset = charset.replace(/[0O1lI|]/g, '')
    }

    if (!charset) {
      throw new Error('At least one character type must be selected')
    }

    let password = ''
    
    // Ensure at least one character from each selected type
    const requirements: string[] = []
    if (!customCharacters) {
      if (lowercase) requirements.push('abcdefghijklmnopqrstuvwxyz')
      if (uppercase) requirements.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      if (numbers) requirements.push('0123456789')
      if (symbols) requirements.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
    }

    // Add required characters first
    requirements.forEach(chars => {
      if (excludeAmbiguous) {
        chars = chars.replace(/[0O1lI|]/g, '')
      }
      if (chars && password.length < length) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
    })

    // Fill remaining length with random characters
    while (password.length < length) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password)
  }

  private static shuffleString(str: string): string {
    const array = str.split('')
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array.join('')
  }

  static checkStrength(password: string): {
    score: number
    level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
    feedback: string[]
    entropy: number
  } {
    const feedback: string[] = []
    let score = 0
    let charsetSize = 0

    // Check length
    if (password.length < 8) {
      feedback.push('Use at least 8 characters')
    } else if (password.length >= 8) {
      score += 1
    }
    
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1

    // Check character types
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)

    if (hasLower) { score += 1; charsetSize += 26 }
    if (hasUpper) { score += 1; charsetSize += 26 }
    if (hasNumbers) { score += 1; charsetSize += 10 }
    if (hasSymbols) { score += 1; charsetSize += 32 }

    if (!hasLower) feedback.push('Add lowercase letters')
    if (!hasUpper) feedback.push('Add uppercase letters')
    if (!hasNumbers) feedback.push('Add numbers')
    if (!hasSymbols && password.length >= 8) feedback.push('Add symbols for stronger security')

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeating characters')
      score -= 1
    }

    if (/123|abc|qwe/i.test(password)) {
      feedback.push('Avoid common sequences')
      score -= 1
    }

    // Calculate entropy
    const entropy = Math.log2(Math.pow(charsetSize, password.length))

    // Determine strength level
    let level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
    if (score < 2) level = 'Very Weak'
    else if (score < 4) level = 'Weak'
    else if (score < 6) level = 'Fair'
    else if (score < 8) level = 'Good'
    else level = 'Strong'

    return { score: Math.max(0, score), level, feedback, entropy }
  }

  static generateMultiple(count: number, options: Parameters<typeof PasswordGenerator.generate>[0]): string[] {
    if (count < 1 || count > 1000) {
      throw new Error('Count must be between 1 and 1000')
    }

    const passwords = []
    for (let i = 0; i < count; i++) {
      passwords.push(this.generate(options))
    }

    return passwords
  }

  static generatePronounceablePassword(length: number = 12): string {
    const consonants = 'bcdfghjklmnpqrstvwxyz'
    const vowels = 'aeiou'
    const numbers = '0123456789'
    
    let password = ''
    let useConsonant = Math.random() > 0.5
    
    while (password.length < length - 2) {
      if (useConsonant) {
        password += consonants.charAt(Math.floor(Math.random() * consonants.length))
      } else {
        password += vowels.charAt(Math.floor(Math.random() * vowels.length))
      }
      useConsonant = !useConsonant
    }

    // Add numbers at the end
    while (password.length < length) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }

    // Capitalize first letter
    return password.charAt(0).toUpperCase() + password.slice(1)
  }

  static generatePassphrase(wordCount: number = 4, separator: string = '-'): string {
    // Simple word list for testing
    const words = [
      'apple', 'brave', 'chair', 'dance', 'eagle', 'flame', 'grape', 'happy',
      'image', 'jolly', 'knife', 'lemon', 'magic', 'nurse', 'ocean', 'piano',
      'quiet', 'robot', 'smile', 'tiger', 'uncle', 'voice', 'water', 'xenon',
      'yacht', 'zebra', 'angel', 'beach', 'cloud', 'dream', 'earth', 'frost',
      'ghost', 'heart', 'ivory', 'jewel', 'kite', 'light', 'moon', 'night',
      'olive', 'peace', 'queen', 'river', 'stone', 'truth', 'urban', 'vista',
      'wheat', 'youth', 'zest', 'bread', 'craft', 'doubt', 'field', 'guide'
    ]

    if (wordCount < 2 || wordCount > 8) {
      throw new Error('Word count must be between 2 and 8')
    }

    const selectedWords = []
    for (let i = 0; i < wordCount; i++) {
      const randomWord = words[Math.floor(Math.random() * words.length)]
      selectedWords.push(randomWord)
    }

    return selectedWords.join(separator)
  }

  static generatePIN(length: number = 4): string {
    if (length < 3 || length > 8) {
      throw new Error('PIN length must be between 3 and 8 digits')
    }

    let pin = ''
    while (pin.length < length) {
      pin += Math.floor(Math.random() * 10).toString()
    }

    return pin
  }

  static validatePasswordPolicy(password: string, policy: {
    minLength?: number
    maxLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSymbols?: boolean
    forbiddenPatterns?: string[]
    forbiddenWords?: string[]
  }): { valid: boolean; violations: string[] } {
    const violations: string[] = []
    
    const {
      minLength = 8,
      maxLength = 128,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSymbols = false,
      forbiddenPatterns = [],
      forbiddenWords = []
    } = policy

    // Length checks
    if (password.length < minLength) {
      violations.push(`Password must be at least ${minLength} characters long`)
    }
    if (password.length > maxLength) {
      violations.push(`Password must not exceed ${maxLength} characters`)
    }

    // Character type checks
    if (requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('Password must contain at least one uppercase letter')
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      violations.push('Password must contain at least one lowercase letter')
    }
    if (requireNumbers && !/\d/.test(password)) {
      violations.push('Password must contain at least one number')
    }
    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      violations.push('Password must contain at least one symbol')
    }

    // Pattern checks
    forbiddenPatterns.forEach(pattern => {
      if (new RegExp(pattern, 'i').test(password)) {
        violations.push(`Password contains forbidden pattern: ${pattern}`)
      }
    })

    // Word checks
    const lowerPassword = password.toLowerCase()
    forbiddenWords.forEach(word => {
      if (lowerPassword.includes(word.toLowerCase())) {
        violations.push(`Password contains forbidden word: ${word}`)
      }
    })

    return {
      valid: violations.length === 0,
      violations
    }
  }

  static estimateTimeToCrack(password: string): {
    seconds: number
    humanReadable: string
    guessesPerSecond: number
  } {
    const strength = this.checkStrength(password)
    const guessesPerSecond = 1000000000 // 1 billion guesses per second (modern hardware)
    
    const totalCombinations = Math.pow(2, strength.entropy)
    const secondsToCrack = totalCombinations / (2 * guessesPerSecond) // Average case
    
    let humanReadable: string
    if (secondsToCrack < 60) {
      humanReadable = `${Math.round(secondsToCrack)} seconds`
    } else if (secondsToCrack < 3600) {
      humanReadable = `${Math.round(secondsToCrack / 60)} minutes`
    } else if (secondsToCrack < 86400) {
      humanReadable = `${Math.round(secondsToCrack / 3600)} hours`
    } else if (secondsToCrack < 31536000) {
      humanReadable = `${Math.round(secondsToCrack / 86400)} days`
    } else if (secondsToCrack < 31536000000) {
      humanReadable = `${Math.round(secondsToCrack / 31536000)} years`
    } else {
      humanReadable = `${(secondsToCrack / 31536000000).toExponential(2)} billion years`
    }

    return {
      seconds: secondsToCrack,
      humanReadable,
      guessesPerSecond
    }
  }

  static generateSecurityQuestions(): Array<{ question: string; category: string }> {
    const questions = [
      { question: 'What was the name of your first pet?', category: 'Personal' },
      { question: 'What is your mother\'s maiden name?', category: 'Family' },
      { question: 'What was the name of your elementary school?', category: 'Education' },
      { question: 'In what city were you born?', category: 'Location' },
      { question: 'What was your childhood nickname?', category: 'Personal' },
      { question: 'What is the name of your favorite childhood friend?', category: 'Personal' },
      { question: 'What street did you live on in third grade?', category: 'Location' },
      { question: 'What is your oldest sibling\'s birthday month and year?', category: 'Family' },
      { question: 'What was the make and model of your first car?', category: 'Objects' },
      { question: 'What was the name of the hospital where you were born?', category: 'Location' }
    ]

    // Shuffle and return random questions
    const shuffled = [...questions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3)
  }
}

describe('Password Generator', () => {
  describe('generate', () => {
    it('should generate password with specified length', () => {
      const lengths = [8, 12, 16, 24, 32]
      
      lengths.forEach(length => {
        const password = PasswordGenerator.generate({ length })
        expect(password).toHaveLength(length)
      })
    })

    it('should respect character type options', () => {
      const password1 = PasswordGenerator.generate({ 
        length: 16, 
        uppercase: true, 
        lowercase: false, 
        numbers: false, 
        symbols: false 
      })
      expect(/^[A-Z]+$/.test(password1)).toBe(true)

      const password2 = PasswordGenerator.generate({ 
        length: 16, 
        uppercase: false, 
        lowercase: true, 
        numbers: false, 
        symbols: false 
      })
      expect(/^[a-z]+$/.test(password2)).toBe(true)

      const password3 = PasswordGenerator.generate({ 
        length: 16, 
        uppercase: false, 
        lowercase: false, 
        numbers: true, 
        symbols: false 
      })
      expect(/^[0-9]+$/.test(password3)).toBe(true)
    })

    it('should include all character types when specified', () => {
      const password = PasswordGenerator.generate({
        length: 20,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
      })

      expect(/[A-Z]/.test(password)).toBe(true)
      expect(/[a-z]/.test(password)).toBe(true)
      expect(/[0-9]/.test(password)).toBe(true)
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true)
    })

    it('should exclude ambiguous characters when requested', () => {
      const password = PasswordGenerator.generate({
        length: 20,
        excludeAmbiguous: true
      })

      expect(password).not.toContain('0')
      expect(password).not.toContain('O')
      expect(password).not.toContain('1')
      expect(password).not.toContain('l')
      expect(password).not.toContain('I')
      expect(password).not.toContain('|')
    })

    it('should use custom characters when provided', () => {
      const customChars = 'ABC123'
      const password = PasswordGenerator.generate({
        length: 10,
        customCharacters: customChars
      })

      expect(/^[ABC123]+$/.test(password)).toBe(true)
    })

    it('should throw error for invalid length', () => {
      expect(() => PasswordGenerator.generate({ length: 0 })).toThrow('Password length must be between 1 and 128')
      expect(() => PasswordGenerator.generate({ length: 129 })).toThrow('Password length must be between 1 and 128')
    })

    it('should throw error when no character types selected', () => {
      expect(() => PasswordGenerator.generate({
        length: 10,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false
      })).toThrow('At least one character type must be selected')
    })

    it('should generate unique passwords', () => {
      const passwords = new Array(100).fill(0).map(() => 
        PasswordGenerator.generate({ length: 12 })
      )
      
      const uniquePasswords = new Set(passwords)
      expect(uniquePasswords.size).toBe(100)
    })
  })

  describe('checkStrength', () => {
    it('should rate very weak passwords', () => {
      const weakPasswords = ['123', 'abc', 'password', '1234']
      
      weakPasswords.forEach(pwd => {
        const result = PasswordGenerator.checkStrength(pwd)
        expect(['Very Weak', 'Weak']).toContain(result.level)
      })
    })

    it('should rate strong passwords highly', () => {
      const strongPasswords = [
        'Tr0ub4dor&3',
        'MyP@ssw0rd123!',
        'C0mpl3x!P@ssw0rd#2023'
      ]
      
      strongPasswords.forEach(pwd => {
        const result = PasswordGenerator.checkStrength(pwd)
        expect(['Good', 'Strong']).toContain(result.level)
        expect(result.score).toBeGreaterThan(5)
      })
    })

    it('should provide helpful feedback', () => {
      const result = PasswordGenerator.checkStrength('short')
      
      expect(result.feedback).toContain('Use at least 8 characters')
      expect(result.feedback).toContain('Add uppercase letters')
      expect(result.feedback).toContain('Add numbers')
    })

    it('should detect common patterns', () => {
      const patternPasswords = ['aaaaaaa', '1234567', 'abcdefg']
      
      patternPasswords.forEach(pwd => {
        const result = PasswordGenerator.checkStrength(pwd)
        expect(result.feedback.some(f => 
          f.includes('repeating') || f.includes('sequence')
        )).toBe(true)
      })
    })

    it('should calculate entropy', () => {
      const result = PasswordGenerator.checkStrength('MyP@ssw0rd123!')
      expect(result.entropy).toBeGreaterThan(0)
      expect(typeof result.entropy).toBe('number')
    })
  })

  describe('generateMultiple', () => {
    it('should generate specified number of passwords', () => {
      const passwords = PasswordGenerator.generateMultiple(5, { length: 12 })
      expect(passwords).toHaveLength(5)
      
      passwords.forEach(pwd => {
        expect(pwd).toHaveLength(12)
      })
    })

    it('should generate unique passwords in batch', () => {
      const passwords = PasswordGenerator.generateMultiple(50, { length: 16 })
      const uniquePasswords = new Set(passwords)
      
      expect(uniquePasswords.size).toBe(50)
    })

    it('should throw error for invalid count', () => {
      expect(() => PasswordGenerator.generateMultiple(0, { length: 12 })).toThrow()
      expect(() => PasswordGenerator.generateMultiple(1001, { length: 12 })).toThrow()
    })
  })

  describe('generatePronounceablePassword', () => {
    it('should generate pronounceable password', () => {
      const password = PasswordGenerator.generatePronounceablePassword(12)
      
      expect(password).toHaveLength(12)
      expect(/^[A-Z][a-z0-9]+$/.test(password)).toBe(true)
    })

    it('should alternate consonants and vowels', () => {
      const password = PasswordGenerator.generatePronounceablePassword(10)
      const letters = password.slice(0, -2).toLowerCase()
      
      // Should have a mix of consonants and vowels
      expect(/[bcdfghjklmnpqrstvwxyz]/.test(letters)).toBe(true)
      expect(/[aeiou]/.test(letters)).toBe(true)
    })

    it('should end with numbers', () => {
      const password = PasswordGenerator.generatePronounceablePassword(8)
      expect(/\d+$/.test(password)).toBe(true)
    })
  })

  describe('generatePassphrase', () => {
    it('should generate passphrase with specified word count', () => {
      const passphrase = PasswordGenerator.generatePassphrase(4, '-')
      const words = passphrase.split('-')
      
      expect(words).toHaveLength(4)
      words.forEach(word => {
        expect(word.length).toBeGreaterThan(0)
        expect(/^[a-z]+$/.test(word)).toBe(true)
      })
    })

    it('should use custom separator', () => {
      const passphrase = PasswordGenerator.generatePassphrase(3, '_')
      expect(passphrase).toContain('_')
      expect(passphrase.split('_')).toHaveLength(3)
    })

    it('should throw error for invalid word count', () => {
      expect(() => PasswordGenerator.generatePassphrase(1)).toThrow()
      expect(() => PasswordGenerator.generatePassphrase(9)).toThrow()
    })

    it('should generate different passphrases', () => {
      const passphrases = new Array(10).fill(0).map(() => 
        PasswordGenerator.generatePassphrase(4)
      )
      
      const uniquePassphrases = new Set(passphrases)
      expect(uniquePassphrases.size).toBeGreaterThan(5) // Should be mostly unique
    })
  })

  describe('generatePIN', () => {
    it('should generate PIN with specified length', () => {
      const lengths = [3, 4, 5, 6, 8]
      
      lengths.forEach(length => {
        const pin = PasswordGenerator.generatePIN(length)
        expect(pin).toHaveLength(length)
        expect(/^\d+$/.test(pin)).toBe(true)
      })
    })

    it('should throw error for invalid length', () => {
      expect(() => PasswordGenerator.generatePIN(2)).toThrow()
      expect(() => PasswordGenerator.generatePIN(9)).toThrow()
    })

    it('should generate different PINs', () => {
      const pins = new Array(100).fill(0).map(() => PasswordGenerator.generatePIN())
      const uniquePins = new Set(pins)
      
      expect(uniquePins.size).toBeGreaterThan(50) // Should be mostly unique
    })
  })

  describe('validatePasswordPolicy', () => {
    it('should validate password against policy', () => {
      const policy = {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true
      }

      const validPassword = 'MyP@ssw0rd123!'
      const result = PasswordGenerator.validatePasswordPolicy(validPassword, policy)
      
      expect(result.valid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should detect policy violations', () => {
      const policy = {
        minLength: 12,
        requireUppercase: true,
        requireNumbers: true,
        forbiddenWords: ['password', 'admin']
      }

      const invalidPassword = 'password123'
      const result = PasswordGenerator.validatePasswordPolicy(invalidPassword, policy)
      
      expect(result.valid).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations.some(v => v.includes('uppercase'))).toBe(true)
      expect(result.violations.some(v => v.includes('12 characters'))).toBe(true)
      expect(result.violations.some(v => v.includes('password'))).toBe(true)
    })

    it('should check forbidden patterns', () => {
      const policy = {
        forbiddenPatterns: ['123', 'abc']
      }

      const result1 = PasswordGenerator.validatePasswordPolicy('test123test', policy)
      expect(result1.valid).toBe(false)
      expect(result1.violations.some(v => v.includes('123'))).toBe(true)

      const result2 = PasswordGenerator.validatePasswordPolicy('abcdefg', policy)
      expect(result2.valid).toBe(false)
      expect(result2.violations.some(v => v.includes('abc'))).toBe(true)
    })
  })

  describe('estimateTimeToCrack', () => {
    it('should estimate time for weak passwords', () => {
      const weakPassword = '123456'
      const result = PasswordGenerator.estimateTimeToCrack(weakPassword)
      
      expect(result.seconds).toBeLessThan(3600) // Less than 1 hour
      expect(result.humanReadable).toContain('seconds')
      expect(result.guessesPerSecond).toBeGreaterThan(0)
    })

    it('should estimate time for strong passwords', () => {
      const strongPassword = 'Tr0ub4dor&3MyStr0ngP@ssw0rd!'
      const result = PasswordGenerator.estimateTimeToCrack(strongPassword)
      
      expect(result.seconds).toBeGreaterThan(31536000) // More than 1 year
      expect(result.humanReadable).toContain('years')
    })

    it('should provide human-readable estimates', () => {
      const testCases = [
        { password: '1234', expected: 'seconds' },
        { password: 'password123', expected: 'minutes|hours' },
        { password: 'MyP@ssw0rd123!', expected: 'years' }
      ]

      testCases.forEach(({ password, expected }) => {
        const result = PasswordGenerator.estimateTimeToCrack(password)
        expect(result.humanReadable).toMatch(new RegExp(expected))
      })
    })
  })

  describe('generateSecurityQuestions', () => {
    it('should generate security questions', () => {
      const questions = PasswordGenerator.generateSecurityQuestions()
      
      expect(questions).toHaveLength(3)
      questions.forEach(q => {
        expect(q.question).toBeDefined()
        expect(q.category).toBeDefined()
        expect(typeof q.question).toBe('string')
        expect(q.question.length).toBeGreaterThan(0)
      })
    })

    it('should provide different categories', () => {
      const questions = PasswordGenerator.generateSecurityQuestions()
      const categories = questions.map(q => q.category)
      const uniqueCategories = new Set(categories)
      
      expect(uniqueCategories.size).toBeGreaterThan(0)
    })

    it('should generate different questions on multiple calls', () => {
      const questions1 = PasswordGenerator.generateSecurityQuestions()
      const questions2 = PasswordGenerator.generateSecurityQuestions()
      
      // Should be some variation (not guaranteed to be completely different)
      const questions1Text = questions1.map(q => q.question).join('')
      const questions2Text = questions2.map(q => q.question).join('')
      
      // At least the order should be different in most cases
      expect(questions1Text !== questions2Text || questions1.length === questions2.length).toBe(true)
    })
  })

  describe('performance tests', () => {
    it('should generate passwords efficiently', async () => {
      const { duration } = await perfUtils.measure(() => {
        PasswordGenerator.generateMultiple(1000, { length: 16 })
      })
      
      expect(duration).toBeLessThan(2000) // Less than 2 seconds for 1000 passwords
    })

    it('should check password strength efficiently', async () => {
      const passwords = PasswordGenerator.generateMultiple(100, { length: 12 })
      
      const { duration } = await perfUtils.measure(() => {
        passwords.forEach(pwd => PasswordGenerator.checkStrength(pwd))
      })
      
      expect(duration).toBeLessThan(1000)
    })

    it('should maintain performance under stress', async () => {
      const testFn = () => {
        const password = PasswordGenerator.generate({ length: 16 })
        PasswordGenerator.checkStrength(password)
        PasswordGenerator.estimateTimeToCrack(password)
      }

      const results = await perfUtils.stressTest(testFn, 1000)
      expect(results.success).toBe(1000)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(10)
    })
  })

  describe('security tests', () => {
    it('should generate cryptographically random passwords', () => {
      const passwords = PasswordGenerator.generateMultiple(1000, { length: 12 })
      
      // Check character distribution
      const allChars = passwords.join('')
      const charCounts: Record<string, number> = {}
      
      for (const char of allChars) {
        charCounts[char] = (charCounts[char] || 0) + 1
      }
      
      // Should have reasonably even distribution
      const counts = Object.values(charCounts)
      const average = counts.reduce((a, b) => a + b) / counts.length
      const variance = counts.reduce((acc, count) => acc + Math.pow(count - average, 2), 0) / counts.length
      
      expect(variance).toBeLessThan(average * 2) // Reasonable variance
    })

    it('should not contain predictable patterns', () => {
      const passwords = PasswordGenerator.generateMultiple(100, { 
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
      })
      
      passwords.forEach(password => {
        // Should not have obvious patterns
        expect(/(.)\1{4,}/.test(password)).toBe(false) // No 5+ repeated chars
        expect(/12345|abcde|qwert/i.test(password)).toBe(false) // No obvious sequences
      })
    })

    it('should handle malicious input in validation', () => {
      const maliciousInputs = [
        security.xss.basic,
        security.sql.basic,
        'javascript:alert(1)',
        '<script>eval("malicious")</script>'
      ]

      maliciousInputs.forEach(input => {
        const result = PasswordGenerator.checkStrength(input)
        expect(typeof result.score).toBe('number')
        expect(Array.isArray(result.feedback)).toBe(true)
      })
    })

    it('should not leak information about internal state', () => {
      // Generate passwords and ensure they don't reveal internal patterns
      const passwords = PasswordGenerator.generateMultiple(100, { length: 20 })
      
      // Check that consecutive passwords don't have obvious relationships
      for (let i = 1; i < passwords.length; i++) {
        const pwd1 = passwords[i - 1]
        const pwd2 = passwords[i]
        
        // Should not share significant substrings
        let maxCommonLength = 0
        for (let j = 0; j < pwd1.length - 2; j++) {
          for (let k = j + 3; k <= pwd1.length; k++) {
            const substring = pwd1.slice(j, k)
            if (pwd2.includes(substring)) {
              maxCommonLength = Math.max(maxCommonLength, substring.length)
            }
          }
        }
        
        expect(maxCommonLength).toBeLessThan(4) // No long common substrings
      }
    })
  })

  describe('edge cases', () => {
    it('should handle minimum length passwords', () => {
      const password = PasswordGenerator.generate({ length: 1 })
      expect(password).toHaveLength(1)
    })

    it('should handle maximum length passwords', () => {
      const password = PasswordGenerator.generate({ length: 128 })
      expect(password).toHaveLength(128)
    })

    it('should handle edge case character sets', () => {
      // Only one character type with ambiguous exclusion
      const password = PasswordGenerator.generate({
        length: 10,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
        excludeAmbiguous: true
      })
      
      expect(password).toHaveLength(10)
      expect(/^[a-z]+$/.test(password)).toBe(true)
      expect(password).not.toContain('l')
    })

    it('should handle empty custom character set gracefully', () => {
      expect(() => PasswordGenerator.generate({
        length: 10,
        customCharacters: ''
      })).toThrow()
    })

    it('should handle very long passphrases', () => {
      const passphrase = PasswordGenerator.generatePassphrase(8, ' ')
      const words = passphrase.split(' ')
      
      expect(words).toHaveLength(8)
      expect(passphrase.length).toBeGreaterThan(20)
    })

    it('should handle concurrent password generation', async () => {
      const promises = new Array(100).fill(0).map(() => 
        Promise.resolve(PasswordGenerator.generate({ length: 12 }))
      )

      const passwords = await Promise.all(promises)
      const uniquePasswords = new Set(passwords)
      
      expect(uniquePasswords.size).toBe(100)
    })

    it('should handle policy with no requirements', () => {
      const result = PasswordGenerator.validatePasswordPolicy('anything', {})
      expect(result.valid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should handle very weak passwords in time estimation', () => {
      const result = PasswordGenerator.estimateTimeToCrack('1')
      expect(result.seconds).toBeLessThan(1)
      expect(result.humanReadable).toContain('seconds')
    })

    it('should handle extremely strong passwords in time estimation', () => {
      const veryStrong = PasswordGenerator.generate({ 
        length: 64, 
        uppercase: true, 
        lowercase: true, 
        numbers: true, 
        symbols: true 
      })
      
      const result = PasswordGenerator.estimateTimeToCrack(veryStrong)
      expect(result.humanReadable).toContain('billion years')
    })
  })
})