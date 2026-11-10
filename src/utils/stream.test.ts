import { describe, it, expect } from 'vitest';
import { parseNdjsonBuffer } from './stream';

describe('parseNdjsonBuffer', () => {
  it('완성된 줄을 JSON 이벤트로 파싱한다', () => {
    const { events, rest } = parseNdjsonBuffer('{"type":"delta","text":"a"}\n{"type":"done","code":"x"}\n');
    expect(events).toEqual([
      { type: 'delta', text: 'a' },
      { type: 'done', code: 'x' },
    ]);
    expect(rest).toBe('');
  });

  it('끝나지 않은 줄은 rest로 남긴다', () => {
    const { events, rest } = parseNdjsonBuffer('{"type":"delta","text":"a"}\n{"type":"de');
    expect(events).toHaveLength(1);
    expect(rest).toBe('{"type":"de');
  });
});
