'use client'

import { LoajipsaDashboard } from '@/components/loajipsa-dashboard'
import { useAdminAuth } from '@/lib/admin-auth-context'

export default function AdminHomePage() {
  const { token, onAuthError } = useAdminAuth()
  return <LoajipsaDashboard token={token} onAuthError={onAuthError} />
}
