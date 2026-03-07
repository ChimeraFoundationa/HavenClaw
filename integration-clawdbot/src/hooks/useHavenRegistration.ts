import { useState, useCallback } from 'react'
import { HavenAgent, type AgentData, type RegistrationResult } from '../index'

export function useHavenRegistration() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegistrationResult | null>(null)

  const registerAgent = useCallback(async (agentData: AgentData) => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet')
    }

    setIsRegistering(true)
    setError(null)

    try {
      const ethers = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const haven = new HavenAgent(signer)

      const registrationResult = await haven.registerAgent(agentData)
      setResult(registrationResult)
      return registrationResult
    } catch (err: any) {
      const message = err.message || 'Registration failed'
      setError(message)
      throw err
    } finally {
      setIsRegistering(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
    setIsRegistering(false)
  }, [])

  return {
    registerAgent,
    isRegistering,
    error,
    result,
    reset
  }
}
