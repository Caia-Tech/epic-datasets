import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// JWT Decoder utility functions
class JWTDecoder {
  static decodeToken(token: string): {
    header: any
    payload: any
    signature: string
    valid: boolean
    error?: string
    warnings: string[]
  } {
    const warnings: string[] = []
    
    try {
      const parts = token.split('.')
      
      if (parts.length !== 3) {
        return {
          header: null,
          payload: null,
          signature: '',
          valid: false,
          error: 'Invalid JWT format. Expected 3 parts separated by dots.',
          warnings
        }
      }
      
      const [encodedHeader, encodedPayload, signature] = parts
      
      // Decode header
      const header = JSON.parse(this.base64UrlDecode(encodedHeader))
      
      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload))
      
      // Validate common security concerns
      this.validateSecurity(header, payload, warnings)
      
      return {
        header,
        payload,
        signature,
        valid: true,
        warnings
      }
    } catch (error) {
      return {
        header: null,
        payload: null,
        signature: '',
        valid: false,
        error: `JWT decoding failed: ${(error as Error).message}`,
        warnings
      }
    }
  }
  
  private static base64UrlDecode(str: string): string {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    
    try {
      // Decode base64 to string
      const decoded = atob(base64)
      // Convert to UTF-8
      return decodeURIComponent(escape(decoded))
    } catch (error) {
      throw new Error('Invalid base64url encoding')
    }
  }
  
  private static validateSecurity(header: any, payload: any, warnings: string[]) {
    // Check algorithm
    if (header.alg === 'none') {
      warnings.push('Token uses "none" algorithm - no cryptographic protection')
    }
    
    if (header.alg && header.alg.startsWith('HS') && !header.alg.match(/^HS(256|384|512)$/)) {
      warnings.push('Token uses non-standard HMAC algorithm')
    }
    
    if (header.alg && header.alg.startsWith('RS') && !header.alg.match(/^RS(256|384|512)$/)) {
      warnings.push('Token uses non-standard RSA algorithm')
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    
    if (payload.exp && payload.exp < now) {
      warnings.push('Token has expired')
    }
    
    if (payload.nbf && payload.nbf > now) {
      warnings.push('Token is not yet valid (nbf claim)')
    }
    
    // Check for insecure claims
    if (payload.admin === true || payload.role === 'admin') {
      warnings.push('Token contains admin privileges - ensure proper validation')
    }
    
    // Check token age
    if (payload.iat) {
      const age = now - payload.iat
      const maxAge = 24 * 60 * 60 // 24 hours
      
      if (age > maxAge) {
        warnings.push('Token is older than 24 hours')
      }
    }
    
    // Check for sensitive data in payload
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'ssn', 'credit_card']
    Object.keys(payload).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        warnings.push(`Potentially sensitive field "${key}" found in payload`)
      }
    })
  }
  
  static generateToken(header: any, payload: any, secret = 'mock-secret'): string {
    // Mock JWT generation for testing (not cryptographically secure)
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))
    
    // Mock signature (in real implementation would use proper crypto)
    const mockSignature = this.base64UrlEncode('mock-signature-' + secret.slice(0, 8))
    
    return `${encodedHeader}.${encodedPayload}.${mockSignature}`
  }
  
  private static base64UrlEncode(str: string): string {
    // Convert to base64
    const base64 = btoa(unescape(encodeURIComponent(str)))
    
    // Convert to base64url
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  static validateTokenStructure(token: string): {
    valid: boolean
    errors: string[]
    format: {
      headerValid: boolean
      payloadValid: boolean
      signaturePresent: boolean
    }
  } {
    const errors: string[] = []
    
    if (!token || typeof token !== 'string') {
      errors.push('Token must be a non-empty string')
      return {
        valid: false,
        errors,
        format: { headerValid: false, payloadValid: false, signaturePresent: false }
      }
    }
    
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      errors.push(`Token must have exactly 3 parts, got ${parts.length}`)
      return {
        valid: false,
        errors,
        format: { headerValid: false, payloadValid: false, signaturePresent: false }
      }
    }
    
    const [header, payload, signature] = parts
    
    let headerValid = false
    let payloadValid = false
    let signaturePresent = !!signature
    
    // Validate header
    try {
      const decodedHeader = JSON.parse(this.base64UrlDecode(header))
      if (typeof decodedHeader === 'object' && decodedHeader !== null) {
        headerValid = true
        
        if (!decodedHeader.alg) {
          errors.push('Header missing "alg" field')
        }
        
        if (!decodedHeader.typ || decodedHeader.typ !== 'JWT') {
          errors.push('Header should have "typ": "JWT"')
        }
      } else {
        errors.push('Header must be a JSON object')
      }
    } catch (error) {
      errors.push('Invalid header encoding')
    }
    
    // Validate payload
    try {
      const decodedPayload = JSON.parse(this.base64UrlDecode(payload))
      if (typeof decodedPayload === 'object' && decodedPayload !== null) {
        payloadValid = true
      } else {
        errors.push('Payload must be a JSON object')
      }
    } catch (error) {
      errors.push('Invalid payload encoding')
    }
    
    // Check signature presence
    if (!signature) {
      errors.push('Signature part is missing')
      signaturePresent = false
    }
    
    return {
      valid: errors.length === 0,
      errors,
      format: { headerValid, payloadValid, signaturePresent }
    }
  }
  
  static extractClaims(token: string): {
    standardClaims: Record<string, any>
    customClaims: Record<string, any>
    allClaims: Record<string, any>
  } {
    const decoded = this.decodeToken(token)
    
    if (!decoded.valid || !decoded.payload) {
      return {
        standardClaims: {},
        customClaims: {},
        allClaims: {}
      }
    }
    
    const standardClaimNames = [
      'iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'
    ]
    
    const standardClaims: Record<string, any> = {}
    const customClaims: Record<string, any> = {}
    
    Object.entries(decoded.payload).forEach(([key, value]) => {
      if (standardClaimNames.includes(key)) {
        standardClaims[key] = value
      } else {
        customClaims[key] = value
      }
    })
    
    return {
      standardClaims,
      customClaims,
      allClaims: decoded.payload
    }
  }
  
  static analyzeToken(token: string): {
    algorithm: string
    keyId?: string
    issuer?: string
    audience?: string
    subject?: string
    expiresAt?: Date
    issuedAt?: Date
    notBefore?: Date
    jwtId?: string
    isExpired: boolean
    isActive: boolean
    remainingTime?: number
    security: {
      level: 'low' | 'medium' | 'high'
      warnings: string[]
      recommendations: string[]
    }
  } {
    const decoded = this.decodeToken(token)
    const now = new Date()
    const nowSeconds = Math.floor(now.getTime() / 1000)
    
    if (!decoded.valid) {
      return {
        algorithm: 'unknown',
        isExpired: true,
        isActive: false,
        security: {
          level: 'low',
          warnings: ['Token is invalid'],
          recommendations: ['Use a properly formatted JWT token']
        }
      }
    }
    
    const header = decoded.header
    const payload = decoded.payload
    
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined
    const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined
    const notBefore = payload.nbf ? new Date(payload.nbf * 1000) : undefined
    
    const isExpired = payload.exp ? payload.exp < nowSeconds : false
    const isNotYetValid = payload.nbf ? payload.nbf > nowSeconds : false
    const isActive = !isExpired && !isNotYetValid
    
    const remainingTime = payload.exp ? Math.max(0, payload.exp - nowSeconds) : undefined
    
    // Analyze security
    const security = this.analyzeTokenSecurity(header, payload, decoded.warnings)
    
    return {
      algorithm: header.alg,
      keyId: header.kid,
      issuer: payload.iss,
      audience: payload.aud,
      subject: payload.sub,
      expiresAt,
      issuedAt,
      notBefore,
      jwtId: payload.jti,
      isExpired,
      isActive,
      remainingTime,
      security
    }
  }
  
  private static analyzeTokenSecurity(header: any, payload: any, warnings: string[]): {
    level: 'low' | 'medium' | 'high'
    warnings: string[]
    recommendations: string[]
  } {
    const recommendations: string[] = []
    let securityLevel: 'low' | 'medium' | 'high' = 'medium'
    
    // Analyze algorithm
    if (header.alg === 'none') {
      securityLevel = 'low'
      recommendations.push('Use a cryptographic algorithm (HS256, RS256, etc.)')
    } else if (header.alg?.startsWith('HS')) {
      securityLevel = 'medium'
      recommendations.push('Consider using RS256 for better key management')
    } else if (header.alg?.startsWith('RS')) {
      securityLevel = 'high'
    }
    
    // Check token lifetime
    if (payload.exp && payload.iat) {
      const lifetime = payload.exp - payload.iat
      const hour = 60 * 60
      
      if (lifetime > 24 * hour) {
        recommendations.push('Consider shorter token lifetime for better security')
      }
    } else if (!payload.exp) {
      securityLevel = 'low'
      recommendations.push('Add expiration claim (exp) to limit token lifetime')
    }
    
    // Check for proper claims
    if (!payload.iss) {
      recommendations.push('Add issuer claim (iss) for token validation')
    }
    
    if (!payload.aud) {
      recommendations.push('Add audience claim (aud) for token scope validation')
    }
    
    if (!payload.sub) {
      recommendations.push('Add subject claim (sub) for user identification')
    }
    
    return {
      level: securityLevel,
      warnings,
      recommendations
    }
  }
  
  static formatTokenDisplay(token: string): {
    formatted: string
    header: string
    payload: string
    signature: string
  } {
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      return {
        formatted: token,
        header: 'Invalid',
        payload: 'Invalid',
        signature: 'Invalid'
      }
    }
    
    const [header, payload, signature] = parts
    
    const formatSection = (title: string, content: string, isJson = true): string => {
      if (isJson) {
        try {
          const decoded = JSON.parse(this.base64UrlDecode(content))
          return `${title}:\n${JSON.stringify(decoded, null, 2)}`
        } catch {
          return `${title}:\n[Invalid base64url encoding]`
        }
      } else {
        return `${title}:\n${content}`
      }
    }
    
    const formattedHeader = formatSection('Header', header)
    const formattedPayload = formatSection('Payload', payload)
    const formattedSignature = formatSection('Signature', signature, false)
    
    return {
      formatted: `${formattedHeader}\n\n${formattedPayload}\n\n${formattedSignature}`,
      header: formattedHeader,
      payload: formattedPayload,
      signature: formattedSignature
    }
  }
}

describe('JWT Decoder', () => {
  // Create a valid test JWT
  const createTestJWT = (overrides: { header?: any, payload?: any } = {}) => {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
      ...overrides.header
    }
    
    const payload = {
      sub: 'user123',
      iss: 'test-issuer',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      ...overrides.payload
    }
    
    return JWTDecoder.generateToken(header, payload)
  }
  
  describe('decodeToken', () => {
    it('should decode a valid JWT', () => {
      const token = createTestJWT()
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.valid).toBe(true)
      expect(result.header).toBeDefined()
      expect(result.payload).toBeDefined()
      expect(result.signature).toBeDefined()
      expect(result.error).toBeUndefined()
    })
    
    it('should decode header correctly', () => {
      const customHeader = { alg: 'RS256', typ: 'JWT', kid: 'key-id' }
      const token = createTestJWT({ header: customHeader })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.header.alg).toBe('RS256')
      expect(result.header.typ).toBe('JWT')
      expect(result.header.kid).toBe('key-id')
    })
    
    it('should decode payload correctly', () => {
      const customPayload = {
        sub: 'user456',
        role: 'admin',
        permissions: ['read', 'write']
      }
      const token = createTestJWT({ payload: customPayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.payload.sub).toBe('user456')
      expect(result.payload.role).toBe('admin')
      expect(result.payload.permissions).toEqual(['read', 'write'])
    })
    
    it('should reject malformed JWT', () => {
      const invalidTokens = [
        'invalid.token',
        'invalid',
        'too.many.parts.here',
        '',
        'header.payload.signature.extra'
      ]
      
      invalidTokens.forEach(token => {
        const result = JWTDecoder.decodeToken(token)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
    
    it('should handle invalid base64url encoding', () => {
      const invalidToken = 'invalid-base64.invalid-base64.signature'
      const result = JWTDecoder.decodeToken(invalidToken)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('decoding failed')
    })
    
    it('should handle non-JSON header/payload', () => {
      // Create token with non-JSON header
      const invalidHeader = btoa('not-json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const validPayload = btoa('{"sub":"test"}').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const invalidToken = `${invalidHeader}.${validPayload}.signature`
      
      const result = JWTDecoder.decodeToken(invalidToken)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('decoding failed')
    })
  })
  
  describe('security validation', () => {
    it('should warn about none algorithm', () => {
      const token = createTestJWT({ header: { alg: 'none' } })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.warnings.some(w => w.includes('none'))).toBe(true)
    })
    
    it('should warn about expired tokens', () => {
      const expiredPayload = {
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      }
      const token = createTestJWT({ payload: expiredPayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.warnings.some(w => w.includes('expired'))).toBe(true)
    })
    
    it('should warn about not-yet-valid tokens', () => {
      const futurePayload = {
        nbf: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }
      const token = createTestJWT({ payload: futurePayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.warnings.some(w => w.includes('not yet valid'))).toBe(true)
    })
    
    it('should warn about admin privileges', () => {
      const adminPayload = { admin: true, role: 'admin' }
      const token = createTestJWT({ payload: adminPayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.warnings.some(w => w.includes('admin'))).toBe(true)
    })
    
    it('should warn about old tokens', () => {
      const oldPayload = {
        iat: Math.floor(Date.now() / 1000) - (25 * 60 * 60) // 25 hours ago
      }
      const token = createTestJWT({ payload: oldPayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.warnings.some(w => w.includes('older than 24 hours'))).toBe(true)
    })
    
    it('should warn about sensitive fields', () => {
      const sensitivePayload = {
        password: 'secret123',
        ssn: '123-45-6789',
        credit_card: '4111-1111-1111-1111'
      }
      const token = createTestJWT({ payload: sensitivePayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.warnings.some(w => w.includes('password'))).toBe(true)
      expect(result.warnings.some(w => w.includes('ssn'))).toBe(true)
      expect(result.warnings.some(w => w.includes('credit_card'))).toBe(true)
    })
  })
  
  describe('validateTokenStructure', () => {
    it('should validate correct token structure', () => {
      const token = createTestJWT()
      const result = JWTDecoder.validateTokenStructure(token)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.format.headerValid).toBe(true)
      expect(result.format.payloadValid).toBe(true)
      expect(result.format.signaturePresent).toBe(true)
    })
    
    it('should reject invalid token formats', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        123,
        'only-one-part',
        'two.parts',
        'four.parts.here.extra'
      ]
      
      invalidInputs.forEach(input => {
        const result = JWTDecoder.validateTokenStructure(input as any)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })
    
    it('should validate header requirements', () => {
      const headerWithoutAlg = { typ: 'JWT' }
      const token = createTestJWT({ header: headerWithoutAlg })
      const result = JWTDecoder.validateTokenStructure(token)
      
      expect(result.errors.some(e => e.includes('alg'))).toBe(true)
    })
    
    it('should validate header typ field', () => {
      const headerWithoutTyp = { alg: 'HS256' }
      const token = createTestJWT({ header: headerWithoutTyp })
      const result = JWTDecoder.validateTokenStructure(token)
      
      expect(result.errors.some(e => e.includes('typ'))).toBe(true)
    })
    
    it('should detect missing signature', () => {
      const tokenParts = createTestJWT().split('.')
      const tokenWithoutSig = `${tokenParts[0]}.${tokenParts[1]}.`
      const result = JWTDecoder.validateTokenStructure(tokenWithoutSig)
      
      expect(result.format.signaturePresent).toBe(false)
      expect(result.errors.some(e => e.includes('Signature'))).toBe(true)
    })
  })
  
  describe('extractClaims', () => {
    it('should separate standard and custom claims', () => {
      const customPayload = {
        // Standard claims
        iss: 'issuer',
        sub: 'subject',
        aud: 'audience',
        exp: 1234567890,
        iat: 1234567800,
        nbf: 1234567800,
        jti: 'jwt-id',
        // Custom claims
        role: 'admin',
        permissions: ['read', 'write'],
        userId: 123
      }
      
      const token = createTestJWT({ payload: customPayload })
      const result = JWTDecoder.extractClaims(token)
      
      expect(result.standardClaims.iss).toBe('issuer')
      expect(result.standardClaims.sub).toBe('subject')
      expect(result.standardClaims.aud).toBe('audience')
      
      expect(result.customClaims.role).toBe('admin')
      expect(result.customClaims.permissions).toEqual(['read', 'write'])
      expect(result.customClaims.userId).toBe(123)
      
      expect(result.allClaims).toEqual(customPayload)
    })
    
    it('should handle tokens with only standard claims', () => {
      const token = createTestJWT()
      const result = JWTDecoder.extractClaims(token)
      
      expect(Object.keys(result.standardClaims).length).toBeGreaterThan(0)
      expect(Object.keys(result.customClaims).length).toBeGreaterThanOrEqual(0)
    })
    
    it('should handle invalid tokens', () => {
      const result = JWTDecoder.extractClaims('invalid.token')
      
      expect(result.standardClaims).toEqual({})
      expect(result.customClaims).toEqual({})
      expect(result.allClaims).toEqual({})
    })
  })
  
  describe('analyzeToken', () => {
    it('should analyze token properties', () => {
      const token = createTestJWT({
        header: { alg: 'RS256', kid: 'key-123' },
        payload: {
          iss: 'test-issuer',
          aud: 'test-audience', 
          sub: 'user-123',
          jti: 'token-456'
        }
      })
      
      const analysis = JWTDecoder.analyzeToken(token)
      
      expect(analysis.algorithm).toBe('RS256')
      expect(analysis.keyId).toBe('key-123')
      expect(analysis.issuer).toBe('test-issuer')
      expect(analysis.audience).toBe('test-audience')
      expect(analysis.subject).toBe('user-123')
      expect(analysis.jwtId).toBe('token-456')
      expect(analysis.isActive).toBe(true)
      expect(analysis.isExpired).toBe(false)
    })
    
    it('should detect expired tokens', () => {
      const expiredToken = createTestJWT({
        payload: { exp: Math.floor(Date.now() / 1000) - 3600 }
      })
      
      const analysis = JWTDecoder.analyzeToken(expiredToken)
      
      expect(analysis.isExpired).toBe(true)
      expect(analysis.isActive).toBe(false)
    })
    
    it('should calculate remaining time', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 1800 // 30 minutes
      const token = createTestJWT({ payload: { exp: futureExp } })
      
      const analysis = JWTDecoder.analyzeToken(token)
      
      expect(analysis.remainingTime).toBeGreaterThan(1700) // ~30 minutes
      expect(analysis.remainingTime).toBeLessThan(1900)
    })
    
    it('should analyze security levels', () => {
      const secureToken = createTestJWT({ header: { alg: 'RS256' } })
      const analysis = JWTDecoder.analyzeToken(secureToken)
      
      expect(analysis.security.level).toBe('high')
      expect(analysis.security.warnings).toBeDefined()
      expect(analysis.security.recommendations).toBeDefined()
    })
    
    it('should handle invalid tokens', () => {
      const analysis = JWTDecoder.analyzeToken('invalid')
      
      expect(analysis.algorithm).toBe('unknown')
      expect(analysis.isExpired).toBe(true)
      expect(analysis.isActive).toBe(false)
      expect(analysis.security.level).toBe('low')
    })
  })
  
  describe('formatTokenDisplay', () => {
    it('should format token for display', () => {
      const token = createTestJWT()
      const formatted = JWTDecoder.formatTokenDisplay(token)
      
      expect(formatted.formatted).toContain('Header:')
      expect(formatted.formatted).toContain('Payload:')
      expect(formatted.formatted).toContain('Signature:')
      expect(formatted.header).toContain('alg')
      expect(formatted.payload).toContain('sub')
    })
    
    it('should handle invalid tokens gracefully', () => {
      const formatted = JWTDecoder.formatTokenDisplay('invalid')
      
      expect(formatted.header).toBe('Header:\n[Invalid base64url encoding]')
      expect(formatted.payload).toBe('Payload:\n[Invalid base64url encoding]')
      expect(formatted.signature).toBe('Signature:\ninvalid')
    })
    
    it('should format JSON with proper indentation', () => {
      const token = createTestJWT()
      const formatted = JWTDecoder.formatTokenDisplay(token)
      
      expect(formatted.header).toContain('  ') // Should have indentation
      expect(formatted.payload).toContain('  ') // Should have indentation
    })
  })
  
  describe('performance tests', () => {
    it('should decode tokens efficiently', async () => {
      const token = createTestJWT()
      
      const { duration } = await perfUtils.measure(() => {
        for (let i = 0; i < 1000; i++) {
          JWTDecoder.decodeToken(token)
        }
      })
      
      expect(duration).toBeLessThan(1000) // Less than 1 second for 1000 decodings
    })
    
    it('should handle large payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(10000), // 10KB payload
        array: new Array(1000).fill('item')
      }
      const token = createTestJWT({ payload: largePayload })
      
      const { duration } = await perfUtils.measure(() => {
        JWTDecoder.decodeToken(token)
      })
      
      expect(duration).toBeLessThan(500)
    })
    
    it('should maintain performance under stress', async () => {
      const testFn = () => {
        const token = createTestJWT()
        JWTDecoder.decodeToken(token)
        JWTDecoder.analyzeToken(token)
        JWTDecoder.validateTokenStructure(token)
      }
      
      const results = await perfUtils.stressTest(testFn, 200)
      expect(results.success).toBe(200)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(50)
    })
  })
  
  describe('security tests', () => {
    it('should handle malicious payloads safely', () => {
      const maliciousPayloads = [
        { __proto__: { admin: true } },
        { constructor: { prototype: { isAdmin: true } } },
        { script: '<script>alert(1)</script>' },
        { eval: 'eval("malicious code")' }
      ]
      
      maliciousPayloads.forEach(payload => {
        const token = createTestJWT({ payload })
        const result = JWTDecoder.decodeToken(token)
        
        expect(result.valid).toBe(true)
        expect(result.payload).toEqual(expect.objectContaining(payload))
        
        // Ensure no prototype pollution
        expect((Object.prototype as any).admin).toBeUndefined()
        expect((Object.prototype as any).isAdmin).toBeUndefined()
      })
    })
    
    it('should detect XSS attempts in payload', () => {
      const xssPayloads = [
        { comment: security.xss.basic },
        { name: security.xss.img },
        { bio: security.xss.javascript }
      ]
      
      xssPayloads.forEach(payload => {
        const token = createTestJWT({ payload })
        const result = JWTDecoder.decodeToken(token)
        
        expect(result.valid).toBe(true)
        // The decoder should preserve the content as-is for analysis
        expect(JSON.stringify(result.payload)).toContain('<')
      })
    })
    
    it('should handle extremely long tokens', () => {
      const hugeClaim = 'x'.repeat(100000) // 100KB string
      const token = createTestJWT({ payload: { hugeClaim } })
      
      expect(() => JWTDecoder.decodeToken(token)).not.toThrow()
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.valid).toBe(true)
      expect(result.payload.hugeClaim.length).toBe(100000)
    })
    
    it('should validate dangerous algorithms', () => {
      const dangerousAlgs = ['none', 'HS1', 'RS1', 'custom']
      
      dangerousAlgs.forEach(alg => {
        const token = createTestJWT({ header: { alg } })
        const result = JWTDecoder.decodeToken(token)
        
        if (alg === 'none') {
          expect(result.warnings.some(w => w.includes('none'))).toBe(true)
        }
        
        const analysis = JWTDecoder.analyzeToken(token)
        if (alg === 'none') {
          expect(analysis.security.level).toBe('low')
        }
      })
    })
    
    it('should handle malformed base64url safely', () => {
      const malformedTokens = [
        'header!.payload!.signature!', // Invalid base64url characters
        'header$.payload$.signature$',
        'header\0.payload\0.signature\0' // Null bytes
      ]
      
      malformedTokens.forEach(token => {
        expect(() => JWTDecoder.decodeToken(token)).not.toThrow()
        const result = JWTDecoder.decodeToken(token)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })
  
  describe('edge cases', () => {
    it('should handle tokens with minimal claims', () => {
      const minimalToken = createTestJWT({ 
        header: { alg: 'HS256' }, 
        payload: {} 
      })
      
      const result = JWTDecoder.decodeToken(minimalToken)
      expect(result.valid).toBe(true)
      
      const analysis = JWTDecoder.analyzeToken(minimalToken)
      expect(analysis.security.recommendations.length).toBeGreaterThan(0)
    })
    
    it('should handle Unicode in claims', () => {
      const unicodePayload = {
        name: '测试用户',
        emoji: '🚀🌟',
        special: 'café naïve résumé'
      }
      
      const token = createTestJWT({ payload: unicodePayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.valid).toBe(true)
      expect(result.payload.name).toBe('测试用户')
      expect(result.payload.emoji).toBe('🚀🌟')
      expect(result.payload.special).toBe('café naïve résumé')
    })
    
    it('should handle very long claim values', () => {
      const longValue = 'a'.repeat(50000)
      const token = createTestJWT({ payload: { longClaim: longValue } })
      
      const result = JWTDecoder.decodeToken(token)
      expect(result.valid).toBe(true)
      expect(result.payload.longClaim.length).toBe(50000)
    })
    
    it('should handle arrays and objects in claims', () => {
      const complexPayload = {
        roles: ['admin', 'user', 'editor'],
        profile: {
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            language: 'en'
          }
        },
        permissions: {
          read: ['posts', 'comments'],
          write: ['posts'],
          delete: []
        }
      }
      
      const token = createTestJWT({ payload: complexPayload })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.valid).toBe(true)
      expect(result.payload.roles).toEqual(['admin', 'user', 'editor'])
      expect(result.payload.profile.preferences.theme).toBe('dark')
    })
    
    it('should handle tokens with padding issues', () => {
      // Create token and manipulate base64url encoding
      const normalToken = createTestJWT()
      const parts = normalToken.split('.')
      
      // Add extra characters that might cause padding issues
      const modifiedParts = parts.map(part => part + 'x')
      const modifiedToken = modifiedParts.join('.')
      
      const result = JWTDecoder.decodeToken(modifiedToken)
      expect(result.valid).toBe(false) // Should fail gracefully
    })
    
    it('should handle null and undefined values in claims', () => {
      const payloadWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        false: false
      }
      
      const token = createTestJWT({ payload: payloadWithNulls })
      const result = JWTDecoder.decodeToken(token)
      
      expect(result.valid).toBe(true)
      expect(result.payload.nullValue).toBeNull()
      expect(result.payload.emptyString).toBe('')
      expect(result.payload.zero).toBe(0)
      expect(result.payload.false).toBe(false)
    })
  })
})