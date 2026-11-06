// src/components/pages/MyPage.jsx — 마이페이지 (회원 자격 · 결제 내역 · 회원정보 수정 · 비밀번호 변경)
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import {
  Alert,
  BankAccountBox,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  DataTable,
  FormRow,
  MemberPage,
  MemberPageHeader,
  MembershipStatusBadge,
  OrderStatusBadge,
  PasswordInput,
  PlanBadge,
  SectionTitle,
  Spinner,
} from '../member/MemberUI';
import { ArrowRightIcon, ReceiptIcon, RefreshIcon, SettingsIcon, ShieldIcon, UserIcon } from '../member/icons';
import {
  CATEGORY_LABEL,
  METHOD_LABEL,
  formatBizNoInput,
  formatDate,
  formatPhoneInput,
  formatWon,
  isPasswordValid,
} from '../member/membership';

const TABS = [
  { key: 'membership', label: '회원 자격', icon: <ShieldIcon size={15} /> },
  { key: 'orders', label: '결제 내역', icon: <ReceiptIcon size={15} /> },
  { key: 'profile', label: '회원정보 수정', icon: <UserIcon size={15} /> },
  { key: 'password', label: '비밀번호 변경', icon: <SettingsIcon size={15} /> },
];

const RENEWAL_WINDOW_DAYS = 90;

function MembershipPanel({ user, orders }) {
  const m = user.membership;
  const plan = m.plan;
  const pending = orders?.find((o) => o.status === 'WAITING_FOR_DEPOSIT');
  const daysLeft = m.expiresAt ? Math.ceil((new Date(m.expiresAt) - Date.now()) / 864e5) : null;
  const renewable = plan?.term === 'ANNUAL' && (m.status === 'EXPIRED' || (daysLeft !== null && daysLeft <= RENEWAL_WINDOW_DAYS));
  const initial = (user.companyName || user.name || '?').replace(/^\(주\)\s*/, '').charAt(0);

  return (
    <div className="ms-stack" style={{ gap: 20 }}>
      {pending && (
        <Alert
          tone="warn"
          title={`입금 대기 중 · ${pending.orderName} ${formatWon(pending.amount)}`}
          action={<ButtonLink to={`/membership/orders/${pending.orderNo}`} variant="outline" size="sm">입금 정보</ButtonLink>}
        >
          {pending.method === 'BANK_TRANSFER'
            ? `입금자명 "${pending.depositorName}"(으)로 ${formatDate(pending.depositDueAt)}까지 입금해 주세요. 입금이 확인되면 자격이 자동 반영됩니다.`
            : `발급된 가상계좌로 ${formatDate(pending.virtualAccount?.dueDate)}까지 입금해 주세요.`}
        </Alert>
      )}
      {pending?.bankAccount && (
        <BankAccountBox {...pending.bankAccount} amount={formatWon(pending.amount)} />
      )}

      <Card>
        <div className="ms-member-card">
          <div className="ms-avatar" aria-hidden="true">{initial}</div>
          <div className="ms-member-main">
            <h2 className="ms-member-name">
              {user.memberType === 'ORGANIZATION' ? user.companyName : user.name}
              {plan && <PlanBadge plan={plan} label={plan.category === 'GENERAL' ? plan.name : undefined} />}
              <MembershipStatusBadge status={m.status} />
            </h2>
            <p className="ms-member-email">
              {user.email}
              {user.memberType === 'ORGANIZATION' && ` · 담당자 ${user.name}`}
            </p>
            <div className="ms-member-meta">
              <span>회원 유형<b>{plan ? `${CATEGORY_LABEL[plan.category]} · ${plan.name}` : '미선택'}</b></span>
              <span>자격 시작<b>{formatDate(m.startedAt)}</b></span>
              <span>
                자격 만료
                <b className={m.status === 'EXPIRED' ? 'ms-red' : ''}>
                  {m.status === 'NONE' ? '-' : m.expiresAt ? `${formatDate(m.expiresAt)}${daysLeft > 0 ? ` (D-${daysLeft})` : ''}` : '기한 없음'}
                </b>
              </span>
            </div>
          </div>
          <div className="ms-member-cta">
            {m.status === 'NONE' && !pending && (
              <ButtonLink to={`/membership/checkout${m.planCode ? `?plan=${m.planCode}` : ''}`} iconRight={<ArrowRightIcon size={15} />}>
                회비 결제하기
              </ButtonLink>
            )}
            {renewable && !pending && (
              <ButtonLink to={`/membership/checkout?plan=${m.planCode}`} icon={<RefreshIcon size={15} />}>연회비 갱신하기</ButtonLink>
            )}
            {m.status !== 'NONE' && !pending && (
              <ButtonLink to="/membership/checkout" variant="outline">등급 변경</ButtonLink>
            )}
          </div>
        </div>

        {m.status === 'NONE' && !pending && (
          <Alert tone="info" className="ms-mt-16">
            회원가입은 완료되었지만 아직 회비가 납부되지 않았습니다. 회비를 납부하시면 {plan?.name || '회원'} 혜택이 바로 시작됩니다.
          </Alert>
        )}
        {m.status === 'EXPIRED' && (
          <Alert tone="warn" className="ms-mt-16">회원 자격 기간이 만료되었습니다. 연회비를 납부하시면 1년 연장됩니다.</Alert>
        )}
      </Card>

      {plan && (
        <Card title={`${plan.name} 혜택`} aside={plan.votingRights ? '총회 의결권 있음' : null}>
          <ul className="ms-plan-benefits ms-benefit-list">
            {plan.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="ms-muted ms-text-sm" style={{ margin: '16px 0 0' }}>
            회원 유형별 혜택 전체는 <Link to="/members" className="ms-link">회원 안내</Link>에서 확인하실 수 있습니다.
          </p>
        </Card>
      )}
    </div>
  );
}

function OrdersPanel({ orders }) {
  if (!orders) return <Spinner label="결제 내역을 불러오는 중입니다" />;
  return (
    <Card padded>
      <DataTable
        rows={orders}
        rowKey={(o) => o.orderNo}
        empty="아직 결제 내역이 없습니다."
        columns={[
          { key: 'createdAt', label: '신청일', width: 110, render: (o) => formatDate(o.createdAt) },
          {
            key: 'orderName',
            label: '내용',
            render: (o) => (
              <span>
                <span className="ms-cell-main">{o.orderName}</span>
                <span className="ms-cell-sub ms-mono">{o.orderNo}</span>
              </span>
            ),
          },
          { key: 'amount', label: '금액', align: 'right', render: (o) => <span className="ms-amount">{formatWon(o.amount)}</span> },
          { key: 'method', label: '결제수단', render: (o) => o.payMethodLabel || METHOD_LABEL[o.method] },
          { key: 'status', label: '상태', render: (o) => <OrderStatusBadge status={o.status} /> },
          { key: 'paidAt', label: '결제일', render: (o) => formatDate(o.paidAt) },
          {
            key: 'detail',
            label: '상세',
            align: 'center',
            render: (o) => (
              <ButtonLink to={`/membership/orders/${o.orderNo}`} variant="outline" size="xs">보기</ButtonLink>
            ),
          },
        ]}
      />
    </Card>
  );
}

function ProfilePanel({ user, onSaved }) {
  const isOrg = user.memberType === 'ORGANIZATION';
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    phone: user.phone || '',
    officePhone: user.officePhone || '',
    affiliation: user.affiliation || '',
    department: user.department || '',
    position: user.position || '',
    companyName: user.companyName || '',
    businessNo: user.businessNo || '',
    ceoName: user.ceoName || '',
    taxEmail: user.taxEmail || '',
    smsOptIn: user.smsOptIn,
    marketingOptIn: user.marketingOptIn,
  }));
  const [state, setState] = useState({ busy: false, saved: false, error: null, fields: {} });

  const set = (key) => (e) => {
    let v = e.target.value;
    if (key === 'phone' || key === 'officePhone') v = formatPhoneInput(v);
    if (key === 'businessNo') v = formatBizNoInput(v);
    setForm((f) => ({ ...f, [key]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, saved: false, error: null, fields: {} });
    const payload = { ...form };
    if (!isOrg) {
      delete payload.companyName;
      delete payload.businessNo;
      delete payload.ceoName;
      delete payload.taxEmail;
    }
    try {
      const data = await api.patch('/api/me', payload);
      onSaved(data.user);
      setState({ busy: false, saved: true, error: null, fields: {} });
    } catch (err) {
      setState({ busy: false, saved: false, error: err.message, fields: err.fields || {} });
    }
  };

  const f = state.fields;
  return (
    <Card>
      <form onSubmit={submit} noValidate>
        {state.saved && <Alert tone="success" className="ms-form-alert">회원정보가 저장되었습니다.</Alert>}
        {state.error && <Alert tone="danger" className="ms-form-alert">{state.error}</Alert>}

        <SectionTitle>계정 정보</SectionTitle>
        <FormRow label="아이디 (이메일)" hint="아이디는 변경할 수 없습니다. 변경이 필요하면 사무국으로 문의해 주세요.">
          <input className="ms-input ms-w-md" value={user.email} readOnly />
        </FormRow>

        {isOrg && (
          <>
            <hr className="ms-divider" />
            <SectionTitle>기업 정보</SectionTitle>
            <FormRow label="기업명" required error={f.companyName}>
              <input className="ms-input" value={form.companyName} onChange={set('companyName')} />
            </FormRow>
            <FormRow label="사업자등록번호" required error={f.businessNo}>
              <input className="ms-input ms-w-sm" inputMode="numeric" value={form.businessNo} onChange={set('businessNo')} placeholder="000-00-00000" />
            </FormRow>
            <FormRow label="대표자명">
              <input className="ms-input ms-w-sm" value={form.ceoName} onChange={set('ceoName')} />
            </FormRow>
            <FormRow label="세금계산서 수신 이메일" error={f.taxEmail}>
              <input type="email" className="ms-input ms-w-md" value={form.taxEmail} onChange={set('taxEmail')} />
            </FormRow>
          </>
        )}

        <hr className="ms-divider" />
        <SectionTitle>{isOrg ? '담당자 정보' : '소속 및 연락처'}</SectionTitle>
        <FormRow label={isOrg ? '담당자 성명' : '성명'} required error={f.name}>
          <input className="ms-input ms-w-md" value={form.name} onChange={set('name')} />
        </FormRow>
        {!isOrg && (
          <FormRow label="소속 기관 / 기업명" required error={f.affiliation}>
            <input className="ms-input" value={form.affiliation} onChange={set('affiliation')} />
          </FormRow>
        )}
        <FormRow label="직위 / 부서">
          <div className="ms-input-pair">
            <input className="ms-input" aria-label="부서" placeholder="부서명" value={form.department} onChange={set('department')} />
            <input className="ms-input" aria-label="직위" placeholder="직위/직책" value={form.position} onChange={set('position')} />
          </div>
        </FormRow>
        <FormRow label="휴대전화 번호" required error={f.phone}>
          <input className="ms-input ms-w-md" inputMode="tel" value={form.phone} onChange={set('phone')} />
        </FormRow>
        <FormRow label="사무실 유선전화" error={f.officePhone}>
          <input className="ms-input ms-w-sm" inputMode="tel" value={form.officePhone} onChange={set('officePhone')} />
        </FormRow>
        <FormRow label="정보 수신">
          <div className="ms-stack" style={{ gap: 8, paddingTop: 8 }}>
            <Checkbox checked={form.smsOptIn} onChange={(v) => setForm((x) => ({ ...x, smsOptIn: v }))}>교육 일정 및 심사 안내 SMS · 알림톡 수신</Checkbox>
            <Checkbox checked={form.marketingOptIn} onChange={(v) => setForm((x) => ({ ...x, marketingOptIn: v }))}>SRMQ 뉴스레터 및 행사 안내 수신 (이메일/문자)</Checkbox>
          </div>
        </FormRow>

        <div className="ms-actions is-between">
          <Link to="/mypage/withdraw" className="ms-link ms-link-muted ms-text-sm">회원탈퇴</Link>
          <div className="ms-actions-group">
            <Button type="submit" loading={state.busy}>저장하기</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function PasswordPanel() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
  const [state, setState] = useState({ busy: false, done: false, error: null, fields: {} });

  const submit = async (e) => {
    e.preventDefault();
    const fields = {};
    if (!form.currentPassword) fields.currentPassword = '현재 비밀번호를 입력해 주세요.';
    if (!isPasswordValid(form.newPassword)) fields.newPassword = '영문, 숫자, 특수문자를 포함해 8~16자로 입력해 주세요.';
    if (form.newPassword !== form.newPasswordConfirm) fields.newPasswordConfirm = '새 비밀번호가 일치하지 않습니다.';
    if (Object.keys(fields).length) return setState({ busy: false, done: false, error: null, fields });

    setState({ busy: true, done: false, error: null, fields: {} });
    try {
      await api.post('/api/me/password', form);
      setForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
      setState({ busy: false, done: true, error: null, fields: {} });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message, fields: err.fields || {} });
    }
    return undefined;
  };

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        {state.done && <Alert tone="success" className="ms-form-alert">비밀번호가 변경되었습니다. 다른 기기의 로그인은 해제되었습니다.</Alert>}
        {state.error && <Alert tone="danger" className="ms-form-alert">{state.error}</Alert>}
        <FormRow label="현재 비밀번호" required error={state.fields.currentPassword}>
          <div className="ms-w-md">
            <PasswordInput value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>
        </FormRow>
        <FormRow label="새 비밀번호" required error={state.fields.newPassword} hint="영문, 숫자, 특수문자를 포함해 8~16자" ok={isPasswordValid(form.newPassword)}>
          <div className="ms-w-md">
            <PasswordInput autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          </div>
        </FormRow>
        <FormRow label="새 비밀번호 확인" required error={state.fields.newPasswordConfirm}>
          <div className="ms-w-md">
            <PasswordInput autoComplete="new-password" value={form.newPasswordConfirm} onChange={(e) => setForm({ ...form, newPasswordConfirm: e.target.value })} />
          </div>
        </FormRow>
        <div className="ms-actions is-end">
          <Button type="submit" loading={state.busy}>비밀번호 변경</Button>
        </div>
      </form>
    </Card>
  );
}

export default function MyPage() {
  const { user, refresh, setUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'membership';
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    refresh();
    api.get('/api/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, [refresh]);

  if (!user) return null;

  return (
    <MemberPage>
      <MemberPageHeader
        badge="마이페이지"
        badgeEn="MY PAGE"
        title="마이페이지"
        desc={`${user.name}님, 사경원 회원 자격과 회비 납부 내역을 확인하고 회원정보를 관리하실 수 있습니다.`}
        aside={user.role === 'ADMIN' ? <ButtonLink to="/admin" variant="outline" size="sm">관리자 콘솔</ButtonLink> : null}
      />

      {params.get('welcome') && (
        <Alert tone="success" title="회원가입을 환영합니다!">회비를 납부하시면 회원 혜택이 바로 시작됩니다.</Alert>
      )}

      <div className="ms-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`ms-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setParams(t.key === 'membership' ? {} : { tab: t.key }, { replace: true })}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'membership' && <MembershipPanel user={user} orders={orders} />}
      {tab === 'orders' && <OrdersPanel orders={orders} />}
      {tab === 'profile' && <ProfilePanel user={user} onSaved={setUser} />}
      {tab === 'password' && <PasswordPanel />}
    </MemberPage>
  );
}
