import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Markdown Editor utility functions
class MarkdownEditor {
  static parseMarkdown(markdown: string): {
    html: string
    toc: Array<{ level: number, text: string, id: string }>
    metadata: Record<string, any>
    wordCount: number
    readingTime: number
  } {
    const lines = markdown.split('\n')
    const toc: Array<{ level: number, text: string, id: string }> = []
    const metadata: Record<string, any> = {}
    let html = ''
    let inCodeBlock = false
    let inFrontMatter = false
    let frontMatterData = ''
    
    lines.forEach((line, index) => {
      // Handle front matter
      if (index === 0 && line.trim() === '---') {
        inFrontMatter = true
        return
      }
      if (inFrontMatter && line.trim() === '---') {
        inFrontMatter = false
        this.parseFrontMatter(frontMatterData, metadata)
        return
      }
      if (inFrontMatter) {
        frontMatterData += line + '\n'
        return
      }
      
      // Handle code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock
        html += inCodeBlock ? '<pre><code>' : '</code></pre>\n'
        return
      }
      if (inCodeBlock) {
        html += this.escapeHtml(line) + '\n'
        return
      }
      
      // Handle headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const text = headingMatch[2]
        const id = this.generateId(text)
        toc.push({ level, text, id })
        html += `<h${level} id="${id}">${text}</h${level}>\n`
        return
      }
      
      // Handle other elements
      html += this.processInlineElements(line) + '\n'
    })
    
    const wordCount = this.countWords(markdown)
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
    
    return {
      html: html.trim(),
      toc,
      metadata,
      wordCount,
      readingTime
    }
  }
  
  private static parseFrontMatter(frontMatter: string, metadata: Record<string, any>) {
    const lines = frontMatter.trim().split('\n')
    lines.forEach(line => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        metadata[key] = value
      }
    })
  }
  
  private static processInlineElements(line: string): string {
    let processed = line
    
    // Bold **text** or __text__
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>')
    
    // Italic *text* or _text_
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
    processed = processed.replace(/_(.*?)_/g, '<em>$1</em>')
    
    // Code `code`
    processed = processed.replace(/`(.*?)`/g, '<code>$1</code>')
    
    // Links [text](url)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Images ![alt](src)
    processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    
    // Line breaks
    if (processed.trim() === '') {
      return '<br />'
    }
    
    return `<p>${processed}</p>`
  }
  
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  
  private static generateId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }
  
  private static countWords(text: string): number {
    // Remove markdown syntax and count words
    const cleanText = text
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images
    
    return cleanText.split(/\s+/).filter(word => word.length > 0).length
  }
  
  static markdownToHtml(markdown: string): string {
    return this.parseMarkdown(markdown).html
  }
  
  static extractLinks(markdown: string): Array<{ text: string, url: string, type: 'link' | 'image' }> {
    const links: Array<{ text: string, url: string, type: 'link' | 'image' }> = []
    
    // Extract regular links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match
    while ((match = linkRegex.exec(markdown)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
        type: 'link'
      })
    }
    
    // Extract image links
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    while ((match = imageRegex.exec(markdown)) !== null) {
      links.push({
        text: match[1] || 'Image',
        url: match[2],
        type: 'image'
      })
    }
    
    return links
  }
  
  static generateToc(markdown: string): Array<{ level: number, text: string, id: string, children?: any[] }> {
    const { toc } = this.parseMarkdown(markdown)
    
    // Build hierarchical structure
    const hierarchical: any[] = []
    const stack: any[] = []
    
    toc.forEach(item => {
      const newItem = { ...item, children: [] }
      
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop()
      }
      
      if (stack.length === 0) {
        hierarchical.push(newItem)
      } else {
        stack[stack.length - 1].children.push(newItem)
      }
      
      stack.push(newItem)
    })
    
    return hierarchical
  }
  
  static validateMarkdown(markdown: string): {
    valid: boolean
    errors: Array<{ line: number, message: string, type: 'warning' | 'error' }>
    warnings: Array<{ line: number, message: string, type: 'warning' | 'error' }>
  } {
    const lines = markdown.split('\n')
    const errors: Array<{ line: number, message: string, type: 'warning' | 'error' }> = []
    const warnings: Array<{ line: number, message: string, type: 'warning' | 'error' }> = []
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      
      // Check for unmatched bold/italic markers
      const boldCount = (line.match(/\*\*/g) || []).length
      const italicCount = (line.match(/(?<!\*)\*(?!\*)/g) || []).length
      
      if (boldCount % 2 !== 0) {
        warnings.push({
          line: lineNumber,
          message: 'Unmatched bold markers (**)',
          type: 'warning'
        })
      }
      
      if (italicCount % 2 !== 0) {
        warnings.push({
          line: lineNumber,
          message: 'Unmatched italic markers (*)',
          type: 'warning'
        })
      }
      
      // Check for malformed links
      const malformedLink = /\[[^\]]*\]\([^)]*$/
      if (malformedLink.test(line)) {
        errors.push({
          line: lineNumber,
          message: 'Malformed link - missing closing parenthesis',
          type: 'error'
        })
      }
      
      // Check for empty links
      const emptyLink = /\[\s*\]\(\s*\)/
      if (emptyLink.test(line)) {
        warnings.push({
          line: lineNumber,
          message: 'Empty link detected',
          type: 'warning'
        })
      }
      
      // Check for suspicious URLs
      const suspiciousUrl = /\[.*\]\((javascript:|data:|vbscript:)/i
      if (suspiciousUrl.test(line)) {
        errors.push({
          line: lineNumber,
          message: 'Potentially dangerous URL scheme',
          type: 'error'
        })
      }
    })
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  static formatMarkdown(markdown: string, options: {
    indentSize?: number
    maxLineLength?: number
    trimWhitespace?: boolean
  } = {}): string {
    const { indentSize = 2, maxLineLength = 100, trimWhitespace = true } = options
    const lines = markdown.split('\n')
    
    return lines.map(line => {
      let formatted = line
      
      if (trimWhitespace) {
        formatted = formatted.trimEnd()
      }
      
      // Format list indentation
      const listMatch = formatted.match(/^(\s*)([*\-+]|\d+\.)\s+(.*)/)
      if (listMatch) {
        const indent = ' '.repeat(Math.floor(listMatch[1].length / indentSize) * indentSize)
        formatted = `${indent}${listMatch[2]} ${listMatch[3]}`
      }
      
      // Wrap long lines (basic implementation)
      if (formatted.length > maxLineLength && !formatted.startsWith('```')) {
        // Don't wrap code blocks, headings, or lists
        if (!formatted.match(/^(#{1,6}|\s*[*\-+]|\s*\d+\.)/)) {
          // Simple word wrapping
          const words = formatted.split(' ')
          const wrapped: string[] = []
          let currentLine = ''
          
          words.forEach(word => {
            if ((currentLine + ' ' + word).length > maxLineLength) {
              if (currentLine) {
                wrapped.push(currentLine)
                currentLine = word
              } else {
                wrapped.push(word)
              }
            } else {
              currentLine = currentLine ? currentLine + ' ' + word : word
            }
          })
          
          if (currentLine) {
            wrapped.push(currentLine)
          }
          
          return wrapped.join('\n')
        }
      }
      
      return formatted
    }).join('\n')
  }
  
  static getStatistics(markdown: string): {
    characters: number
    charactersNoSpaces: number
    words: number
    sentences: number
    paragraphs: number
    headings: { [level: string]: number }
    links: number
    images: number
    codeBlocks: number
    readingTime: number
  } {
    const { wordCount, readingTime } = this.parseMarkdown(markdown)
    
    const characters = markdown.length
    const charactersNoSpaces = markdown.replace(/\s/g, '').length
    const sentences = (markdown.match(/[.!?]+/g) || []).length
    const paragraphs = markdown.split(/\n\s*\n/).filter(p => p.trim()).length
    
    const headings: { [level: string]: number } = {}
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`^#{${i}}\\s`, 'gm')
      headings[`h${i}`] = (markdown.match(regex) || []).length
    }
    
    const links = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length
    const images = (markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length
    const codeBlocks = (markdown.match(/```/g) || []).length / 2
    
    return {
      characters,
      charactersNoSpaces,
      words: wordCount,
      sentences,
      paragraphs,
      headings,
      links,
      images,
      codeBlocks,
      readingTime
    }
  }
  
  static convertToPlainText(markdown: string): string {
    return markdown
      // Remove front matter
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '[CODE BLOCK]')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove list markers
      .replace(/^\s*[*\-+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  
  static addTableOfContents(markdown: string, options: {
    maxDepth?: number
    title?: string
    position?: 'top' | 'after-title'
  } = {}): string {
    const { maxDepth = 6, title = '## Table of Contents', position = 'top' } = options
    const toc = this.generateToc(markdown)
    
    const generateTocMarkdown = (items: any[], depth = 0): string => {
      let tocMd = ''
      
      items.forEach(item => {
        if (item.level <= maxDepth) {
          const indent = '  '.repeat(depth)
          tocMd += `${indent}- [${item.text}](#${item.id})\n`
          
          if (item.children && item.children.length > 0) {
            tocMd += generateTocMarkdown(item.children, depth + 1)
          }
        }
      })
      
      return tocMd
    }
    
    const tocMarkdown = `${title}\n\n${generateTocMarkdown(toc)}\n`
    
    if (position === 'top') {
      return tocMarkdown + markdown
    } else {
      // Insert after first heading
      const lines = markdown.split('\n')
      const firstHeadingIndex = lines.findIndex(line => line.match(/^#{1,6}\s+/))
      
      if (firstHeadingIndex !== -1) {
        lines.splice(firstHeadingIndex + 1, 0, '', ...tocMarkdown.split('\n'))
        return lines.join('\n')
      }
      
      return tocMarkdown + markdown
    }
  }
  
  static preview(markdown: string, options: {
    baseUrl?: string
    sanitize?: boolean
  } = {}): string {
    const { baseUrl = '', sanitize = true } = options
    let { html } = this.parseMarkdown(markdown)
    
    if (baseUrl) {
      // Make relative URLs absolute
      html = html.replace(/href="(?!https?:\/\/)([^"]+)"/g, `href="${baseUrl}/$1"`)
      html = html.replace(/src="(?!https?:\/\/)([^"]+)"/g, `src="${baseUrl}/$1"`)
    }
    
    if (sanitize) {
      // Basic sanitization - remove dangerous elements and attributes
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      html = html.replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      html = html.replace(/javascript:/gi, '') // Remove javascript: URLs
    }
    
    return html
  }
}

describe('Markdown Editor', () => {
  describe('parseMarkdown', () => {
    it('should parse basic markdown elements', () => {
      const markdown = '# Heading\n\n**Bold** and *italic* text with `code`'
      const result = MarkdownEditor.parseMarkdown(markdown)
      
      expect(result.html).toContain('<h1')
      expect(result.html).toContain('<strong>Bold</strong>')
      expect(result.html).toContain('<em>italic</em>')
      expect(result.html).toContain('<code>code</code>')
      expect(result.wordCount).toBeGreaterThan(0)
    })
    
    it('should generate table of contents', () => {
      const markdown = '# Main\n## Sub 1\n### Sub Sub\n## Sub 2'
      const result = MarkdownEditor.parseMarkdown(markdown)
      
      expect(result.toc).toHaveLength(4)
      expect(result.toc[0].level).toBe(1)
      expect(result.toc[0].text).toBe('Main')
      expect(result.toc[0].id).toBe('main')
    })
    
    it('should parse front matter', () => {
      const markdown = '---\ntitle: Test\nauthor: John\n---\n\n# Content'
      const result = MarkdownEditor.parseMarkdown(markdown)
      
      expect(result.metadata.title).toBe('Test')
      expect(result.metadata.author).toBe('John')
    })
    
    it('should handle code blocks', () => {
      const markdown = '```javascript\nconsole.log("hello");\n```'
      const result = MarkdownEditor.parseMarkdown(markdown)
      
      expect(result.html).toContain('<pre><code>')
      expect(result.html).toContain('console.log')
    })
    
    it('should parse links and images', () => {
      const markdown = '[Link](http://example.com) and ![Image](image.jpg)'
      const result = MarkdownEditor.parseMarkdown(markdown)
      
      expect(result.html).toContain('<a href="http://example.com">Link</a>')
      expect(result.html).toContain('<img src="image.jpg" alt="Image"')
    })
    
    it('should calculate reading time', () => {
      const longMarkdown = 'word '.repeat(400) // 400 words
      const result = MarkdownEditor.parseMarkdown(longMarkdown)
      
      expect(result.readingTime).toBe(2) // ~200 words per minute
    })
    
    it('should handle empty markdown', () => {
      const result = MarkdownEditor.parseMarkdown('')
      
      expect(result.html).toBe('')
      expect(result.wordCount).toBe(0)
      expect(result.toc).toHaveLength(0)
    })
  })
  
  describe('extractLinks', () => {
    it('should extract all links from markdown', () => {
      const markdown = '[Text Link](http://example.com)\n![Image](image.jpg)\n[Another](test.html)'
      const links = MarkdownEditor.extractLinks(markdown)
      
      expect(links).toHaveLength(3)
      expect(links[0].type).toBe('link')
      expect(links[0].text).toBe('Text Link')
      expect(links[0].url).toBe('http://example.com')
      expect(links[1].type).toBe('image')
    })
    
    it('should handle markdown with no links', () => {
      const markdown = 'Just plain text with no links'
      const links = MarkdownEditor.extractLinks(markdown)
      
      expect(links).toHaveLength(0)
    })
    
    it('should handle malformed links gracefully', () => {
      const markdown = '[Malformed link missing closing paren](http://example.com\n[Good link](http://test.com)'
      const links = MarkdownEditor.extractLinks(markdown)
      
      expect(links).toHaveLength(1)
      expect(links[0].text).toBe('Good link')
    })
  })
  
  describe('generateToc', () => {
    it('should generate hierarchical table of contents', () => {
      const markdown = '# Main\n## Sub 1\n### Sub Sub\n## Sub 2\n# Main 2'
      const toc = MarkdownEditor.generateToc(markdown)
      
      expect(toc).toHaveLength(2) // 2 main headings
      expect(toc[0].children).toHaveLength(2) // 2 sub headings under first main
      expect(toc[0].children[0].children).toHaveLength(1) // 1 sub-sub heading
    })
    
    it('should handle single level headings', () => {
      const markdown = '## Heading 1\n## Heading 2\n## Heading 3'
      const toc = MarkdownEditor.generateToc(markdown)
      
      expect(toc).toHaveLength(3)
      toc.forEach(item => {
        expect(item.level).toBe(2)
        expect(item.children).toHaveLength(0)
      })
    })
    
    it('should generate empty TOC for markdown without headings', () => {
      const markdown = 'Just some text\nwith no headings'
      const toc = MarkdownEditor.generateToc(markdown)
      
      expect(toc).toHaveLength(0)
    })
  })
  
  describe('validateMarkdown', () => {
    it('should validate correct markdown', () => {
      const markdown = '# Title\n\n**Bold** and *italic* with [link](url)'
      const result = MarkdownEditor.validateMarkdown(markdown)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should detect unmatched formatting', () => {
      const markdown = '**Bold without closing\n*italic without closing'
      const result = MarkdownEditor.validateMarkdown(markdown)
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.message.includes('bold'))).toBe(true)
      expect(result.warnings.some(w => w.message.includes('italic'))).toBe(true)
    })
    
    it('should detect malformed links', () => {
      const markdown = '[Malformed link](missing closing paren'
      const result = MarkdownEditor.validateMarkdown(markdown)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('Malformed link'))).toBe(true)
    })
    
    it('should detect dangerous URLs', () => {
      const markdown = '[Dangerous](javascript:alert(1))'
      const result = MarkdownEditor.validateMarkdown(markdown)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('dangerous'))).toBe(true)
    })
    
    it('should warn about empty links', () => {
      const markdown = '[]()'
      const result = MarkdownEditor.validateMarkdown(markdown)
      
      expect(result.warnings.some(w => w.message.includes('Empty link'))).toBe(true)
    })
  })
  
  describe('formatMarkdown', () => {
    it('should format markdown with proper indentation', () => {
      const markdown = '*   Item 1\n *  Item 2\n  * Item 3'
      const formatted = MarkdownEditor.formatMarkdown(markdown, { indentSize: 2 })
      
      expect(formatted).toContain('* Item 1')
      expect(formatted).toContain('* Item 2')
      expect(formatted).toContain('* Item 3')
    })
    
    it('should trim trailing whitespace', () => {
      const markdown = 'Line with spaces    \nAnother line   '
      const formatted = MarkdownEditor.formatMarkdown(markdown, { trimWhitespace: true })
      
      expect(formatted).not.toMatch(/\s+\n/)
      expect(formatted).not.toMatch(/\s+$/)
    })
    
    it('should wrap long lines', () => {
      const longLine = 'This is a very long line that should be wrapped when it exceeds the maximum line length setting for better readability'
      const formatted = MarkdownEditor.formatMarkdown(longLine, { maxLineLength: 50 })
      
      const lines = formatted.split('\n')
      expect(lines.length).toBeGreaterThan(1)
      expect(lines[0].length).toBeLessThanOrEqual(50)
    })
    
    it('should preserve code blocks during formatting', () => {
      const markdown = '```\nThis is a very long line in a code block that should not be wrapped regardless of line length settings\n```'
      const formatted = MarkdownEditor.formatMarkdown(markdown, { maxLineLength: 20 })
      
      expect(formatted).toContain('very long line in a code block')
    })
  })
  
  describe('getStatistics', () => {
    it('should calculate comprehensive statistics', () => {
      const markdown = '# Title\n\nParagraph one.\n\nParagraph two! Question?\n\n## Subtitle\n\n[Link](url) and ![image](src)\n\n```\ncode block\n```'
      const stats = MarkdownEditor.getStatistics(markdown)
      
      expect(stats.characters).toBeGreaterThan(0)
      expect(stats.words).toBeGreaterThan(0)
      expect(stats.sentences).toBe(2) // "Paragraph one." and "Question?"
      expect(stats.paragraphs).toBeGreaterThan(1)
      expect(stats.headings.h1).toBe(1)
      expect(stats.headings.h2).toBe(1)
      expect(stats.links).toBe(1)
      expect(stats.images).toBe(1)
      expect(stats.codeBlocks).toBe(1)
      expect(stats.readingTime).toBeGreaterThan(0)
    })
    
    it('should handle empty markdown', () => {
      const stats = MarkdownEditor.getStatistics('')
      
      expect(stats.characters).toBe(0)
      expect(stats.words).toBe(0)
      expect(stats.sentences).toBe(0)
      expect(stats.paragraphs).toBe(0)
      expect(stats.links).toBe(0)
      expect(stats.images).toBe(0)
      expect(stats.codeBlocks).toBe(0)
    })
  })
  
  describe('convertToPlainText', () => {
    it('should convert markdown to plain text', () => {
      const markdown = '# Title\n\n**Bold** and *italic* with [link](url) and `code`'
      const plainText = MarkdownEditor.convertToPlainText(markdown)
      
      expect(plainText).toContain('Title')
      expect(plainText).toContain('Bold and italic')
      expect(plainText).toContain('link')
      expect(plainText).toContain('code')
      expect(plainText).not.toContain('#')
      expect(plainText).not.toContain('**')
      expect(plainText).not.toContain('[')
      expect(plainText).not.toContain(']')
    })
    
    it('should remove front matter', () => {
      const markdown = '---\ntitle: Test\n---\n\n# Content'
      const plainText = MarkdownEditor.convertToPlainText(markdown)
      
      expect(plainText).not.toContain('---')
      expect(plainText).not.toContain('title: Test')
      expect(plainText).toContain('Content')
    })
    
    it('should handle code blocks', () => {
      const markdown = '```javascript\nconsole.log("hello");\n```\n\nRegular text'
      const plainText = MarkdownEditor.convertToPlainText(markdown)
      
      expect(plainText).toContain('[CODE BLOCK]')
      expect(plainText).toContain('Regular text')
      expect(plainText).not.toContain('```')
    })
  })
  
  describe('addTableOfContents', () => {
    it('should add TOC at the top', () => {
      const markdown = '# Main\n## Sub 1\n## Sub 2'
      const withToc = MarkdownEditor.addTableOfContents(markdown, { position: 'top' })
      
      expect(withToc).toStartWith('## Table of Contents')
      expect(withToc).toContain('- [Main](#main)')
      expect(withToc).toContain('  - [Sub 1](#sub-1)')
      expect(withToc).toContain('  - [Sub 2](#sub-2)')
    })
    
    it('should add TOC after title', () => {
      const markdown = '# Main Title\n\n## Section 1\n## Section 2'
      const withToc = MarkdownEditor.addTableOfContents(markdown, { 
        position: 'after-title',
        title: '## Contents'
      })
      
      const lines = withToc.split('\n')
      const mainTitleIndex = lines.findIndex(line => line === '# Main Title')
      const tocIndex = lines.findIndex(line => line === '## Contents')
      
      expect(tocIndex).toBeGreaterThan(mainTitleIndex)
    })
    
    it('should respect max depth setting', () => {
      const markdown = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
      const withToc = MarkdownEditor.addTableOfContents(markdown, { maxDepth: 3 })
      
      expect(withToc).toContain('[H3]')
      expect(withToc).not.toContain('[H4]')
      expect(withToc).not.toContain('[H5]')
      expect(withToc).not.toContain('[H6]')
    })
  })
  
  describe('preview', () => {
    it('should generate HTML preview', () => {
      const markdown = '# Title\n\nContent with [link](page.html)'
      const preview = MarkdownEditor.preview(markdown)
      
      expect(preview).toContain('<h1')
      expect(preview).toContain('Title')
      expect(preview).toContain('<a href="page.html"')
    })
    
    it('should make relative URLs absolute', () => {
      const markdown = '[Link](page.html) and ![Image](image.jpg)'
      const preview = MarkdownEditor.preview(markdown, { baseUrl: 'https://example.com' })
      
      expect(preview).toContain('href="https://example.com/page.html"')
      expect(preview).toContain('src="https://example.com/image.jpg"')
    })
    
    it('should sanitize dangerous content', () => {
      const markdown = '<script>alert("xss")</script>\n\n[Link](javascript:alert(1))'
      const preview = MarkdownEditor.preview(markdown, { sanitize: true })
      
      expect(preview).not.toContain('<script>')
      expect(preview).not.toContain('javascript:')
    })
    
    it('should preserve safe content when sanitizing', () => {
      const markdown = '# Safe Title\n\n**Bold text** and [safe link](https://example.com)'
      const preview = MarkdownEditor.preview(markdown, { sanitize: true })
      
      expect(preview).toContain('<h1')
      expect(preview).toContain('<strong>')
      expect(preview).toContain('href="https://example.com"')
    })
  })
  
  describe('performance tests', () => {
    it('should parse large markdown files efficiently', async () => {
      const largeMarkdown = '# Section\n\nContent paragraph.\n\n'.repeat(1000)
      
      const { duration } = await perfUtils.measure(() => {
        MarkdownEditor.parseMarkdown(largeMarkdown)
      })
      
      expect(duration).toBeLessThan(2000) // Less than 2 seconds
    })
    
    it('should handle complex markdown with many elements', async () => {
      const complexMarkdown = Array.from({ length: 100 }, (_, i) => 
        `## Heading ${i}\n\n**Bold** *italic* \`code\` [link](url${i}) ![img](img${i}.jpg)\n\n\`\`\`\ncode block ${i}\n\`\`\``
      ).join('\n\n')
      
      const { duration } = await perfUtils.measure(() => {
        MarkdownEditor.parseMarkdown(complexMarkdown)
      })
      
      expect(duration).toBeLessThan(3000)
    })
    
    it('should maintain performance under stress', async () => {
      const testFn = () => {
        const md = generators.text.markdown()
        MarkdownEditor.parseMarkdown(md)
        MarkdownEditor.getStatistics(md)
        MarkdownEditor.validateMarkdown(md)
      }
      
      const results = await perfUtils.stressTest(testFn, 100)
      expect(results.success).toBe(100)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(100)
    })
  })
  
  describe('security tests', () => {
    it('should handle XSS attempts safely', () => {
      const xssAttempts = [
        security.xss.basic,
        security.xss.img,
        security.xss.javascript,
        security.xss.svg
      ]
      
      xssAttempts.forEach(xss => {
        expect(() => MarkdownEditor.parseMarkdown(xss)).not.toThrow()
        const result = MarkdownEditor.parseMarkdown(xss)
        expect(result.html).toBeDefined()
        
        // Preview should sanitize
        const preview = MarkdownEditor.preview(xss, { sanitize: true })
        expect(preview).not.toContain('<script>')
      })
    })
    
    it('should detect dangerous URLs in validation', () => {
      const dangerousUrls = [
        '[Link](javascript:alert(1))',
        '[Link](data:text/html,<script>alert(1)</script>)',
        '[Link](vbscript:msgbox(1))'
      ]
      
      dangerousUrls.forEach(md => {
        const result = MarkdownEditor.validateMarkdown(md)
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.message.includes('dangerous'))).toBe(true)
      })
    })
    
    it('should handle malicious front matter', () => {
      const maliciousFrontMatter = '---\n__proto__: malicious\nconstructor: hack\n---\n\n# Content'
      
      const result = MarkdownEditor.parseMarkdown(maliciousFrontMatter)
      expect(result.metadata['__proto__']).toBe('malicious') // Stored as string, not executed
      expect((Object.prototype as any).malicious).toBeUndefined()
    })
    
    it('should sanitize HTML in preview mode', () => {
      const maliciousHtml = '<img src="x" onerror="alert(1)">\n<a href="javascript:alert(1)">Click</a>'
      const preview = MarkdownEditor.preview(maliciousHtml, { sanitize: true })
      
      expect(preview).not.toContain('onerror')
      expect(preview).not.toContain('javascript:')
    })
    
    it('should handle extremely nested markdown', () => {
      const deepNesting = '*'.repeat(100) + 'text' + '*'.repeat(100)
      
      expect(() => MarkdownEditor.parseMarkdown(deepNesting)).not.toThrow()
      const result = MarkdownEditor.parseMarkdown(deepNesting)
      expect(result.html).toBeDefined()
    })
  })
  
  describe('edge cases', () => {
    it('should handle Unicode and emoji content', () => {
      const unicodeMarkdown = '# 🚀 Unicode Title\n\nContent with émojis: 👍 🌟 ✨\n\n中文测试 café naïve'
      const result = MarkdownEditor.parseMarkdown(unicodeMarkdown)
      
      expect(result.html).toContain('🚀')
      expect(result.html).toContain('👍')
      expect(result.html).toContain('中文')
      expect(result.toc[0].text).toContain('🚀')
    })
    
    it('should handle mixed line endings', () => {
      const mixedLineEndings = '# Title\r\nParagraph 1\rParagraph 2\n\nEnd'
      const result = MarkdownEditor.parseMarkdown(mixedLineEndings)
      
      expect(result.html).toContain('<h1>')
      expect(result.html).toContain('<p>')
    })
    
    it('should handle empty headings', () => {
      const emptyHeadings = '# \n## \n### Actual heading'
      const result = MarkdownEditor.parseMarkdown(emptyHeadings)
      
      expect(result.toc).toHaveLength(1)
      expect(result.toc[0].text).toBe('Actual heading')
    })
    
    it('should handle malformed code blocks', () => {
      const malformedCode = '```javascript\nconsole.log("hello")\n// Missing closing backticks'
      const result = MarkdownEditor.parseMarkdown(malformedCode)
      
      expect(result.html).toBeDefined()
    })
    
    it('should handle nested formatting', () => {
      const nested = '**bold with *italic* inside** and *italic with **bold** inside*'
      const result = MarkdownEditor.parseMarkdown(nested)
      
      expect(result.html).toContain('<strong>')
      expect(result.html).toContain('<em>')
    })
    
    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000)
      const markdown = `[Link](${longUrl})`
      
      expect(() => MarkdownEditor.parseMarkdown(markdown)).not.toThrow()
      const result = MarkdownEditor.parseMarkdown(markdown)
      expect(result.html).toContain('href=')
    })
    
    it('should handle markdown without paragraphs', () => {
      const singleLine = '# Title'
      const result = MarkdownEditor.parseMarkdown(singleLine)
      
      expect(result.statistics.paragraphs).toBe(0)
      expect(result.html).toContain('<h1>')
    })
    
    it('should handle consecutive formatting markers', () => {
      const consecutive = '****double bold****'
      const result = MarkdownEditor.parseMarkdown(consecutive)
      
      expect(result.html).toBeDefined()
    })
  })
})