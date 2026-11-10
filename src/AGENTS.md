# src/AGENTS.md

## Module Context

Vite + React 19 프론트엔드. 상태와 `/api/*` 호출은 `App.tsx`와 `hooks/useComponentGenerator.ts`가 담당하고, `components/`는 표시 중심이다.

## Tech Stack & Constraints

- 브라우저 전용 코드다. `Bun`/Node API(`process`, `Bun.*`)를 사용하지 마라. `tsconfig.app.json`의 `types`는 `vite/client`뿐이다 (`tsconfig.app.json:7`).
- 타입 전용 import는 반드시 `import type`을 쓴다 (`verbatimModuleSyntax`, `tsconfig.app.json:13`). 예: `src/App.tsx:5`.
- `enum`, `namespace`, 생성자 파라미터 프로퍼티 등 비-erasable 문법 금지 (`erasableSyntaxOnly`, `tsconfig.app.json:22`).
- 미사용 변수/파라미터는 빌드 에러다 (`noUnusedLocals`, `noUnusedParameters`, `tsconfig.app.json:20-21`).
- 스타일은 클래스명 + `App.css`/`index.css` 방식이다. CSS-in-JS, UI 라이브러리를 추가하지 마라 (의존성에 없음: `package.json`).

## Implementation Patterns

- 컴포넌트: `components/<PascalCase>.tsx`에서 named export, props는 같은 파일의 `interface <Name>Props`로 선언 (`src/components/CodeView.tsx:3-5`).
- 공용 타입은 `types/index.ts`에 둔다. 서버의 `Provider` 타입은 별도로 정의되어 있으므로(`server/index.ts:57`), 프로바이더를 추가하면 `src/types/index.ts`, `App.tsx`의 `PROVIDER_CONFIG`(`src/App.tsx:8-11`), 서버를 함께 수정한다.
- 사용자에게 보이는 문구는 한국어다 (`src/App.tsx`, `src/components/*`).
- 비동기 서버 호출은 `useComponentGenerator` 훅에 모은다. 컴포넌트에서 `/api/generate`를 직접 `fetch`하지 마라 (`src/hooks/useComponentGenerator.ts:18-49`). 예외로 `/api/config` 조회만 `App.tsx:25`에 있다.

## Testing Strategy

- 실행: `bunx vitest run src/`. 환경은 jsdom, 설정은 `src/test/setup.ts` (jest-dom 매처, 테스트마다 `cleanup`).
- 테스트 파일은 대상 옆에 `<Name>.test.tsx`로 둔다 (`src/components/PromptInput.test.tsx`).
- 쿼리는 접근성 역할 + 한국어 이름을 쓴다 (예: `getByRole('button', { name: '컴포넌트 생성' })`, `PromptInput.test.tsx:9`). 버튼 문구를 바꾸면 테스트도 같이 고친다.
- 테스트 경계: 현재 `PromptInput`만 테스트가 있다. `App`, `ComponentCard`, `CodeView`, `LivePreview`, `useComponentGenerator`에는 없다. 이 파일들을 수정하면 변경 동작에 대한 테스트를 함께 추가하라.

## Local Golden Rules

- API 키는 사용자 요청으로 `localStorage`(`rcg:apiKey`)에 영속화한다 (`src/App.tsx`의 `usePersistentState`). 서버 전송은 훅의 요청 body로만 한다 (`src/hooks/useComponentGenerator.ts`). 로그, URL 쿼리, 쿠키에는 저장하지 마라. 같은 origin의 스크립트가 읽을 수 있으므로 `LivePreview` scope 규칙을 반드시 지켜라.
- 프로바이더를 바꾸면 입력된 키를 비운다 (`src/App.tsx:41-44`). 다른 회사의 키가 잘못 전송되는 것을 막는 동작이므로 유지하라.
- 키 입력이 비어 있고 서버에 환경 키도 없으면 요청 전에 막는다 (`src/App.tsx:33-37`). 서버의 400 검사(`server/index.ts`)와 이중 방어이므로 한쪽만 제거하지 마라.
- `LivePreview`에 `scope`를 추가하지 마라. 미리보기는 AI가 만든 코드를 페이지 안에서 직접 실행하며(`src/components/LivePreview.tsx:11`), 현재는 전역 `React`만 노출한다. API 키나 앱 내부 값을 scope로 넘기면 생성 코드가 접근할 수 있다.
- 미리보기 "새로고침"은 `key`를 바꿔 `LivePreview`를 리마운트하는 방식이다 (`src/components/ComponentCard.tsx:17,33,74`). `code`를 변경하는 방식으로 바꾸지 마라.
