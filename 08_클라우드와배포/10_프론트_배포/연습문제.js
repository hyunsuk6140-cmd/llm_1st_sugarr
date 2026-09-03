// ============================================================
// 10단원 연습문제 — 프론트 배포
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~10은 코드로 푸는 문제, 11~14는 [손으로] 답을 적는 문제입니다.
//
// ★ 아무것도 설치할 필요 없습니다. 순수 자바스크립트만 씁니다.
// ★ 10분 고민해도 안 되면 연습문제_정답.js 를 보세요.


// ───── 문제 1 ───── (개념01)
// 해시가 붙은 파일만 골라 "파일  →  해시" 로 출력하세요.
//
// 기대 출력:
// assets/index-a1b2c3d4.js  →  a1b2c3d4
// assets/index-e5f6g7h8.css  →  e5f6g7h8
//
// ★ 힌트: 해시가 16진수라고 단정하지 마세요. 두 번째 파일을 잘 보세요.

const 빌드결과 = [
  "assets/index-a1b2c3d4.js",
  "assets/index-e5f6g7h8.css",
  "index.html",
  "vite.svg",
];

// TODO: 여기에 코드를 쓰세요


// ───── 문제 2 ───── (개념02)
// 키를 보고 ContentType 을 정하는 함수를 만드세요.
// 표에 없는 확장자는 application/octet-stream 입니다.
//
// 기대 출력:
// index.html  →  text/html
// assets/a.js  →  text/javascript
// assets/a.css  →  text/css
// vite.svg  →  image/svg+xml
// 받은것.zip  →  application/octet-stream

const 종류표 = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};

function 종류정하기(키) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 키 of ["index.html", "assets/a.js", "assets/a.css", "vite.svg", "받은것.zip"]) {
//   console.log(`${키}  →  ${종류정하기(키)}`);
// }


// ───── 문제 3 ───── (개념02)
// 윈도우 경로를 S3 키로 바꾸세요. 역슬래시를 슬래시로 바꾸고 앞의 dist 를 뗍니다.
//
// 기대 출력:
// dist\index.html  →  index.html
// dist\assets\index-a1b2c3d4.js  →  assets/index-a1b2c3d4.js
// dist\vite.svg  →  vite.svg

const 윈도우경로들 = ["dist\\index.html", "dist\\assets\\index-a1b2c3d4.js", "dist\\vite.svg"];

function 키로바꾸기(경로) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 경로 of 윈도우경로들) {
//   console.log(`${경로}  →  ${키로바꾸기(경로)}`);
// }


// ───── 문제 4 ───── (개념02)
// 버킷 정책을 만들어 JSON.stringify 로 한 줄로 출력하세요.
// 누구나 **읽기만** 할 수 있어야 합니다.
//
// 기대 출력:
// {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::내화면버킷/*"}]}

function 공개정책(버킷) {
  // TODO: 여기에 코드를 쓰세요
}

// console.log(JSON.stringify(공개정책("내화면버킷")));


// ───── 문제 5 ───── (개념03)
// 정적 호스팅을 흉내 내세요.
//   · 앞의 / 를 뗀 것이 '키' 입니다
//   · 비었거나 / 로 끝나면 인덱스 문서를 붙입니다
//   · 키가 없으면 오류 문서를 404 와 함께 줍니다
//
// 기대 출력:
// 200  /  →  index.html
// 200  /index.html  →  index.html
// 404  /설비/3  →  index.html
// 200  /assets/index-a1b2c3d4.js  →  assets/index-a1b2c3d4.js

const 있는키 = new Set(["index.html", "assets/index-a1b2c3d4.js"]);
const 설정 = { 인덱스문서: "index.html", 오류문서: "index.html" };

function 요청(경로, 설정) {
  // TODO: 여기에 코드를 쓰세요  ({ 상태, 준것 } 을 돌려주세요)
}

// for (const 경로 of ["/", "/index.html", "/설비/3", "/assets/index-a1b2c3d4.js"]) {
//   const 답 = 요청(경로, 설정);
//   console.log(`${답.상태}  ${경로}  →  ${답.준것}`);
// }


// ───── 문제 6 ───── (개념03·05)
// 문제 5의 결과가 '깨지는' 경우를 판정하세요.
// .js 나 .css 를 달랬는데 index.html 이 온 경우가 깨지는 것입니다.
//
// 기대 출력:
// /설비/3  →  괜찮음
// /assets/index-a1b2c3d4.js  →  괜찮음
// /assets/index-옛날해시.js  →  ★ 깨짐 (Unexpected token '<')
//
// ★ /설비/3 은 404 인데 왜 안 깨질까요? 답을 쓰기 전에 생각해 보세요.

function 깨지나(경로, 답) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 경로 of ["/설비/3", "/assets/index-a1b2c3d4.js", "/assets/index-옛날해시.js"]) {
//   const 답 = 요청(경로, 설정);
//   console.log(`${경로}  →  ${깨지나(경로, 답) ? "★ 깨짐 (Unexpected token '<')" : "괜찮음"}`);
// }


// ───── 문제 7 ───── (개념04)
// Vite 빌드를 흉내 내세요.
// `import.meta.env.이름` 을 찾아서 —
//   · 빌트인이거나 VITE_ 로 시작하면 → 값을 JSON.stringify 해서 넣습니다
//   · 아니면 → "undefined" 로 만듭니다
//
// 기대 출력:
// import.meta.env.VITE_API_URL  →  "http://13.125.0.0"
// import.meta.env.API_URL  →  undefined
// import.meta.env.MODE  →  "production"

const 빌트인 = ["MODE", "BASE_URL", "PROD", "DEV", "SSR"];
const 환경 = { VITE_API_URL: "http://13.125.0.0", API_URL: "http://13.125.0.0", MODE: "production" };

function 가짜빌드(소스, 환경) {
  // TODO: 여기에 코드를 쓰세요
  // 힌트: 소스.replace(/import\.meta\.env\.([A-Za-z0-9_]+)/g, (통째로, 이름) => { ... })
}

// for (const 한줄 of ["import.meta.env.VITE_API_URL", "import.meta.env.API_URL", "import.meta.env.MODE"]) {
//   console.log(`${한줄}  →  ${가짜빌드(한줄, 환경)}`);
// }


// ───── 문제 8 ───── (개념04)
// .env 를 훑어서 브라우저로 새 나가면 안 되는 이름을 찾으세요.
// VITE_ 로 시작하면서 이름에 위험한말이 든 것입니다.
//
// 기대 출력:
// 위험: VITE_BEDROCK_KEY, VITE_ADMIN_PASSWORD
// DB_PASSWORD 는? 안 나갑니다 (VITE_ 가 없음)

const 어떤env = {
  VITE_API_URL: "http://13.125.0.0",
  VITE_BEDROCK_KEY: "AKIA…",
  VITE_ADMIN_PASSWORD: "1234",
  DB_PASSWORD: "안 나갑니다",
  VITE_ENABLE_BETA: "true",
};

const 위험한말 = ["KEY", "SECRET", "PASSWORD", "TOKEN"];

// TODO: 여기에 코드를 쓰세요


// ───── 문제 9 ───── (개념05)
// 키를 보고 CacheControl 값을 정하세요.
//
// 기대 출력:
// index.html  →  no-cache
// assets/index-a1b2c3d4.js  →  public, max-age=31536000, immutable
// vite.svg  →  no-cache

function 캐시규칙(키) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 키 of ["index.html", "assets/index-a1b2c3d4.js", "vite.svg"]) {
//   console.log(`${키}  →  ${캐시규칙(키)}`);
// }


// ───── 문제 10 ───── (개념05)
// 올리는 순서를 정하세요. index.html 이 **맨 마지막**이어야 합니다.
// 나머지는 원래 순서를 그대로 둡니다.
//
// 기대 출력:
// assets/index-a1b2c3d4.js
// vite.svg
// assets/index-e5f6g7h8.css
// index.html
//
// ★ 원본 배열을 망가뜨리지 마세요. sort 는 원본을 바꿉니다.

const 올릴것 = ["index.html", "assets/index-a1b2c3d4.js", "vite.svg", "assets/index-e5f6g7h8.css"];

// TODO: 여기에 코드를 쓰세요


// ============================================================
// [손으로] 푸는 문제 — 답을 주석으로 적으세요
// ============================================================


// ───── 문제 11 ───── (개념04)
// 팀원이 이렇게 말합니다.
//
//   ".env.production 에서 API 주소를 바꿨는데 배포한 화면은 그대로예요.
//    S3 에도 다시 올렸어요."
//
// (1) 왜 안 바뀝니까?
// (2) 무엇을 순서대로 확인하겠습니까?
// (3) 서버(01단원)의 환경변수는 왜 이런 문제가 없습니까?
//
// 답:


// ───── 문제 12 ───── (개념03·05)
// 배포한 뒤 두 사람이 다른 말을 합니다.
//
//   A: "저는 옛날 화면 그대로 보여요."
//   B: "저는 화면이 아예 안 나와요. 콘솔에 Unexpected token '<' 이래요."
//
// (1) 원인이 둘입니까, 하나입니까?
// (2) B 는 왜 A 와 다른 증상을 봅니까?
// (3) 지금 무엇을 하겠습니까? 순서대로 적으세요.
// (4) ★ 캐시 헤더만 고치면 이미 캐시된 사람도 바로 낫습니까?
//
// 답:


// ───── 문제 13 ───── (개념04)
// dist 에 AWS 키가 박힌 채로 이미 배포했습니다. 어제 배포했고 오늘 알았습니다.
//
// (1) 무엇부터 합니까? 순서대로 적으세요.
// (2) "S3 에서 그 파일을 지우면 되지 않나요?" 에 뭐라고 답하겠습니까?
//
// 답:


// ───── 문제 14 ───── (개념03)
// 팀원이 말합니다.
//
//   "새로고침 404 고치는 거 귀찮은데 그냥 HashRouter 씁시다."
//
// (1) 이 말이 틀렸습니까?
// (2) 뭐라고 답하겠습니까?
// (3) HashRouter 가 오히려 나은 경우도 있습니까?
//
// 답:


// ============================================================
// 다 풀었으면 연습문제_정답.js 와 맞춰 보세요.
// ============================================================
