import { describe, it, expect } from 'vitest';
import { relayStream } from './streaming';
import { anthropicDelta } from './sse';

function sseBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

const textEvent = (text: string) =>
  `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text } })}\n\n`;

async function collect(iter: AsyncIterable<object>) {
  const out: object[] = [];
  for await (const e of iter) out.push(e);
  return out;
}

describe('relayStream', () => {
  it('텍스트 조각마다 delta 이벤트를 내보낸다', async () => {
    const events = await collect(relayStream(sseBody([textEvent('const A'), textEvent(' = 1;')]), anthropicDelta));
    expect(events.slice(0, 2)).toEqual([
      { type: 'delta', text: 'const A' },
      { type: 'delta', text: ' = 1;' },
    ]);
  });

  it('마지막에 코드펜스를 제거하고 render를 보장한 done 이벤트를 내보낸다', async () => {
    const events = await collect(
      relayStream(sseBody([textEvent('```jsx\nconst Card = () => null;\n'), textEvent('```')]), anthropicDelta),
    );
    expect(events.at(-1)).toEqual({ type: 'done', code: 'const Card = () => null;\n\nrender(<Card />);' });
  });

  it('이벤트 경계가 청크 중간에서 갈려도 올바르게 조립한다', async () => {
    const whole = textEvent('hello');
    const events = await collect(relayStream(sseBody([whole.slice(0, 20), whole.slice(20)]), anthropicDelta));
    expect(events[0]).toEqual({ type: 'delta', text: 'hello' });
  });

  it('extract가 던지면 error 이벤트로 끝낸다', async () => {
    const boom = () => {
      throw new Error('절단됨');
    };
    const events = await collect(relayStream(sseBody(['data: {}\n\n']), boom));
    expect(events).toEqual([{ type: 'error', error: '절단됨' }]);
  });
});
