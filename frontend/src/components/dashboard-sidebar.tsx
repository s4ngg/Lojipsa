'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Boxes, Calendar, Coins, Megaphone, Package, ScrollText, Sword } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  /** 'admin'(기본값): 관리자 로그인 상태에서만 이동 가능. 'public': 누구나 이동 가능한 사이트 도구. */
  access?: 'admin' | 'public'
  disabled?: boolean
}

const toolItems: NavItem[] = [
  { label: '숙제·시세 알림', icon: Coins, href: '/admin' },
  { label: '일정 알리미', icon: Bell, href: '/admin/events' },
  { label: '공지 요약', icon: Megaphone, href: '/admin/notices' },
  { label: '레이드 보상 관리', icon: ScrollText, href: '/admin/raid-rewards' },
  { label: '숙제 관리', icon: Calendar, disabled: true },
  { label: '재련 계산', icon: Sword, href: '/tools/reforge', access: 'public' },
  { label: '재료 시세', icon: Package, disabled: true },
  { label: '보석 계산', icon: Boxes, disabled: true },
]

const infoItems: NavItem[] = [
  { label: '레이드 보상', icon: ScrollText, href: '/info/raid-rewards', access: 'public' },
]

const groups = [
  { title: '도구', items: toolItems },
  { title: '정보', items: infoItems },
]

/**
 * variant="public": 공개 페이지에서는 관리자 전용 도구도 "운영중" 표시만 하고 클릭은 막는다.
 * access="public"인 도구(계산기, 정보 탭 등)는 로그인 없이 어디서나 이동 가능하다.
 */
export function DashboardSidebar({ variant = 'admin' }: { variant?: 'admin' | 'public' }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-11 items-center gap-2 border-b border-border px-3">
        <div className="flex size-5 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground">
          L
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
          Lojipsa
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 overflow-y-auto p-2">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const isPublicTool = item.access === 'public'
              const isAdminTool = !item.disabled && !!item.href && !isPublicTool
              const isLinkable = !item.disabled && !!item.href && (isPublicTool || variant === 'admin')
              const active = isLinkable && item.href === pathname

              const isComingSoon = !!item.disabled

              const className = cn(
                'flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12.5px] transition-colors',
                active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                !active && isLinkable && 'text-sidebar-foreground hover:bg-sidebar-accent/60',
                !isLinkable && isAdminTool && 'cursor-default text-sidebar-foreground',
                !isLinkable && isComingSoon && 'text-muted-foreground/40 hover:bg-sidebar-accent/60',
              )

              if (isComingSoon) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => alert('준비중인 기능입니다.')}
                    className={className}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              }

              if (!isLinkable) {
                return (
                  <button key={item.label} type="button" disabled className={className}>
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {isAdminTool && <span className="ml-auto size-1.5 rounded-full bg-up" />}
                  </button>
                )
              }

              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  aria-current={active ? 'page' : undefined}
                  className={className}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-up" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border px-3 py-2.5">
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          v0.3.1 · KR 서버
        </p>
      </div>
    </aside>
  )
}
