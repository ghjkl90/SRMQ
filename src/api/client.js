// src/api/client.js
// 백엔드 API 호출 도우미. 로그인 쿠키를 함께 보내고, 오류는 ApiError 로 통일합니다.
//
// API 주소
//  - 같은 도메인에서 /api 로 운영(권장): 환경변수 없이 그대로 사용
//  - 프론트와 API 주소가 다르면: .env 에 VITE_API_BASE_URL=https://api.srmq.or.kr

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, code, message, fields = {}, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields || {};
    this.extra = extra || {};
  }
}

const NETWORK_MESSAGE = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';

async function request(method, path, body, { signal } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_MESSAGE);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const e = data?.error || {};
    throw new ApiError(
      response.status,
      e.code || `HTTP_${response.status}`,
      e.message || (response.status >= 500 ? '서버 오류가 발생했습니다.' : '요청을 처리하지 못했습니다.'),
      e.fields,
      e,
    );
  }
  return data;
}

/** 진행률(%)을 받을 수 있는 파일 업로드 */
function upload(path, file, { fieldName = 'file', onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + path);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* 무시 */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else {
        const e = data?.error || {};
        reject(new ApiError(xhr.status, e.code || `HTTP_${xhr.status}`, e.message || '업로드에 실패했습니다.', e.fields, e));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', NETWORK_MESSAGE));
    const form = new FormData();
    form.append(fieldName, file);
    xhr.send(form);
  });
}

export const api = {
  get: (path, opts) => request('GET', path, undefined, opts),
  post: (path, body = {}, opts) => request('POST', path, body, opts),
  put: (path, body = {}, opts) => request('PUT', path, body, opts),
  patch: (path, body = {}, opts) => request('PATCH', path, body, opts),
  delete: (path, opts) => request('DELETE', path, undefined, opts),
  upload,
};

/** /uploads/... 같은 서버 파일 주소 (API 가 다른 도메인이면 앞에 붙여 줌) */
export const assetUrl = (url) => (url && url.startsWith('/') ? BASE + url : url);

/** 관리자 CSV 다운로드처럼 링크로 여는 API 주소 */
export const apiUrl = (path) => BASE + path;
