// src/components/pages/MembershipCheckoutPage.jsx — 회비 결제
// 회원 유형 선택 → (기업정보 · 후원금 사용용도) → 결제수단(토스페이먼츠 위젯 / 무통장입금) → 결제
// 금액은 서버(/api/plans/:code/quote)가 계산하며, 화면 금액은 표시용입니다.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { groupPlans, planFeeText, useMembershipPlans } from '../../hooks/useMembershipPlans';
import { useTossPaymentWidget } from '../../hooks/useTossPaymentWidget';
import {
  Alert,
  Badge,
  BankAccountBox,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  FormRow,
  MemberPage,
  MemberPageHeader,
  PlanBadge,
  Spinner,
} from '../member/MemberUI';
import { BankIcon, BuildingIcon, CardIcon, CheckIcon, SparkIcon, UserIcon } from '../member/icons';
import {
  CATEGORY_LABEL,
  ORDER_TYPE_LABEL,
  TERM_LABEL,
  digitsOnly,
  formatBizNoInput,
  formatDate,
  formatPhoneInput,
  formatWon,
  isEmail,
} from '../member/membership';

const CATEGORY_ICON = { GENERAL: <UserIcon size={16} />, CORPORATE: <BuildingIcon size={16} />, SPECIAL: <SparkIcon size={16} /> };

function addYearText(fromDate) {
  const d = new Date(fromDate || Date.now());
  d.setFullYear(d.getFullYear() + 1);
  return formatDate(d);
}

export default function MembershipCheckoutPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { plans, error: plansError } = useMembershipPlans();
  const grouped = useMemo(() => groupPlans(plans || []), [plans]);

  const [config, setConfig] = useState(null);
  const [orders, setOrders] = useState(null);
  const [quote, setQuote] = useState({ loading: true, data: null, error: null });
  const [method, setMethod] = useState(null);
  const [bank, setBank] = useState({ depositorName: '', receiptType: 'NONE', purpose: 'INCOME_DEDUCTION', identifier: '', businessNo: '', email: '' });
  const [company, setCompany] = useState({ companyName: '', businessNo: '', ceoName: '', taxEmail: '' });
  const [designatedPurpose, setDesignatedPurpose] = useState('');
  const [agreeOrder, setAgreeOrder] = useState(false);
  const [errors, setErrors] = useState({});
  const [payError, setPayError] = useState(null);
  const [paying, setPaying] = useState(false);

  const planCode = params.get('plan') || user?.membership?.planCode || plans?.[0]?.code || '';
  const plan = plans?.find((p) => p.code === planCode) || null;
  const pending = orders?.find((o) => o.status === 'WAITING_FOR_DEPOSIT');
  const amount = quote.data?.amount;

  // 처음 들어왔을 때: 결제 설정 · 내 주문 · 기업정보 기본값
  useEffect(() => {
    api.get('/api/payments/config').then((c) => {
      setConfig(c);
      setMethod((m) => m || (c.testPayment ? 'TEST' : c.tossEnabled ? 'TOSS' : 'BANK_TRANSFER'));
    }).catch(() => {
      setConfig({ tossEnabled: false, bankTransfer: null });
      setMethod('BANK_TRANSFER');
    });
    api.get('/api/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    setCompany({
      companyName: user.companyName || '',
      businessNo: user.businessNo || '',
      ceoName: user.ceoName || '',
      taxEmail: user.taxEmail || '',
    });
    setBank((b) => ({
      ...b,
      depositorName: b.depositorName || user.companyName || user.name || '',
      identifier: b.identifier || formatPhoneInput(user.phone || ''),
      businessNo: b.businessNo || user.businessNo || '',
      email: b.email || user.taxEmail || user.email || '',
    }));
  }, [user]);

  // 회원 유형이 바뀌면 서버에 금액 견적 요청
  useEffect(() => {
    if (!planCode) return undefined;
    let alive = true;
    setQuote({ loading: true, data: null, error: null });
    api
      .get(`/api/plans/${planCode}/quote`)
      .then((d) => alive && setQuote({ loading: false, data: d.quote, error: null }))
      .catch((err) => alive && setQuote({ loading: false, data: null, error: err }));
    return () => {
      alive = false;
    };
  }, [planCode]);

  const toss = useTossPaymentWidget({
    enabled: Boolean(config?.tossEnabled && method),
    clientKey: config?.tossClientKey,
    customerKey: user?.customerKey,
    amount,
  });

  const selectPlan = (code) => {
    setParams({ plan: code }, { replace: true });
    setPayError(null);
  };

  const needsCompany = plan?.memberType === 'ORGANIZATION';
  const isTest = method === 'TEST';

  function validate() {
    const e = {};
    if (needsCompany) {
      // 0원 테스트 결제는 기업명 · 사업자등록번호 없이도 진행 (입력했다면 형식만 확인)
      if (!isTest && !company.companyName.trim()) e.companyName = '기업명을 입력해 주세요.';
      const bizLen = digitsOnly(company.businessNo).length;
      if ((!isTest || bizLen > 0) && bizLen !== 10) e.companyBusinessNo = '사업자등록번호 10자리를 입력해 주세요.';
      if (company.taxEmail && !isEmail(company.taxEmail)) e.taxEmail = '이메일 형식이 올바르지 않습니다.';
    }
    if (method === 'BANK_TRANSFER') {
      if (!bank.depositorName.trim()) e.depositorName = '입금자명을 입력해 주세요.';
      if (bank.receiptType === 'CASH_RECEIPT') {
        const n = digitsOnly(bank.identifier).length;
        if (n < 10 || n > 11) e.identifier = '휴대폰 번호 또는 사업자등록번호를 입력해 주세요.';
      }
      if (bank.receiptType === 'TAX_INVOICE') {
        if (digitsOnly(bank.businessNo).length !== 10) e.receiptBusinessNo = '사업자등록번호 10자리를 입력해 주세요.';
        if (!isEmail(bank.email)) e.receiptEmail = '세금계산서를 받을 이메일을 입력해 주세요.';
      }
    }
    if (!agreeOrder) e.agreeOrder = '주문 내용 확인 및 결제 진행에 동의해 주세요.';
    return e;
  }

  async function pay() {
    setPayError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setPayError(Object.values(e)[0]);
      return;
    }

    setPaying(true);
    let createdOrderNo = null;
    try {
      const body = {
        planCode,
        method,
        ...(needsCompany ? { company: { ...company, taxEmail: company.taxEmail || null } } : {}),
        ...(plan.code === 'SPECIAL' ? { designatedPurpose: designatedPurpose.trim() || null } : {}),
      };
      if (method === 'BANK_TRANSFER') {
        body.depositorName = bank.depositorName.trim();
        body.receiptType = bank.receiptType;
        if (bank.receiptType === 'CASH_RECEIPT') body.receiptInfo = { purpose: bank.purpose, identifier: bank.identifier };
        if (bank.receiptType === 'TAX_INVOICE') body.receiptInfo = { businessNo: bank.businessNo, email: bank.email };
      }

      const data = await api.post('/api/orders', body);
      createdOrderNo = data.order.orderNo;
      if (needsCompany) refresh();

      if (method === 'TEST') {
        // 0원 테스트 결제는 주문과 동시에 결제완료 · 회원 자격 반영
        await refresh();
        navigate(`/membership/orders/${data.order.orderNo}?paid=1`);
        return;
      }

      if (method === 'BANK_TRANSFER') {
        navigate(`/membership/orders/${data.order.orderNo}?created=1`);
        return;
      }
      // 토스 결제창 → 성공 시 /membership/payment/success 로 이동
      await toss.requestPayment(data.toss);
    } catch (err) {
      const canceledByUser = ['USER_CANCEL', 'PAY_PROCESS_CANCELED'].includes(err?.code);
      setPayError(canceledByUser ? '결제를 취소하셨습니다. 다시 시도하시려면 결제하기를 눌러 주세요.' : err?.message || '결제를 진행하지 못했습니다.');
      if (err?.fields) setErrors((x) => ({ ...x, ...err.fields }));
      if (err?.code === 'PENDING_ORDER_EXISTS') api.get('/api/orders').then((d) => setOrders(d.orders)).catch(() => {});
      // 결제창을 열지 못한 카드 주문은 정리
      if (createdOrderNo && method === 'TOSS') api.post(`/api/orders/${createdOrderNo}/cancel`).catch(() => {});
    } finally {
      setPaying(false);
    }
  }

  async function cancelPending() {
    if (!pending) return;
    try {
      await api.post(`/api/orders/${pending.orderNo}/cancel`);
      const d = await api.get('/api/orders');
      setOrders(d.orders);
    } catch (err) {
      setPayError(err.message);
    }
  }

  if (!user) return null;
  if (plansError) {
    return (
      <MemberPage>
        <MemberPageHeader badge="회원서비스" badgeEn="MEMBERSHIP PAYMENT" title="회비 결제" />
        <Alert tone="danger">회원 유형을 불러오지 못했습니다. {plansError.message}</Alert>
      </MemberPage>
    );
  }
  if (!plans || !config || !method) {
    return (
      <MemberPage>
        <MemberPageHeader badge="회원서비스" badgeEn="MEMBERSHIP PAYMENT" title="회비 결제" />
        <Spinner label="결제 정보를 준비하고 있습니다" />
      </MemberPage>
    );
  }

  const activeCategory = plan?.category || 'GENERAL';
  const quoteBlocked = Boolean(quote.error);
  const canPay = !paying && !pending && !quote.loading && !quoteBlocked && Boolean(amount) && (method !== 'TOSS' || toss.status === 'ready');

  return (
    <MemberPage>
      <MemberPageHeader
        badge="회원서비스"
        badgeEn="MEMBERSHIP PAYMENT"
        title="회비 결제"
        desc="회원 유형을 확인하고 결제 수단을 선택해 주세요. 결제가 완료되면 회원 자격이 바로 반영됩니다."
      />

      {pending && (
        <Alert
          tone="warn"
          title="입금 대기 중인 주문이 있습니다"
          action={
            <div className="ms-row">
              <ButtonLink to={`/membership/orders/${pending.orderNo}`} variant="outline" size="sm">입금 정보</ButtonLink>
              {pending.method === 'BANK_TRANSFER' && <Button variant="ghost" size="sm" onClick={cancelPending}>주문 취소</Button>}
            </div>
          }
        >
          {pending.orderName} · {formatWon(pending.amount)} — 입금을 완료하거나 주문을 취소한 뒤 새로 결제할 수 있습니다.
        </Alert>
      )}

      <div className="ms-checkout">
        <div className="ms-checkout-main">
          {/* 1. 회원 유형 */}
          <Card title="회원 유형 선택" aside={<Link to="/members" className="ms-link ms-text-sm">회원 유형별 혜택 보기</Link>}>
            <div className="ms-segment" role="tablist" aria-label="회원 구분" style={{ marginBottom: 16 }}>
              {['GENERAL', 'CORPORATE', 'SPECIAL'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={activeCategory === cat ? 'is-active' : ''}
                  onClick={() => selectPlan(grouped[cat][0]?.code)}
                >
                  {CATEGORY_ICON[cat]} {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
            <div className="ms-radio-list" role="radiogroup" aria-label="회원 유형">
              {grouped[activeCategory].map((p) => (
                <label key={p.code} className={`ms-radio ms-plan-option${p.code === planCode ? ' is-checked' : ''}`}>
                  <input type="radio" name="plan" checked={p.code === planCode} onChange={() => selectPlan(p.code)} />
                  <span className="ms-plan-option-main">
                    <span className="ms-row">
                      <span className="ms-strong">{p.name}</span>
                      {p.category !== 'GENERAL' && <PlanBadge plan={p} />}
                      {user.membership.planCode === p.code && user.membership.status !== 'NONE' && <Badge tone="lime">현재 등급</Badge>}
                    </span>
                    <span className="ms-cell-sub">{planFeeText(p)} · {TERM_LABEL[p.term]}</span>
                  </span>
                  <span className="ms-plan-option-fee">{formatWon(p.joinFee + p.annualFee)}</span>
                </label>
              ))}
            </div>
            {plan && (
              <ul className="ms-plan-benefits" style={{ marginTop: 14 }}>
                {plan.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </Card>

          {/* 2. 기업 정보 (기업 · 특별회원) */}
          {needsCompany && (
            <Card title="기업 정보" aside="입력한 정보는 회원정보에도 저장됩니다.">
              {isTest && <p className="ms-hint" style={{ margin: '0 0 12px' }}>0원 테스트 결제에서는 기업명 · 사업자등록번호를 비워 둬도 됩니다.</p>}
              <FormRow label="기업명" required={!isTest} error={errors.companyName}>
                <input className="ms-input" value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} placeholder="(주)한국사회적책임" />
              </FormRow>
              <FormRow label="사업자등록번호" required={!isTest} error={errors.companyBusinessNo || errors['company.businessNo']}>
                <input className="ms-input ms-w-sm" inputMode="numeric" value={company.businessNo} onChange={(e) => setCompany({ ...company, businessNo: formatBizNoInput(e.target.value) })} placeholder="000-00-00000" />
              </FormRow>
              <FormRow label="대표자명">
                <input className="ms-input ms-w-sm" value={company.ceoName} onChange={(e) => setCompany({ ...company, ceoName: e.target.value })} />
              </FormRow>
              <FormRow label="세금계산서 수신 이메일" error={errors.taxEmail || errors['company.taxEmail']}>
                <input type="email" className="ms-input ms-w-md" value={company.taxEmail} onChange={(e) => setCompany({ ...company, taxEmail: e.target.value })} placeholder="tax@company.co.kr" />
              </FormRow>
            </Card>
          )}

          {/* 3. 후원금 사용용도 (특별회원) */}
          {plan?.code === 'SPECIAL' && (
            <Card title="후원금 사용용도 지정" aside="선택 사항">
              <textarea
                className="ms-textarea"
                maxLength={200}
                value={designatedPurpose}
                onChange={(e) => setDesignatedPurpose(e.target.value)}
                placeholder="예) ESG 연구총서 발간 지원 / 청년 ESG 교육 장학금 등 (비워 두면 본원 발전기금으로 사용됩니다)"
              />
              <div className="ms-counter"><span>특별회원 후원금은 본원 발전을 위해 사용하며, 사용용도를 지정할 수 있습니다.</span><span>{designatedPurpose.length}/200</span></div>
            </Card>
          )}

          {/* 4. 결제 수단 */}
          <Card title="결제 수단">
            <div className="ms-method-grid">
              <button
                type="button"
                className={`ms-method${method === 'TOSS' ? ' is-selected' : ''}${config.tossEnabled ? '' : ' is-disabled'}`}
                onClick={() => config.tossEnabled && setMethod('TOSS')}
                disabled={!config.tossEnabled}
                aria-pressed={method === 'TOSS'}
              >
                <span className="ms-method-icon"><CardIcon size={19} /></span>
                <span className="ms-method-text">
                  <span className="ms-method-name">카드 · 간편결제</span>
                  <span className="ms-method-desc">{config.tossEnabled ? '신용카드 · 계좌이체 · 가상계좌 · 카카오페이 · 토스페이 · 네이버페이' : '준비 중입니다'}</span>
                </span>
              </button>
              <button
                type="button"
                className={`ms-method${method === 'BANK_TRANSFER' ? ' is-selected' : ''}`}
                onClick={() => setMethod('BANK_TRANSFER')}
                aria-pressed={method === 'BANK_TRANSFER'}
              >
                <span className="ms-method-icon"><BankIcon size={19} /></span>
                <span className="ms-method-text">
                  <span className="ms-method-name">무통장입금</span>
                  <span className="ms-method-desc">법인 계좌로 직접 입금 · 사무국 확인 후 자격 반영</span>
                </span>
              </button>
              {config.testPayment && (
                <button
                  type="button"
                  className={`ms-method ms-method--wide ms-method--test${method === 'TEST' ? ' is-selected' : ''}`}
                  onClick={() => setMethod('TEST')}
                  aria-pressed={method === 'TEST'}
                >
                  <span className="ms-method-icon"><CheckIcon size={19} strokeWidth={2.4} /></span>
                  <span className="ms-method-text">
                    <span className="ms-method-name">0원 테스트 결제 <Badge tone="amber">테스트</Badge></span>
                    <span className="ms-method-desc">실제 청구 없이 결제를 완료하고 회원 자격을 바로 반영합니다 · 사업자등록번호 없이 시험용</span>
                  </span>
                </button>
              )}
            </div>

            {isTest && (
              <Alert tone="warn" title="테스트 결제 모드">
                결제 흐름을 확인하기 위한 0원 결제입니다. 돈은 나가지 않고, 결제가 끝나면 선택한 등급의 회원 자격이 바로 반영됩니다.
              </Alert>
            )}

            {/* 토스 결제위젯은 한 번 그린 뒤 숨김/표시만 바꿉니다 */}
            <div className="ms-toss-area" hidden={method !== 'TOSS'}>
              {toss.status === 'loading' && <Spinner label="결제 수단을 불러오는 중입니다" />}
              {toss.status === 'error' && (
                <Alert tone="danger" title="결제 모듈을 불러오지 못했습니다">
                  {toss.error?.message} — 잠시 후 새로고침하거나 무통장입금을 이용해 주세요.
                </Alert>
              )}
              <div id="toss-payment-methods" />
              <div id="toss-agreement" />
            </div>

            {method === 'BANK_TRANSFER' && config.bankTransfer && (
              <div className="ms-stack" style={{ gap: 4 }}>
                <BankAccountBox {...config.bankTransfer} />
                <p className="ms-hint">신청 후 {config.bankTransfer.dueDays}일 이내에 입금해 주세요. 기한이 지나면 신청이 자동 취소됩니다.</p>
                <hr className="ms-divider" style={{ margin: '14px 0 6px' }} />
                <FormRow label="입금자명" required error={errors.depositorName} hint="통장에 찍히는 이름과 같아야 확인이 빠릅니다.">
                  <input className="ms-input ms-w-md" value={bank.depositorName} maxLength={40} onChange={(e) => setBank({ ...bank, depositorName: e.target.value })} />
                </FormRow>
                <FormRow label="증빙 서류">
                  <div className="ms-radio-inline" role="radiogroup" aria-label="증빙 서류">
                    {[
                      ['NONE', '발급 안 함'],
                      ['CASH_RECEIPT', '현금영수증'],
                      ['TAX_INVOICE', '세금계산서(계산서)'],
                    ].map(([v, label]) => (
                      <label key={v} className={`ms-radio${bank.receiptType === v ? ' is-checked' : ''}`}>
                        <input type="radio" name="receipt" checked={bank.receiptType === v} onChange={() => setBank({ ...bank, receiptType: v })} />
                        {label}
                      </label>
                    ))}
                  </div>
                </FormRow>
                {bank.receiptType === 'CASH_RECEIPT' && (
                  <FormRow label="발급 번호" required error={errors.identifier || errors['receiptInfo.identifier']}>
                    <div className="ms-radio-inline" style={{ marginBottom: 8 }}>
                      {[
                        ['INCOME_DEDUCTION', '소득공제용 (개인)'],
                        ['EXPENSE_PROOF', '지출증빙용 (사업자)'],
                      ].map(([v, label]) => (
                        <label key={v} className={`ms-radio${bank.purpose === v ? ' is-checked' : ''}`}>
                          <input type="radio" name="cash-purpose" checked={bank.purpose === v} onChange={() => setBank({ ...bank, purpose: v })} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <input className="ms-input ms-w-md" inputMode="numeric" placeholder={bank.purpose === 'INCOME_DEDUCTION' ? '휴대폰 번호' : '사업자등록번호'} value={bank.identifier} onChange={(e) => setBank({ ...bank, identifier: e.target.value })} />
                  </FormRow>
                )}
                {bank.receiptType === 'TAX_INVOICE' && (
                  <>
                    <FormRow label="사업자등록번호" required error={errors.receiptBusinessNo || errors['receiptInfo.businessNo']}>
                      <input className="ms-input ms-w-sm" inputMode="numeric" value={bank.businessNo} onChange={(e) => setBank({ ...bank, businessNo: formatBizNoInput(e.target.value) })} placeholder="000-00-00000" />
                    </FormRow>
                    <FormRow label="수신 이메일" required error={errors.receiptEmail || errors['receiptInfo.email']}>
                      <input type="email" className="ms-input ms-w-md" value={bank.email} onChange={(e) => setBank({ ...bank, email: e.target.value })} />
                    </FormRow>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* 결제 금액 요약 */}
        <aside className="ms-checkout-side">
          <Card title="결제 금액">
            <div className="ms-summary">
              {plan && (
                <div className="ms-summary-plan">
                  {plan.name}
                  {plan.category !== 'GENERAL' && <PlanBadge plan={plan} />}
                  {quote.data && <Badge tone="slate">{ORDER_TYPE_LABEL[quote.data.orderType]}</Badge>}
                </div>
              )}

              {quote.loading && <Spinner />}
              {quote.error && (
                <Alert tone={quote.error.code === 'ALREADY_MEMBER' ? 'info' : 'warn'}>{quote.error.message}</Alert>
              )}
              {quote.data && (
                <>
                  <dl className="ms-summary-lines">
                    {quote.data.items.map((item) => (
                      <div className="ms-summary-line" key={item.type}>
                        <dt>{item.label}</dt>
                        <dd>{formatWon(item.amount)}</dd>
                      </div>
                    ))}
                    {isTest && (
                      <div className="ms-summary-line is-discount">
                        <dt>테스트 결제 (실제 청구 없음)</dt>
                        <dd>{formatWon(-quote.data.amount)}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="ms-summary-total">
                    <span>총 결제금액</span>
                    <strong>{formatWon(isTest ? 0 : quote.data.amount)}</strong>
                  </div>
                  <dl className="ms-summary-meta">
                    <div>
                      <dt>자격 기간</dt>
                      <dd>
                        {plan?.term === 'ANNUAL'
                          ? quote.data.orderType === 'RENEWAL' && user.membership.expiresAt && new Date(user.membership.expiresAt) > new Date()
                            ? `${addYearText(user.membership.expiresAt)}까지`
                            : `결제일 ~ ${addYearText()}`
                          : '기한 없음'}
                      </dd>
                    </div>
                    <div>
                      <dt>결제 수단</dt>
                      <dd>{method === 'TOSS' ? '카드 · 간편결제' : isTest ? '0원 테스트 결제' : '무통장입금'}</dd>
                    </div>
                  </dl>
                </>
              )}

              <div className={errors.agreeOrder ? 'has-error' : ''}>
                <Checkbox checked={agreeOrder} onChange={setAgreeOrder}>
                  <span className="ms-text-sm">주문 내용(회원 유형 · 금액)을 확인하였으며 결제 진행에 동의합니다.</span>
                </Checkbox>
              </div>

              {payError && <Alert tone="danger">{payError}</Alert>}

              <Button block size="lg" onClick={pay} loading={paying} disabled={!canPay} icon={method === 'BANK_TRANSFER' ? <BankIcon size={16} /> : <CheckIcon size={16} strokeWidth={2.6} />}>
                {method === 'TOSS' ? `${amount ? formatWon(amount) : ''} 결제하기` : isTest ? '0원 테스트 결제하기' : '무통장입금 신청하기'}
              </Button>
            </div>
          </Card>
          <div className="ms-side-help">
            결제 · 영수증 문의 <a href="tel:0220259171">02-2025-9171~2</a> (평일 09:00~18:00)
            <br />
            카드 · 간편결제 영수증은 결제 완료 후 결제 상세에서 확인할 수 있습니다.
          </div>
        </aside>
      </div>
    </MemberPage>
  );
}
