// ============================================================
// 01단원 연습문제 — 환경변수와 설정
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~7은 기본, 8~9는 응용, 10은 [도전] 입니다.
//
// [준비] 아래는 그대로 두세요.

const path = require("path");
const cp = require("child_process");

// ★ 진짜 process.env 를 건드리면 다음 문제에 영향이 갑니다.
//   그래서 시험용 객체를 따로 씁니다.
const 가짜env = {
  PORT: "4000",
  DEBUG: "false",
  CORS_ORIGINS: " http://a.com , http://b.com ,, ",
  EMPTY: "",
  ADMIN_KEY: "비밀키입니다",
  BAD_PORT: "삼천",
};


// ───── 문제 1 ───── (개념01, 기본)
// 환경변수는 **언제나 글자**입니다. 그것을 보이세요.
//
// 기대 출력:
// PORT 의 타입: string
// 그냥 더하면: 40001

// TODO


// ───── 문제 2 ───── (개념01, 기본)
// `Boolean("false")` 가 무엇인지 찍고, 왜 참거짓을 그렇게 읽으면 안 되는지 보이세요.
//
// 기대 출력:
// Boolean("false"): true
// 이렇게 읽으면 DEBUG 가 켜집니다: true

// TODO


// ───── 문제 3 ───── (개념01, 기본)
// 참거짓을 제대로 읽는 함수를 쓰세요.
//   "true" 또는 "1" 이면 true, 나머지는 false.
//   값이 아예 없거나 빈 글자면 기본값을 주세요.
//
// 기대 출력:
// DEBUG: false
// 없는 값 (기본값 true): true
// 빈 글자 (기본값 true): true

function 참거짓(env, 이름, 기본값) {
  // TODO
}

// console.log("DEBUG:", 참거짓(가짜env, "DEBUG", true));
// console.log("없는 값 (기본값 true):", 참거짓(가짜env, "NO_SUCH", true));
// console.log("빈 글자 (기본값 true):", 참거짓(가짜env, "EMPTY", true));


// ───── 문제 4 ───── (설정.js, 기본)
// 숫자를 읽는 함수를 쓰세요.
//   ★ 숫자가 아닌 값이 들어오면 **기본값으로 넘어가면 안 됩니다.**
//     그런 값이 있었다는 것을 `모자란것` 배열에 적으세요.
//
// 기대 출력:
// PORT: 4000 number
// 없는 값: 3000
// 숫자가 아닌 값: undefined
// 모아 둔 문제: ['BAD_PORT (숫자여야 하는데 "삼천")']

const 모자란것 = [];

function 숫자(env, 이름, 기본값) {
  // TODO
}

// console.log("PORT:", 숫자(가짜env, "PORT", 3000), typeof 숫자(가짜env, "PORT", 3000));
// console.log("없는 값:", 숫자(가짜env, "NO_SUCH", 3000));
// console.log("숫자가 아닌 값:", 숫자(가짜env, "BAD_PORT", undefined));
// console.log("모아 둔 문제:", 모자란것);


// ───── 문제 5 ───── (설정.js, 기본)
// 쉼표로 이어진 목록을 읽는 함수를 쓰세요.
// 앞뒤 공백을 지우고, 빈 조각은 버리세요.
//
// 기대 출력:
// 허용 출처: [ 'http://a.com', 'http://b.com' ]
// 개수: 2

function 목록(env, 이름, 기본값) {
  // TODO
}

// console.log("허용 출처:", 목록(가짜env, "CORS_ORIGINS", []));
// console.log("개수:", 목록(가짜env, "CORS_ORIGINS", []).length);


// ───── 문제 6 ───── (설정.js, 기본)
// 빈 글자(`KEY=`)를 '없는 것'으로 보는 이유를 코드로 보이세요.
// `EMPTY` 를 그냥 읽었을 때와, 빈 글자를 걸렀을 때를 나란히 찍으세요.
//
// 기대 출력:
// 그냥 읽으면: "" (길이 0)
// 빈 글자를 거르면: 기본값입니다

// TODO


// ───── 문제 7 ───── (개념03, 기본)
// 비밀을 가리는 함수를 쓰세요.
// 앞 두 글자만 남기고 나머지는 `*` 로 바꾸세요. 값이 없으면 "(없음)".
//
// 기대 출력:
// 가린 관리자키: 비밀****
// 값이 없을 때: (없음)

function 가리기(값) {
  // TODO
}

// console.log("가린 관리자키:", 가리기(가짜env.ADMIN_KEY));
// console.log("값이 없을 때:", 가리기(undefined));


// ───── 문제 8 ───── (개념02, 응용)
// `.env` 한 줄을 읽는 함수를 쓰세요.
//   · `#` 로 시작하는 줄과 빈 줄은 건너뜁니다 (null 을 주세요)
//   · `=` 뒤쪽에 `=` 가 또 있어도 값의 일부입니다
//   · 값 앞뒤의 큰따옴표는 벗겨 냅니다
//
// 기대 출력:
// 보통 줄: [ 'PORT', '4000' ]
// 주석 줄: null
// 빈 줄: null
// 값에 = 가 있는 줄: [ 'URL', 'postgres://u:p@h/db?a=1' ]
// 따옴표를 벗긴 줄: [ 'MSG', '안녕 하세요' ]

function 한줄읽기(줄) {
  // TODO
}

// console.log("보통 줄:", 한줄읽기("PORT=4000"));
// console.log("주석 줄:", 한줄읽기("# 이건 주석"));
// console.log("빈 줄:", 한줄읽기("   "));
// console.log("값에 = 가 있는 줄:", 한줄읽기("URL=postgres://u:p@h/db?a=1"));
// console.log("따옴표를 벗긴 줄:", 한줄읽기('MSG="안녕 하세요"'));


// ───── 문제 9 ───── (설정.js, 응용)
// 어떤 설정에 기본값을 줘도 되고 어떤 것은 안 되는지 판정하는 함수를 쓰세요.
// **비밀은 기본값을 주면 안 됩니다.** 이름에 KEY·SECRET·PASSWORD·TOKEN 이
// 들어가면 비밀로 봅니다.
//
// 기대 출력:
// PORT: 기본값 OK
// ADMIN_KEY: 기본값 금지
// DB_PASSWORD: 기본값 금지
// JWT_SECRET: 기본값 금지
// CORS_ORIGINS: 기본값 OK

function 기본값줘도되나(이름) {
  // TODO
}

// for (const 이름 of ["PORT", "ADMIN_KEY", "DB_PASSWORD", "JWT_SECRET", "CORS_ORIGINS"]) {
//   console.log(`${이름}: ${기본값줘도되나(이름) ? "기본값 OK" : "기본값 금지"}`);
// }


// ───── 문제 10 ───── (개념03, [도전])
// 이 폴더의 진짜 `설정.js` 를 자식 프로세스로 켜서,
// **모자란 설정이 있으면 진짜로 죽는지** 확인하세요.
//
// 힌트: 개념03 의 `켜보기()` 와 같은 방법입니다.
//       cp.spawnSync 에 env 를 넘기고, status 와 stderr 를 보세요.
//
// 기대 출력:
// ADMIN_KEY 없이: 죽음(1)
// 이유를 말해 주나: true
// ADMIN_KEY 주고: 삶(0)
// 이상한 PORT: 죽음(1)

function 켜보기(환경) {
  // TODO: 설정.js 를 require 해서 포트를 찍는 코드를 자식 프로세스로 돌리세요
}

// console.log("ADMIN_KEY 없이:", 켜보기({}).status === 1 ? "죽음(1)" : "삶(0)");
// console.log("이유를 말해 주나:", 켜보기({}).stderr.includes("ADMIN_KEY"));
// console.log("ADMIN_KEY 주고:", 켜보기({ ADMIN_KEY: "키" }).status === 1 ? "죽음(1)" : "삶(0)");
// console.log("이상한 PORT:", 켜보기({ ADMIN_KEY: "키", PORT: "삼천" }).status === 1 ? "죽음(1)" : "삶(0)");
