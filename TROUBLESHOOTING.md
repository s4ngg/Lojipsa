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
