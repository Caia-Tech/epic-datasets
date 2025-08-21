import { vi } from 'vitest'

// Test data generators
export const generators = {
  // JSON test data
  json: {
    valid: () => ({ name: 'test', value: 42, nested: { array: [1, 2, 3] } }),
    invalid: () => '{ name: "test", value: 42, }', // trailing comma
    large: () => ({ data: new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })) }),
    deeply_nested: (depth = 10) => {
      let obj: any = { value: 'deep' }
      for (let i = 0; i < depth; i++) {
        obj = { level: i, nested: obj }
      }
      return obj
    },
    with_special_chars: () => ({ 
      unicode: '🌟', 
      escaped: '\\"quotes\\"', 
      newlines: 'line1\\nline2',
      tabs: 'col1\\tcol2'
    }),
    empty: () => ({}),
    array: () => [1, 'string', true, null, { nested: 'object' }]
  },

  // Base64 test data
  base64: {
    simple: () => ({ text: 'Hello World', encoded: 'SGVsbG8gV29ybGQ=' }),
    unicode: () => ({ text: '🌟 Unicode 测试', encoded: '8J+MnyBVbmljb2RlIOa1i+ivlQ==' }),
    binary: () => new Uint8Array([0, 1, 2, 3, 255, 254, 253]),
    empty: () => ({ text: '', encoded: '' }),
    large: () => ({ text: 'A'.repeat(10000), encoded: btoa('A'.repeat(10000)) }),
    invalid_encoded: () => 'Invalid Base64!@#$',
    with_padding: () => ({ text: 'sure.', encoded: 'c3VyZS4=' }),
    without_padding: () => ({ text: 'sure.', encoded: 'c3VyZS4' })
  },

  // UUID test data
  uuid: {
    v4_pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    v1_pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    valid_v4: () => '550e8400-e29b-41d4-a716-446655440000',
    invalid_format: () => 'not-a-uuid',
    uppercase: () => '550E8400-E29B-41D4-A716-446655440000',
    no_dashes: () => '550e8400e29b41d4a716446655440000'
  },

  // Hash test data
  hash: {
    simple: () => 'Hello World',
    unicode: () => '🌟 Unicode 测试',
    empty: () => '',
    large: () => 'A'.repeat(1000000), // 1MB
    binary: () => new Uint8Array([0, 1, 2, 3, 255, 254, 253]),
    special_chars: () => '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
    multiline: () => 'Line 1\nLine 2\rLine 3\r\nLine 4'
  },

  // Regex test data
  regex: {
    simple: () => ({ pattern: 'test', flags: 'g', text: 'test this test' }),
    invalid: () => ({ pattern: '[invalid', flags: '', text: 'test' }),
    complex: () => ({ pattern: '(?<=@)\\w+(?=\\.)', flags: 'g', text: 'email@domain.com' }),
    unicode: () => ({ pattern: '[\\u{1F300}-\\u{1F5FF}]', flags: 'gu', text: 'Hello 🌟 World' }),
    catastrophic: () => ({ pattern: '(a+)+b', flags: '', text: 'a'.repeat(30) }),
    multiline: () => ({ pattern: '^test', flags: 'm', text: 'line1\ntest\nline3' })
  },

  // Timestamp test data
  timestamp: {
    now: () => Math.floor(Date.now() / 1000),
    epoch: () => 0,
    year_2038: () => 2147483647, // Y2038 problem
    future: () => 4102444800, // Jan 1, 2100
    negative: () => -86400, // Dec 31, 1969
    milliseconds: () => Date.now(),
    float: () => Date.now() / 1000
  },

  // Password test data
  password: {
    options: {
      basic: () => ({ length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false }),
      strong: () => ({ length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true }),
      minimal: () => ({ length: 8, uppercase: false, lowercase: true, numbers: false, symbols: false }),
      numbers_only: () => ({ length: 6, uppercase: false, lowercase: false, numbers: true, symbols: false }),
      max_length: () => ({ length: 128, uppercase: true, lowercase: true, numbers: true, symbols: true })
    }
  },

  // Large data for stress testing
  large: {
    text: (size = 1000000) => 'A'.repeat(size),
    array: (size = 10000) => new Array(size).fill(0).map((_, i) => i),
    object: (keys = 1000) => Object.fromEntries(
      new Array(keys).fill(0).map((_, i) => [`key${i}`, `value${i}`])
    ),
    json: (depth = 100) => {
      let obj: any = { value: 'deep' }
      for (let i = 0; i < depth; i++) {
        obj = { [`level${i}`]: obj }
      }
      return obj
    }
  },

  // File-like objects for testing
  files: {
    text: (content = 'test content', filename = 'test.txt') => 
      new File([content], filename, { type: 'text/plain' }),
    json: (data = { test: true }, filename = 'data.json') =>
      new File([JSON.stringify(data)], filename, { type: 'application/json' }),
    binary: (size = 1000, filename = 'binary.bin') =>
      new File([new Uint8Array(size)], filename, { type: 'application/octet-stream' }),
    image: (filename = 'image.png') =>
      new File(['fake-image-data'], filename, { type: 'image/png' }),
    large: (size = 10000000, filename = 'large.txt') => // 10MB
      new File([new Array(size).fill('A').join('')], filename, { type: 'text/plain' })
  }
}

// DOM testing utilities
export const dom = {
  // Create a mock DOM element with event handling
  createElement: (tag: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    return element
  },

  // Fire DOM events
  fireEvent: (element: Element, eventType: string, detail?: any) => {
    const event = new CustomEvent(eventType, { detail, bubbles: true })
    element.dispatchEvent(event)
    return event
  },

  // Wait for DOM updates
  waitForUpdate: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Mock input changes
  simulateInput: (element: HTMLInputElement, value: string) => {
    element.value = value
    dom.fireEvent(element, 'input')
    dom.fireEvent(element, 'change')
  },

  // Mock file selection
  simulateFileSelect: (input: HTMLInputElement, files: File[]) => {
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false
    })
    dom.fireEvent(input, 'change')
  }
}

// Async testing utilities
export const async = {
  // Wait for a condition to be true
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await condition()) return
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  },

  // Wait for element to appear
  waitForElement: async (selector: string, timeout = 5000): Promise<Element> => {
    const element = await async.waitFor(
      () => document.querySelector(selector) !== null,
      timeout
    )
    return document.querySelector(selector)!
  },

  // Mock async operations
  mockAsyncOperation: (result: any, delay = 100, shouldReject = false) => {
    return vi.fn(() => 
      new Promise((resolve, reject) => 
        setTimeout(() => shouldReject ? reject(new Error('Mock error')) : resolve(result), delay)
      )
    )
  }
}

// Performance testing utilities
export const performance = {
  // Measure execution time
  measure: async (fn: () => Promise<any> | any): Promise<{ result: any; duration: number }> => {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start
    return { result, duration }
  },

  // Measure synchronous execution time
  measureSync: (fn: () => any): { result: any; duration: number } => {
    const start = Date.now()
    const result = fn()
    const duration = Date.now() - start
    return { result, duration }
  },

  // Test memory usage (approximate)
  measureMemory: (fn: () => any): { result: any; memoryDelta: number } => {
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0
    const result = fn()
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0
    return { result, memoryDelta: endMemory - startMemory }
  },

  // Stress test with multiple iterations
  stressTest: async (
    fn: () => Promise<any> | any, 
    iterations = 1000, 
    concurrent = false
  ): Promise<{ 
    success: number; 
    failures: number; 
    averageTime: number;
    errors: Error[] 
  }> => {
    const results = { success: 0, failures: 0, totalTime: 0, errors: [] as Error[] }
    
    const runTest = async () => {
      const start = Date.now()
      try {
        await fn()
        results.success++
      } catch (error) {
        results.failures++
        results.errors.push(error as Error)
      }
      results.totalTime += Date.now() - start
    }

    if (concurrent) {
      await Promise.all(new Array(iterations).fill(0).map(() => runTest()))
    } else {
      for (let i = 0; i < iterations; i++) {
        await runTest()
      }
    }

    return {
      ...results,
      averageTime: results.totalTime / iterations,
      errors: results.errors
    }
  }
}

// Security testing utilities
export const security = {
  // XSS test vectors
  xss: {
    basic: '<script>alert("xss")</script>',
    img: '<img src="x" onerror="alert(1)">',
    svg: '<svg onload="alert(1)">',
    javascript: 'javascript:alert("xss")',
    data_url: 'data:text/html,<script>alert(1)</script>',
    event_handlers: ['onclick', 'onmouseover', 'onfocus', 'onload', 'onerror']
  },

  // SQL injection test vectors
  sql: {
    basic: "'; DROP TABLE users; --",
    union: "' UNION SELECT * FROM users --",
    blind: "' AND 1=1 --",
    time_based: "'; WAITFOR DELAY '00:00:05' --"
  },

  // Path traversal test vectors
  path: {
    basic: '../../../etc/passwd',
    windows: '..\\..\\..\\windows\\system32\\config\\sam',
    null_byte: '../../../etc/passwd%00.txt',
    encoded: '..%2f..%2f..%2fetc%2fpasswd'
  },

  // Test for dangerous patterns
  containsDangerousPattern: (input: string): boolean => {
    const dangerous = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:text\/html/i,
      /\.\.\/\.\.\//,
      /drop\s+table/i,
      /union\s+select/i
    ]
    return dangerous.some(pattern => pattern.test(input))
  }
}

// Error simulation utilities
export const errors = {
  // Network errors
  network: {
    timeout: () => new Error('Request timeout'),
    notFound: () => new Error('404 Not Found'),
    serverError: () => new Error('500 Internal Server Error'),
    noConnection: () => new Error('Network connection failed')
  },

  // File errors
  file: {
    notFound: () => new Error('File not found'),
    tooLarge: () => new Error('File too large'),
    invalidType: () => new Error('Invalid file type'),
    corrupted: () => new Error('File corrupted')
  },

  // Parsing errors
  parse: {
    invalidJSON: () => new Error('Unexpected token in JSON'),
    invalidXML: () => new Error('XML parsing error'),
    invalidRegex: () => new Error('Invalid regular expression'),
    invalidDate: () => new Error('Invalid date format')
  },

  // Memory errors
  memory: {
    outOfMemory: () => new Error('Out of memory'),
    stackOverflow: () => new Error('Maximum call stack size exceeded'),
    heapOverflow: () => new Error('Heap overflow')
  }
}