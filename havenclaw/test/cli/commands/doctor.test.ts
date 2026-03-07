/**
 * Doctor Command Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { doctor } from '@cli/commands/doctor'

describe('Doctor Command', () => {
  let consoleLogSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('should run health check', async () => {
    await doctor({})
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  it('should check Node.js version', async () => {
    await doctor({})
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain('Node.js')
  })

  it('should check private key configuration', async () => {
    await doctor({})
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain('Private Key')
  })

  it('should check RPC URL configuration', async () => {
    await doctor({})
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain('RPC URL')
  })

  it('should pass with valid Node.js version', async () => {
    await doctor({})
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain('✓')
  })

  it('should show warnings for missing configuration', async () => {
    delete process.env.HAVENCLAW_PRIVATE_KEY
    delete process.env.HAVENCLAW_RPC_URL

    await doctor({})
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toMatch(/warn|Warning|!/)
  })

  it('should handle verbose option', async () => {
    await doctor({ verbose: true })
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  it('should handle non-interactive option', async () => {
    await doctor({ nonInteractive: true })
    expect(consoleLogSpy).toHaveBeenCalled()
  })
})
