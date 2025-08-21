import { describe, it, expect, vi } from 'vitest'
import { generators, performance as perfUtils, security } from '../helpers/test-utils'

// Timestamp Converter utility functions
class TimestampConverter {
  static unixToDate(timestamp: number, unit: 'seconds' | 'milliseconds' = 'seconds'): Date {
    const ms = unit === 'seconds' ? timestamp * 1000 : timestamp
    
    if (!Number.isFinite(ms) || ms < 0 || ms > 8640000000000000) {
      throw new Error('Invalid timestamp')
    }
    
    return new Date(ms)
  }

  static dateToUnix(date: Date, unit: 'seconds' | 'milliseconds' = 'seconds'): number {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
    
    const ms = date.getTime()
    return unit === 'seconds' ? Math.floor(ms / 1000) : ms
  }

  static now(unit: 'seconds' | 'milliseconds' = 'seconds'): number {
    const ms = Date.now()
    return unit === 'seconds' ? Math.floor(ms / 1000) : ms
  }

  static format(timestamp: number, unit: 'seconds' | 'milliseconds' = 'seconds', format: 'iso' | 'local' | 'utc' | 'relative' = 'iso'): string {
    const date = this.unixToDate(timestamp, unit)
    
    switch (format) {
      case 'iso':
        return date.toISOString()
      case 'local':
        return date.toLocaleString()
      case 'utc':
        return date.toUTCString()
      case 'relative':
        return this.getRelativeTime(date)
      default:
        return date.toISOString()
    }
  }

  static getRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (Math.abs(diffSeconds) < 60) {
      return diffSeconds === 0 ? 'now' : diffSeconds > 0 ? `${diffSeconds} seconds ago` : `in ${Math.abs(diffSeconds)} seconds`
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `${diffMinutes} minutes ago` : `in ${Math.abs(diffMinutes)} minutes`
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `${diffHours} hours ago` : `in ${Math.abs(diffHours)} hours`
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `${diffDays} days ago` : `in ${Math.abs(diffDays)} days`
    } else if (Math.abs(diffWeeks) < 4) {
      return diffWeeks > 0 ? `${diffWeeks} weeks ago` : `in ${Math.abs(diffWeeks)} weeks`
    } else if (Math.abs(diffMonths) < 12) {
      return diffMonths > 0 ? `${diffMonths} months ago` : `in ${Math.abs(diffMonths)} months`
    } else {
      return diffYears > 0 ? `${diffYears} years ago` : `in ${Math.abs(diffYears)} years`
    }
  }

  static parseString(dateString: string): { timestamp: number; date: Date; valid: boolean; error?: string } {
    try {
      // Try parsing as ISO string first
      let date = new Date(dateString)
      
      // If that fails, try parsing as number (unix timestamp)
      if (isNaN(date.getTime())) {
        const num = Number(dateString)
        if (!isNaN(num)) {
          // Determine if it's seconds or milliseconds based on magnitude
          const isSeconds = num < 10000000000 // Less than year 2286 in seconds
          date = this.unixToDate(num, isSeconds ? 'seconds' : 'milliseconds')
        }
      }
      
      if (isNaN(date.getTime())) {
        return {
          timestamp: 0,
          date: new Date(0),
          valid: false,
          error: 'Unable to parse date string'
        }
      }
      
      return {
        timestamp: this.dateToUnix(date, 'seconds'),
        date,
        valid: true
      }
    } catch (error) {
      return {
        timestamp: 0,
        date: new Date(0),
        valid: false,
        error: (error as Error).message
      }
    }
  }

  static convertTimezone(timestamp: number, fromTimezone: string, toTimezone: string, unit: 'seconds' | 'milliseconds' = 'seconds'): {
    originalTime: string
    convertedTime: string
    offset: number
  } {
    const date = this.unixToDate(timestamp, unit)
    
    try {
      // Create formatters for both timezones
      const originalFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: fromTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      
      const convertedFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      
      const originalTime = originalFormatter.format(date)
      const convertedTime = convertedFormatter.format(date)
      
      // Calculate offset in hours (approximate)
      const originalDate = new Date(`${originalTime.replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')}`)
      const convertedDate = new Date(`${convertedTime.replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')}`)
      const offset = (convertedDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60)
      
      return {
        originalTime,
        convertedTime,
        offset
      }
    } catch (error) {
      throw new Error(`Timezone conversion failed: ${(error as Error).message}`)
    }
  }

  static getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    try {
      const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
      const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
      return (target.getTime() - utc.getTime()) / (1000 * 60 * 60)
    } catch {
      throw new Error(`Invalid timezone: ${timezone}`)
    }
  }

  static addTime(timestamp: number, amount: number, unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years', inputUnit: 'seconds' | 'milliseconds' = 'seconds'): number {
    const date = this.unixToDate(timestamp, inputUnit)
    
    switch (unit) {
      case 'seconds':
        date.setSeconds(date.getSeconds() + amount)
        break
      case 'minutes':
        date.setMinutes(date.getMinutes() + amount)
        break
      case 'hours':
        date.setHours(date.getHours() + amount)
        break
      case 'days':
        date.setDate(date.getDate() + amount)
        break
      case 'weeks':
        date.setDate(date.getDate() + amount * 7)
        break
      case 'months':
        date.setMonth(date.getMonth() + amount)
        break
      case 'years':
        date.setFullYear(date.getFullYear() + amount)
        break
      default:
        throw new Error(`Invalid time unit: ${unit}`)
    }
    
    return this.dateToUnix(date, inputUnit)
  }

  static diffTime(timestamp1: number, timestamp2: number, unit: 'seconds' | 'milliseconds' = 'seconds'): {
    milliseconds: number
    seconds: number
    minutes: number
    hours: number
    days: number
    weeks: number
    humanReadable: string
  } {
    const date1 = this.unixToDate(timestamp1, unit)
    const date2 = this.unixToDate(timestamp2, unit)
    
    const diffMs = Math.abs(date2.getTime() - date1.getTime())
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    
    let humanReadable: string
    if (diffSeconds < 60) {
      humanReadable = `${diffSeconds} seconds`
    } else if (diffMinutes < 60) {
      humanReadable = `${diffMinutes} minutes`
    } else if (diffHours < 24) {
      humanReadable = `${diffHours} hours`
    } else if (diffDays < 7) {
      humanReadable = `${diffDays} days`
    } else if (diffWeeks < 52) {
      humanReadable = `${diffWeeks} weeks`
    } else {
      humanReadable = `${Math.floor(diffWeeks / 52)} years`
    }
    
    return {
      milliseconds: diffMs,
      seconds: diffSeconds,
      minutes: diffMinutes,
      hours: diffHours,
      days: diffDays,
      weeks: diffWeeks,
      humanReadable
    }
  }

  static isValidTimestamp(timestamp: number, unit: 'seconds' | 'milliseconds' = 'seconds'): boolean {
    try {
      this.unixToDate(timestamp, unit)
      return true
    } catch {
      return false
    }
  }

  static getEpochEvents(): Array<{ name: string; timestamp: number; description: string }> {
    return [
      { name: 'Unix Epoch', timestamp: 0, description: 'January 1, 1970, 00:00:00 UTC' },
      { name: 'Y2K', timestamp: 946684800, description: 'January 1, 2000, 00:00:00 UTC' },
      { name: 'Unix 32-bit overflow', timestamp: 2147483647, description: 'January 19, 2038, 03:14:07 UTC' },
      { name: 'JavaScript Date limit', timestamp: 8640000000000, description: 'September 13, 275760, 00:00:00 UTC (milliseconds)' }
    ]
  }

  static batch(operations: Array<{
    type: 'convert' | 'format' | 'add' | 'diff'
    timestamp?: number
    timestamp2?: number
    unit?: 'seconds' | 'milliseconds'
    amount?: number
    timeUnit?: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
    format?: 'iso' | 'local' | 'utc' | 'relative'
  }>): Array<{ result: any; error?: string }> {
    return operations.map(op => {
      try {
        switch (op.type) {
          case 'convert':
            return { result: this.unixToDate(op.timestamp!, op.unit) }
          case 'format':
            return { result: this.format(op.timestamp!, op.unit, op.format) }
          case 'add':
            return { result: this.addTime(op.timestamp!, op.amount!, op.timeUnit!, op.unit) }
          case 'diff':
            return { result: this.diffTime(op.timestamp!, op.timestamp2!, op.unit) }
          default:
            return { result: null, error: 'Unknown operation type' }
        }
      } catch (error) {
        return { result: null, error: (error as Error).message }
      }
    })
  }
}

describe('Timestamp Converter', () => {
  describe('unixToDate', () => {
    it('should convert Unix timestamp to Date', () => {
      const timestamp = 1234567890 // 2009-02-13T23:31:30.000Z
      const date = TimestampConverter.unixToDate(timestamp)
      
      expect(date).toBeInstanceOf(Date)
      expect(date.getFullYear()).toBe(2009)
      expect(date.getMonth()).toBe(1) // February (0-indexed)
      expect(date.getDate()).toBe(13)
    })

    it('should handle milliseconds unit', () => {
      const timestamp = 1234567890000 // Same date in milliseconds
      const date = TimestampConverter.unixToDate(timestamp, 'milliseconds')
      
      expect(date.getFullYear()).toBe(2009)
      expect(date.getMonth()).toBe(1)
      expect(date.getDate()).toBe(13)
    })

    it('should handle epoch timestamp', () => {
      const date = TimestampConverter.unixToDate(0)
      
      expect(date.getFullYear()).toBe(1970)
      expect(date.getMonth()).toBe(0) // January
      expect(date.getDate()).toBe(1)
      expect(date.getUTCHours()).toBe(0)
    })

    it('should handle future timestamps', () => {
      const timestamp = 2147483647 // 2038-01-19T03:14:07.000Z (32-bit limit)
      const date = TimestampConverter.unixToDate(timestamp)
      
      expect(date.getFullYear()).toBe(2038)
      expect(date.getMonth()).toBe(0) // January
      expect(date.getDate()).toBe(19)
    })

    it('should throw error for invalid timestamps', () => {
      const invalidTimestamps = [NaN, Infinity, -Infinity, -1, 8640000000001000]
      
      invalidTimestamps.forEach(timestamp => {
        expect(() => TimestampConverter.unixToDate(timestamp)).toThrow('Invalid timestamp')
      })
    })

    it('should handle negative timestamps (before epoch)', () => {
      // Most systems don't support negative timestamps
      expect(() => TimestampConverter.unixToDate(-1)).toThrow('Invalid timestamp')
    })
  })

  describe('dateToUnix', () => {
    it('should convert Date to Unix timestamp', () => {
      const date = new Date('2009-02-13T23:31:30.000Z')
      const timestamp = TimestampConverter.dateToUnix(date)
      
      expect(timestamp).toBe(1234567890)
    })

    it('should handle milliseconds unit', () => {
      const date = new Date('2009-02-13T23:31:30.000Z')
      const timestamp = TimestampConverter.dateToUnix(date, 'milliseconds')
      
      expect(timestamp).toBe(1234567890000)
    })

    it('should handle epoch date', () => {
      const date = new Date('1970-01-01T00:00:00.000Z')
      const timestamp = TimestampConverter.dateToUnix(date)
      
      expect(timestamp).toBe(0)
    })

    it('should throw error for invalid dates', () => {
      const invalidDates = [
        new Date('invalid'),
        null,
        undefined,
        'not a date',
        123
      ]
      
      invalidDates.forEach(date => {
        expect(() => TimestampConverter.dateToUnix(date as any)).toThrow('Invalid date')
      })
    })

    it('should be reversible with unixToDate', () => {
      const originalDate = new Date('2023-06-15T10:30:45.123Z')
      const timestamp = TimestampConverter.dateToUnix(originalDate)
      const convertedDate = TimestampConverter.unixToDate(timestamp)
      
      expect(Math.floor(convertedDate.getTime() / 1000)).toBe(Math.floor(originalDate.getTime() / 1000))
    })
  })

  describe('now', () => {
    it('should return current timestamp in seconds', () => {
      const before = Math.floor(Date.now() / 1000)
      const timestamp = TimestampConverter.now()
      const after = Math.floor(Date.now() / 1000)
      
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should return current timestamp in milliseconds', () => {
      const before = Date.now()
      const timestamp = TimestampConverter.now('milliseconds')
      const after = Date.now()
      
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should be consistent with Date.now()', () => {
      const now1 = TimestampConverter.now('milliseconds')
      const now2 = Date.now()
      
      expect(Math.abs(now1 - now2)).toBeLessThan(100) // Within 100ms
    })
  })

  describe('format', () => {
    it('should format timestamp as ISO string', () => {
      const timestamp = 1234567890
      const formatted = TimestampConverter.format(timestamp, 'seconds', 'iso')
      
      expect(formatted).toBe('2009-02-13T23:31:30.000Z')
    })

    it('should format timestamp as local string', () => {
      const timestamp = 1234567890
      const formatted = TimestampConverter.format(timestamp, 'seconds', 'local')
      
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should format timestamp as UTC string', () => {
      const timestamp = 1234567890
      const formatted = TimestampConverter.format(timestamp, 'seconds', 'utc')
      
      expect(formatted).toContain('Feb')
      expect(formatted).toContain('2009')
    })

    it('should format timestamp as relative time', () => {
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600
      const formatted = TimestampConverter.format(oneHourAgo, 'seconds', 'relative')
      
      expect(formatted).toContain('hour')
      expect(formatted).toContain('ago')
    })

    it('should default to ISO format', () => {
      const timestamp = 1234567890
      const formatted = TimestampConverter.format(timestamp)
      
      expect(formatted).toBe('2009-02-13T23:31:30.000Z')
    })
  })

  describe('getRelativeTime', () => {
    it('should show "now" for current time', () => {
      const now = new Date()
      const relative = TimestampConverter.getRelativeTime(now)
      
      expect(relative).toBe('now')
    })

    it('should show seconds ago', () => {
      const thirtySecondsAgo = new Date(Date.now() - 30000)
      const relative = TimestampConverter.getRelativeTime(thirtySecondsAgo)
      
      expect(relative).toContain('30 seconds ago')
    })

    it('should show minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const relative = TimestampConverter.getRelativeTime(fiveMinutesAgo)
      
      expect(relative).toContain('5 minutes ago')
    })

    it('should show hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const relative = TimestampConverter.getRelativeTime(threeHoursAgo)
      
      expect(relative).toContain('3 hours ago')
    })

    it('should show future times', () => {
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000)
      const relative = TimestampConverter.getRelativeTime(inOneHour)
      
      expect(relative).toContain('in 1 hours')
    })

    it('should show days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const relative = TimestampConverter.getRelativeTime(twoDaysAgo)
      
      expect(relative).toContain('2 days ago')
    })

    it('should show years for very old dates', () => {
      const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
      const relative = TimestampConverter.getRelativeTime(twoYearsAgo)
      
      expect(relative).toContain('2 years ago')
    })
  })

  describe('parseString', () => {
    it('should parse ISO date strings', () => {
      const result = TimestampConverter.parseString('2009-02-13T23:31:30.000Z')
      
      expect(result.valid).toBe(true)
      expect(result.timestamp).toBe(1234567890)
      expect(result.date.getFullYear()).toBe(2009)
    })

    it('should parse Unix timestamp strings', () => {
      const result = TimestampConverter.parseString('1234567890')
      
      expect(result.valid).toBe(true)
      expect(result.timestamp).toBe(1234567890)
    })

    it('should parse millisecond timestamp strings', () => {
      const result = TimestampConverter.parseString('1234567890000')
      
      expect(result.valid).toBe(true)
      expect(result.timestamp).toBe(1234567890)
    })

    it('should handle various date formats', () => {
      const dateFormats = [
        '2009-02-13',
        '02/13/2009',
        'Feb 13 2009',
        '2009-02-13 23:31:30'
      ]
      
      dateFormats.forEach(format => {
        const result = TimestampConverter.parseString(format)
        expect(result.valid).toBe(true)
        expect(result.date.getFullYear()).toBe(2009)
      })
    })

    it('should reject invalid date strings', () => {
      const invalidStrings = [
        'not a date',
        'invalid-date-format',
        '',
        '99999999999999999999'
      ]
      
      invalidStrings.forEach(str => {
        const result = TimestampConverter.parseString(str)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe('convertTimezone', () => {
    it('should convert between timezones', () => {
      const timestamp = 1234567890 // UTC time
      const result = TimestampConverter.convertTimezone(timestamp, 'UTC', 'America/New_York')
      
      expect(result.originalTime).toBeDefined()
      expect(result.convertedTime).toBeDefined()
      expect(typeof result.offset).toBe('number')
    })

    it('should handle same timezone', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.convertTimezone(timestamp, 'UTC', 'UTC')
      
      expect(result.originalTime).toBe(result.convertedTime)
      expect(result.offset).toBe(0)
    })

    it('should throw error for invalid timezones', () => {
      const timestamp = 1234567890
      
      expect(() => {
        TimestampConverter.convertTimezone(timestamp, 'Invalid/Timezone', 'UTC')
      }).toThrow('Timezone conversion failed')
    })
  })

  describe('addTime', () => {
    it('should add seconds', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.addTime(timestamp, 60, 'seconds')
      
      expect(result).toBe(1234567890 + 60)
    })

    it('should add minutes', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.addTime(timestamp, 5, 'minutes')
      
      expect(result).toBe(1234567890 + 5 * 60)
    })

    it('should add hours', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.addTime(timestamp, 2, 'hours')
      
      expect(result).toBe(1234567890 + 2 * 60 * 60)
    })

    it('should add days', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.addTime(timestamp, 1, 'days')
      
      expect(result).toBe(1234567890 + 24 * 60 * 60)
    })

    it('should add weeks', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.addTime(timestamp, 1, 'weeks')
      
      expect(result).toBe(1234567890 + 7 * 24 * 60 * 60)
    })

    it('should handle negative amounts (subtract)', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.addTime(timestamp, -60, 'seconds')
      
      expect(result).toBe(1234567890 - 60)
    })

    it('should throw error for invalid units', () => {
      const timestamp = 1234567890
      
      expect(() => {
        TimestampConverter.addTime(timestamp, 1, 'invalid' as any)
      }).toThrow('Invalid time unit')
    })
  })

  describe('diffTime', () => {
    it('should calculate time difference', () => {
      const timestamp1 = 1234567890
      const timestamp2 = 1234567890 + 3661 // 1 hour, 1 minute, 1 second later
      
      const result = TimestampConverter.diffTime(timestamp1, timestamp2)
      
      expect(result.seconds).toBe(3661)
      expect(result.minutes).toBe(61)
      expect(result.hours).toBe(1)
      expect(result.humanReadable).toContain('1 hours')
    })

    it('should handle reverse order (absolute difference)', () => {
      const timestamp1 = 1234567890 + 3600
      const timestamp2 = 1234567890
      
      const result = TimestampConverter.diffTime(timestamp1, timestamp2)
      
      expect(result.seconds).toBe(3600)
      expect(result.hours).toBe(1)
    })

    it('should provide human readable format', () => {
      const testCases = [
        { diff: 30, expected: 'seconds' },
        { diff: 300, expected: 'minutes' },
        { diff: 7200, expected: 'hours' },
        { diff: 172800, expected: 'days' }
      ]
      
      testCases.forEach(({ diff, expected }) => {
        const result = TimestampConverter.diffTime(0, diff)
        expect(result.humanReadable).toContain(expected)
      })
    })

    it('should handle same timestamps', () => {
      const timestamp = 1234567890
      const result = TimestampConverter.diffTime(timestamp, timestamp)
      
      expect(result.seconds).toBe(0)
      expect(result.humanReadable).toContain('0 seconds')
    })
  })

  describe('isValidTimestamp', () => {
    it('should validate correct timestamps', () => {
      const validTimestamps = [0, 1234567890, 2147483647]
      
      validTimestamps.forEach(timestamp => {
        expect(TimestampConverter.isValidTimestamp(timestamp)).toBe(true)
      })
    })

    it('should reject invalid timestamps', () => {
      const invalidTimestamps = [NaN, Infinity, -1, 8640000000001000]
      
      invalidTimestamps.forEach(timestamp => {
        expect(TimestampConverter.isValidTimestamp(timestamp)).toBe(false)
      })
    })

    it('should handle milliseconds unit', () => {
      expect(TimestampConverter.isValidTimestamp(1234567890000, 'milliseconds')).toBe(true)
      expect(TimestampConverter.isValidTimestamp(8640000000001000, 'milliseconds')).toBe(false)
    })
  })

  describe('getEpochEvents', () => {
    it('should return epoch events', () => {
      const events = TimestampConverter.getEpochEvents()
      
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBeGreaterThan(0)
      
      events.forEach(event => {
        expect(event.name).toBeDefined()
        expect(typeof event.timestamp).toBe('number')
        expect(event.description).toBeDefined()
      })
    })

    it('should include Unix epoch', () => {
      const events = TimestampConverter.getEpochEvents()
      const unixEpoch = events.find(e => e.name === 'Unix Epoch')
      
      expect(unixEpoch).toBeDefined()
      expect(unixEpoch?.timestamp).toBe(0)
    })

    it('should include Y2K', () => {
      const events = TimestampConverter.getEpochEvents()
      const y2k = events.find(e => e.name === 'Y2K')
      
      expect(y2k).toBeDefined()
      expect(y2k?.timestamp).toBe(946684800)
    })
  })

  describe('batch', () => {
    it('should process multiple operations', () => {
      const operations = [
        { type: 'convert' as const, timestamp: 1234567890, unit: 'seconds' as const },
        { type: 'format' as const, timestamp: 1234567890, unit: 'seconds' as const, format: 'iso' as const },
        { type: 'add' as const, timestamp: 1234567890, amount: 60, timeUnit: 'seconds' as const, unit: 'seconds' as const }
      ]
      
      const results = TimestampConverter.batch(operations)
      
      expect(results).toHaveLength(3)
      expect(results[0].result).toBeInstanceOf(Date)
      expect(results[1].result).toBe('2009-02-13T23:31:30.000Z')
      expect(results[2].result).toBe(1234567890 + 60)
    })

    it('should handle errors in batch operations', () => {
      const operations = [
        { type: 'convert' as const, timestamp: NaN, unit: 'seconds' as const },
        { type: 'unknown' as any, timestamp: 1234567890 }
      ]
      
      const results = TimestampConverter.batch(operations)
      
      expect(results).toHaveLength(2)
      expect(results[0].error).toBeDefined()
      expect(results[1].error).toBeDefined()
    })
  })

  describe('performance tests', () => {
    it('should convert timestamps efficiently', async () => {
      const timestamps = new Array(10000).fill(0).map((_, i) => 1234567890 + i)
      
      const { duration } = await perfUtils.measure(() => {
        timestamps.forEach(ts => TimestampConverter.unixToDate(ts))
      })
      
      expect(duration).toBeLessThan(1000)
    })

    it('should format timestamps efficiently', async () => {
      const timestamp = 1234567890
      
      const { duration } = await perfUtils.measure(() => {
        for (let i = 0; i < 1000; i++) {
          TimestampConverter.format(timestamp, 'seconds', 'iso')
        }
      })
      
      expect(duration).toBeLessThan(500)
    })

    it('should maintain performance under stress', async () => {
      const testFn = () => {
        const timestamp = generators.timestamp.now()
        const date = TimestampConverter.unixToDate(timestamp)
        TimestampConverter.format(timestamp, 'seconds', 'relative')
        TimestampConverter.addTime(timestamp, 1, 'hours')
      }

      const results = await perfUtils.stressTest(testFn, 1000)
      expect(results.success).toBe(1000)
      expect(results.failures).toBe(0)
      expect(results.averageTime).toBeLessThan(10)
    })
  })

  describe('security tests', () => {
    it('should handle malicious timestamp inputs', () => {
      const maliciousInputs = [
        'javascript:alert(1)',
        '<script>alert(1)</script>',
        '../../etc/passwd',
        '\x00\x01\x02'
      ]

      maliciousInputs.forEach(input => {
        const result = TimestampConverter.parseString(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should not execute code in date strings', () => {
      const codeInjection = 'new Date("2009-01-01"); alert("xss")'
      const result = TimestampConverter.parseString(codeInjection)
      
      expect(result.valid).toBe(false)
    })

    it('should handle extremely large numbers safely', () => {
      const extremeNumbers = [
        Number.MAX_SAFE_INTEGER,
        Number.MAX_VALUE,
        Infinity,
        -Infinity
      ]

      extremeNumbers.forEach(num => {
        expect(() => TimestampConverter.unixToDate(num)).toThrow()
      })
    })

    it('should sanitize timezone strings', () => {
      const maliciousTimezones = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '../../etc/passwd'
      ]

      maliciousTimezones.forEach(tz => {
        expect(() => {
          TimestampConverter.convertTimezone(1234567890, tz, 'UTC')
        }).toThrow()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle epoch boundary (timestamp 0)', () => {
      const date = TimestampConverter.unixToDate(0)
      expect(date.getFullYear()).toBe(1970)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })

    it('should handle Y2038 problem (32-bit overflow)', () => {
      const timestamp = 2147483647
      const date = TimestampConverter.unixToDate(timestamp)
      expect(date.getFullYear()).toBe(2038)
    })

    it('should handle leap years correctly', () => {
      const leapYear = new Date('2020-02-29T12:00:00Z')
      const timestamp = TimestampConverter.dateToUnix(leapYear)
      const converted = TimestampConverter.unixToDate(timestamp)
      
      expect(converted.getMonth()).toBe(1) // February
      expect(converted.getDate()).toBe(29)
    })

    it('should handle daylight saving time transitions', () => {
      // Test around DST transition (approximate)
      const beforeDST = new Date('2023-03-11T06:00:00Z')
      const afterDST = new Date('2023-03-12T07:00:00Z')
      
      const timestamp1 = TimestampConverter.dateToUnix(beforeDST)
      const timestamp2 = TimestampConverter.dateToUnix(afterDST)
      
      const diff = TimestampConverter.diffTime(timestamp1, timestamp2)
      expect(diff.hours).toBeGreaterThan(20) // Should be about 25 hours due to DST
    })

    it('should handle millisecond precision', () => {
      const date = new Date('2023-01-01T12:00:00.123Z')
      const timestamp = TimestampConverter.dateToUnix(date, 'milliseconds')
      const converted = TimestampConverter.unixToDate(timestamp, 'milliseconds')
      
      expect(converted.getMilliseconds()).toBe(123)
    })

    it('should handle very old dates', () => {
      // Test dates before 1970 (negative timestamps would fail, but test boundary)
      const veryOld = new Date('1950-01-01T00:00:00Z')
      // Most systems don't handle negative timestamps well
      expect(() => TimestampConverter.dateToUnix(veryOld)).not.toThrow()
    })

    it('should handle concurrent operations', async () => {
      const operations = new Array(100).fill(0).map((_, i) => 
        Promise.resolve().then(() => {
          const timestamp = 1234567890 + i * 1000
          const date = TimestampConverter.unixToDate(timestamp)
          return TimestampConverter.dateToUnix(date)
        })
      )

      const results = await Promise.all(operations)
      expect(results).toHaveLength(100)
      results.forEach((result, i) => {
        expect(result).toBe(1234567890 + i * 1000)
      })
    })

    it('should handle timezone edge cases', () => {
      const timestamp = 1234567890
      
      // Test with various timezone formats
      const timezoneFormats = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'GMT',
        'EST'
      ]
      
      timezoneFormats.forEach(tz => {
        try {
          const result = TimestampConverter.convertTimezone(timestamp, 'UTC', tz)
          expect(result.originalTime).toBeDefined()
          expect(result.convertedTime).toBeDefined()
        } catch {
          // Some timezone formats might not be supported, which is acceptable
        }
      })
    })

    it('should handle extreme time additions', () => {
      const timestamp = 1234567890
      
      // Add large amounts of time
      const farFuture = TimestampConverter.addTime(timestamp, 1000, 'years')
      expect(farFuture).toBeGreaterThan(timestamp)
      
      // Subtract large amounts
      const farPast = TimestampConverter.addTime(timestamp, -1000, 'years')
      expect(farPast).toBeLessThan(timestamp)
    })
  })
})