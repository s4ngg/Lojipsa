'use client'

import { createContext, useContext } from 'react'

export type AdminAuthContextValue = {
  token: string
  onAuthError: () => void
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth must be used within the /admin layout')
  }
  return ctx
}
