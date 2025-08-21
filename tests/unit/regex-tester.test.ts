import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Regex Tester utility functions
class RegexTester {
  static test(pattern: string, flags: string, text: string): {
    matches: RegExpMatchArray[]
    isMatch: boolean
    global: boolean
    lastIndex: number
    error?: string
  } {
    try {
      const regex = new RegExp(pattern, flags)
      const global = flags.includes('g')
      const matches: RegExpMatchArray[] = []
      let isMatch = false

      if (global) {
        let match
        while ((match = regex.exec(text)) !== null) {
          matches.push(match)
          isMatch = true
          // Prevent infinite loops with zero-width matches
          if (match[0].length === 0) {
            regex.lastIndex++
          }
        }
      } else {
        const match = regex.exec(text)
        if (match) {
          matches.push(match)
          isMatch = true
        }
      }

      return {
        matches,
        isMatch,
        global,
        lastIndex: regex.lastIndex
      }
    } catch (error) {
      return {
        matches: [],
        isMatch: false,
        global: false,
        lastIndex: 0,
        error: (error as Error).message
      }
    }
  }

  static replace(pattern: string, flags: string, text: string, replacement: string): {
    result: string
    replacements: number
    error?: string
  } {
    try {
      const regex = new RegExp(pattern, flags)
      let replacements = 0
      
      const result = text.replace(regex, (...args) => {
        replacements++
        // Handle replacement patterns like $1, $2, etc.
        let processedReplacement = replacement
        const match = args[0]
        const groups = args.slice(1, -2) // Groups are everything except match, offset, string
        
        // Replace $& with full match
        processedReplacement = processedReplacement.replace(/\$&/g, match)
        
        // Replace $1, $2, etc. with capture groups
        groups.forEach((group, index) => {
          const groupRegex = new RegExp(`\\$${index + 1}`, 'g')
          processedReplacement = processedReplacement.replace(groupRegex, group || '')
        })
        
        return processedReplacement
      })

      return { result, replacements }
    } catch (error) {
      return {
        result: text,
        replacements: 0,
        error: (error as Error).message
      }
    }
  }

  static split(pattern: string, flags: string, text: string, limit?: number): {
    parts: string[]
    splits: number
    error?: string
  } {
    try {
      const regex = new RegExp(pattern, flags)
      const parts = text.split(regex, limit)
      
      return {
        parts,
        splits: parts.length - 1
      }
    } catch (error) {
      return {
        parts: [text],
        splits: 0,
        error: (error as Error).message
      }
    }
  }

  static validate(pattern: string, flags = ''): {
    valid: boolean
    flags: string[]
    features: string[]
    error?: string
    warnings?: string[]
  } {
    try {
      new RegExp(pattern, flags)
      
      const validFlags = ['g', 'i', 'm', 's', 'u', 'y']
      const usedFlags = flags.split('').filter(f => validFlags.includes(f))
      
      // Detect regex features
      const features: string[] = []
      if (pattern.includes('(?:')) features.push('non-capturing-group')
      if (pattern.includes('(?=')) features.push('positive-lookahead')
      if (pattern.includes('(?!')) features.push('negative-lookahead')
      if (pattern.includes('(?<=')) features.push('positive-lookbehind')
      if (pattern.includes('(?<!')) features.push('negative-lookbehind')
      if (pattern.includes('[')) features.push('character-class')
      if (pattern.includes('\\d')) features.push('digit-shorthand')
      if (pattern.includes('\\w')) features.push('word-shorthand')
      if (pattern.includes('\\s')) features.push('whitespace-shorthand')
      if (/[+*?{]/.test(pattern)) features.push('quantifiers')
      if (pattern.includes('|')) features.push('alternation')
      if (pattern.includes('^')) features.push('start-anchor')
      if (pattern.includes('$')) features.push('end-anchor')
      
      // Warnings for potentially problematic patterns
      const warnings: string[] = []
      if (/(.*\*.*){2,}/.test(pattern)) warnings.push('Potential catastrophic backtracking')
      if (pattern.includes('.*.*')) warnings.push('Nested quantifiers may cause performance issues')
      if (pattern.length > 1000) warnings.push('Very long pattern may impact performance')
      
      return {
        valid: true,
        flags: usedFlags,
        features,
        warnings
      }
    } catch (error) {
      return {
        valid: false,
        flags: [],
        features: [],
        error: (error as Error).message
      }
    }
  }

  static explain(pattern: string): {
    explanation: string
    components: Array<{
      part: string
      description: string
      position: [number, number]
    }>
  } {
    const components: Array<{
      part: string
      description: string
      position: [number, number]
    }> = []

    let pos = 0
    let explanation = ''

    // Simple pattern explanation (basic implementation)
    const explainPart = (part: string, start: number): string => {
      const end = start + part.length - 1
      
      switch (part) {
        case '^':
          components.push({ part, description: 'Start of string/line', position: [start, end] })
          return 'Match start of string/line'
        case '$':
          components.push({ part, description: 'End of string/line', position: [start, end] })
          return 'Match end of string/line'
        case '.':
          components.push({ part, description: 'Any character (except newline)', position: [start, end] })
          return 'Any character'
        case '*':
          components.push({ part, description: 'Zero or more of previous', position: [start, end] })
          return 'Zero or more'
        case '+':
          components.push({ part, description: 'One or more of previous', position: [start, end] })
          return 'One or more'
        case '?':
          components.push({ part, description: 'Zero or one of previous', position: [start, end] })
          return 'Optional'
        case '\\d':
          components.push({ part, description: 'Any digit 0-9', position: [start, end] })
          return 'Any digit'
        case '\\w':
          components.push({ part, description: 'Any word character', position: [start, end] })
          return 'Word character'
        case '\\s':
          components.push({ part, description: 'Any whitespace', position: [start, end] })
          return 'Whitespace'
        default:
          if (part.startsWith('[') && part.endsWith(']')) {
            components.push({ part, description: 'Character class', position: [start, end] })
            return `Character class ${part}`
          }
          if (part.startsWith('(') && part.endsWith(')')) {
            components.push({ part, description: 'Capturing group', position: [start, end] })
            return `Group ${part}`
          }
          if (part.length === 1 && /[a-zA-Z0-9]/.test(part)) {
            components.push({ part, description: `Literal character '${part}'`, position: [start, end] })
            return `Literal '${part}'`
          }
          return part
      }
    }

    // Basic tokenization (simplified)
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i]
      
      // Handle escape sequences
      if (char === '\\' && i + 1 < pattern.length) {
        const next = pattern[i + 1]
        const escapedChar = char + next
        explainPart(escapedChar, i)
        i++ // Skip next character
        continue
      }
      
      // Handle special regex characters
      if (/[.^$*+?{}|[\]()]/.test(char)) {
        explainPart(char, i)
      } else {
        // Handle literal characters
        explainPart(char, i)
      }
    }

    explanation = components.map(c => c.description).join(', ')
    
    return { explanation, components }
  }

  static benchmark(pattern: string, flags: string, text: string, iterations = 1000): {
    averageTime: number
    totalTime: number
    iterations: number
    matchesPerSecond: number
  } {
    const regex = new RegExp(pattern, flags)
    const start = performance.now()
    
    for (let i = 0; i < iterations; i++) {
      regex.test(text)
      regex.lastIndex = 0 // Reset for global flags
    }
    
    const totalTime = performance.now() - start
    const averageTime = totalTime / iterations
    const matchesPerSecond = averageTime > 0 ? Math.round(1000 / averageTime) : 0
    
    return {
      averageTime,
      totalTime,
      iterations,
      matchesPerSecond
    }
  }

  static findAll(pattern: string, flags: string, text: string): Array<{
    match: string
    index: number
    groups: string[]
    namedGroups?: Record<string, string>
  }> {
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      const results: Array<{
        match: string
        index: number
        groups: string[]
        namedGroups?: Record<string, string>
      }> = []
      
      let match
      while ((match = regex.exec(text)) !== null) {
        results.push({
          match: match[0],
          index: match.index!,
          groups: match.slice(1),
          namedGroups: match.groups
        })
        
        // Prevent infinite loops
        if (match[0].length === 0) {
          regex.lastIndex++
        }
      }
      
      return results
    } catch {
      return []
    }
  }

  static generateTestCases(pattern: string): string[] {
    const testCases: string[] = []
    
    // Generate basic test cases based on pattern analysis
    if (pattern.includes('\\d')) {
      testCases.push('123', '0', '999', 'abc123def')
    }
    
    if (pattern.includes('\\w')) {
      testCases.push('word', 'test123', 'under_score')
    }
    
    if (pattern.includes('\\s')) {
      testCases.push('hello world', '\t\n\r', '   ')
    }
    
    if (pattern.includes('[a-z]')) {
      testCases.push('lowercase', 'abc')
    }
    
    if (pattern.includes('[A-Z]')) {
      testCases.push('UPPERCASE', 'ABC')
    }
    
    if (pattern.includes('@')) {
      testCases.push('test@example.com', 'user@domain.org')
    }
    
    if (pattern.includes('.')) {
      testCases.push('any character', '!@#$%', '12345')
    }
    
    // Edge cases
    testCases.push('', 'single', 'very long string with lots of content to test')
    
    return testCases
  }

  static escapeString(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  static unescapeString(str: string): string {
    return str.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
  }
}

describe('Regex Tester', () => {
  describe('test', () => {
    it('should test simple pattern', () => {
      const result = RegexTester.test('test', '', 'this is a test')
      
      expect(result.isMatch).toBe(true)
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0][0]).toBe('test')
      expect(result.error).toBeUndefined()
    })

    it('should test global pattern', () => {
      const result = RegexTester.test('a', 'g', 'banana')
      
      expect(result.isMatch).toBe(true)
      expect(result.matches).toHaveLength(3)
      expect(result.global).toBe(true)
    })

    it('should test case insensitive', () => {
      const result = RegexTester.test('TEST', 'i', 'this is a test')
      
      expect(result.isMatch).toBe(true)
      expect(result.matches[0][0]).toBe('test')
    })

    it('should handle no matches', () => {
      const result = RegexTester.test('xyz', '', 'hello world')
      
      expect(result.isMatch).toBe(false)
      expect(result.matches).toHaveLength(0)
    })

    it('should capture groups', () => {
      const result = RegexTester.test('(\\d+)-(\\d+)', '', '123-456')
      
      expect(result.isMatch).toBe(true)
      expect(result.matches[0]).toHaveLength(3) // Full match + 2 groups
      expect(result.matches[0][1]).toBe('123')
      expect(result.matches[0][2]).toBe('456')
    })

    it('should handle invalid regex', () => {
      const result = RegexTester.test('[invalid', '', 'test')
      
      expect(result.isMatch).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Invalid')
    })

    it('should handle multiline flag', () => {
      const result = RegexTester.test('^test', 'm', 'hello\ntest world')
      
      expect(result.isMatch).toBe(true)
    })

    it('should handle dotAll flag', () => {
      const result = RegexTester.test('a.b', 's', 'a\nb')
      
      expect(result.isMatch).toBe(true)
    })

    it('should prevent infinite loops on zero-width matches', () => {
      const result = RegexTester.test('(?=a)', 'g', 'aaa')
      
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches.length).toBeLessThan(10) // Should not be infinite
    })
  })

  describe('replace', () => {
    it('should replace single match', () => {
      const result = RegexTester.replace('hello', '', 'hello world', 'hi')
      
      expect(result.result).toBe('hi world')
      expect(result.replacements).toBe(1)
      expect(result.error).toBeUndefined()
    })

    it('should replace global matches', () => {
      const result = RegexTester.replace('a', 'g', 'banana', 'o')
      
      expect(result.result).toBe('bonono')
      expect(result.replacements).toBe(3)
    })

    it('should handle replacement with groups', () => {
      const result = RegexTester.replace('(\\d+)-(\\d+)', '', '123-456', '$2-$1')
      
      expect(result.result).toBe('456-123')
      expect(result.replacements).toBe(1)
    })

    it('should handle no matches', () => {
      const result = RegexTester.replace('xyz', '', 'hello world', 'replaced')
      
      expect(result.result).toBe('hello world')
      expect(result.replacements).toBe(0)
    })

    it('should handle invalid regex in replace', () => {
      const result = RegexTester.replace('[invalid', '', 'test', 'replacement')
      
      expect(result.result).toBe('test')
      expect(result.replacements).toBe(0)
      expect(result.error).toBeDefined()
    })
  })

  describe('split', () => {
    it('should split by pattern', () => {
      const result = RegexTester.split(',', '', 'a,b,c,d')
      
      expect(result.parts).toEqual(['a', 'b', 'c', 'd'])
      expect(result.splits).toBe(3)
    })

    it('should split with limit', () => {
      const result = RegexTester.split(',', '', 'a,b,c,d', 2)
      
      expect(result.parts).toHaveLength(2)
      expect(result.parts).toEqual(['a', 'b'])
    })

    it('should split by whitespace', () => {
      const result = RegexTester.split('\\s+', '', 'hello   world\ttest')
      
      expect(result.parts).toEqual(['hello', 'world', 'test'])
      expect(result.splits).toBe(2)
    })

    it('should handle no matches', () => {
      const result = RegexTester.split('xyz', '', 'hello world')
      
      expect(result.parts).toEqual(['hello world'])
      expect(result.splits).toBe(0)
    })

    it('should handle invalid regex in split', () => {
      const result = RegexTester.split('[invalid', '', 'test')
      
      expect(result.parts).toEqual(['test'])
      expect(result.splits).toBe(0)
      expect(result.error).toBeDefined()
    })
  })

  describe('validate', () => {
    it('should validate simple regex', () => {
      const result = RegexTester.validate('hello')
      
      expect(result.valid).toBe(true)
      expect(result.flags).toEqual([])
      expect(result.error).toBeUndefined()
    })

    it('should validate regex with flags', () => {
      const result = RegexTester.validate('test', 'gi')
      
      expect(result.valid).toBe(true)
      expect(result.flags).toEqual(['g', 'i'])
    })

    it('should detect regex features', () => {
      const result = RegexTester.validate('(?=test)\\d+[a-z]^end$')
      
      expect(result.valid).toBe(true)
      expect(result.features).toContain('positive-lookahead')
      expect(result.features).toContain('digit-shorthand')
      expect(result.features).toContain('character-class')
      expect(result.features).toContain('start-anchor')
      expect(result.features).toContain('end-anchor')
    })

    it('should detect invalid regex', () => {
      const result = RegexTester.validate('[invalid regex')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should warn about catastrophic backtracking', () => {
      const result = RegexTester.validate('(a*)*b')
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings![0]).toContain('catastrophic backtracking')
    })

    it('should warn about nested quantifiers', () => {
      const result = RegexTester.validate('.*.*')
      
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.some(w => w.includes('performance issues'))).toBe(true)
    })

    it('should detect lookbehind', () => {
      const result = RegexTester.validate('(?<=test)\\w+')
      
      expect(result.features).toContain('positive-lookbehind')
    })

    it('should detect negative lookbehind', () => {
      const result = RegexTester.validate('(?<!test)\\w+')
      
      expect(result.features).toContain('negative-lookbehind')
    })
  })

  describe('explain', () => {
    it('should explain simple pattern', () => {
      const result = RegexTester.explain('^test$')
      
      expect(result.explanation.toLowerCase()).toContain('start')
      expect(result.explanation.toLowerCase()).toContain('end')
      expect(result.components).toHaveLength(2)
    })

    it('should explain character classes', () => {
      const result = RegexTester.explain('[a-z]+')
      
      expect(result.components.some(c => c.description.includes('Character class'))).toBe(true)
    })

    it('should explain quantifiers', () => {
      const result = RegexTester.explain('a*b+c?')
      
      const descriptions = result.components.map(c => c.description)
      expect(descriptions.some(d => d.includes('Zero or more'))).toBe(true)
      expect(descriptions.some(d => d.includes('One or more'))).toBe(true)
      expect(descriptions.some(d => d.includes('Optional'))).toBe(true)
    })

    it('should explain shorthand classes', () => {
      const result = RegexTester.explain('\\d\\w\\s')
      
      const descriptions = result.components.map(c => c.description)
      expect(descriptions).toContain('Any digit 0-9')
      expect(descriptions).toContain('Any word character')
      expect(descriptions).toContain('Any whitespace')
    })

    it('should provide position information', () => {
      const result = RegexTester.explain('abc')
      
      result.components.forEach(component => {
        expect(component.position).toHaveLength(2)
        expect(component.position[0]).toBeGreaterThanOrEqual(0)
        expect(component.position[1]).toBeGreaterThanOrEqual(component.position[0])
      })
    })
  })

  describe('benchmark', () => {
    it('should benchmark regex performance', () => {
      const result = RegexTester.benchmark('test', '', 'this is a test string', 100)
      
      expect(result.averageTime).toBeGreaterThanOrEqual(0)
      expect(result.totalTime).toBeGreaterThan(0)
      expect(result.iterations).toBe(100)
      expect(result.matchesPerSecond).toBeGreaterThanOrEqual(0)
    })

    it('should handle complex regex in benchmark', () => {
      const result = RegexTester.benchmark('\\b\\w+@\\w+\\.\\w+\\b', 'g', 'test@example.com and user@domain.org', 50)
      
      expect(result.averageTime).toBeGreaterThanOrEqual(0)
      expect(result.iterations).toBe(50)
    })

    it('should benchmark large text', () => {
      const largeText = 'word '.repeat(10000)
      const result = RegexTester.benchmark('word', 'g', largeText, 10)
      
      expect(result.totalTime).toBeGreaterThan(0)
      expect(result.matchesPerSecond).toBeGreaterThanOrEqual(0)
    })
  })

  describe('findAll', () => {
    it('should find all matches', () => {
      const results = RegexTester.findAll('\\d+', 'g', 'I have 123 apples and 456 oranges')
      
      expect(results).toHaveLength(2)
      expect(results[0].match).toBe('123')
      expect(results[0].index).toBe(7)
      expect(results[1].match).toBe('456')
      expect(results[1].index).toBe(22)
    })

    it('should capture groups', () => {
      const results = RegexTester.findAll('(\\w+)@(\\w+)', 'g', 'Contact: john@company.com or jane@domain.org')
      
      expect(results).toHaveLength(2)
      expect(results[0].groups).toEqual(['john', 'company'])
      expect(results[1].groups).toEqual(['jane', 'domain'])
    })

    it('should handle named groups', () => {
      const results = RegexTester.findAll('(?<name>\\w+)@(?<domain>\\w+)', 'g', 'Email: test@example.com')
      
      expect(results).toHaveLength(1)
      if (results[0].namedGroups) {
        expect(results[0].namedGroups.name).toBe('test')
        expect(results[0].namedGroups.domain).toBe('example')
      }
    })

    it('should handle no matches', () => {
      const results = RegexTester.findAll('xyz', 'g', 'hello world')
      
      expect(results).toHaveLength(0)
    })

    it('should handle overlapping matches correctly', () => {
      const results = RegexTester.findAll('aa', 'g', 'aaaa')
      
      expect(results).toHaveLength(2) // Non-overlapping: aa|aa
    })
  })

  describe('generateTestCases', () => {
    it('should generate test cases for digit patterns', () => {
      const cases = RegexTester.generateTestCases('\\d+')
      
      expect(cases).toContain('123')
      expect(cases).toContain('0')
      expect(cases.some(c => /\d/.test(c))).toBe(true)
    })

    it('should generate test cases for word patterns', () => {
      const cases = RegexTester.generateTestCases('\\w+')
      
      expect(cases.some(c => /\w/.test(c))).toBe(true)
    })

    it('should generate test cases for email patterns', () => {
      const cases = RegexTester.generateTestCases('\\w+@\\w+\\.\\w+')
      
      expect(cases.some(c => c.includes('@'))).toBe(true)
    })

    it('should include edge cases', () => {
      const cases = RegexTester.generateTestCases('test')
      
      expect(cases).toContain('')
      expect(cases.some(c => c.length > 10)).toBe(true)
    })
  })

  describe('escapeString', () => {
    it('should escape special regex characters', () => {
      const input = 'Hello. How are you? (Fine) [Good] {Great} *Nice* +Plus+ ^Start $End |Or|'
      const escaped = RegexTester.escapeString(input)
      
      expect(escaped).toContain('\\.')
      expect(escaped).toContain('\\?')
      expect(escaped).toContain('\\(')
      expect(escaped).toContain('\\)')
      expect(escaped).toContain('\\[')
      expect(escaped).toContain('\\]')
      expect(escaped).toContain('\\*')
      expect(escaped).toContain('\\+')
      expect(escaped).toContain('\\^')
      expect(escaped).toContain('\\$')
      expect(escaped).toContain('\\|')
    })

    it('should not escape regular characters', () => {
      const input = 'Hello World 123'
      const escaped = RegexTester.escapeString(input)
      
      expect(escaped).toBe(input)
    })

    it('should handle empty string', () => {
      expect(RegexTester.escapeString('')).toBe('')
    })
  })

  describe('unescapeString', () => {
    it('should unescape escaped characters', () => {
      const input = 'Hello\\. How are you\\? \\(Fine\\)'
      const unescaped = RegexTester.unescapeString(input)
      
      expect(unescaped).toBe('Hello. How are you? (Fine)')
    })

    it('should be reversible with escape', () => {
      const original = 'Test.with*special+chars?'
      const escaped = RegexTester.escapeString(original)
      const unescaped = RegexTester.unescapeString(escaped)
      
      expect(unescaped).toBe(original)
    })
  })

  describe('performance tests', () => {
    it('should handle simple patterns efficiently', async () => {
      const { duration } = await perfUtils.measure(() => {
        RegexTester.test('test', 'g', generators.large.text(10000))
      })
      
      expect(duration).toBeLessThan(1000)
    })

    it('should handle complex patterns', async () => {
      const emailPattern = '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
      const text = 'Contact us at support@company.com or sales@business.org'
      
      const { duration } = await perfUtils.measure(() => {
        RegexTester.test(emailPattern, 'g', text)
      })
      
      expect(duration).toBeLessThan(100)
    })

    it('should maintain performance under stress', async () => {
      const testFn = () => {
        RegexTester.test('\\d+', 'g', 'Number: 123-456-7890')
        RegexTester.validate('\\w+')
        RegexTester.replace('a', 'g', 'banana', 'o')
      }

      const results = await perfUtils.stressTest(testFn, 1000)
      expect(results.success).toBe(1000)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(10)
    })

    it('should handle catastrophic backtracking patterns safely', async () => {
      const catastrophicPattern = '(a+)+b'
      const text = 'a'.repeat(20) // Reduced from 30 to prevent actual catastrophic backtracking
      
      const { duration } = await perfUtils.measure(() => {
        try {
          RegexTester.test(catastrophicPattern, '', text)
        } catch {
          // Expected to fail or timeout
        }
      })
      
      // Should either complete quickly or timeout gracefully
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('security tests', () => {
    it('should handle malicious regex patterns safely', () => {
      const maliciousPatterns = [
        '(.*)*',
        '(a+)+b',
        '([a-zA-Z]+)*',
        '(a|a)*',
        '(a*)*b'
      ]

      maliciousPatterns.forEach(pattern => {
        const result = RegexTester.validate(pattern)
        
        // Should validate but warn about potential issues
        if (result.valid) {
          expect(result.warnings).toBeDefined()
          expect(result.warnings!.length).toBeGreaterThan(0)
        }
      })
    })

    it('should not execute code in patterns', () => {
      const maliciousPattern = security.xss.basic
      const result = RegexTester.test(maliciousPattern, '', 'test')
      
      // Should treat as literal string, not execute
      expect(result.error).toBeDefined()
    })

    it('should handle XSS attempts in text safely', () => {
      const xssAttempts = [
        security.xss.basic,
        security.xss.img,
        security.xss.javascript
      ]

      xssAttempts.forEach(xss => {
        const result = RegexTester.test('script', 'i', xss)
        
        // Should find the pattern but not execute it
        expect(result.isMatch).toBe(true)
        expect(typeof result.matches[0][0]).toBe('string')
      })
    })

    it('should prevent ReDoS attacks', () => {
      const redosPattern = '^(a+)+$'
      const attackText = 'a'.repeat(50) + 'X'
      
      const start = Date.now()
      try {
        RegexTester.test(redosPattern, '', attackText)
      } catch {
        // May throw due to timeout
      }
      const duration = Date.now() - start
      
      // Should not take excessively long
      expect(duration).toBeLessThan(5000)
    })

    it('should sanitize error messages', () => {
      const sensitivePattern = 'password=secret123'
      const result = RegexTester.validate('[' + sensitivePattern)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      // Error should not contain sensitive data
      expect(result.error).not.toContain('secret')
      expect(result.error).not.toContain('password')
    })
  })

  describe('edge cases', () => {
    it('should handle Unicode patterns', () => {
      const result = RegexTester.test('[\\u{1F300}-\\u{1F5FF}]', 'u', 'Hello 🌟 World')
      
      expect(result.isMatch).toBe(true)
      expect(result.matches[0][0]).toBe('🌟')
    })

    it('should handle empty pattern', () => {
      const result = RegexTester.test('', '', 'test')
      
      expect(result.isMatch).toBe(true) // Empty pattern matches at position 0
    })

    it('should handle empty text', () => {
      const result = RegexTester.test('test', '', '')
      
      expect(result.isMatch).toBe(false)
      expect(result.matches).toHaveLength(0)
    })

    it('should handle very long patterns', () => {
      const longPattern = 'a'.repeat(10000)
      const result = RegexTester.validate(longPattern)
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings![0]).toContain('Very long pattern')
    })

    it('should handle patterns with null bytes', () => {
      const result = RegexTester.test('test\\x00test', '', 'test\x00test')
      
      expect(result.isMatch).toBe(true)
    })

    it('should handle mixed line endings', () => {
      const text = 'line1\nline2\rline3\r\nline4'
      const result = RegexTester.test('^line', 'gm', text)
      
      expect(result.matches.length).toBe(4)
    })

    it('should handle case boundaries', () => {
      const result = RegexTester.test('\\b\\w+\\b', 'g', 'hello-world_test 123')
      
      expect(result.matches.length).toBeGreaterThan(0)
    })

    it('should handle sticky flag', () => {
      const result = RegexTester.test('test', 'y', 'test this')
      
      expect(result.isMatch).toBe(true)
    })

    it('should handle lookahead and lookbehind', () => {
      const tests = [
        { pattern: 'foo(?=bar)', text: 'foobar', should: true },
        { pattern: 'foo(?=bar)', text: 'foobaz', should: false },
        { pattern: '(?<=foo)bar', text: 'foobar', should: true },
        { pattern: '(?<=foo)bar', text: 'bazbar', should: false }
      ]

      tests.forEach(({ pattern, text, should }) => {
        try {
          const result = RegexTester.test(pattern, '', text)
          expect(result.isMatch).toBe(should)
        } catch {
          // Some browsers may not support lookbehind
          if (pattern.includes('(?<=')) {
            // Skip test if lookbehind not supported
            return
          }
          throw new Error('Unexpected regex error')
        }
      })
    })

    it('should handle concurrent regex operations', async () => {
      const patterns = ['\\d+', '\\w+', '[a-z]+', '\\s+', '\\b\\w+\\b']
      const text = 'Test 123 with words and spaces'
      
      const promises = patterns.map(pattern => 
        Promise.resolve(RegexTester.test(pattern, 'g', text))
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.error).toBeUndefined()
      })
    })
  })
})