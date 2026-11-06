// src/hooks/useTossPaymentWidget.js
// 토스페이먼츠 결제위젯(v2) 연결. 카드 · 계좌이체 · 가상계좌 · 간편결제(토스페이 · 카카오페이 · 네이버페이 등)를
// 위젯 하나로 보여 줍니다. 보여 줄 결제수단은 토스페이먼츠 상점관리자에서 켜고 끌 수 있습니다.
//
// 설치: npm i @tosspayments/tosspayments-sdk
import { useEffect, useRef, useState } from 'react';

export const TOSS_METHODS_SELECTOR = '#toss-payment-methods';
export const TOSS_AGREEMENT_SELECTOR = '#toss-agreement';

export function useTossPaymentWidget({ enabled, clientKey, customerKey, amount }) {
  const widgetsRef = useRef(null);
  const renderedRef = useRef([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const hasAmount = Boolean(amount);

  useEffect(() => {
    if (!enabled || !clientKey || !customerKey || !hasAmount) return undefined;
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setError(null);
      try {
        // 결제 화면에서만 SDK 를 내려받도록 동적 import (다른 페이지 용량에 영향 없음)
        const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
        const tossPayments = await loadTossPayments(clientKey);
        if (cancelled) return;
        const widgets = tossPayments.widgets({ customerKey });
        await widgets.setAmount({ currency: 'KRW', value: amount });
        const rendered = await Promise.all([
          widgets.renderPaymentMethods({ selector: TOSS_METHODS_SELECTOR, variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: TOSS_AGREEMENT_SELECTOR, variantKey: 'AGREEMENT' }),
        ]);
        if (cancelled) {
          rendered.forEach((w) => w?.destroy?.());
          return;
        }
        renderedRef.current = rendered;
        widgetsRef.current = widgets;
        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      renderedRef.current.forEach((w) => w?.destroy?.());
      renderedRef.current = [];
      widgetsRef.current = null;
    };
    // 금액 변경은 아래 effect 에서 setAmount 로만 반영합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, clientKey, customerKey, hasAmount]);

  useEffect(() => {
    if (status === 'ready' && amount) widgetsRef.current?.setAmount({ currency: 'KRW', value: amount });
  }, [amount, status]);

  /** 서버에서 만든 주문 정보로 결제창을 엽니다. (성공 시 successUrl 로 이동) */
  async function requestPayment(toss) {
    const widgets = widgetsRef.current;
    if (!widgets) throw new Error('결제위젯이 아직 준비되지 않았습니다.');
    await widgets.setAmount({ currency: 'KRW', value: toss.amount });
    const origin = window.location.origin;
    await widgets.requestPayment({
      orderId: toss.orderId,
      orderName: toss.orderName,
      successUrl: `${origin}/membership/payment/success`,
      failUrl: `${origin}/membership/payment/fail`,
      customerEmail: toss.customerEmail,
      customerName: toss.customerName,
      ...(toss.customerMobilePhone ? { customerMobilePhone: toss.customerMobilePhone } : {}),
    });
  }

  return { status, error, requestPayment };
}
