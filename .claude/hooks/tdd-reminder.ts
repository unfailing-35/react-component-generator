// PreToolUse 훅: 파일을 생성/수정하기 전에 .claude/rules/tdd.md 규칙을 상기시키는 컨텍스트를 주입한다.
// 차단하지 않고 additionalContext만 추가한다.

const reminder = [
  "[TDD 리마인더] 코드를 쓰기 전에 .claude/rules/tdd.md 규칙(Rigid)을 지켰는지 확인하라.",
  "- 비즈니스 로직/API/유틸/버그 수정이면 프로덕션 코드보다 실패하는 테스트가 먼저다.",
  "- RED: 하나의 동작 = 하나의 테스트. 반드시 실행해서 '기능 미구현' 사유로 실패함을 확인했는가?",
  "- GREEN: 테스트를 통과시키는 최소한의 코드만 작성한다 (YAGNI). 전체 테스트를 실행해 확인한다.",
  "- REFACTOR: 새 동작 없이 green을 유지한 채로만 정리한다.",
  "- 테스트보다 프로덕션 코드를 먼저 썼다면 그 코드를 삭제하고 RED부터 다시 시작한다. 주석 처리/보관 금지.",
  "- 타입 정의·설정 파일·순수 UI는 TDD 불필요. 경계가 모호하면 적용 대상으로 간주한다.",
].join("\n");

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: reminder,
    },
  }),
);
