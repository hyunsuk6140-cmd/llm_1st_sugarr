// ============================================================
// 10단원 연습문제 정답 — 프론트 배포
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// ★ 코드만 보지 말고 아래 설명을 읽으세요.
//   왜 그렇게 하는지가 답보다 중요합니다.

// ───── 문제 1 ───── (개념01)
// 해시가 붙은 파일만 골라 이름과 해시를 출력하세요.

const 빌드결과 = [
  "assets/index-a1b2c3d4.js",
  "assets/index-e5f6g7h8.css",
  "index.html",
  "vite.svg",
];

// ★★★ 여기서 한 번 틀리기 좋습니다.
//   "해시니까 16진수겠지" 하고 [0-9a-f]{8} 로 쓰면 —
//   e5f6g7h8 은 **안 걸립니다.** g 와 h 는 16진수가 아닙니다.
//
//   Vite 의 해시는 16진수가 아닙니다. 영문 대소문자·숫자·_·- 가 섞여 나옵니다.
//   눈으로 보고 "16진수처럼 생겼네" 하고 단정하면 이렇게 됩니다.
const 해시규칙 = /-([0-9A-Za-z_-]{8})\.[a-z]+$/;

for (const 파일 of 빌드결과) {
  const 맞은것 = 파일.match(해시규칙);
  if (맞은것) console.log(`${파일}  →  ${맞은것[1]}`);
  // 출력: assets/index-a1b2c3d4.js  →  a1b2c3d4
  // 출력: assets/index-e5f6g7h8.css  →  e5f6g7h8
}

// ★ 직접 확인해 보세요. 아래는 16진수로만 쓴 경우입니다.
console.log(`16진수로만 쓰면: ${빌드결과.filter((파일) => /-[0-9a-f]{8}\./.test(파일)).length}개만 걸립니다`);
// 출력: 16진수로만 쓰면: 1개만 걸립니다

// ───── 문제 2 ───── (개념02)
// 키를 보고 ContentType 을 정하세요. 모르는 확장자는 application/octet-stream.

const 종류표 = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};

function 종류정하기(키) {
  const 점 = 키.lastIndexOf(".");
  const 확장자 = 점 === -1 ? "" : 키.slice(점).toLowerCase();
  return 종류표[확장자] ?? "application/octet-stream";
}

for (const 키 of ["index.html", "assets/a.js", "assets/a.css", "vite.svg", "받은것.zip"]) {
  console.log(`${키}  →  ${종류정하기(키)}`);
  // 출력: index.html  →  text/html
  // 출력: assets/a.js  →  text/javascript
  // 출력: assets/a.css  →  text/css
  // 출력: vite.svg  →  image/svg+xml
  // 출력: 받은것.zip  →  application/octet-stream
}

// ★★ 이 한 줄을 빼먹으면 하얀 화면입니다. 개념02 의 3번 절을 다시 보세요.
//   ★ `.lastIndexOf(".")` 를 쓴 이유 — `index-a1b2c3d4.js` 처럼 점 앞에
//     `-` 나 다른 점이 있어도 **마지막 점**부터가 확장자입니다.
//     `split(".")[1]` 로 쓰면 `my.file.js` 에서 틀립니다.

// ───── 문제 3 ───── (개념02)
// 윈도우 경로를 S3 키로 바꾸세요. 앞의 dist 는 뗍니다.

const 윈도우경로들 = ["dist\\index.html", "dist\\assets\\index-a1b2c3d4.js", "dist\\vite.svg"];

function 키로바꾸기(경로) {
  return 경로.replace(/\\/g, "/").replace(/^dist\//, "");
}

for (const 경로 of 윈도우경로들) {
  console.log(`${경로}  →  ${키로바꾸기(경로)}`);
  // 출력: dist\index.html  →  index.html
  // 출력: dist\assets\index-a1b2c3d4.js  →  assets/index-a1b2c3d4.js
  // 출력: dist\vite.svg  →  vite.svg
}

// ★★ 이걸 안 하면 S3 에 `assets\index-a1b2c3d4.js` 라는 **파일 하나**가 생깁니다.
//   폴더가 아닙니다. 이름에 역슬래시가 든 파일입니다.
//   브라우저는 `/assets/index-a1b2c3d4.js` 를 찾으니 404 입니다.
//
// ★ 콘솔에서 보면 폴더처럼 안 보이고 이상한 이름 하나로 보여서 금방 압니다.
//   그런데 왜 그런지 모르면 한참 헤맵니다.

// ───── 문제 4 ───── (개념02)
// 버킷 정책을 만들어 한 줄로 출력하세요. 읽기만 허용합니다.

function 공개정책(버킷) {
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${버킷}/*`,
      },
    ],
  };
}

console.log(JSON.stringify(공개정책("내화면버킷")));
// 출력: {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::내화면버킷/*"}]}

// ★★ `Resource` 끝의 `/*` 를 빼면 **버킷 자체**를 가리킵니다. 파일이 아닙니다.
//   그러면 파일을 못 읽습니다. 이것도 흔한 실수입니다.
//
// ★ `Action` 에 `s3:PutObject` 를 같이 넣지 마세요.
//   아무나 내 버킷에 파일을 올리게 됩니다. 요금은 제가 냅니다.

// ───── 문제 5 ───── (개념03)
// 정적 호스팅을 흉내 내세요. 없는 키면 오류 문서를 404 와 함께 줍니다.

const 있는키 = new Set(["index.html", "assets/index-a1b2c3d4.js"]);

function 요청(경로, 설정) {
  let 키 = 경로.replace(/^\//, "");
  if (키 === "" || 키.endsWith("/")) 키 += 설정.인덱스문서;

  if (있는키.has(키)) return { 상태: 200, 준것: 키 };
  return { 상태: 404, 준것: 설정.오류문서 };
}

const 설정 = { 인덱스문서: "index.html", 오류문서: "index.html" };

for (const 경로 of ["/", "/index.html", "/설비/3", "/assets/index-a1b2c3d4.js"]) {
  const 답 = 요청(경로, 설정);
  console.log(`${답.상태}  ${경로}  →  ${답.준것}`);
  // 출력: 200  /  →  index.html
  // 출력: 200  /index.html  →  index.html
  // 출력: 404  /설비/3  →  index.html
  // 출력: 200  /assets/index-a1b2c3d4.js  →  assets/index-a1b2c3d4.js
}

// ★ 상태를 앞에 냈습니다. 경로에 한글이 섞이면 padEnd 로 열이 안 맞습니다.
//   한글은 글자 수는 1인데 화면에서 두 칸을 차지하기 때문입니다.

// ───── 문제 6 ───── (개념03·05)
// 위 요청 결과가 '깨지는' 경우를 찾으세요.
// .js 나 .css 를 달랬는데 index.html 이 온 경우가 깨지는 것입니다.

function 깨지나(경로, 답) {
  const 코드파일 = /\.(js|css)$/.test(경로);
  return 코드파일 && 답.준것 === "index.html";
}

for (const 경로 of ["/설비/3", "/assets/index-a1b2c3d4.js", "/assets/index-옛날해시.js"]) {
  const 답 = 요청(경로, 설정);
  console.log(`${경로}  →  ${깨지나(경로, 답) ? "★ 깨짐 (Unexpected token '<')" : "괜찮음"}`);
  // 출력: /설비/3  →  괜찮음
  // 출력: /assets/index-a1b2c3d4.js  →  괜찮음
  // 출력: /assets/index-옛날해시.js  →  ★ 깨짐 (Unexpected token '<')
}

// ★★ `/설비/3` 은 404 인데도 안 깨집니다. HTML 을 달라고 한 게 아니니까요.
//   브라우저는 index.html 을 받아서 React 를 띄우고, 그 다음 주소를 봅니다.
//
// ★★★ 깨지는 건 **없는 .js 를 부를 때**뿐입니다.
//   그리고 그건 옛 index.html 이 캐시돼 있을 때 생깁니다. (개념05)

// ───── 문제 7 ───── (개념04)
// Vite 빌드를 흉내 내세요.
// VITE_ 로 시작하거나 빌트인이면 값을 넣고, 아니면 undefined 로 만듭니다.

const 빌트인 = ["MODE", "BASE_URL", "PROD", "DEV", "SSR"];

function 가짜빌드(소스, 환경) {
  return 소스.replace(/import\.meta\.env\.([A-Za-z0-9_]+)/g, (통째로, 이름) => {
    if (빌트인.includes(이름) || 이름.startsWith("VITE_")) {
      return JSON.stringify(환경[이름]);
    }
    return "undefined";
  });
}

const 환경 = { VITE_API_URL: "http://13.125.0.0", API_URL: "http://13.125.0.0", MODE: "production" };

for (const 한줄 of ["import.meta.env.VITE_API_URL", "import.meta.env.API_URL", "import.meta.env.MODE"]) {
  console.log(`${한줄}  →  ${가짜빌드(한줄, 환경)}`);
  // 출력: import.meta.env.VITE_API_URL  →  "http://13.125.0.0"
  // 출력: import.meta.env.API_URL  →  undefined
  // 출력: import.meta.env.MODE  →  "production"
}

// ★★ 빌트인을 빼먹으면 `import.meta.env.MODE` 가 undefined 가 됩니다.
//   실제로는 Vite 가 넣어 줍니다. 이 파일을 만들면서 한 번 틀렸습니다.
//
// ★ 값을 그냥 붙이지 말고 `JSON.stringify` 를 쓰세요.
//   그래야 따옴표가 붙습니다. 안 그러면 값이 변수 이름처럼 됩니다.

// ───── 문제 8 ───── (개념04)
// .env 를 보고 브라우저로 새 나가면 안 되는 것을 찾으세요.
// VITE_ 로 시작하면서 이름에 KEY·SECRET·PASSWORD 가 든 것입니다.

const 어떤env = {
  VITE_API_URL: "http://13.125.0.0",
  VITE_BEDROCK_KEY: "AKIA…",
  VITE_ADMIN_PASSWORD: "1234",
  DB_PASSWORD: "안 나갑니다",
  VITE_ENABLE_BETA: "true",
};

const 위험한말 = ["KEY", "SECRET", "PASSWORD", "TOKEN"];

const 위험한것 = Object.keys(어떤env).filter(
  (이름) => 이름.startsWith("VITE_") && 위험한말.some((말) => 이름.includes(말)),
);

console.log(`위험: ${위험한것.join(", ")}`);
// 출력: 위험: VITE_BEDROCK_KEY, VITE_ADMIN_PASSWORD
console.log(`DB_PASSWORD 는? ${위험한것.includes("DB_PASSWORD") ? "위험" : "안 나갑니다 (VITE_ 가 없음)"}`);
// 출력: DB_PASSWORD 는? 안 나갑니다 (VITE_ 가 없음)

// ★★★ 이 검사를 배포 스크립트에 넣어 두면 사고를 막습니다.
//   사람은 잊어버립니다. 기계는 안 잊어버립니다.
//
// ★★ 그런데 이 검사는 **이름만** 봅니다.
//   `VITE_SETTING_A=AKIA…` 처럼 이름을 얌전하게 지으면 못 잡습니다.
//   완벽한 검사가 아닙니다. 그물일 뿐입니다.
//   ★ 그래도 안 치는 것보다 훨씬 낫습니다.

// ───── 문제 9 ───── (개념05)
// 키를 보고 CacheControl 값을 정하세요.

function 캐시규칙(키) {
  return 키.startsWith("assets/") ? "public, max-age=31536000, immutable" : "no-cache";
}

for (const 키 of ["index.html", "assets/index-a1b2c3d4.js", "vite.svg"]) {
  console.log(`${키}  →  ${캐시규칙(키)}`);
  // 출력: index.html  →  no-cache
  // 출력: assets/index-a1b2c3d4.js  →  public, max-age=31536000, immutable
  // 출력: vite.svg  →  no-cache
}

// ★★ `vite.svg` 도 no-cache 가 됐습니다. assets/ 안이 아니니까요.
//   이름에 해시가 없으니 맞는 판정입니다. 바꿔도 이름이 그대로거든요.
//
// ★ 판단 기준은 폴더가 아니라 **이름에 해시가 있느냐**입니다.
//   Vite 는 해시 붙는 파일을 전부 assets/ 에 넣어서 폴더로 봐도 같은 결과입니다.
//   설정을 바꿔 다른 폴더를 쓴다면 기준도 바꿔야 합니다.

// ───── 문제 10 ───── (개념05)
// 올리는 순서를 정하세요. assets 를 먼저, index.html 을 나중에.

const 올릴것 = ["index.html", "assets/index-a1b2c3d4.js", "vite.svg", "assets/index-e5f6g7h8.css"];

const 순서대로 = [...올릴것].sort((가, 나) => {
  const 점수 = (키) => (키 === "index.html" ? 1 : 0);
  return 점수(가) - 점수(나);
});

for (const 키 of 순서대로) {
  console.log(키);
  // 출력: assets/index-a1b2c3d4.js
  // 출력: vite.svg
  // 출력: assets/index-e5f6g7h8.css
  // 출력: index.html
}

// ★ 결과가 assets → svg → assets → index.html 로 뒤섞여 보입니다.
//   맞습니다. index.html 만 뒤로 밀고 **나머지는 원래 순서 그대로** 둡니다.
//   JS 의 sort 는 점수가 같으면 순서를 안 바꿉니다. (안정 정렬)
//   우리가 정해야 할 건 index.html 이 마지막이라는 것뿐입니다.
//
// ★★ `sort` 는 원본을 **바꿔 버립니다.** 그래서 `[...올릴것]` 로 복사했습니다.
//   원본을 그대로 쓰면 다음 코드에서 순서가 달라져 있습니다.
//
// ★★★ 왜 index.html 이 마지막이냐 —
//   새 index.html 이 올라간 순간부터 브라우저가 새 assets 를 찾습니다.
//   아직 안 올렸으면 404 → 오류 문서 → HTML 이 옴 → 깨집니다.
//   몇 초짜리 사고지만 배포할 때마다 생깁니다.

// ============================================================
// [손으로] 푸는 문제 — 모범 답안
// ============================================================
//
// ───── 문제 11 ─────
// "환경변수를 바꿨는데 화면이 그대로예요."
//
// 답:
//   프론트 환경변수는 **빌드할 때 값 글자로 박힙니다.** (개념04)
//   .env 를 고치는 것만으로는 dist 가 안 바뀝니다.
//
//   확인 순서:
//   (1) `npm run build` 를 다시 했는가
//   (2) 새로 만들어진 dist 를 S3 에 다시 올렸는가
//   (3) 변수 이름에 `VITE_` 가 붙어 있는가
//   (4) `.env.production` 을 고쳤는가 (`.env.development` 를 고친 건 아닌가)
//   (5) dist/assets/*.js 를 열어 주소가 실제로 박혔는지 눈으로 본다
//
//   ★ (5) 가 확실합니다. 파일을 열어 보면 끝납니다.
//     추측하지 말고 결과물을 여세요.
//
//   ★★ 서버(01단원)는 반대입니다. `process.env` 는 켤 때 읽으니
//     껐다 켜면 됩니다. 같은 '환경변수' 인데 동작이 다릅니다.
//
// ───── 문제 12 ─────
// 한 사람은 "그대로 보인다", 다른 사람은 "깨져 보인다" 고 합니다.
//
// 답:
//   ★ 원인은 **하나**입니다. index.html 을 캐시한 것입니다. (개념05)
//
//   · 그대로 보이는 사람 — index.html 도 assets 도 캐시에 있습니다.
//     서버에 아무것도 안 물어봅니다. 옛 화면을 그대로 봅니다.
//
//   · 깨져 보이는 사람 — index.html 은 캐시에 있는데 assets 캐시가 없어졌습니다.
//     옛 index.html 이 찾는 옛 assets 는 서버에서 지웠습니다.
//     → 404 → 오류 문서(index.html) → `Unexpected token '<'`
//
//   고치는 법:
//   (1) index.html 에 `Cache-Control: no-cache` 를 붙여 다시 올립니다
//   (2) assets 는 `max-age=31536000, immutable` 로 둡니다
//   (3) 옛 assets 를 도로 올려 둡니다 (깨진 사람이 당장 낫습니다)
//   (4) 옛 파일은 며칠 뒤에 지웁니다
//
//   ★★ (1) 만으로는 **이미 캐시된 사람은 안 낫습니다.**
//     그 사람의 캐시가 만료돼야 새 규칙을 받습니다. 1년으로 해 뒀으면 1년입니다.
//     그래서 (3) 이 필요합니다. 이게 이 실수가 무서운 이유입니다.
//
// ───── 문제 13 ─────
// dist 에 API 키가 박힌 채 배포했습니다. 지금 뭘 합니까?
//
// 답:
//   순서가 중요합니다.
//
//   (1) ★ **키를 먼저 폐기합니다.** AWS 콘솔에서 그 키를 비활성화합니다.
//       지우는 게 아니라 못 쓰게 만드는 게 먼저입니다.
//   (2) 새 키를 만들어 **서버(EC2)** 환경변수에 넣습니다.
//   (3) 프론트 코드에서 그 변수를 지웁니다. 서버를 거쳐 부르게 고칩니다.
//   (4) 다시 빌드해서 올립니다.
//   (5) 청구서를 봅니다. 누가 썼는지 확인합니다.
//
//   ★★ 순서를 바꾸면 안 됩니다.
//     코드를 먼저 고치고 키를 나중에 폐기하면, 그 사이에도 옛 키는 살아 있습니다.
//     이미 퍼진 파일은 회수가 안 됩니다.
//
//   ★★★ "S3 에서 파일을 지우면 되지 않나요?" — 안 됩니다.
//     이미 내려받은 사람에게서는 못 지웁니다.
//     **한 번 나간 비밀은 나간 것입니다.** 폐기 말고 방법이 없습니다.
//
// ───── 문제 14 ─────
// 팀원이 "404 나는 게 귀찮으니 HashRouter 씁시다" 라고 합니다.
//
// 답:
//   틀린 말은 아닙니다. 진짜로 404 가 안 납니다. 서버 설정도 필요 없습니다.
//   급하면 쓸 수 있습니다.
//
//   그런데 이 경우에는 오류 문서 설정이 **칸 하나 채우는 일**입니다. (개념03)
//   S3 → 속성 → 정적 웹 사이트 호스팅 → 오류 문서 = index.html.
//   그거 하나 하면 주소가 깨끗해집니다.
//
//   HashRouter 로 가면 —
//   · 주소가 `example.com/#/설비/3` 이 됩니다
//   · 검색엔진이 `#` 뒤를 잘 못 봅니다
//   · 나중에 서버 렌더링으로 못 옮깁니다
//
//   ★ 제안: 오류 문서를 먼저 해 보고, 그래도 막히면 그때 HashRouter 를 봅시다.
//     5분이면 됩니다.
//
//   ★★ 다만 **하위 폴더에 올려야 하는 경우**(회사 서버의 `/앱/` 밑 같은)는
//     이야기가 다릅니다. 그때는 HashRouter 가 오히려 편할 수 있습니다.
//     "무조건 나쁘다" 가 아니라 "여기서는 필요 없다" 가 맞는 말입니다.

// ============================================================
// 다 봤으면 개념01~05 를 다시 훑어보세요.
// ============================================================
