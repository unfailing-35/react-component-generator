import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEYS } from './utils/persistence';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/config') {
        return { ok: true, json: async () => ({ envKeys: { anthropic: false, google: false } }) };
      }
      return { ok: true, json: async () => ({ code: 'render(<p />)' }) };
    }),
  );
});

const providerSelect = () => screen.getByLabelText('AI 제공자');
const apiKeyInput = () => screen.getByLabelText('API 키');

describe('App 영속화', () => {
  it('저장된 Provider를 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('anthropic'));
    render(<App />);
    expect(providerSelect()).toHaveValue('anthropic');
  });

  it('저장된 값이 허용되지 않은 Provider면 기본값(google)을 쓴다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('openai'));
    render(<App />);
    expect(providerSelect()).toHaveValue('google');
  });

  it('Provider를 바꾸면 선택이 저장된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(providerSelect(), 'anthropic');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.provider)!)).toBe('anthropic');
  });

  it('저장된 API 키를 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('AIza-saved'));
    render(<App />);
    expect(apiKeyInput()).toHaveValue('AIza-saved');
  });

  it('API 키를 입력하면 저장된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(apiKeyInput(), 'AIza-typed');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.apiKey)!)).toBe('AIza-typed');
  });

  it('Provider를 바꾸면 입력된 키가 비워지고 저장된 키도 지워진다', async () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('AIza-saved'));
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(providerSelect(), 'anthropic');

    expect(apiKeyInput()).toHaveValue('');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.apiKey)!)).toBe('');
  });

  it('저장된 컴포넌트 목록을 복원해 개수를 보여준다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: 'a', prompt: '카드', code: 'render(<p />)', createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    );
    render(<App />);
    expect(screen.getByText('생성한 컴포넌트: 1개')).toBeInTheDocument();
  });
});

describe('App 프롬프트 히스토리', () => {
  it('저장된 히스토리를 최근 프롬프트로 보여주고 클릭하면 입력창에 채운다', async () => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(['이전 프롬프트']));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '이전 프롬프트' }));

    expect(screen.getByRole('textbox', { name: '프롬프트' })).toHaveValue('이전 프롬프트');
  });

  it('생성을 요청하면 프롬프트가 히스토리에 저장된다', async () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('AIza-saved'));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: '프롬프트' }), '새 카드');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!)).toEqual(['새 카드']),
    );
  });
});
