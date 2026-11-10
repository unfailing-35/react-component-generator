import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readStorage,
  writeStorage,
  parseProvider,
  parseHistory,
  parseComponents,
  addToHistory,
  MAX_HISTORY,
} from './persistence';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('readStorage', () => {
  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(readStorage('k', parseHistory, ['x'])).toEqual(['x']);
  });

  it('저장된 JSON이 깨져 있으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{not json');
    expect(readStorage('k', parseHistory, [])).toEqual([]);
  });

  it('parse가 undefined를 반환하면 fallback을 반환한다', () => {
    localStorage.setItem('k', JSON.stringify('nope'));
    expect(readStorage('k', parseHistory, ['fb'])).toEqual(['fb']);
  });

  it('유효한 값은 parse 결과를 반환한다', () => {
    localStorage.setItem('k', JSON.stringify(['a', 'b']));
    expect(readStorage('k', parseHistory, [])).toEqual(['a', 'b']);
  });
});

describe('writeStorage', () => {
  it('값을 JSON으로 저장한다', () => {
    writeStorage('k', { a: 1 });
    expect(localStorage.getItem('k')).toBe('{"a":1}');
  });

  it('저장소가 예외를 던져도 무시한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => writeStorage('k', 1)).not.toThrow();
  });
});

describe('parseProvider', () => {
  it('허용된 값은 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
  });

  it('허용되지 않은 값은 undefined다', () => {
    expect(parseProvider('openai')).toBeUndefined();
    expect(parseProvider(1)).toBeUndefined();
  });
});

describe('parseHistory', () => {
  it('문자열 배열이 아니면 undefined다', () => {
    expect(parseHistory({})).toBeUndefined();
  });

  it('문자열이 아닌 항목은 걸러낸다', () => {
    expect(parseHistory(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });
});

describe('parseComponents', () => {
  const valid = { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-01T00:00:00.000Z' };

  it('createdAt을 Date로 복원한다', () => {
    const [component] = parseComponents([valid])!;
    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.createdAt.toISOString()).toBe(valid.createdAt);
  });

  it('형식이 틀린 항목은 걸러낸다', () => {
    const result = parseComponents([valid, { id: '2' }, null, { ...valid, createdAt: 'nope' }]);
    expect(result).toHaveLength(1);
  });

  it('배열이 아니면 undefined다', () => {
    expect(parseComponents('x')).toBeUndefined();
  });
});

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 맨 앞으로 옮기고 하나만 남긴다', () => {
    expect(addToHistory(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지한다`, () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const result = addToHistory(full, 'new');
    expect(result).toHaveLength(MAX_HISTORY);
    expect(result[0]).toBe('new');
  });
});
