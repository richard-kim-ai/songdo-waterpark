import { Fragment } from 'react';

/** 줄바꿈(\n)이 포함된 문자열을 <br />로 구분된 JSX로 렌더링 */
export function renderLines(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}
