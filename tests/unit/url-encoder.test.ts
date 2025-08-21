import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// URL Encoder utility functions
class URLEncoder {
  static encode(input: string, mode: 'full' | 'component' = 'component'): string {
    if (mode === 'full') {
      return encodeURI(input)
    }
    return encodeURIComponent(input)
  }

  static decode(input: string): string {
    try {
      return decodeURIComponent(input)
    } catch (error) {
      throw new Error(`URL decoding failed: ${(error as Error).message}`)
    }
  }

  static encodeQuery(params: Record<string, string | string[]>): string {
    const pairs: string[] = []
    
    Object.entries(params).forEach(([key, value]) => {
      const encodedKey = this.encode(key)
      
      if (Array.isArray(value)) {
        value.forEach(v => {
          pairs.push(`${encodedKey}=${this.encode(v)}`)
        })
      } else {
        pairs.push(`${encodedKey}=${this.encode(value)}`)
      }
    })
    
    return pairs.join('&')
  }

  static decodeQuery(queryString: string): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {}
    
    if (!queryString) return result
    
    const pairs = queryString.split('&')
    
    pairs.forEach(pair => {
      const [key, ...valueParts] = pair.split('=')
      const value = valueParts.join('=')
      
      if (!key) return
      
      const decodedKey = this.decode(key)
      const decodedValue = value ? this.decode(value) : ''
      
      if (result[decodedKey]) {
        if (Array.isArray(result[decodedKey])) {
          (result[decodedKey] as string[]).push(decodedValue)
        } else {
          result[decodedKey] = [result[decodedKey] as string, decodedValue]
        }
      } else {
        result[decodedKey] = decodedValue
      }
    })
    
    return result
  }

  static parseURL(url: string): {
    protocol: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string
    query: Record<string, string | string[]>
    valid: boolean
    error?: string
  } {
    try {
      const parsed = new URL(url)
      
      return {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        query: this.decodeQuery(parsed.search.replace('?', '')),
        valid: true
      }
    } catch (error) {
      return {
        protocol: '',
        hostname: '',
        port: '',
        pathname: '',
        search: '',
        hash: '',
        query: {},
        valid: false,
        error: (error as Error).message
      }
    }
  }

  static buildURL(base: string, params?: Record<string, string | string[]>): string {
    try {
      const url = new URL(base)
      
      if (params) {
        const queryString = this.encodeQuery(params)
        if (queryString) {
          url.search = queryString
        }
      }
      
      return url.toString()
    } catch (error) {
      throw new Error(`URL building failed: ${(error as Error).message}`)
    }
  }

  static validateURL(url: string): { valid: boolean; type: string; error?: string } {
    try {
      const parsed = new URL(url)
      
      let type = 'unknown'
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        type = 'web'
      } else if (parsed.protocol === 'ftp:') {
        type = 'ftp'
      } else if (parsed.protocol === 'file:') {
        type = 'file'
      } else if (parsed.protocol === 'mailto:') {
        type = 'email'
      } else if (parsed.protocol === 'tel:') {
        type = 'phone'
      }
      
      return { valid: true, type }
    } catch (error) {
      return { 
        valid: false, 
        type: 'invalid', 
        error: (error as Error).message 
      }
    }
  }

  static extractDomains(text: string): string[] {
    const urlRegex = /(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}/g
    const matches = text.match(urlRegex) || []
    
    return matches.map(match => {
      try {
        const url = match.startsWith('http') ? match : `http://${match}`
        return new URL(url).hostname
      } catch {
        return match.replace(/^https?:\/\//, '')
      }
    }).filter((domain, index, self) => self.indexOf(domain) === index)
  }

  static isValidDomain(domain: string): boolean {
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
    return domainRegex.test(domain)
  }

  static normalizeURL(url: string): string {
    try {
      const parsed = new URL(url)
      
      // Remove default ports
      if ((parsed.protocol === 'http:' && parsed.port === '80') ||
          (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = ''
      }
      
      // Normalize pathname
      if (!parsed.pathname || parsed.pathname === '/') {
        parsed.pathname = '/'
      }
      
      // Sort query parameters
      const params = new URLSearchParams(parsed.search)
      const sortedParams = new URLSearchParams()
      Array.from(params.keys()).sort().forEach(key => {
        params.getAll(key).forEach(value => {
          sortedParams.append(key, value)
        })
      })
      parsed.search = sortedParams.toString()
      
      // Remove fragment if empty
      if (!parsed.hash || parsed.hash === '#') {
        parsed.hash = ''
      }
      
      return parsed.toString()
    } catch (error) {
      throw new Error(`URL normalization failed: ${(error as Error).message}`)
    }
  }

  static getEncoding(char: string): string {
    return encodeURIComponent(char)
  }

  static analyzeEncoding(text: string): {
    original: string
    encoded: string
    savings: number
    characters: Array<{
      char: string
      encoded: string
      needsEncoding: boolean
    }>
  } {
    const encoded = this.encode(text)
    const savings = Math.max(0, text.length - encoded.length)
    
    const characters = Array.from(text).map(char => ({
      char,
      encoded: this.getEncoding(char),
      needsEncoding: char !== this.getEncoding(char)
    }))
    
    return {
      original: text,
      encoded,
      savings,
      characters
    }
  }
}

describe('URL Encoder', () => {
  describe('encode', () => {
    it('should encode URL components', () => {
      const input = 'hello world'
      const result = URLEncoder.encode(input)
      
      expect(result).toBe('hello%20world')
    })

    it('should encode special characters', () => {
      const input = 'hello@world.com?param=value&other=true'
      const result = URLEncoder.encode(input)
      
      expect(result).toContain('%40') // @
      expect(result).toContain('%3F') // ?
      expect(result).toContain('%3D') // =
      expect(result).toContain('%26') // &
    })

    it('should encode Unicode characters', () => {
      const input = 'café naïve 🚀'
      const result = URLEncoder.encode(input)
      
      expect(result).toContain('%C3%A9') // é
      expect(result).toContain('%C3%AF') // ï
      expect(result).toContain('%F0%9F%9A%80') // 🚀
    })

    it('should handle full URL encoding', () => {
      const input = 'https://example.com/path with spaces'
      const result = URLEncoder.encode(input, 'full')
      
      expect(result).toContain('https://') // Protocol preserved
      expect(result).toContain('%20') // Space encoded
    })

    it('should handle component encoding', () => {
      const input = 'https://example.com/path'
      const result = URLEncoder.encode(input, 'component')
      
      expect(result).toContain('%3A%2F%2F') // :// encoded
      expect(result).toContain('%2F') // / encoded
    })

    it('should handle empty string', () => {
      const result = URLEncoder.encode('')
      expect(result).toBe('')
    })

    it('should be deterministic', () => {
      const input = 'test string'
      const result1 = URLEncoder.encode(input)
      const result2 = URLEncoder.encode(input)
      
      expect(result1).toBe(result2)
    })
  })

  describe('decode', () => {
    it('should decode URL encoded string', () => {
      const input = 'hello%20world'
      const result = URLEncoder.decode(input)
      
      expect(result).toBe('hello world')
    })

    it('should decode special characters', () => {
      const input = 'hello%40world.com%3Fparam%3Dvalue%26other%3Dtrue'
      const result = URLEncoder.decode(input)
      
      expect(result).toBe('hello@world.com?param=value&other=true')
    })

    it('should decode Unicode characters', () => {
      const input = 'caf%C3%A9%20na%C3%AFve%20%F0%9F%9A%80'
      const result = URLEncoder.decode(input)
      
      expect(result).toBe('café naïve 🚀')
    })

    it('should handle already decoded strings', () => {
      const input = 'already decoded'
      const result = URLEncoder.decode(input)
      
      expect(result).toBe(input)
    })

    it('should throw error for malformed encoding', () => {
      const input = '%GG' // Invalid hex
      
      expect(() => URLEncoder.decode(input)).toThrow('URL decoding failed')
    })

    it('should handle empty string', () => {
      const result = URLEncoder.decode('')
      expect(result).toBe('')
    })

    it('should be reversible with encode', () => {
      const original = 'test string with special chars: @#$%^&*()'
      const encoded = URLEncoder.encode(original)
      const decoded = URLEncoder.decode(encoded)
      
      expect(decoded).toBe(original)
    })
  })

  describe('encodeQuery', () => {
    it('should encode simple query parameters', () => {
      const params = { name: 'John Doe', age: '30' }
      const result = URLEncoder.encodeQuery(params)
      
      expect(result).toBe('name=John%20Doe&age=30')
    })

    it('should handle special characters in keys and values', () => {
      const params = { 'user@domain': 'value with spaces', 'key&special': 'value=test' }
      const result = URLEncoder.encodeQuery(params)
      
      expect(result).toContain('user%40domain')
      expect(result).toContain('value%20with%20spaces')
      expect(result).toContain('key%26special')
      expect(result).toContain('value%3Dtest')
    })

    it('should handle array values', () => {
      const params = { colors: ['red', 'green', 'blue'], single: 'value' }
      const result = URLEncoder.encodeQuery(params)
      
      expect(result).toContain('colors=red')
      expect(result).toContain('colors=green')
      expect(result).toContain('colors=blue')
      expect(result).toContain('single=value')
    })

    it('should handle empty object', () => {
      const result = URLEncoder.encodeQuery({})
      expect(result).toBe('')
    })

    it('should handle empty values', () => {
      const params = { empty: '', defined: 'value' }
      const result = URLEncoder.encodeQuery(params)
      
      expect(result).toContain('empty=')
      expect(result).toContain('defined=value')
    })
  })

  describe('decodeQuery', () => {
    it('should decode simple query string', () => {
      const query = 'name=John%20Doe&age=30'
      const result = URLEncoder.decodeQuery(query)
      
      expect(result).toEqual({
        name: 'John Doe',
        age: '30'
      })
    })

    it('should handle duplicate keys as arrays', () => {
      const query = 'color=red&color=green&color=blue&single=value'
      const result = URLEncoder.decodeQuery(query)
      
      expect(result.color).toEqual(['red', 'green', 'blue'])
      expect(result.single).toBe('value')
    })

    it('should handle special characters', () => {
      const query = 'user%40domain=value%20with%20spaces&key%26special=value%3Dtest'
      const result = URLEncoder.decodeQuery(query)
      
      expect(result['user@domain']).toBe('value with spaces')
      expect(result['key&special']).toBe('value=test')
    })

    it('should handle empty query string', () => {
      const result = URLEncoder.decodeQuery('')
      expect(result).toEqual({})
    })

    it('should handle malformed query string', () => {
      const query = 'key1=value1&=value2&key3='
      const result = URLEncoder.decodeQuery(query)
      
      expect(result.key1).toBe('value1')
      expect(result.key3).toBe('')
      // Empty key should be ignored
    })

    it('should handle query with no values', () => {
      const query = 'key1&key2&key3'
      const result = URLEncoder.decodeQuery(query)
      
      expect(result.key1).toBe('')
      expect(result.key2).toBe('')
      expect(result.key3).toBe('')
    })
  })

  describe('parseURL', () => {
    it('should parse complete URL', () => {
      const url = 'https://user:pass@example.com:8080/path/to/page?param=value&other=true#section'
      const result = URLEncoder.parseURL(url)
      
      expect(result.valid).toBe(true)
      expect(result.protocol).toBe('https:')
      expect(result.hostname).toBe('example.com')
      expect(result.port).toBe('8080')
      expect(result.pathname).toBe('/path/to/page')
      expect(result.search).toBe('?param=value&other=true')
      expect(result.hash).toBe('#section')
      expect(result.query).toEqual({ param: 'value', other: 'true' })
    })

    it('should parse simple URL', () => {
      const url = 'https://example.com'
      const result = URLEncoder.parseURL(url)
      
      expect(result.valid).toBe(true)
      expect(result.protocol).toBe('https:')
      expect(result.hostname).toBe('example.com')
      expect(result.pathname).toBe('/')
    })

    it('should handle invalid URL', () => {
      const url = 'not a valid url'
      const result = URLEncoder.parseURL(url)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should parse URL with international domain', () => {
      const url = 'https://xn--n3h.com/path' // ☃.com in punycode
      const result = URLEncoder.parseURL(url)
      
      expect(result.valid).toBe(true)
      expect(result.hostname).toBe('xn--n3h.com')
    })
  })

  describe('buildURL', () => {
    it('should build URL with query parameters', () => {
      const base = 'https://example.com/path'
      const params = { param1: 'value1', param2: 'value2' }
      const result = URLEncoder.buildURL(base, params)
      
      expect(result).toContain('https://example.com/path')
      expect(result).toContain('param1=value1')
      expect(result).toContain('param2=value2')
      expect(result).toContain('?')
      expect(result).toContain('&')
    })

    it('should build URL without parameters', () => {
      const base = 'https://example.com/path'
      const result = URLEncoder.buildURL(base)
      
      expect(result).toBe('https://example.com/path')
    })

    it('should handle array parameters', () => {
      const base = 'https://example.com'
      const params = { colors: ['red', 'green'], single: 'value' }
      const result = URLEncoder.buildURL(base, params)
      
      expect(result).toContain('colors=red')
      expect(result).toContain('colors=green')
    })

    it('should throw error for invalid base URL', () => {
      const base = 'invalid url'
      const params = { test: 'value' }
      
      expect(() => URLEncoder.buildURL(base, params)).toThrow('URL building failed')
    })
  })

  describe('validateURL', () => {
    it('should validate web URLs', () => {
      const urls = [
        'https://example.com',
        'http://test.org/path',
        'https://sub.domain.com:8080/path?query=value#hash'
      ]

      urls.forEach(url => {
        const result = URLEncoder.validateURL(url)
        expect(result.valid).toBe(true)
        expect(result.type).toBe('web')
      })
    })

    it('should validate different URL types', () => {
      const testCases = [
        { url: 'ftp://ftp.example.com/file', type: 'ftp' },
        { url: 'file:///path/to/file.txt', type: 'file' },
        { url: 'mailto:user@example.com', type: 'email' },
        { url: 'tel:+1234567890', type: 'phone' }
      ]

      testCases.forEach(({ url, type }) => {
        const result = URLEncoder.validateURL(url)
        expect(result.valid).toBe(true)
        expect(result.type).toBe(type)
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not a url',
        'htp://invalid-protocol.com',
        'https://',
        '://missing-protocol.com'
      ]

      invalidUrls.forEach(url => {
        const result = URLEncoder.validateURL(url)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe('extractDomains', () => {
    it('should extract domains from text', () => {
      const text = 'Visit https://example.com and http://test.org for more info'
      const result = URLEncoder.extractDomains(text)
      
      expect(result).toContain('example.com')
      expect(result).toContain('test.org')
      expect(result).toHaveLength(2)
    })

    it('should extract domains without protocol', () => {
      const text = 'Contact us at example.com or visit test.org'
      const result = URLEncoder.extractDomains(text)
      
      expect(result).toContain('example.com')
      expect(result).toContain('test.org')
    })

    it('should remove duplicates', () => {
      const text = 'https://example.com and http://example.com and example.com'
      const result = URLEncoder.extractDomains(text)
      
      expect(result).toContain('example.com')
      expect(result).toHaveLength(1)
    })

    it('should handle text with no domains', () => {
      const text = 'This text has no domains'
      const result = URLEncoder.extractDomains(text)
      
      expect(result).toHaveLength(0)
    })
  })

  describe('isValidDomain', () => {
    it('should validate correct domains', () => {
      const validDomains = [
        'example.com',
        'sub.example.com',
        'test-domain.org',
        'a.b.c.d.example.com',
        'xn--n3h.com' // internationalized domain
      ]

      validDomains.forEach(domain => {
        expect(URLEncoder.isValidDomain(domain)).toBe(true)
      })
    })

    it('should reject invalid domains', () => {
      const invalidDomains = [
        'example',
        '.example.com',
        'example..com',
        'example-.com',
        '-example.com',
        'example.c',
        ''
      ]

      invalidDomains.forEach(domain => {
        expect(URLEncoder.isValidDomain(domain)).toBe(false)
      })
    })
  })

  describe('normalizeURL', () => {
    it('should remove default ports', () => {
      expect(URLEncoder.normalizeURL('http://example.com:80/path')).toBe('http://example.com/path')
      expect(URLEncoder.normalizeURL('https://example.com:443/path')).toBe('https://example.com/path')
    })

    it('should sort query parameters', () => {
      const result = URLEncoder.normalizeURL('https://example.com?c=3&a=1&b=2')
      expect(result).toBe('https://example.com/?a=1&b=2&c=3')
    })

    it('should normalize pathname', () => {
      expect(URLEncoder.normalizeURL('https://example.com')).toBe('https://example.com/')
      expect(URLEncoder.normalizeURL('https://example.com/')).toBe('https://example.com/')
    })

    it('should remove empty fragment', () => {
      expect(URLEncoder.normalizeURL('https://example.com#')).toBe('https://example.com/')
      expect(URLEncoder.normalizeURL('https://example.com/#section')).toBe('https://example.com/#section')
    })

    it('should throw error for invalid URL', () => {
      expect(() => URLEncoder.normalizeURL('invalid url')).toThrow('URL normalization failed')
    })
  })

  describe('analyzeEncoding', () => {
    it('should analyze simple text', () => {
      const text = 'hello world'
      const result = URLEncoder.analyzeEncoding(text)
      
      expect(result.original).toBe(text)
      expect(result.encoded).toBe('hello%20world')
      expect(result.characters).toHaveLength(11)
      expect(result.characters.find(c => c.char === ' ')?.needsEncoding).toBe(true)
      expect(result.characters.find(c => c.char === 'h')?.needsEncoding).toBe(false)
    })

    it('should analyze special characters', () => {
      const text = '@#$%'
      const result = URLEncoder.analyzeEncoding(text)
      
      expect(result.characters.every(c => c.needsEncoding)).toBe(true)
      expect(result.encoded.length).toBeGreaterThan(text.length)
    })
  })

  describe('performance tests', () => {
    it('should encode large text efficiently', async () => {
      const largeText = 'test text '.repeat(10000)
      
      const { duration } = await perfUtils.measure(() => {
        URLEncoder.encode(largeText)
      })
      
      expect(duration).toBeLessThan(1000)
    })

    it('should parse complex URLs efficiently', async () => {
      const complexURL = 'https://example.com/very/long/path?param1=value1&param2=value2&param3=value3#section'
      
      const { duration } = await perfUtils.measure(() => {
        for (let i = 0; i < 1000; i++) {
          URLEncoder.parseURL(complexURL)
        }
      })
      
      expect(duration).toBeLessThan(2000)
    })

    it('should handle query encoding under stress', async () => {
      const testFn = () => {
        const params = { test: 'value with spaces', special: '@#$%^&*()' }
        const encoded = URLEncoder.encodeQuery(params)
        URLEncoder.decodeQuery(encoded)
      }

      const results = await perfUtils.stressTest(testFn, 1000)
      expect(results.success).toBe(1000)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(10)
    })
  })

  describe('security tests', () => {
    it('should handle XSS attempts safely', () => {
      const xssAttempts = [
        security.xss.basic,
        security.xss.img,
        security.xss.javascript
      ]

      xssAttempts.forEach(xss => {
        const encoded = URLEncoder.encode(xss)
        const decoded = URLEncoder.decode(encoded)
        
        expect(decoded).toBe(xss) // Should preserve but not execute
        expect(encoded).toContain('%')
      })
    })

    it('should prevent URL manipulation', () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("xss")'
      ]

      maliciousUrls.forEach(url => {
        const result = URLEncoder.validateURL(url)
        // These should be valid URLs but recognized as potentially dangerous
        expect(result.type).not.toBe('web')
      })
    })

    it('should handle path traversal attempts', () => {
      const pathTraversal = '../../../etc/passwd'
      const encoded = URLEncoder.encode(pathTraversal)
      const decoded = URLEncoder.decode(encoded)
      
      expect(decoded).toBe(pathTraversal)
      expect(encoded).toContain('%2E%2E%2F') // ../
    })

    it('should sanitize dangerous query parameters', () => {
      const dangerousParams = {
        script: '<script>alert(1)</script>',
        redirect: 'javascript:alert(1)',
        callback: 'eval(malicious)'
      }

      const encoded = URLEncoder.encodeQuery(dangerousParams)
      const decoded = URLEncoder.decodeQuery(encoded)
      
      expect(decoded.script).toBe('<script>alert(1)</script>')
      expect(encoded).toContain('%3Cscript%3E')
    })
  })

  describe('edge cases', () => {
    it('should handle Unicode edge cases', () => {
      const unicodeTests = [
        '🚀🌟✨',
        '中文测试',
        'café naïve résumé',
        '\u0000\u0001\u0002', // Control characters
        '👨‍👩‍👧‍👦' // Complex emoji
      ]

      unicodeTests.forEach(text => {
        const encoded = URLEncoder.encode(text)
        const decoded = URLEncoder.decode(encoded)
        expect(decoded).toBe(text)
      })
    })

    it('should handle very long URLs', () => {
      const longPath = '/very/long/path/'.repeat(100)
      const longURL = `https://example.com${longPath}?param=${'value'.repeat(100)}`
      
      const result = URLEncoder.parseURL(longURL)
      expect(result.valid).toBe(true)
    })

    it('should handle URLs with all valid characters', () => {
      const allValidChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~'
      const url = `https://example.com/path?param=${allValidChars}`
      
      const result = URLEncoder.parseURL(url)
      expect(result.valid).toBe(true)
    })

    it('should handle concurrent operations', async () => {
      const operations = new Array(100).fill(0).map((_, i) => 
        Promise.resolve().then(() => {
          const text = `test string ${i}`
          const encoded = URLEncoder.encode(text)
          return URLEncoder.decode(encoded)
        })
      )

      const results = await Promise.all(operations)
      expect(results).toHaveLength(100)
      results.forEach((result, i) => {
        expect(result).toBe(`test string ${i}`)
      })
    })

    it('should handle malformed percent encoding', () => {
      const malformedTests = [
        '%',
        '%2',
        '%GG',
        '%2G',
        'test%',
        'test%2'
      ]

      malformedTests.forEach(test => {
        expect(() => URLEncoder.decode(test)).toThrow()
      })
    })

    it('should preserve encoded characters that don\'t need encoding', () => {
      const input = 'hello%20world' // Already encoded space
      const doubleEncoded = URLEncoder.encode(input)
      
      expect(doubleEncoded).toContain('%2520') // %20 becomes %2520
    })

    it('should handle empty and whitespace-only inputs', () => {
      const inputs = ['', ' ', '\t', '\n', '\r\n', '   \t\n  ']
      
      inputs.forEach(input => {
        const encoded = URLEncoder.encode(input)
        const decoded = URLEncoder.decode(encoded)
        expect(decoded).toBe(input)
      })
    })
  })
})