# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정 (`bun.lock` 사용). npm/yarn/pnpm 사용 금지.
- 설치: `bun install`
- 개발 (API 서버 + Vite 동시): `bun run dev`
- 테스트 전체: `bun run test` (vitest, jsdom). 감시 모드: `bun run test:watch`
- 단일 테스트: `bunx vitest run server/generator.test.ts`
- 린트: `bun run lint`
- 빌드 (타입체크 포함): `bun run build`

주의: `bun test`는 Bun 내장 러너를 실행하므로 사용하지 않는다. 테스트는 항상 `bun run test`.

## Golden Rules

### Immutable

- 사용자/환경 API 키 값을 클라이언트 응답에 포함하지 마라. `/api/config`는 키 존재 여부(boolean)만 반환한다. 근거: `server/index.ts:133-134`.
- API 키를 코드에 하드코딩하지 마라. 서버는 `process.env`(`.env`)에서 읽는다. 근거: `server/index.ts:60-63`.
- 민감 파일(`.env`, `.env.*`, `*credential*`, `*secret*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*`, `.npmrc`, `.netrc`, `.aws/`, `.ssh/`, `secrets/`)은 읽기·수정·생성 모두 금지다. `cat`, `type`, `Get-Content` 등 셸 우회도 포함한다. 차단 근거: `.claude/settings.json`의 `permissions.deny`. 이 목록을 바꾸거나 완화하지 마라. 환경변수 설정이 필요하면 사용자에게 직접 하도록 안내하라.

### Do's & Don'ts

- AI가 생성한 코드는 `react-live`의 `noInline` 모드로 실행되므로 `render(<Component />)` 호출이 필수다. 이 계약을 바꾸면 시스템 프롬프트(`server/index.ts:13`), `ensureRenderCall`(`server/generator.ts:16`), `LivePreview`(`src/components/LivePreview.tsx:11`)를 함께 수정하라. 셋 중 하나만 바꾸면 미리보기가 빈 화면이 된다.
- 생성 코드는 import 없이 전역 `React`만 사용하는 순수 JavaScript여야 한다 (TypeScript 문법 금지). 근거: `server/index.ts:12,21`. 이 규칙을 완화하지 마라.
- 백엔드 포트 `3002`는 두 곳에 있다: `server/index.ts:121`, `vite.config.ts:11`. 하나를 바꾸면 반드시 같이 바꿔라.
- 프론트엔드는 `/api/*` 상대 경로로만 호출한다 (Vite 프록시 경유). 절대 URL을 하드코딩하지 마라. 근거: `src/hooks/useComponentGenerator.ts:37`.

## Context Map

- **[프론트엔드 수정 (React/Vite)](./src/AGENTS.md)** — 컴포넌트, 훅, 타입, 프론트 테스트 작업 시.
- **[API 서버 수정 (Bun)](./server/AGENTS.md)** — AI 프로바이더 호출, 라우팅, 서버 테스트 작업 시.

## Project Context

- 목표: 프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기와 코드를 제공하는 웹 앱.
- Tech Stack: React 19, TypeScript, Vite, react-live, Bun(API 서버), Vitest, Testing Library, ESLint.

## Standards & References

- 프로젝트 소개/실행 방법은 `README.md` 참조.
- 커밋 메시지: 한국어, `feat|fix|refactor|chore: 요약` 형식. 변경은 논리적 단위로 나눠 커밋한다.
- 새 순수 로직은 부수효과가 없는 모듈로 분리해 단위 테스트를 작성한다 (`server/generator.ts`, `server/fallback.ts` 패턴).
- Maintenance Policy: 이 파일의 규칙과 실제 코드가 어긋나면 작업을 멈추고 AGENTS.md 업데이트를 제안하라.
