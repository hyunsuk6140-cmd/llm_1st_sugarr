// ============================================================
// 11단원 연습문제 정답 — 로그인과 인증
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE 사용자 (
    id       INTEGER PRIMARY KEY,
    아이디   TEXT    NOT NULL UNIQUE,
    비밀번호 TEXT    NOT NULL,
    역할     TEXT    NOT NULL DEFAULT 'user'
  ) STRICT;

  CREATE TABLE 메모 (
    id     INTEGER PRIMARY KEY,
    내용   TEXT    NOT NULL,
    주인id INTEGER NOT NULL REFERENCES 사용자(id)
  ) STRICT;
`);

const 열시 = new Date("2026-08-27T10:00:00Z").getTime();
const 비밀키 = "연습용-비밀키";


// ───── 문제 1 ─────

function 같은가(비밀번호) {
  const 한번 = crypto.createHash("sha256").update(비밀번호).digest("hex");
  const 두번 = crypto.createHash("sha256").update(비밀번호).digest("hex");
  return 한번 === 두번;
}

console.log("두 번 해시한 결과가 같은가:", 같은가("abcd1234"));
// 출력: 두 번 해시한 결과가 같은가: true

// ★ 해시가 **언제나 같은 값을 준다** 는 것이 로그인의 출발점입니다.
//   저장해 둔 값과 지금 계산한 값을 비교할 수 있는 이유가 이것입니다.
//   그런데 바로 이 성질 때문에 소금이 필요해집니다. 문제 2 로 갑니다.


// ───── 문제 2 ─────

function 소금붙여해시(비밀번호, 소금) {
  return crypto.createHash("sha256").update(소금 + 비밀번호).digest("hex");
}

console.log("소금이 다르면 결과도 다른가:", 소금붙여해시("abcd1234", "소금A") !== 소금붙여해시("abcd1234", "소금B"));
// 출력: 소금이 다르면 결과도 다른가: true

// ★ 소금을 붙이는 순서(소금+비밀번호 vs 비밀번호+소금)는 상관없습니다.
//   **사람마다 다른 값을 섞는다** 는 것만 지키면 됩니다.


// ───── 문제 3 ─────

function 만들기(비밀번호) {
  const 소금 = crypto.randomBytes(16).toString("hex");
  const 섞은것 = crypto.scryptSync(비밀번호, 소금, 64).toString("hex");
  return `scrypt$${소금}$${섞은것}`;
}

const 만든것 = 만들기("abcd1234");

console.log("칸 개수:", 만든것.split("$").length);
// 출력: 칸 개수: 3
console.log("방식 이름:", 만든것.split("$")[0]);
// 출력: 방식 이름: scrypt
console.log("두 번 만들면 같은가:", 만들기("abcd1234") === 만들기("abcd1234"));
// 출력: 두 번 만들면 같은가: false

// ★ 방식 이름을 왜 적어 두나
//   나중에 scrypt 에서 argon2 로 옮길 때, 어떤 방식으로 만든 값인지 알아야
//   섞어서 처리할 수 있습니다. 옛 값은 옛 방식으로 확인하고,
//   그 사람이 다음에 로그인할 때 조용히 새 방식으로 다시 저장하면 됩니다.
//   방식 이름이 없으면 전원 비밀번호 재설정 말고는 방법이 없습니다.


// ───── 문제 4 ─────

function 맞나(비밀번호, 저장된것) {
  if (typeof 저장된것 !== "string") return false;

  const 칸들 = 저장된것.split("$");

  // ★ 여기서 걸러야 합니다. 아래 timingSafeEqual 은 길이가 다르면 **에러를 냅니다.**
  //   그냥 두면 이상한 값이 들어왔을 때 서버가 500 을 냅니다.
  //   그리고 그 500 자체가 "저장 모양이 깨진 계정" 을 알려 주는 신호가 됩니다.
  if (칸들.length !== 3) return false;

  const [방식, 소금, 섞은것] = 칸들;

  if (방식 !== "scrypt") return false;
  if (섞은것.length !== 128) return false;

  const 다시섞은것 = crypto.scryptSync(비밀번호, 소금, 64).toString("hex");

  return crypto.timingSafeEqual(Buffer.from(다시섞은것, "hex"), Buffer.from(섞은것, "hex"));
}

console.log("맞는 비밀번호:", 맞나("abcd1234", 만든것));
// 출력: 맞는 비밀번호: true
console.log("틀린 비밀번호:", 맞나("zzzz9999", 만든것));
// 출력: 틀린 비밀번호: false
console.log("저장값이 깨졌을 때:", 맞나("abcd1234", "이상한값"));
// 출력: 저장값이 깨졌을 때: false

// ★ 128 은 64바이트를 hex 로 적었을 때의 글자 수입니다.
//   길이를 먼저 확인해 두면 timingSafeEqual 이 에러를 낼 일이 없습니다.


// ───── 문제 5 ─────

function 담기(객체) {
  return Buffer.from(JSON.stringify(객체)).toString("base64url");
}

function 풀기(글자) {
  return JSON.parse(Buffer.from(글자, "base64url").toString());
}

console.log("담았다 푼 것:", 풀기(담기({ sub: 1, 역할: "user" })));
// 출력: 담았다 푼 것: { sub: 1, '역할': 'user' }
console.log("담은 것에 = 나 + 가 있나:", /[=+/]/.test(담기({ sub: 1, 역할: "user" })));
// 출력: 담은 것에 = 나 + 가 있나: false

// ★ base64 였다면 `=` 로 끝나는 경우가 생깁니다.
//   `=` 는 쿼리스트링에서 이름과 값을 가르는 글자라 주소에 넣으면 깨집니다.
//   `+` 는 공백으로 해석되는 곳이 있습니다.
//   base64url 은 그래서 만들어진 것입니다. Node 가 그냥 해 줍니다.


// ───── 문제 6 ─────

function 서명하기(앞부분) {
  return crypto.createHmac("sha256", 비밀키).update(앞부분).digest("base64url");
}

function 발급(내용, 지금, 살시간초) {
  const 머리 = { alg: "HS256", typ: "JWT" };
  const 몸 = {
    ...내용,
    // ★ 1000 으로 나눕니다. JWT 의 시각은 초 단위입니다.
    iat: Math.floor(지금 / 1000),
    exp: Math.floor(지금 / 1000) + 살시간초,
  };

  const 앞부분 = `${담기(머리)}.${담기(몸)}`;

  return `${앞부분}.${서명하기(앞부분)}`;
}

const 토큰 = 발급({ sub: 1, 아이디: "kim" }, 열시, 15 * 60);
const 몸 = 풀기(토큰.split(".")[1]);

console.log("칸 개수:", 토큰.split(".").length);
// 출력: 칸 개수: 3
console.log("exp - iat:", 몸.exp - 몸.iat);
// 출력: exp - iat: 900

// ★ 900 이 아니라 900000 이 나왔다면 1000 을 안 나눈 것입니다.
//   그러면 만료가 15분이 아니라 열흘이 넘습니다.


// ───── 문제 7 ─────

function 확인(토큰, 지금) {
  if (typeof 토큰 !== "string") return { 된것: false, 이유: "토큰 모양이 아닙니다" };

  const 칸들 = 토큰.split(".");

  if (칸들.length !== 3) return { 된것: false, 이유: "토큰 모양이 아닙니다" };

  const [머리부분, 몸부분, 서명부분] = 칸들;

  // ── ① 서명부터 ──
  const 제대로된서명 = 서명하기(`${머리부분}.${몸부분}`);

  if (서명부분.length !== 제대로된서명.length) {
    return { 된것: false, 이유: "서명이 맞지 않습니다" };
  }
  if (!crypto.timingSafeEqual(Buffer.from(서명부분), Buffer.from(제대로된서명))) {
    return { 된것: false, 이유: "서명이 맞지 않습니다" };
  }

  // ── ② 내용은 서명을 통과한 뒤에 읽습니다 ──
  let 머리;
  let 몸읽은것;

  try {
    머리 = 풀기(머리부분);
    몸읽은것 = 풀기(몸부분);
  } catch {
    return { 된것: false, 이유: "토큰 모양이 아닙니다" };
  }

  // ── ③ alg 는 우리가 정합니다 ──
  if (머리.alg !== "HS256") return { 된것: false, 이유: "서명 방식이 다릅니다" };

  // ── ④ 만료 ──
  if (typeof 몸읽은것.exp !== "number") return { 된것: false, 이유: "만료되었습니다" };
  if (Math.floor(지금 / 1000) >= 몸읽은것.exp) return { 된것: false, 이유: "만료되었습니다" };

  return { 된것: true, 내용: 몸읽은것 };
}

console.log("제대로 된 토큰:", 확인(토큰, 열시).된것);
// 출력: 제대로 된 토큰: true
console.log("만료된 뒤:", 확인(토큰, 열시 + 16 * 60 * 1000).이유);
// 출력: 만료된 뒤: 만료되었습니다
console.log("칸이 두 개:", 확인("a.b", 열시).이유);
// 출력: 칸이 두 개: 토큰 모양이 아닙니다

// ★ exp 가 아예 없는 토큰도 막았습니다.
//   `Math.floor(지금/1000) >= undefined` 는 false 라서, 안 막으면 **영원히 통과** 합니다.
//   "만료가 없으면 무제한" 이 되는 것입니다. 없으면 거절하는 쪽이 맞습니다.


// ───── 문제 8 ─────

const [머리칸, 몸칸, 서명칸] = 토큰.split(".");
const 고친몸 = { ...풀기(몸칸), 역할: "admin" };
const 고친토큰 = `${머리칸}.${담기(고친몸)}.${서명칸}`;

console.log("고친 내용이 읽히나:", 풀기(고친토큰.split(".")[1]).역할);
// 출력: 고친 내용이 읽히나: admin
console.log("통과하나:", 확인(고친토큰, 열시).이유);
// 출력: 통과하나: 서명이 맞지 않습니다

// ★ 두 줄이 같이 있어야 이해가 됩니다.
//   **읽히기는 읽힙니다.** 막은 것은 고친 것을 서버가 받아 주는 것뿐입니다.
//   그래서 토큰에 비밀을 넣으면 안 됩니다.


// ───── 문제 9 ─────

const none토큰 = `${담기({ alg: "none", typ: "JWT" })}.${담기(고친몸)}.`;

console.log("alg none 토큰:", 확인(none토큰, 열시).이유);
// 출력: alg none 토큰: 서명이 맞지 않습니다

// ★ "서명 방식이 다릅니다" 가 아니라 "서명이 맞지 않습니다" 가 나왔습니다.
//   서명을 먼저 보기 때문입니다. alg 까지 가지도 않습니다.
//   ★★ 이게 순서를 지킨 덕입니다. alg 를 먼저 보고 "none 이면 검사 안 함" 으로
//     짜면 그대로 통과합니다. 실제 라이브러리들이 그렇게 뚫렸습니다.


// ───── 문제 10 ─────

db.prepare("INSERT INTO 사용자 (아이디, 비밀번호, 역할) VALUES (?, ?, ?)")
  .run("kim", 만들기("abcd1234"), "user");

const 아이디로찾기 = db.prepare("SELECT * FROM 사용자 WHERE 아이디 = ?");

// 없는 아이디일 때 시간을 맞추려고 버리는 값을 하나 만들어 둡니다.
const 버리는값 = 만들기(crypto.randomBytes(16).toString("hex"));

const 같은말 = "아이디 또는 비밀번호가 올바르지 않습니다";

function 로그인(아이디, 비밀번호) {
  const 사람 = 아이디로찾기.get(아이디);

  if (!사람) {
    // ★ 결과를 안 씁니다. **시간을 쓰는 것** 이 목적입니다.
    맞나(비밀번호, 버리는값);
    return { 된것: false, 이유: 같은말 };
  }

  if (!맞나(비밀번호, 사람.비밀번호)) {
    return { 된것: false, 이유: 같은말 };
  }

  // ★ 새 객체를 만듭니다. 사람 을 그대로 주면 비밀번호가 딸려 갑니다.
  return { 된것: true, 사람: { id: 사람.id, 아이디: 사람.아이디, 역할: 사람.역할 } };
}

console.log("없는 아이디:", 로그인("없는사람", "abcd1234").이유);
// 출력: 없는 아이디: 아이디 또는 비밀번호가 올바르지 않습니다
console.log("틀린 비밀번호:", 로그인("kim", "zzzz9999").이유);
// 출력: 틀린 비밀번호: 아이디 또는 비밀번호가 올바르지 않습니다
console.log("두 답이 같은가:", 로그인("없는사람", "abcd1234").이유 === 로그인("kim", "zzzz9999").이유);
// 출력: 두 답이 같은가: true
console.log("성공했을 때 비밀번호 칸이 있나:", "비밀번호" in 로그인("kim", "abcd1234").사람);
// 출력: 성공했을 때 비밀번호 칸이 있나: false

// ★ 메시지를 상수 하나로 뺀 이유
//   두 군데에 따로 적으면 나중에 한쪽만 고칩니다. 그러면 다시 갈라집니다.
//   "같아야 하는 것" 은 한 곳에 두세요.


// ───── 문제 11 ─────

function 가입(요청) {
  // ★ 필요한 것만 꺼냅니다. 요청 을 그대로 쓰지 않습니다.
  const { 아이디, 비밀번호 } = 요청;

  return db
    .prepare("INSERT INTO 사용자 (아이디, 비밀번호, 역할) VALUES (?, ?, 'user')")
    .run(아이디, 만들기(비밀번호));
}

가입({ 아이디: "hacker", 비밀번호: "abcd1234", 역할: "admin" });

console.log("넣으려 한 역할: admin");
// 출력: 넣으려 한 역할: admin
console.log("실제로 들어간 역할:", db.prepare("SELECT 역할 FROM 사용자 WHERE 아이디 = ?").get("hacker").역할);
// 출력: 실제로 들어간 역할: user

// ★ SQL 에 'user' 를 박아 두는 것도 방법입니다.
//   변수로 두면 언젠가 누가 그 변수에 요청 값을 넣습니다.
//   아예 넣을 자리를 안 만드는 편이 확실합니다.


// ───── 문제 12 ─────

function 액세스만(토큰, 지금) {
  const 결과 = 확인(토큰, 지금);

  if (!결과.된것) return 결과;

  // ★ 서명은 통과했습니다. 우리가 만든 토큰이니까요.
  //   그래서 **종류를 따로 봐야** 합니다.
  if (결과.내용.typ !== "access") return { 된것: false, 이유: "액세스 토큰이 아닙니다" };

  return 결과;
}

const 액세스 = 발급({ sub: 1, typ: "access" }, 열시, 15 * 60);
const 리프레시 = 발급({ sub: 1, typ: "refresh", jti: "r1" }, 열시, 14 * 24 * 60 * 60);

console.log("액세스 토큰:", 액세스만(액세스, 열시).된것);
// 출력: 액세스 토큰: true
console.log("리프레시 토큰:", 액세스만(리프레시, 열시).이유);
// 출력: 리프레시 토큰: 액세스 토큰이 아닙니다

// ★ typ 을 안 보면 2주짜리 리프레시가 액세스로 쓰입니다.
//   액세스를 15분으로 짧게 만든 것이 통째로 없어집니다.


// ───── 문제 13 ─────

// [준비] "남의 메모" 의 주인이 될 사람이 하나 있어야 합니다.
db.prepare("INSERT INTO 사용자 (id, 아이디, 비밀번호) VALUES (9, 'lee', 'scrypt$x$y')").run();

db.prepare("INSERT INTO 메모 (내용, 주인id) VALUES (?, ?)").run("kim 의 메모", 1);
db.prepare("INSERT INTO 메모 (내용, 주인id) VALUES (?, ?)").run("남의 메모", 9);

function 고칠수있나(메모id, 사람) {
  const 메모 = db.prepare("SELECT * FROM 메모 WHERE id = ?").get(메모id);

  if (!메모) return "없음";

  // ★ 이 한 줄이 IDOR 을 막습니다.
  //   로그인했나(인증)까지만 보고 **이 사람 것이 맞나** 를 안 보면
  //   주소의 숫자만 바꿔서 남의 것을 고칩니다.
  if (메모.주인id !== 사람.id && 사람.역할 !== "admin") return "거절";

  return "허용";
}

console.log("내 메모:", 고칠수있나(1, { id: 1, 역할: "user" }));
// 출력: 내 메모: 허용
console.log("남의 메모:", 고칠수있나(2, { id: 1, 역할: "user" }));
// 출력: 남의 메모: 거절
console.log("admin 이 남의 메모:", 고칠수있나(2, { id: 1, 역할: "admin" }));
// 출력: admin 이 남의 메모: 허용
console.log("없는 메모:", 고칠수있나(999, { id: 1, 역할: "user" }));
// 출력: 없는 메모: 없음

// ★ "없음" 과 "거절" 을 나눈 것에도 생각할 거리가 있습니다.
//   숨겨야 하는 자료라면 남의 것도 "없음" 으로 답하는 편이 낫습니다.
//   "거절" 은 곧 "그건 있다" 는 뜻이니까요. (개념04 의 6번)


// ───── 문제 14 ───── [도전]

db.exec(`
  CREATE TABLE 리프레시 (
    jti      TEXT    PRIMARY KEY,
    사용자id INTEGER NOT NULL,
    살았나   INTEGER NOT NULL DEFAULT 1
  ) STRICT;
`);

let 순번 = 0;

function 리프레시발급(사용자id) {
  // ★ 진짜 서버는 crypto.randomUUID() 를 씁니다.
  //   순번은 다음에 나올 값을 남이 알 수 있어서 위험합니다.
  //   여기서는 출력을 맞추려고 순번을 씁니다.
  const jti = `r${(순번 += 1)}`;

  db.prepare("INSERT INTO 리프레시 (jti, 사용자id) VALUES (?, ?)").run(jti, 사용자id);

  return 발급({ sub: 사용자id, typ: "refresh", jti }, 열시, 14 * 24 * 60 * 60);
}

function 갱신(리프레시토큰, 지금) {
  const 결과 = 확인(리프레시토큰, 지금);

  if (!결과.된것) return { 결과: "거절" };
  if (결과.내용.typ !== "refresh") return { 결과: "거절" };

  const 적힌것 = db.prepare("SELECT * FROM 리프레시 WHERE jti = ?").get(결과.내용.jti);

  if (!적힌것) return { 결과: "거절" };

  if (!적힌것.살았나) {
    // ★★ 이미 쓴 것이 또 왔습니다.
    //   훔친 쪽인지 원래 주인인지 구분할 방법이 없습니다.
    //   그래서 그 사람 것을 **전부** 죽이고 다시 로그인하게 만듭니다.
    db.prepare("UPDATE 리프레시 SET 살았나 = 0 WHERE 사용자id = ?").run(적힌것.사용자id);
    return { 결과: "거절" };
  }

  db.prepare("UPDATE 리프레시 SET 살았나 = 0 WHERE jti = ?").run(결과.내용.jti);

  return { 결과: "성공", 새토큰: 리프레시발급(적힌것.사용자id) };
}

const 첫토큰 = 리프레시발급(1);
const 첫갱신 = 갱신(첫토큰, 열시);

console.log("첫 갱신:", 첫갱신.결과);
// 출력: 첫 갱신: 성공

const 둘째갱신 = 갱신(첫갱신.새토큰, 열시);

console.log("새 토큰으로 갱신:", 둘째갱신.결과);
// 출력: 새 토큰으로 갱신: 성공
console.log("죽은 토큰 재사용:", 갱신(첫토큰, 열시).결과);
// 출력: 죽은 토큰 재사용: 거절
console.log("재사용 뒤 살아남은 토큰 수:", db.prepare("SELECT COUNT(*) AS 수 FROM 리프레시 WHERE 살았나 = 1").get().수);
// 출력: 재사용 뒤 살아남은 토큰 수: 0

// ★ 마지막 줄이 이 문제의 전부입니다.
//   훔친 쪽이 한 번 쓰는 순간, 원래 주인 것까지 같이 죽습니다.
//   주인은 다시 로그인해야 해서 불편합니다.
//   **불편한 쪽과 뚫리는 쪽 중에 불편한 쪽을 고른 것입니다.**
//
// ★ 죽은 줄을 계속 쌓아 두면 표가 커집니다.
//   만료 시각이 지난 줄은 지우는 작업을 하루에 한 번 돌리세요.

db.close();
