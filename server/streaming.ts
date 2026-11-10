// 업스트림 SSE 본문을 클라이언트용 이벤트(delta/done/error)로 변환하는 순수 로직.
import { stripCodeFences, ensureRenderCall } from './generator';
import { parseSseBuffer } from './sse';

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; error: string };

export async function* relayStream(
  body: ReadableStream<Uint8Array>,
  extractDelta: (payload: string) => string,
): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;
      for (const payload of parsed.payloads) {
        const text = extractDelta(payload);
        if (text) {
          full += text;
          yield { type: 'delta', text };
        }
      }
    }
  } catch (err) {
    yield { type: 'error', error: err instanceof Error ? err.message : 'Unknown error' };
    return;
  }

  // 모델이 시스템 프롬프트를 어겨도 미리보기가 동작하도록 하는 이중 방어 (server/AGENTS.md)
  yield { type: 'done', code: ensureRenderCall(stripCodeFences(full)) };
}
