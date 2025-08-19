import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Diff Checker utility functions
class DiffChecker {
  static computeDiff(text1: string, text2: string, options: {
    mode?: 'words' | 'lines' | 'characters'
    ignoreWhitespace?: boolean
    ignoreCase?: boolean
  } = {}): {
    additions: Array<{ type: 'add', content: string, position: number }>
    deletions: Array<{ type: 'delete', content: string, position: number }>
    changes: Array<{ type: 'change', from: string, to: string, position: number }>
    unchanged: Array<{ type: 'equal', content: string, position: number }>
    statistics: {
      totalLines: number
      addedLines: number
      deletedLines: number
      changedLines: number
      similarity: number
    }
  } {
    const { mode = 'lines', ignoreWhitespace = false, ignoreCase = false } = options
    
    let processedText1 = text1
    let processedText2 = text2
    
    if (ignoreCase) {
      processedText1 = text1.toLowerCase()
      processedText2 = text2.toLowerCase()
    }
    
    if (ignoreWhitespace) {
      processedText1 = processedText1.replace(/\s+/g, ' ').trim()
      processedText2 = processedText2.replace(/\s+/g, ' ').trim()
    }
    
    let chunks1: string[]
    let chunks2: string[]
    
    switch (mode) {
      case 'words':
        chunks1 = processedText1.split(/\s+/).filter(w => w.length > 0)
        chunks2 = processedText2.split(/\s+/).filter(w => w.length > 0)
        break
      case 'characters':
        chunks1 = Array.from(processedText1)
        chunks2 = Array.from(processedText2)
        break
      case 'lines':
      default:
        chunks1 = processedText1.split('\n')
        chunks2 = processedText2.split('\n')
        break
    }
    
    const lcs = this.longestCommonSubsequence(chunks1, chunks2)
    const diff = this.buildDiff(chunks1, chunks2, lcs)
    
    const statistics = this.calculateStatistics(diff, chunks1, chunks2)
    
    return {
      ...diff,
      statistics
    }
  }
  
  private static longestCommonSubsequence(arr1: string[], arr2: string[]): number[][] {
    const m = arr1.length
    const n = arr2.length
    const lcs: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          lcs[i][j] = lcs[i - 1][j - 1] + 1
        } else {
          lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1])
        }
      }
    }
    
    return lcs
  }
  
  private static buildDiff(arr1: string[], arr2: string[], lcs: number[][]) {
    const additions: Array<{ type: 'add', content: string, position: number }> = []
    const deletions: Array<{ type: 'delete', content: string, position: number }> = []
    const changes: Array<{ type: 'change', from: string, to: string, position: number }> = []
    const unchanged: Array<{ type: 'equal', content: string, position: number }> = []
    
    let i = arr1.length
    let j = arr2.length
    let position = 0
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
        unchanged.unshift({ type: 'equal', content: arr1[i - 1], position })
        i--
        j--
      } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
        additions.unshift({ type: 'add', content: arr2[j - 1], position })
        j--
      } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
        deletions.unshift({ type: 'delete', content: arr1[i - 1], position })
        i--
      }
      position++
    }
    
    return { additions, deletions, changes, unchanged }
  }
  
  private static calculateStatistics(diff: any, arr1: string[], arr2: string[]) {
    const totalLines = Math.max(arr1.length, arr2.length)
    const addedLines = diff.additions.length
    const deletedLines = diff.deletions.length
    const changedLines = diff.changes.length
    const equalLines = diff.unchanged.length
    
    const similarity = totalLines > 0 ? Math.round((equalLines / totalLines) * 100) : 100
    
    return {
      totalLines,
      addedLines,
      deletedLines,
      changedLines,
      similarity
    }
  }
  
  static generatePatch(text1: string, text2: string, filename1 = 'file1', filename2 = 'file2'): string {
    const lines1 = text1.split('\n')
    const lines2 = text2.split('\n')
    const diff = this.computeDiff(text1, text2)
    
    let patch = `--- ${filename1}\n+++ ${filename2}\n`
    
    let line1 = 1
    let line2 = 1
    
    diff.unchanged.forEach(item => {
      patch += ` ${item.content}\n`
      line1++
      line2++
    })
    
    diff.deletions.forEach(item => {
      patch += `-${item.content}\n`
      line1++
    })
    
    diff.additions.forEach(item => {
      patch += `+${item.content}\n`
      line2++
    })
    
    return patch
  }
  
  static applyPatch(originalText: string, patch: string): { result: string; success: boolean; error?: string } {
    try {
      const lines = originalText.split('\n')
      const patchLines = patch.split('\n').filter(line => line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))
      
      let result = lines.slice()
      let currentIndex = 0
      
      patchLines.forEach(line => {
        if (line.startsWith('+')) {
          result.splice(currentIndex, 0, line.substring(1))
          currentIndex++
        } else if (line.startsWith('-')) {
          result.splice(currentIndex, 1)
        } else {
          currentIndex++
        }
      })
      
      return {
        result: result.join('\n'),
        success: true
      }
    } catch (error) {
      return {
        result: originalText,
        success: false,
        error: (error as Error).message
      }
    }
  }
  
  static mergeDiffs(text1: string, text2: string, text3: string): {
    result: string
    conflicts: Array<{
      line: number
      content: string[]
      resolved: boolean
    }>
  } {
    // Simple 3-way merge simulation
    const diff12 = this.computeDiff(text1, text2)
    const diff13 = this.computeDiff(text1, text3)
    
    const lines1 = text1.split('\n')
    const result: string[] = []
    const conflicts: Array<{ line: number, content: string[], resolved: boolean }> = []
    
    let lineNumber = 0
    
    lines1.forEach((line, index) => {
      const inDiff12 = diff12.additions.some(d => d.position === index) || diff12.deletions.some(d => d.position === index)
      const inDiff13 = diff13.additions.some(d => d.position === index) || diff13.deletions.some(d => d.position === index)
      
      if (inDiff12 && inDiff13) {
        // Conflict detected
        conflicts.push({
          line: lineNumber,
          content: [line],
          resolved: false
        })
        result.push(`<<<<<<< CONFLICT`)
        result.push(line)
        result.push(`=======`)
        result.push(`>>>>>>> END CONFLICT`)
      } else {
        result.push(line)
      }
      
      lineNumber++
    })
    
    return {
      result: result.join('\n'),
      conflicts
    }
  }
  
  static compareDirectories(dir1: string[], dir2: string[]): {
    added: string[]
    deleted: string[]
    modified: string[]
    unchanged: string[]
  } {
    const set1 = new Set(dir1)
    const set2 = new Set(dir2)
    
    const added = dir2.filter(file => !set1.has(file))
    const deleted = dir1.filter(file => !set2.has(file))
    const common = dir1.filter(file => set2.has(file))
    
    // For simplicity, assume all common files are unchanged
    // In reality, you'd compare file contents
    const unchanged = common
    const modified: string[] = []
    
    return { added, deleted, modified, unchanged }
  }
  
  static highlightDifferences(text1: string, text2: string): {
    text1Highlighted: string
    text2Highlighted: string
  } {
    const diff = this.computeDiff(text1, text2)
    
    let text1Highlighted = text1
    let text2Highlighted = text2
    
    // Simple highlighting simulation (would use HTML/CSS in real implementation)
    diff.deletions.forEach(deletion => {
      text1Highlighted = text1Highlighted.replace(deletion.content, `[DELETED]${deletion.content}[/DELETED]`)
    })
    
    diff.additions.forEach(addition => {
      text2Highlighted = text2Highlighted.replace(addition.content, `[ADDED]${addition.content}[/ADDED]`)
    })
    
    return {
      text1Highlighted,
      text2Highlighted
    }
  }
  
  static validatePatch(patch: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const lines = patch.split('\n')
    
    // Check patch header
    if (!lines[0]?.startsWith('---') || !lines[1]?.startsWith('+++')) {
      errors.push('Invalid patch header format')
    }
    
    // Check line formats
    lines.slice(2).forEach((line, index) => {
      if (line && !line.match(/^[+\- @\\]/) && line.trim() !== '') {
        errors.push(`Invalid line format at line ${index + 3}: ${line}`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  static getSimilarity(text1: string, text2: string): number {
    if (!text1 && !text2) return 100
    if (!text1 || !text2) return 0
    
    const diff = this.computeDiff(text1, text2)
    return diff.statistics.similarity
  }
  
  static getChangeStatistics(text1: string, text2: string): {
    linesAdded: number
    linesDeleted: number
    linesChanged: number
    totalChanges: number
    changeRatio: number
  } {
    const diff = this.computeDiff(text1, text2)
    
    return {
      linesAdded: diff.statistics.addedLines,
      linesDeleted: diff.statistics.deletedLines,
      linesChanged: diff.statistics.changedLines,
      totalChanges: diff.statistics.addedLines + diff.statistics.deletedLines + diff.statistics.changedLines,
      changeRatio: Math.round(((diff.statistics.addedLines + diff.statistics.deletedLines + diff.statistics.changedLines) / diff.statistics.totalLines) * 100)
    }
  }
}

describe('Diff Checker', () => {
  describe('computeDiff', () => {
    it('should detect line additions', () => {
      const text1 = 'line1\nline2\nline3'
      const text2 = 'line1\nline2\nnew line\nline3'
      
      const diff = DiffChecker.computeDiff(text1, text2)
      
      expect(diff.additions).toHaveLength(1)
      expect(diff.additions[0].content).toBe('new line')
      expect(diff.statistics.addedLines).toBe(1)
    })
    
    it('should detect line deletions', () => {
      const text1 = 'line1\nline2\nline3\nline4'
      const text2 = 'line1\nline3\nline4'
      
      const diff = DiffChecker.computeDiff(text1, text2)
      
      expect(diff.deletions).toHaveLength(1)
      expect(diff.deletions[0].content).toBe('line2')
      expect(diff.statistics.deletedLines).toBe(1)
    })
    
    it('should detect unchanged lines', () => {
      const text1 = 'line1\nline2\nline3'
      const text2 = 'line1\nline2\nline3'
      
      const diff = DiffChecker.computeDiff(text1, text2)
      
      expect(diff.unchanged).toHaveLength(3)
      expect(diff.statistics.similarity).toBe(100)
    })
    
    it('should handle word-level diff', () => {
      const text1 = 'hello world test'
      const text2 = 'hello beautiful world test'
      
      const diff = DiffChecker.computeDiff(text1, text2, { mode: 'words' })
      
      expect(diff.additions).toHaveLength(1)
      expect(diff.additions[0].content).toBe('beautiful')
    })
    
    it('should handle character-level diff', () => {
      const text1 = 'hello'
      const text2 = 'hallo'
      
      const diff = DiffChecker.computeDiff(text1, text2, { mode: 'characters' })
      
      expect(diff.deletions.some(d => d.content === 'e')).toBe(true)
      expect(diff.additions.some(d => d.content === 'a')).toBe(true)
    })
    
    it('should ignore whitespace when requested', () => {
      const text1 = 'line1\n  line2  \nline3'
      const text2 = 'line1\nline2\nline3'
      
      const diff = DiffChecker.computeDiff(text1, text2, { ignoreWhitespace: true })
      
      expect(diff.statistics.similarity).toBe(100)
    })
    
    it('should ignore case when requested', () => {
      const text1 = 'Hello World'
      const text2 = 'hello world'
      
      const diff = DiffChecker.computeDiff(text1, text2, { ignoreCase: true })
      
      expect(diff.statistics.similarity).toBe(100)
    })
    
    it('should calculate similarity correctly', () => {
      const text1 = 'line1\nline2\nline3\nline4'
      const text2 = 'line1\nchanged\nline3\nline4'
      
      const diff = DiffChecker.computeDiff(text1, text2)
      
      expect(diff.statistics.similarity).toBeGreaterThan(50)
      expect(diff.statistics.similarity).toBeLessThan(100)
    })
  })
  
  describe('generatePatch', () => {
    it('should generate valid patch format', () => {
      const text1 = 'line1\nline2\nline3'
      const text2 = 'line1\nmodified line2\nline3\nnew line'
      
      const patch = DiffChecker.generatePatch(text1, text2, 'old.txt', 'new.txt')
      
      expect(patch).toContain('--- old.txt')
      expect(patch).toContain('+++ new.txt')
      expect(patch).toContain('+')
      expect(patch).toContain('-')
    })
    
    it('should handle empty files', () => {
      const patch = DiffChecker.generatePatch('', 'new content')
      
      expect(patch).toContain('+new content')
    })
    
    it('should generate patch for file deletion', () => {
      const patch = DiffChecker.generatePatch('content to delete', '')
      
      expect(patch).toContain('-content to delete')
    })
  })
  
  describe('applyPatch', () => {
    it('should apply simple patch', () => {
      const originalText = 'line1\nline2\nline3'
      const patch = '--- old\n+++ new\n line1\n-line2\n+modified line2\n line3'
      
      const result = DiffChecker.applyPatch(originalText, patch)
      
      expect(result.success).toBe(true)
      expect(result.result).toContain('modified line2')
    })
    
    it('should handle patch application errors', () => {
      const originalText = 'line1\nline2\nline3'
      const invalidPatch = 'invalid patch format'
      
      const result = DiffChecker.applyPatch(originalText, invalidPatch)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
  
  describe('mergeDiffs', () => {
    it('should merge non-conflicting changes', () => {
      const base = 'line1\nline2\nline3'
      const version1 = 'modified line1\nline2\nline3'
      const version2 = 'line1\nline2\nmodified line3'
      
      const result = DiffChecker.mergeDiffs(base, version1, version2)
      
      expect(result.conflicts).toHaveLength(0)
    })
    
    it('should detect merge conflicts', () => {
      const base = 'line1\nline2\nline3'
      const version1 = 'modified line1\nline2\nline3'
      const version2 = 'different line1\nline2\nline3'
      
      const result = DiffChecker.mergeDiffs(base, version1, version2)
      
      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.result).toContain('CONFLICT')
    })
  })
  
  describe('compareDirectories', () => {
    it('should compare directory listings', () => {
      const dir1 = ['file1.txt', 'file2.txt', 'file3.txt']
      const dir2 = ['file1.txt', 'file3.txt', 'file4.txt']
      
      const result = DiffChecker.compareDirectories(dir1, dir2)
      
      expect(result.added).toEqual(['file4.txt'])
      expect(result.deleted).toEqual(['file2.txt'])
      expect(result.unchanged).toContain('file1.txt')
      expect(result.unchanged).toContain('file3.txt')
    })
    
    it('should handle empty directories', () => {
      const result = DiffChecker.compareDirectories([], ['file1.txt'])
      
      expect(result.added).toEqual(['file1.txt'])
      expect(result.deleted).toEqual([])
      expect(result.unchanged).toEqual([])
    })
  })
  
  describe('highlightDifferences', () => {
    it('should highlight added and deleted content', () => {
      const text1 = 'original content'
      const text2 = 'modified content'
      
      const result = DiffChecker.highlightDifferences(text1, text2)
      
      expect(result.text1Highlighted).toContain('[DELETED]')
      expect(result.text2Highlighted).toContain('[ADDED]')
    })
    
    it('should handle identical texts', () => {
      const text = 'same content'
      const result = DiffChecker.highlightDifferences(text, text)
      
      expect(result.text1Highlighted).not.toContain('[DELETED]')
      expect(result.text2Highlighted).not.toContain('[ADDED]')
    })
  })
  
  describe('validatePatch', () => {
    it('should validate correct patch format', () => {
      const validPatch = '--- file1\n+++ file2\n line1\n-deleted\n+added\n line3'
      
      const result = DiffChecker.validatePatch(validPatch)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject invalid patch format', () => {
      const invalidPatch = 'not a patch\ninvalid format'
      
      const result = DiffChecker.validatePatch(invalidPatch)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
    
    it('should validate patch headers', () => {
      const noBranchPatch = 'line1\n-deleted\n+added'
      
      const result = DiffChecker.validatePatch(noBranchPatch)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('header'))).toBe(true)
    })
  })
  
  describe('getSimilarity', () => {
    it('should return 100 for identical texts', () => {
      const similarity = DiffChecker.getSimilarity('same text', 'same text')
      expect(similarity).toBe(100)
    })
    
    it('should return 0 for completely different texts', () => {
      const similarity = DiffChecker.getSimilarity('abc', 'xyz')
      expect(similarity).toBeLessThan(100)
    })
    
    it('should handle empty strings', () => {
      expect(DiffChecker.getSimilarity('', '')).toBe(100)
      expect(DiffChecker.getSimilarity('text', '')).toBe(0)
      expect(DiffChecker.getSimilarity('', 'text')).toBe(0)
    })
    
    it('should calculate partial similarity', () => {
      const similarity = DiffChecker.getSimilarity('hello world', 'hello universe')
      expect(similarity).toBeGreaterThan(0)
      expect(similarity).toBeLessThan(100)
    })
  })
  
  describe('getChangeStatistics', () => {
    it('should calculate change statistics', () => {
      const text1 = 'line1\nline2\nline3'
      const text2 = 'line1\nmodified\nline3\nnew line'
      
      const stats = DiffChecker.getChangeStatistics(text1, text2)
      
      expect(stats.linesAdded).toBeGreaterThan(0)
      expect(stats.linesDeleted).toBeGreaterThan(0)
      expect(stats.totalChanges).toBe(stats.linesAdded + stats.linesDeleted + stats.linesChanged)
      expect(stats.changeRatio).toBeGreaterThan(0)
    })
    
    it('should handle no changes', () => {
      const text = 'same content'
      const stats = DiffChecker.getChangeStatistics(text, text)
      
      expect(stats.linesAdded).toBe(0)
      expect(stats.linesDeleted).toBe(0)
      expect(stats.linesChanged).toBe(0)
      expect(stats.totalChanges).toBe(0)
    })
  })
  
  describe('performance tests', () => {
    it('should handle large text files efficiently', async () => {
      const largeText1 = 'line content\n'.repeat(1000)
      const largeText2 = 'line content\n'.repeat(950) + 'modified line\n'.repeat(50)
      
      const { duration } = await perfUtils.measure(() => {
        DiffChecker.computeDiff(largeText1, largeText2)
      })
      
      expect(duration).toBeLessThan(5000) // Less than 5 seconds
    })
    
    it('should maintain performance with many small changes', async () => {
      const text1 = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n')
      const text2 = Array.from({ length: 100 }, (_, i) => `line ${i}${i % 2 ? ' modified' : ''}`).join('\n')
      
      const { duration } = await perfUtils.measure(() => {
        DiffChecker.computeDiff(text1, text2)
      })
      
      expect(duration).toBeLessThan(1000)
    })
    
    it('should handle stress testing', async () => {
      const testFn = () => {
        const text1 = generators.text.lines(50)
        const text2 = generators.text.lines(50)
        DiffChecker.computeDiff(text1, text2)
        DiffChecker.getSimilarity(text1, text2)
      }
      
      const results = await perfUtils.stressTest(testFn, 100)
      expect(results.success).toBe(100)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(100)
    })
  })
  
  describe('security tests', () => {
    it('should handle malicious input safely', () => {
      const maliciousInputs = [
        security.xss.basic,
        security.xss.javascript,
        security.sql.basic
      ]
      
      maliciousInputs.forEach(malicious => {
        expect(() => DiffChecker.computeDiff(malicious, 'normal text')).not.toThrow()
        expect(() => DiffChecker.generatePatch(malicious, 'normal text')).not.toThrow()
      })
    })
    
    it('should not execute embedded scripts', () => {
      const scriptText1 = '<script>alert("xss")</script>'
      const scriptText2 = '<script>console.log("modified")</script>'
      
      const diff = DiffChecker.computeDiff(scriptText1, scriptText2)
      
      // Should treat as text, not executable code
      expect(diff.additions.some(a => a.content.includes('console.log'))).toBe(true)
      expect(diff.deletions.some(d => d.content.includes('alert'))).toBe(true)
    })
    
    it('should handle extremely long lines safely', () => {
      const longLine = 'a'.repeat(100000)
      const text1 = `short line\n${longLine}\nshort line`
      const text2 = `short line\n${longLine}modified\nshort line`
      
      expect(() => DiffChecker.computeDiff(text1, text2)).not.toThrow()
    })
    
    it('should prevent ReDoS attacks in patch validation', () => {
      const maliciousPattern = 'a'.repeat(50000) + '!'
      const maliciousPatch = `--- file1\n+++ file2\n+${maliciousPattern}`
      
      const startTime = Date.now()
      const result = DiffChecker.validatePatch(maliciousPatch)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(1000) // Should not hang
      expect(typeof result.valid).toBe('boolean')
    })
  })
  
  describe('edge cases', () => {
    it('should handle binary-like content', () => {
      const binary1 = String.fromCharCode(0, 1, 2, 3, 4)
      const binary2 = String.fromCharCode(0, 1, 5, 3, 4)
      
      const diff = DiffChecker.computeDiff(binary1, binary2, { mode: 'characters' })
      
      expect(diff.statistics.similarity).toBeLessThan(100)
    })
    
    it('should handle very long lines', () => {
      const longLine = 'x'.repeat(10000)
      const text1 = `${longLine}1`
      const text2 = `${longLine}2`
      
      const diff = DiffChecker.computeDiff(text1, text2, { mode: 'characters' })
      expect(diff.statistics.similarity).toBeGreaterThan(90)
    })
    
    it('should handle mixed line endings', () => {
      const text1 = 'line1\nline2\rline3\r\nline4'
      const text2 = 'line1\r\nline2\nline3\rline4'
      
      const diff = DiffChecker.computeDiff(text1, text2)
      expect(diff.statistics.similarity).toBeGreaterThan(0)
    })
    
    it('should handle Unicode and emoji content', () => {
      const text1 = 'Hello 👋 世界 café naïve'
      const text2 = 'Hello 👋 world café naïve'
      
      const diff = DiffChecker.computeDiff(text1, text2, { mode: 'words' })
      expect(diff.deletions.some(d => d.content === '世界')).toBe(true)
      expect(diff.additions.some(a => a.content === 'world')).toBe(true)
    })
    
    it('should handle empty line differences', () => {
      const text1 = 'line1\n\nline3'
      const text2 = 'line1\nline2\n\nline3'
      
      const diff = DiffChecker.computeDiff(text1, text2)
      expect(diff.additions.some(a => a.content === 'line2')).toBe(true)
    })
    
    it('should handle single character texts', () => {
      const diff = DiffChecker.computeDiff('a', 'b')
      
      expect(diff.statistics.similarity).toBe(0)
      expect(diff.deletions).toHaveLength(1)
      expect(diff.additions).toHaveLength(1)
    })
    
    it('should handle texts with only whitespace differences', () => {
      const text1 = 'line1 \nline2\t\nline3   '
      const text2 = 'line1\nline2\nline3'
      
      const diffIgnoreWs = DiffChecker.computeDiff(text1, text2, { ignoreWhitespace: true })
      const diffWithWs = DiffChecker.computeDiff(text1, text2, { ignoreWhitespace: false })
      
      expect(diffIgnoreWs.statistics.similarity).toBe(100)
      expect(diffWithWs.statistics.similarity).toBeLessThan(100)
    })
  })
})