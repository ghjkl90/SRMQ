// src/components/best/BestRanking.jsx
// 베스트 기업 순위: 1~3위는 막대가 솟아오르는 시상대, 4위부터는 이름만 표시합니다.
// 베스트 기업 페이지와 관리자 입력 화면의 미리보기에서 함께 씁니다.
import { useEffect, useRef, useState } from 'react';
import './BestRanking.css';

const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
export const formatScore = (value) => numberFormat.format(value);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 점수 높은 순으로 정렬하고 순위를 매깁니다. 같은 점수는 같은 순위(1, 1, 3 …), 순서는 입력 순서 유지 */
export function rankCompanies(companies) {
  const sorted = companies
    .map((c, index) => ({ ...c, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return sorted.map((c, i) => ({
    ...c,
    rank: i > 0 && sorted[i - 1].score === c.score ? sorted.findIndex((x) => x.score === c.score) + 1 : i + 1,
  }));
}

// 막대 높이: 1~3위 점수 차이를 50%~100% 높이로 펼쳐서, 점수가 비슷해도 1위가 확실히 높게 보이도록
// (같은 점수는 같은 높이)
const barRatio = (score, max, min) => (max > min ? 0.5 + 0.5 * ((score - min) / (max - min)) : 1);

// 3위 → 2위 → 1위 순서로 솟아오름 (초)
const TIMING = {
  1: { delay: 0.5, duration: 1.1 },
  2: { delay: 0.25, duration: 0.9 },
  3: { delay: 0, duration: 0.8 },
};

function CountUp({ value, start, delay, duration }) {
  const [shown, setShown] = useState(start ? 0 : value);
  useEffect(() => {
    if (!start || prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    let frame;
    let begin;
    const tick = (now) => {
      begin ??= now + delay * 1000;
      const t = Math.min(1, Math.max(0, (now - begin) / (duration * 1000)));
      const eased = 1 - (1 - t) ** 3;
      setShown(t >= 1 ? value : value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, start, delay, duration]);
  return formatScore(Number.isInteger(value) ? Math.round(shown) : Math.round(shown * 100) / 100);
}

export default function BestRanking({ companies, unit = '점', animate = true }) {
  const ranked = rankCompanies(companies);
  const podium = ranked.slice(0, 3);
  const others = ranked.slice(3);
  const max = podium[0]?.score ?? 0;
  const min = podium[podium.length - 1]?.score ?? 0;

  const ref = useRef(null);
  const [visible, setVisible] = useState(!animate);

  // 화면에 보일 때 한 번 솟아오름
  useEffect(() => {
    if (!animate) return undefined;
    const el = ref.current;
    let frame;
    let io;
    const show = () => {
      setVisible(true);
      io?.disconnect();
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      show();
      return undefined;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      // 이미 화면 안: 처음 모습(막대 0)을 한 번 그린 다음 프레임에 시작해야 솟아오르는 움직임이 보임
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(show);
      });
    } else {
      // 아래쪽에 있으면 스크롤해서 보일 때 시작
      io = new IntersectionObserver(([entry]) => entry.isIntersecting && show(), { threshold: 0.2 });
      io.observe(el);
    }
    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
    };
  }, [animate]);

  return (
    <div className="best-rank">
      {podium.length > 0 && (
        <ol
          ref={ref}
          className={`best-podium is-count-${podium.length}${animate ? ' is-animated' : ''}${visible ? ' is-visible' : ''}`}
          aria-label="1위부터 3위까지"
        >
          {podium.map((c, i) => {
            const place = i + 1; // 화면 자리 (1 = 가운데)
            const { delay, duration } = TIMING[place];
            return (
              <li
                key={c.id ?? c.name}
                className={`best-podium-col is-place-${place}`}
                style={{
                  '--ratio': barRatio(c.score, max, min),
                  '--delay': `${delay}s`,
                  '--duration': `${duration}s`,
                }}
              >
                <div className="best-podium-head">
                  <span className={`best-medal is-rank-${Math.min(c.rank, 3)}`} aria-hidden="true">{c.rank}</span>
                  <strong className="best-podium-name">
                    <span className="best-sr-only">{c.rank}위 </span>
                    {c.name}
                  </strong>
                  {c.category && <span className="best-podium-cat">{c.category}</span>}
                  <span className="best-podium-score">
                    <CountUp value={c.score} start={animate && visible} delay={delay} duration={duration} />
                    {unit && <small>{unit}</small>}
                  </span>
                </div>
                <div className="best-podium-bar" aria-hidden="true">
                  <span className="best-podium-rank">{c.rank}위</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {others.length > 0 && (
        <section className="best-others" aria-label="4위 이하">
          <h3 className="best-others-title">그 외 베스트 기업</h3>
          <ol className="best-others-list" start={4}>
            {others.map((c) => (
              <li key={c.id ?? c.name}>{c.name}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
