import { discordLoginUrl } from '@/lib/api'

export function DiscordLoginPrompt({
  error,
  description,
}: {
  error: string | null
  description: string
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      {error && (
        <div className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      )}
      <div className="rounded-md border border-border bg-card px-4 py-6">
        <p className="mb-3 text-[12px] text-muted-foreground">{description}</p>
        <a
          href={discordLoginUrl()}
          className="inline-flex h-8 items-center rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90"
        >
          디스코드로 로그인
        </a>
      </div>
    </div>
  )
}
