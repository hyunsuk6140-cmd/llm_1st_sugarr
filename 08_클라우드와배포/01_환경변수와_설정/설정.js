// ============================================================
// 설정.js — 환경변수를 읽고 확인하는 곳 (이 프로젝트에 딱 하나)
// ------------------------------------------------------------
// 다른 파일은 process.env 를 직접 안 읽습니다. 여기서 가져다 씁니다.
//
//   const 설정 = require("./설정");
//   app.listen(설정.포트);
// ============================================================
//
// ★ 왜 한 곳에 모으나
//
//   process.env.PORT 를 열 군데에서 읽으면 이런 일이 생깁니다.
//     · 어디는 Number 를 하고 어디는 안 합니다
//     · 기본값이 파일마다 다릅니다 (3000 / 8080 / undefined)
//     · 이름을 오타 내면 조용히 undefined 가 흘러갑니다
//     · 무엇이 필요한지 알려면 전체를 뒤져야 합니다
//
//   한 곳에 모으면 이 파일만 열어 보면 됩니다.

const fs = require("fs");
const path = require("path");

// ── .env 읽기 ──
// 이미 설정된 값이 있으면 .env 가 못 덮어씁니다. (개념02 섹션 3)
//
// ★ 어느 파일을 읽을지도 환경변수로 정할 수 있게 해 뒀습니다.
//   ENV_FILE=.env.production node server.js
//   설정 파일 자체를 바꿔 끼울 수 있으니 시험할 때도 편합니다.
const env파일 = process.env.ENV_FILE
  ? path.resolve(process.env.ENV_FILE)
  : path.join(__dirname, ".env");

if (fs.existsSync(env파일)) {
  process.loadEnvFile(env파일);
}

// ★ existsSync 로 감싼 이유
//   운영 서버에는 .env 파일이 없습니다. 서버 설정으로 넣으니까요. (07단원)
//   파일이 없다고 서버가 안 켜지면 안 됩니다.


// ── 읽는 도우미 ──
// 타입 변환과 필수 확인을 여기서 한 번만 합니다.

const 모자란것 = [];

function 글자(이름, 기본값) {
  const 값 = process.env[이름];

  // 빈 글자도 '없는 것' 으로 봅니다. .env 에 `KEY=` 라고 적은 경우입니다.
  if (값 === undefined || 값 === "") {
    if (기본값 === undefined) 모자란것.push(이름);
    return 기본값;
  }

  return 값;
}

function 숫자(이름, 기본값) {
  const 값 = process.env[이름];

  if (값 === undefined || 값 === "") {
    if (기본값 === undefined) 모자란것.push(이름);
    return 기본값;
  }

  const 바꾼것 = Number(값);

  // ★ 숫자가 아닌 것을 넣었으면 기본값으로 넘어가면 안 됩니다.
  //   "3000x" 를 적어 두고 3000 으로 도는 것보다, 안 켜지는 편이 낫습니다.
  if (!Number.isFinite(바꾼것)) {
    모자란것.push(`${이름} (숫자여야 하는데 "${값}")`);
    return 기본값;
  }

  return 바꾼것;
}

function 참거짓(이름, 기본값) {
  const 값 = process.env[이름];

  if (값 === undefined || 값 === "") return 기본값;

  // ★ Boolean("false") 는 true 입니다. 글자로 비교해야 합니다. (개념01)
  return 값 === "true" || 값 === "1";
}

function 목록(이름, 기본값) {
  const 값 = 글자(이름, 기본값?.join(","));

  if (값 === undefined) return [];

  return 값
    .split(",")
    .map((조각) => 조각.trim())
    .filter(Boolean);
}


// ── 설정 ──

const 설정 = {
  환경: 글자("NODE_ENV", "development"),
  포트: 숫자("PORT", 3000),

  DB파일: 글자("DB_FILE", "./data/설비.db"),

  허용출처들: 목록("CORS_ORIGINS", ["http://localhost:5173"]),

  최대업로드: 숫자("MAX_UPLOAD_SIZE", 5 * 1024 * 1024),

  // ★ 기본값이 없습니다. 없으면 서버를 안 켭니다.
  //   비밀에 기본값을 주면 안 됩니다. "admin1234" 같은 게 그대로 운영에 갑니다.
  관리자키: 글자("ADMIN_KEY"),
};

// 자주 쓰는 판단을 미리 해 둡니다.
설정.운영인가 = 설정.환경 === "production";
설정.개발인가 = 설정.환경 === "development";


// ── ★ 시작할 때 확인하고, 모자라면 바로 멈춥니다 ──

if (모자란것.length > 0) {
  console.error("");
  console.error("설정이 모자라서 서버를 켤 수 없습니다.");
  console.error("");

  for (const 이름 of 모자란것) {
    console.error(`  · ${이름}`);
  }

  console.error("");
  console.error("  .env 파일을 확인하세요. .env.예시 를 복사해서 만들면 됩니다.");
  console.error("    cp .env.예시 .env");
  console.error("");

  process.exit(1);
}

// ★★ 왜 '바로 멈추는' 것이 나은가
//
//   설정이 빠진 채로 켜지면, 나중에 엉뚱한 곳에서 터집니다.
//     "Cannot read properties of undefined"
//   그걸 보고 원인이 환경변수라고 생각하기는 아주 어렵습니다.
//
//   켜질 때 "ADMIN_KEY 가 없습니다" 라고 말하고 죽으면 5초면 고칩니다.
//   이걸 fail fast 라고 부릅니다. 일찍 실패하는 게 낫다는 뜻입니다.
//
// ★ 배포에서 특히 중요합니다.
//   설정이 빠진 채로 켜지면 '켜지긴 했는데 안 되는' 서버가 됩니다.
//   감시 도구는 살아 있다고 보고합니다. 아무도 모릅니다.


// ── 밖에서 못 고치게 잠급니다 ──
Object.freeze(설정);

module.exports = 설정;

// ★ freeze 를 하는 이유
//   어느 파일에서 설정.포트 = 9999 라고 쓰면 조용히 바뀝니다.
//   그런 코드는 반드시 나중에 사고가 됩니다. 아예 못 바꾸게 잠급니다.
//
// ★ 비밀을 통째로 찍지 마세요
//   console.log(설정) 을 하면 관리자키가 터미널과 로그 파일에 남습니다.
//   찍어야 한다면 가려서 찍으세요. 개념03 섹션 5 에서 만듭니다.
