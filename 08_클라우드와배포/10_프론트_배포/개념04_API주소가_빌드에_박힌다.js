// ============================================================
// 개념 04 — API 주소가 빌드에 박힌다
// ============================================================
//
// 화면이 뜹니다. 새로고침도 됩니다. 그런데 데이터가 안 옵니다.
// F12 → Network 를 보면 이렇게 돼 있습니다.
//
//     http://localhost:3000/api/설비   (failed) net::ERR_CONNECTION_REFUSED
//
// ★★ 배포한 화면이 **localhost** 를 부르고 있습니다.
//   내 컴퓨터에서는 localhost 가 내 서버였습니다.
//   남의 컴퓨터에서 localhost 는 **그 사람 컴퓨터**입니다. 거기엔 아무것도 없습니다.
//
// ★★★ 고치는 법은 환경변수입니다. 그런데 01단원에서 배운 것과 **다릅니다.**
//   서버 환경변수는 **켤 때** 읽습니다.
//   프론트 환경변수는 **빌드할 때** 글자로 바뀌어 박힙니다.
//   이 차이를 모르면 "환경변수 바꿨는데 왜 그대로죠?" 에서 하루를 씁니다.
//
// 실행: node 개념04_API주소가_빌드에_박힌다.js
// ============================================================

// ============================================================
// 1. 개발할 때는 왜 됐나
// ============================================================

function 개발할때() {
  console.log("=== 1. 개발할 때 ===\n");
  // 출력: === 1. 개발할 때 ===
  // 출력:

  const 그때 = [
    ["화면", "http://localhost:5173", "npm run dev (Vite)"],
    ["서버", "http://localhost:3000", "node 서버.js"],
  ];

  for (const [무엇, 주소, 어떻게] of 그때) {
    console.log(`${무엇}  ${주소}  ← ${어떻게}`);
    // 출력: 화면  http://localhost:5173  ← npm run dev (Vite)
    // 출력: 서버  http://localhost:3000  ← node 서버.js
  }

  console.log("\n둘 다 내 컴퓨터에 있어서 localhost 로 통했습니다.");
  // 출력:
  // 출력: 둘 다 내 컴퓨터에 있어서 localhost 로 통했습니다.
}

// ★ Vite 의 프록시를 썼다면 주소를 아예 안 적었을 수도 있습니다.
//
//     // vite.config.js
//     server: { proxy: { "/api": "http://localhost:3000" } }
//
//   그러면 코드에는 `fetch("/api/설비")` 라고만 씁니다.
//
// ★★ 함정: **프록시는 개발 서버 기능입니다. 빌드 결과에는 없습니다.**
//   `npm run dev` 로만 확인하고 배포하면 여기서 처음 막힙니다.
//   S3 에 올린 화면이 `/api/설비` 를 부르면 S3 한테 묻는 셈이 됩니다.
//   S3 에 그런 파일이 없으니 → 404 → (개념03 대로) index.html 이 옵니다
//   → `Unexpected token '<'` 가 또 나옵니다.

// ============================================================
// 2. 배포하면 어디를 가리키나
// ============================================================

function 배포하면() {
  console.log("\n=== 2. 배포한 뒤 ===\n");
  // 출력:
  // 출력: === 2. 배포한 뒤 ===
  // 출력:

  const 누가어디서 = [
    ["○", "나 (개발 PC)", "내 서버가 떠 있음"],
    ["✕", "동료 노트북", "그 노트북에 서버 없음 → 연결 거부"],
    ["✕", "휴대폰", "폰에 서버 없음 → 연결 거부"],
  ];

  for (const [결과, 누가, 실제로는] of 누가어디서) {
    console.log(`${결과}  ${누가}  →  localhost:3000  —  ${실제로는}`);
    // 출력: ○  나 (개발 PC)  →  localhost:3000  —  내 서버가 떠 있음
    // 출력: ✕  동료 노트북  →  localhost:3000  —  그 노트북에 서버 없음 → 연결 거부
    // 출력: ✕  휴대폰  →  localhost:3000  —  폰에 서버 없음 → 연결 거부
  }

  console.log("\n★ 내 컴퓨터에서만 되니까 배포 전에는 절대 안 걸립니다.");
  // 출력:
  // 출력: ★ 내 컴퓨터에서만 되니까 배포 전에는 절대 안 걸립니다.
}

// ============================================================
// 3. 환경변수로 빼기
// ============================================================
//
// 코드에서 주소를 지우고 환경변수로 뺍니다.
//
//     // 전
//     const 답 = await fetch("http://localhost:3000/api/설비");
//
//     // 후
//     const 서버주소 = import.meta.env.VITE_API_URL;
//     const 답 = await fetch(`${서버주소}/api/설비`);
//
// 그리고 파일 두 개를 만듭니다.
//
//     .env.development   VITE_API_URL=http://localhost:3000
//     .env.production    VITE_API_URL=http://13.125.xx.xx
//
// `npm run dev` 는 development 를, `npm run build` 는 production 을 씁니다.
//
// ★★ 셋째 환경(스테이징)을 만들려면 `--mode` 를 씁니다.
//
//     .env.staging      VITE_API_URL=https://staging.내도메인.com
//
//     vite build --mode staging      → .env.staging 을 읽습니다
//     vite build                     → .env.production (기본 모드가 production)
//     vite dev                       → .env.development (기본 모드가 development)
//
//   `--mode 이름` 은 **`.env.이름` 을 고르는 스위치**입니다.
//   dev·build 에 정해진 기본값이 있을 뿐, 두 개만 쓸 수 있는 게 아닙니다.
//   package.json 에 이렇게 넣어 두면 편합니다.
//
//     "build:staging": "vite build --mode staging"
//
// ★ `.env.local` 은 **git 에 안 올리는 내 컴퓨터 전용** 값입니다.
//   모드와 상관없이 항상 읽히고, `.env` 보다 우선합니다.
//   (`.env.production.local` 처럼 모드별 local 도 있습니다)
//   → 팀이 같이 쓰는 값은 `.env.development`, 나만 쓰는 값은 `.env.local`.
//   .gitignore 에 `*.local` 을 넣으세요. Vite 가 만들어 주는 기본값에 있습니다.

// ★ 01단원의 서버 쪽과 이름이 다릅니다.
//   서버: process.env.PORT
//   프론트: import.meta.env.VITE_API_URL
//
//   ★★ `process` 는 Node 것입니다. 브라우저에는 없습니다.
//     Vite 는 `process.env` 를 그대로 두기 때문에, 프론트 코드에 쓰면
//     브라우저에서 `process is not defined` 가 납니다.
//
//   ★★★ 그런데 이건 **Vite 한정**입니다. 도구마다 이름과 방식이 다릅니다.
//
//     Vite         import.meta.env.VITE_API_URL        접두어 VITE_
//     CRA·webpack  process.env.REACT_APP_API_URL       접두어 REACT_APP_
//     Next.js      process.env.NEXT_PUBLIC_API_URL     접두어 NEXT_PUBLIC_
//
//     CRA 와 webpack 은 빌드할 때 `process.env.REACT_APP_XXX` 를 값 글자로
//     **치환해 줍니다.** 그래서 브라우저에 process 가 없어도 잘 돕니다.
//
//     → "프론트에 process.env 를 쓰면 안 된다" 가 아니라
//       **"내 도구가 무엇을 치환해 주는지 알아야 한다"** 가 맞습니다.
//       남의 예제를 그대로 옮겼는데 안 되는 이유가 대개 이것입니다.
//
//   ★ 셋의 공통점은 하나입니다. **접두어가 붙은 것만** 들어갑니다.
//     그래야 실수로 서버 비밀 값이 화면에 실리지 않습니다. (4번 절)

// ============================================================
// 4. ★★ 빌드 때 '글자로' 바뀝니다
// ============================================================
//
// 여기가 이 단원에서 제일 중요합니다.
// Vite 가 빌드할 때 하는 일을 그대로 흉내 내 봅니다.

// ★ Vite 가 접두어와 상관없이 항상 넣어 주는 것들입니다.
//   내가 .env 에 적는 게 아니라 Vite 가 만들어 줍니다.
const 빌트인 = ["MODE", "BASE_URL", "PROD", "DEV", "SSR"];

function 가짜빌드(소스, 환경) {
  // ★ Vite 는 `import.meta.env.XXX` 를 찾아서 **값 글자로 바꿔 버립니다.**
  //   읽어 오는 코드로 바꾸는 게 아닙니다. 아예 지우고 값을 써 넣습니다.
  return 소스.replace(/import\.meta\.env\.([A-Za-z0-9_]+)/g, (통째로, 이름) => {
    if (빌트인.includes(이름)) return JSON.stringify(환경[이름]);

    // ★★ 나머지는 VITE_ 로 시작하는 것만 넣어 줍니다.
    if (!이름.startsWith("VITE_")) return "undefined";

    return JSON.stringify(환경[이름]);
  });
}

const 원본소스 = [
  'const 서버주소 = import.meta.env.VITE_API_URL;',
  'const 모드 = import.meta.env.MODE;',
  'const 답 = await fetch(`${서버주소}/api/설비`);',
].join("\n");

function 빌드해보기() {
  console.log("\n=== 4. 빌드하면 이렇게 됩니다 ===\n");
  // 출력:
  // 출력: === 4. 빌드하면 이렇게 됩니다 ===
  // 출력:

  const 결과 = 가짜빌드(원본소스, {
    VITE_API_URL: "http://13.125.0.0",
    MODE: "production",
  });

  console.log("[전]\n" + 원본소스 + "\n\n[후]\n" + 결과);
  // 출력: [전]
  // 출력: const 서버주소 = import.meta.env.VITE_API_URL;
  // 출력: const 모드 = import.meta.env.MODE;
  // 출력: const 답 = await fetch(`${서버주소}/api/설비`);
  // 출력:
  // 출력: [후]
  // 출력: const 서버주소 = "http://13.125.0.0";
  // 출력: const 모드 = "production";
  // 출력: const 답 = await fetch(`${서버주소}/api/설비`);
}

// ★★★ `import.meta.env.VITE_API_URL` 이라는 글자가 결과에 **없습니다.**
//   주소가 그 자리에 통째로 박혔습니다.
//
//   그래서 —
//
//   (1) 주소를 바꾸려면 **다시 빌드해야 합니다.**
//       .env 만 고치고 dist 를 그대로 올리면 아무것도 안 바뀝니다.
//       ★ "환경변수 바꿨는데 왜 그대로예요?" 의 답이 이것입니다.
//
//   (2) 서버는 반대입니다. `process.env.PORT` 는 **켤 때** 읽습니다.
//       그래서 서버는 껐다 켜기만 하면 됩니다. 다시 빌드 안 합니다.
//
//   ★★ 같은 '환경변수' 라는 말을 쓰는데 동작이 정반대입니다.

// ============================================================
// 5. VITE_ 를 안 붙이면 안 들어갑니다
// ============================================================

function 접두어() {
  console.log("\n=== 5. VITE_ 가 없으면 ===\n");
  // 출력:
  // 출력: === 5. VITE_ 가 없으면 ===
  // 출력:

  const 환경 = {
    VITE_API_URL: "http://13.125.0.0",
    API_URL: "http://13.125.0.0",
    DB_PASSWORD: "비밀번호1234",
    MODE: "production",
    DEV: false,
  };

  const 시험소스 = [
    "import.meta.env.VITE_API_URL",
    "import.meta.env.API_URL",
    "import.meta.env.DB_PASSWORD",
    "import.meta.env.MODE", // ★ 빌트인. 접두어가 없는데도 들어갑니다
    "import.meta.env.DEV",
  ];

  for (const 한줄 of 시험소스) {
    console.log(`${한줄.padEnd(32, " ")} → ${가짜빌드(한줄, 환경)}`);
    // 출력: import.meta.env.VITE_API_URL     → "http://13.125.0.0"
    // 출력: import.meta.env.API_URL          → undefined
    // 출력: import.meta.env.DB_PASSWORD      → undefined
    // 출력: import.meta.env.MODE             → "production"
    // 출력: import.meta.env.DEV              → false
  }
}

// ★★ MODE 와 DEV 는 VITE_ 가 없는데도 들어갔습니다.
//   Vite 가 항상 넣어 주는 것이 다섯 개 있습니다.
//
//     MODE      "development" 또는 "production"
//     DEV       개발 서버면 true
//     PROD      빌드 결과면 true
//     BASE_URL  보통 "/" (개념01 에서 본 base 옵션)
//     SSR       서버 렌더링이면 true
//
//   ★ 이건 내가 .env 에 적는 게 아닙니다. Vite 가 만들어 줍니다.
//     그래서 `if (import.meta.env.DEV)` 로 개발일 때만 도는 코드를 쓸 수 있습니다.
//
// ★★ 나머지는 일부러 막아 놨습니다.
//   `.env` 에는 DB 비밀번호도 들어 있을 수 있습니다.
//   그걸 전부 브라우저로 내보내면 큰일 납니다.
//   그래서 **VITE_ 를 붙인 것만** 내보냅니다.
//
// ★ "환경변수를 넣었는데 undefined 예요" 의 대부분이 접두어를 빼먹은 것입니다.
//   그리고 .env 를 고쳤으면 **개발 서버도 껐다 켜야** 합니다.

// ============================================================
// 6. ★★★ 그래서 비밀은 절대 넣으면 안 됩니다
// ============================================================
//
// VITE_ 만 나간다니까 "그럼 VITE_ 를 붙이면 뭐든 되겠네" 라고 생각하기 쉽습니다.
// 반대입니다. **VITE_ 를 붙이는 순간 전 세계에 공개됩니다.**

function 비밀이샌다() {
  console.log("\n=== 6. 비밀을 넣어 보면 ===\n");
  // 출력:
  // 출력: === 6. 비밀을 넣어 보면 ===
  // 출력:

  const 나쁜소스 = 'const 키 = import.meta.env.VITE_BEDROCK_KEY;';
  const 빌드결과 = 가짜빌드(나쁜소스, { VITE_BEDROCK_KEY: "AKIA실제키값1234" });

  console.log("빌드 결과:\n  " + 빌드결과 + "\n");
  // 출력: 빌드 결과:
  // 출력:   const 키 = "AKIA실제키값1234";
  // 출력:

  // 브라우저에서 누구나 이 파일을 내려받아 열어 볼 수 있습니다
  const 찾은것 = 빌드결과.match(/AKIA[A-Za-z0-9가-힣]+/);
  console.log(`dist 파일에서 검색: ${찾은것 ? "★ 찾음 — " + 찾은것[0] : "없음"}`);
  // 출력: dist 파일에서 검색: ★ 찾음 — AKIA실제키값1234
}

// ★★★ dist 안의 .js 는 **누구나 내려받을 수 있는 파일**입니다.
//   F12 → Sources 에서 그냥 열립니다. Ctrl+F 로 검색도 됩니다.
//   압축돼 있어도 글자는 그대로 남습니다. 숨겨지는 게 아닙니다.
//
// ★★ 그럼 LLM API 키는 어디에 두나 — **서버에** 둡니다.
//   AI자료 02단원에서 이미 그렇게 했습니다.
//   브라우저 → 내 서버(EC2) → Bedrock 순서로 갑니다.
//   브라우저가 Bedrock 을 직접 부르면 안 됩니다.
//
// ★ 프론트 환경변수에 넣어도 되는 것
//   · API 서버 주소       (어차피 Network 탭에 보입니다)
//   · 기능 켜고 끄는 값     (VITE_ENABLE_BETA=true)
//   · 공개용 지도 키 등     (도메인 제한을 걸어 두는 종류)

// ============================================================
// 7. 배포 순서
// ============================================================

function 배포순서() {
  console.log("\n=== 7. 배포 순서 ===\n");
  // 출력:
  // 출력: === 7. 배포 순서 ===
  // 출력:

  const 차례 = [
    "1. EC2 에 서버를 올리고 주소를 확인합니다      (07단원)",
    "2. .env.production 에 그 주소를 적습니다",
    "3. npm run build                          ← ★ 여기서 주소가 박힙니다",
    "4. dist 를 S3 에 올립니다                    (개념02)",
    "5. 서버에서 CORS 에 S3 주소를 넣습니다          (아래)",
  ];

  for (const 한줄 of 차례) {
    console.log(한줄);
    // 출력: 1. EC2 에 서버를 올리고 주소를 확인합니다      (07단원)
    // 출력: 2. .env.production 에 그 주소를 적습니다
    // 출력: 3. npm run build                          ← ★ 여기서 주소가 박힙니다
    // 출력: 4. dist 를 S3 에 올립니다                    (개념02)
    // 출력: 5. 서버에서 CORS 에 S3 주소를 넣습니다          (아래)
  }

  console.log("\n★ 2번을 고쳤으면 3번부터 다시 합니다. 4번만 다시 하면 안 바뀝니다.");
  // 출력:
  // 출력: ★ 2번을 고쳤으면 3번부터 다시 합니다. 4번만 다시 하면 안 바뀝니다.
}

// ============================================================
// 8. 마지막 관문 — CORS
// ============================================================

function 마지막관문() {
  console.log("\n=== 8. CORS ===\n");
  // 출력:
  // 출력: === 8. CORS ===
  // 출력:

  const 화면 = "http://내버킷.s3-website.ap-northeast-2.amazonaws.com";
  const API = "http://13.125.0.0";

  console.log(`화면: ${화면}`);
  // 출력: 화면: http://내버킷.s3-website.ap-northeast-2.amazonaws.com
  console.log(`API : ${API}`);
  // 출력: API : http://13.125.0.0
  console.log("\n★ 주소가 다릅니다 → 브라우저가 막습니다 (CORS)\n");
  // 출력:
  // 출력: ★ 주소가 다릅니다 → 브라우저가 막습니다 (CORS)
  // 출력:

  const 서버설정 = [
    "// 서버 쪽 (백엔드 08단원에서 배운 것)",
    "app.use(cors({",
    '  origin: process.env.CORS_ORIGINS.split(","),',
    "}));",
    "",
    "// .env (EC2 에서)",
    "CORS_ORIGINS=http://내버킷.s3-website.ap-northeast-2.amazonaws.com",
  ];

  for (const 한줄 of 서버설정) {
    console.log(한줄);
    // 출력: // 서버 쪽 (백엔드 08단원에서 배운 것)
    // 출력: app.use(cors({
    // 출력:   origin: process.env.CORS_ORIGINS.split(","),
    // 출력: }));
    // 출력:
    // 출력: // .env (EC2 에서)
    // 출력: CORS_ORIGINS=http://내버킷.s3-website.ap-northeast-2.amazonaws.com
  }
}

// ★★ 여기서 제일 흔한 실수 두 가지
//
//   (1) 주소 끝에 `/` 를 붙임
//       `http://…amazonaws.com/` ← ★ 안 맞습니다. 끝의 슬래시를 빼세요.
//
//   (2) `http` 와 `https` 를 헷갈림
//       S3 웹사이트 엔드포인트는 **http** 입니다. https 로 적으면 안 맞습니다.
//
//   ★ CORS 오류 메시지에 브라우저가 보낸 Origin 이 그대로 찍힙니다.
//     그걸 복사해서 넣는 게 제일 확실합니다.

// ============================================================
// 실행
// ============================================================

개발할때();
배포하면();
빌드해보기();
접두어();
비밀이샌다();
배포순서();
마지막관문();

// ============================================================
// 정리
// ============================================================
//
//   1. localhost 는 **보는 사람의 컴퓨터**입니다. 배포하면 못 씁니다.
//   2. 주소는 `import.meta.env.VITE_API_URL` 로 뺍니다.
//   3. ★★ 이 값은 **빌드할 때 글자로 박힙니다.** 서버 환경변수와 반대입니다.
//      → 주소를 바꾸면 **다시 빌드**해야 합니다.
//   4. `VITE_` 를 안 붙이면 undefined 입니다.
//   5. ★★★ VITE_ 를 붙이면 **공개**됩니다. 비밀은 절대 넣지 마세요.
//   6. 화면과 API 주소가 다르니 서버에 CORS 를 열어야 합니다.
//
// ★ 다음: 다시 배포했는데 남들 화면이 안 바뀝니다. → 개념05
// ============================================================
