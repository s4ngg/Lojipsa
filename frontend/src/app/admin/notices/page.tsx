'use client'

import { NoticesDashboard } from '@/components/notices-dashboard'
import { useAdminAuth } from '@/lib/admin-auth-context'

export default function AdminNoticesPage() {
  const { token, onAuthError } = useAdminAuth()
  return <NoticesDashboard token={token} onAuthError={onAuthError} />
}
