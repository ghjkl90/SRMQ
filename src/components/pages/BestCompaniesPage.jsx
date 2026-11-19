// src/components/pages/BestCompaniesPage.jsx — SRMQ포상 > 베스트 기업
// 관리자가 입력한 점수로 1~3위는 시상대 그래프, 나머지는 이름만 보여 줍니다. (입력: /admin/best-companies)
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import BestRanking from '../best/BestRanking';
import { ButtonLink } from '../member/MemberUI';
import { EditIcon } from '../member/icons';
import { formatDate } from '../member/membership';
import './SubpageLayout.css';
import './BestCompaniesPage.css';

export default function BestCompaniesPage() {
  const { isAdmin } = useAuth();
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let alive = true;
    api
      .get('/api/best-companies')
      .then((data) => alive && setState({ loading: false, error: null, data }))
      .catch((error) => alive && setState({ loading: false, error, data: null }));
    return () => {
      alive = false;
    };
  }, []);

  const { loading, error, data } = state;
  const companies = data?.companies ?? [];

  return (
    <div className="subpage-container">
      <div className="subpage-content">
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">베스트 기업</span>
            <span className="subpage-badge-en">BEST COMPANIES</span>
          </div>
          <h1 className="subpage-title">{data?.title || '베스트 기업'}</h1>
          <p className="subpage-desc">
            국가경영대상/SRMQ상 수상 기업 가운데 사회적 책임과 경영품질에서 돋보인 베스트 기업을 소개합니다.
          </p>
        </header>

        {isAdmin && (
          <div className="ms-admin-bar">
            <span>
              <strong>관리자 모드</strong> · 기업별 점수를 입력하면 1~3위는 그래프로, 나머지는 이름으로 표시됩니다.
            </span>
            <ButtonLink to="/admin/best-companies" size="sm" icon={<EditIcon size={14} />}>
              순위 입력
            </ButtonLink>
          </div>
        )}

        <section className="best-page-board" aria-busy={loading}>
          {(data?.basis || data?.updatedAt) && companies.length > 0 && (
            <p className="best-page-basis">
              {data.basis && <span>{data.basis}</span>}
              {data.updatedAt && <span>기준일 {formatDate(data.updatedAt)}</span>}
            </p>
          )}

          {loading ? (
            <div className="ms-loading"><span className="ms-spinner" aria-hidden="true" /> 순위를 불러오는 중입니다</div>
          ) : error ? (
            <p className="best-page-empty">순위를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : companies.length === 0 ? (
            <p className="best-page-empty">베스트 기업 순위를 준비 중입니다.</p>
          ) : (
            <BestRanking companies={companies} unit={data.unit} />
          )}
        </section>
      </div>
    </div>
  );
}
