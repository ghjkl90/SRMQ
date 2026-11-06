// src/components/pages/GalleryEditorPage.jsx — 포상갤러리 앨범 등록 · 수정 (관리자 전용)
// 화면 구성은 공지사항 등록 디자인(분류 · 제목 · 작성정보 박스 · 첨부 드롭존 · 목록으로/임시저장/등록하기)을 따릅니다.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, assetUrl } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  FormRow,
  MemberPage,
  MemberPageHeader,
  SectionTitle,
  Spinner,
} from '../member/MemberUI';
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, PaperclipIcon, PlusIcon, TrashIcon, UploadCloudIcon } from '../member/icons';
import { formatDate } from '../member/membership';

const MAX_MB = 15;
const ACCEPT = 'image/jpeg,image/png,image/webp';
let tempSeq = 0;
const newKey = () => `t${Date.now()}-${(tempSeq += 1)}`;

const emptySection = () => ({ key: newKey(), title: '', photos: [] });

function toEditorAlbum(album) {
  return {
    year: album.year,
    title: album.title,
    isPublished: album.isPublished,
    sortOrder: album.sortOrder ?? 0,
    createdAt: album.updatedAt,
    sections: album.sections.map((s) => ({
      key: newKey(),
      title: s.title || '',
      photos: s.photos.map((p) => ({
        key: newKey(),
        status: 'done',
        imageKey: p.imageKey,
        preview: assetUrl(p.thumbUrl || p.url),
        caption: p.caption || '',
      })),
    })),
  };
}

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

function Dropzone({ onFiles }) {
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
      <p className="ms-dropzone-title">사진을 마우스로 끌어다 놓거나 아래 버튼을 클릭하여 선택하세요.</p>
      <p className="ms-dropzone-hint">지원 형식: JPG, PNG, WEBP (사진당 최대 {MAX_MB}MB, 여러 장 선택 가능 · 자동으로 웹용 크기로 변환됩니다)</p>
      <Button variant="outline" size="sm" icon={<PaperclipIcon size={14} />} onClick={() => inputRef.current?.click()}>
        파일 찾아보기
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          onFiles([...e.target.files]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function GalleryEditorPage() {
  const { albumId } = useParams();
  const isEdit = Boolean(albumId);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const thisYear = new Date().getFullYear();
  const initialYear = Number(params.get('year')) || thisYear;
  const [album, setAlbum] = useState(
    isEdit
      ? null
      : { year: initialYear, title: `${initialYear}년 SRMQ 컨벤션 사진`, isPublished: true, sortOrder: 0, sections: [emptySection()] },
  );
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(null); // 'draft' | 'publish'
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/api/admin/gallery/albums/${albumId}`)
      .then((d) => setAlbum(toEditorAlbum(d.album)))
      .catch((err) => setLoadError(err));
  }, [isEdit, albumId]);

  // 저장하지 않고 창을 닫으려 하면 경고
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
    setAlbum((a) => fn(a));
    setDirty(true);
  };
  const updateSection = (sKey, fn) =>
    update((a) => ({ ...a, sections: a.sections.map((s) => (s.key === sKey ? fn(s) : s)) }));
  const updatePhoto = (sKey, pKey, patch) =>
    setAlbum((a) => ({
      ...a,
      sections: a.sections.map((s) =>
        s.key === sKey ? { ...s, photos: s.photos.map((p) => (p.key === pKey ? { ...p, ...patch } : p)) } : s,
      ),
    }));

  async function addFiles(sKey, files) {
    const accepted = files.filter((f) => ACCEPT.includes(f.type));
    const rejected = files.length - accepted.length;
    if (rejected) setSaveError(`JPG, PNG, WEBP 이미지만 올릴 수 있습니다. (${rejected}개 제외)`);

    const items = accepted.map((file) => ({
      key: newKey(),
      file,
      status: file.size > MAX_MB * 1024 * 1024 ? 'error' : 'uploading',
      error: file.size > MAX_MB * 1024 * 1024 ? `${MAX_MB}MB 초과` : null,
      progress: 0,
      preview: URL.createObjectURL(file),
      caption: '',
      imageKey: null,
    }));
    updateSection(sKey, (s) => ({ ...s, photos: [...s.photos, ...items] }));

    // 3장씩 나누어 순서대로 업로드
    const queue = items.filter((i) => i.status === 'uploading');
    const worker = async () => {
      while (queue.length) {
        const item = queue.shift();
        try {
          const res = await api.upload('/api/admin/uploads', item.file, {
            onProgress: (p) => updatePhoto(sKey, item.key, { progress: p }),
          });
          updatePhoto(sKey, item.key, { status: 'done', imageKey: res.imageKey, progress: 100 });
        } catch (err) {
          updatePhoto(sKey, item.key, { status: 'error', error: err.message });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  async function save(publish) {
    setSaveError(null);
    const e = {};
    if (!album.title.trim()) e.title = '앨범 제목을 입력해 주세요.';
    if (!album.year || album.year < 1990 || album.year > 2100) e.year = '연도를 확인해 주세요.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const photos = album.sections.flatMap((s) => s.photos);
    if (photos.some((p) => p.status === 'uploading')) {
      setSaveError('사진 업로드가 끝난 뒤 저장해 주세요.');
      return;
    }
    const failed = photos.filter((p) => p.status === 'error').length;
    if (failed && !window.confirm(`업로드에 실패한 사진 ${failed}장은 빼고 저장할까요?`)) return;

    setSaving(publish ? 'publish' : 'draft');
    try {
      const body = {
        year: Number(album.year),
        title: album.title.trim(),
        isPublished: publish,
        sortOrder: album.sortOrder ?? 0,
        sections: album.sections.map((s) => ({
          title: s.title.trim() || null,
          photos: s.photos.filter((p) => p.status === 'done' && p.imageKey).map((p) => ({ imageKey: p.imageKey, caption: p.caption.trim() })),
        })),
      };
      const res = isEdit
        ? await api.put(`/api/admin/gallery/albums/${albumId}`, body)
        : await api.post('/api/admin/gallery/albums', body);
      setDirty(false);
      navigate(`/award-gallery?year=${res.album.year}`);
    } catch (err) {
      setSaveError(err.message);
      setErrors(err.fields || {});
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/gallery/albums/${albumId}`);
      setDirty(false);
      navigate(`/award-gallery?year=${album.year}`);
    } catch (err) {
      setSaveError(err.message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const goBack = () => {
    if (dirty && !window.confirm('저장하지 않은 내용이 있습니다. 목록으로 이동할까요?')) return;
    navigate(`/award-gallery${album?.year ? `?year=${album.year}` : ''}`);
  };

  const header = (
    <MemberPageHeader
      badge="포상갤러리"
      badgeEn="GALLERY POST"
      title={isEdit ? '갤러리 수정' : '갤러리 등록'}
      desc="사단법인 사회적책임경영품질원의 국가경영대상/SRMQ상 시상식과 컨벤션 현장 사진을 등록합니다."
    />
  );

  if (loadError) {
    return (
      <MemberPage width="default" footerRight="Awards & Events Gallery">
        {header}
        <Alert tone="danger">{loadError.message}</Alert>
      </MemberPage>
    );
  }
  if (!album) {
    return (
      <MemberPage width="default" footerRight="Awards & Events Gallery">
        {header}
        <Spinner label="앨범을 불러오는 중입니다" />
      </MemberPage>
    );
  }

  const photoTotal = album.sections.reduce((s, sec) => s + sec.photos.length, 0);
  const years = Array.from({ length: thisYear + 2 - 2010 }, (_, i) => thisYear + 1 - i);

  return (
    <MemberPage width="default" footerRight="Awards & Events Gallery">
      {header}

      <Card>
        {saveError && <Alert tone="danger" className="ms-form-alert">{saveError}</Alert>}

        <div className="ms-editor-top">
          <FormRow label="연도" required error={errors.year}>
            <select className="ms-select" value={album.year} onChange={(e) => update((a) => ({ ...a, year: Number(e.target.value) }))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </FormRow>
          <p className="ms-editor-note">* 같은 연도에 앨범이 여러 개면 연도 탭 안에 차례로 표시됩니다.</p>
        </div>

        <FormRow label="앨범 제목" required error={errors.title}>
          <input className="ms-input" maxLength={120} placeholder="예) 2026년 SRMQ 컨벤션 사진" value={album.title} onChange={(e) => update((a) => ({ ...a, title: e.target.value }))} />
        </FormRow>

        <dl className="ms-info-strip" style={{ margin: '10px 0 26px' }}>
          <div>
            <dt>작성자</dt>
            <dd>{user?.name || '관리자'}</dd>
          </div>
          <div>
            <dt>작성부서</dt>
            <dd>사무국</dd>
          </div>
          <div>
            <dt>{isEdit ? '최근 수정' : '등록일자'}</dt>
            <dd>{formatDate(isEdit ? album.createdAt : new Date())}</dd>
          </div>
          <div>
            <dt>공개 상태</dt>
            <dd className={!isEdit || album.isPublished ? 'is-live' : 'is-draft'}>
              {!isEdit ? '● 등록 시 즉시 공개' : album.isPublished ? '● 공개 중' : '○ 비공개 (임시저장)'}
            </dd>
          </div>
        </dl>

        <SectionTitle aside={`섹션 ${album.sections.length}개 · 사진 ${photoTotal}장`}>사진 구성</SectionTitle>
        <p className="ms-hint" style={{ margin: '-6px 0 14px' }}>
          섹션은 갤러리의 소제목 단위입니다. (예: 첫 섹션은 제목 없이 개회 사진, 다음 섹션 "국가경영대상 시상식") 사진 순서는 화살표로 바꿀 수 있습니다.
        </p>

        {album.sections.map((section, sIndex) => (
          <div className="ms-gallery-section" key={section.key}>
            <div className="ms-gallery-section-head">
              <span className="ms-gallery-section-no">섹션 {sIndex + 1}</span>
              <input
                className="ms-input"
                maxLength={120}
                placeholder={sIndex === 0 ? '소제목 (비워 두면 제목 없이 표시)' : '소제목 (예: 국가경영대상/SRMQ상 시상식)'}
                value={section.title}
                onChange={(e) => updateSection(section.key, (s) => ({ ...s, title: e.target.value }))}
                aria-label={`섹션 ${sIndex + 1} 소제목`}
              />
              <button type="button" className="ms-icon-btn" onClick={() => update((a) => ({ ...a, sections: move(a.sections, sIndex, sIndex - 1) }))} disabled={sIndex === 0} aria-label="섹션 위로">
                <ArrowUpIcon size={15} />
              </button>
              <button type="button" className="ms-icon-btn" onClick={() => update((a) => ({ ...a, sections: move(a.sections, sIndex, sIndex + 1) }))} disabled={sIndex === album.sections.length - 1} aria-label="섹션 아래로">
                <ArrowDownIcon size={15} />
              </button>
              <button
                type="button"
                className="ms-icon-btn is-danger"
                onClick={() => {
                  if (section.photos.length && !window.confirm(`섹션 ${sIndex + 1}의 사진 ${section.photos.length}장을 함께 삭제할까요?`)) return;
                  update((a) => ({ ...a, sections: a.sections.length > 1 ? a.sections.filter((s) => s.key !== section.key) : [emptySection()] }));
                }}
                aria-label="섹션 삭제"
              >
                <TrashIcon size={15} />
              </button>
            </div>

            <div className="ms-gallery-section-body">
              {section.photos.length > 0 && (
                <ul className="ms-photo-grid">
                  {section.photos.map((photo, pIndex) => (
                    <li className="ms-photo" key={photo.key}>
                      <div className="ms-photo-thumb">
                        <img src={photo.preview} alt="" />
                        {photo.status === 'uploading' && (
                          <>
                            <span className="ms-photo-state">{photo.progress}%</span>
                            <span className="ms-photo-progress"><span style={{ width: `${photo.progress}%` }} /></span>
                          </>
                        )}
                        {photo.status === 'error' && <span className="ms-photo-state is-error">업로드 실패<br />{photo.error}</span>}
                      </div>
                      <input
                        className="ms-input"
                        maxLength={300}
                        placeholder="사진 설명 (예: 대회사 – ○○○ 회장님)"
                        value={photo.caption}
                        onChange={(e) => {
                          updatePhoto(section.key, photo.key, { caption: e.target.value });
                          setDirty(true);
                        }}
                        aria-label="사진 설명"
                      />
                      <div className="ms-photo-tools">
                        <button type="button" className="ms-icon-btn" onClick={() => updateSection(section.key, (s) => ({ ...s, photos: move(s.photos, pIndex, pIndex - 1) }))} disabled={pIndex === 0} aria-label="앞으로">
                          <ArrowLeftIcon size={14} />
                        </button>
                        <button type="button" className="ms-icon-btn" onClick={() => updateSection(section.key, (s) => ({ ...s, photos: move(s.photos, pIndex, pIndex + 1) }))} disabled={pIndex === section.photos.length - 1} aria-label="뒤로">
                          <ArrowLeftIcon size={14} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button type="button" className="ms-icon-btn is-danger" onClick={() => updateSection(section.key, (s) => ({ ...s, photos: s.photos.filter((p) => p.key !== photo.key) }))} aria-label="사진 삭제">
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Dropzone onFiles={(files) => addFiles(section.key, files)} />
            </div>
          </div>
        ))}

        <Button variant="outline" icon={<PlusIcon size={15} />} onClick={() => update((a) => ({ ...a, sections: [...a.sections, emptySection()] }))} className="ms-add-section">
          섹션 추가
        </Button>
      </Card>

      <div className="ms-actions is-between is-plain ms-editor-actions">
        <div className="ms-actions-group">
          <Button variant="outline" icon={<ArrowLeftIcon size={15} />} onClick={goBack}>목록으로</Button>
          {isEdit && <Button variant="danger-outline" icon={<TrashIcon size={15} />} onClick={() => setConfirmDelete(true)}>앨범 삭제</Button>}
        </div>
        <div className="ms-actions-group">
          <Button variant="light" onClick={() => save(false)} loading={saving === 'draft'} disabled={Boolean(saving)}>
            {isEdit && album.isPublished ? '비공개로 저장' : '임시저장'}
          </Button>
          <Button variant="deep" onClick={() => save(true)} loading={saving === 'publish'} disabled={Boolean(saving)}>
            {isEdit ? '수정 완료' : '등록하기'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="앨범을 삭제할까요?"
        confirmLabel="삭제"
        tone="danger"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      >
        “{album.title}” 앨범과 사진 {photoTotal}장이 홈페이지에서 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
      </ConfirmDialog>
    </MemberPage>
  );
}
