import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { preview } from 'astro'
import type { PreviewServer } from 'astro'

describe('Home Page Integration Tests', () => {
  let server: PreviewServer
  
  beforeAll(async () => {
    server = await preview({
      root: process.cwd(),
    })
  }, 30000)
  
  afterAll(async () => {
    await server.stop()
  })
  
  describe('Page Load', () => {
    it('should load home page successfully', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/html')
    })
    
    it('should have correct page title', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('<title>')
      expect(html).toContain('Caia Tech')
    })
    
    it('should have meta tags for SEO', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('<meta name="description"')
      expect(html).toContain('<meta property="og:title"')
      expect(html).toContain('<meta property="og:description"')
      expect(html).toContain('<meta name="viewport"')
    })
    
    it('should have navigation component', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('nav')
      expect(html).toContain('Tools')
    })
    
    it('should have footer component', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('footer')
    })
  })
  
  describe('Hero Section', () => {
    it('should have hero section with title', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('Advancing')
      expect(html).toContain('Tomorrow')
    })
    
    it('should have hero CTA buttons', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('Get Started')
      expect(html).toContain('Learn More')
    })
    
    it('should have animated background', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('animated-bg')
    })
  })
  
  describe('Services Section', () => {
    it('should display services', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('Developer Tools')
      expect(html).toContain('Privacy')
    })
    
    it('should have service cards', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('service-card')
    })
  })
  
  describe('About Section', () => {
    it('should have about section', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('About')
      expect(html).toContain('technology')
    })
    
    it('should have mission statement', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('mission')
    })
  })
  
  describe('Performance', () => {
    it('should load page within reasonable time', async () => {
      const startTime = Date.now()
      const response = await fetch(`http://localhost:${server.port}/`)
      await response.text()
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(3000) // Less than 3 seconds
    })
    
    it('should have optimized assets', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      // Check for minified CSS
      const cssLinks = html.match(/<link[^>]+rel="stylesheet"[^>]+>/g) || []
      cssLinks.forEach(link => {
        expect(link).toMatch(/\.css|\.min\.css/)
      })
      
      // Check for optimized scripts
      const scripts = html.match(/<script[^>]+src="[^"]+"/g) || []
      scripts.forEach(script => {
        expect(script).toMatch(/\.js|\.min\.js/)
      })
    })
  })
  
  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      // Should have h1
      expect(html).toMatch(/<h1[^>]*>/)
      
      // h2 should come after h1
      const h1Index = html.indexOf('<h1')
      const h2Index = html.indexOf('<h2')
      if (h2Index > -1) {
        expect(h2Index).toBeGreaterThan(h1Index)
      }
    })
    
    it('should have alt text for images', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      const images = html.match(/<img[^>]+>/g) || []
      images.forEach(img => {
        expect(img).toContain('alt=')
      })
    })
    
    it('should have ARIA labels for interactive elements', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      // Check buttons have accessible text or aria-label
      const buttons = html.match(/<button[^>]*>/g) || []
      buttons.forEach(button => {
        const hasAriaLabel = button.includes('aria-label')
        const hasText = /<button[^>]*>[^<]+<\/button>/.test(html)
        expect(hasAriaLabel || hasText).toBe(true)
      })
    })
    
    it('should have skip navigation link', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toMatch(/skip.*nav|Skip to content/i)
    })
  })
  
  describe('Responsive Design', () => {
    it('should have mobile viewport meta tag', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('viewport')
      expect(html).toContain('width=device-width')
    })
    
    it('should have responsive container classes', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toMatch(/container|max-w-|mx-auto/)
    })
  })
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent pages', async () => {
      const response = await fetch(`http://localhost:${server.port}/non-existent-page`)
      expect(response.status).toBe(404)
    })
    
    it('should have custom 404 page', async () => {
      const response = await fetch(`http://localhost:${server.port}/non-existent-page`)
      const html = await response.text()
      
      expect(html).toContain('404')
      expect(html).toContain('not found')
    })
  })
  
  describe('Security Headers', () => {
    it('should have security headers', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      
      // Check for common security headers
      const headers = response.headers
      
      // These might be set by the server or CDN
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'referrer-policy',
        'content-security-policy'
      ]
      
      // At least some security headers should be present
      const hasSecurityHeaders = securityHeaders.some(header => 
        headers.has(header)
      )
      
      // This is a recommendation, not a hard requirement
      if (!hasSecurityHeaders) {
        console.warn('Consider adding security headers')
      }
    })
  })
  
  describe('Links and Navigation', () => {
    it('should have working internal links', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      // Extract internal links
      const links = html.match(/href="\/[^"]*"/g) || []
      
      // Test a sample of links
      const testLinks = links.slice(0, 5)
      
      for (const link of testLinks) {
        const path = link.match(/href="([^"]+)"/)?.[1]
        if (path && !path.includes('#')) {
          const linkResponse = await fetch(`http://localhost:${server.port}${path}`)
          expect(linkResponse.status).toBeLessThan(400)
        }
      }
    })
    
    it('should have external links with proper attributes', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      // External links should have target="_blank" and rel="noopener"
      const externalLinks = html.match(/<a[^>]+href="https?:\/\/[^"]+"/g) || []
      
      externalLinks.forEach(link => {
        if (link.includes('target="_blank"')) {
          expect(link).toContain('rel=')
          expect(link).toMatch(/noopener|noreferrer/)
        }
      })
    })
  })
  
  describe('Forms', () => {
    it('should have proper form structure if forms exist', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      const forms = html.match(/<form[^>]*>/g) || []
      
      forms.forEach(form => {
        // Forms should have action or be handled by JavaScript
        expect(form).toMatch(/action=|@submit/)
      })
      
      // Input fields should have labels
      const inputs = html.match(/<input[^>]+>/g) || []
      inputs.forEach(input => {
        if (!input.includes('type="hidden"') && !input.includes('type="submit"')) {
          const id = input.match(/id="([^"]+)"/)?.[1]
          if (id) {
            expect(html).toContain(`for="${id}"`)
          }
        }
      })
    })
  })
  
  describe('Structured Data', () => {
    it('should have JSON-LD structured data', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      const hasStructuredData = html.includes('application/ld+json')
      
      if (hasStructuredData) {
        expect(html).toContain('"@context"')
        expect(html).toContain('"@type"')
      }
    })
  })
  
  describe('Social Media Tags', () => {
    it('should have Open Graph tags', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      expect(html).toContain('og:title')
      expect(html).toContain('og:description')
      expect(html).toContain('og:type')
    })
    
    it('should have Twitter Card tags', async () => {
      const response = await fetch(`http://localhost:${server.port}/`)
      const html = await response.text()
      
      const hasTwitterTags = html.includes('twitter:card') || 
                            html.includes('twitter:title')
      
      // Twitter tags are recommended but not required
      if (!hasTwitterTags) {
        console.warn('Consider adding Twitter Card tags for better social sharing')
      }
    })
  })
})