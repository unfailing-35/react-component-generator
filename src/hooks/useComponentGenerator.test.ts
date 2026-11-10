import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/persistence';

function stubStream(events: object[], holdOpen?: Promise<void>) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      if (holdOpen) await holdOpen;
      controller.close();
    },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }));
}

const stored = { id: 'a', prompt: '저장된 프롬프트', code: 'render(<div />)', createdAt: '2026-01-01T00:00:00.000Z' };

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useComponentGenerator 영속화', () => {
  it('localStorage에 저장된 컴포넌트 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([stored]));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('생성에 성공하면 목록이 localStorage에 저장된다', async () => {
    stubStream([{ type: 'done', code: 'render(<p />)' }]);
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('새 프롬프트', undefined, 'google'));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ prompt: '새 프롬프트', code: 'render(<p />)' });
  });

  it('컴포넌트를 삭제하면 저장된 목록에서도 사라진다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([stored]));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.removeComponent('a'));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!)).toEqual([]);
  });

  it('전체 삭제하면 저장된 목록도 비워진다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([stored]));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!)).toEqual([]);
  });
});

describe('useComponentGenerator 스트리밍', () => {
  it('델타를 받는 동안 streamingCode에 코드가 누적된다', async () => {
    let release!: () => void;
    stubStream(
      [{ type: 'delta', text: 'const A' }, { type: 'delta', text: ' = 1;' }],
      new Promise<void>((resolve) => (release = resolve)),
    );
    const { result } = renderHook(() => useComponentGenerator());

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.generate('p', undefined, 'google');
    });
    await waitFor(() => expect(result.current.streamingCode).toBe('const A = 1;'));
    expect(result.current.isLoading).toBe(true);

    release();
    await act(() => pending);
  });

  it('done 이벤트의 코드로 컴포넌트를 추가하고 streamingCode를 비운다', async () => {
    stubStream([{ type: 'delta', text: 'raw' }, { type: 'done', code: 'final' }]);
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('p', undefined, 'google'));

    expect(result.current.components[0].code).toBe('final');
    expect(result.current.streamingCode).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('error 이벤트를 받으면 error를 설정하고 컴포넌트를 추가하지 않는다', async () => {
    stubStream([{ type: 'delta', text: 'x' }, { type: 'error', error: '실패' }]);
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('p', undefined, 'google'));

    expect(result.current.error).toBe('실패');
    expect(result.current.components).toHaveLength(0);
    expect(result.current.streamingCode).toBe('');
  });

  it('HTTP 오류 응답이면 JSON의 error 메시지를 보여준다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Prompt is required' }) }),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('p', undefined, 'google'));

    expect(result.current.error).toBe('Prompt is required');
  });
});
