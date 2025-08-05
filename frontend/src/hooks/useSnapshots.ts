import { useState, useEffect } from 'react'
import axios from 'axios'

interface FileData {
  path: string
  churn: number
  hotspot: number
}

interface Snapshot {
  timestamp: string
  hash: string
  files: FileData[]
}

export function useSnapshots(repoId: number) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`http://localhost:8000/api/snapshots/${repoId}`)
        setSnapshots(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch snapshots')
        console.error('Error fetching snapshots:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSnapshots()
  }, [repoId])

  return { snapshots, loading, error }
} 