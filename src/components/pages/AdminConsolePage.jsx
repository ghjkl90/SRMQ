// src/components/pages/AdminConsolePage.jsx — 관리자 콘솔 (입금 확인 · 결제 내역 · 회원 관리 · 포상갤러리)
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, apiUrl } from '../../api/client';
import { useMembershipPlans } from '../../hooks/useMembershipPlans';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DataTable,
  FormRow,
  MemberPage,
  MemberPageHeader,
  MembershipStatusBadge,
  OrderStatusBadge,
  Pagination,
  PlanBadge,
  Spinner,
} from '../member/MemberUI';
import { BankIcon, DownloadIcon, ImageIcon, PlusIcon, ReceiptIcon, RefreshIcon, UserIcon } from '../member/icons';
import { METHOD_LABEL, ORDER_STATUS, formatDate, formatDateTime, formatWon } from '../member/membership';

const TABS = [
  { key: 'deposits', label: '입금 확인', icon: <BankIcon size={15} /> },
  { key: 'payments', label: '결제 내역', icon: <ReceiptIcon size={15} /> },
  { key: 'members', label: '회원 관리', icon: <UserIcon size={15} /> },
  { key: 'gallery', label: '포상갤러리', icon: <ImageIcon size={15} /> },
];

const memberCell = (o) => (
  <span>
    <span className="ms-cell-main">{o.user?.companyName || o.user?.name}</span>
    <span className="ms-cell-sub">{o.user?.companyName ? `${o.user.name} · ` : ''}{o.user?.email}</span>
  </span>
);

const orderCell = (o) => (
  <span>
    <span className="ms-cell-main">{o.orderName}</span>
    <span className="ms-cell-sub ms-mono">{o.orderNo}</span>
  </span>
);

function receiptText(o) {
  if (!o.receiptType || o.receiptType === 'NONE') return '-';
  const info = o.receiptInfo || {};
  if (o.receiptType === 'CASH_RECEIPT') return `현금영수증 ${info.purpose === 'EXPENSE_PROOF' ? '(지출증빙)' : '(소득공제)'} ${info.identifier || ''}`;
  return `세금계산서 ${info.businessNo || ''} ${info.email || ''}`;
}

/* ------------------------------ 입금 확인 ------------------------------ */
function DepositsTab({ onChanged }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null); // { order, action: 'confirm' | 'cancel' }
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    api
      .get('/api/admin/orders?status=WAITING_FOR_DEPOSIT&method=BANK_TRANSFER&pageSize=100')
      .then((d) => setRows(d.orders))
      .catch((err) => setError(err));
  }, []);
  useEffect(load, [load]);

  const run = async () => {
    setBusy(true);
    try {
      const path = `/api/admin/orders/${target.order.orderNo}/${target.action === 'confirm' ? 'confirm-deposit' : 'cancel'}`;
      await api.post(path, target.action === 'confirm' ? { memo: memo || undefined } : { reason: memo || undefined });
      setTarget(null);
      setMemo('');
      load();
      onChanged();
    } catch (err) {
      setError(err);
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="무통장입금 확인 대기" aside={<Button variant="ghost" size="sm" icon={<RefreshIcon size={14} />} onClick={load}>새로고침</Button>}>
      <p className="ms-hint" style={{ margin: '-8px 0 16px' }}>
        통장 입금 내역(입금자명 · 금액)을 확인한 뒤 [입금 확인]을 누르면 회원 자격이 바로 반영되고 회원에게 결제 완료 메일이 발송됩니다.
      </p>
      {error && <Alert tone="danger">{error.message}</Alert>}
      {!rows ? (
        <Spinner />
      ) : (
        <DataTable
          rows={rows}
          rowKey={(o) => o.orderNo}
          empty="입금 확인을 기다리는 신청이 없습니다."
          columns={[
            { key: 'createdAt', label: '신청일', render: (o) => formatDate(o.createdAt) },
            { key: 'member', label: '회원', render: memberCell },
            { key: 'order', label: '내용', render: orderCell },
            { key: 'amount', label: '금액', align: 'right', render: (o) => <span className="ms-amount">{formatWon(o.amount)}</span> },
            { key: 'depositor', label: '입금자명', render: (o) => <span className="ms-strong">{o.depositorName}</span> },
            {
              key: 'due',
              label: '입금기한',
              render: (o) => <span className={new Date(o.depositDueAt) < new Date() ? 'ms-red' : ''}>{formatDate(o.depositDueAt)}</span>,
            },
            { key: 'receipt', label: '증빙', render: (o) => <span className="ms-text-sm">{receiptText(o)}</span> },
            {
              key: 'actions',
              label: '처리',
              render: (o) => (
                <span className="ms-cell-actions">
                  <Button size="xs" onClick={() => setTarget({ order: o, action: 'confirm' })}>입금 확인</Button>
                  <Button size="xs" variant="outline" onClick={() => setTarget({ order: o, action: 'cancel' })}>취소</Button>
                </span>
              ),
            },
          ]}
        />
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.action === 'confirm' ? '입금을 확인 처리할까요?' : '입금 신청을 취소할까요?'}
        confirmLabel={target?.action === 'confirm' ? '입금 확인' : '신청 취소'}
        tone={target?.action === 'confirm' ? 'primary' : 'danger'}
        busy={busy}
        onCancel={() => {
          setTarget(null);
          setMemo('');
        }}
        onConfirm={run}
      >
        {target && (
          <>
            <p style={{ margin: '0 0 12px' }}>
              <b className="ms-strong">{target.order.depositorName}</b> · {formatWon(target.order.amount)}
              <br />
              {target.order.orderName}
            </p>
            <FormRow label={target.action === 'confirm' ? '메모 (선택)' : '취소 사유 (선택)'}>
              <input className="ms-input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={target.action === 'confirm' ? '예) 11/3 국민은행 입금 확인' : '예) 회원 요청'} />
            </FormRow>
          </>
        )}
      </ConfirmDialog>
    </Card>
  );
}

/* ------------------------------ 결제 내역 ------------------------------ */
function PaymentsTab({ onChanged }) {
  const [filters, setFilters] = useState({ status: '', method: '', q: '', page: 1 });
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(filters.page), pageSize: '20' });
    if (filters.status) qs.set('status', filters.status);
    if (filters.method) qs.set('method', filters.method);
    if (filters.q) qs.set('q', filters.q);
    setData(null);
    api.get(`/api/admin/orders?${qs}`).then(setData).catch((err) => setError(err));
  }, [filters]);
  useEffect(load, [load]);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/api/admin/orders/${target.orderNo}/cancel`, { reason: reason || undefined });
      setTarget(null);
      setReason('');
      load();
      onChanged();
    } catch (err) {
      setError(err);
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form
        className="ms-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: query.trim(), page: 1 }));
        }}
      >
        <select className="ms-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} aria-label="상태">
          <option value="">전체 상태</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="ms-select" value={filters.method} onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value, page: 1 }))} aria-label="결제수단">
          <option value="">전체 결제수단</option>
          <option value="TOSS">카드·간편결제</option>
          <option value="BANK_TRANSFER">무통장입금</option>
        </select>
        <input className="ms-input" placeholder="주문번호 · 이름 · 이메일 · 입금자명" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="submit" size="sm" variant="outline">검색</Button>
      </form>

      {error && <Alert tone="danger">{error.message}</Alert>}
      {!data ? (
        <Spinner />
      ) : (
        <>
          <p className="ms-muted ms-text-sm" style={{ margin: '0 0 10px' }}>총 {data.total.toLocaleString()}건</p>
          <DataTable
            rows={data.orders}
            rowKey={(o) => o.orderNo}
            columns={[
              { key: 'createdAt', label: '신청일시', render: (o) => formatDateTime(o.createdAt) },
              { key: 'member', label: '회원', render: memberCell },
              { key: 'order', label: '내용', render: orderCell },
              { key: 'amount', label: '금액', align: 'right', render: (o) => <span className="ms-amount">{formatWon(o.amount)}</span> },
              { key: 'method', label: '결제수단', render: (o) => o.payMethodLabel || METHOD_LABEL[o.method] },
              { key: 'status', label: '상태', render: (o) => <OrderStatusBadge status={o.status} /> },
              { key: 'paidAt', label: '결제일', render: (o) => formatDate(o.paidAt) },
              {
                key: 'actions',
                label: '관리',
                render: (o) =>
                  ['PAID', 'WAITING_FOR_DEPOSIT', 'EXPIRED', 'READY'].includes(o.status) ? (
                    <Button size="xs" variant="danger-outline" onClick={() => setTarget(o)}>
                      {o.method === 'TOSS' && o.status === 'PAID' ? '환불' : '취소'}
                    </Button>
                  ) : (
                    <span className="ms-muted ms-text-sm">{o.adminMemo ? '메모 있음' : '-'}</span>
                  ),
              },
            ]}
          />
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.method === 'TOSS' && target?.status === 'PAID' ? '결제를 환불(취소)할까요?' : '주문을 취소할까요?'}
        confirmLabel="취소 처리"
        tone="danger"
        busy={busy}
        onCancel={() => {
          setTarget(null);
          setReason('');
        }}
        onConfirm={cancel}
      >
        {target && (
          <>
            <p style={{ margin: '0 0 8px' }}>
              {target.orderName} · <b className="ms-strong">{formatWon(target.amount)}</b>
            </p>
            {target.status === 'PAID' && (
              <Alert tone="warn">
                {target.method === 'TOSS'
                  ? '토스페이먼츠로 전액 환불되고, 이 결제로 반영된 회원 자격은 결제 전 상태로 되돌아갑니다.'
                  : target.method === 'TEST'
                    ? '0원 테스트 결제입니다. 오간 돈은 없고, 이 결제로 반영된 회원 자격만 결제 전 상태로 되돌아갑니다.'
                    : '무통장입금 건은 자동 환불되지 않습니다. 계좌로 직접 환불한 뒤 처리하세요. 회원 자격은 결제 전 상태로 되돌아갑니다.'}
              </Alert>
            )}
            <FormRow label="취소 사유">
              <input className="ms-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예) 회원 요청 환불" />
            </FormRow>
          </>
        )}
      </ConfirmDialog>
    </Card>
  );
}

/* ------------------------------ 회원 관리 ------------------------------ */
function MembersTab({ onChanged }) {
  const { plans } = useMembershipPlans();
  const [filters, setFilters] = useState({ q: '', planCode: '', status: '', page: 1 });
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ planCode: '', status: 'ACTIVE', expiresAt: '', memo: '' });
  const [busy, setBusy] = useState(false);

  const qs = useCallback(
    (extra = {}) => {
      const p = new URLSearchParams({ page: String(filters.page), pageSize: '20', ...extra });
      if (filters.q) p.set('q', filters.q);
      if (filters.planCode) p.set('planCode', filters.planCode);
      if (filters.status) p.set('status', filters.status);
      return p.toString();
    },
    [filters],
  );

  const load = useCallback(() => {
    setData(null);
    api.get(`/api/admin/members?${qs()}`).then(setData).catch((err) => setError(err));
  }, [qs]);
  useEffect(load, [load]);

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      planCode: m.planCode || '',
      status: 'ACTIVE',
      expiresAt: m.expiresAt ? new Date(m.expiresAt).toISOString().slice(0, 10) : '',
      memo: '',
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/api/admin/members/${editing.id}/membership`, {
        planCode: form.planCode || null,
        status: form.status,
        expiresAt: form.status === 'ACTIVE' && form.expiresAt ? form.expiresAt : null,
        memo: form.memo || undefined,
      });
      setEditing(null);
      load();
      onChanged();
    } catch (err) {
      setError(err);
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const selectedPlan = plans?.find((p) => p.code === form.planCode);

  return (
    <Card>
      <form
        className="ms-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: query.trim(), page: 1 }));
        }}
      >
        <input className="ms-input" placeholder="이름 · 이메일 · 기관명 · 전화번호" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="ms-select" value={filters.planCode} onChange={(e) => setFilters((f) => ({ ...f, planCode: e.target.value, page: 1 }))} aria-label="회원등급">
          <option value="">전체 등급</option>
          {plans?.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <select className="ms-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} aria-label="자격 상태">
          <option value="">전체 상태</option>
          <option value="ACTIVE">정상</option>
          <option value="EXPIRED">만료</option>
          <option value="NONE">회비 미납</option>
        </select>
        <Button type="submit" size="sm" variant="outline">검색</Button>
        <span className="ms-toolbar-spacer" />
        <a className="ms-btn ms-btn-outline ms-btn-sm" href={apiUrl(`/api/admin/members/export.csv?${qs({ page: '1' })}`)}>
          <DownloadIcon size={14} /> <span>엑셀(CSV) 내려받기</span>
        </a>
      </form>

      {error && <Alert tone="danger">{error.message}</Alert>}
      {!data ? (
        <Spinner />
      ) : (
        <>
          <p className="ms-muted ms-text-sm" style={{ margin: '0 0 10px' }}>총 {data.total.toLocaleString()}명</p>
          <DataTable
            rows={data.members}
            rowKey={(m) => m.id}
            columns={[
              { key: 'createdAt', label: '가입일', render: (m) => formatDate(m.createdAt) },
              {
                key: 'name',
                label: '회원',
                render: (m) => (
                  <span>
                    <span className="ms-cell-main">
                      {m.name} {m.role === 'ADMIN' && <Badge tone="teal">관리자</Badge>}
                      {m.source === 'IMPORT' && <Badge tone="slate">명부 이관</Badge>}
                      {m.passwordSet === false && <Badge tone="amber">비밀번호 미설정</Badge>}
                    </span>
                    <span className="ms-cell-sub">{m.email}</span>
                  </span>
                ),
              },
              { key: 'organization', label: '소속 / 기업', render: (m) => m.organization || '-' },
              {
                key: 'plan',
                label: '등급',
                render: (m) => (m.planName ? <PlanBadge label={m.planName} tone={m.planBadgeTone} /> : '-'),
              },
              { key: 'status', label: '자격', render: (m) => <MembershipStatusBadge status={m.membershipStatus} /> },
              {
                key: 'expiresAt',
                label: '만료일',
                render: (m) => (m.membershipStatus === 'NONE' ? '-' : m.expiresAt ? formatDate(m.expiresAt) : '기한 없음'),
              },
              {
                key: 'actions',
                label: '관리',
                render: (m) => <Button size="xs" variant="outline" onClick={() => openEdit(m)}>자격 수정</Button>,
              },
            ]}
          />
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}

      <ConfirmDialog open={Boolean(editing)} title={`${editing?.name || ''} 회원 자격 수정`} confirmLabel="저장" busy={busy} onCancel={() => setEditing(null)} onConfirm={save}>
        <p className="ms-text-sm ms-muted" style={{ margin: '0 0 8px' }}>
          오프라인 납부 회원 등록, 자격 연장 · 해제에 사용합니다. 처리 내역은 결제 이벤트 기록에 남습니다.
        </p>
        <FormRow label="회원등급">
          <select className="ms-select" value={form.planCode} onChange={(e) => setForm({ ...form, planCode: e.target.value })}>
            <option value="">선택</option>
            {plans?.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label="자격 상태">
          <div className="ms-radio-inline">
            {[
              ['ACTIVE', '정상(자격 부여)'],
              ['NONE', '해제(미납)'],
            ].map(([v, label]) => (
              <label key={v} className={`ms-radio${form.status === v ? ' is-checked' : ''}`}>
                <input type="radio" checked={form.status === v} onChange={() => setForm({ ...form, status: v })} />
                {label}
              </label>
            ))}
          </div>
        </FormRow>
        {form.status === 'ACTIVE' && (
          <FormRow label="만료일" sub={selectedPlan?.term === 'ANNUAL' ? '비워 두면 오늘부터 1년' : '종신 · 준회원은 비워 두세요'}>
            <input type="date" className="ms-input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </FormRow>
        )}
        <FormRow label="메모">
          <input className="ms-input" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="예) 2026 오프라인 납부 회원 이관" />
        </FormRow>
      </ConfirmDialog>
    </Card>
  );
}

function GalleryTab() {
  return (
    <Card title="포상갤러리 관리">
      <div className="ms-stack">
        <p className="ms-text-sm" style={{ margin: 0, lineHeight: 1.7 }}>
          포상갤러리 화면에서 관리자 계정으로 로그인한 상태라면 각 앨범 제목 옆 <b>[수정]</b> 버튼과 상단 <b>[새 앨범 등록]</b> 버튼이 보입니다.
          사진은 올리는 즉시 웹용 크기(최대 2000px)와 목록용 썸네일로 자동 변환되며, 비공개(임시저장)로 먼저 저장해 두고 확인 후 공개할 수 있습니다.
        </p>
        <div className="ms-row">
          <ButtonLink to="/award-gallery" variant="outline" icon={<ImageIcon size={15} />}>포상갤러리 바로가기</ButtonLink>
          <ButtonLink to="/award-gallery/new" icon={<PlusIcon size={15} />}>새 앨범 등록</ButtonLink>
        </div>
      </div>
    </Card>
  );
}

export default function AdminConsolePage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'deposits';
  const [summary, setSummary] = useState(null);
  const [testPayment, setTestPayment] = useState(false);

  const loadSummary = useCallback(() => {
    api.get('/api/admin/summary').then(setSummary).catch(() => {});
  }, []);
  useEffect(loadSummary, [loadSummary]);
  useEffect(() => {
    api.get('/api/payments/config').then((c) => setTestPayment(Boolean(c.testPayment))).catch(() => {});
  }, []);

  return (
    <MemberPage width="wide" footerRight="Admin Console">
      <MemberPageHeader badge="관리자" badgeEn="ADMIN CONSOLE" title="관리자 콘솔" desc="회원 · 회비 납부 · 포상갤러리를 관리합니다." />

      {testPayment && (
        <Alert tone="warn" title="0원 테스트 결제가 켜져 있습니다">
          지금은 누구나 회비 없이 결제를 완료할 수 있습니다. 실제 오픈 전에 서버의 server/.env 에서 TEST_PAYMENT_ENABLED=false 로 바꾸고 API 를 다시 시작하세요.
        </Alert>
      )}

      <div className="ms-stat-grid">
        <div className="ms-stat">
          <span className="ms-stat-label">전체 회원</span>
          <span className="ms-stat-value">{summary ? summary.members.toLocaleString() : '-'}</span>
        </div>
        <div className="ms-stat">
          <span className="ms-stat-label">자격 유효 회원</span>
          <span className="ms-stat-value">{summary ? summary.activeMembers.toLocaleString() : '-'}</span>
        </div>
        <div className="ms-stat">
          <span className="ms-stat-label">입금 확인 대기</span>
          <span className={`ms-stat-value${summary?.pendingDeposits ? ' is-alert' : ''}`}>{summary ? `${summary.pendingDeposits}건` : '-'}</span>
        </div>
        <div className="ms-stat">
          <span className="ms-stat-label">올해 납부 회비</span>
          <span className="ms-stat-value">{summary ? formatWon(summary.paidThisYear) : '-'}</span>
        </div>
      </div>

      <div className="ms-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`ms-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setParams({ tab: t.key }, { replace: true })}
          >
            {t.icon}
            {t.label}
            {t.key === 'deposits' && summary?.pendingDeposits > 0 && <span className="ms-tab-count">{summary.pendingDeposits}</span>}
          </button>
        ))}
      </div>

      {tab === 'deposits' && <DepositsTab onChanged={loadSummary} />}
      {tab === 'payments' && <PaymentsTab onChanged={loadSummary} />}
      {tab === 'members' && <MembersTab onChanged={loadSummary} />}
      {tab === 'gallery' && <GalleryTab />}
    </MemberPage>
  );
}
