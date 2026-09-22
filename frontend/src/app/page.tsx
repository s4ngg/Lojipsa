type AgentStatus = "live" | "planned";

type Agent = {
  name: string;
  description: string;
  status: AgentStatus;
  href?: string;
};

const agents: Agent[] = [
  {
    name: "로아집사",
    description: "매일 숙제 체크리스트와 거래소 시세 변동을 Slack으로 알려줍니다.",
    status: "live",
    href: "https://github.com/s4ngg/Lojipsa",
  },
  {
    name: "다음 에이전트",
    description: "준비 중입니다.",
    status: "planned",
  },
  {
    name: "다음 에이전트",
    description: "준비 중입니다.",
    status: "planned",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-6 py-24">
        <section className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Lojipsa
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            로스트아크를 더 편하게 — AI 에이전트들이 숙제와 시세를 대신 챙겨드립니다.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            에이전트
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {agents.map((agent, index) => (
              <AgentCard key={`${agent.name}-${index}`} agent={agent} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const content = (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-5 transition-colors dark:border-white/[.1] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <span className="font-medium text-black dark:text-zinc-50">{agent.name}</span>
        <StatusBadge status={agent.status} />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{agent.description}</p>
    </div>
  );

  if (!agent.href) {
    return content;
  }

  return (
    <a href={agent.href} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  );
}

function StatusBadge({ status }: { status: AgentStatus }) {
  if (status === "live") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        운영중
      </span>
    );
  }

  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400">
      준비중
    </span>
  );
}
