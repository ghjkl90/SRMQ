// src/components/pages/noticeData.js
// 공지사항 데이터. 새 공지는 배열 맨 위에 추가하면 됩니다.
//
// content 블록 타입
//   p        문단                { type, text }
//   center   가운데 정렬 문구     { type, text }            예) - 다 음 -
//   heading  소제목              { type, text }
//   section  번호 항목           { type, title, value?, level?, children?: [블록] }
//   items    "라벨 : 값" 목록     { type, items: [{ label, value?, contact?, children? }] }
//   list     글머리 목록          { type, marker: "dot" | "dash", items: [문자열 | { text, items? }] }
//   table    표                  { type, label, head, body, compact? }  셀: 문자열 | { text, rowSpan?, colSpan?, th?, nowrap? }
//   lines    줄바꿈 문단          { type, lines: [문자열] }
//   callout  강조 안내 박스       { type, text }
//   note     ※ 참고 문구         { type, text }
//   sign     서명                { type, text }
// 본문 속 URL·이메일 주소는 자동으로 링크가 됩니다.
//
// 첨부파일은 public/files/notices/ 에 영문 파일명으로 두고,
// name 에 적은 이름(원본 파일명)으로 다운로드됩니다.

const FILE_BASE = "/files/notices";

const file = (name, fileName, size) => ({ name, url: `${FILE_BASE}/${fileName}`, size });

const CONTACT_EMAIL = "srmq@srmq.or.kr";

/* ------------------------------------------------------------------ */
/* 66. 2026년도 국가경영대상 및 SRMQ상 응모안내                          */
/* ------------------------------------------------------------------ */

const NOTICE_66 = {
  id: 66,
  title: "2026년도 국가경영대상 및 SRMQ상 응모안내",
  date: "2026.01.05",
  datetime: "2026.01.05 11:28",
  views: 206,
  content: [
    {
      type: "p",
      text:
        "(사)사회적책임경영품질원(사경원)에서 2026년도 국가경영대상(National Management Award) 및 SRMQ상 포상계획을 다음과 같이 안내 하오니, 적극적인 관심과 참여 바랍니다.",
    },
    { type: "center", text: "- 다 음 -" },
    { type: "heading", text: "1. 국가경영대상 및 SRMQ상 응모분야" },
    {
      type: "table",
      label: "국가경영대상 및 SRMQ상 응모분야",
      head: [
        [
          { text: "분야", rowSpan: 2 },
          { text: "부총리 겸\n재정경제부 장관상" },
          { text: "사경원 회장상", colSpan: 2 },
        ],
        ["대상", "대상", "부문대상"],
      ],
      body: [
        [
          { text: "사회적책임 분야", th: true },
          "국가사회적책임대상",
          "사회공헌대상",
          "인권·노사협력, 동반성장·상생협력,\n윤리경영·부패방지, 소비자보호·공정운영\n등 4개 부문",
        ],
        [
          { text: "경영품질 분야", th: true },
          "국가경영품질대상",
          "혁신성장대상",
          "경영혁신, 기술혁신, 품질혁신,\n제품혁신, 서비스혁신 등 5개 부문",
        ],
        [
          { text: "ESG경영 분야", th: true },
          "국가ESG경영대상",
          "지속가능경영대상",
          "환경(E), 사회(S), 지배구조(G) 등\n3개 부문",
        ],
        [{ text: "안전보건경영 분야", th: true }, "국가안전경영대상", "-", "안전보건경영 부문"],
        [{ text: "AI경영 분야", th: true }, "국가AI경영대상", "-", "AI경영 부문"],
        [
          { text: "유공자 분야", th: true },
          "국가최고경영자대상",
          { text: "SRMQ 최고경영자상, SRMQ 유공자상", colSpan: 2 },
        ],
      ],
    },
    {
      type: "items",
      items: [
        { label: "2. 신청기간", value: "2026년 1~5월" },
        { label: "3. 신청방법", value: "첨부 응모안내서 참조" },
        { label: "4. 시상일", value: "2026년 11월 11일(수)" },
        {
          label: "5. 문의처",
          value: "(사)사회적책임경영품질원 사무국 박필현 국장",
          contact: { tel: "02-408-9171", email: CONTACT_EMAIL },
        },
      ],
    },
    { type: "note", text: "※ 첨부 : 2026년도 국가경영대상 및 SRMQ상 응모안내서 1부 (끝)" },
    { type: "sign", text: "(사)사회적책임경영품질원 회장 박 성 현" },
  ],
  attachments: [
    file("2026년-국가경영대상-및-SRMQ상-응모안내공문_260102.pdf", "2026-award-notice-letter.pdf", 107770),
    file("2026년-국가경영대상-및-SRMQ상-응모안내서_260102.pdf", "2026-award-guide.pdf", 190484),
    file("2026년-국가경영대상-및-SRMQ상-응모신청서_조직.hwp", "2026-award-application-organization.hwp", 93184),
    file("2026년-국가경영대상-및-SRMQ상-응모신청서_유공자.hwp", "2026-award-application-individual.hwp", 92672),
  ],
};

/* ------------------------------------------------------------------ */
/* 65. 평생회원 기부금 후원제도 신설 안내                                  */
/* ------------------------------------------------------------------ */

const NOTICE_65 = {
  id: 65,
  title: "평생회원 기부금 후원제도 신설 안내",
  date: "2025.12.03",
  datetime: "2025.12.03 11:33",
  views: 136,
  content: [
    { type: "p", text: "귀하의 무궁한 발전을 기원합니다." },
    {
      type: "p",
      text:
        "(사)사회적책임경영품질원(이하, 사경원)은 글로벌경영환경하에서 우리 기업의 국제경쟁력 강화, 지속가능발전, 사회적책임경영, ESG경영, 품질과 기술혁신, 환경과 안전보건 등 국제기준에 부합하는 시스템과 능력을 갖출 수 있도록 지원하고 이에 대한 정부시책을 적극적으로 뒷받침하고자 2013년 1월 설립된 기획재정부 등록 비영리법인입니다.",
    },
    {
      type: "p",
      text:
        "그리고 이를 위해 사경원은 지금까지 기업의 지속성장 추구, 경영품질 혁신, 사회적책임 구현 등 산업사회의 분위기 조성과 정부의 정책제안 및 제도 연구, 우수기업 포상 및 성공사례 보급 등의 활동을 추진해 왔으며, 올해는 ‘빅데이터•AI 기반의 경영혁신 전략’을 주제로 기업의 지속가능성장을 위한 경제적, 환경적, 사회적 혁신활동을 전 산업계로 더욱 확대 발전시켜 나가고 있습니다.",
    },
    {
      type: "p",
      text:
        "사경원의 이러한 노력을 성원하여 주시길 부탁드리오며, 평생회원 기부금 후원제도를 아래와 같이 신설, 안내하오니 적극적인 참여와 협조를 부탁드립니다.",
    },
    { type: "center", text: "- 아 래 -" },
    {
      type: "section",
      title: "1. 평생회원 기부금 후원제도 신설 목적",
      children: [
        {
          type: "list",
          marker: "dash",
          items: [
            "사경원의 재무구조 개선 및 지속가능성 제고",
            "기존 정회원 제도에 추가하여 평생회원 제도 신설(이원화 운영)",
          ],
        },
      ],
    },
    { type: "section", title: "2. 평생회원 기부금 후원금액", value: "50만원" },
    { type: "section", title: "3. 시행일자", value: "2025년 12월 1일(월) 부터" },
    {
      type: "section",
      title: "4. 평생회원에 대한 혜택",
      children: [
        {
          type: "list",
          marker: "dash",
          items: [
            "연회비 평생 면제",
            "연말정산시 기부금액의 20% 세액 공제 혜택",
            "진단, 평가, 교육, 지도 및 연구 등 사경원 사업 참여기회 우선 부여",
            "총회 및 컨벤션 참가",
            "SR/MQ에 관한 연구결과 및 국내외 정보 제공 등",
          ],
        },
      ],
    },
    {
      type: "section",
      title: "5. 후원 방법",
      value: "통장으로 계좌 이체",
      children: [
        {
          type: "table",
          label: "후원 계좌",
          compact: true,
          head: [["은행명", "계좌번호", "예금주"]],
          body: [["국민은행", { text: "821301-00-058386", nowrap: true }, "(사)사회적책임경영품질원"]],
        },
        { type: "note", text: "※ 입금 확인 후 기부금 영수증을 발행해 드립니다." },
      ],
    },
    {
      type: "section",
      title: "6. 문의처",
      children: [
        {
          type: "lines",
          lines: [
            "(사)사회적책임경영품질원 사무국 박필현 국장",
            "Web: http://www.srmq.or.kr",
            `T: 02-2025-9171~2 / F: 02-2025-9179 / E-mail: ${CONTACT_EMAIL}`,
          ],
        },
      ],
    },
  ],
  attachments: [
    file("평생회원-기부금-후원제도-신설안내_251201.pdf", "2025-lifetime-member-donation.pdf", 127818),
  ],
};

/* ------------------------------------------------------------------ */
/* 64. 사회적책임경영품질 컨벤션 2025 참석 안내                          */
/* ------------------------------------------------------------------ */

const NOTICE_64 = {
  id: 64,
  title: "사회적책임경영품질 컨벤션 2025 참석 안내",
  date: "2025.09.24",
  datetime: "2025.09.24 11:22",
  views: 236,
  content: [
    { type: "p", text: "회원 여러분! 안녕하십니까?" },
    {
      type: "p",
      text:
        "올해 사경원에서 개최하는 [사회적책임경영품질원 컨벤션 2025] 행사계획을 아래와 같이 안내하오니 회원 여러분의 많은 관심과 참여를 바랍니다.",
    },
    { type: "center", text: "- 아 래 -" },
    {
      type: "items",
      items: [
        { label: "1. 일시", value: "2025년 11월 12일(수) 13:30~16:10" },
        { label: "2. 장소", value: "aT센터 5층 그랜드홀 (서울시 서초구 강남대로 27)" },
        { label: "3. 주제", value: "빅데이터 · AI기반의 경영혁신 전략" },
        { label: "4. 행사 내용", value: "개회식, 기조강연, 국가경영대상/SRMQ상 시상식 등" },
        {
          label: "5. 참석 안내",
          children: [
            {
              type: "list",
              marker: "dash",
              items: [
                "행사 세부 내용은 첨부1 초청장을 참조하시기 바랍니다.",
                "참석자에게는 컨벤션문집 및 기념품을 증정해 드립니다.",
                "다과 및 음료가 제공되며, 중식과 주차비는 지원되지 않습니다.",
                "기타 문의사항이 있으시면 사무국(02-2025-9171)으로 연락 주시기 바랍니다.",
              ],
            },
          ],
        },
      ],
    },
    { type: "p", text: "감사합니다." },
    { type: "sign", text: "박필현 사무국장 올림" },
  ],
  attachments: [
    file("사회적책임경영품질-컨벤션-2025-초청장_251014.pdf", "2025-convention-invitation.pdf", 306920),
  ],
};

/* ------------------------------------------------------------------ */
/* 63. 2025년도 국가경영대상 및 SRMQ상 응모안내                          */
/* ------------------------------------------------------------------ */

const NOTICE_63 = {
  id: 63,
  title: "2025년도 국가경영대상 및 SRMQ상 응모안내",
  date: "2025.01.02",
  datetime: "2025.01.02 14:36",
  views: 937,
  content: [
    {
      type: "p",
      text:
        "(사)사회적책임경영품질원(사경원)에서 2025년도 국가경영대상(National Management Award) 및 SRMQ상 포상계획을 다음과 같이 안내 하오니, 적극적인 관심과 참여 바랍니다.",
    },
    { type: "center", text: "- 다 음 -" },
    {
      type: "section",
      title: "1. 응모분야",
      children: [
        {
          type: "section",
          level: 2,
          title: "(1) 사회적책임분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가사회적책임대상(경제부총리 겸 기획재정부 장관상)",
                "사회공헌대상(사경원 회장상)",
                {
                  text: "사회적책임 부문대상(사경원 회장상)",
                  items: [
                    "인권·노사협력 부문",
                    "동반성장·상생협력 부문",
                    "윤리경영·부패방지 부문",
                    "소비자보호·공정운영 부문",
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(2) 경영품질분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가경영품질대상(경제부총리 겸 기획재정부 장관상)",
                "혁신성장대상(사경원 회장상)",
                {
                  text: "경영품질 부문대상(사경원 회장상)",
                  items: ["경영혁신 부문", "기술혁신 부문", "품질혁신 부문", "제품혁신 부문", "서비스혁신 부문"],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(3) ESG 경영 분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가ESG경영대상(경제부총리 겸 기획재정부 장관상)",
                "지속가능경영대상(사경원 회장상)",
                {
                  text: "ESG경영 부문대상(사경원 회장상)",
                  items: ["환경(E) 부문", "사회(S) 부문", "지배구조(G) 부문"],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(4) 안전보건경영분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가안전경영대상(경제부총리 겸 기획재정부 장관상)",
                "안전보건경영 부문(사경원 회장상)",
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(5) 유공자분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가최고경영자대상(경제부총리 겸 기획재정부 장관상)",
                "SRMQ 최고경영자상(사경원 회장상)",
                "SRMQ 유공자상(사경원 회장상)",
              ],
            },
          ],
        },
      ],
    },
    {
      type: "items",
      items: [
        { label: "2. 신청기간", value: "2025년 1~5월" },
        { label: "3. 신청방법", value: "첨부 응모안내서 참조" },
        { label: "4. 시상일", value: "2025년 11월 12일(수)" },
        {
          label: "5. 문의처",
          value: "(사)사회적책임경영품질원 사무국 박필현 국장",
          contact: { tel: "02-2025-9171~2", email: CONTACT_EMAIL },
        },
      ],
    },
  ],
  attachments: [
    file("2025년-국가경영대상-및-SRMQ상-응모신청서_조직.hwp", "2025-award-application-organization.hwp", 93184),
    file("2025년-국가경영대상-및-SRMQ상-응모신청서_유공자.hwp", "2025-award-application-individual.hwp", 92672),
    file("2025년-국가경영대상-및-SRMQ상-응모안내공문_250102.pdf", "2025-award-notice-letter.pdf", 108362),
    file("2025년-국가경영대상-및-SRMQ상-응모안내서_250102.pdf", "2025-award-guide.pdf", 192419),
  ],
};

/* ------------------------------------------------------------------ */
/* 62. 사회적책임경영품질 컨벤션 2024 안내                               */
/* ------------------------------------------------------------------ */

const NOTICE_62 = {
  id: 62,
  title: "사회적책임경영품질 컨벤션 2024 안내",
  date: "2024.10.07",
  datetime: "2024.10.07 14:41",
  views: 696,
  content: [
    { type: "p", text: "[사회적책임경영품질 컨벤션 2024] 개최를 안내드립니다." },
    {
      type: "items",
      items: [
        { label: "1. 일자", value: "2024년 11월 5일(화) 12:30~16:00" },
        { label: "2. 장소", value: "서울대학교 호암교수회관 삼성컨벤션센터 2층 무궁화룸" },
        { label: "3. 주제", value: "디지털 시대의 데이터기반 경영혁신 전략" },
        {
          label: "4. 문의",
          value: "사회적책임경영품질원 박필현 사무국장",
          contact: { tel: "02-2025-9171~2", fax: "02-2025-9179", email: CONTACT_EMAIL },
        },
      ],
    },
    {
      type: "callout",
      text:
        "참석을 희망하시는 분은 10월 15일까지 첨부의 참석자 명단 양식을 작성하여 메일(srmq@srmq.or.kr) 또는 팩스(02-2025-9179)로 보내주시기 바랍니다.",
    },
  ],
  attachments: [
    file("첨부2.-사경원-회원-참석자-명단-양식.xlsx", "2024-convention-attendee-form.xlsx", 10583),
    file("첨부2.-사회적책임경영품질-컨벤션-2024-초청장.pdf", "2024-convention-invitation.pdf", 289167),
  ],
};

/* ------------------------------------------------------------------ */
/* 61. 2024년 국가경영대상 및 SRMQ상 응모안내                            */
/* ------------------------------------------------------------------ */

const NOTICE_61 = {
  id: 61,
  title: "2024년 국가경영대상 및 SRMQ상 응모안내",
  date: "2024.01.02",
  datetime: "2024.01.02 10:31",
  views: 1176,
  content: [
    {
      type: "p",
      text:
        "(사)사회적책임경영품질원(사경원)에서 2024년도 국가경영대상(National Management Award) 및 SRMQ상 포상계획을 다음과 같이 안내 하오니, 적극적인 관심과 참여 바랍니다.",
    },
    { type: "center", text: "- 다 음 -" },
    {
      type: "section",
      title: "1. 응모분야",
      children: [
        {
          type: "section",
          level: 2,
          title: "(1) 사회적책임분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가사회적책임대상(경제부총리 겸 기획재정부 장관상)",
                "사회공헌대상(사경원 회장상)",
                {
                  text: "사회적책임 부문대상(사경원 회장상)",
                  items: [
                    "인권·노사협력 부문",
                    "동반성장·상생협력 부문",
                    "윤리경영·부패방지 부문",
                    "소비자보호·공정운영 부문",
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(2) 경영품질분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가경영품질대상(부총리 겸 기획재정부 장관상)",
                "혁신성장대상(사경원 회장상)",
                {
                  text: "경영품질 부문대상(사경원 회장상)",
                  items: ["경영혁신 부문", "기술혁신 부문", "품질혁신 부문", "제품혁신 부문", "서비스혁신 부문"],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(3) ESG 경영 분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가ESG경영대상(경제부총리 겸 기획재정부 장관상)",
                "지속가능경영대상(사경원 회장상)",
                {
                  text: "ESG경영 부문대상(사경원 회장상)",
                  items: ["환경(E) 부문", "사회(S) 부문", "지배구조(G) 부문"],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(4) 안전보건경영분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가안전경영대상(경제부총리 겸 기획재정부 장관상)",
                "안전보건경영 부문(사경원 회장상)",
              ],
            },
          ],
        },
        {
          type: "section",
          level: 2,
          title: "(5) 유공자분야",
          children: [
            {
              type: "list",
              marker: "dot",
              items: [
                "국가최고경영자대상(경제부총리 겸 기획재정부 장관상)",
                "최고경영자상(사경원 회장상)",
                "SRMQ 유공자상(사경원 회장상)",
              ],
            },
          ],
        },
      ],
    },
    {
      type: "items",
      items: [
        { label: "2. 신청기간", value: "2024년 1~5월" },
        { label: "3. 신청방법", value: "첨부 응모안내서 참조" },
        { label: "4. 시상일", value: "2024년 11월 05일(화)" },
        {
          label: "5. 문의처",
          value: "(사)사회적책임경영품질원 사무국 박필현 국장, 김주희 팀장",
          contact: { tel: "02-2025-9171~2", email: CONTACT_EMAIL },
        },
      ],
    },
  ],
  attachments: [
    file("2024년-국가경영대상-및-SRMQ상-응모안내공문_240102-1.pdf", "2024-award-notice-letter.pdf", 196127),
    file("2024년-국가경영대상-및-SRMQ상-응모안내서_240102.pdf", "2024-award-guide.pdf", 198558),
    file("2024년-국가경영대상-및-SRMQ상-응모신청서_조직.hwp", "2024-award-application-organization.hwp", 108544),
    file("2024년-국가경영대상-및-SRMQ상-응모신청서_유공자.hwp", "2024-award-application-individual.hwp", 108544),
  ],
};

export const NOTICES = [NOTICE_66, NOTICE_65, NOTICE_64, NOTICE_63, NOTICE_62, NOTICE_61];
