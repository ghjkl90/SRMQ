// src/components/pages/HomeSlidesEditorPage.jsx — 메인 화면 슬라이드 관리 (관리자 전용)
// 새 사진을 올리거나 포상갤러리 사진을 골라 메인 화면 슬라이드로 씁니다. 순서 · 문구 · 링크를 정할 수 있습니다.
// 슬라이드를 모두 비우고 저장하면 메인 화면은 기본 사진을 보여 줍니다.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, assetUrl } from '../../api/client';
import { Alert, Button, Card, MemberPage, MemberPageHeader, SectionTitle, Spinner } from '../member/MemberUI';
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, CheckIcon, ImageIcon, TrashIcon, UploadCloudIcon } from '../member/icons';
import ImageDropzone, { tempKey, toUploadItems, uploadItems } from '../member/ImageDropzone';

const MAX_SLIDES = 30;
// 메인 슬라이드는 화면 가로를 꽉 채우므로 이보다 작은 사진은 흐리게 보입니다.
const MIN_SHARP_WIDTH = 1200;
const isLowRes = (width) => Boolean(width) && width < MIN_SHARP_WIDTH;

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const fromServer = (s) => ({
  key: tempKey(),
  status: 'done',
  imageKey: s.imageKey,
  preview: assetUrl(s.thumbUrl || s.url),
  width: s.width,
  caption: s.caption || '',
  linkUrl: s.linkUrl || '',
});

const validLink = (v) => v === '' || /^\/(?!\/)\S*$/.test(v) || /^https?:\/\/\S+$/i.test(v);

export default function HomeSlidesEditorPage() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [source, setSource] = useState('upload'); // 'upload' | 'gallery'
  const [albums, setAlbums] = useState(null);
  const [albumId, setAlbumId] = useState('');

  useEffect(() => {
    api
      .get('/api/home-slides')
      .then((d) => setSlides(d.slides.map(fromServer)))
      .catch(setLoadError);
  }, []);

  // 갤러리 사진은 '포상갤러리에서 고르기' 를 처음 열 때 불러옴
  useEffect(() => {
    if (source !== 'gallery' || albums) return;
    api
      .get('/api/gallery?drafts=1')
      .then((d) => {
        setAlbums(d.albums);
        setAlbumId(String(d.albums[0]?.id ?? ''));
      })
      .catch(() => setAlbums([]));
  }, [source, albums]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const change = (fn) => {
    setSlides((list) => fn(list));
    setDirty(true);
  };
  const patchSlide = (key, patch) => setSlides((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const roomLeft = MAX_SLIDES - (slides?.length ?? 0);

  async function addFiles(files) {
    setSaveError(null);
    const picked = files.slice(0, Math.max(0, roomLeft));
    if (files.length > picked.length) setSaveError(`슬라이드는 ${MAX_SLIDES}장까지 등록할 수 있습니다.`);
    const { items, rejected } = toUploadItems(picked, { caption: '', linkUrl: '' });
    if (rejected) setSaveError(`JPG, PNG, WEBP 이미지만 올릴 수 있습니다. (${rejected}개 제외)`);
    change((list) => [...list, ...items]);
    await uploadItems(items, patchSlide);
  }

  const album = albums?.find((a) => String(a.id) === albumId);
  const albumPhotos = useMemo(() => album?.sections.flatMap((s) => s.photos) ?? [], [album]);
  const usedKeys = new Set((slides ?? []).map((s) => s.imageKey).filter(Boolean));

  function addFromGallery(photo) {
    if (usedKeys.has(photo.imageKey)) return;
    if (roomLeft <= 0) {
      setSaveError(`슬라이드는 ${MAX_SLIDES}장까지 등록할 수 있습니다.`);
      return;
    }
    change((list) => [
      ...list,
      {
        key: tempKey(),
        status: 'done',
        imageKey: photo.imageKey,
        preview: assetUrl(photo.thumbUrl || photo.url),
        width: photo.width,
        caption: photo.caption?.trim() || album.title,
        linkUrl: `/award-gallery?year=${album.year}`,
      },
    ]);
  }

  async function save() {
    setSaveError(null);
    if (slides.some((s) => s.status === 'uploading')) {
      setSaveError('사진 업로드가 끝난 뒤 저장해 주세요.');
      return;
    }
    const badLink = slides.findIndex((s) => !validLink(s.linkUrl.trim()));
    if (badLink >= 0) {
      setSaveError(`${badLink + 1}번 슬라이드의 링크는 / 로 시작하는 사이트 주소나 https:// 주소로 입력해 주세요.`);
      return;
    }
    const failed = slides.filter((s) => s.status === 'error').length;
    if (failed && !window.confirm(`업로드에 실패한 사진 ${failed}장은 빼고 저장할까요?`)) return;

    setSaving(true);
    try {
      await api.put('/api/admin/home-slides', {
        slides: slides
          .filter((s) => s.status === 'done' && s.imageKey)
          .map((s) => ({ imageKey: s.imageKey, caption: s.caption.trim(), linkUrl: s.linkUrl.trim() })),
      });
      setDirty(false);
      navigate('/');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const goBack = () => {
    if (dirty && !window.confirm('저장하지 않은 내용이 있습니다. 메인 화면으로 이동할까요?')) return;
    navigate('/');
  };

  const header = (
    <MemberPageHeader
      badge="메인 슬라이드"
      badgeEn="HOME SLIDES"
      title="메인 화면 슬라이드 관리"
      desc="첫 화면에서 자동으로 넘어가는 사진을 정합니다. 새 사진을 올리거나 포상갤러리 사진을 골라 넣을 수 있습니다."
    />
  );

  if (loadError || !slides) {
    return (
      <MemberPage width="default">
        {header}
        {loadError ? <Alert tone="danger">{loadError.message}</Alert> : <Spinner label="슬라이드를 불러오는 중입니다" />}
      </MemberPage>
    );
  }

  return (
    <MemberPage width="default">
      {header}

      <Card>
        {saveError && <Alert tone="danger" className="ms-form-alert">{saveError}</Alert>}

        <SectionTitle aside={`${slides.length} / ${MAX_SLIDES}장`}>슬라이드 순서</SectionTitle>
        <p className="ms-hint" style={{ margin: '-6px 0 14px' }}>
          위에서부터 차례로 보입니다. 문구는 사진 왼쪽 아래에, 링크를 넣으면 '자세히 보기' 버튼이 함께 표시됩니다.
          {slides.length === 0 && ' 슬라이드가 없으면 메인 화면은 기본 사진 4장을 보여 줍니다.'}
        </p>

        {slides.length > 0 && (
          <ol className="ms-slide-list">
            {slides.map((slide, i) => (
              <li className="ms-slide-item" key={slide.key}>
                <span className="ms-slide-no">{i + 1}</span>
                <div className="ms-photo-thumb ms-slide-thumb">
                  <img src={slide.preview} alt="" />
                  {slide.status === 'uploading' && (
                    <>
                      <span className="ms-photo-state">{slide.progress}%</span>
                      <span className="ms-photo-progress"><span style={{ width: `${slide.progress}%` }} /></span>
                    </>
                  )}
                  {slide.status === 'error' && <span className="ms-photo-state is-error">업로드 실패<br />{slide.error}</span>}
                </div>
                <div className="ms-slide-fields">
                  {isLowRes(slide.width) && (
                    <p className="ms-slide-warn">
                      사진 가로가 {slide.width}px 로 작아 메인 화면에서 흐리게 보일 수 있습니다. (가로 {MIN_SHARP_WIDTH}px 이상 권장)
                    </p>
                  )}
                  <input
                    className="ms-input"
                    maxLength={200}
                    placeholder="슬라이드 문구 (선택) 예) 2025 SRMQ 컨벤션 · 국가경영대상 시상식"
                    value={slide.caption}
                    onChange={(e) => {
                      patchSlide(slide.key, { caption: e.target.value });
                      setDirty(true);
                    }}
                    aria-label={`${i + 1}번 슬라이드 문구`}
                  />
                  <input
                    className={`ms-input${validLink(slide.linkUrl.trim()) ? '' : ' is-invalid'}`}
                    maxLength={500}
                    placeholder="링크 (선택) 예) /award-gallery?year=2025"
                    value={slide.linkUrl}
                    onChange={(e) => {
                      patchSlide(slide.key, { linkUrl: e.target.value });
                      setDirty(true);
                    }}
                    aria-label={`${i + 1}번 슬라이드 링크`}
                  />
                </div>
                <div className="ms-slide-tools">
                  <button type="button" className="ms-icon-btn" onClick={() => change((l) => move(l, i, i - 1))} disabled={i === 0} aria-label="위로">
                    <ArrowUpIcon size={14} />
                  </button>
                  <button type="button" className="ms-icon-btn" onClick={() => change((l) => move(l, i, i + 1))} disabled={i === slides.length - 1} aria-label="아래로">
                    <ArrowDownIcon size={14} />
                  </button>
                  <button type="button" className="ms-icon-btn is-danger" onClick={() => change((l) => l.filter((s) => s.key !== slide.key))} aria-label="삭제">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <SectionTitle>사진 추가</SectionTitle>
        <div className="ms-segment ms-slide-source" role="tablist" aria-label="사진 가져올 곳">
          <button type="button" role="tab" aria-selected={source === 'upload'} className={source === 'upload' ? 'is-active' : ''} onClick={() => setSource('upload')}>
            <UploadCloudIcon size={15} /> 새 사진 올리기
          </button>
          <button type="button" role="tab" aria-selected={source === 'gallery'} className={source === 'gallery' ? 'is-active' : ''} onClick={() => setSource('gallery')}>
            <ImageIcon size={15} /> 포상갤러리에서 고르기
          </button>
        </div>

        {source === 'upload' ? (
          <ImageDropzone
            onFiles={addFiles}
            hint="가로로 긴 사진(16:9 정도)이 가장 잘 어울립니다. JPG, PNG, WEBP · 사진당 최대 15MB · 자동으로 웹용 크기로 변환됩니다."
          />
        ) : albums === null ? (
          <Spinner label="갤러리 사진을 불러오는 중입니다" />
        ) : albums.length === 0 ? (
          <p className="ms-hint">포상갤러리에 등록된 사진이 없습니다. 먼저 갤러리에 앨범을 등록하거나 새 사진을 올려 주세요.</p>
        ) : (
          <div className="ms-slide-picker">
            <select className="ms-select" value={albumId} onChange={(e) => setAlbumId(e.target.value)} aria-label="앨범 선택">
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.year}년 · {a.title}{a.isPublished ? '' : ' (비공개)'}
                </option>
              ))}
            </select>
            <p className="ms-hint" style={{ margin: 0 }}>
              사진을 누르면 슬라이드 맨 뒤에 추가됩니다. 문구와 링크(해당 연도 갤러리)는 자동으로 채워지며 바꿀 수 있습니다.
              <b> '작은 사진'</b> 표시는 해상도가 낮아 메인 화면에서 흐리게 보일 수 있는 사진입니다.
            </p>
            <ul className="ms-slide-picker-grid">
              {albumPhotos.map((photo) => {
                const used = usedKeys.has(photo.imageKey);
                return (
                  <li key={photo.id}>
                    <button
                      type="button"
                      className={`ms-slide-pick${used ? ' is-used' : ''}`}
                      onClick={() => addFromGallery(photo)}
                      disabled={used}
                      title={photo.caption || album.title}
                    >
                      <img src={assetUrl(photo.thumbUrl || photo.url)} alt={photo.caption || '갤러리 사진'} loading="lazy" />
                      {used && (
                        <span className="ms-slide-pick-badge">
                          <CheckIcon size={13} strokeWidth={3} /> 추가됨
                        </span>
                      )}
                      {!used && isLowRes(photo.width) && <span className="ms-slide-pick-lowres">작은 사진</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      <div className="ms-actions is-between is-plain ms-editor-actions">
        <div className="ms-actions-group">
          <Button variant="outline" icon={<ArrowLeftIcon size={15} />} onClick={goBack}>메인 화면으로</Button>
        </div>
        <div className="ms-actions-group">
          <Button variant="deep" onClick={save} loading={saving}>저장하기</Button>
        </div>
      </div>
    </MemberPage>
  );
}
