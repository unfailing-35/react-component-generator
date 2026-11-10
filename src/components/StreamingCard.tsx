import { useEffect, useRef } from 'react';

interface StreamingCardProps {
  prompt: string;
  code: string;
}

// 생성 중에는 코드 탭만 활성화해 LLM 응답을 실시간으로 보여준다.
// 완료되면 App이 이 카드를 ComponentCard(기본 탭: 미리보기)로 교체한다.
export function StreamingCard({ prompt, code }: StreamingCardProps) {
  const blockRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const block = blockRef.current;
    if (block) block.scrollTop = block.scrollHeight;
  }, [code]);

  return (
    <div className="window component-card streaming-card">
      <div className="titlebar">
        <span>생성 중</span>
      </div>
      <div className="card-header">
        <p className="card-prompt">{prompt}</p>
      </div>
      <div className="card-tabs" role="tablist">
        <button role="tab" aria-selected={false} className="tab" disabled>
          미리보기
        </button>
        <button role="tab" aria-selected={true} className="tab tab--active">
          코드
        </button>
      </div>
      <div className="card-content" role="tabpanel">
        <div className="code-panel">
          {code ? (
            <pre className="code-block" ref={blockRef}>
              <code>{code}</code>
              <span className="stream-cursor" aria-hidden="true" />
            </pre>
          ) : (
            <p className="stream-waiting" role="status">
              코드를 생성하고 있습니다...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
