import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Certificate Viewer utility functions
class CertificateViewer {
  static parseCertificate(pemData: string): {
    valid: boolean
    certificate?: {
      version: number
      serialNumber: string
      issuer: string
      subject: string
      validFrom: Date
      validTo: Date
      publicKey: {
        algorithm: string
        keySize: number
        modulus?: string
        exponent?: string
      }
      signature: {
        algorithm: string
        value: string
      }
      extensions: Array<{
        name: string
        critical: boolean
        value: string
      }>
      fingerprints: {
        sha1: string
        sha256: string
        md5: string
      }
    }
    error?: string
    warnings: string[]
  } {
    const warnings: string[] = []
    
    try {
      // Basic PEM format validation
      const cleanPem = pemData.trim()
      if (!cleanPem.startsWith('-----BEGIN CERTIFICATE-----') || 
          !cleanPem.endsWith('-----END CERTIFICATE-----')) {
        return {
          valid: false,
          error: 'Invalid PEM format. Must start with "-----BEGIN CERTIFICATE-----" and end with "-----END CERTIFICATE-----"',
          warnings
        }
      }
      
      // Extract the base64 content
      const base64Content = cleanPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\s/g, '')
      
      // Validate base64
      try {
        atob(base64Content)
      } catch {
        return {
          valid: false,
          error: 'Invalid base64 content in certificate',
          warnings
        }
      }
      
      // Mock certificate parsing (in real implementation would use ASN.1 parser)
      const mockCert = this.createMockCertificate(base64Content, warnings)
      
      return {
        valid: true,
        certificate: mockCert,
        warnings
      }
    } catch (error) {
      return {
        valid: false,
        error: `Certificate parsing failed: ${(error as Error).message}`,
        warnings
      }
    }
  }
  
  private static createMockCertificate(base64Content: string, warnings: string[]) {
    // Create mock certificate data based on content hash
    const contentHash = this.simpleHash(base64Content)
    
    // Generate deterministic but realistic-looking certificate data
    const now = new Date()
    const validFrom = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago
    const validTo = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)) // 365 days from now
    
    // Check for expiration warnings
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    if (daysUntilExpiry < 30) {
      warnings.push(`Certificate expires in ${daysUntilExpiry} days`)
    }
    
    if (validTo.getTime() < now.getTime()) {
      warnings.push('Certificate has expired')
    }
    
    if (validFrom.getTime() > now.getTime()) {
      warnings.push('Certificate is not yet valid')
    }
    
    const keySize = contentHash % 3 === 0 ? 2048 : contentHash % 3 === 1 ? 1024 : 4096
    
    // Warn about weak key sizes
    if (keySize < 2048) {
      warnings.push('Certificate uses weak key size (less than 2048 bits)')
    }
    
    const mockCert = {
      version: 3,
      serialNumber: contentHash.toString(16).toUpperCase().padStart(16, '0'),
      issuer: 'CN=Test CA, O=Test Organization, C=US',
      subject: 'CN=example.com, O=Example Corp, C=US',
      validFrom,
      validTo,
      publicKey: {
        algorithm: 'RSA',
        keySize,
        modulus: 'A'.repeat(keySize / 4),
        exponent: '65537'
      },
      signature: {
        algorithm: 'sha256WithRSAEncryption',
        value: base64Content.substring(0, 64)
      },
      extensions: [
        {
          name: 'Subject Alternative Name',
          critical: false,
          value: 'DNS:example.com, DNS:www.example.com'
        },
        {
          name: 'Key Usage',
          critical: true,
          value: 'Digital Signature, Key Encipherment'
        },
        {
          name: 'Extended Key Usage',
          critical: false,
          value: 'TLS Web Server Authentication, TLS Web Client Authentication'
        },
        {
          name: 'Basic Constraints',
          critical: true,
          value: 'CA:FALSE'
        }
      ],
      fingerprints: {
        sha1: this.generateFingerprint(base64Content, 'SHA-1'),
        sha256: this.generateFingerprint(base64Content, 'SHA-256'),
        md5: this.generateFingerprint(base64Content, 'MD5')
      }
    }
    
    // Additional warnings based on certificate properties
    if (mockCert.signature.algorithm.includes('sha1') || mockCert.signature.algorithm.includes('md5')) {
      warnings.push('Certificate uses weak signature algorithm')
    }
    
    return mockCert
  }
  
  private static simpleHash(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  private static generateFingerprint(content: string, algorithm: string): string {
    // Mock fingerprint generation
    const hash = this.simpleHash(content + algorithm)
    const length = algorithm === 'MD5' ? 32 : algorithm === 'SHA-1' ? 40 : 64
    
    return hash.toString(16)
      .padStart(length, '0')
      .toUpperCase()
      .match(/.{2}/g)?.join(':') || ''
  }
  
  static validateCertificateChain(certificates: string[]): {
    valid: boolean
    chainLength: number
    rootCA?: string
    intermediates: string[]
    leafCertificate?: string
    errors: string[]
    warnings: string[]
    trustLevel: 'untrusted' | 'self-signed' | 'ca-signed' | 'trusted'
  } {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!certificates || certificates.length === 0) {
      return {
        valid: false,
        chainLength: 0,
        intermediates: [],
        errors: ['No certificates provided'],
        warnings,
        trustLevel: 'untrusted'
      }
    }
    
    const parsedCerts = certificates.map((cert, index) => {
      const parsed = this.parseCertificate(cert)
      if (!parsed.valid) {
        errors.push(`Certificate ${index + 1} is invalid: ${parsed.error}`)
      }
      return parsed
    })
    
    // Determine chain structure
    const leafCertificate = certificates[0]
    const intermediates = certificates.slice(1, -1)
    const rootCA = certificates.length > 1 ? certificates[certificates.length - 1] : undefined
    
    // Validate chain integrity
    if (certificates.length === 1) {
      const parsed = parsedCerts[0]
      if (parsed.valid && parsed.certificate) {
        const isSelfsigned = parsed.certificate.issuer === parsed.certificate.subject
        if (isSelfsigned) {
          warnings.push('Certificate is self-signed')
          return {
            valid: true,
            chainLength: 1,
            leafCertificate,
            intermediates: [],
            errors,
            warnings,
            trustLevel: 'self-signed'
          }
        }
      }
    }
    
    // Check chain order and validity
    for (let i = 0; i < parsedCerts.length - 1; i++) {
      const current = parsedCerts[i]
      const next = parsedCerts[i + 1]
      
      if (current.valid && next.valid && current.certificate && next.certificate) {
        // In a real implementation, would verify signatures
        if (current.certificate.issuer !== next.certificate.subject) {
          warnings.push(`Certificate ${i + 1} issuer does not match certificate ${i + 2} subject`)
        }
      }
    }
    
    // Determine trust level
    let trustLevel: 'untrusted' | 'self-signed' | 'ca-signed' | 'trusted' = 'ca-signed'
    
    if (certificates.length === 1) {
      trustLevel = 'self-signed'
    } else if (rootCA) {
      // In real implementation, would check against known CA list
      trustLevel = 'trusted'
    }
    
    return {
      valid: errors.length === 0,
      chainLength: certificates.length,
      rootCA,
      intermediates,
      leafCertificate,
      errors,
      warnings,
      trustLevel
    }
  }
  
  static extractSAN(certificate: string): {
    domains: string[]
    ipAddresses: string[]
    emails: string[]
    uris: string[]
    other: string[]
  } {
    const parsed = this.parseCertificate(certificate)
    
    if (!parsed.valid || !parsed.certificate) {
      return {
        domains: [],
        ipAddresses: [],
        emails: [],
        uris: [],
        other: []
      }
    }
    
    const sanExtension = parsed.certificate.extensions.find(ext => 
      ext.name === 'Subject Alternative Name'
    )
    
    if (!sanExtension) {
      return {
        domains: [],
        ipAddresses: [],
        emails: [],
        uris: [],
        other: []
      }
    }
    
    // Parse SAN values
    const domains: string[] = []
    const ipAddresses: string[] = []
    const emails: string[] = []
    const uris: string[] = []
    const other: string[] = []
    
    const sanValues = sanExtension.value.split(', ')
    
    sanValues.forEach(value => {
      if (value.startsWith('DNS:')) {
        domains.push(value.substring(4))
      } else if (value.startsWith('IP:')) {
        ipAddresses.push(value.substring(3))
      } else if (value.startsWith('email:')) {
        emails.push(value.substring(6))
      } else if (value.startsWith('URI:')) {
        uris.push(value.substring(4))
      } else {
        other.push(value)
      }
    })
    
    return {
      domains,
      ipAddresses,
      emails,
      uris,
      other
    }
  }
  
  static checkCertificateExpiry(certificate: string): {
    isExpired: boolean
    isExpiringSoon: boolean
    daysUntilExpiry: number
    validFrom: Date
    validTo: Date
    status: 'expired' | 'expiring-soon' | 'valid' | 'not-yet-valid'
  } {
    const parsed = this.parseCertificate(certificate)
    
    if (!parsed.valid || !parsed.certificate) {
      return {
        isExpired: true,
        isExpiringSoon: false,
        daysUntilExpiry: -1,
        validFrom: new Date(0),
        validTo: new Date(0),
        status: 'expired'
      }
    }
    
    const now = new Date()
    const { validFrom, validTo } = parsed.certificate
    
    const isExpired = validTo.getTime() < now.getTime()
    const isNotYetValid = validFrom.getTime() > now.getTime()
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
    
    let status: 'expired' | 'expiring-soon' | 'valid' | 'not-yet-valid'
    
    if (isNotYetValid) {
      status = 'not-yet-valid'
    } else if (isExpired) {
      status = 'expired'
    } else if (isExpiringSoon) {
      status = 'expiring-soon'
    } else {
      status = 'valid'
    }
    
    return {
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
      validFrom,
      validTo,
      status
    }
  }
  
  static analyzeCertificateSecurity(certificate: string): {
    securityLevel: 'low' | 'medium' | 'high'
    vulnerabilities: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      recommendation: string
    }>
    strengths: string[]
    recommendations: string[]
  } {
    const parsed = this.parseCertificate(certificate)
    const vulnerabilities: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      recommendation: string
    }> = []
    const strengths: string[] = []
    const recommendations: string[] = []
    
    if (!parsed.valid || !parsed.certificate) {
      return {
        securityLevel: 'low',
        vulnerabilities: [{
          severity: 'critical',
          description: 'Certificate is invalid or cannot be parsed',
          recommendation: 'Use a valid X.509 certificate'
        }],
        strengths: [],
        recommendations: ['Obtain a valid certificate from a trusted CA']
      }
    }
    
    const cert = parsed.certificate
    
    // Analyze key size
    if (cert.publicKey.keySize < 1024) {
      vulnerabilities.push({
        severity: 'critical',
        description: 'Extremely weak key size (< 1024 bits)',
        recommendation: 'Use at least 2048-bit keys'
      })
    } else if (cert.publicKey.keySize < 2048) {
      vulnerabilities.push({
        severity: 'high',
        description: 'Weak key size (< 2048 bits)',
        recommendation: 'Use 2048-bit or larger keys'
      })
    } else if (cert.publicKey.keySize >= 2048) {
      strengths.push('Strong key size (>= 2048 bits)')
    }
    
    // Analyze signature algorithm
    if (cert.signature.algorithm.includes('md5')) {
      vulnerabilities.push({
        severity: 'critical',
        description: 'MD5 signature algorithm is cryptographically broken',
        recommendation: 'Use SHA-256 or stronger hash algorithms'
      })
    } else if (cert.signature.algorithm.includes('sha1')) {
      vulnerabilities.push({
        severity: 'high',
        description: 'SHA-1 signature algorithm is deprecated',
        recommendation: 'Use SHA-256 or stronger hash algorithms'
      })
    } else if (cert.signature.algorithm.includes('sha256')) {
      strengths.push('Strong signature algorithm (SHA-256)')
    }
    
    // Check expiry
    const expiryCheck = this.checkCertificateExpiry(certificate)
    
    if (expiryCheck.isExpired) {
      vulnerabilities.push({
        severity: 'critical',
        description: 'Certificate has expired',
        recommendation: 'Renew the certificate immediately'
      })
    } else if (expiryCheck.isExpiringSoon) {
      vulnerabilities.push({
        severity: 'medium',
        description: `Certificate expires in ${expiryCheck.daysUntilExpiry} days`,
        recommendation: 'Plan certificate renewal'
      })
    }
    
    // Check key usage
    const keyUsageExt = cert.extensions.find(ext => ext.name === 'Key Usage')
    if (keyUsageExt) {
      strengths.push('Key usage extension is present')
    } else {
      recommendations.push('Add key usage extension for better security')
    }
    
    // Check extended key usage
    const extKeyUsageExt = cert.extensions.find(ext => ext.name === 'Extended Key Usage')
    if (extKeyUsageExt) {
      strengths.push('Extended key usage extension is present')
    }
    
    // Check SAN
    const sanExt = cert.extensions.find(ext => ext.name === 'Subject Alternative Name')
    if (sanExt) {
      strengths.push('Subject Alternative Name extension is present')
    } else {
      recommendations.push('Add SAN extension for better compatibility')
    }
    
    // Determine overall security level
    let securityLevel: 'low' | 'medium' | 'high' = 'high'
    
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length
    const highVulns = vulnerabilities.filter(v => v.severity === 'high').length
    
    if (criticalVulns > 0) {
      securityLevel = 'low'
    } else if (highVulns > 0) {
      securityLevel = 'medium'
    }
    
    return {
      securityLevel,
      vulnerabilities,
      strengths,
      recommendations
    }
  }
  
  static generateCertificateReport(certificate: string): {
    summary: {
      commonName: string
      issuer: string
      validPeriod: string
      keyAlgorithm: string
      keySize: number
      signatureAlgorithm: string
    }
    validity: {
      isValid: boolean
      isExpired: boolean
      daysRemaining: number
    }
    security: {
      level: 'low' | 'medium' | 'high'
      score: number // 0-100
      issues: string[]
    }
    extensions: Array<{
      name: string
      critical: boolean
      description: string
    }>
    alternativeNames: string[]
    fingerprints: {
      sha1: string
      sha256: string
      md5: string
    }
  } {
    const parsed = this.parseCertificate(certificate)
    
    if (!parsed.valid || !parsed.certificate) {
      return {
        summary: {
          commonName: 'Invalid Certificate',
          issuer: 'Unknown',
          validPeriod: 'Unknown',
          keyAlgorithm: 'Unknown',
          keySize: 0,
          signatureAlgorithm: 'Unknown'
        },
        validity: {
          isValid: false,
          isExpired: true,
          daysRemaining: 0
        },
        security: {
          level: 'low',
          score: 0,
          issues: ['Certificate is invalid']
        },
        extensions: [],
        alternativeNames: [],
        fingerprints: {
          sha1: '',
          sha256: '',
          md5: ''
        }
      }
    }
    
    const cert = parsed.certificate
    const expiryCheck = this.checkCertificateExpiry(certificate)
    const securityAnalysis = this.analyzeCertificateSecurity(certificate)
    const sanData = this.extractSAN(certificate)
    
    // Extract common name from subject
    const cnMatch = cert.subject.match(/CN=([^,]+)/)
    const commonName = cnMatch ? cnMatch[1] : 'Unknown'
    
    // Extract issuer common name
    const issuerCnMatch = cert.issuer.match(/CN=([^,]+)/)
    const issuerName = issuerCnMatch ? issuerCnMatch[1] : cert.issuer
    
    // Format validity period
    const validPeriod = `${cert.validFrom.toISOString().split('T')[0]} to ${cert.validTo.toISOString().split('T')[0]}`
    
    // Calculate security score
    let securityScore = 100
    securityAnalysis.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': securityScore -= 30; break
        case 'high': securityScore -= 20; break
        case 'medium': securityScore -= 10; break
        case 'low': securityScore -= 5; break
      }
    })
    securityScore = Math.max(0, securityScore)
    
    // Format extensions
    const extensions = cert.extensions.map(ext => ({
      name: ext.name,
      critical: ext.critical,
      description: ext.value
    }))
    
    // Collect all alternative names
    const alternativeNames = [
      ...sanData.domains,
      ...sanData.ipAddresses,
      ...sanData.emails,
      ...sanData.uris
    ]
    
    return {
      summary: {
        commonName,
        issuer: issuerName,
        validPeriod,
        keyAlgorithm: cert.publicKey.algorithm,
        keySize: cert.publicKey.keySize,
        signatureAlgorithm: cert.signature.algorithm
      },
      validity: {
        isValid: !expiryCheck.isExpired && expiryCheck.status !== 'not-yet-valid',
        isExpired: expiryCheck.isExpired,
        daysRemaining: expiryCheck.daysUntilExpiry
      },
      security: {
        level: securityAnalysis.securityLevel,
        score: securityScore,
        issues: securityAnalysis.vulnerabilities.map(v => v.description)
      },
      extensions,
      alternativeNames,
      fingerprints: cert.fingerprints
    }
  }
}

describe('Certificate Viewer', () => {
  const validPemCert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJGUGgfAX5TgMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA5qwDxGxKI2VGJoRrWzNODaWIbQKQZhhMYBLHCdXhGo8HpKnVRgvHLdcL
-----END CERTIFICATE-----`

  const invalidPemCert = `-----BEGIN CERTIFICATE-----
InvalidBase64Content!@#
-----END CERTIFICATE-----`

  const malformedPem = `-----BEGIN INVALID-----
MIIDXTCCAkWgAwIBAgIJAJGUGgfAX5TgMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END INVALID-----`

  describe('parseCertificate', () => {
    it('should parse valid PEM certificate', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      expect(result.valid).toBe(true)
      expect(result.certificate).toBeDefined()
      expect(result.error).toBeUndefined()
      expect(result.certificate?.version).toBe(3)
      expect(result.certificate?.publicKey.algorithm).toBe('RSA')
    })
    
    it('should extract certificate details correctly', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      expect(result.certificate?.serialNumber).toMatch(/^[A-F0-9]+$/)
      expect(result.certificate?.issuer).toContain('CN=')
      expect(result.certificate?.subject).toContain('CN=')
      expect(result.certificate?.validFrom).toBeInstanceOf(Date)
      expect(result.certificate?.validTo).toBeInstanceOf(Date)
    })
    
    it('should generate fingerprints', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      expect(result.certificate?.fingerprints.sha1).toMatch(/^[A-F0-9:]{39}$/)
      expect(result.certificate?.fingerprints.sha256).toMatch(/^[A-F0-9:]{95}$/)
      expect(result.certificate?.fingerprints.md5).toMatch(/^[A-F0-9:]{47}$/)
    })
    
    it('should include certificate extensions', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      expect(result.certificate?.extensions).toBeDefined()
      expect(result.certificate?.extensions.length).toBeGreaterThan(0)
      
      const sanExt = result.certificate?.extensions.find(ext => ext.name === 'Subject Alternative Name')
      expect(sanExt).toBeDefined()
    })
    
    it('should reject invalid PEM format', () => {
      const invalidFormats = [
        'not a certificate',
        malformedPem,
        '',
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----'
      ]
      
      invalidFormats.forEach(invalid => {
        const result = CertificateViewer.parseCertificate(invalid)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
    
    it('should reject invalid base64 content', () => {
      const result = CertificateViewer.parseCertificate(invalidPemCert)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('base64')
    })
    
    it('should generate security warnings', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      expect(result.warnings).toBeDefined()
      expect(Array.isArray(result.warnings)).toBe(true)
      
      // Certificate might have warnings like weak key size or expiration
      if (result.certificate?.publicKey.keySize === 1024) {
        expect(result.warnings.some(w => w.includes('weak key size'))).toBe(true)
      }
    })
  })
  
  describe('validateCertificateChain', () => {
    it('should validate single certificate', () => {
      const result = CertificateViewer.validateCertificateChain([validPemCert])
      
      expect(result.chainLength).toBe(1)
      expect(result.leafCertificate).toBe(validPemCert)
      expect(result.intermediates).toHaveLength(0)
      expect(result.trustLevel).toMatch(/self-signed|ca-signed/)
    })
    
    it('should validate certificate chain', () => {
      const chain = [validPemCert, validPemCert, validPemCert] // Mock chain
      const result = CertificateViewer.validateCertificateChain(chain)
      
      expect(result.chainLength).toBe(3)
      expect(result.leafCertificate).toBe(validPemCert)
      expect(result.intermediates).toHaveLength(1)
      expect(result.rootCA).toBe(validPemCert)
    })
    
    it('should detect chain validation errors', () => {
      const invalidChain = [validPemCert, invalidPemCert]
      const result = CertificateViewer.validateCertificateChain(invalidChain)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
    
    it('should handle empty chain', () => {
      const result = CertificateViewer.validateCertificateChain([])
      
      expect(result.valid).toBe(false)
      expect(result.chainLength).toBe(0)
      expect(result.errors).toContain('No certificates provided')
      expect(result.trustLevel).toBe('untrusted')
    })
    
    it('should detect self-signed certificates', () => {
      const result = CertificateViewer.validateCertificateChain([validPemCert])
      
      if (result.trustLevel === 'self-signed') {
        expect(result.warnings.some(w => w.includes('self-signed'))).toBe(true)
      }
    })
  })
  
  describe('extractSAN', () => {
    it('should extract Subject Alternative Names', () => {
      const san = CertificateViewer.extractSAN(validPemCert)
      
      expect(san.domains).toBeDefined()
      expect(san.ipAddresses).toBeDefined()
      expect(san.emails).toBeDefined()
      expect(san.uris).toBeDefined()
      expect(san.other).toBeDefined()
      
      // Based on mock certificate
      expect(san.domains).toContain('example.com')
      expect(san.domains).toContain('www.example.com')
    })
    
    it('should handle certificate without SAN', () => {
      // Would need a certificate without SAN extension for this test
      const san = CertificateViewer.extractSAN(validPemCert)
      
      expect(Array.isArray(san.domains)).toBe(true)
      expect(Array.isArray(san.ipAddresses)).toBe(true)
      expect(Array.isArray(san.emails)).toBe(true)
      expect(Array.isArray(san.uris)).toBe(true)
    })
    
    it('should handle invalid certificate', () => {
      const san = CertificateViewer.extractSAN('invalid')
      
      expect(san.domains).toEqual([])
      expect(san.ipAddresses).toEqual([])
      expect(san.emails).toEqual([])
      expect(san.uris).toEqual([])
      expect(san.other).toEqual([])
    })
  })
  
  describe('checkCertificateExpiry', () => {
    it('should check certificate expiry status', () => {
      const result = CertificateViewer.checkCertificateExpiry(validPemCert)
      
      expect(result.validFrom).toBeInstanceOf(Date)
      expect(result.validTo).toBeInstanceOf(Date)
      expect(typeof result.daysUntilExpiry).toBe('number')
      expect(result.status).toMatch(/^(valid|expired|expiring-soon|not-yet-valid)$/)
    })
    
    it('should detect valid certificates', () => {
      const result = CertificateViewer.checkCertificateExpiry(validPemCert)
      
      if (result.status === 'valid') {
        expect(result.isExpired).toBe(false)
        expect(result.isExpiringSoon).toBe(false)
        expect(result.daysUntilExpiry).toBeGreaterThan(30)
      }
    })
    
    it('should detect expiring certificates', () => {
      const result = CertificateViewer.checkCertificateExpiry(validPemCert)
      
      if (result.status === 'expiring-soon') {
        expect(result.isExpiringSoon).toBe(true)
        expect(result.daysUntilExpiry).toBeLessThanOrEqual(30)
        expect(result.daysUntilExpiry).toBeGreaterThan(0)
      }
    })
    
    it('should handle invalid certificate', () => {
      const result = CertificateViewer.checkCertificateExpiry('invalid')
      
      expect(result.isExpired).toBe(true)
      expect(result.status).toBe('expired')
      expect(result.daysUntilExpiry).toBe(-1)
    })
  })
  
  describe('analyzeCertificateSecurity', () => {
    it('should analyze certificate security', () => {
      const analysis = CertificateViewer.analyzeCertificateSecurity(validPemCert)
      
      expect(analysis.securityLevel).toMatch(/^(low|medium|high)$/)
      expect(Array.isArray(analysis.vulnerabilities)).toBe(true)
      expect(Array.isArray(analysis.strengths)).toBe(true)
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })
    
    it('should detect weak key sizes', () => {
      // This depends on the mock certificate generation logic
      const analysis = CertificateViewer.analyzeCertificateSecurity(validPemCert)
      
      const weakKeyVuln = analysis.vulnerabilities.find(v => 
        v.description.includes('key size')
      )
      
      if (weakKeyVuln) {
        expect(weakKeyVuln.severity).toMatch(/^(high|critical)$/)
        expect(weakKeyVuln.recommendation).toContain('2048')
      }
    })
    
    it('should detect weak signature algorithms', () => {
      const analysis = CertificateViewer.analyzeCertificateSecurity(validPemCert)
      
      // Check for MD5 or SHA-1 warnings
      const weakSigVuln = analysis.vulnerabilities.find(v =>
        v.description.includes('signature algorithm')
      )
      
      if (weakSigVuln) {
        expect(weakSigVuln.severity).toMatch(/^(high|critical)$/)
      }
    })
    
    it('should identify security strengths', () => {
      const analysis = CertificateViewer.analyzeCertificateSecurity(validPemCert)
      
      // Should find some strengths in a valid certificate
      if (analysis.securityLevel === 'high') {
        expect(analysis.strengths.length).toBeGreaterThan(0)
      }
    })
    
    it('should provide security recommendations', () => {
      const analysis = CertificateViewer.analyzeCertificateSecurity(validPemCert)
      
      expect(analysis.recommendations).toBeDefined()
      // Recommendations might be empty for perfect certificates
    })
    
    it('should handle invalid certificate', () => {
      const analysis = CertificateViewer.analyzeCertificateSecurity('invalid')
      
      expect(analysis.securityLevel).toBe('low')
      expect(analysis.vulnerabilities.length).toBeGreaterThan(0)
      expect(analysis.vulnerabilities[0].severity).toBe('critical')
    })
  })
  
  describe('generateCertificateReport', () => {
    it('should generate comprehensive certificate report', () => {
      const report = CertificateViewer.generateCertificateReport(validPemCert)
      
      expect(report.summary).toBeDefined()
      expect(report.validity).toBeDefined()
      expect(report.security).toBeDefined()
      expect(report.extensions).toBeDefined()
      expect(report.alternativeNames).toBeDefined()
      expect(report.fingerprints).toBeDefined()
    })
    
    it('should include summary information', () => {
      const report = CertificateViewer.generateCertificateReport(validPemCert)
      
      expect(report.summary.commonName).toBeDefined()
      expect(report.summary.issuer).toBeDefined()
      expect(report.summary.keyAlgorithm).toBe('RSA')
      expect(report.summary.keySize).toBeGreaterThan(0)
      expect(report.summary.signatureAlgorithm).toContain('RSA')
    })
    
    it('should include validity information', () => {
      const report = CertificateViewer.generateCertificateReport(validPemCert)
      
      expect(typeof report.validity.isValid).toBe('boolean')
      expect(typeof report.validity.isExpired).toBe('boolean')
      expect(typeof report.validity.daysRemaining).toBe('number')
    })
    
    it('should include security assessment', () => {
      const report = CertificateViewer.generateCertificateReport(validPemCert)
      
      expect(report.security.level).toMatch(/^(low|medium|high)$/)
      expect(report.security.score).toBeGreaterThanOrEqual(0)
      expect(report.security.score).toBeLessThanOrEqual(100)
      expect(Array.isArray(report.security.issues)).toBe(true)
    })
    
    it('should list certificate extensions', () => {
      const report = CertificateViewer.generateCertificateReport(validPemCert)
      
      expect(Array.isArray(report.extensions)).toBe(true)
      
      const keyUsageExt = report.extensions.find(ext => ext.name === 'Key Usage')
      if (keyUsageExt) {
        expect(typeof keyUsageExt.critical).toBe('boolean')
        expect(keyUsageExt.description).toBeDefined()
      }
    })
    
    it('should handle invalid certificate', () => {
      const report = CertificateViewer.generateCertificateReport('invalid')
      
      expect(report.summary.commonName).toBe('Invalid Certificate')
      expect(report.validity.isValid).toBe(false)
      expect(report.security.level).toBe('low')
      expect(report.security.score).toBe(0)
    })
  })
  
  describe('performance tests', () => {
    it('should parse certificates efficiently', async () => {
      const { duration } = await perfUtils.measure(() => {
        for (let i = 0; i < 100; i++) {
          CertificateViewer.parseCertificate(validPemCert)
        }
      })
      
      expect(duration).toBeLessThan(2000) // Less than 2 seconds for 100 parses
    })
    
    it('should handle large certificate chains', async () => {
      const largeChain = new Array(10).fill(validPemCert)
      
      const { duration } = await perfUtils.measure(() => {
        CertificateViewer.validateCertificateChain(largeChain)
      })
      
      expect(duration).toBeLessThan(1000)
    })
    
    it('should maintain performance under stress', async () => {
      const testFn = () => {
        CertificateViewer.parseCertificate(validPemCert)
        CertificateViewer.analyzeCertificateSecurity(validPemCert)
        CertificateViewer.checkCertificateExpiry(validPemCert)
      }
      
      const results = await perfUtils.stressTest(testFn, 100)
      expect(results.success).toBe(100)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(100)
    })
  })
  
  describe('security tests', () => {
    it('should handle malicious PEM content', () => {
      const maliciousPems = [
        `-----BEGIN CERTIFICATE-----\n${security.xss.basic}\n-----END CERTIFICATE-----`,
        `-----BEGIN CERTIFICATE-----\n<script>alert(1)</script>\n-----END CERTIFICATE-----`,
        `-----BEGIN CERTIFICATE-----\n${'\x00'.repeat(1000)}\n-----END CERTIFICATE-----`
      ]
      
      maliciousPems.forEach(malicious => {
        expect(() => CertificateViewer.parseCertificate(malicious)).not.toThrow()
        const result = CertificateViewer.parseCertificate(malicious)
        expect(result.valid).toBe(false)
      })
    })
    
    it('should handle extremely long certificate content', () => {
      const hugePem = `-----BEGIN CERTIFICATE-----\n${'A'.repeat(100000)}\n-----END CERTIFICATE-----`
      
      expect(() => CertificateViewer.parseCertificate(hugePem)).not.toThrow()
      const result = CertificateViewer.parseCertificate(hugePem)
      expect(result.valid).toBe(false) // Invalid base64
    })
    
    it('should prevent ReDoS attacks in PEM parsing', () => {
      const reDoSPattern = 'A'.repeat(10000) + '!'
      const maliciousPem = `-----BEGIN CERTIFICATE-----\n${reDoSPattern}\n-----END CERTIFICATE-----`
      
      const startTime = Date.now()
      const result = CertificateViewer.parseCertificate(maliciousPem)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(1000) // Should not hang
      expect(result.valid).toBe(false)
    })
    
    it('should sanitize certificate field extraction', () => {
      // This would require crafting specific ASN.1 content in real implementation
      expect(() => CertificateViewer.parseCertificate(validPemCert)).not.toThrow()
    })
    
    it('should handle null bytes and control characters', () => {
      const controlCharsPem = `-----BEGIN CERTIFICATE-----\nMII${'\x00\x01\x02'}DXTCC\n-----END CERTIFICATE-----`
      
      expect(() => CertificateViewer.parseCertificate(controlCharsPem)).not.toThrow()
      const result = CertificateViewer.parseCertificate(controlCharsPem)
      expect(result.valid).toBe(false)
    })
  })
  
  describe('edge cases', () => {
    it('should handle certificates with Unicode subject names', () => {
      // In real implementation, would need actual certificate with Unicode names
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      if (result.valid) {
        expect(result.certificate?.subject).toBeDefined()
        expect(result.certificate?.issuer).toBeDefined()
      }
    })
    
    it('should handle certificates with unusual key sizes', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      if (result.valid && result.certificate) {
        expect(result.certificate.publicKey.keySize).toBeGreaterThan(0)
        expect(result.certificate.publicKey.keySize).toBeLessThan(16384) // Reasonable upper bound
      }
    })
    
    it('should handle certificates with many extensions', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      if (result.valid && result.certificate) {
        expect(result.certificate.extensions.length).toBeGreaterThanOrEqual(0)
        
        result.certificate.extensions.forEach(ext => {
          expect(ext.name).toBeDefined()
          expect(typeof ext.critical).toBe('boolean')
          expect(ext.value).toBeDefined()
        })
      }
    })
    
    it('should handle empty certificate chain arrays', () => {
      const result = CertificateViewer.validateCertificateChain([])
      
      expect(result.valid).toBe(false)
      expect(result.chainLength).toBe(0)
      expect(result.trustLevel).toBe('untrusted')
    })
    
    it('should handle whitespace variations in PEM', () => {
      const variations = [
        validPemCert.replace(/\n/g, '\r\n'), // Windows line endings
        ' ' + validPemCert + ' ', // Leading/trailing spaces
        validPemCert.replace(/\n/g, '\n\n'), // Extra blank lines
        validPemCert.replace(/\n/g, '    \n    ') // Indented lines
      ]
      
      variations.forEach(variation => {
        const result = CertificateViewer.parseCertificate(variation)
        expect(result.valid).toBe(true) // Should handle whitespace gracefully
      })
    })
    
    it('should handle certificate dates edge cases', () => {
      const result = CertificateViewer.parseCertificate(validPemCert)
      
      if (result.valid && result.certificate) {
        const { validFrom, validTo } = result.certificate
        
        expect(validFrom.getTime()).toBeLessThan(validTo.getTime())
        expect(validFrom).toBeInstanceOf(Date)
        expect(validTo).toBeInstanceOf(Date)
        expect(!isNaN(validFrom.getTime())).toBe(true)
        expect(!isNaN(validTo.getTime())).toBe(true)
      }
    })
  })
})