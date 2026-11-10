import { describe, it, expect } from 'vitest';
import { parseSseBuffer, anthropicDelta, googleDelta } from './sse';

describe('parseSseBuffer', () => {
  it('완성된 이벤트의 data 페이로드를 추출한다', () => {
    const { payloads, rest } = parseSseBuffer('data: {"a":1}\n\ndata: {"a":2}\n\n');
    expect(payloads).toEqual(['{"a":1}', '{"a":2}']);
    expect(rest).toBe('');
  });

  it('끝나지 않은 이벤트는 rest로 남긴다', () => {
    const { payloads, rest } = parseSseBuffer('data: {"a":1}\n\ndata: {"a"');
    expect(payloads).toEqual(['{"a":1}']);
    expect(rest).toBe('data: {"a"');
  });

  it('CRLF 구분자도 처리한다', () => {
    const { payloads } = parseSseBuffer('event: x\r\ndata: hi\r\n\r\n');
    expect(payloads).toEqual(['hi']);
  });
});

describe('anthropicDelta', () => {
  it('content_block_delta의 text_delta 텍스트를 반환한다', () => {
    const json = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'abc' } });
    expect(anthropicDelta(json)).toBe('abc');
  });

  it('텍스트 이벤트가 아니면 빈 문자열을 반환한다', () => {
    expect(anthropicDelta(JSON.stringify({ type: 'message_start' }))).toBe('');
  });
});

describe('googleDelta', () => {
  it('candidates의 parts 텍스트를 이어 붙인다', () => {
    const json = JSON.stringify({ candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] });
    expect(googleDelta(json)).toBe('ab');
  });

  it('텍스트가 없으면 빈 문자열을 반환한다', () => {
    expect(googleDelta(JSON.stringify({ candidates: [{}] }))).toBe('');
  });

  it('finishReason이 MAX_TOKENS면 절단 에러를 던진다', () => {
    const json = JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS' }] });
    expect(() => googleDelta(json)).toThrow('너무 길어 잘렸습니다');
  });
});
