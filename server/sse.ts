// 업스트림 SSE 스트림을 해석하는 순수 함수들. 부수효과가 없어 단위 테스트가 가능하다.

/** 버퍼에서 완성된 SSE 이벤트의 data 페이로드를 꺼내고, 미완성 꼬리는 rest로 돌려준다. */
export function parseSseBuffer(buffer: string): { payloads: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';
  const payloads: string[] = [];

  for (const block of blocks) {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (data) payloads.push(data);
  }
  return { payloads, rest };
}

/** Anthropic 스트림 이벤트에서 텍스트 조각을 추출한다. */
export function anthropicDelta(json: string): string {
  const event = JSON.parse(json) as { type?: string; delta?: { type?: string; text?: string } };
  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return event.delta.text ?? '';
  }
  return '';
}

/** Gemini 스트림 청크에서 텍스트 조각을 추출한다. */
export function googleDelta(json: string): string {
  const chunk = JSON.parse(json) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  };
  const candidate = chunk.candidates?.[0];
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.');
  }
  return candidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
}
