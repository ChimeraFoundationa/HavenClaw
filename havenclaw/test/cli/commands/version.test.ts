/**
 * CLI Commands Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { versionCommand } from '@cli/commands/version'

describe('Version Command', () => {
  let consoleLogSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('should output version information', async () => {
    await versionCommand()
    expect(consoleLogSpy).toHaveBeenCalled()
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain('1.0.0')
    expect(output).toContain('HavenClaw')
  })

  it('should include Node.js version', async () => {
    await versionCommand()
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain(process.version)
  })

  it('should include platform information', async () => {
    await versionCommand()
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain(process.platform)
    expect(output).toContain(process.arch)
  })

  it('should include repository URLs', async () => {
    await versionCommand()
    const output = consoleLogSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(output).toContain('havenclaw.ai')
    expect(output).toContain('github.com/ava-labs/havenclaw')
  })
})
