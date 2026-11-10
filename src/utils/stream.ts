// /api/generate 스트림(NDJSON)을 해석하는 순수 함수.

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; error: string };

/** 버퍼에서 완성된 줄을 이벤트로 파싱하고, 미완성 꼬리는 rest로 돌려준다. */
export function parseNdjsonBuffer(buffer: string): { events: StreamEvent[]; rest: string } {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const events = lines.filter((line) => line.trim()).map((line) => JSON.parse(line) as StreamEvent);
  return { events, rest };
}
