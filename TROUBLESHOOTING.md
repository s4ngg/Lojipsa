# 트러블슈팅 기록

개발 중 만난 버그 중 원인 분석 과정이 있었던 것만 기록한다. 나중에 이 중 임팩트 큰 2~3건을 골라
이력서/포트폴리오 트러블슈팅 항목으로 다듬어 쓴다.

---

## 1) .env 값이 Spring 앱에서 치환되지 않음 (Lost Ark API 401)

**문제 상황**

로아집사가 Lost Ark 시세 API를 호출할 때마다 401 Unauthorized가 발생했다. 같은 `.env` 파일에서
값을 추출해 curl로 직접 호출하면 200이 정상적으로 왔다.

**원인 분석**

처음엔 토큰 자체가 잘못된 줄 알고 Lost Ark 개발자 포털에서 JWT를 재발급했지만 같은 에러가
반복됐다. curl은 되는데 앱에서만 안 되는 게 이상해서, `LostArkClient`에서 실제로 바인딩된
`apiKey` 값을 임시로 로그에 찍어보고 나서야 `${LOSTARK_API_KEY}` 플레이스홀더가 실제 값으로
치환되지 않고 문자 그대로 요청 헤더에 들어가고 있었다는 걸 발견했다. `.env` 로딩을
`EnvironmentPostProcessor` SPI(`META-INF/spring/....imports`)로 구현해뒀는데, 이 인터페이스가
Spring Boot 4에서 deprecated(제거 예정)로 바뀌면서 로딩 자체가 되지 않고 있었다. 더 안 좋았던
점은, Spring이 미해결 플레이스홀더를 예외 없이 문자열 그대로 통과시켜서 앱은 아무 에러 없이
정상 기동됐다는 것 — 부팅 성공만 보고 넘어갔으면 계속 몰랐을 문제였다.

**해결 방법**

SPI 방식 대신 `main()`에서 `SpringApplication.run()` 호출 전에 `.env`를 직접 읽어 시스템
프로퍼티로 주입하는 `DotenvLoader`로 교체했다. 이미 설정된 시스템 프로퍼티/OS 환경변수가 있으면
덮어쓰지 않게 해서, 실제 배포 환경에서는 진짜 환경변수가 우선되도록 했다.

**결과**

Lost Ark API 호출과 Slack 발송이 정상 동작함을 실행 테스트로 확인. 같은 패턴(`${SLACK_BOT_TOKEN}`)을
쓰던 Slack 연동도 같은 버그의 영향권이었다는 걸 함께 발견 — 컴포넌트를 curl로만 개별 테스트했다면
놓쳤을 문제였다.

---

## 2) Jackson이 groupId부터 바뀌어서 ObjectMapper를 못 찾음

**문제 상황**

시세 변동 이력을 파일로 저장하려고 `com.fasterxml.jackson.databind.ObjectMapper`를 주입받는
컴포넌트를 추가했는데 컴파일 자체가 안 됐다 — `cannot find symbol: class ObjectMapper`,
`package com.fasterxml.jackson.databind does not exist`.

**원인 분석**

`spring-boot-starter-webmvc`를 쓰고 있으니 Jackson은 당연히 클래스패스에 있을 거라 생각했는데,
`./gradlew dependencies`로 compileClasspath를 직접 찍어보고 나서야 원인을 알았다. 이 프로젝트가
쓰는 Spring Boot 4.1.1은 Jackson 3으로 올라가 있었고, `jackson-databind`가 `com.fasterxml.jackson.core`가
아니라 `tools.jackson.core` groupId 아래로, 패키지도 `tools.jackson.databind`로 바뀌어 있었다
(반면 `jackson-annotations`는 그대로 `com.fasterxml.jackson.annotation` 유지). import를 고치고
나니 이번엔 `catch (IOException e)`에서 "exception IOException is never thrown"이라는 새 컴파일
에러가 났는데, Jackson 3부터 `readValue`/`writeValue`가 checked `IOException` 대신 unchecked
예외를 던지도록 바뀐 것도 같은 맥락의 변화였다.

**해결 방법**

import를 `tools.jackson.databind.ObjectMapper`로 교체하고, 더 이상 checked exception이 아니므로
`catch (IOException e)`를 `catch (Exception e)`로 바꿔 파일 I/O 실패(디렉터리 생성 실패 등)와
Jackson 파싱 실패를 한 곳에서 로그만 남기고 넘어가도록 정리했다.

**결과**

정상 컴파일 및 실행 확인. Spring Boot 4 계열 프로젝트에서는 익숙한 Jackson 2 API를 그대로 가정하면
안 되고, 의존성 트리를 먼저 확인하는 습관이 필요하다는 걸 체감했다.

---

## 3) 관리자 인증을 넣었더니 로그인 자체가 CORS 에러로 실패

**문제 상황**

관리자 페이지에 비밀번호 인증(`Authorization: Bearer {ADMIN_TOKEN}`)을 추가했는데, 프론트에서
틀린 비밀번호를 넣어도 "비밀번호가 틀렸습니다"가 아니라 "백엔드에 연결할 수 없습니다"라는
엉뚱한 에러만 떴다. curl로는 401이 정상적으로 왔다.

**원인 분석**

fetch가 던진 에러가 401이 아니라 다른 종류인가 싶어 브라우저 콘솔을 열어보니
"Response to preflight request doesn't pass access control check: It does not have HTTP ok status"
라는 CORS 에러였다. 커스텀 헤더(Authorization)를 쓰는 요청은 브라우저가 먼저 OPTIONS
preflight를 보내는데, 이 OPTIONS 요청에는 당연히 Authorization 헤더가 없다. 그런데 관리자
인증 인터셉터가 `/api/admin/**` 경로의 모든 메서드를 걸러내도록 등록돼 있어서, 이 OPTIONS
요청까지 401로 막아버리고 있었다. 그 결과 브라우저는 preflight 단계에서 이미 실패로 판단하고
실제 GET 요청 자체를 보내지도 않았다 — curl은 preflight 개념이 없어서 GET을 바로 보내니
정상적으로 401이 보였던 것이다.

**해결 방법**

인터셉터의 `preHandle`에서 요청 메서드가 `OPTIONS`이면 인증 검사 없이 바로 통과시키도록
분기를 추가했다. 실제 인증은 여전히 GET 요청에서만 걸린다.

**결과**

브라우저에서 오답/정답 로그인 흐름을 직접 재현해 정상 동작 확인. curl로 백엔드만 따로
테스트했을 때는 못 잡는, 브라우저의 CORS preflight 특성 때문에 생기는 문제였다.

---

## 4) 일정 알리미 테스트 중 Slack 429(rate limit) 발생

**문제 상황**

일정 알리미(모험섬/카오스게이트/필드보스/항해 일정을 미리 알려주는 기능)를 테스트하려고
알림 기준 시간을 넉넉하게(24시간 전) 늘려서 실행했더니, 로그에 `429 Too Many Requests` /
`"error":"ratelimited"`가 찍혔다.

**원인 분석**

로직 자체는 의도대로 동작하고 있었다 — 24시간 안에 시작하는 감시 대상 일정이 20개 넘게
잡혔고, 그걸 하나씩 개별 Slack 메시지로 보내다 보니 순식간에 Slack의 초당 발송 제한에
걸린 것이었다. 테스트용으로 창을 넓게 잡아서 드러난 문제이긴 하지만, 실제 운영 기준(10분
전 알림)으로도 로스트아크는 여러 콘텐츠가 같은 시간대(예: 항해 협동 여러 목적지가 동시
시작)에 몰리는 경우가 흔해서, 같은 틱에서 일정이 여러 건 겹치면 언제든 재현될 수 있는
구조적인 문제였다.

**해결 방법**

한 번의 스케줄러 실행에서 알림 대상 일정을 다 모은 뒤, 개별 발송 대신 **메시지 하나로
묶어서** 한 번만 Slack에 보내도록 바꿨다. Rate limit 회피뿐 아니라, 사용자 입장에서도
알림이 연달아 여러 개 오는 것보다 한 번에 정리돼서 오는 게 낫다.

**결과**

같은 조건(넓은 알림 창)으로 재테스트해서 5건이 잡혔을 때 메시지 1개로 정상 발송되고
더 이상 429가 나지 않는 것을 확인했다.

---

## 5) Git Bash에서 curl -d에 한글을 직접 넣으면 서버가 400으로 거부

**문제 상황**

레이드 보상 CRUD API를 테스트하려고 `curl -X POST ... -d '{"raidName":"서막-에키드나", ...}'`처럼
한글이 포함된 JSON을 커맨드에 직접 넣어서 호출했더니, 서버가 매번
`JSON parse error: Invalid UTF-8 start byte 0xbc`로 400을 반환했다.

**원인 분석**

애플리케이션 코드 문제가 아니라, Windows의 Git Bash에서 커맨드 인자로 넘긴 한글 문자열이
UTF-8이 아닌 다른 인코딩(콘솔 활성 코드페이지)으로 curl에 전달되는 게 원인이었다. 즉
curl이 실제로 보낸 바이트 자체가 깨져 있어서, 서버 입장에서는 정당하게 파싱을 거부한
것이었다. 이번 세션에서 반복해서 만난 "터미널/콘솔 인코딩" 계열 문제 중 하나로, 이번엔
내 눈에 보이는 출력이 아니라 실제로 네트워크에 나간 바이트 자체가 깨진 케이스라는 점이
달랐다.

**해결 방법**

한글이 포함된 요청 본문은 커맨드 인자로 직접 넘기지 않고, UTF-8로 저장한 JSON 파일을
만든 뒤 `curl --data-binary @파일.json`으로 전송하도록 바꿨다.

**결과**

동일한 요청이 정상적으로 201/200 처리되고, 응답에도 한글이 깨지지 않고 그대로 저장·조회되는
것을 확인했다.

---

## 6) JpaRepository.deleteById가 없는 id에도 조용히 성공 처리

**문제 상황**

레이드 보상 삭제 API에서 존재하지 않는 id(99)로 DELETE 요청을 보냈는데, 404가 아니라
204(성공)가 돌아왔다.

**원인 분석**

`repository.deleteById(id)`를 예외 처리 없이 그대로 호출하고 있었는데, 이번에 쓰는
Spring Data JPA 버전에서는 존재하지 않는 id를 넘겨도 예외 없이 조용히 넘어가는 걸 확인했다
(과거 버전에서 익숙했던 `EmptyResultDataAccessException`이 안 던져짐). 로그에도 에러가
전혀 안 찍혀서, 응답 코드만 보고 있었다면 계속 몰랐을 문제였다.

**해결 방법**

삭제 전에 `existsById(id)`로 직접 존재 여부를 확인해서, 없으면 `NoSuchElementException`을
던지고 컨트롤러의 `@ExceptionHandler`가 404로 응답하도록 했다.

**결과**

존재하지 않는 id 삭제 시 404, 실제 존재하는 id 삭제 시 204로 정상 구분되는 것을 재확인했다.

---

## 7) 아무것도 안 고쳤는데 "저장" 버튼이 계속 떠 있음

**문제 상황**

레이드 보상 관리 화면에서 삭제만 하고 아무 값도 수정하지 않았는데, 남아있는 행들에
"저장" 버튼이 항상 표시됐다.

**원인 분석**

수정 여부(dirty) 판단을 `JSON.stringify(form) !== JSON.stringify({ ...reward, id: undefined })`
로 하고 있었다. 그런데 `form`의 초기값을 `useState<RaidRewardInput>(reward)`로 넣었는데,
TypeScript는 객체 리터럴이 아닌 변수 할당에는 초과 프로퍼티 검사를 하지 않기 때문에
`reward`(실제로는 `id`를 포함한 `RaidReward` 객체)가 타입 에러 없이 그대로 `form`에
들어가버렸다. 즉 `form`에는 `id`가 몰래 포함돼 있었다. 반면 비교 대상은
`{ ...reward, id: undefined }`였는데, `JSON.stringify`는 값이 `undefined`인 키를
결과에서 아예 생략한다 — 그래서 한쪽 문자열엔 `"id":1`이 있고 다른 쪽엔 `id` 자체가
없어서, 값이 완전히 같아도 항상 다른 문자열로 비교돼 dirty가 계속 true였다.

**해결 방법**

`RaidReward`에서 `id`를 제외한 `RaidRewardInput`을 만드는 `toInput()` 헬퍼를 따로
만들어서, `form`의 초기값과 비교 대상 양쪽 모두 이 함수를 거치도록 통일했다.

**결과**

값을 실제로 바꿨을 때만 "저장" 버튼이 뜨고, 저장 후에는 다시 사라지는 것을 확인했다.
TypeScript의 구조적 타이핑이 눈에 잘 안 띄는 버그를 만들 수 있다는 걸 체감한 사례.

---

## 8) JWT_SECRET을 분명히 추가했는데 앱이 "키가 0비트"라며 부팅 실패

**문제 상황**

디스코드 로그인 기능에 JWT 발급을 추가하고 실행했더니, 앱이 뜨지도 못하고
`io.jsonwebtoken.security.WeakKeyException: The specified key byte array is 0 bits`로
죽었다. 분명 `echo "JWT_SECRET=..." >> .env`로 값을 추가했었다.

**원인 분석**

`.env`에는 Slack 토큰, Lost Ark JWT, 관리자 토큰, 디스코드 시크릿 등 다른 실제
비밀값이 같이 들어있어서, `cat`으로 전체를 열어보는 방식은 쓸 수 없었다. 대신
`grep -c '^JWT_SECRET=' .env`로 존재 여부만 확인했는데 결과가 0 — 분명 append했던
줄이 파일에 없었다. `wc -l`로는 13줄이 있었는데, `awk '{print NR": "length($0)}'`로
줄별 길이만(내용은 노출하지 않고) 확인해보니 13번째 줄이 129자로 유독 길었다.
`sed -n '13p' .env | cut -c1-12`로 그 줄의 앞부분 12글자만 열어보니 `DISCORD_CLIE`로
시작하고 있었다 — 즉 내가 추가하려던 `JWT_SECRET=...` 줄이 존재하지 않고,
`DISCORD_CLIENT_SECRET` 줄 어딘가에 병합되어 사라져 있었다. `>>` 리다이렉트 자체는
문제가 아니었고, 파일 마지막 줄이 개행 문자로 끝나지 않은 상태에서 append가 이뤄지면
새 내용이 기존 마지막 줄 끝에 그대로 이어 붙는다는, Unix 텍스트 파일의 기본적인
특성을 놓친 것이었다.

**해결 방법**

값을 다시 생성해서 추가하기 전에, `.env` 파일의 마지막 바이트가 개행인지
(`tail -c1 .env`) 먼저 확인하고, 아니면 빈 줄을 하나 넣어 개행을 보장한 뒤에
`printf 'JWT_SECRET=%s\n' "$TOKEN" >> .env`로 새 줄을 추가하도록 바꿨다. 값 자체는
비밀값이라 절대 출력하지 않고, 길이(`${#TOKEN}`)와 `grep -c`로 줄 존재 여부만으로
검증했다.

**결과**

`grep -c '^JWT_SECRET='`이 1을 반환하고, 인접한 `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET`
줄 길이가 그대로인 것을 확인한 뒤 재부팅해서 `WeakKeyException` 없이 정상 기동을
확인했다. 비밀값이 섞인 설정 파일을 셸에서 다룰 때는 내용을 보지 않고도 "줄이
제대로 분리되어 있는가"를 검증하는 습관이 필요하다는 걸 체감한 사례.

---

## 9) 디스코드 OAuth 콜백에서 계속 invalid_client (redirect_uri는 정확히 일치)

**문제 상황**

디스코드 로그인 동의 화면까지는 정상적으로 넘어갔는데(즉 `client_id`와
`redirect_uri`는 맞았다는 뜻), "승인"을 누른 뒤 콜백 단계에서 매번 실패해서
프론트로 `/my?error=login_failed`로 떨어졌다. 백엔드 로그에는 디스코드 토큰
교환 API에서 `401 Unauthorized: {"error": "invalid_client"}`가 찍혀 있었다.

**원인 분석**

`invalid_client`는 `client_id`/`client_secret` 조합이 틀렸다는 뜻이라, 사용자가
`.env`에 직접 붙여넣은 `DISCORD_CLIENT_SECRET` 값을 의심했다. 이번에도 값 자체는
볼 수 없으니 구조만 확인했는데, 그 줄의 길이가 129자였다 (`DISCORD_CLIENT_SECRET=`
접두사 22자를 빼면 값만 107자) — 일반적인 디스코드 Client Secret 길이(약 32자)에
비해 3배 넘게 길었다. `=` 개수, 공백, 따옴표, URL 인코딩 여부까지 확인했지만 전부
정상이어서, 값을 복사할 때 이전 값이나 다른 텍스트가 같이 겹쳐 붙은 것으로 결론
내렸다. 디스코드 Developer Portal에서 시크릿을 재발급받아 다시 깔끔하게 붙여넣게
한 뒤 같은 방식으로 확인하니 길이가 54자(값 32자)로 정상 범위로 줄어들었다.

**해결 방법**

사용자가 Discord Developer Portal에서 "Reset Secret"으로 새 값을 발급받아 `.env`에
다시 입력했다. 이번에도 값은 절대 보지 않고, 줄 길이/`=` 개수만으로 "정상적인
형태인가"를 먼저 검증한 뒤에 백엔드를 재기동해서 재시도했다.

**결과**

재기동 후 로그인 → 동의 → 콜백 → JWT 발급 → `/api/me/roster/register`로 실제
로스트아크 공격대 12개 캐릭터 조회까지 전체 플로우가 정상 동작하는 것을 확인했다.
"등록된 값이 화면상 맞아 보인다"와 "실제로 전송되는 바이트가 맞다"는 다르다는 걸
다시 한번 확인한 사례 — redirect_uri 문자열 비교로는 못 잡고, 실제 토큰 교환
요청까지 가봐야 드러나는 문제였다.

---

## 10) useEffect 의존성 배열에 매 렌더마다 새로 만들어지는 함수를 넣어서 API가 수만 번 호출됨

**문제 상황**

주간 골드 계산 페이지에서 로스터·레이드 보상 데이터를 불러오는 `useEffect`에
`[token, clearToken]`을 의존성으로 넣었는데, 브라우저 네트워크 로그를 확인하려고
`read_network_requests`로 `/api/raid-rewards` 호출 건수를 봤더니 이미 159건이 잡혀
있었고, 그 이전에 "33660건의 오래된 요청은 버퍼에서 밀려서 안 보인다"는 안내까지
떠 있었다. 페이지 하나 몇 번 새로고침한 것치고는 비정상적으로 많은 수치였다.

**원인 분석**

`clearToken`은 `useUserToken()` 커스텀 훅이 매 렌더마다 새로 만들어서 반환하는
함수였다(`useCallback`으로 감싸지 않음). 이 함수를 `useEffect`의 의존성 배열에
넣으면, 컴포넌트가 리렌더될 때마다 `clearToken`의 참조값이 바뀌었다고 판단해서
effect가 다시 실행되고, effect 안에서 `fetch` → `setState` → 리렌더 → effect
재실행 → `fetch`...로 이어지는 루프가 생겼다. 화면상으로는 데이터가 정상적으로
보였기 때문에(응답 자체는 매번 200으로 정상 왔으므로) UI만 봐서는 전혀 티가
나지 않았고, 네트워크 요청 로그를 직접 열어보고 나서야 발견했다.

**해결 방법**

같은 프로젝트에서 이미 쓰고 있던 패턴(`my-roster-view.tsx`의 로딩 effect가
`[token]`만 의존성으로 두고 `eslint-disable-next-line react-hooks/exhaustive-deps`로
명시적으로 처리한 것)을 그대로 따라서, `clearToken`을 의존성 배열에서 빼고
`[token]`만 남겼다. `clearToken`은 토큰이 만료됐을 때만 호출되는 콜백이라
effect 재실행 트리거가 될 필요가 없었다.

**결과**

수정 후 `read_network_requests`로 재확인했을 때 요청 건수가 더 이상 늘어나지
않는 것을 확인했다. 화면이 정상으로 보인다고 해서 문제가 없는 게 아니라는 걸
다시 확인한 사례 — 특히 커스텀 훅이 매 렌더마다 새 함수/객체를 반환하는 패턴은
그 반환값을 다른 컴포넌트의 `useEffect` 의존성에 넣을 때 항상 주의가 필요하다.
