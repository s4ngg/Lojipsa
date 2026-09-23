import { Boxes, Calendar, Coins, Package, Sword } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  disabled?: boolean
}

const items: NavItem[] = [
  { label: '숙제·시세 알림', icon: Coins, active: true },
  { label: '숙제 관리', icon: Calendar, disabled: true },
  { label: '재련 계산', icon: Sword, disabled: true },
  { label: '재료 시세', icon: Package, disabled: true },
  { label: '보석 계산', icon: Boxes, disabled: true },
]

export function DashboardSidebar() {
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

      <nav className="flex flex-col gap-0.5 p-2">
        <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          도구
        </p>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12.5px] transition-colors',
                item.active &&
                  'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                !item.active &&
                  !item.disabled &&
                  'text-sidebar-foreground hover:bg-sidebar-accent/60',
                item.disabled && 'cursor-default text-muted-foreground/40',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
              {item.active && (
                <span className="ml-auto size-1.5 rounded-full bg-up" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-border px-3 py-2.5">
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          v0.3.1 · KR 서버
        </p>
      </div>
    </aside>
  )
}
