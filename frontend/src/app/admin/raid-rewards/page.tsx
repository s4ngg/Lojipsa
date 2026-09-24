'use client'

import { RaidRewardsAdmin } from '@/components/raid-rewards-admin'
import { useAdminAuth } from '@/lib/admin-auth-context'

export default function AdminRaidRewardsPage() {
  const { token, onAuthError } = useAdminAuth()

  return (
    <>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-[12px]">
        <span className="text-muted-foreground">관리자</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium">레이드 보상 관리</span>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <RaidRewardsAdmin token={token} onAuthError={onAuthError} />
      </div>
    </>
  )
}
