# server/AGENTS.md

## Module Context

Bun 런타임 위에서 `Bun.serve`로 동작하는 AI API 프록시 서버(포트 3002). Vite 프록시를 통해 프론트엔드가 호출한다.

## Tech Stack & Constraints

- 런타임은 Bun이다. Node 전용 서버 코드(express 등)를 추가하지 마라.
- HTTP 호출은 전역 `fetch`만 사용한다. SDK/axios를 추가하지 않는다 (`server/index.ts:72,98`).
- 엔드포인트: `GET /api/config`, `POST /api/generate`. 모든 응답에 `CORS_HEADERS`를 붙인다 (`server/index.ts:52-56`).
- `POST /api/generate`는 성공 시 `application/x-ndjson` 스트림을 반환한다. 한 줄이 하나의 이벤트(`{type:'delta',text}` → … → `{type:'done',code}` 또는 `{type:'error',error}`)이며, 클라이언트 타입(`src/utils/stream.ts`의 `StreamEvent`)과 같은 모양이어야 한다 (`server/streaming.ts:5-8`).

## Implementation Patterns

- 부수효과 없는 순수 함수는 `generator.ts`, `fallback.ts`, `sse.ts`(업스트림 SSE 파싱·델타 추출), `streaming.ts`(`relayStream`: SSE → 클라이언트 이벤트 변환)에 두고, `index.ts`는 서버 부팅과 라우팅만 담당한다 (`server/generator.ts:1-2`).
- 스트림 시작 전 에러 응답 형식은 `{ error: string }` JSON이다. 503/429는 한국어 사용자 메시지로 변환하고 나머지는 원문 메시지를 500으로 반환한다 (`server/index.ts:190-211`). 상태 코드 판별은 에러 메시지 문자열(`API error: <status>`)에 의존하므로, 업스트림 에러 메시지 형식(`server/index.ts:89,109`)을 바꾸면 이 분기가 깨진다.
- 스트림이 시작된 뒤의 에러는 HTTP 200 안에서 `{type:'error'}` 이벤트로 전달된다 (`server/streaming.ts:34-37`). 이 경우 위 503/429 변환을 거치지 않는다.

## Testing Strategy

- 실행: `bunx vitest run server/`
- 테스트 대상은 순수 모듈(`generator.test.ts`, `fallback.test.ts`, `sse.test.ts`, `streaming.test.ts`)이다. `index.ts`는 `Bun.serve`를 import 시점에 실행하므로 테스트에서 import하지 마라. 테스트가 필요한 로직은 순수 모듈로 분리한다.

## Local Golden Rules

- Google 호출은 Gemini 키가 URL 쿼리스트링에 포함된다 (`server/index.ts:96`). 이 URL을 에러 메시지, 로그, 응답에 절대 포함하지 마라. 현재 에러는 상태 코드만 담는다 (`server/index.ts:109`).
- 비대칭 주의: Google 경로에만 모델 폴백(`GOOGLE_MODELS`, `server/index.ts:6,117`)과 `MAX_TOKENS` 절단 검사(`googleDelta`, `server/sse.ts:36`)가 있고, Anthropic 경로(`callAnthropic`)에는 없다. 한쪽에 로직을 추가할 때 다른 쪽 필요 여부를 확인하라.
- 모델 폴백은 스트림 연결 단계(응답 상태 확인)에서만 동작한다. 스트림이 시작된 뒤 실패하면 다른 모델로 재시도하지 않고 `error` 이벤트로 끝난다.
- 폴백 모델 배열은 우선순위 순서다 (`server/index.ts:5`). 순서를 임의로 바꾸지 마라.
- 최종 `done` 이벤트의 코드는 반드시 `ensureRenderCall(stripCodeFences(full))`를 거친다 (`server/streaming.ts:40`). 모델이 시스템 프롬프트를 어겨도 미리보기가 동작하도록 하는 이중 방어이므로 제거하지 마라. `delta`는 가공 전 원문이므로 미리보기 실행에 쓰지 마라.
- 클라이언트 키가 환경 키보다 우선한다 (`server/index.ts:66`). 이 순서를 유지하라.
