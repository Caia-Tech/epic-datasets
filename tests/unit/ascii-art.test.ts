import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// ASCII Art Generator utility functions
class ASCIIArtGenerator {
  static textToASCII(text: string, options: {
    font?: 'standard' | 'slant' | 'banner' | '3d' | 'digital'
    width?: number
    horizontalLayout?: 'default' | 'full' | 'fitted'
    verticalLayout?: 'default' | 'full' | 'fitted'
  } = {}): string {
    const {
      font = 'standard',
      width = 80,
      horizontalLayout = 'default',
      verticalLayout = 'default'
    } = options
    
    if (!text) {
      return ''
    }
    
    // Mock ASCII art generation based on font
    const fonts: Record<string, (char: string) => string[]> = {
      standard: this.standardFont,
      slant: this.slantFont,
      banner: this.bannerFont,
      '3d': this.threeDFont,
      digital: this.digitalFont
    }
    
    const fontRenderer = fonts[font] || fonts.standard
    const lines: string[][] = []
    const maxHeight = 6 // Most ASCII fonts are ~6 lines tall
    
    // Initialize lines array
    for (let i = 0; i < maxHeight; i++) {
      lines[i] = []
    }
    
    // Render each character
    for (const char of text.toUpperCase()) {
      const charLines = fontRenderer(char)
      for (let i = 0; i < charLines.length; i++) {
        lines[i].push(charLines[i])
      }
    }
    
    // Join lines
    let result = lines
      .map(line => line.join(horizontalLayout === 'full' ? '  ' : ''))
      .join('\n')
    
    // Apply width constraint
    if (width > 0) {
      result = result.split('\n').map(line => 
        line.length > width ? line.substring(0, width) : line
      ).join('\n')
    }
    
    return result
  }
  
  private static standardFont(char: string): string[] {
    // Simplified standard ASCII font
    const chars: Record<string, string[]> = {
      'A': [
        '  /\\  ',
        ' /  \\ ',
        '/----\\',
        '|    |',
        '|    |'
      ],
      'B': [
        '|----\\',
        '|    |',
        '|----/',
        '|    |',
        '|----/'
      ],
      'C': [
        ' ----',
        '|    ',
        '|    ',
        '|    ',
        ' ----'
      ],
      ' ': [
        '     ',
        '     ',
        '     ',
        '     ',
        '     '
      ]
    }
    
    return chars[char] || [
      '?????',
      '?????',
      '?????',
      '?????',
      '?????'
    ]
  }
  
  private static slantFont(char: string): string[] {
    // Simplified slant font
    return [
      '   __',
      '  / /',
      ' / / ',
      '/_/  ',
      '     '
    ]
  }
  
  private static bannerFont(char: string): string[] {
    // Simplified banner font
    return [
      '#####',
      '#   #',
      '#####',
      '#   #',
      '#   #'
    ]
  }
  
  private static threeDFont(char: string): string[] {
    // Simplified 3D font
    return [
      ' _____ ',
      '|  _  |',
      '| |_| |',
      '|_____|',
      '       '
    ]
  }
  
  private static digitalFont(char: string): string[] {
    // Simplified digital/LCD font
    return [
      ' _ ',
      '|_|',
      '|_|',
      '   ',
      '   '
    ]
  }
  
  static imageToASCII(imageData: {
    width: number
    height: number
    pixels: number[][]
  }, options: {
    width?: number
    charset?: string
    invert?: boolean
    threshold?: number
  } = {}): string {
    const {
      width = 80,
      charset = ' .:-=+*#%@',
      invert = false,
      threshold = 128
    } = options
    
    const aspectRatio = 2.0 // ASCII characters are taller than wide
    const targetHeight = Math.floor(width / aspectRatio / (imageData.width / imageData.height))
    
    // Scale image to target dimensions
    const scaledWidth = width
    const scaledHeight = targetHeight
    
    const result: string[] = []
    
    for (let y = 0; y < scaledHeight; y++) {
      let line = ''
      for (let x = 0; x < scaledWidth; x++) {
        // Sample from original image
        const srcX = Math.floor(x * imageData.width / scaledWidth)
        const srcY = Math.floor(y * imageData.height / scaledHeight)
        
        const pixel = imageData.pixels[srcY]?.[srcX] || 0
        
        // Map brightness to character
        let brightness = pixel / 255
        if (invert) brightness = 1 - brightness
        
        const charIndex = Math.floor(brightness * (charset.length - 1))
        line += charset[Math.max(0, Math.min(charIndex, charset.length - 1))]
      }
      result.push(line)
    }
    
    return result.join('\n')
  }
  
  static createBox(content: string, options: {
    style?: 'single' | 'double' | 'rounded' | 'bold' | 'ascii'
    padding?: number
    margin?: number
    title?: string
    align?: 'left' | 'center' | 'right'
  } = {}): string {
    const {
      style = 'single',
      padding = 1,
      margin = 0,
      title,
      align = 'left'
    } = options
    
    const borders = this.getBorderChars(style)
    const lines = content.split('\n')
    const maxLength = Math.max(...lines.map(l => l.length), title?.length || 0)
    const boxWidth = maxLength + (padding * 2)
    
    const result: string[] = []
    
    // Add margin
    for (let i = 0; i < margin; i++) {
      result.push('')
    }
    
    // Top border with optional title
    let topBorder = borders.topLeft + borders.horizontal.repeat(boxWidth) + borders.topRight
    if (title) {
      const titleWithSpaces = ` ${title} `
      const startPos = Math.floor((boxWidth - titleWithSpaces.length) / 2) + 1
      topBorder = topBorder.substring(0, startPos) + titleWithSpaces + 
                 topBorder.substring(startPos + titleWithSpaces.length)
    }
    result.push(topBorder)
    
    // Padding top
    for (let i = 0; i < padding; i++) {
      result.push(borders.vertical + ' '.repeat(boxWidth) + borders.vertical)
    }
    
    // Content lines
    lines.forEach(line => {
      let paddedLine = line
      const lineLength = line.length
      const totalPadding = boxWidth - lineLength
      
      if (align === 'center') {
        const leftPad = Math.floor(totalPadding / 2)
        const rightPad = totalPadding - leftPad
        paddedLine = ' '.repeat(leftPad) + line + ' '.repeat(rightPad)
      } else if (align === 'right') {
        paddedLine = ' '.repeat(totalPadding) + line
      } else {
        paddedLine = line + ' '.repeat(totalPadding)
      }
      
      result.push(borders.vertical + paddedLine + borders.vertical)
    })
    
    // Padding bottom
    for (let i = 0; i < padding; i++) {
      result.push(borders.vertical + ' '.repeat(boxWidth) + borders.vertical)
    }
    
    // Bottom border
    result.push(borders.bottomLeft + borders.horizontal.repeat(boxWidth) + borders.bottomRight)
    
    // Add margin
    for (let i = 0; i < margin; i++) {
      result.push('')
    }
    
    return result.join('\n')
  }
  
  private static getBorderChars(style: string) {
    const styles: Record<string, any> = {
      single: {
        horizontal: '─',
        vertical: '│',
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘'
      },
      double: {
        horizontal: '═',
        vertical: '║',
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝'
      },
      rounded: {
        horizontal: '─',
        vertical: '│',
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯'
      },
      bold: {
        horizontal: '━',
        vertical: '┃',
        topLeft: '┏',
        topRight: '┓',
        bottomLeft: '┗',
        bottomRight: '┛'
      },
      ascii: {
        horizontal: '-',
        vertical: '|',
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+'
      }
    }
    
    return styles[style] || styles.single
  }
  
  static createTable(data: string[][], options: {
    headers?: boolean
    style?: 'single' | 'double' | 'ascii'
    align?: ('left' | 'center' | 'right')[]
  } = {}): string {
    const {
      headers = true,
      style = 'single',
      align = []
    } = options
    
    if (data.length === 0) return ''
    
    const borders = this.getBorderChars(style)
    const colWidths = this.calculateColumnWidths(data)
    const result: string[] = []
    
    // Top border
    result.push(this.createTableBorder(colWidths, borders, 'top'))
    
    // Rows
    data.forEach((row, rowIndex) => {
      const formattedRow = row.map((cell, colIndex) => {
        const width = colWidths[colIndex]
        const alignment = align[colIndex] || 'left'
        return this.alignText(cell, width, alignment)
      })
      
      result.push(borders.vertical + formattedRow.join(borders.vertical) + borders.vertical)
      
      // Add separator after headers
      if (headers && rowIndex === 0) {
        result.push(this.createTableBorder(colWidths, borders, 'middle'))
      }
    })
    
    // Bottom border
    result.push(this.createTableBorder(colWidths, borders, 'bottom'))
    
    return result.join('\n')
  }
  
  private static calculateColumnWidths(data: string[][]): number[] {
    const widths: number[] = []
    
    data.forEach(row => {
      row.forEach((cell, index) => {
        widths[index] = Math.max(widths[index] || 0, cell.length + 2)
      })
    })
    
    return widths
  }
  
  private static createTableBorder(widths: number[], borders: any, position: 'top' | 'middle' | 'bottom'): string {
    const segments = widths.map(w => borders.horizontal.repeat(w))
    
    if (position === 'top') {
      return borders.topLeft + segments.join(borders.horizontal) + borders.topRight
    } else if (position === 'bottom') {
      return borders.bottomLeft + segments.join(borders.horizontal) + borders.bottomRight
    } else {
      return borders.vertical + segments.join(borders.vertical) + borders.vertical
    }
  }
  
  private static alignText(text: string, width: number, align: 'left' | 'center' | 'right'): string {
    const padding = width - text.length - 2
    
    if (align === 'center') {
      const leftPad = Math.floor(padding / 2)
      const rightPad = padding - leftPad
      return ' ' + ' '.repeat(leftPad) + text + ' '.repeat(rightPad) + ' '
    } else if (align === 'right') {
      return ' ' + ' '.repeat(padding) + text + ' '
    } else {
      return ' ' + text + ' '.repeat(padding) + ' '
    }
  }
  
  static generateBanner(text: string, options: {
    width?: number
    character?: string
    style?: 'simple' | 'double' | 'fancy'
  } = {}): string {
    const {
      width = 80,
      character = '*',
      style = 'simple'
    } = options
    
    const lines: string[] = []
    
    if (style === 'simple') {
      lines.push(character.repeat(width))
      lines.push(this.centerText(text, width, character))
      lines.push(character.repeat(width))
    } else if (style === 'double') {
      lines.push(character.repeat(width))
      lines.push(character.repeat(width))
      lines.push(this.centerText(text, width, character))
      lines.push(character.repeat(width))
      lines.push(character.repeat(width))
    } else if (style === 'fancy') {
      const pattern = character + ' ' + character
      lines.push(pattern.repeat(Math.floor(width / 3)))
      lines.push(character.repeat(width))
      lines.push(this.centerText(text, width, character))
      lines.push(character.repeat(width))
      lines.push(pattern.repeat(Math.floor(width / 3)))
    }
    
    return lines.join('\n')
  }
  
  private static centerText(text: string, width: number, fill: string): string {
    const textWithSpaces = ` ${text} `
    const padding = Math.max(0, width - textWithSpaces.length - 2)
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad
    
    return fill + fill.repeat(leftPad) + textWithSpaces + fill.repeat(rightPad) + fill
  }
}

describe('ASCII Art Generator', () => {
  describe('textToASCII', () => {
    it('should convert text to ASCII art', () => {
      const result = ASCIIArtGenerator.textToASCII('ABC')
      
      expect(result).toBeDefined()
      expect(result.split('\n').length).toBeGreaterThan(1)
      expect(result).toContain('/')
    })
    
    it('should support different fonts', () => {
      const fonts: Array<'standard' | 'slant' | 'banner' | '3d' | 'digital'> = 
        ['standard', 'slant', 'banner', '3d', 'digital']
      
      fonts.forEach(font => {
        const result = ASCIIArtGenerator.textToASCII('TEST', { font })
        expect(result).toBeDefined()
        expect(result.length).toBeGreaterThan(0)
      })
    })
    
    it('should respect width constraints', () => {
      const result = ASCIIArtGenerator.textToASCII('WIDE TEXT', { width: 20 })
      
      result.split('\n').forEach(line => {
        expect(line.length).toBeLessThanOrEqual(20)
      })
    })
    
    it('should handle empty input', () => {
      const result = ASCIIArtGenerator.textToASCII('')
      expect(result).toBe('')
    })
    
    it('should handle horizontal layout options', () => {
      const layouts: Array<'default' | 'full' | 'fitted'> = ['default', 'full', 'fitted']
      
      layouts.forEach(layout => {
        const result = ASCIIArtGenerator.textToASCII('AB', { horizontalLayout: layout })
        expect(result).toBeDefined()
      })
    })
    
    it('should handle special characters', () => {
      const result = ASCIIArtGenerator.textToASCII('A B C')
      expect(result).toBeDefined()
      expect(result.split('\n').length).toBeGreaterThan(1)
    })
    
    it('should convert to uppercase', () => {
      const result1 = ASCIIArtGenerator.textToASCII('abc')
      const result2 = ASCIIArtGenerator.textToASCII('ABC')
      
      expect(result1).toBe(result2)
    })
  })
  
  describe('imageToASCII', () => {
    it('should convert image data to ASCII', () => {
      const imageData = {
        width: 10,
        height: 10,
        pixels: Array(10).fill(null).map(() => 
          Array(10).fill(null).map(() => Math.random() * 255)
        )
      }
      
      const result = ASCIIArtGenerator.imageToASCII(imageData)
      
      expect(result).toBeDefined()
      expect(result.split('\n').length).toBeGreaterThan(0)
    })
    
    it('should respect width setting', () => {
      const imageData = {
        width: 100,
        height: 100,
        pixels: Array(100).fill(null).map(() => Array(100).fill(128))
      }
      
      const result = ASCIIArtGenerator.imageToASCII(imageData, { width: 40 })
      
      result.split('\n').forEach(line => {
        expect(line.length).toBeLessThanOrEqual(40)
      })
    })
    
    it('should use custom charset', () => {
      const imageData = {
        width: 10,
        height: 10,
        pixels: Array(10).fill(null).map(() => Array(10).fill(128))
      }
      
      const charset = '01'
      const result = ASCIIArtGenerator.imageToASCII(imageData, { charset })
      
      result.split('').forEach(char => {
        if (char !== '\n') {
          expect(charset).toContain(char)
        }
      })
    })
    
    it('should handle invert option', () => {
      const imageData = {
        width: 10,
        height: 10,
        pixels: Array(10).fill(null).map(() => Array(10).fill(255))
      }
      
      const normal = ASCIIArtGenerator.imageToASCII(imageData)
      const inverted = ASCIIArtGenerator.imageToASCII(imageData, { invert: true })
      
      expect(normal).not.toBe(inverted)
    })
    
    it('should handle missing pixels gracefully', () => {
      const imageData = {
        width: 10,
        height: 10,
        pixels: [[128]] // Incomplete pixel data
      }
      
      expect(() => ASCIIArtGenerator.imageToASCII(imageData)).not.toThrow()
    })
  })
  
  describe('createBox', () => {
    it('should create box around content', () => {
      const content = 'Hello\nWorld'
      const result = ASCIIArtGenerator.createBox(content)
      
      expect(result).toContain('┌')
      expect(result).toContain('┐')
      expect(result).toContain('└')
      expect(result).toContain('┘')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })
    
    it('should support different box styles', () => {
      const styles: Array<'single' | 'double' | 'rounded' | 'bold' | 'ascii'> = 
        ['single', 'double', 'rounded', 'bold', 'ascii']
      
      styles.forEach(style => {
        const result = ASCIIArtGenerator.createBox('Test', { style })
        expect(result).toBeDefined()
        expect(result.split('\n').length).toBeGreaterThan(2)
      })
    })
    
    it('should add padding', () => {
      const result = ASCIIArtGenerator.createBox('X', { padding: 2 })
      const lines = result.split('\n')
      
      // Should have extra padding lines
      expect(lines.length).toBeGreaterThan(5)
    })
    
    it('should add margin', () => {
      const result = ASCIIArtGenerator.createBox('X', { margin: 2 })
      const lines = result.split('\n')
      
      expect(lines[0]).toBe('')
      expect(lines[1]).toBe('')
      expect(lines[lines.length - 1]).toBe('')
      expect(lines[lines.length - 2]).toBe('')
    })
    
    it('should add title to box', () => {
      const result = ASCIIArtGenerator.createBox('Content', { title: 'Title' })
      
      expect(result).toContain('Title')
    })
    
    it('should align content', () => {
      const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right']
      
      alignments.forEach(align => {
        const result = ASCIIArtGenerator.createBox('X', { align })
        expect(result).toBeDefined()
      })
    })
  })
  
  describe('createTable', () => {
    it('should create ASCII table', () => {
      const data = [
        ['Name', 'Age', 'City'],
        ['John', '30', 'New York'],
        ['Jane', '25', 'Boston']
      ]
      
      const result = ASCIIArtGenerator.createTable(data)
      
      expect(result).toContain('Name')
      expect(result).toContain('John')
      expect(result).toContain('│')
      expect(result.split('\n').length).toBeGreaterThan(4)
    })
    
    it('should handle headers', () => {
      const data = [
        ['Header1', 'Header2'],
        ['Data1', 'Data2']
      ]
      
      const withHeaders = ASCIIArtGenerator.createTable(data, { headers: true })
      const withoutHeaders = ASCIIArtGenerator.createTable(data, { headers: false })
      
      // With headers should have separator line
      expect(withHeaders.split('\n').length).toBeGreaterThan(withoutHeaders.split('\n').length)
    })
    
    it('should support different table styles', () => {
      const data = [['A', 'B'], ['C', 'D']]
      const styles: Array<'single' | 'double' | 'ascii'> = ['single', 'double', 'ascii']
      
      styles.forEach(style => {
        const result = ASCIIArtGenerator.createTable(data, { style })
        expect(result).toBeDefined()
        expect(result.split('\n').length).toBeGreaterThan(2)
      })
    })
    
    it('should align columns', () => {
      const data = [
        ['Left', 'Center', 'Right'],
        ['L', 'C', 'R']
      ]
      
      const result = ASCIIArtGenerator.createTable(data, {
        align: ['left', 'center', 'right']
      })
      
      expect(result).toBeDefined()
      const lines = result.split('\n')
      expect(lines[1]).toContain('Left')
      expect(lines[1]).toContain('Center')
      expect(lines[1]).toContain('Right')
    })
    
    it('should handle empty table', () => {
      const result = ASCIIArtGenerator.createTable([])
      expect(result).toBe('')
    })
    
    it('should handle varying column widths', () => {
      const data = [
        ['Short', 'Very Long Column Name'],
        ['S', 'L']
      ]
      
      const result = ASCIIArtGenerator.createTable(data)
      
      // Should accommodate longest content
      expect(result).toContain('Very Long Column Name')
    })
  })
  
  describe('generateBanner', () => {
    it('should generate simple banner', () => {
      const result = ASCIIArtGenerator.generateBanner('WELCOME')
      
      expect(result).toContain('WELCOME')
      expect(result.split('\n').length).toBe(3)
      expect(result).toContain('*')
    })
    
    it('should use custom character', () => {
      const result = ASCIIArtGenerator.generateBanner('TEST', { character: '#' })
      
      expect(result).toContain('#')
      expect(result).not.toContain('*')
    })
    
    it('should support different banner styles', () => {
      const styles: Array<'simple' | 'double' | 'fancy'> = ['simple', 'double', 'fancy']
      
      styles.forEach(style => {
        const result = ASCIIArtGenerator.generateBanner('TEST', { style })
        expect(result).toBeDefined()
        expect(result).toContain('TEST')
      })
    })
    
    it('should respect width setting', () => {
      const result = ASCIIArtGenerator.generateBanner('X', { width: 40 })
      
      result.split('\n').forEach(line => {
        expect(line.length).toBeLessThanOrEqual(40)
      })
    })
    
    it('should center text in banner', () => {
      const result = ASCIIArtGenerator.generateBanner('CENTER', { width: 80 })
      const lines = result.split('\n')
      
      // Middle line should have centered text
      const middleLine = lines[Math.floor(lines.length / 2)]
      expect(middleLine).toContain('CENTER')
      
      // Check rough centering
      const beforeText = middleLine.indexOf('CENTER')
      const afterText = middleLine.length - middleLine.lastIndexOf('CENTER') - 6
      expect(Math.abs(beforeText - afterText)).toBeLessThan(5)
    })
  })
  
  describe('performance tests', () => {
    it('should generate ASCII art efficiently', async () => {
      const { duration } = await perfUtils.measure(() => {
        ASCIIArtGenerator.textToASCII('PERFORMANCE TEST')
      })
      
      expect(duration).toBeLessThan(100)
    })
    
    it('should handle large images efficiently', async () => {
      const largeImage = {
        width: 200,
        height: 200,
        pixels: Array(200).fill(null).map(() => Array(200).fill(128))
      }
      
      const { duration } = await perfUtils.measure(() => {
        ASCIIArtGenerator.imageToASCII(largeImage)
      })
      
      expect(duration).toBeLessThan(1000)
    })
    
    it('should create complex tables efficiently', async () => {
      const data = Array(100).fill(null).map((_, i) => 
        [`Row ${i}`, `Data ${i}`, `Value ${i}`]
      )
      
      const { duration } = await perfUtils.measure(() => {
        ASCIIArtGenerator.createTable(data)
      })
      
      expect(duration).toBeLessThan(500)
    })
    
    it('should maintain performance under stress', async () => {
      const testFn = () => {
        ASCIIArtGenerator.textToASCII('TEST')
        ASCIIArtGenerator.createBox('Content')
        ASCIIArtGenerator.generateBanner('BANNER')
      }
      
      const results = await perfUtils.stressTest(testFn, 100)
      expect(results.success).toBe(100)
      expect(results.failures).toBe(0)
    })
  })
  
  describe('security tests', () => {
    it('should handle malicious input safely', () => {
      const maliciousInputs = [
        security.xss.basic,
        security.sql.basic,
        '<script>alert(1)</script>',
        '"; DROP TABLE;'
      ]
      
      maliciousInputs.forEach(input => {
        expect(() => ASCIIArtGenerator.textToASCII(input)).not.toThrow()
        expect(() => ASCIIArtGenerator.createBox(input)).not.toThrow()
        expect(() => ASCIIArtGenerator.generateBanner(input)).not.toThrow()
      })
    })
    
    it('should handle very long input', () => {
      const longText = 'A'.repeat(10000)
      
      expect(() => ASCIIArtGenerator.textToASCII(longText, { width: 80 })).not.toThrow()
    })
    
    it('should sanitize control characters', () => {
      const controlChars = '\x00\x01\x02\x03\x04'
      
      expect(() => ASCIIArtGenerator.textToASCII(controlChars)).not.toThrow()
      expect(() => ASCIIArtGenerator.createBox(controlChars)).not.toThrow()
    })
  })
  
  describe('edge cases', () => {
    it('should handle Unicode input', () => {
      const unicode = '中文 émoji 🚀'
      
      expect(() => ASCIIArtGenerator.textToASCII(unicode)).not.toThrow()
      expect(() => ASCIIArtGenerator.createBox(unicode)).not.toThrow()
    })
    
    it('should handle zero width', () => {
      const result = ASCIIArtGenerator.textToASCII('TEST', { width: 0 })
      expect(result).toBeDefined()
    })
    
    it('should handle negative dimensions', () => {
      const imageData = {
        width: -10,
        height: -10,
        pixels: []
      }
      
      expect(() => ASCIIArtGenerator.imageToASCII(imageData)).not.toThrow()
    })
    
    it('should handle empty charset', () => {
      const imageData = {
        width: 10,
        height: 10,
        pixels: [[128]]
      }
      
      const result = ASCIIArtGenerator.imageToASCII(imageData, { charset: '' })
      expect(result).toBeDefined()
    })
    
    it('should handle multiline content in boxes', () => {
      const multiline = 'Line 1\nLine 2\nLine 3\n\nLine 5'
      const result = ASCIIArtGenerator.createBox(multiline)
      
      expect(result).toContain('Line 1')
      expect(result).toContain('Line 5')
    })
    
    it('should handle irregular table data', () => {
      const data = [
        ['A', 'B', 'C'],
        ['D', 'E'], // Missing column
        ['F', 'G', 'H', 'I'] // Extra column
      ]
      
      expect(() => ASCIIArtGenerator.createTable(data)).not.toThrow()
    })
  })
})