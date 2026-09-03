// ============================================================
// 개념 05 — 토큰을 어디에 두나
// ============================================================
//
// 개념04 에서 토큰을 발급했습니다. 그런데 두 가지가 남았습니다.
//
//   ① 브라우저가 그 토큰을 **어디에 보관하나**
//   ② 로그아웃은 어떻게 하나
//      (개념03 의 1번에서 "준 토큰은 되돌릴 수 없다" 고 했습니다)
//
// 둘이 이어져 있습니다. 같이 봅니다.
//
// 실행: node 개념05_토큰을_어디에_두나.js
//       끄려면 Ctrl + C
// ============================================================

const express = require("express");
const { DatabaseSync } = require("node:sqlite");

const { 만들기, 맞나, 시간만쓰기 } = require("./비밀번호");
const { 발급, 확인 } = require("./토큰");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// 개념04 와 같습니다. 시각을 고정해서 시험할 수 있게 만듭니다.
const 지금 = () => Number(process.env.지금시각) || new Date("2026-08-27T10:00:00Z").getTime();

const 십오분 = 15 * 60;
const 이주 = 14 * 24 * 60 * 60;


// ============================================================
// 1. 브라우저는 토큰을 어디에 두나
// ============================================================
//
// 두 곳이 있습니다. **둘 다 완벽하지 않습니다.**
//
// ── A. localStorage ──
//
//   localStorage.setItem("토큰", 받은것);
//   fetch("/me", { headers: { Authorization: `Bearer ${localStorage.getItem("토큰")}` } });
//
//   쉽습니다. 그리고 JS 자료 15단원에서 이미 써 봤습니다.
//
//   ★ 문제: JavaScript 가 읽을 수 있습니다.
//     내 페이지에서 남의 스크립트가 한 줄이라도 돌면 토큰을 통째로 가져갑니다.
//     이걸 XSS 라고 합니다. 광고 스크립트, npm 패키지 하나가 문을 엽니다.
//
// ── B. httpOnly 쿠키 ──
//
//   서버가 Set-Cookie 로 내려 주고, 브라우저가 알아서 다시 보냅니다.
//   httpOnly 를 붙이면 **JavaScript 가 못 읽습니다.** XSS 로도 못 가져갑니다.
//
//   ★ 문제: 브라우저가 **알아서** 보냅니다.
//     남의 사이트에 있는 폼이 내 서버로 요청을 보내도 쿠키가 딸려 갑니다.
//     사용자는 버튼 하나 눌렀을 뿐인데 내 서버에서는 로그인된 요청으로 보입니다.
//     이걸 CSRF 라고 합니다.
//
// ★★ 정리하면 이렇습니다.
//
//   localStorage    XSS 에 약함        CSRF 는 없음 (자동으로 안 보내니까)
//   httpOnly 쿠키   XSS 에 강함        CSRF 를 따로 막아야 함
//
//   CSRF 는 `SameSite` 로 거의 막힙니다. XSS 로 새는 것은 못 되돌립니다.
//   그래서 **쿠키 쪽을 고릅니다.** "막을 수 있는 문제" 를 고르는 것입니다.
//
// ★ 이 자료는 두 가지를 섞어 씁니다. 3번에서 왜 그런지 봅니다.


// ============================================================
// 2. 쿠키 옵션 — 셋 다 있어야 합니다
// ============================================================
//
//   res.cookie("refresh", 값, {   ← 이름은 영어로. 쿠키도 헤더입니다
//     httpOnly: true,       JS 가 못 읽습니다        ← XSS 방어
//     secure: true,         https 에서만 보냅니다     ← 엿듣기 방어
//     sameSite: "strict",   남의 사이트에서 온 요청에는 안 붙습니다  ← CSRF 방어
//     maxAge: ...,          언제까지 두나
//     path: "/refresh",     이 주소에만 보냅니다
//   });
//
// ★ 하나라도 빠지면 그 구멍이 그대로 열립니다.
//   httpOnly 없이 쓰면 쿠키를 쓰는 의미가 거의 없습니다.
//
// ★ secure: true 는 http 에서 **쿠키가 아예 안 심어집니다.**
//   개발할 때 "로그인이 안 돼요" 의 절반이 이것입니다.
//   그렇다고 지우면 안 됩니다. 개발에서만 끄고, 배포에서는 켭니다.
//   07단원에서 HTTPS 를 붙였으니 배포판에서는 문제없습니다.
//
//   const 배포인가 = process.env.NODE_ENV === "production";
//   secure: 배포인가
//
// ★ sameSite
//   strict  남의 사이트에서 온 것에는 절대 안 붙습니다. 제일 안전합니다.
//           대신 메일 링크로 들어와도 로그인이 풀린 것처럼 보입니다.
//   lax     보통 클릭(GET)에는 붙고, 폼 전송(POST)에는 안 붙습니다. 요즘 기본값입니다.
//   none    다 붙습니다. secure 없이는 못 씁니다. 다른 도메인 프론트일 때만 씁니다.
//
//   ★★ 10단원에서 프론트를 S3 에, 서버를 EC2 에 따로 올렸습니다.
//     도메인이 다르면 sameSite: "none" 이 필요하고, CORS 도 credentials 를 켜야 합니다.
//     **그래서 프론트와 API 를 같은 도메인에 두는 편이 훨씬 편합니다.**
//     `www.example.com` 과 `api.example.com` 은 같은 사이트로 봅니다.


// ============================================================
// 3. 짧은 것과 긴 것을 나눕니다
// ============================================================
//
// 토큰 하나로 다 하려면 이 둘 사이에서 골라야 합니다.
//
//   짧게 하면   자주 다시 로그인해야 합니다. 사람이 짜증 냅니다.
//   길게 하면   새어 나갔을 때 그만큼 오래 뚫립니다.
//
// 그래서 둘로 나눕니다.
//
//   액세스 토큰    15분    요청마다 보냄. 짧으니 새도 15분입니다.
//   리프레시 토큰  2주     액세스를 새로 받을 때만 씀. 서버가 무효화할 수 있습니다.
//
// ★ 리프레시는 **DB 에 적어 둡니다.**
//   개념03 의 1번에서 "토큰은 서버가 기억 안 해서 되돌릴 수 없다" 고 했습니다.
//   그 단점을 여기서 갚습니다. 자주 쓰는 액세스는 기억 안 하고,
//   가끔 쓰는 리프레시만 기억합니다. 둘의 좋은 점만 가져옵니다.
//
// ★ 두는 곳도 다릅니다.
//   액세스   메모리(변수). 새로고침하면 사라져도 리프레시로 다시 받으면 됩니다.
//            ★ localStorage 에 두지 마세요. 1번의 XSS 이야기 그대로입니다.
//   리프레시 httpOnly 쿠키. JS 가 건드릴 일이 없습니다.


const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE 사용자 (
    id       INTEGER PRIMARY KEY,
    아이디   TEXT    NOT NULL UNIQUE,
    비밀번호 TEXT    NOT NULL,
    역할     TEXT    NOT NULL DEFAULT 'user'
  ) STRICT;

  CREATE TABLE 리프레시 (
    jti      TEXT    PRIMARY KEY,
    사용자id INTEGER NOT NULL REFERENCES 사용자(id),
    살았나   INTEGER NOT NULL DEFAULT 1
  ) STRICT;
`);

db.prepare("INSERT INTO 사용자 (아이디, 비밀번호, 역할) VALUES (?, ?, ?)")
  .run("kim", 만들기("abcd1234"), "user");

const 아이디로찾기 = db.prepare("SELECT * FROM 사용자 WHERE 아이디 = ?");
const id로찾기 = db.prepare("SELECT id, 아이디, 역할 FROM 사용자 WHERE id = ?");
const 적어두기 = db.prepare("INSERT INTO 리프레시 (jti, 사용자id) VALUES (?, ?)");
const jti찾기 = db.prepare("SELECT * FROM 리프레시 WHERE jti = ?");
const 죽이기 = db.prepare("UPDATE 리프레시 SET 살았나 = 0 WHERE jti = ?");
const 다죽이기 = db.prepare("UPDATE 리프레시 SET 살았나 = 0 WHERE 사용자id = ?");


// ★ 진짜 서버는 crypto.randomUUID() 를 씁니다.
//   여기서는 시각을 고정한 것과 같은 이유로 순번을 씁니다.
//   그래야 아래 `// 확인:` 에 토큰을 적어 둘 수 있습니다.
let 순번 = 0;
const 새jti = () => `r${(순번 += 1)}`;


function HttpError(코드, 메시지) {
  const 에러 = new Error(메시지);
  에러.status = 코드;
  return 에러;
}


function 두개발급(사람, res) {
  const 액세스 = 발급(
    { sub: 사람.id, 아이디: 사람.아이디, 역할: 사람.역할, typ: "access" },
    지금(),
    십오분
  );

  const jti = 새jti();
  적어두기.run(jti, 사람.id);

  const 리프레시 = 발급({ sub: 사람.id, typ: "refresh", jti }, 지금(), 이주);

  // ★ 리프레시는 쿠키로만 내려보냅니다. 응답 본문에 넣지 않습니다.
  //   본문에 넣으면 프론트 JS 가 읽을 수 있게 되어, httpOnly 로 한 의미가 없어집니다.
  // ★ 쿠키 이름은 반드시 영어입니다. 한글로 쓰면 `argument name is invalid` 로
  //   500 이 납니다. 쿠키도 결국 헤더라서 그렇습니다.
  //   (백엔드 05단원 개념02 의 그 이야기입니다. 실제로 이 자료를 만들 때도 났습니다)
  res.cookie("refresh", 리프레시, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/refresh",
    maxAge: 이주 * 1000,
  });

  return 액세스;
}


// ============================================================
// 4. 로그인
// ============================================================

app.post("/login", (req, res) => {
  const { 아이디, 비밀번호 } = req.body ?? {};

  if (typeof 아이디 !== "string" || typeof 비밀번호 !== "string") {
    throw HttpError(400, "아이디와 비밀번호가 필요합니다");
  }

  const 사람 = 아이디로찾기.get(아이디);

  if (!사람) {
    시간만쓰기(비밀번호);
    throw HttpError(401, "아이디 또는 비밀번호가 올바르지 않습니다");
  }
  if (!맞나(비밀번호, 사람.비밀번호)) {
    throw HttpError(401, "아이디 또는 비밀번호가 올바르지 않습니다");
  }

  res.json({ data: { 액세스: 두개발급(사람, res) } });
});

// 확인: POST /login {"아이디":"kim","비밀번호":"abcd1234"}
// 응답: 200 {"data":{"액세스":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJ0eXAiOiJhY2Nlc3MiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyNTcwMH0.KQTXN_WfERD3T6OETZGqPxMAnL30Ve8o-Isr-zoyChk"}}

// ★ 응답 본문에 리프레시가 없습니다. 쿠키로 갔습니다.
//   브라우저 개발자도구 → Application → Cookies 에서 볼 수 있습니다.
//   거기서 HttpOnly 칸에 체크가 되어 있으면 제대로 붙은 것입니다.


// ============================================================
// 5. 액세스 토큰 확인 — 종류도 봅니다
// ============================================================

function 인증(req, res, next) {
  const 헤더값 = req.get("Authorization");

  if (!헤더값) throw HttpError(401, "로그인이 필요합니다");

  const [방식, 토큰] = 헤더값.split(" ");

  if (방식 !== "Bearer" || !토큰) throw HttpError(401, "Authorization 형식이 올바르지 않습니다");

  const 결과 = 확인(토큰, 지금());

  if (!결과.된것) throw HttpError(401, 결과.이유);

  // ★★ 종류를 확인해야 합니다.
  //   리프레시 토큰도 우리가 서명한 것이라 서명 검사는 통과합니다.
  //   `typ` 을 안 보면, 2주짜리 리프레시를 액세스처럼 써도 통과합니다.
  //   15분으로 짧게 만든 노력이 통째로 없어집니다.
  if (결과.내용.typ !== "access") throw HttpError(401, "액세스 토큰이 아닙니다");

  const 사람 = id로찾기.get(결과.내용.sub);

  if (!사람) throw HttpError(401, "없는 사용자입니다");

  req.user = 사람;
  next();
}

app.get("/me", 인증, (req, res) => {
  res.json({ data: req.user });
});

// 확인: GET /me [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJ0eXAiOiJhY2Nlc3MiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyNTcwMH0.KQTXN_WfERD3T6OETZGqPxMAnL30Ve8o-Isr-zoyChk]
// 응답: 200 {"data":{"id":1,"아이디":"kim","역할":"user"}}

// ★ 리프레시 토큰을 액세스 자리에 넣어 봅니다.
// 확인: GET /me [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cCI6InJlZnJlc2giLCJqdGkiOiJyMSIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg5MDM0NDAwfQ.o1fe1cx01vtaKhkOKEYeGR5hKFSk-zKD0GCfrlu93kw]
// 응답: 401 {"error":"액세스 토큰이 아닙니다"}

// ★ 서명은 멀쩡합니다. 우리가 만든 토큰이니까요. 종류를 봤기 때문에 걸립니다.


// ============================================================
// 6. 갱신 — 회전시킵니다
// ============================================================
//
// 리프레시로 새 액세스를 받습니다. 그때 **리프레시도 새로 줍니다.**
// 쓴 것은 바로 죽입니다. 이걸 회전(rotation) 이라고 합니다.
//
// ★ 왜 회전시키나
//   리프레시가 새어 나갔다고 해 봅시다. 회전을 안 하면 2주 동안 계속 쓸 수 있습니다.
//   회전시키면 훔친 쪽과 원래 주인 중 **한 명만** 다음 갱신에 성공합니다.
//   진 쪽이 죽은 토큰을 들고 오게 되고, 그때 우리가 알아챕니다.

app.post("/refresh", (req, res) => {
  // 쿠키에서 꺼냅니다. 시험을 위해 헤더로도 받습니다.
  const 토큰 = 쿠키에서(req, "refresh") || (req.get("X-Refresh") ?? "");

  const 결과 = 확인(토큰, 지금());

  if (!결과.된것) throw HttpError(401, 결과.이유);
  if (결과.내용.typ !== "refresh") throw HttpError(401, "리프레시 토큰이 아닙니다");

  const 적힌것 = jti찾기.get(결과.내용.jti);

  if (!적힌것) throw HttpError(401, "모르는 토큰입니다");

  if (!적힌것.살았나) {
    // ★★ 여기가 핵심입니다.
    //   이미 쓴 리프레시가 또 왔습니다. 둘 중 하나입니다.
    //     · 누가 훔쳐서 쓰고 있다
    //     · 정상 사용자가 갱신 응답을 못 받고 다시 보냈다
    //   구분할 방법이 없습니다. 그래서 **안전한 쪽으로** 갑니다.
    //   그 사람의 리프레시를 전부 죽입니다. 다시 로그인하게 만듭니다.
    다죽이기.run(적힌것.사용자id);
    throw HttpError(401, "다시 로그인해 주세요");
  }

  죽이기.run(결과.내용.jti);

  const 사람 = id로찾기.get(적힌것.사용자id);

  if (!사람) throw HttpError(401, "없는 사용자입니다");

  res.json({ data: { 액세스: 두개발급(사람, res) } });
});

function 쿠키에서(req, 이름) {
  // ★ 보통은 `cookie-parser` 를 씁니다. 여기서는 의존성을 안 늘리려고 직접 읽습니다.
  const 줄 = req.get("Cookie");

  if (!줄) return null;

  for (const 조각 of 줄.split(";")) {
    const 자리 = 조각.indexOf("=");
    if (자리 === -1) continue;
    if (decodeURIComponent(조각.slice(0, 자리).trim()) === 이름) {
      return decodeURIComponent(조각.slice(자리 + 1).trim());
    }
  }
  return null;
}

// 확인: POST /refresh [X-Refresh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cCI6InJlZnJlc2giLCJqdGkiOiJyMSIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg5MDM0NDAwfQ.o1fe1cx01vtaKhkOKEYeGR5hKFSk-zKD0GCfrlu93kw]
// 응답: 200 {"data":{"액세스":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJ0eXAiOiJhY2Nlc3MiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyNTcwMH0.KQTXN_WfERD3T6OETZGqPxMAnL30Ve8o-Isr-zoyChk"}}

// ★ 같은 리프레시를 한 번 더 보냅니다. 방금 회전으로 죽었습니다.
// 확인: POST /refresh [X-Refresh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cCI6InJlZnJlc2giLCJqdGkiOiJyMSIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg5MDM0NDAwfQ.o1fe1cx01vtaKhkOKEYeGR5hKFSk-zKD0GCfrlu93kw]
// 응답: 401 {"error":"다시 로그인해 주세요"}

// ★ 그리고 방금 받은 새 리프레시(r2)도 같이 죽었습니다. 전부 죽였으니까요.
// 확인: POST /refresh [X-Refresh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cCI6InJlZnJlc2giLCJqdGkiOiJyMiIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg5MDM0NDAwfQ.Ivuh2c7EjvfI6MuzNwK3seBNOY_bf1vxxQTZbiGVLnU]
// 응답: 401 {"error":"다시 로그인해 주세요"}

// ★ X-Refresh 헤더는 **자료에서 시험하려고** 열어 둔 것입니다.
//   진짜 서버에는 두지 마세요. 쿠키로만 받아야 httpOnly 가 의미를 갖습니다.


// ============================================================
// 7. 로그아웃
// ============================================================
//
// ★ 액세스 토큰은 못 죽입니다. 서버가 기억을 안 하니까요.
//   그래서 로그아웃은 이 두 가지입니다.
//
//     ① 리프레시를 죽인다        → 15분 뒤부터는 확실히 못 들어옵니다
//     ② 브라우저 쿠키를 지운다    → 갱신을 시도조차 못 합니다
//
//   남는 구멍은 **최대 15분** 입니다. 액세스를 짧게 잡은 이유가 이것입니다.
//
// ★★ "완전한 로그아웃" 이 필요하면 액세스도 매번 DB 에서 확인해야 합니다.
//   그러면 개념03 의 방법 A(세션) 로 돌아간 것입니다.
//   은행처럼 그게 필요한 곳은 실제로 그렇게 만듭니다.

app.post("/logout", (req, res) => {
  const 토큰 = 쿠키에서(req, "refresh") || (req.get("X-Refresh") ?? "");
  const 결과 = 확인(토큰, 지금());

  // ★ 로그아웃은 실패해도 200 을 줍니다.
  //   이미 만료된 토큰으로 로그아웃을 눌렀다고 에러를 내면
  //   사용자는 로그아웃이 안 된 줄 알고 계속 누릅니다.
  //   "결과가 같으면 성공으로 친다" 는 쪽이 맞습니다.
  if (결과.된것 && 결과.내용.typ === "refresh") 죽이기.run(결과.내용.jti);

  res.clearCookie("refresh", { path: "/refresh" });
  res.json({ data: { 로그아웃: true } });
});

// 확인: POST /logout
// 응답: 200 {"data":{"로그아웃":true}}


// ============================================================
// 8. 프론트는 어떻게 쓰나
// ============================================================
//
// React자료 09단원에서 fetch 를 감싼 함수를 만들었습니다. 거기에 한 겹 더 붙입니다.
//
//   let 액세스 = null;      // ★ 변수에 둡니다. localStorage 가 아닙니다
//
//   async function 부르기(주소, 옵션 = {}) {
//     const 보내기 = () =>
//       fetch(주소, {
//         ...옵션,
//         credentials: "include",              // 쿠키를 같이 보냅니다
//         headers: { ...옵션.headers, Authorization: `Bearer ${액세스}` },
//       });
//
//     let 응답 = await 보내기();
//
//     // 401 이면 한 번만 갱신해 보고 다시 시도합니다
//     if (응답.status === 401) {
//       const 갱신 = await fetch("/refresh", { method: "POST", credentials: "include" });
//
//       if (!갱신.ok) {
//         액세스 = null;
//         location.href = "/login";            // 갱신도 안 되면 로그인 화면으로
//         return 갱신;
//       }
//
//       액세스 = (await 갱신.json()).data.액세스;
//       응답 = await 보내기();
//     }
//
//     return 응답;
//   }
//
// ★ **한 번만** 다시 시도합니다.
//   갱신하고 또 401 이 오면 다시 갱신하는 식으로 두면 무한 반복이 됩니다.
//   서버가 잠깐 이상할 때 브라우저가 요청을 쏟아붓습니다.
//
// ★ 화면 여러 곳에서 동시에 401 이 나면 갱신이 여러 번 나갑니다.
//   그러면 회전 때문에 서로의 리프레시를 죽여서 로그아웃됩니다.
//   "갱신 중이면 그 약속을 같이 기다린다" 로 묶으세요.
//
//     let 갱신중 = null;
//     if (!갱신중) 갱신중 = fetch("/refresh", ...).finally(() => { 갱신중 = null; });
//     await 갱신중;
//
//   ★★ 회전을 안 넣었으면 안 겪었을 문제입니다.
//     안전한 쪽을 고르면 이런 일이 딸려 옵니다. 공짜인 선택은 없습니다.


app.use((err, req, res, next) => {
  const 코드 = err.status || 500;

  if (코드 === 500) {
    console.error(err);
    return res.status(500).json({ error: "서버 오류" });
  }

  res.status(코드).json({ error: err.message });
});


// ============================================================
// 9. 정리 — 이 단원 전체
// ============================================================
//
//   비밀번호는 저장하지 않습니다        소금 + 느린 해시 (개념01)
//   실패는 한 가지로 대답합니다          누가 가입했는지 새면 안 됩니다 (개념02)
//   토큰은 서명해서 줍니다               고치면 걸립니다 (개념03)
//   토큰은 누구나 읽습니다               비밀을 넣지 않습니다 (개념03)
//   401 과 403 을 나눕니다               그리고 내 것이 맞나도 봅니다 (개념04)
//   액세스는 짧게, 리프레시는 길게        새는 시간과 불편함의 절충 (개념05)
//   리프레시만 DB 에 적습니다             그래야 로그아웃이 됩니다 (개념05)
//   HTTPS 없이는 전부 소용없습니다        07단원 개념04
//
// ★ 마지막으로 하나만 더.
//   여기서 만든 것은 **직접 만든 로그인** 입니다. 구조를 알려고 만들었습니다.
//   진짜 서비스에서는 검증된 것을 쓰는 쪽이 낫습니다.
//     · `jsonwebtoken` + `argon2` 처럼 검증된 라이브러리
//     · 05단원의 Supabase Auth 같은 완성품
//     · 구글·카카오 로그인(OAuth) — 비밀번호를 아예 안 받습니다
//
//   ★★ 그래도 이 단원을 한 이유는, **고르려면 알아야** 하기 때문입니다.
//     Supabase Auth 설명서에 나오는 access token, refresh token,
//     JWT secret, RLS 가 전부 방금 만든 것입니다.


app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
