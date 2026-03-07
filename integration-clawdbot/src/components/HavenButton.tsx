import { useState } from 'react'
import { HavenAgent, type AgentData, type RegistrationResult } from '../index'

export interface HavenButtonProps {
  agentId: string
  agentName: string
  capabilities: string[]
  metadata?: Record<string, any>
  onSuccess?: (result: RegistrationResult) => void
  onError?: (error: Error) => void
}

export function HavenButton({
  agentId,
  agentName,
  capabilities,
  metadata,
  onSuccess,
  onError
}: HavenButtonProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (!window.ethereum) {
      const err = new Error('Please install MetaMask or another Web3 wallet')
      setError(err.message)
      onError?.(err)
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      const provider = new (await import('ethers')).BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const haven = new HavenAgent(signer)

      const agentData: AgentData = {
        id: agentId,
        name: agentName,
        capabilities,
        metadata
      }

      const result = await haven.registerAgent(agentData)
      onSuccess?.(result)
    } catch (err: any) {
      const message = err.message || 'Registration failed'
      setError(message)
      onError?.(err)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isRegistering}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: isRegistering ? 'not-allowed' : 'pointer',
          opacity: isRegistering ? 0.6 : 1,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {isRegistering ? (
          <>
            <span>⏳</span>
            Registering on Haven...
          </>
        ) : (
          <>
            <span>🏛️</span>
            Register on Haven Framework
          </>
        )}
      </button>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
