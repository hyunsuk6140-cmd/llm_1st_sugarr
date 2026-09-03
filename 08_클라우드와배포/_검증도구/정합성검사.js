// ============================================================
// _검증도구/정합성검사.js — 자료가 스스로 정한 규칙을 어기지 않았는지 본다
// ------------------------------------------------------------
// 사용:
//   node _검증도구/정합성검사.js
//   node _검증도구/정합성검사.js 09_파일_업로드
//
// 왜 필요한가:
//   출력검증·서버검증은 '돌려 보면' 잡힙니다.
//   그런데 이런 것들은 돌려 봐도 안 잡힙니다.
//
//     · 한글 라우트 주소 → 에러 없이 조용히 404
//     · 한글 헤더 값     → 그 라우트를 안 부르면 영원히 모름
//     · Express 4 문법   → 그 파일을 안 켜면 모름
//
//   그래서 파일을 '읽어서' 확인합니다.
//
// ── 일부러 그렇게 쓴 경우 ──
//
//   자료에는 '틀린 예' 를 일부러 넣는 곳이 있습니다.
//   그런 줄에는 뒤에 이렇게 표시해 두면 넘어갑니다.
//
//     app.get("/한글주소", ...);  // 검증무시: 일부러 안 되는 예를 보여 주는 것
// ============================================================

const fs = require("fs");
const path = require("path");

const 자료뿌리 = path.join(__dirname, "..");


// ★ `확인:` 선언은 반드시 "확인: METHOD /경로" 형태입니다.
//
//   // 확인: GET /equipments
//   // 응답: 200 {"data":[]}
//
//   그냥 "확인:" 으로 시작하는 한국어 문장(예: "확인: free -h 를 치면...") 은
//   선언이 아닙니다. HTTP 메서드를 요구해서 구분합니다.
//
//   실제로 그 오탐이 났습니다. 06단원에 "확인: free -h ..." 라고 적었더니
//   "응답이 없다" 고 잡혔습니다. 선언 문법을 정확히 적는 쪽으로 고쳤습니다.
const 확인선언 = /^\s*\/\/\s*확인:\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\//;
const 한글 = /[가-힣]/;
const 무시표시 = /\/\/\s*검증무시/;

// ★ 주석과 글자를 걷어 내고 코드만 남깁니다. (출력검증.js 와 같은 규칙)
//   주석에 적힌 .listen 을 서버로 오해하지 않으려고 씁니다.
function 코드만남기기(소스) {
  return 소스
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}



// ── 규칙들 ──
// 각 규칙은 한 줄씩 보면서 문제가 있으면 설명을 돌려줍니다.

const 규칙들 = [
  {
    이름: "한글 라우트 주소",
    설명: "Express 는 인코딩된 주소로 비교합니다. 에러 없이 조용히 404 가 납니다. (04단원 개념01)",
    검사(줄) {
      // app.get("/주소", ...) / router.post("/주소", ...) / app.use("/주소", ...)
      const 맞음 = 줄.match(/\b(?:app|router)\.(?:get|post|put|patch|delete|all|use)\(\s*(["'`])([^"'`]*)\1/);

      if (!맞음) return null;
      if (!맞음[2].startsWith("/")) return null; // 주소가 아니면 건너뜀

      // ★ `/ai/${이름}` 의 이름 은 **변수 이름**입니다. 주소에 들어가는 글자가 아닙니다.
      //   담기는 값은 보통 ASCII 인데, 변수 이름만 보고 한글 주소라고 잡았습니다.
      //   그 오탐이 실제로 났습니다. ${...} 를 걷어 내고 봅니다.
      //
      //   ★★ 단, 걷어 내는 것은 **백틱**으로 쓴 것뿐입니다.
      //     "/ai/${이름}" 처럼 따옴표로 쓰면 ${이름} 이 진짜 글자입니다.
      //     (그건 한글 주소가 맞으니 잡아야 합니다)
      //
      //   ★ 값이 한글인 경우는 못 잡습니다. 그건 돌려 봐야 압니다.
      const 백틱 = 맞음[1] === "`";
      const 글자부분 = 백틱 ? 맞음[2].replace(/\$\{[^}]*\}/g, "") : 맞음[2];

      if (!한글.test(글자부분)) return null;

      return `주소에 한글: ${맞음[2]}`;
    },
  },

  {
    이름: "한글 응답 헤더 값",
    설명: "헤더에는 한글을 담을 수 없습니다. ERR_INVALID_CHAR 로 500 이 납니다. (05단원 개념02)",
    검사(줄) {
      const 맞음 = 줄.match(/\bres\.(?:set|header)\(\s*(["'`])([^"'`]+)\1\s*,\s*(["'`])([^"'`]*)\3/);

      if (!맞음) return null;
      if (!한글.test(맞음[2]) && !한글.test(맞음[4])) return null;

      return `헤더에 한글: ${맞음[2]} = ${맞음[4]}`;
    },
  },

  {
    이름: "한글 업로드 필드 이름",
    설명: "multer 필드 이름은 latin1 로 읽혀 깨집니다. Unexpected field 가 납니다. (09단원 개념02)",
    검사(줄) {
      const 맞음 = 줄.match(/\.(?:single|array|fields)\(\s*(["'`])([^"'`]+)\1/);

      if (!맞음) return null;
      if (!한글.test(맞음[2])) return null;

      return `업로드 필드 이름에 한글: ${맞음[2]}`;
    },
  },

  {
    이름: "Express 4 라우트 문법",
    설명: "Express 5 에서는 서버가 아예 안 켜집니다. (04단원 개념02)",
    검사(줄) {
      const 라우트 = 줄.match(/\b(?:app|router)\.(?:get|post|put|patch|delete|all|use)\(\s*(["'`])([^"'`]*)\1/);

      if (!라우트) return null;

      const 주소 = 라우트[2];

      if (/:[a-zA-Z_][a-zA-Z0-9_]*\?/.test(주소)) {
        return `Express 4 선택 파라미터: ${주소}  →  {/:이름} 으로 고치세요`;
      }

      // 별표 뒤에 이름이 없으면 Express 4 문법입니다. (*splat 은 정상)
      if (/\*(?![a-zA-Z_])/.test(주소)) {
        return `이름 없는 와일드카드: ${주소}  →  *splat 처럼 이름을 붙이세요`;
      }

      return null;
    },
  },

  {
    이름: "에러 처리기 인자 개수",
    설명: "인자가 네 개여야 Express 가 에러 처리기로 알아봅니다. (04단원 개념04)",
    검사(줄) {
      if (!/\bapp\.use\(/.test(줄)) return null;
      if (!/\(\s*err\s*,/.test(줄)) return null;
      if (/\(\s*err\s*,\s*req\s*,\s*res\s*,\s*next\s*\)/.test(줄)) return null;

      return "에러 처리기 인자가 네 개가 아닙니다";
    },
  },

  {
    이름: "PORT 를 글자인 채로 계산",
    설명: '환경변수는 글자입니다. "3000"+100 은 "3000100" 이 됩니다. (08단원 개념05)',
    검사(줄, 소스) {
      if (!/\bPORT\s*[+\-*/]\s*\d/.test(줄)) return null;
      // PORT 를 Number 로 감싸서 만들었으면 괜찮습니다.
      if (/const\s+PORT\s*=\s*Number\(/.test(소스)) return null;

      return "PORT 를 Number 없이 계산에 쓰고 있습니다";
    },
  },

  {
    이름: "출력 주석이 코드 줄에 붙음",
    설명: "검증기가 수집하지 못합니다. 다음 줄에 단독으로 쓰세요.",
    검사(줄) {
      // ★ // 출력?: 변형도 봅니다. (출력검증.js 와 같은 규칙)
      if (!/\/\/ 출력\??:/.test(줄)) return null;
      if (줄.trimStart().startsWith("//")) return null;

      return "코드와 같은 줄에 // 출력: 이 붙어 있습니다";
    },
  },
];


// ── 파일 전체를 보는 검사 ──

const 파일규칙들 = [
  {
    이름: "확인 선언에 응답이 없음",
    검사(소스) {
      const 줄들 = 소스.split(/\r?\n/);
      const 문제 = [];

      줄들.forEach((줄, 자리) => {
        if (!확인선언.test(줄)) return;

        const 뒤에응답있나 = 줄들
          .slice(자리 + 1, 자리 + 4)
          .some((뒷줄) => /^\s*\/\/\s*응답:\s*\d{3}/.test(뒷줄));

        if (!뒤에응답있나) {
          문제.push({ 행: 자리 + 1, 내용: `${줄.trim()}  →  바로 아래에 // 응답: 이 없습니다` });
        }
      });

      return 문제;
    },
  },

  {
    이름: "서버가 아닌데 확인 선언이 있음",
    검사(소스) {
      if (!소스.split(/\r?\n/).some((줄) => 확인선언.test(줄))) return [];
      // ★ 주석·글자 속의 .listen 은 서버가 아닙니다. 출력검증.js 와 기준을 맞춥니다.
      if (/\.listen\s*\(/.test(코드만남기기(소스))) return [];

      return [{ 행: 0, 내용: "// 확인: 선언이 있는데 .listen 이 없습니다. 서버검증이 건너뜁니다" }];
    },
  },
];


function 파일검사(전체경로, 보일이름) {
  const 소스 = fs.readFileSync(전체경로, "utf8");
  const 줄들 = 소스.split(/\r?\n/);
  const 문제 = [];

  줄들.forEach((줄, 자리) => {
    if (무시표시.test(줄)) return;

    // ★ 주석 줄은 건너뜁니다.
    //   자료에는 '틀린 예' 를 주석으로 보여 주는 곳이 아주 많습니다.
    //   그걸 전부 문제로 잡으면 도구를 아무도 안 보게 됩니다.
    //
    //   진짜 코드에서 일부러 틀리게 쓴 곳(살아 있는 데모)에는
    //   그 줄에 // 검증무시: 를 붙여 두었습니다.
    const 앞부분 = 줄.trimStart();
    const 주석줄 = 앞부분.startsWith("//") || 앞부분.startsWith("*") || 앞부분.startsWith("/*");

    for (const 규칙 of 규칙들) {
      // 출력 주석 규칙만은 주석 줄도 봐야 합니다. (코드 줄에 붙었는지가 관심사)
      if (주석줄 && 규칙.이름 !== "출력 주석이 코드 줄에 붙음") continue;

      const 결과 = 규칙.검사(줄, 소스);

      if (결과) {
        문제.push({ 행: 자리 + 1, 규칙: 규칙.이름, 내용: 결과, 설명: 규칙.설명 });
      }
    }
  });

  for (const 규칙 of 파일규칙들) {
    for (const 하나 of 규칙.검사(소스)) {
      문제.push({ 행: 하나.행, 규칙: 규칙.이름, 내용: 하나.내용, 설명: "" });
    }
  }

  if (문제.length === 0) return 0;

  console.log(`\n[문제] ${보일이름}`);

  for (const 하나 of 문제) {
    console.log(`  ${String(하나.행).padStart(4)}행  [${하나.규칙}]  ${하나.내용}`);
    if (하나.설명) console.log(`        ${하나.설명}`);
  }

  return 문제.length;
}


function 폴더검사(폴더) {
  if (!fs.existsSync(폴더)) {
    console.log(`[없는 폴더] ${폴더}`);
    return { 파일수: 0, 문제수: 1 };
  }

  let 파일수 = 0;
  let 문제수 = 0;

  // 하위 폴더(routes, services, middlewares 등)까지 훑습니다.
  function 훑기(현재, 앞) {
    for (const 항목 of fs.readdirSync(현재, { withFileTypes: true })) {
      if (항목.name === "node_modules" || 항목.name === "uploads") continue;

      const 경로 = path.join(현재, 항목.name);
      const 이름 = 앞 ? `${앞}/${항목.name}` : 항목.name;

      if (항목.isDirectory()) {
        훑기(경로, 이름);
      } else if (항목.name.endsWith(".js")) {
        파일수 += 1;
        문제수 += 파일검사(경로, 이름);
      }
    }
  }

  훑기(폴더, "");

  console.log(`\n===== ${path.basename(폴더)} : 파일 ${파일수}개 / 문제 ${문제수}건 =====`);
  return { 파일수, 문제수 };
}


function 단원목록() {
  return fs
    .readdirSync(자료뿌리, { withFileTypes: true })
    .filter((항목) => 항목.isDirectory() && /^\d\d_/.test(항목.name))
    .map((항목) => 항목.name)
    .sort();
}


const 넘어온것 = process.argv.slice(2);
const 대상들 = 넘어온것.length > 0 ? 넘어온것 : 단원목록();

let 전체파일 = 0;
let 전체문제 = 0;

for (const 대상 of 대상들) {
  const 폴더 = path.isAbsolute(대상) ? 대상 : path.join(자료뿌리, 대상);
  const 결과 = 폴더검사(폴더);

  전체파일 += 결과.파일수;
  전체문제 += 결과.문제수;
}

if (대상들.length > 1) {
  console.log(`\n########## 전체: 파일 ${전체파일}개 / 문제 ${전체문제}건 ##########`);
}

process.exit(전체문제 > 0 ? 1 : 0);
