// src/components/pages/NoticePage.jsx
import { useMemo, useRef, useState } from "react";
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

const RECENT_NOTICES = [
  { id: 66, title: "2026년도 국가경영대상 및 SRMQ상 응모안내", date: "2026.01.05", views: 175 },
  { id: 65, title: "찬성회원 기부금 후원제도 신설 안내", date: "2025.12.03", views: 121 },
  { id: 64, title: "사회적책임경영품질 컨벤션 2025 참석 안내", date: "2025.09.24", views: 222 },
  { id: 63, title: "2025년도 국가경영대상 및 SRMQ상 응모안내", date: "2025.01.02", views: 921 },
  { id: 62, title: "사회적책임경영품질 컨벤션 2024 안내", date: "2024.10.07", views: 679 },
  { id: 61, title: "2024년 국가경영대상 및 SRMQ상 응모안내", date: "2024.01.02", views: 1164 },
  { id: 60, title: "사회적책임경영품질 컨벤션 2023 안내", date: "2023.10.12", views: 897 },
  { id: 59, title: "2023년 국가경영대상 응모안내", date: "2023.07.17", views: 1236 },
  { id: 58, title: "제3기 ESG 경영전략 교육 안내", date: "2023.03.09", views: 1397 },
  { id: 57, title: "2023년 SRMQ상 응모안내", date: "2023.01.02", views: 1339 },
];

const OLDER_SAMPLE_NOTICES = Array.from({ length: 56 }, (_, i) => {
  const id = 56 - i;
  const d = new Date(2022, 11 - i, 15);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return { id, title: `샘플 공지사항 ${id}`, date, views: ((id * 37) % 900) + 100 };
});

export const SAMPLE_NOTICES = [...RECENT_NOTICES, ...OLDER_SAMPLE_NOTICES];

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

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


const NoticePage = ({ notices = SAMPLE_NOTICES, onSelectNotice }) => {
  const containerRef = useRef(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [field, setField] = useState("all");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const list = q
      ? notices.filter((n) => {
          const target = field === "all" ? `${n.title} ${n.content ?? ""}` : n.title;
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

  const changePage = (p) => {
    setPage(p);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
                      onClick={() => onSelectNotice?.(notice)}
                    >
                      {notice.title}
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
      </div>
    </div>
  );
};

export default NoticePage;
