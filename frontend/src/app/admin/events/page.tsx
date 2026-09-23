'use client'

import { EventsDashboard } from '@/components/events-dashboard'
import { useAdminAuth } from '@/lib/admin-auth-context'

export default function AdminEventsPage() {
  const { token, onAuthError } = useAdminAuth()
  return <EventsDashboard token={token} onAuthError={onAuthError} />
}
