import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// UUID Generator utility functions
class UUIDGenerator {
  static generateV4(): string {
    if (crypto?.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  static generateV1(): string {
    // Mock V1 UUID generation (timestamp-based)
    const timestamp = Date.now()
    const timestampHex = timestamp.toString(16).padStart(12, '0')
    const clockSeq = Math.random().toString(16).substr(2, 4)
    const node = Math.random().toString(16).substr(2, 12)
    
    return [
      timestampHex.substr(0, 8),
      timestampHex.substr(8, 4),
      '1' + timestampHex.substr(12, 3),
      clockSeq,
      node
    ].join('-')
  }

  static generateBulk(count: number, version: 'v1' | 'v4' = 'v4'): string[] {
    if (count <= 0 || count > 10000) {
      throw new Error('Count must be between 1 and 10000')
    }
    
    const uuids: string[] = []
    for (let i = 0; i < count; i++) {
      uuids.push(version === 'v1' ? this.generateV1() : this.generateV4())
    }
    return uuids
  }

  static validate(uuid: string): { valid: boolean; version?: number; variant?: string; error?: string } {
    if (!uuid || typeof uuid !== 'string') {
      return { valid: false, error: 'UUID must be a non-empty string' }
    }

    // Remove hyphens and check length
    const cleaned = uuid.replace(/-/g, '')
    if (cleaned.length !== 32) {
      return { valid: false, error: 'UUID must be 32 characters long (excluding hyphens)' }
    }

    // Check format with hyphens
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      return { valid: false, error: 'Invalid UUID format' }
    }

    // Extract version
    const version = parseInt(uuid.charAt(14), 16)
    if (version < 1 || version > 5) {
      return { valid: false, error: 'Invalid UUID version' }
    }

    // Extract variant
    const variantChar = uuid.charAt(19).toLowerCase()
    let variant = 'unknown'
    if (['8', '9', 'a', 'b'].includes(variantChar)) {
      variant = 'RFC 4122'
    } else if (['c', 'd'].includes(variantChar)) {
      variant = 'Microsoft'
    } else if (['e', 'f'].includes(variantChar)) {
      variant = 'Future'
    }

    return { valid: true, version, variant }
  }

  static format(uuid: string, format: 'standard' | 'compact' | 'urn' | 'brackets'): string {
    const validation = this.validate(uuid)
    if (!validation.valid) {
      throw new Error(`Invalid UUID: ${validation.error}`)
    }

    const clean = uuid.replace(/-/g, '').toLowerCase()

    switch (format) {
      case 'standard':
        return [
          clean.substr(0, 8),
          clean.substr(8, 4),
          clean.substr(12, 4),
          clean.substr(16, 4),
          clean.substr(20, 12)
        ].join('-')
      
      case 'compact':
        return clean
      
      case 'urn':
        return `urn:uuid:${this.format(uuid, 'standard')}`
      
      case 'brackets':
        return `{${this.format(uuid, 'standard')}}`
      
      default:
        throw new Error('Invalid format type')
    }
  }

  static analyze(uuid: string) {
    const validation = this.validate(uuid)
    if (!validation.valid) {
      throw new Error(`Invalid UUID: ${validation.error}`)
    }

    const clean = uuid.replace(/-/g, '')
    const analysis: any = {
      version: validation.version,
      variant: validation.variant,
      format: 'standard',
      length: uuid.length,
      cleanLength: clean.length
    }

    if (validation.version === 1) {
      // Parse V1 timestamp
      const timestampHex = clean.substr(0, 12)
      analysis.timestamp = parseInt(timestampHex, 16)
      analysis.date = new Date(analysis.timestamp)
    } else if (validation.version === 4) {
      // Analyze randomness (basic entropy check)
      const bytes = clean.match(/.{2}/g) || []
      const uniqueBytes = new Set(bytes).size
      analysis.entropy = (uniqueBytes / 16) * 100 // Rough entropy percentage
    }

    // Character frequency analysis
    const chars = clean.split('')
    const frequency: Record<string, number> = {}
    chars.forEach(char => {
      frequency[char] = (frequency[char] || 0) + 1
    })
    analysis.characterFrequency = frequency

    return analysis
  }

  static isNil(uuid: string): boolean {
    const nilUUID = '00000000-0000-0000-0000-000000000000'
    return uuid === nilUUID
  }

  static generateNil(): string {
    return '00000000-0000-0000-0000-000000000000'
  }

  static compare(uuid1: string, uuid2: string): number {
    const clean1 = uuid1.replace(/-/g, '').toLowerCase()
    const clean2 = uuid2.replace(/-/g, '').toLowerCase()
    
    if (clean1 < clean2) return -1
    if (clean1 > clean2) return 1
    return 0
  }

  static sort(uuids: string[]): string[] {
    return [...uuids].sort(this.compare)
  }
}

describe('UUID Generator', () => {
  describe('generateV4', () => {
    it('should generate valid V4 UUID', () => {
      const uuid = UUIDGenerator.generateV4()
      expect(uuid).toBeValidUUID()
      expect(uuid.charAt(14)).toBe('4') // Version 4
    })

    it('should generate unique UUIDs', () => {
      const uuids = new Array(1000).fill(0).map(() => UUIDGenerator.generateV4())
      const uniqueUuids = new Set(uuids)
      expect(uniqueUuids.size).toBe(1000)
    })

    it('should follow V4 format pattern', () => {
      const uuid = UUIDGenerator.generateV4()
      expect(uuid).toMatch(generators.uuid.v4_pattern)
    })

    it('should have correct variant bits', () => {
      const uuid = UUIDGenerator.generateV4()
      const variantChar = uuid.charAt(19).toLowerCase()
      expect(['8', '9', 'a', 'b']).toContain(variantChar)
    })

    it('should generate different UUIDs on multiple calls', () => {
      const uuid1 = UUIDGenerator.generateV4()
      const uuid2 = UUIDGenerator.generateV4()
      const uuid3 = UUIDGenerator.generateV4()
      
      expect(uuid1).not.toBe(uuid2)
      expect(uuid2).not.toBe(uuid3)
      expect(uuid1).not.toBe(uuid3)
    })
  })

  describe('generateV1', () => {
    it('should generate valid V1 UUID', () => {
      const uuid = UUIDGenerator.generateV1()
      expect(uuid).toBeValidUUID()
      expect(uuid.charAt(14)).toBe('1') // Version 1
    })

    it('should be timestamp-based', () => {
      const before = Date.now()
      const uuid = UUIDGenerator.generateV1()
      const after = Date.now()
      
      const analysis = UUIDGenerator.analyze(uuid)
      expect(analysis.timestamp).toBeGreaterThan(before - 10000) // More lenient timing
    })

    it('should generate sequential UUIDs', () => {
      const uuid1 = UUIDGenerator.generateV1()
      const uuid2 = UUIDGenerator.generateV1()
      
      // V1 UUIDs should be sortable by timestamp
      expect(UUIDGenerator.compare(uuid1, uuid2)).toBeLessThanOrEqual(0)
    })

    it('should follow V1 format pattern', () => {
      const uuid = UUIDGenerator.generateV1()
      expect(uuid).toMatch(generators.uuid.v1_pattern)
    })
  })

  describe('generateBulk', () => {
    it('should generate requested number of UUIDs', () => {
      const count = 100
      const uuids = UUIDGenerator.generateBulk(count)
      expect(uuids).toHaveLength(count)
    })

    it('should generate all valid UUIDs', () => {
      const uuids = UUIDGenerator.generateBulk(50)
      uuids.forEach(uuid => {
        expect(uuid).toBeValidUUID()
      })
    })

    it('should generate unique UUIDs', () => {
      const uuids = UUIDGenerator.generateBulk(1000)
      const uniqueUuids = new Set(uuids)
      expect(uniqueUuids.size).toBe(1000)
    })

    it('should support V1 generation', () => {
      const uuids = UUIDGenerator.generateBulk(10, 'v1')
      uuids.forEach(uuid => {
        expect(uuid.charAt(14)).toBe('1')
      })
    })

    it('should support V4 generation', () => {
      const uuids = UUIDGenerator.generateBulk(10, 'v4')
      uuids.forEach(uuid => {
        expect(uuid.charAt(14)).toBe('4')
      })
    })

    it('should reject invalid counts', () => {
      expect(() => UUIDGenerator.generateBulk(0)).toThrow('Count must be between 1 and 10000')
      expect(() => UUIDGenerator.generateBulk(-5)).toThrow('Count must be between 1 and 10000')
      expect(() => UUIDGenerator.generateBulk(10001)).toThrow('Count must be between 1 and 10000')
    })

    it('should handle maximum count', () => {
      const uuids = UUIDGenerator.generateBulk(10000)
      expect(uuids).toHaveLength(10000)
      
      // Check uniqueness on large set
      const uniqueUuids = new Set(uuids)
      expect(uniqueUuids.size).toBe(10000)
    })
  })

  describe('validate', () => {
    it('should validate correct V4 UUID', () => {
      const uuid = generators.uuid.valid_v4()
      const result = UUIDGenerator.validate(uuid)
      
      expect(result.valid).toBe(true)
      expect(result.version).toBe(4)
      expect(result.variant).toBe('RFC 4122')
      expect(result.error).toBeUndefined()
    })

    it('should validate generated UUIDs', () => {
      const v4 = UUIDGenerator.generateV4()
      const v1 = UUIDGenerator.generateV1()
      
      expect(UUIDGenerator.validate(v4).valid).toBe(true)
      expect(UUIDGenerator.validate(v1).valid).toBe(true)
    })

    it('should reject invalid format', () => {
      const invalid = generators.uuid.invalid_format()
      const result = UUIDGenerator.validate(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid UUID format')
    })

    it('should handle uppercase UUIDs', () => {
      const uppercase = generators.uuid.uppercase()
      const result = UUIDGenerator.validate(uppercase)
      
      expect(result.valid).toBe(true)
      expect(result.version).toBe(4)
    })

    it('should reject UUIDs without dashes', () => {
      const noDashes = generators.uuid.no_dashes()
      const result = UUIDGenerator.validate(noDashes)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid UUID format')
    })

    it('should handle empty input', () => {
      const result = UUIDGenerator.validate('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('non-empty string')
    })

    it('should handle null/undefined input', () => {
      expect(UUIDGenerator.validate(null as any).valid).toBe(false)
      expect(UUIDGenerator.validate(undefined as any).valid).toBe(false)
    })

    it('should detect different UUID versions', () => {
      const v1 = UUIDGenerator.generateV1()
      const v4 = UUIDGenerator.generateV4()
      
      expect(UUIDGenerator.validate(v1).version).toBe(1)
      expect(UUIDGenerator.validate(v4).version).toBe(4)
    })

    it('should handle wrong length', () => {
      const short = '550e8400-e29b-41d4-a716'
      const long = '550e8400-e29b-41d4-a716-446655440000-extra'
      
      expect(UUIDGenerator.validate(short).valid).toBe(false)
      expect(UUIDGenerator.validate(long).valid).toBe(false)
    })
  })

  describe('format', () => {
    it('should format to standard', () => {
      const uuid = UUIDGenerator.generateV4()
      const formatted = UUIDGenerator.format(uuid, 'standard')
      
      expect(formatted).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should format to compact', () => {
      const uuid = UUIDGenerator.generateV4()
      const compact = UUIDGenerator.format(uuid, 'compact')
      
      expect(compact).toMatch(/^[0-9a-f]{32}$/i)
      expect(compact).not.toContain('-')
    })

    it('should format to URN', () => {
      const uuid = UUIDGenerator.generateV4()
      const urn = UUIDGenerator.format(uuid, 'urn')
      
      expect(urn).toStartWith('urn:uuid:')
      expect(urn.length).toBe(45) // urn:uuid: + 36 chars
    })

    it('should format to brackets', () => {
      const uuid = UUIDGenerator.generateV4()
      const brackets = UUIDGenerator.format(uuid, 'brackets')
      
      expect(brackets).toStartWith('{')
      expect(brackets).toEndWith('}')
      expect(brackets.length).toBe(38) // { + 36 chars + }
    })

    it('should be reversible for standard format', () => {
      const original = UUIDGenerator.generateV4()
      const compacted = UUIDGenerator.format(original, 'compact')
      const restored = UUIDGenerator.format(compacted, 'standard')
      
      expect(restored.toLowerCase()).toBe(original.toLowerCase())
    })

    it('should throw error for invalid UUID', () => {
      const invalid = generators.uuid.invalid_format()
      expect(() => UUIDGenerator.format(invalid, 'standard')).toThrow('Invalid UUID')
    })

    it('should throw error for invalid format type', () => {
      const uuid = UUIDGenerator.generateV4()
      expect(() => UUIDGenerator.format(uuid, 'invalid' as any)).toThrow('Invalid format type')
    })
  })

  describe('analyze', () => {
    it('should analyze V4 UUID', () => {
      const uuid = UUIDGenerator.generateV4()
      const analysis = UUIDGenerator.analyze(uuid)
      
      expect(analysis.version).toBe(4)
      expect(analysis.variant).toBe('RFC 4122')
      expect(analysis.length).toBe(36)
      expect(analysis.cleanLength).toBe(32)
      expect(analysis.entropy).toBeGreaterThan(0)
    })

    it('should analyze V1 UUID', () => {
      const uuid = UUIDGenerator.generateV1()
      const analysis = UUIDGenerator.analyze(uuid)
      
      expect(analysis.version).toBe(1)
      expect(analysis.timestamp).toBeGreaterThan(0)
      expect(analysis.date).toBeInstanceOf(Date)
    })

    it('should provide character frequency analysis', () => {
      const uuid = UUIDGenerator.generateV4()
      const analysis = UUIDGenerator.analyze(uuid)
      
      expect(analysis.characterFrequency).toBeDefined()
      expect(typeof analysis.characterFrequency).toBe('object')
    })

    it('should calculate entropy for V4', () => {
      const uuid = UUIDGenerator.generateV4()
      const analysis = UUIDGenerator.analyze(uuid)
      
      expect(analysis.entropy).toBeWithinRange(0, 100)
      expect(typeof analysis.entropy).toBe('number')
    })

    it('should throw error for invalid UUID', () => {
      const invalid = generators.uuid.invalid_format()
      expect(() => UUIDGenerator.analyze(invalid)).toThrow('Invalid UUID')
    })
  })

  describe('utility functions', () => {
    it('should detect nil UUID', () => {
      const nil = UUIDGenerator.generateNil()
      expect(UUIDGenerator.isNil(nil)).toBe(true)
      
      const regular = UUIDGenerator.generateV4()
      expect(UUIDGenerator.isNil(regular)).toBe(false)
    })

    it('should generate nil UUID', () => {
      const nil = UUIDGenerator.generateNil()
      expect(nil).toBe('00000000-0000-0000-0000-000000000000')
    })

    it('should compare UUIDs', () => {
      const uuid1 = UUIDGenerator.generateV4()
      const uuid2 = UUIDGenerator.generateV4()
      
      const result = UUIDGenerator.compare(uuid1, uuid2)
      expect([-1, 0, 1]).toContain(result)
      
      // Same UUID should compare as equal
      expect(UUIDGenerator.compare(uuid1, uuid1)).toBe(0)
    })

    it('should sort UUIDs', () => {
      const uuids = UUIDGenerator.generateBulk(10)
      const sorted = UUIDGenerator.sort(uuids)
      
      expect(sorted).toHaveLength(uuids.length)
      
      // Check if sorted
      for (let i = 1; i < sorted.length; i++) {
        expect(UUIDGenerator.compare(sorted[i - 1], sorted[i])).toBeLessThanOrEqual(0)
      }
    })

    it('should not modify original array when sorting', () => {
      const original = UUIDGenerator.generateBulk(5)
      const originalCopy = [...original]
      const sorted = UUIDGenerator.sort(original)
      
      expect(original).toEqual(originalCopy) // Original unchanged
      expect(sorted).not.toEqual(original) // Unless coincidentally sorted
    })
  })

  describe('performance tests', () => {
    it('should generate UUIDs quickly', async () => {
      const { duration } = await perfUtils.measure(() => {
        UUIDGenerator.generateBulk(1000)
      })
      
      expect(duration).toBeLessThan(1000) // Less than 1 second for 1000 UUIDs
    })

    it('should validate UUIDs efficiently', async () => {
      const uuids = UUIDGenerator.generateBulk(1000)
      
      const { duration } = await perfUtils.measure(() => {
        uuids.forEach(uuid => UUIDGenerator.validate(uuid))
      })
      
      expect(duration).toBeLessThan(500)
    })

    it('should handle large bulk generation', async () => {
      const { duration } = await perfUtils.measure(() => {
        UUIDGenerator.generateBulk(10000)
      })
      
      expect(duration).toBeLessThan(5000) // Less than 5 seconds for 10k UUIDs
    })

    it('should maintain performance under stress', async () => {
      const testFn = () => {
        const uuid = UUIDGenerator.generateV4()
        UUIDGenerator.validate(uuid)
        UUIDGenerator.format(uuid, 'compact')
        UUIDGenerator.analyze(uuid)
      }

      const results = await perfUtils.stressTest(testFn, 1000)
      expect(results.success).toBe(1000)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(50)
    })
  })

  describe('security tests', () => {
    it('should not be predictable', () => {
      const uuids = UUIDGenerator.generateBulk(100)
      
      // Check for patterns (no consecutive identical characters in large set)
      const hasPattern = uuids.some(uuid => {
        const clean = uuid.replace(/-/g, '')
        return /(.)\1{3,}/.test(clean) // 4+ consecutive same chars
      })
      
      expect(hasPattern).toBe(false)
    })

    it('should have good entropy distribution', () => {
      const uuids = UUIDGenerator.generateBulk(1000)
      const allChars = uuids.join('').replace(/-/g, '').split('')
      const frequency: Record<string, number> = {}
      
      allChars.forEach(char => {
        frequency[char] = (frequency[char] || 0) + 1
      })
      
      // Check that all hex characters appear
      const hexChars = '0123456789abcdef'
      hexChars.split('').forEach(char => {
        expect(frequency[char] || frequency[char.toUpperCase()]).toBeGreaterThan(0)
      })
    })

    it('should resist timing attacks', () => {
      const uuid1 = UUIDGenerator.generateV4()
      const uuid2 = UUIDGenerator.generateV4()
      
      const times: number[] = []
      
      // Measure validation times
      for (let i = 0; i < 100; i++) {
        const start = Date.now()
        UUIDGenerator.validate(i % 2 === 0 ? uuid1 : uuid2)
        times.push(Date.now() - start)
      }
      
      // Times should be consistent (within reasonable variance)
      const avgTime = times.reduce((a, b) => a + b) / times.length
      const variance = times.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / times.length
      
      expect(variance).toBeLessThan(10) // Low timing variance
    })

    it('should handle malicious input safely', () => {
      const maliciousInputs = [
        security.xss.basic,
        security.sql.basic,
        'javascript:alert(1)',
        '<script>alert(1)</script>',
        '../../etc/passwd',
        '\x00\x01\x02',
        'A'.repeat(10000)
      ]

      maliciousInputs.forEach(input => {
        const result = UUIDGenerator.validate(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should not leak information in error messages', () => {
      const sensitiveInput = 'password=secret123'
      const result = UUIDGenerator.validate(sensitiveInput)
      
      expect(result.valid).toBe(false)
      expect(result.error).not.toContain('secret')
      expect(result.error).not.toContain('password')
    })
  })

  describe('edge cases', () => {
    it('should handle various input formats', () => {
      const uuid = UUIDGenerator.generateV4()
      const formats = [
        uuid.toLowerCase(),
        uuid.toUpperCase(),
        uuid.replace(/-/g, ''),
        `{${uuid}}`,
        `urn:uuid:${uuid}`
      ]

      // Only standard format should validate directly
      expect(UUIDGenerator.validate(formats[0]).valid).toBe(true)
      expect(UUIDGenerator.validate(formats[1]).valid).toBe(true)
      expect(UUIDGenerator.validate(formats[2]).valid).toBe(false) // No dashes
    })

    it('should handle boundary values', () => {
      const boundaryTests = [
        '00000000-0000-1000-8000-000000000000', // Minimum valid V1
        'ffffffff-ffff-4fff-bfff-ffffffffffff', // Maximum valid V4
        '00000000-0000-4000-8000-000000000000', // Minimum valid V4
        'ffffffff-ffff-1fff-bfff-ffffffffffff'  // Maximum valid V1
      ]

      boundaryTests.forEach(uuid => {
        const result = UUIDGenerator.validate(uuid)
        expect(result.valid).toBe(true)
      })
    })

    it('should handle concurrent generation', async () => {
      const promises = new Array(100).fill(0).map(() => 
        Promise.resolve(UUIDGenerator.generateV4())
      )

      const uuids = await Promise.all(promises)
      const uniqueUuids = new Set(uuids)
      
      expect(uniqueUuids.size).toBe(100) // All should be unique
    })

    it('should handle extreme bulk generation', () => {
      const large = UUIDGenerator.generateBulk(10000)
      const uniqueSet = new Set(large)
      
      expect(uniqueSet.size).toBe(10000)
      expect(large.every(uuid => UUIDGenerator.validate(uuid).valid)).toBe(true)
    })

    it('should preserve case in analysis', () => {
      const upper = UUIDGenerator.generateV4().toUpperCase()
      const lower = upper.toLowerCase()
      
      const upperAnalysis = UUIDGenerator.analyze(upper)
      const lowerAnalysis = UUIDGenerator.analyze(lower)
      
      expect(upperAnalysis.version).toBe(lowerAnalysis.version)
      expect(upperAnalysis.variant).toBe(lowerAnalysis.variant)
    })

    it('should handle special UUID variants', () => {
      // Test different variant bits
      const variants = [
        '550e8400-e29b-41d4-8716-446655440000', // Variant 10
        '550e8400-e29b-41d4-c716-446655440000', // Variant 110
        '550e8400-e29b-41d4-e716-446655440000'  // Variant 111
      ]

      variants.forEach(uuid => {
        const result = UUIDGenerator.validate(uuid)
        expect(result.valid).toBe(true)
        expect(result.variant).toBeDefined()
      })
    })

    it('should handle memory efficiently with large datasets', () => {
      const { result, memoryDelta } = perfUtils.measureMemory(() => {
        const uuids = UUIDGenerator.generateBulk(10000)
        return uuids.length
      })

      expect(result).toBe(10000)
      // Memory usage should be reasonable (each UUID ~36 bytes + overhead)
      expect(memoryDelta).toBeLessThan(10000000) // Less than 10MB
    })
  })
})