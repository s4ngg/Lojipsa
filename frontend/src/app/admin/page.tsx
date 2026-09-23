'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { LoajipsaDashboard } from '@/components/loajipsa-dashboard'
import { AdminAuthError, fetchAdminStatus } from '@/lib/api'

const STORAGE_KEY = 'lojipsa-admin-token'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) setToken(saved)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setChecking(true)
    setLoginError(null)
    try {
      await fetchAdminStatus(input)
      sessionStorage.setItem(STORAGE_KEY, input)
      setToken(input)
    } catch (err) {
      setLoginError(err instanceof AdminAuthError ? '비밀번호가 틀렸습니다.' : '백엔드에 연결할 수 없습니다.')
    } finally {
      setChecking(false)
    }
  }

  function handleAuthError() {
    sessionStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setLoginError('비밀번호가 틀렸습니다.')
  }

  if (!token) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-foreground">
        <form
          onSubmit={handleSubmit}
          className="flex w-64 flex-col gap-3 rounded-md border border-border bg-card p-5"
        >
          <h1 className="text-[13px] font-semibold">관리자 로그인</h1>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="비밀번호"
            className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] outline-none focus:border-primary"
          />
          {loginError && <p className="text-[11px] text-down">{loginError}</p>}
          <button
            type="submit"
            disabled={checking || input.length === 0}
            className="h-8 rounded-sm bg-primary text-[12px] font-medium text-primary-foreground disabled:opacity-50"
          >
            {checking ? '확인 중...' : '입장'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <LoajipsaDashboard token={token} onAuthError={handleAuthError} />
      </main>
    </div>
  )
}
