// PreToolUse 훅: `git commit` 실행 전에 전체 테스트를 돌리고, 하나라도 실패하면 커밋을 차단한다.
// 차단은 exit code 2 + stderr 메시지로 Claude에게 전달된다.

const input = JSON.parse(await Bun.stdin.text());
const command: string = input?.tool_input?.command ?? "";

const isGitCommit = /\bgit\s+(?:-\S+\s+(?:\S+\s+)?)*commit\b/.test(command);
if (!isGitCommit) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const result = Bun.spawnSync(["bun", "run", "test"], {
  cwd,
  stdout: "pipe",
  stderr: "pipe",
});

if (result.exitCode === 0) process.exit(0);

const output = `${result.stdout.toString()}\n${result.stderr.toString()}`.trim();
console.error(
  `테스트가 실패해 커밋을 차단했습니다. 테스트를 통과시킨 뒤 다시 커밋하세요.\n\n${output.slice(-3000)}`,
);
process.exit(2);
