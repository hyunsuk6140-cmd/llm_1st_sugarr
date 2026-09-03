// ============================================================
// 01단원 연습문제 정답 — 환경변수와 설정
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const path = require("path");
const cp = require("child_process");

const 가짜env = {
  PORT: "4000",
  DEBUG: "false",
  CORS_ORIGINS: " http://a.com , http://b.com ,, ",
  EMPTY: "",
  ADMIN_KEY: "비밀키입니다",
  BAD_PORT: "삼천",
};


// ───── 문제 1 ─────

console.log("PORT 의 타입:", typeof 가짜env.PORT);
// 출력: PORT 의 타입: string
console.log("그냥 더하면:", 가짜env.PORT + 1);  // 검증무시: 일부러 보여 주는 잘못된 예입니다
// 출력: 그냥 더하면: 40001

// ★ 이게 이 단원의 출발점입니다.
//   환경변수는 운영체제가 주는 것이라 **언제나 글자** 입니다.
//   `4000 + 1` 을 기대하고 `"40001"` 을 받으면, 그 서버는 40001 포트에서 뜹니다.
//   에러가 안 납니다. 그래서 더 무섭습니다.


// ───── 문제 2 ─────

console.log('Boolean("false"):', Boolean("false"));
// 출력: Boolean("false"): true
console.log("이렇게 읽으면 DEBUG 가 켜집니다:", Boolean(가짜env.DEBUG));
// 출력: 이렇게 읽으면 DEBUG 가 켜집니다: true

// ★ `.env` 에 `DEBUG=false` 라고 똑똑히 적어 뒀는데 디버그가 켜집니다.
//   JavaScript 에서 빈 글자가 아닌 모든 글자는 참이기 때문입니다.
//   `"false"` 는 다섯 글자짜리 글자입니다. 비어 있지 않으니 참입니다.
//
// ★★ 운영 서버에서 디버그 로그가 켜지면 비밀이 로그에 찍힙니다.
//   이 한 줄 때문에 사고가 납니다.


// ───── 문제 3 ─────

function 참거짓(env, 이름, 기본값) {
  const 값 = env[이름];

  // ★ 빈 글자도 '없는 것' 으로 봅니다. `.env` 에 `DEBUG=` 라고만 적은 경우입니다.
  if (값 === undefined || 값 === "") return 기본값;

  // ★ 글자끼리 비교합니다. Boolean() 을 안 씁니다.
  return 값 === "true" || 값 === "1";
}

console.log("DEBUG:", 참거짓(가짜env, "DEBUG", true));
// 출력: DEBUG: false
console.log("없는 값 (기본값 true):", 참거짓(가짜env, "NO_SUCH", true));
// 출력: 없는 값 (기본값 true): true
console.log("빈 글자 (기본값 true):", 참거짓(가짜env, "EMPTY", true));
// 출력: 빈 글자 (기본값 true): true

// ★ `"1"` 도 참으로 본 이유
//   도커나 CI 설정에서 `DEBUG=1` 로 쓰는 곳이 많습니다.
//   받아 주는 편이 덜 놀랍습니다.
//
// ★ 반대로 `"yes"`·`"on"` 까지 받아 줄지는 정하기 나름입니다.
//   다만 **정했으면 한 곳에만 적으세요.** 파일마다 다르게 읽으면 그게 사고입니다.


// ───── 문제 4 ─────

const 모자란것 = [];

function 숫자(env, 이름, 기본값) {
  const 값 = env[이름];

  if (값 === undefined || 값 === "") {
    // 기본값도 없으면 그건 필수인데 안 준 것입니다.
    if (기본값 === undefined) 모자란것.push(이름);
    return 기본값;
  }

  const 바꾼것 = Number(값);

  // ★★ 여기가 이 문제의 핵심입니다.
  //   `"삼천"` 을 Number 로 바꾸면 NaN 입니다.
  //   여기서 조용히 기본값 3000 을 주면, 사람은 4000 을 적어 뒀다고 믿는데
  //   서버는 3000 에서 돕니다. **틀린 채로 도는 것이 제일 나쁩니다.**
  if (!Number.isFinite(바꾼것)) {
    모자란것.push(`${이름} (숫자여야 하는데 "${값}")`);
    return 기본값;
  }

  return 바꾼것;
}

console.log("PORT:", 숫자(가짜env, "PORT", 3000), typeof 숫자(가짜env, "PORT", 3000));
// 출력: PORT: 4000 number
console.log("없는 값:", 숫자(가짜env, "NO_SUCH", 3000));
// 출력: 없는 값: 3000
console.log("숫자가 아닌 값:", 숫자(가짜env, "BAD_PORT", undefined));
// 출력: 숫자가 아닌 값: undefined
console.log("모아 둔 문제:", 모자란것);
// 출력: 모아 둔 문제: [ 'BAD_PORT (숫자여야 하는데 "삼천")' ]

// ★ 왜 그 자리에서 던지지 않고 배열에 모으나
//   던지면 **첫 번째 문제만** 보입니다. 고치고 다시 켜면 두 번째가 나옵니다.
//   세 개가 빠졌으면 세 번 켜야 합니다.
//   모아서 한 번에 보여 주면 한 번에 다 고칩니다.
//
// ★ `Number.isFinite` 를 쓴 이유
//   `isNaN("")` 은 false 입니다. 빈 글자가 0 으로 바뀌기 때문입니다.
//   `Infinity` 도 걸러야 합니다. `PORT=Infinity` 는 포트가 아닙니다.


// ───── 문제 5 ─────

function 목록(env, 이름, 기본값) {
  const 값 = env[이름];

  if (값 === undefined || 값 === "") return 기본값;

  return 값
    .split(",")
    .map((조각) => 조각.trim())
    .filter(Boolean);
}

console.log("허용 출처:", 목록(가짜env, "CORS_ORIGINS", []));
// 출력: 허용 출처: [ 'http://a.com', 'http://b.com' ]
console.log("개수:", 목록(가짜env, "CORS_ORIGINS", []).length);
// 출력: 개수: 2

// ★ `trim()` 과 `filter(Boolean)` 이 둘 다 필요합니다.
//   `.env` 에 `CORS_ORIGINS=a.com, b.com,` 처럼 쓰는 일이 아주 흔합니다.
//   공백을 안 지우면 허용 출처가 `" http://b.com"` 이 되어 **CORS 가 막힙니다.**
//   원인을 찾기 어려운 종류의 버그입니다. 눈으로는 같아 보이니까요.
//
// ★ 08단원에서 이 값이 그대로 CORS 설정으로 들어갑니다.


// ───── 문제 6 ─────

console.log(`그냥 읽으면: "${가짜env.EMPTY}" (길이 ${가짜env.EMPTY.length})`);
// 출력: 그냥 읽으면: "" (길이 0)

const 걸러서읽은것 = 가짜env.EMPTY === undefined || 가짜env.EMPTY === "" ? "기본값입니다" : 가짜env.EMPTY;

console.log("빈 글자를 거르면:", 걸러서읽은것);
// 출력: 빈 글자를 거르면: 기본값입니다

// ★ `KEY=` 라고 적는 것은 대개 "아직 안 정했다" 는 뜻입니다.
//   빈 글자를 그대로 받으면 DB 주소가 `""` 인 채로 서버가 켜집니다.
//   `undefined` 와 똑같이 취급하는 편이 맞습니다.


// ───── 문제 7 ─────

function 가리기(값) {
  if (값 === undefined || 값 === "") return "(없음)";
  if (값.length <= 2) return "*".repeat(값.length);

  return 값.slice(0, 2) + "*".repeat(값.length - 2);
}

console.log("가린 관리자키:", 가리기(가짜env.ADMIN_KEY));
// 출력: 가린 관리자키: 비밀****
console.log("값이 없을 때:", 가리기(undefined));
// 출력: 값이 없을 때: (없음)

// ★ 왜 앞 두 글자를 남기나
//   전부 가리면 "값이 들어가긴 했나" 를 확인할 수 없습니다.
//   앞 두 글자만 보면 "아 이 키가 맞네" 를 알 수 있으면서도 새지 않습니다.
//
// ★★ 길이를 그대로 노출하는 것도 사실 정보입니다.
//   아주 민감한 곳은 `****` 처럼 길이도 숨깁니다. 정하기 나름입니다.
//
// ★ `console.log(설정)` 을 절대 그대로 하지 마세요.
//   터미널에 찍힌 것은 사람이 보고 넘기지만, **로그 파일에는 남습니다.**
//   09단원에서 그 로그를 모읍니다. 비밀이 로그 저장소로 흘러갑니다.


// ───── 문제 8 ─────

function 한줄읽기(줄) {
  const 다듬은것 = 줄.trim();

  if (다듬은것 === "" || 다듬은것.startsWith("#")) return null;

  const 자리 = 다듬은것.indexOf("=");

  if (자리 === -1) return null;

  const 이름 = 다듬은것.slice(0, 자리).trim();

  // ★ split("=") 을 쓰면 안 됩니다. 값 안의 `=` 까지 잘립니다.
  //   DB 주소나 토큰에는 `=` 가 자주 들어갑니다. (base64 가 `=` 로 끝납니다)
  //   **첫 번째 `=` 에서 한 번만** 자릅니다.
  let 값 = 다듬은것.slice(자리 + 1).trim();

  if (값.length >= 2 && 값.startsWith('"') && 값.endsWith('"')) {
    값 = 값.slice(1, -1);
  }

  return [이름, 값];
}

console.log("보통 줄:", 한줄읽기("PORT=4000"));
// 출력: 보통 줄: [ 'PORT', '4000' ]
console.log("주석 줄:", 한줄읽기("# 이건 주석"));
// 출력: 주석 줄: null
console.log("빈 줄:", 한줄읽기("   "));
// 출력: 빈 줄: null
console.log("값에 = 가 있는 줄:", 한줄읽기("URL=postgres://u:p@h/db?a=1"));
// 출력: 값에 = 가 있는 줄: [ 'URL', 'postgres://u:p@h/db?a=1' ]
console.log("따옴표를 벗긴 줄:", 한줄읽기('MSG="안녕 하세요"'));
// 출력: 따옴표를 벗긴 줄: [ 'MSG', '안녕 하세요' ]

// ★ 따옴표를 왜 쓰나
//   값에 공백이 들어갈 때 씁니다. 따옴표가 없으면 어디까지가 값인지 헷갈립니다.
//   그리고 벗겨 내지 않으면 값이 `"안녕 하세요"` 가 되어 따옴표까지 값이 됩니다.
//
// ★★ 직접 만들 일은 사실 없습니다. Node 24 의 `process.loadEnvFile` 이 해 줍니다.
//   그래도 한 번 만들어 보면 `.env` 가 왜 가끔 이상하게 읽히는지 알게 됩니다.
//   대부분 이 세 가지입니다: 따옴표, 값 안의 `=`, 줄 끝 공백.


// ───── 문제 9 ─────

const 비밀단어들 = ["KEY", "SECRET", "PASSWORD", "TOKEN"];

function 기본값줘도되나(이름) {
  return !비밀단어들.some((단어) => 이름.toUpperCase().includes(단어));
}

for (const 이름 of ["PORT", "ADMIN_KEY", "DB_PASSWORD", "JWT_SECRET", "CORS_ORIGINS"]) {
  console.log(`${이름}: ${기본값줘도되나(이름) ? "기본값 OK" : "기본값 금지"}`);
}
// 출력: PORT: 기본값 OK
// 출력: ADMIN_KEY: 기본값 금지
// 출력: DB_PASSWORD: 기본값 금지
// 출력: JWT_SECRET: 기본값 금지
// 출력: CORS_ORIGINS: 기본값 OK

// ★★ 비밀에 기본값을 주면 어떻게 되나
//   `const 관리자키 = 글자("ADMIN_KEY", "admin1234")`
//   개발할 때는 편합니다. 그리고 **그대로 배포됩니다.**
//   아무도 `.env` 에 ADMIN_KEY 를 안 적었는데 서버는 잘 켜지니까요.
//   `admin1234` 로 관리자 API 가 열린 채 돕니다.
//
//   기본값을 안 주면 서버가 안 켜집니다. 그래서 반드시 적게 됩니다.
//   **불편한 것이 방어입니다.**
//
// ★ 이 함수는 이름만 보고 판단합니다. 완벽하지 않습니다.
//   `DB_URL` 에도 비밀번호가 들어 있지만 못 잡습니다.
//   그래도 없는 것보다 훨씬 낫습니다. 09단원 `배포점검.js` 가 이런 검사들의 모음입니다.


// ───── 문제 10 ───── [도전]

const 설정파일 = path.join(__dirname, "설정.js");

function 켜보기(환경) {
  return cp.spawnSync(
    process.execPath,
    ["-e", `const 설정 = require(process.argv[1]); console.log("켜짐:" + 설정.포트)`, 설정파일],
    {
      // ★ env 를 통째로 갈아 끼웁니다. 지금 터미널의 환경변수를 물려주지 않습니다.
      //   물려주면 내 컴퓨터에 ADMIN_KEY 가 있는 사람만 통과합니다.
      //   그러면 "내 컴퓨터에서는 되는데요" 가 됩니다.
      env: { ...환경, ENV_FILE: path.join(__dirname, "없는파일.env") },
      encoding: "utf8",
    }
  );
}

// ★ ENV_FILE 로 없는 파일을 가리킨 이유
//   이 폴더에 진짜 `.env` 가 있으면 그것을 읽어 버려서 시험이 안 됩니다.
//   설정.js 가 `ENV_FILE` 을 보게 만들어 둔 덕에 갈아 끼울 수 있습니다.
//   **시험할 수 있게 만들어 두는 것** 이 이런 데서 값을 합니다.

console.log("ADMIN_KEY 없이:", 켜보기({}).status === 1 ? "죽음(1)" : "삶(0)");
// 출력: ADMIN_KEY 없이: 죽음(1)
console.log("이유를 말해 주나:", 켜보기({}).stderr.includes("ADMIN_KEY"));
// 출력: 이유를 말해 주나: true
console.log("ADMIN_KEY 주고:", 켜보기({ ADMIN_KEY: "키" }).status === 1 ? "죽음(1)" : "삶(0)");
// 출력: ADMIN_KEY 주고: 삶(0)
console.log("이상한 PORT:", 켜보기({ ADMIN_KEY: "키", PORT: "삼천" }).status === 1 ? "죽음(1)" : "삶(0)");
// 출력: 이상한 PORT: 죽음(1)

// ★★ 이 문제가 이 단원의 결론입니다.
//
//   설정이 모자라면 **서버가 안 켜집니다.** 켜졌다가 나중에 터지지 않습니다.
//   그게 fail fast 입니다.
//
//   ★ 그리고 그것을 **말이 아니라 코드로 확인했습니다.**
//     "안 켜지게 만들었습니다" 라고 적어 두는 것과,
//     실제로 켜 보고 status 가 1 인 것을 보는 것은 다릅니다.
//     자료의 검증 도구가 하는 일이 이것입니다.
//
// ★ 07단원에서 PM2 로 띄울 때 이 성질이 특히 중요합니다.
//   PM2 는 죽은 프로세스를 다시 살립니다.
//   설정이 빠져 있으면 죽고 살고를 반복합니다. 로그를 보면 이유가 적혀 있습니다.
//   반대로 '켜지긴 했는데 안 되는' 서버는 PM2 도 정상으로 봅니다.
