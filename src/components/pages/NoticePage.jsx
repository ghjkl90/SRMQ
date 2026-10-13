// src/components/pages/NoticePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { NOTICES } from "./noticeData";
import "./NoticePage.css";

const PAGE_SIZE = 10;
const PAGE_GROUP = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "views", label: "Most viewed" },
];

const SEARCH_FIELDS = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
];

// 기존 import(SAMPLE_NOTICES) 호환용
export { NOTICES };
export const SAMPLE_NOTICES = NOTICES;

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

const cellText = (cell) => (typeof cell === "string" ? cell : cell.text);

const listItemsText = (items = []) =>
  items
    .map((it) => (typeof it === "string" ? it : `${it.text} ${listItemsText(it.items)}`))
    .join(" ");

// 검색용: 본문 블록을 평문으로 변환
const contentToText = (blocks = []) =>
  blocks
    .map((b) => {
      switch (b.type) {
        case "table":
          return [...b.head, ...b.body].flat().map(cellText).join(" ");
        case "items":
          return b.items
            .map((it) => `${it.label} ${it.value ?? ""} ${contentToText(it.children)}`)
            .join(" ");
        case "section":
          return `${b.title} ${b.value ?? ""} ${contentToText(b.children)}`;
        case "list":
          return listItemsText(b.items);
        case "lines":
          return b.lines.join(" ");
        default:
          return b.text ?? "";
      }
    })
    .join(" ");

// 전화번호 → tel: 링크 (02-2025-9171~2 처럼 범위 표기는 첫 번호로 연결)
const telHref = (tel) => `tel:${tel.split("~")[0].replace(/\D/g, "")}`;

// 본문 속 URL·이메일을 링크로 변환
const LINK_PATTERN = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

const RichText = ({ text }) =>
  text.split(LINK_PATTERN).map((part, i) => {
    if (i % 2 === 0) return part;
    const isUrl = part.startsWith("http");
    return (
      <a
        key={i}
        className="notice-doc-link"
        href={isUrl ? part : `mailto:${part}`}
        {...(isUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {part}
      </a>
    );
  });

const formatFileSize = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
};

const getExt = (name) => name.split(".").pop().toLowerCase();

/* ------------------------------------------------------------------ */
/* 주소(URL)와 상세보기 동기화                                           */
/* 상세보기를 열면 ?no=66 처럼 주소에 글 번호를 남겨 브라우저 기록에 쌓습니다. */
/* → 뒤로가기 시 메인이 아니라 공지 목록으로 돌아오고, 새로고침해도 글이 유지됩니다. */
/* ------------------------------------------------------------------ */

const URL_PARAM = "no";

const readNoticeNoFromUrl = () => {
  const value = new URLSearchParams(window.location.search).get(URL_PARAM);
  const no = Number(value);
  return value && Number.isInteger(no) ? no : null;
};

const buildUrl = (no) => {
  const url = new URL(window.location.href);
  if (no == null) url.searchParams.delete(URL_PARAM);
  else url.searchParams.set(URL_PARAM, String(no));
  return url.pathname + url.search + url.hash;
};

// 라우터가 history.state에 넣어둔 값(react-router의 key·idx 등)은 그대로 보존
const currentHistoryState = () => window.history.state ?? {};

/* ------------------------------------------------------------------ */
/* 아이콘                                                              */
/* ------------------------------------------------------------------ */

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* 목록 공통 컴포넌트                                                   */
/* ------------------------------------------------------------------ */

const SelectBox = ({ value, onChange, options, label, className = "" }) => (
  <div className={`notice-select ${className}`}>
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown />
  </div>
);

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const groupStart = Math.floor((page - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);

  return (
    <nav className="notice-pagination" aria-label="공지사항 페이지">
      {page > 1 && (
        <>
          <button type="button" className="notice-page-text" onClick={() => onChange(1)}>
            First
          </button>
          <button type="button" className="notice-page-arrow" onClick={() => onChange(page - 1)}
            aria-label="이전 페이지">
            ‹
          </button>
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`notice-page-num${p === page ? " is-active" : ""}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      {page < totalPages && (
        <>
          <button type="button" className="notice-page-arrow" onClick={() => onChange(page + 1)}
            aria-label="다음 페이지">
            ›
          </button>
          <button type="button" className="notice-page-text" onClick={() => onChange(totalPages)}>
            Last
          </button>
        </>
      )}
    </nav>
  );
};

/* ------------------------------------------------------------------ */
/* 상세 보기 컴포넌트                                                   */
/* ------------------------------------------------------------------ */

const renderCell = (cell, key, inHead) => {
  const c = typeof cell === "string" ? { text: cell } : cell;
  const Tag = inHead || c.th ? "th" : "td";
  const scope = inHead ? (c.colSpan ? "colgroup" : "col") : c.th ? "row" : undefined;
  return (
    <Tag
      key={key}
      colSpan={c.colSpan}
      rowSpan={c.rowSpan}
      scope={scope}
      className={c.nowrap ? "is-nowrap" : undefined}
    >
      {c.text}
    </Tag>
  );
};

const ContentBlocks = ({ blocks = [] }) =>
  blocks.map((block, i) => <ContentBlock block={block} key={i} />);

const DocList = ({ items, marker = "dot" }) => (
  <ul className={`notice-doc-list is-${marker}`}>
    {items.map((item, i) => {
      const it = typeof item === "string" ? { text: item } : item;
      return (
        <li key={i}>
          <RichText text={it.text} />
          {it.items && <DocList items={it.items} marker={it.marker ?? "dash"} />}
        </li>
      );
    })}
  </ul>
);

const ContactLinks = ({ contact }) => (
  <span className="notice-doc-contact">
    {contact.tel && <a href={telHref(contact.tel)}>Tel. {contact.tel}</a>}
    {contact.fax && <span>Fax. {contact.fax}</span>}
    {contact.email && <a href={`mailto:${contact.email}`}>E-mail. {contact.email}</a>}
  </span>
);

const ContentBlock = ({ block }) => {
  switch (block.type) {
    case "center":
      return <p className="notice-doc-center">{block.text}</p>;
    case "heading":
      return <h4 className="notice-doc-heading">{block.text}</h4>;
    case "section": {
      const level = block.level ?? 1;
      const Title = level === 1 ? "h4" : "h5";
      return (
        <div className={`notice-doc-section level-${level}`}>
          <Title className="notice-doc-section-title">
            {block.title}
            {block.value && <span className="notice-doc-section-value"> : {block.value}</span>}
          </Title>
          {block.children?.length > 0 && (
            <div className="notice-doc-section-body">
              <ContentBlocks blocks={block.children} />
            </div>
          )}
        </div>
      );
    }
    case "list":
      return <DocList items={block.items} marker={block.marker} />;
    case "lines":
      return (
        <p className="notice-doc-lines">
          {block.lines.map((line, i) => (
            <span key={i}>
              <RichText text={line} />
            </span>
          ))}
        </p>
      );
    case "callout":
      return (
        <p className="notice-doc-callout">
          <RichText text={block.text} />
        </p>
      );
    case "table":
      return (
        <div className="notice-doc-table-wrap">
          <table
            className={`notice-doc-table${block.compact ? " is-compact" : ""}`}
            aria-label={block.label}
          >
            <thead>
              {block.head.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => renderCell(cell, c, true))}</tr>
              ))}
            </thead>
            <tbody>
              {block.body.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => renderCell(cell, c, false))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "items":
      return (
        <dl className="notice-doc-items">
          {block.items.map((item) => (
            <div className="notice-doc-item" key={item.label}>
              <dt>{item.label}</dt>
              <dd>
                {item.value && <RichText text={item.value} />}
                {item.contact && <ContactLinks contact={item.contact} />}
                {item.children && <ContentBlocks blocks={item.children} />}
              </dd>
            </div>
          ))}
        </dl>
      );
    case "note":
      return (
        <p className="notice-doc-note">
          <RichText text={block.text} />
        </p>
      );
    case "sign":
      return <p className="notice-doc-sign">{block.text}</p>;
    case "p":
    default:
      return (
        <p className="notice-doc-p">
          <RichText text={block.text} />
        </p>
      );
  }
};

const AttachmentList = ({ files }) => (
  <section className="notice-attach" aria-label="첨부파일">
    <p className="notice-attach-label">
      <PaperclipIcon />
      Attachments <strong>{files.length}</strong>
    </p>
    <ul className="notice-attach-list">
      {files.map((file) => {
        const ext = getExt(file.name);
        return (
          <li key={file.url}>
            <a className="notice-attach-link" href={file.url} download={file.name}>
              <span className={`notice-attach-ext is-${ext}`}>{ext.toUpperCase()}</span>
              <span className="notice-attach-name">{file.name}</span>
              {file.size != null && (
                <span className="notice-attach-size">{formatFileSize(file.size)}</span>
              )}
              <DownloadIcon />
            </a>
          </li>
        );
      })}
    </ul>
  </section>
);

const NoticeNavRow = ({ label, notice, onSelect }) => (
  <div className="notice-row" role="row">
    <div className="notice-row-inner">
      <span className="notice-col-num notice-nav-label" role="rowheader">{label}</span>
      <span className="notice-col-title" role="cell">
        {notice ? (
          <button type="button" className="notice-title-link" onClick={() => onSelect(notice)}>
            {notice.title}
          </button>
        ) : (
          <span className="notice-nav-none">글이 없습니다.</span>
        )}
      </span>
      <span className="notice-col-date" role="cell">{notice?.date ?? ""}</span>
      <span className="notice-col-views" role="cell">{notice?.views ?? ""}</span>
    </div>
  </div>
);

const NoticeDetail = ({ notice, prev, next, onSelect, onBack }) => {
  const hasContent = Array.isArray(notice.content) && notice.content.length > 0;
  const files = notice.attachments ?? [];

  return (
    <article className="notice-detail" aria-labelledby="notice-detail-title">
      <header className="notice-detail-section">
        <div className="notice-detail-inner notice-detail-head">
          <h3 className="notice-detail-title" id="notice-detail-title">{notice.title}</h3>
          <dl className="notice-detail-meta">
            <div>
              <dt>Date</dt>
              <dd>{notice.datetime ?? notice.date}</dd>
            </div>
            <div>
              <dt>Views</dt>
              <dd>{notice.views}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="notice-detail-section">
        <div className="notice-detail-inner notice-detail-body">
          {files.length > 0 && <AttachmentList files={files} />}
          {hasContent ? (
            <div className="notice-doc">
              {notice.content.map((block, i) => (
                <ContentBlock block={block} key={i} />
              ))}
            </div>
          ) : (
            <p className="notice-detail-empty">등록된 본문이 없습니다.</p>
          )}
        </div>
      </div>

      <div className="notice-detail-nav" role="table" aria-label="이전·다음 글">
        <NoticeNavRow label="Prev" notice={prev} onSelect={onSelect} />
        <NoticeNavRow label="Next" notice={next} onSelect={onSelect} />
      </div>

      <div className="notice-detail-actions">
        <button type="button" className="notice-list-btn" onClick={onBack}>
          List
        </button>
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* 페이지                                                              */
/* ------------------------------------------------------------------ */

const NoticePage = ({ notices = NOTICES, onSelectNotice }) => {
  const containerRef = useRef(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [field, setField] = useState("all");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(readNoticeNoFromUrl);

  // 브라우저 뒤로가기/앞으로가기 → 주소의 글 번호에 맞춰 목록/상세 전환
  useEffect(() => {
    const handlePopState = () => {
      setSelectedId(readNoticeNoFromUrl());
      containerRef.current?.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const list = q
      ? notices.filter((n) => {
          const target =
            field === "all" ? `${n.title} ${contentToText(n.content)}` : n.title;
          return target.toLowerCase().includes(q);
        })
      : notices;

    return [...list].sort((a, b) => {
      if (sort === "oldest") return a.date.localeCompare(b.date) || a.id - b.id;
      if (sort === "views") return b.views - a.views;
      return b.date.localeCompare(a.date) || b.id - a.id;
    });
  }, [notices, keyword, field, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectedNotice = selectedId != null ? notices.find((n) => n.id === selectedId) : null;
  const selectedIndex = selectedNotice ? filtered.findIndex((n) => n.id === selectedId) : -1;
  const prevNotice = selectedIndex > 0 ? filtered[selectedIndex - 1] : null;
  const nextNotice =
    selectedIndex >= 0 && selectedIndex < filtered.length - 1 ? filtered[selectedIndex + 1] : null;

  const scrollToTop = () => containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const changePage = (p) => {
    setPage(p);
    scrollToTop();
  };

  const openNotice = (notice) => {
    const state = currentHistoryState();
    // noticeDepth: 목록에서 몇 번째로 연 상세인지 (List 버튼에서 한 번에 목록으로 복귀할 때 사용)
    const noticeDepth = (state.noticeDepth ?? 0) + 1;
    window.history.pushState({ ...state, noticeNo: notice.id, noticeDepth }, "", buildUrl(notice.id));
    setSelectedId(notice.id);
    onSelectNotice?.(notice);
    scrollToTop();
  };

  const backToList = () => {
    const depth = currentHistoryState().noticeDepth ?? 0;
    if (depth > 0) {
      // 목록에서 들어온 경우: 쌓인 기록만큼 되돌아가 목록 상태(정렬·검색·페이지)를 그대로 복원
      window.history.go(-depth);
      return;
    }
    // 링크·새로고침으로 상세에 바로 들어온 경우: 현재 기록을 목록 주소로 교체
    window.history.replaceState(
      { ...currentHistoryState(), noticeNo: null, noticeDepth: 0 },
      "",
      buildUrl(null)
    );
    setSelectedId(null);
    scrollToTop();
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(keywordInput);
    setPage(1);
  };

  return (
    <div className="notice-container" ref={containerRef}>
      <div className="notice-content">
        {/* 페이지 헤더 */}
        <header className="notice-header">
          <div className="notice-badge-box">
            <span className="notice-badge-kr">공지사항</span>
            <span className="notice-badge-en">NOTICE &amp; ANNOUNCEMENTS</span>
          </div>
          <h2 className="notice-title">공지사항 및 소식</h2>
          <p className="notice-subtitle">
            사단법인 사회적책임경영품질원의 주요 사업 공고, 포상 응모 안내 및 최신 소식을
            전해드립니다.
          </p>
        </header>

        {selectedNotice ? (
          <NoticeDetail
            notice={selectedNotice}
            prev={prevNotice}
            next={nextNotice}
            onSelect={openNotice}
            onBack={backToList}
          />
        ) : (
          <>
            {/* 상단 툴바 */}
            <div className="notice-toolbar">
              <p className="notice-total">
                Total <strong>{filtered.length}</strong>
              </p>
              <SelectBox value={sort} onChange={handleSortChange} options={SORT_OPTIONS} label="정렬" />
            </div>

            {/* 목록 */}
            <div className="notice-table" role="table" aria-label="공지사항 목록">
              <div className="notice-row notice-row-head" role="row">
                <div className="notice-row-inner">
                  <span className="notice-col-num" role="columnheader">Number</span>
                  <span className="notice-col-title" role="columnheader">Title</span>
                  <span className="notice-col-date" role="columnheader">Date</span>
                  <span className="notice-col-views" role="columnheader">Views</span>
                </div>
              </div>

              {pageItems.length === 0 ? (
                <div className="notice-empty" role="row">
                  <span role="cell">검색 결과가 없습니다. 다른 검색어로 다시 검색해 보세요.</span>
                </div>
              ) : (
                pageItems.map((notice) => (
                  <div className="notice-row" role="row" key={notice.id}>
                    <div className="notice-row-inner">
                      <span className="notice-col-num" role="cell">{notice.id}</span>
                      <span className="notice-col-title" role="cell">
                        <button
                          type="button"
                          className="notice-title-link"
                          onClick={() => openNotice(notice)}
                        >
                          {notice.title}
                          {notice.attachments?.length > 0 && (
                            <span className="notice-title-clip" aria-label="첨부파일 있음">
                              <PaperclipIcon />
                            </span>
                          )}
                        </button>
                      </span>
                      <span className="notice-col-date" role="cell">{notice.date}</span>
                      <span className="notice-col-views" role="cell">{notice.views}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={changePage} />

            {/* 검색 */}
            <form className="notice-search" onSubmit={handleSearch} role="search">
              <SelectBox value={field} onChange={setField} options={SEARCH_FIELDS} label="검색 범위" />
              <input
                type="search"
                className="notice-search-input"
                placeholder="검색어를 입력하세요"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                aria-label="검색어"
              />
              <button type="submit" className="notice-search-btn">
                Search
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default NoticePage;
