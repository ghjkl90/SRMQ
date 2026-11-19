// src/components/member/ImageDropzone.jsx
// 사진 끌어다 놓기 · 파일 선택 영역 (포상갤러리 · 메인 슬라이드 편집 화면 공통)
import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { Button } from './MemberUI';
import { PaperclipIcon, UploadCloudIcon } from './icons';

export const IMAGE_MAX_MB = 15;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

let tempSeq = 0;
export const tempKey = () => `t${Date.now()}-${(tempSeq += 1)}`;

export default function ImageDropzone({ onFiles, title, hint, multiple = true }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      className={`ms-dropzone${over ? ' is-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
    >
      <span className="ms-dropzone-icon"><UploadCloudIcon size={20} /></span>
      <p className="ms-dropzone-title">{title || '사진을 마우스로 끌어다 놓거나 아래 버튼을 클릭하여 선택하세요.'}</p>
      <p className="ms-dropzone-hint">
        {hint || `지원 형식: JPG, PNG, WEBP (사진당 최대 ${IMAGE_MAX_MB}MB, 여러 장 선택 가능 · 자동으로 웹용 크기로 변환됩니다)`}
      </p>
      <Button variant="outline" size="sm" icon={<PaperclipIcon size={14} />} onClick={() => inputRef.current?.click()}>
        파일 찾아보기
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles([...e.target.files]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/**
 * 고른 파일을 화면 목록용 항목으로 바꿉니다. (형식이 아닌 파일은 빼고, 용량 초과는 오류 상태로)
 * 반환: { items, rejected }
 */
export function toUploadItems(files, extra = {}) {
  const accepted = files.filter((f) => IMAGE_ACCEPT.includes(f.type));
  const items = accepted.map((file) => {
    const tooBig = file.size > IMAGE_MAX_MB * 1024 * 1024;
    return {
      key: tempKey(),
      file,
      status: tooBig ? 'error' : 'uploading',
      error: tooBig ? `${IMAGE_MAX_MB}MB 초과` : null,
      progress: 0,
      preview: URL.createObjectURL(file),
      imageKey: null,
      ...extra,
    };
  });
  return { items, rejected: files.length - accepted.length };
}

/** 업로드 대기 항목을 3장씩 동시에 올립니다. onUpdate(itemKey, patch) 로 진행 상황을 알려 줍니다. */
export async function uploadItems(items, onUpdate) {
  const queue = items.filter((i) => i.status === 'uploading');
  const worker = async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        const res = await api.upload('/api/admin/uploads', item.file, {
          onProgress: (p) => onUpdate(item.key, { progress: p }),
        });
        onUpdate(item.key, { status: 'done', imageKey: res.imageKey, width: res.width, height: res.height, progress: 100 });
      } catch (err) {
        onUpdate(item.key, { status: 'error', error: err.message });
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
