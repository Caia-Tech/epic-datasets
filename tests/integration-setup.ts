import { vi } from 'vitest'

// Minimal setup for integration tests
// Don't mock fetch as integration tests need real HTTP requests

// Only mock the APIs that integration tests don't need
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

// Mock performance API (some Astro internals might need this)
global.performance = global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
} as any

// Keep URL constructor but add static methods if needed
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()
}