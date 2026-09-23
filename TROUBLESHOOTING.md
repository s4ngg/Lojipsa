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
