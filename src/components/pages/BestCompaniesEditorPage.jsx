// src/components/pages/BestCompaniesEditorPage.jsx — 베스트 기업 순위 입력 (관리자 전용)
// 기업명 · 구분 · 점수를 입력하면 점수 높은 순으로 1~3위는 그래프, 나머지는 이름만 표시됩니다.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import BestRanking, { rankCompanies } from '../best/BestRanking';
import { Alert, Button, Card, FormRow, MemberPage, MemberPageHeader, SectionTitle, Spinner } from '../member/MemberUI';
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, PlusIcon, TrashIcon } from '../member/icons';
import { tempKey } from '../member/ImageDropzone';
import { AWARD_COMPANIES } from '../../data/awardCompanies';

const emptyRow = (patch = {}) => ({ key: tempKey(), name: '', category: '', score: '', ...patch });

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

// 입력 칸의 점수 → 숫자 (쉼표 허용, 비었거나 숫자가 아니면 null)
const toScore = (value) => {
  const text = String(value ?? '').replace(/,/g, '').trim();
  if (text === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

export default function BestCompaniesEditorPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api
      .get('/api/best-companies')
      .then((d) =>
        setForm({
          title: d.title || '',
          basis: d.basis || '',
          unit: d.unit ?? '점',
          // 저장된 순서(점수 높은 순) 그대로 불러옴
          rows: d.companies.map((c) => emptyRow({ name: c.name, category: c.category, score: String(c.score) })),
        }),
      )
      .catch(setLoadError);
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = (fn) => {
    setForm((f) => fn(f));
    setDirty(true);
  };
  const updateRow = (key, patch) => update((f) => ({ ...f, rows: f.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));

  // 미리보기: 기업명과 점수가 모두 들어간 줄만
  const preview = useMemo(
    () =>
      (form?.rows ?? [])
        .map((r) => ({ id: r.key, name: r.name.trim(), category: r.category.trim(), score: toScore(r.score) }))
        .filter((r) => r.name && r.score !== null && r.score >= 0),
    [form],
  );
  const rankByKey = useMemo(() => Object.fromEntries(rankCompanies(preview).map((c) => [c.id, c.rank])), [preview]);

  const usedNames = new Set((form?.rows ?? []).map((r) => r.name.trim()));

  function validate() {
    const e = {};
    const seen = new Map();
    form.rows.forEach((r, i) => {
      const name = r.name.trim();
      const score = toScore(r.score);
      if (!name) e[`${r.key}.name`] = '기업명을 입력해 주세요.';
      else if (seen.has(name)) e[`${r.key}.name`] = `${seen.get(name) + 1}번째 줄과 기업명이 같습니다.`;
      else seen.set(name, i);
      if (score === null) e[`${r.key}.score`] = '점수를 숫자로 입력해 주세요.';
      else if (score < 0) e[`${r.key}.score`] = '0 이상으로 입력해 주세요.';
    });
    return e;
  }

  async function save() {
    setSaveError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setSaveError('빨간색으로 표시된 칸을 확인해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/admin/best-companies', {
        title: form.title.trim(),
        basis: form.basis.trim(),
        unit: form.unit.trim(),
        companies: form.rows.map((r) => ({ name: r.name.trim(), category: r.category.trim(), score: toScore(r.score) })),
      });
      setDirty(false);
      navigate('/best-companies');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const goBack = () => {
    if (dirty && !window.confirm('저장하지 않은 내용이 있습니다. 페이지로 돌아갈까요?')) return;
    navigate('/best-companies');
  };

  const header = (
    <MemberPageHeader
      badge="베스트 기업"
      badgeEn="BEST COMPANIES"
      title="베스트 기업 순위 입력"
      desc="기업별 점수를 입력하면 점수가 높은 순서로 1~3위는 그래프로, 4위부터는 이름만 표시됩니다."
    />
  );

  if (loadError || !form) {
    return (
      <MemberPage width="default">
        {header}
        {loadError ? <Alert tone="danger">{loadError.message}</Alert> : <Spinner label="순위를 불러오는 중입니다" />}
      </MemberPage>
    );
  }

  return (
    <MemberPage width="default">
      {header}

      <Card>
        {saveError && <Alert tone="danger" className="ms-form-alert">{saveError}</Alert>}

        <SectionTitle>표시 설정</SectionTitle>
        <FormRow label="페이지 제목" hint="비워 두면 '베스트 기업' 으로 표시됩니다.">
          <input className="ms-input" maxLength={60} placeholder="예) 2026 베스트 기업" value={form.title} onChange={(e) => update((f) => ({ ...f, title: e.target.value }))} />
        </FormRow>
        <FormRow label="평가 기준" hint="그래프 위에 작게 표시됩니다. (선택)">
          <input className="ms-input" maxLength={200} placeholder="예) 2026년 SRMQ 종합평가 점수 기준" value={form.basis} onChange={(e) => update((f) => ({ ...f, basis: e.target.value }))} />
        </FormRow>
        <FormRow label="점수 단위">
          <input className="ms-input ms-best-unit" maxLength={10} placeholder="점" value={form.unit} onChange={(e) => update((f) => ({ ...f, unit: e.target.value }))} />
        </FormRow>

        <SectionTitle aside={`${form.rows.length}곳`}>기업 · 점수</SectionTitle>
        <p className="ms-hint" style={{ margin: '-6px 0 12px' }}>
          순서는 자동으로 점수 높은 순입니다. 점수가 같으면 이 목록의 위쪽 기업이 먼저 표시되며, 화살표로 바꿀 수 있습니다.
        </p>

        {form.rows.length > 0 && (
          <div className="ms-best-table" role="table" aria-label="기업별 점수">
            <div className="ms-best-row is-head" role="row">
              <span role="columnheader">순위</span>
              <span role="columnheader">기업명</span>
              <span role="columnheader">구분 (수상 부문 등)</span>
              <span role="columnheader">점수</span>
              <span role="columnheader" className="ms-best-tools-head">순서 · 삭제</span>
            </div>
            {form.rows.map((row, i) => (
              <div className="ms-best-row" role="row" key={row.key}>
                <span className="ms-best-rank" role="cell">{rankByKey[row.key] ? `${rankByKey[row.key]}위` : '-'}</span>
                <div role="cell" className={errors[`${row.key}.name`] ? 'has-error' : undefined}>
                  <input
                    className="ms-input"
                    maxLength={80}
                    placeholder="기업명"
                    value={row.name}
                    onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    aria-label={`${i + 1}번째 기업명`}
                    aria-invalid={Boolean(errors[`${row.key}.name`])}
                  />
                  {errors[`${row.key}.name`] && <p className="ms-error">{errors[`${row.key}.name`]}</p>}
                </div>
                <div role="cell">
                  <input
                    className="ms-input"
                    maxLength={60}
                    placeholder="예) 경영품질 대상"
                    value={row.category}
                    onChange={(e) => updateRow(row.key, { category: e.target.value })}
                    aria-label={`${i + 1}번째 구분`}
                  />
                </div>
                <div role="cell" className={errors[`${row.key}.score`] ? 'has-error' : undefined}>
                  <input
                    className="ms-input ms-best-score"
                    inputMode="decimal"
                    placeholder="0"
                    value={row.score}
                    onChange={(e) => updateRow(row.key, { score: e.target.value })}
                    aria-label={`${i + 1}번째 점수`}
                    aria-invalid={Boolean(errors[`${row.key}.score`])}
                  />
                  {errors[`${row.key}.score`] && <p className="ms-error">{errors[`${row.key}.score`]}</p>}
                </div>
                <div className="ms-best-tools" role="cell">
                  <button type="button" className="ms-icon-btn" onClick={() => update((f) => ({ ...f, rows: move(f.rows, i, i - 1) }))} disabled={i === 0} aria-label="위로">
                    <ArrowUpIcon size={14} />
                  </button>
                  <button type="button" className="ms-icon-btn" onClick={() => update((f) => ({ ...f, rows: move(f.rows, i, i + 1) }))} disabled={i === form.rows.length - 1} aria-label="아래로">
                    <ArrowDownIcon size={14} />
                  </button>
                  <button type="button" className="ms-icon-btn is-danger" onClick={() => update((f) => ({ ...f, rows: f.rows.filter((r) => r.key !== row.key) }))} aria-label="삭제">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" icon={<PlusIcon size={15} />} onClick={() => update((f) => ({ ...f, rows: [...f.rows, emptyRow()] }))} className="ms-add-section">
          기업 추가
        </Button>

        <div className="ms-best-quick">
          <p className="ms-best-quick-title">포상갤러리 수상 기업에서 바로 추가</p>
          <div className="ms-chip-list">
            {AWARD_COMPANIES.map((c) => {
              const used = usedNames.has(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  className={`ms-chip${used ? ' is-selected' : ''}`}
                  disabled={used}
                  onClick={() => update((f) => ({ ...f, rows: [...f.rows, emptyRow({ name: c.name, category: c.category })] }))}
                  title={`${c.year}년 · ${c.category}`}
                >
                  {used ? '✓ ' : '+ '}
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card title="미리보기">
        {preview.length ? (
          <BestRanking companies={preview} unit={form.unit.trim()} animate={false} />
        ) : (
          <p className="ms-hint" style={{ margin: 0 }}>기업명과 점수를 입력하면 여기에 순위가 표시됩니다.</p>
        )}
      </Card>

      <div className="ms-actions is-between is-plain ms-editor-actions">
        <div className="ms-actions-group">
          <Button variant="outline" icon={<ArrowLeftIcon size={15} />} onClick={goBack}>베스트 기업으로</Button>
        </div>
        <div className="ms-actions-group">
          <Button variant="deep" onClick={save} loading={saving}>저장하기</Button>
        </div>
      </div>
    </MemberPage>
  );
}
