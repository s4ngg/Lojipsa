import { User } from 'lucide-react'
import { getClassEmblemUrl } from '@/lib/class-emblem'

type CharacterAvatarProps = {
  characterClassName: string
  characterImageUrl: string | null
}

// 직업별로 한눈에 구분되도록 공식 직업 엠블럼을 우선 보여주고, 매핑이 없는 직업은
// 캐릭터 초상화로, 그마저 없으면 기본 아이콘으로 대체한다.
export function CharacterAvatar({ characterClassName, characterImageUrl }: CharacterAvatarProps) {
  const emblemUrl = getClassEmblemUrl(characterClassName)
  const imageUrl = emblemUrl ?? characterImageUrl

  if (!imageUrl) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
        <User className="size-3.5 text-muted-foreground" />
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      title={characterClassName}
      className={
        emblemUrl
          ? 'size-7 shrink-0 rounded-full border border-border bg-secondary object-contain p-0.5'
          : 'size-7 shrink-0 rounded-full border border-border object-cover'
      }
    />
  )
}
