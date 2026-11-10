import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingCard } from './StreamingCard';

describe('StreamingCard', () => {
  it('코드 탭이 선택된 상태로 스트리밍 중인 코드를 보여준다', () => {
    render(<StreamingCard prompt="버튼 만들기" code="const A = () => null;" />);
    expect(screen.getByRole('tab', { name: '코드' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('const A = () => null;')).toBeInTheDocument();
  });

  it('생성이 끝나기 전에는 미리보기 탭이 비활성화된다', () => {
    render(<StreamingCard prompt="버튼 만들기" code="" />);
    expect(screen.getByRole('tab', { name: '미리보기' })).toBeDisabled();
  });

  it('프롬프트를 보여준다', () => {
    render(<StreamingCard prompt="버튼 만들기" code="" />);
    expect(screen.getByText('버튼 만들기')).toBeInTheDocument();
  });

  it('코드가 아직 없으면 대기 문구를 보여준다', () => {
    render(<StreamingCard prompt="p" code="" />);
    expect(screen.getByRole('status')).toHaveTextContent('코드를 생성하고 있습니다');
  });
});
