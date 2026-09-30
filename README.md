# Lojipsa

로스트아크 게임 정보를 자동으로 수집·판단해 Slack으로 전달하는 AI 에이전트를 여러 개 운영하는
개인 포트폴리오 플랫폼입니다. "에이전트마다 직원처럼 일하는 작은 회사"를 컨셉으로, 기획부터
백엔드/프론트/인프라/운영까지 1인이 전체를 담당하고 있습니다.

- 배포: https://lojipsa.com
- 인수인계/운영 문서: [HANDOFF.md](HANDOFF.md)
- 트러블슈팅 기록: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 이 프로젝트가 증명하려는 것

- 여러 개의 AI 에이전트를 실제로 **기획 → 구현 → 배포 → 운영**까지 끝까지 끌고 가는 능력
- LLM을 "그럴듯한 답변 생성기"가 아니라, **검증 가능한 근거 안에서만 답하게 설계**하는 능력
- 배포하고 끝나는 게 아니라, **운영 중에도 스스로 품질을 점검하는 장치**까지 만드는 능력

## 에이전트 / 기능 목록

### Slack 알림 에이전트 (스케줄러 기반)

| 에이전트 | 주기 | 설명 |
|---|---|---|
| 숙제·시세 알림 | 숙제 매일 · 시세 30분 | 숙제 체크리스트 발송 + 관심 재료 가격 변동 감시 |
| 일정 알리미 | 매분 | 모험 섬 · 카오스게이트 · 필드보스 · 항해 카운트다운 |
| 공지 요약봇 | 15분 | 공식 공지 크롤링 + Claude 요약 |
| 피드백 에이전트 | 매일 09:00 | 합성 시나리오로 원정대 방향성 추천을 매일 실행하고, 그 결과를 Claude로 다시 채점(PASS/FAIL)해 운영 품질을 스스로 점검 |

### 로그인 후 개인화 기능 (Discord OAuth)

- **내 공격대** — 대표 캐릭터 등록 → 전체 로스터 조회, 캐릭터별 직업 엠블럼 표시
- **숙제 관리** — 캐릭터별 주간 레이드 체크리스트 (자동/수동 설정)
- **주간 골드 계산** — 캐릭터당 최대 3레이드 상한 반영, 귀속/거래가능 골드 모드
- **원정대 방향성** — Claude 기반 육성 방향(강화 vs 주차) 추천

### 공개 도구

재료 시세 비교, 보석 시세, 레이드 보상 정보, 재련 계산기

## AI 신뢰성 설계

이 프로젝트 전반에 걸쳐 지키는 원칙 두 가지입니다.

1. **임의로 만든 데이터를 쓰지 않는다.** 사용자가 직접 확인해준 사실이거나, 로스트아크 공식
   Open API/공식 사이트 CDN이 실제로 내려주는 데이터만 사용합니다. (예: 캐릭터 직업 아이콘은
   자체 제작 대신 `cdn-lostark.game.onstove.com`의 공식 직업 엠블럼 이미지를 사용 —
   [`frontend/src/lib/class-emblem.ts`](frontend/src/lib/class-emblem.ts))
2. **LLM이 최신 정보를 지어내지 않게 만든다.** 공지 요약, 원정대 방향성 같은 기능은 admin이
   편집 가능한 "배경지식" 텍스트를 프롬프트에 주입해서, 모델이 아는 척하지 않고 검증된 정보
   안에서만 답하도록 설계했습니다.

이 두 원칙을 한 단계 더 밀어붙인 게 **피드백 에이전트**입니다 — 실 유저 데이터 없이 합성
시나리오로 핵심 LLM 기능을 매일 자동 실행하고, 그 출력을 다시 다른 LLM 호출로 채점(PASS/FAIL)
시켜 Slack에 보고합니다. 로컬 테스트 중 실제로 두 가지 버그를 찾았습니다 — Claude API 응답이
"thinking" 블록만 오고 텍스트가 없을 때 NPE로 새던 문제, 채점 호출 실패를 "정상"으로 잘못
표시하던 로직 결함. 둘 다 [`TROUBLESHOOTING.md` #12](TROUBLESHOOTING.md)에 기록했습니다.

## 기술 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| Backend | Spring Boot 4.1.1, Java 21, Spring Data JPA | 도메인별 Controller-Service-Repository 구조 |
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4 | |
| 인증 | Discord OAuth2 + JWT | |
| AI | Claude API (Anthropic), 스케줄 기반 Agent, LLM-as-judge | 배경지식 주입 + 자체 채점 피드백 루프 |
| DB | PostgreSQL (RDS, 프로덕션) / H2 (로컬) | `ddl-auto: update` |
| 외부 연동 | Lost Ark Open API, Discord API, Slack API | |
| 인프라 | Docker, AWS(EC2/RDS/Route53), Vercel, Nginx, Certbot | |

## 프로젝트 구조

```
backend/   Spring Boot API 서버 (도메인별 패키지: roster, homework, direction, feedback, schedule, ...)
frontend/  Next.js 프론트엔드 (공개 페이지 + 로그인 후 개인화 페이지 + /admin)
deploy/    프로덕션 배포용 docker-compose, Nginx 설정, 배포 가이드
```

## 배포 아키텍처

- 프론트엔드: Vercel (`lojipsa.com`, GitHub main push 시 자동 배포)
- 백엔드: EC2 + Docker (`api.lojipsa.com`, Nginx + Certbot SSL)
- DB: RDS PostgreSQL
- DNS: Route 53

프리티어(t3.micro) 인스턴스는 메모리 제약으로 `docker compose up --build`를 직접 못 돌려서,
빌드가 필요한 재배포 때만 t3.small로 일시 업사이징했다가 다시 내리는 절차를 운영 중입니다.
자세한 내용은 [`TROUBLESHOOTING.md` #11](TROUBLESHOOTING.md), 재배포 절차 전체는
[`HANDOFF.md`](HANDOFF.md)를 참고하세요.

## 로컬 실행

```bash
# backend
cd backend
cp .env.example .env   # 값 채우기
./gradlew bootRun

# frontend
cd frontend
cp .env.example .env.local
npm install && npm run dev
```

필요한 환경변수 전체 목록은 `backend/.env.example`, `frontend/.env.example`을 참고하세요.
