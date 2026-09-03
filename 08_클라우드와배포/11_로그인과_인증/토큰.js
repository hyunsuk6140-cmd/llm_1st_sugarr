// ============================================================
// 토큰.js — 개념03 에서 만드는 것을 모아 둔 것
// ------------------------------------------------------------
// 개념04·05 가 이 파일을 가져다 씁니다.
//
//   const { 발급, 확인 } = require("./토큰");
//
// ★ 진짜 서비스에서는 `jsonwebtoken` 같은 라이브러리를 씁니다.
//   여기서 직접 만드는 것은 **토큰이 마법이 아니라는 것을 보려고** 입니다.
//   안이 뭔지 알고 나면 라이브러리 설명서가 그냥 읽힙니다.
// ============================================================

const crypto = require("node:crypto");

// ★ 비밀키는 코드에 적지 않습니다. 01단원에서 배운 그대로입니다.
//   .env 에 넣고 환경변수로 읽습니다.
//   없으면 자료를 돌려 볼 수 있게 시험용 값을 씁니다.
const 비밀키 = process.env.JWT_SECRET || "자료용-시험키-진짜서버에서는-쓰지-마세요";

const 초 = 1000;


// base64url — 주소·헤더에 넣어도 안 깨지는 base64 입니다.
function 담기(객체) {
  return Buffer.from(JSON.stringify(객체)).toString("base64url");
}

function 풀기(글자) {
  return JSON.parse(Buffer.from(글자, "base64url").toString());
}

function 서명하기(앞부분) {
  return crypto.createHmac("sha256", 비밀키).update(앞부분).digest("base64url");
}


// 토큰을 만듭니다. `지금` 을 인자로 받는 이유는 개념03 의 5번에 있습니다.
function 발급(내용, 지금, 살시간초 = 60 * 60) {
  const 머리 = { alg: "HS256", typ: "JWT" };
  const 몸 = {
    ...내용,
    iat: Math.floor(지금 / 초),
    exp: Math.floor(지금 / 초) + 살시간초,
  };

  const 앞부분 = `${담기(머리)}.${담기(몸)}`;

  return `${앞부분}.${서명하기(앞부분)}`;
}


// 토큰을 확인합니다. 통과하면 { 된것: true, 내용 }, 아니면 { 된것: false, 이유 }.
//
// ★ 순서가 중요합니다. **서명을 먼저 보고, 그다음에 내용을 씁니다.**
//   순서를 바꾸면 위조된 토큰의 내용을 잠깐이라도 믿게 됩니다.
function 확인(토큰, 지금) {
  if (typeof 토큰 !== "string") return { 된것: false, 이유: "토큰이 없습니다" };

  const 칸들 = 토큰.split(".");

  if (칸들.length !== 3) return { 된것: false, 이유: "토큰 모양이 아닙니다" };

  const [머리부분, 몸부분, 서명부분] = 칸들;

  const 제대로된서명 = 서명하기(`${머리부분}.${몸부분}`);

  if (서명부분.length !== 제대로된서명.length) {
    return { 된것: false, 이유: "서명이 맞지 않습니다" };
  }

  const 같나 = crypto.timingSafeEqual(Buffer.from(서명부분), Buffer.from(제대로된서명));

  if (!같나) return { 된것: false, 이유: "서명이 맞지 않습니다" };

  let 머리;
  let 몸;

  try {
    머리 = 풀기(머리부분);
    몸 = 풀기(몸부분);
  } catch {
    return { 된것: false, 이유: "내용을 읽을 수 없습니다" };
  }

  // ★ 머리에 적힌 alg 를 믿고 쓰면 안 됩니다. 개념03 의 6번을 보세요.
  //   우리가 정한 것과 같은지 **확인만** 합니다.
  if (머리.alg !== "HS256") return { 된것: false, 이유: "서명 방식이 다릅니다" };

  if (typeof 몸.exp !== "number") return { 된것: false, 이유: "만료가 없습니다" };
  if (Math.floor(지금 / 초) >= 몸.exp) return { 된것: false, 이유: "만료되었습니다" };

  return { 된것: true, 내용: 몸 };
}


module.exports = { 발급, 확인, 담기, 풀기 };
