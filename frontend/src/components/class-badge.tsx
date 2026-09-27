import {
  Hand,
  Moon,
  Sparkles,
  Sword,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 실제 게임 직업 아이콘은 스마일게이트 리소스라 그대로 쓰지 않고, 역할군별로
 * 범용 심볼 + 색상만 자체 매핑한다. 새 직업이 추가돼도 안 깨지도록 매칭 안 되면
 * 무난한 기본 아이콘(User)으로 폴백한다.
 */
const ROLE_MATCHERS: { keywords: string[]; icon: LucideIcon; className: string }[] = [
  {
    keywords: ['버서커', '디스트로이어', '워로드', '홀리나이트', '슬레이어'],
    icon: Sword,
    className: 'bg-rose-500/15 text-rose-300',
  },
  {
    keywords: ['배틀마스터', '인파이터', '기공사', '창술사', '스트라이커', '브레이커'],
    icon: Hand,
    className: 'bg-amber-500/15 text-amber-300',
  },
  {
    keywords: ['데빌헌터', '블래스터', '호크아이', '스카우터', '건슬링어'],
    icon: Target,
    className: 'bg-emerald-500/15 text-emerald-300',
  },
  {
    keywords: ['바드', '소서리스', '아르카나'],
    icon: Sparkles,
    className: 'bg-sky-500/15 text-sky-300',
  },
  {
    keywords: ['블레이드', '데모닉', '리퍼', '소울이터'],
    icon: Moon,
    className: 'bg-violet-500/15 text-violet-300',
  },
]

function resolveRole(characterClassName: string) {
  const match = ROLE_MATCHERS.find((r) => r.keywords.some((k) => characterClassName.includes(k)))
  return match ?? { icon: User, className: 'bg-secondary text-muted-foreground' }
}

export function ClassBadge({
  characterClassName,
  size = 'sm',
}: {
  characterClassName: string
  size?: 'sm' | 'md'
}) {
  const { icon: Icon, className } = resolveRole(characterClassName)
  const dim = size === 'sm' ? 'size-5' : 'size-6'
  const iconDim = size === 'sm' ? 'size-3' : 'size-3.5'

  return (
    <span
      title={characterClassName}
      className={cn('flex shrink-0 items-center justify-center rounded-full', dim, className)}
    >
      <Icon className={iconDim} />
    </span>
  )
}
