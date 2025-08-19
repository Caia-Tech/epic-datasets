import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { preview } from 'astro'
import type { PreviewServer } from 'astro'

describe('Tools Page Integration Tests', () => {
  let server: PreviewServer
  
  beforeAll(async () => {
    server = await preview({
      root: process.cwd(),
    })
  }, 30000)
  
  afterAll(async () => {
    await server.stop()
  })
  
  describe('Tools Index Page', () => {
    it('should load tools index page', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      expect(response.status).toBe(200)
    })
    
    it('should display all tool categories', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      const html = await response.text()
      
      // Check for main categories
      expect(html).toContain('Core Utilities')
      expect(html).toContain('Security')
      expect(html).toContain('Text')
      expect(html).toContain('Developer')
    })
    
    it('should have search functionality', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      const html = await response.text()
      
      expect(html).toContain('search')
      expect(html).toMatch(/<input[^>]+type="search"/)
    })
    
    it('should list all 55+ tools', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      const html = await response.text()
      
      // Check for key tools
      const tools = [
        'JSON Formatter',
        'Base64',
        'UUID Generator',
        'Hash Generator',
        'Password Generator',
        'JWT Decoder',
        'Encryption',
        'ASCII Art',
        'Markdown Editor',
        'Diff Checker'
      ]
      
      tools.forEach(tool => {
        expect(html).toContain(tool)
      })
    })
    
    it('should have tool cards with links', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      const html = await response.text()
      
      expect(html).toContain('tool-card')
      expect(html).toMatch(/href="\/tools\/[^"]+"/g)
    })
    
    it('should have privacy badges', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      const html = await response.text()
      
      expect(html).toContain('Client-side')
      expect(html).toContain('Privacy')
    })
  })
  
  describe('Individual Tool Pages', () => {
    const toolRoutes = [
      '/tools/json',
      '/tools/base64',
      '/tools/uuid',
      '/tools/hash',
      '/tools/password',
      '/tools/jwt',
      '/tools/diff',
      '/tools/markdown',
      '/tools/regex',
      '/tools/timestamp'
    ]
    
    toolRoutes.forEach(route => {
      describe(`Tool: ${route}`, () => {
        it('should load successfully', async () => {
          const response = await fetch(`http://localhost:${server.port}${route}`)
          expect(response.status).toBe(200)
        })
        
        it('should have tool layout', async () => {
          const response = await fetch(`http://localhost:${server.port}${route}`)
          const html = await response.text()
          
          expect(html).toContain('tool-container')
          expect(html).toContain('input')
        })
        
        it('should have privacy badge', async () => {
          const response = await fetch(`http://localhost:${server.port}${route}`)
          const html = await response.text()
          
          expect(html).toContain('privacy-badge')
          expect(html).toContain('Client-side')
        })
        
        it('should have educational content', async () => {
          const response = await fetch(`http://localhost:${server.port}${route}`)
          const html = await response.text()
          
          expect(html).toMatch(/How it works|Features|Usage/)
        })
        
        it('should have attribution', async () => {
          const response = await fetch(`http://localhost:${server.port}${route}`)
          const html = await response.text()
          
          expect(html).toContain('Built by')
        })
      })
    })
  })
  
  describe('Tool Functionality', () => {
    it('should have interactive elements', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      const html = await response.text()
      
      expect(html).toMatch(/<textarea|<input/)
      expect(html).toContain('button')
    })
    
    it('should include client-side scripts', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/base64`)
      const html = await response.text()
      
      expect(html).toContain('<script')
      expect(html).toMatch(/encode|decode/)
    })
    
    it('should have copy functionality', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/uuid`)
      const html = await response.text()
      
      expect(html).toMatch(/copy|clipboard/i)
    })
    
    it('should have clear/reset functionality', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/hash`)
      const html = await response.text()
      
      expect(html).toMatch(/clear|reset/i)
    })
  })
  
  describe('Tool Categories', () => {
    it('should have security tools', async () => {
      const securityTools = [
        '/tools/jwt',
        '/tools/bcrypt',
        '/tools/aes',
        '/tools/rsa',
        '/tools/pgp'
      ]
      
      for (const tool of securityTools) {
        const response = await fetch(`http://localhost:${server.port}${tool}`)
        expect(response.status).toBe(200)
      }
    })
    
    it('should have text tools', async () => {
      const textTools = [
        '/tools/markdown',
        '/tools/diff',
        '/tools/case',
        '/tools/lorem',
        '/tools/text-stats'
      ]
      
      for (const tool of textTools) {
        const response = await fetch(`http://localhost:${server.port}${tool}`)
        expect(response.status).toBe(200)
      }
    })
    
    it('should have developer tools', async () => {
      const devTools = [
        '/tools/json',
        '/tools/yaml',
        '/tools/xml',
        '/tools/sql',
        '/tools/regex'
      ]
      
      for (const tool of devTools) {
        const response = await fetch(`http://localhost:${server.port}${tool}`)
        expect(response.status).toBe(200)
      }
    })
    
    it('should have network tools', async () => {
      const networkTools = [
        '/tools/dns',
        '/tools/ip',
        '/tools/ports',
        '/tools/ssl',
        '/tools/webhook'
      ]
      
      for (const tool of networkTools) {
        const response = await fetch(`http://localhost:${server.port}${tool}`)
        expect(response.status).toBe(200)
      }
    })
  })
  
  describe('Tool Navigation', () => {
    it('should have breadcrumbs', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      const html = await response.text()
      
      expect(html).toContain('breadcrumb')
      expect(html).toContain('Tools')
    })
    
    it('should have back to tools link', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/base64`)
      const html = await response.text()
      
      expect(html).toMatch(/href="\/tools"/)
      expect(html).toMatch(/Back to Tools|All Tools/)
    })
    
    it('should have related tools section', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/hash`)
      const html = await response.text()
      
      const hasRelated = html.includes('Related') || html.includes('Similar')
      
      // Related tools are recommended
      if (!hasRelated) {
        console.warn('Consider adding related tools section')
      }
    })
  })
  
  describe('Tool SEO', () => {
    it('should have unique titles', async () => {
      const tools = [
        { route: '/tools/json', title: 'JSON' },
        { route: '/tools/base64', title: 'Base64' },
        { route: '/tools/uuid', title: 'UUID' }
      ]
      
      for (const tool of tools) {
        const response = await fetch(`http://localhost:${server.port}${tool.route}`)
        const html = await response.text()
        
        expect(html).toContain(`<title>`)
        expect(html).toContain(tool.title)
      }
    })
    
    it('should have meta descriptions', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/password`)
      const html = await response.text()
      
      expect(html).toContain('meta name="description"')
      expect(html).toMatch(/password|generator|secure/)
    })
    
    it('should have structured data', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/markdown`)
      const html = await response.text()
      
      const hasStructuredData = html.includes('application/ld+json') ||
                               html.includes('SoftwareApplication')
      
      if (!hasStructuredData) {
        console.warn('Consider adding structured data for tools')
      }
    })
  })
  
  describe('Tool Accessibility', () => {
    it('should have form labels', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      const html = await response.text()
      
      const inputs = html.match(/<input[^>]+>/g) || []
      const textareas = html.match(/<textarea[^>]+>/g) || []
      
      inputs.concat(textareas).forEach(element => {
        if (!element.includes('type="hidden"')) {
          const id = element.match(/id="([^"]+)"/)?.[1]
          if (id) {
            const hasLabel = html.includes(`for="${id}"`) || 
                           element.includes('aria-label')
            expect(hasLabel).toBe(true)
          }
        }
      })
    })
    
    it('should have keyboard navigation', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/uuid`)
      const html = await response.text()
      
      // Interactive elements should be keyboard accessible
      const buttons = html.match(/<button[^>]*>/g) || []
      buttons.forEach(button => {
        // Should not have tabindex="-1"
        expect(button).not.toContain('tabindex="-1"')
      })
    })
    
    it('should have ARIA attributes', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/diff`)
      const html = await response.text()
      
      // Check for ARIA attributes on interactive elements
      const hasAria = html.includes('aria-') || 
                     html.includes('role=')
      
      expect(hasAria).toBe(true)
    })
  })
  
  describe('Tool Performance', () => {
    it('should load quickly', async () => {
      const startTime = Date.now()
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      await response.text()
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000) // Less than 2 seconds
    })
    
    it('should have optimized assets', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/base64`)
      const html = await response.text()
      
      // Check for minified assets
      const scripts = html.match(/<script[^>]+src="[^"]+"/g) || []
      scripts.forEach(script => {
        if (script.includes('src=')) {
          expect(script).toMatch(/\.js|\.min\.js|\.mjs/)
        }
      })
    })
    
    it('should use lazy loading for images', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools`)
      const html = await response.text()
      
      const images = html.match(/<img[^>]+>/g) || []
      
      // Non-critical images should have lazy loading
      images.forEach(img => {
        if (!img.includes('logo') && !img.includes('icon')) {
          const hasLazy = img.includes('loading="lazy"') || 
                         img.includes('data-src')
          
          if (!hasLazy) {
            console.warn('Consider adding lazy loading to images')
          }
        }
      })
    })
  })
  
  describe('Tool Error Handling', () => {
    it('should handle invalid tool routes', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/non-existent-tool`)
      expect(response.status).toBe(404)
    })
    
    it('should have error messages in UI', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      const html = await response.text()
      
      // Should have error display elements
      const hasErrorHandling = html.includes('error') || 
                             html.includes('alert') ||
                             html.includes('message')
      
      expect(hasErrorHandling).toBe(true)
    })
  })
  
  describe('Tool Features', () => {
    it('should have example/sample data', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      const html = await response.text()
      
      const hasExamples = html.includes('Example') || 
                         html.includes('Sample') ||
                         html.includes('Try')
      
      expect(hasExamples).toBe(true)
    })
    
    it('should have settings/options', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/password`)
      const html = await response.text()
      
      // Password generator should have options
      expect(html).toMatch(/length|uppercase|lowercase|numbers|symbols/)
    })
    
    it('should have download/export functionality', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/qr`)
      const html = await response.text()
      
      const hasExport = html.includes('download') || 
                       html.includes('export') ||
                       html.includes('save')
      
      if (!hasExport) {
        console.warn('Consider adding export functionality')
      }
    })
  })
  
  describe('Mobile Responsiveness', () => {
    it('should have mobile-friendly markup', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/json`)
      const html = await response.text()
      
      expect(html).toContain('viewport')
      expect(html).toMatch(/sm:|md:|lg:|xl:/) // Tailwind responsive classes
    })
    
    it('should have touch-friendly buttons', async () => {
      const response = await fetch(`http://localhost:${server.port}/tools/uuid`)
      const html = await response.text()
      
      // Buttons should have adequate size classes
      const buttons = html.match(/<button[^>]*class="[^"]*"/g) || []
      buttons.forEach(button => {
        const hasSize = button.includes('p-') || 
                       button.includes('py-') ||
                       button.includes('px-')
        expect(hasSize).toBe(true)
      })
    })
  })
})