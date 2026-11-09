// src/components/member/PolicyDocument.jsx
// 이용약관 · 개인정보처리방침 · 환불정책 페이지 공통 틀. 본문 문구는 terms.js 에 있습니다.
import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { POLICY_EFFECTIVE_DATE } from '../../data/siteInfo';
import '../pages/SubpageLayout.css';
import './PolicyDocument.css';

const POLICY_TABS = [
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
  { to: '/refund', label: '환불 · 취소 정책' },
];

// 빈 줄로 나눈 덩어리: 첫 줄은 제목, '- ' 는 목록, '|' 는 표(첫 줄 머리글), 나머지는 문단
function parseBlocks(text) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const [title, ...lines] = block.split('\n');
      const parts = [];
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        const last = parts[parts.length - 1];
        if (line.startsWith('|')) {
          const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
          if (last?.type === 'table') last.rows.push(cells);
          else parts.push({ type: 'table', head: cells, rows: [] });
        } else if (line.startsWith('- ')) {
          if (last?.type === 'list') last.items.push(line.slice(2));
          else parts.push({ type: 'list', items: [line.slice(2)] });
        } else {
          parts.push({ type: 'p', text: line });
        }
      }
      return { title: title.trim(), parts };
    });
}

export default function PolicyDocument({ badge, badgeEn, title, desc, text }) {
  const blocks = parseBlocks(text);
  return (
    <div className="subpage-container">
      <div className="subpage-content">
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">{badge}</span>
            <span className="subpage-badge-en">{badgeEn}</span>
          </div>
          <h1 className="subpage-title">{title}</h1>
          <p className="subpage-desc">
            {desc} 시행일: {POLICY_EFFECTIVE_DATE}
          </p>
        </header>

        <nav className="policy-tabs" aria-label="약관 및 정책">
          {POLICY_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `policy-tab${isActive ? ' is-active' : ''}`}>
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <article className="policy-doc">
          {blocks.map((block) => (
            <section key={block.title} className="policy-section">
              <h2 className="policy-section-title">{block.title}</h2>
              {block.parts.map((part, i) => (
                <Fragment key={i}>
                  {part.type === 'p' && <p className="policy-p">{part.text}</p>}
                  {part.type === 'list' && (
                    <ul className="policy-list">
                      {part.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {part.type === 'table' && (
                    <div className="policy-table-wrap">
                      <table className="policy-table">
                        <thead>
                          <tr>
                            {part.head.map((cell) => (
                              <th key={cell}>{cell}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {part.rows.map((row) => (
                            <tr key={row.join('|')}>
                              {row.map((cell, j) => (
                                <td key={j} data-label={part.head[j]}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Fragment>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
