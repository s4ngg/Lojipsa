# 배포 가이드 (AWS)

구성: 프론트엔드는 Vercel, 백엔드는 EC2(Docker), DB는 RDS PostgreSQL, 도메인은 Route 53.

## 0. 준비물

- AWS 계정 (기존에 쓰던 계정)
- 새 도메인 (Route 53에서 구매)
- Vercel 계정 (프론트엔드용, GitHub 연동)

---

## 1. GitHub에 푸시

로컬 작업(Dockerize, Postgres 마이그레이션 등)을 커밋하고 push. EC2에서 이 리포를 클론해서 빌드합니다.

---

## 2. Route 53 — 도메인 구매

1. Route 53 콘솔 → 도메인 등록 → 원하는 도메인 검색/구매 (예: `lojipsa.xyz` 같은 저렴한 TLD도 충분)
2. 구매하면 자동으로 해당 도메인의 호스팅 영역(Hosted Zone)이 생성됨 — 이후 레코드는 여기에 추가

아직 EC2/RDS를 안 만들었으니 레코드 연결은 나중에(5, 8단계) 합니다.

---

## 3. RDS — PostgreSQL 생성

1. RDS 콘솔 → 데이터베이스 생성
2. 엔진: **PostgreSQL** (최신 안정 버전)
3. 템플릿: **프리 티어** (계정이 대상이면) 또는 **개발/테스트**
4. DB 인스턴스 식별자: `lojipsa-db`
5. 마스터 사용자 이름: `lojipsa`, 마스터 암호: 직접 정해서 안전하게 보관 (나중에 `.env.prod`의 `DB_PASSWORD`)
6. 퍼블릭 액세스: **아니요** (EC2에서만 접근, 보안 강화)
7. VPC 보안 그룹: 새로 생성 — 이름 `lojipsa-rds-sg`
8. 초기 데이터베이스 이름: `lojipsa`
9. 생성 후 몇 분 대기 → 상태가 "사용 가능"이 되면 **엔드포인트** 주소를 복사해둘 것 (예: `lojipsa-db.xxxxx.ap-northeast-2.rds.amazonaws.com`)

---

## 4. EC2 — 인스턴스 생성

1. EC2 콘솔 → 인스턴스 시작
2. AMI: **Ubuntu 24.04 LTS**
3. 인스턴스 유형: `t3.micro` (프리티어) 또는 `t3.small` (여유롭게)
4. 키 페어: 새로 생성해서 `.pem` 파일 안전하게 보관 (SSH 접속용)
5. 보안 그룹: 새로 생성 — 이름 `lojipsa-ec2-sg`, 인바운드 규칙:
   - SSH (22) — 내 IP만
   - HTTP (80) — 0.0.0.0/0
   - HTTPS (443) — 0.0.0.0/0
6. 스토리지: 기본값(8GB)이면 충분
7. 시작 후 **퍼블릭 IPv4 주소** 확인

### RDS 보안 그룹에 EC2 접근 허용

1. RDS 콘솔 → `lojipsa-rds-sg` 편집
2. 인바운드 규칙 추가: PostgreSQL(5432), 소스 = `lojipsa-ec2-sg` (보안 그룹 자체를 소스로 지정)

---

## 5. Route 53 — 백엔드 레코드 연결

Hosted Zone에 A 레코드 추가:
- 이름: `api` (즉 `api.YOUR_DOMAIN`)
- 유형: A
- 값: EC2 퍼블릭 IP

---

## 6. EC2 접속 및 Docker 설치

```bash
ssh -i your-key.pem ubuntu@<EC2 퍼블릭 IP>

sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# 다시 로그인해서 docker 권한 반영
exit
ssh -i your-key.pem ubuntu@<EC2 퍼블릭 IP>
```

---

## 7. 리포 클론 및 환경변수 설정

```bash
git clone https://github.com/s4ngg/Lojipsa.git
cd Lojipsa/backend
cp .env.prod.example .env.prod
nano .env.prod   # 실제 값 채우기 (DB_URL은 3단계에서 복사한 RDS 엔드포인트 사용)
```

`.env.prod`에서 특히 확인할 값:
- `DB_URL=jdbc:postgresql://<RDS 엔드포인트>:5432/lojipsa`
- `DB_PASSWORD=<3단계에서 정한 마스터 암호>`
- `CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN,https://admin.YOUR_DOMAIN`
- `DISCORD_REDIRECT_URI=https://api.YOUR_DOMAIN/api/auth/discord/callback`
- `DISCORD_FRONTEND_REDIRECT_URL=https://YOUR_DOMAIN/my`

---

## 8. Discord 개발자 포털 업데이트

OAuth2 → Redirects에 `https://api.YOUR_DOMAIN/api/auth/discord/callback` 추가 (로컬용 redirect는 남겨둬도 무방).

---

## 9. 백엔드 컨테이너 실행

```bash
cd ~/Lojipsa
docker compose -f deploy/docker-compose.prod.yml up -d --build
docker compose -f deploy/docker-compose.prod.yml logs -f backend   # 부팅 로그 확인, Ctrl+C로 빠져나오기
```

`Started LoajipsaApplication`이 뜨고 에러 없으면 성공.

```bash
curl http://localhost:8080/api/public/status   # 로컬에서 헬스체크
```

---

## 10. Nginx + SSL

```bash
sudo cp ~/Lojipsa/deploy/nginx.conf /etc/nginx/sites-available/lojipsa-api
sudo nano /etc/nginx/sites-available/lojipsa-api   # YOUR_DOMAIN을 실제 도메인으로 교체
sudo ln -s /etc/nginx/sites-available/lojipsa-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d api.YOUR_DOMAIN   # 이메일 입력, 약관 동의 — SSL 자동 설정됨
```

확인: 브라우저에서 `https://api.YOUR_DOMAIN/api/public/status` 접속.

---

## 11. Vercel — 프론트엔드 배포

1. vercel.com → New Project → GitHub의 `s4ngg/Lojipsa` 선택
2. Root Directory: `frontend`
3. 환경변수: `NEXT_PUBLIC_API_BASE_URL=https://api.YOUR_DOMAIN`
4. 배포

배포 후 Vercel 프로젝트 설정 → Domains에서:
- `YOUR_DOMAIN` 추가
- `admin.YOUR_DOMAIN` 추가 (같은 프로젝트, `proxy.ts`가 호스트명으로 `/admin` 접근을 이미 분기하고 있음)

Vercel이 안내하는 대로 Route 53에 CNAME/A 레코드 추가.

---

## 12. 최종 확인

- `https://YOUR_DOMAIN` — 공개 홈
- `https://admin.YOUR_DOMAIN` — 관리자 (일반 도메인에서는 404여야 정상)
- `https://YOUR_DOMAIN/my` → 디스코드 로그인 → 콜백 → 로스터까지 실제로 한 번 돌려보기
- 각 Slack 에이전트가 실제로 알림을 보내는지 몇 분~몇십 분 기다려서 확인

## 이후 재배포 시

```bash
ssh -i your-key.pem ubuntu@<EC2 IP>
cd ~/Lojipsa && git pull
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

프론트엔드는 GitHub에 push하면 Vercel이 자동으로 재배포합니다.
