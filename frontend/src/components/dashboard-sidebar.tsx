'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Boxes,
  Calendar,
  Coins,
  Compass,
  Dumbbell,
  Flame,
  House,
  Megaphone,
  Package,
  ScrollText,
  Sword,
  Users,
  Wallet,
} from 'lucide-react'
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
  { label: '재료 시세 관리', icon: Package, href: '/admin/materials' },
  { label: '보석 시세 관리', icon: Boxes, href: '/admin/gems' },
  { label: '원정대 방향성 관리', icon: Compass, href: '/admin/direction-knowledge' },
  { label: '재련 계산', icon: Sword, href: '/tools/reforge', access: 'public' },
  { label: '칼로리·BMR 계산기', icon: Flame, href: '/tools/calorie', access: 'public' },
  { label: '운동 배경지식 관리', icon: Dumbbell, href: '/admin/workout-knowledge' },
]

const infoItems: NavItem[] = [
  { label: '레이드 보상', icon: ScrollText, href: '/info/raid-rewards', access: 'public' },
  { label: '재료 시세', icon: Package, href: '/info/materials', access: 'public' },
  { label: '보석 시세', icon: Boxes, href: '/info/gems', access: 'public' },
]

const accountItems: NavItem[] = [
  { label: '내 공격대', icon: Users, href: '/my', access: 'public' },
  { label: '주간 골드 계산', icon: Wallet, href: '/my/weekly-gold', access: 'public' },
  { label: '숙제 관리', icon: Calendar, href: '/my/homework', access: 'public' },
  { label: '원정대 방향성', icon: Compass, href: '/my/direction', access: 'public' },
  { label: '운동 루틴 피드백', icon: Dumbbell, href: '/my/workout', access: 'public' },
]

const homeItems: NavItem[] = [
  { label: '홈', icon: House, href: '/', access: 'public' },
]

const groups = [
  { title: '서비스', items: homeItems },
  { title: '내 정보', items: accountItems },
  { title: '도구', items: toolItems },
  { title: '정보', items: infoItems },
]

/**
 * variant="public": 공개 페이지에는 공개 기능만 표시한다. 관리자 도구는 admin 화면에서만 노출한다.
 */
export function DashboardSidebar({ variant = 'admin' }: { variant?: 'admin' | 'public' }) {
  const pathname = usePathname()
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => variant === 'admin' || item.access === 'public'),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-border px-3.5">
        <div className="flex size-6 items-center justify-center rounded-sm bg-primary text-[13px] font-bold text-primary-foreground">
          L
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          Lojipsa
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 overflow-y-auto p-2.5">
        {visibleGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
                'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13.5px] transition-colors',
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
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              }

              if (!isLinkable) {
                return (
                  <button key={item.label} type="button" disabled className={className}>
                    <Icon className="size-4 shrink-0" />
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
                  <Icon className="size-4 shrink-0" />
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
