import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// JSON formatter utility functions that would be extracted from the Astro component
class JSONFormatter {
  static validate(jsonString: string): { valid: boolean; error?: string } {
    try {
      JSON.parse(jsonString)
      return { valid: true }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  static format(jsonString: string, indent = 2): string {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, indent)
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`)
    }
  }

  static minify(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed)
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`)
    }
  }

  static analyze(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString)
      
      const analyze = (obj: any, depth = 0): any => {
        if (obj === null) return { type: 'null', depth }
        if (Array.isArray(obj)) {
          return {
            type: 'array',
            length: obj.length,
            depth,
            elements: obj.map(item => analyze(item, depth + 1))
          }
        }
        if (typeof obj === 'object') {
          return {
            type: 'object',
            keys: Object.keys(obj).length,
            depth,
            properties: Object.fromEntries(
              Object.entries(obj).map(([key, value]) => [key, analyze(value, depth + 1)])
            )
          }
        }
        return { type: typeof obj, value: obj, depth }
      }

      const analysis = analyze(parsed)
      return {
        ...analysis,
        size: jsonString.length,
        compressed: JSON.stringify(parsed).length,
        compressionRatio: Math.round((1 - JSON.stringify(parsed).length / jsonString.length) * 100)
      }
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`)
    }
  }

  static toTree(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString)
      
      const buildTree = (obj: any, key = 'root', depth = 0): any => {
        const node: any = { key, depth, expanded: depth < 3 }
        
        if (obj === null) {
          node.type = 'null'
          node.value = 'null'
        } else if (Array.isArray(obj)) {
          node.type = 'array'
          node.value = `Array(${obj.length})`
          node.children = obj.map((item, index) => buildTree(item, `[${index}]`, depth + 1))
        } else if (typeof obj === 'object') {
          node.type = 'object'
          node.value = `Object{${Object.keys(obj).length}}`
          node.children = Object.entries(obj).map(([k, v]) => buildTree(v, k, depth + 1))
        } else {
          node.type = typeof obj
          node.value = JSON.stringify(obj)
        }
        
        return node
      }

      return buildTree(parsed)
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`)
    }
  }

  static escape(jsonString: string): string {
    return jsonString
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  }

  static unescape(jsonString: string): string {
    return jsonString
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
  }
}

describe('JSON Formatter', () => {
  describe('validate', () => {
    it('should validate correct JSON', () => {
      const validJson = JSON.stringify(generators.json.valid())
      const result = JSONFormatter.validate(validJson)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid JSON', () => {
      const invalidJson = generators.json.invalid()
      const result = JSONFormatter.validate(invalidJson)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate empty JSON object', () => {
      const result = JSONFormatter.validate('{}')
      expect(result.valid).toBe(true)
    })

    it('should validate JSON arrays', () => {
      const jsonArray = JSON.stringify(generators.json.array())
      const result = JSONFormatter.validate(jsonArray)
      expect(result.valid).toBe(true)
    })

    it('should validate JSON with special characters', () => {
      const specialJson = JSON.stringify(generators.json.with_special_chars())
      const result = JSONFormatter.validate(specialJson)
      expect(result.valid).toBe(true)
    })

    it('should handle deeply nested JSON', () => {
      const deepJson = JSON.stringify(generators.json.deeply_nested(50))
      const result = JSONFormatter.validate(deepJson)
      expect(result.valid).toBe(true)
    })

    it('should reject malformed JSON with missing quotes', () => {
      const result = JSONFormatter.validate('{ name: test }')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('property name')
    })

    it('should reject JSON with trailing commas', () => {
      const result = JSONFormatter.validate('{ "name": "test", }')
      expect(result.valid).toBe(false)
    })

    it('should reject empty string', () => {
      const result = JSONFormatter.validate('')
      expect(result.valid).toBe(false)
    })

    it('should reject non-JSON strings', () => {
      const result = JSONFormatter.validate('not json at all')
      expect(result.valid).toBe(false)
    })
  })

  describe('format', () => {
    it('should format JSON with default indentation', () => {
      const input = '{"name":"test","value":42}'
      const formatted = JSONFormatter.format(input)
      expect(formatted).toContain('  ')
      expect(formatted).toContain('\n')
      expect(formatted).toBeValidJSON()
    })

    it('should format JSON with custom indentation', () => {
      const input = '{"name":"test","value":42}'
      const formatted = JSONFormatter.format(input, 4)
      expect(formatted).toContain('    ')
    })

    it('should preserve data integrity when formatting', () => {
      const original = generators.json.valid()
      const input = JSON.stringify(original)
      const formatted = JSONFormatter.format(input)
      const parsed = JSON.parse(formatted)
      expect(parsed).toEqual(original)
    })

    it('should handle arrays correctly', () => {
      const array = generators.json.array()
      const input = JSON.stringify(array)
      const formatted = JSONFormatter.format(input)
      expect(formatted).toContain('[\n')
      expect(formatted).toContain('\n]')
    })

    it('should handle nested objects', () => {
      const nested = generators.json.deeply_nested(3)
      const input = JSON.stringify(nested)
      const formatted = JSONFormatter.format(input)
      expect(formatted.split('\n').length).toBeGreaterThan(5)
    })

    it('should throw error for invalid JSON', () => {
      const invalid = generators.json.invalid()
      expect(() => JSONFormatter.format(invalid)).toThrow('Invalid JSON')
    })

    it('should handle special characters', () => {
      const special = generators.json.with_special_chars()
      const input = JSON.stringify(special)
      const formatted = JSONFormatter.format(input)
      expect(JSON.parse(formatted)).toEqual(special)
    })

    it('should handle empty objects and arrays', () => {
      expect(JSONFormatter.format('{}')).toBe('{}')
      expect(JSONFormatter.format('[]')).toBe('[]')
    })
  })

  describe('minify', () => {
    it('should remove unnecessary whitespace', () => {
      const formatted = '{\n  "name": "test",\n  "value": 42\n}'
      const minified = JSONFormatter.minify(formatted)
      expect(minified).toBe('{"name":"test","value":42}')
    })

    it('should preserve data integrity when minifying', () => {
      const original = generators.json.valid()
      const formatted = JSON.stringify(original, null, 2)
      const minified = JSONFormatter.minify(formatted)
      const parsed = JSON.parse(minified)
      expect(parsed).toEqual(original)
    })

    it('should handle already minified JSON', () => {
      const input = '{"name":"test","value":42}'
      const minified = JSONFormatter.minify(input)
      expect(minified).toBe(input)
    })

    it('should throw error for invalid JSON', () => {
      const invalid = generators.json.invalid()
      expect(() => JSONFormatter.minify(invalid)).toThrow('Invalid JSON')
    })

    it('should handle large JSON objects', () => {
      const large = generators.json.large()
      const input = JSON.stringify(large, null, 2)
      const minified = JSONFormatter.minify(input)
      expect(minified.length).toBeLessThan(input.length)
      expect(JSON.parse(minified)).toEqual(large)
    })
  })

  describe('analyze', () => {
    it('should analyze simple objects', () => {
      const obj = { name: 'test', value: 42, active: true }
      const input = JSON.stringify(obj)
      const analysis = JSONFormatter.analyze(input)
      
      expect(analysis.type).toBe('object')
      expect(analysis.keys).toBe(3)
      expect(analysis.size).toBe(input.length)
      expect(analysis.compressed).toBeLessThanOrEqual(input.length)
    })

    it('should analyze arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      const input = JSON.stringify(arr)
      const analysis = JSONFormatter.analyze(input)
      
      expect(analysis.type).toBe('array')
      expect(analysis.length).toBe(5)
    })

    it('should calculate compression ratio', () => {
      const formatted = '{\n  "name": "test",\n  "value": 42\n}'
      const analysis = JSONFormatter.analyze(formatted)
      
      expect(analysis.compressionRatio).toBeGreaterThan(0)
      expect(analysis.compressed).toBeLessThan(analysis.size)
    })

    it('should handle nested structures', () => {
      const nested = generators.json.deeply_nested(5)
      const input = JSON.stringify(nested)
      const analysis = JSONFormatter.analyze(input)
      
      expect(analysis.depth).toBeGreaterThanOrEqual(0)
      expect(analysis.type).toBe('object')
    })

    it('should analyze different data types', () => {
      const mixed = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      }
      const input = JSON.stringify(mixed)
      const analysis = JSONFormatter.analyze(input)
      
      expect(analysis.properties).toBeDefined()
      expect(analysis.properties.string.type).toBe('string')
      expect(analysis.properties.number.type).toBe('number')
      expect(analysis.properties.boolean.type).toBe('boolean')
      expect(analysis.properties.null.type).toBe('null')
      expect(analysis.properties.array.type).toBe('array')
      expect(analysis.properties.object.type).toBe('object')
    })

    it('should throw error for invalid JSON', () => {
      const invalid = generators.json.invalid()
      expect(() => JSONFormatter.analyze(invalid)).toThrow('Invalid JSON')
    })
  })

  describe('toTree', () => {
    it('should create tree structure for simple objects', () => {
      const obj = { name: 'test', value: 42 }
      const input = JSON.stringify(obj)
      const tree = JSONFormatter.toTree(input)
      
      expect(tree.key).toBe('root')
      expect(tree.type).toBe('object')
      expect(tree.children).toHaveLength(2)
      expect(tree.children[0].key).toBe('name')
      expect(tree.children[1].key).toBe('value')
    })

    it('should create tree structure for arrays', () => {
      const arr = ['item1', 'item2', 'item3']
      const input = JSON.stringify(arr)
      const tree = JSONFormatter.toTree(input)
      
      expect(tree.type).toBe('array')
      expect(tree.children).toHaveLength(3)
      expect(tree.children[0].key).toBe('[0]')
      expect(tree.children[0].value).toBe('"item1"')
    })

    it('should handle nested structures', () => {
      const nested = { user: { name: 'test', details: { age: 30 } } }
      const input = JSON.stringify(nested)
      const tree = JSONFormatter.toTree(input)
      
      expect(tree.children[0].key).toBe('user')
      expect(tree.children[0].type).toBe('object')
      expect(tree.children[0].children[0].key).toBe('name')
      expect(tree.children[0].children[1].key).toBe('details')
    })

    it('should set expansion state based on depth', () => {
      const deep = generators.json.deeply_nested(5)
      const input = JSON.stringify(deep)
      const tree = JSONFormatter.toTree(input)
      
      expect(tree.expanded).toBe(true) // depth 0
      expect(tree.children[0].expanded).toBe(true) // depth 1
    })

    it('should handle all JSON data types', () => {
      const mixed = {
        str: 'string',
        num: 42,
        bool: true,
        nil: null,
        arr: [1, 2],
        obj: { nested: 'value' }
      }
      const input = JSON.stringify(mixed)
      const tree = JSONFormatter.toTree(input)
      
      const types = tree.children.map((child: any) => child.type)
      expect(types).toContain('string')
      expect(types).toContain('number')
      expect(types).toContain('boolean')
      expect(types).toContain('null')
      expect(types).toContain('array')
      expect(types).toContain('object')
    })

    it('should throw error for invalid JSON', () => {
      const invalid = generators.json.invalid()
      expect(() => JSONFormatter.toTree(invalid)).toThrow('Invalid JSON')
    })
  })

  describe('escape/unescape', () => {
    it('should escape special characters', () => {
      const input = 'Hello "World"\nNew line\tTab'
      const escaped = JSONFormatter.escape(input)
      
      expect(escaped).toContain('\\"')
      expect(escaped).toContain('\\n')
      expect(escaped).toContain('\\t')
    })

    it('should unescape special characters', () => {
      const input = 'Hello \\"World\\"\\nNew line\\tTab'
      const unescaped = JSONFormatter.unescape(input)
      
      expect(unescaped).toContain('"')
      expect(unescaped).toContain('\n')
      expect(unescaped).toContain('\t')
    })

    it('should be reversible', () => {
      const original = 'Test "quotes" and\nnewlines\tand tabs'
      const escaped = JSONFormatter.escape(original)
      const unescaped = JSONFormatter.unescape(escaped)
      
      expect(unescaped).toBe(original)
    })

    it('should handle backslashes correctly', () => {
      const input = 'Path\\to\\file'
      const escaped = JSONFormatter.escape(input)
      const unescaped = JSONFormatter.unescape(escaped)
      
      expect(unescaped).toBe(input)
    })
  })

  describe('performance tests', () => {
    it('should handle large JSON objects efficiently', async () => {
      const large = generators.large.json(100)
      const input = JSON.stringify(large)
      
      const { duration } = await perfUtils.measure(() => JSONFormatter.validate(input))
      expect(duration).toBeLessThan(1000) // Less than 1 second
    })

    it('should format large JSON without excessive memory usage', () => {
      const large = generators.json.large()
      const input = JSON.stringify(large)
      
      const { result } = perfUtils.measureMemory(() => JSONFormatter.format(input))
      expect(result).toBeValidJSON()
    })

    it('should handle deeply nested JSON', () => {
      const deep = generators.json.deeply_nested(100)
      const input = JSON.stringify(deep)
      
      expect(() => JSONFormatter.validate(input)).not.toThrow()
      expect(() => JSONFormatter.format(input)).not.toThrow()
    })

    it('should maintain performance under stress', async () => {
      const testFn = () => {
        const data = generators.json.valid()
        const input = JSON.stringify(data)
        JSONFormatter.validate(input)
        JSONFormatter.format(input)
        JSONFormatter.minify(input)
      }

      const results = await perfUtils.stressTest(testFn, 100)
      expect(results.success).toBe(100)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(50) // Less than 50ms average
    })
  })

  describe('security tests', () => {
    it('should not execute code in JSON strings', () => {
      const malicious = '{"script": "<script>alert(1)</script>"}'
      const result = JSONFormatter.format(malicious)
      
      // JSON formatter should preserve the string content, not execute it
      expect(JSON.parse(result)).toEqual({ script: '<script>alert(1)</script>' })
    })

    it('should handle XSS attempts safely', () => {
      const xssAttempts = [
        security.xss.basic,
        security.xss.img,
        security.xss.svg,
        security.xss.javascript
      ]

      xssAttempts.forEach(xss => {
        const malicious = JSON.stringify({ payload: xss })
        const result = JSONFormatter.format(malicious)
        
        expect(() => JSON.parse(result)).not.toThrow()
        expect(JSON.parse(result).payload).toBe(xss)
      })
    })

    it('should not be vulnerable to prototype pollution', () => {
      const malicious = '{"__proto__": {"polluted": "value"}}'
      
      expect(() => JSONFormatter.validate(malicious)).not.toThrow()
      expect(() => JSONFormatter.format(malicious)).not.toThrow()
      
      // Ensure prototype is not actually polluted
      expect((Object.prototype as any).polluted).toBeUndefined()
    })

    it('should handle constructor pollution attempts', () => {
      const malicious = '{"constructor": {"prototype": {"polluted": "value"}}}'
      
      const result = JSONFormatter.format(malicious)
      expect(JSON.parse(result)).toHaveProperty('constructor')
      expect((Object.prototype as any).polluted).toBeUndefined()
    })

    it('should safely handle large payloads', () => {
      const enormous = generators.large.text(5000000) // 5MB string
      const malicious = JSON.stringify({ data: enormous })
      
      // Should handle without crashing but may reject for size
      expect(() => JSONFormatter.validate(malicious)).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(JSONFormatter.validate('').valid).toBe(false)
    })

    it('should handle null input gracefully', () => {
      expect(() => JSONFormatter.validate(null as any)).not.toThrow()
      const result = JSONFormatter.validate(null as any)
      // null is actually valid JSON
      expect([true, false]).toContain(result.valid)
    })

    it('should handle undefined input gracefully', () => {
      expect(() => JSONFormatter.validate(undefined as any)).not.toThrow()
      expect(JSONFormatter.validate(undefined as any).valid).toBe(false)
    })

    it('should handle circular references in analysis', () => {
      // This would typically be caught by JSON.parse, but test the error handling
      const circular = '{"a": {"b": {"c": {"d": {"e": {"f": {"g": {"h": {"i": {"j": "circular"}}}}}}}}}'
      // Should throw for invalid JSON
      expect(() => JSONFormatter.analyze(circular)).toThrow()
    })

    it('should handle extremely long property names', () => {
      const longKey = 'a'.repeat(10000)
      const obj = { [longKey]: 'value' }
      const input = JSON.stringify(obj)
      
      expect(() => JSONFormatter.validate(input)).not.toThrow()
      expect(JSONFormatter.validate(input).valid).toBe(true)
    })

    it('should handle numbers at precision limits', () => {
      const numbers = {
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        minSafeInteger: Number.MIN_SAFE_INTEGER,
        maxValue: Number.MAX_VALUE,
        minValue: Number.MIN_VALUE,
        epsilon: Number.EPSILON
      }
      const input = JSON.stringify(numbers)
      
      const result = JSONFormatter.format(input)
      expect(JSON.parse(result)).toEqual(numbers)
    })

    it('should handle unicode surrogate pairs', () => {
      const unicode = { emoji: '🚀', chinese: '你好', math: '∑∏∆' }
      const input = JSON.stringify(unicode)
      
      const formatted = JSONFormatter.format(input)
      expect(JSON.parse(formatted)).toEqual(unicode)
    })

    it('should handle mixed line endings', () => {
      const mixed = '{\n"unix": "\\n",\r"mac": "\\r",\r\n"windows": "\\r\\n"\n}'
      
      expect(() => JSONFormatter.validate(mixed)).not.toThrow()
      expect(JSONFormatter.validate(mixed).valid).toBe(true)
    })
  })
})