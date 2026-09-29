import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarClock,
  Coins,
  MessageSquareText,
  Sparkles,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

interface PublicStatus {
  status: string
}

interface AgentCard {
  title: string
  description: string
  cadence: string
  channel: string
  model?: string
  icon: typeof Coins
}

const agents: AgentCard[] = [
  {
    title: '숙제·시세 알림',
    description: '매일 숙제 체크리스트를 보내고 관심 재료의 가격 변동을 감시합니다.',
    cadence: '기본 주기: 숙제 매일 · 시세 30분',
    channel: 'Slack',
    icon: Coins,
  },
  {
    title: '일정 알리미',
    description: '모험 섬, 카오스게이트, 필드보스 등 주요 일정이 가까워지면 알려줍니다.',
    cadence: '기본 주기: 매분 일정 확인',
    channel: 'Slack',
    icon: CalendarClock,
  },
  {
    title: '공지 요약봇',
    description: '로스트아크 공식 공지를 확인하고 핵심 내용을 요약해 전달합니다.',
    cadence: '기본 주기: 15분마다 공지 확인',
    channel: 'Slack',
    model: 'Claude Haiku',
    icon: MessageSquareText,
  },
]

async function getPublicStatus(): Promise<PublicStatus | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  try {
    const response = await fetch(`${base}/api/public/status`, { cache: 'no-store' })
    if (!response.ok) return null
    return (await response.json()) as PublicStatus
  } catch {
    return null
  }
}

export default async function Page() {
  const status = await getPublicStatus()
  const isApiOnline = status?.status === 'online'

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <DashboardSidebar variant="public" />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="flex h-14 items-center justify-between border-b border-border px-5">
          <span className="text-sm font-semibold">Lojipsa</span>
          <span
            className={`flex items-center gap-2 text-xs ${isApiOnline ? 'text-up' : 'text-muted-foreground'}`}
            aria-live="polite"
          >
            <span className={`size-2 rounded-full ${isApiOnline ? 'bg-up' : 'bg-muted-foreground'}`} />
            {isApiOnline ? '서비스 API 연결됨' : '서비스 상태 확인 불가'}
          </span>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14">
          <section className="grid gap-6 rounded-xl border border-border bg-card p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                로스트아크를 위한 AI 에이전트 회사
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                반복되는 정보 확인은 에이전트에게 맡기세요.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Lojipsa는 게임 정보를 확인하고 필요한 내용을 Slack으로 전달하는 에이전트를 운영합니다.
                캐릭터 관리와 원정대 성장 판단을 돕는 도구도 함께 제공합니다.
              </p>
            </div>
            <Link
              href="/my"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              내 공격대 시작하기
              <ArrowRight className="size-4" />
            </Link>
          </section>

          <section aria-labelledby="agents-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  AUTOMATION
                </p>
                <h2 id="agents-heading" className="mt-1 text-xl font-bold">
                  배포된 자동화 에이전트
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">알림 채널 · Slack</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => {
                const Icon = agent.icon
                return (
                  <article key={agent.title} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-up/10 px-2.5 py-1 text-[11px] font-medium text-up">
                        <span className="size-1.5 rounded-full bg-up" />
                        배포됨
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{agent.title}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                      {agent.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
                      <span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">
                        {agent.cadence}
                      </span>
                      <span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">
                        {agent.channel}
                      </span>
                      {agent.model && (
                        <span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">
                          {agent.model}
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="tools-heading">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PLAYER TOOLS
              </p>
              <h2 id="tools-heading" className="mt-1 text-xl font-bold">
                직접 이용할 수 있는 기능
              </h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Link
                href="/my/direction"
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">원정대 방향성 추천</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    내 캐릭터와 배경지식을 바탕으로 성장 방향을 확인합니다.
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/my/homework"
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">내 숙제 관리</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    캐릭터별 주간 레이드 진행 상황을 관리합니다.
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
