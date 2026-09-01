// ============================================================
// 04단원 · 개념 03 — 요청에서 값 꺼내기 (params · query · body · headers)
// ------------------------------------------------------------
// 실행: node 개념03_요청_읽기.js
//       끄려면 Ctrl + C
// ============================================================
//
// 클라이언트가 서버에 값을 보내는 길은 네 개뿐입니다.
//
//   ① 경로     /documents/12          →  req.params
//   ② 쿼리     /documents?type=표준    →  req.query
//   ③ 본문     POST 로 보낸 JSON       →  req.body
//   ④ 헤더     Content-Type 같은 것    →  req.headers
//
// 03단원에서는 ①②를 직접 잘라 냈고, ③을 조각으로 모았습니다.
// Express 는 넷 다 알아서 담아 줍니다. 꺼내 쓰기만 하면 됩니다.

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ── 섹션 1: 본문을 읽으려면 이 한 줄이 필요합니다 ──

// ★★ 이 줄이 없으면 req.body 가 영원히 undefined 입니다.
//   Express 를 처음 쓰는 사람의 1번 질문이 "왜 req.body 가 undefined 인가요?" 입니다.
//   답은 거의 항상 "이 줄을 안 썼다" 입니다.

app.use(express.json());

// 이 줄이 하는 일이 03단원 개념04 의 본문읽기 함수 전체입니다.
//
//   req.on("data", ...) 로 조각 모으기
//   req.on("end", ...) 에서 합치기
//   JSON.parse 로 객체 만들기
//   실패하면 400 내기
//
// 이 열댓 줄이 app.use(express.json()) 한 줄로 끝납니다.
//
// HTML 폼(<form>)으로 보낸 것도 받으려면 한 줄을 더 씁니다.
app.use(express.urlencoded({ extended: true }));

// ★ app.use 는 "모든 요청이 여기를 먼저 지나가게 하라" 는 뜻입니다.
//   이런 것을 미들웨어라고 부릅니다. 05단원에서 자세히 만듭니다.
//   지금은 "라우트보다 위에 적어야 한다" 만 기억하세요.
//   아래에 적으면 라우트가 먼저 실행되어 버려서 소용이 없습니다.

// ── 섹션 2: 경로에서 (req.params) ──

app.get("/documents/:id/logs/:logId", (req, res) => {
  res.json({
    params: req.params,
    id타입: typeof req.params.id,
  });
});

// 확인: GET /documents/12/logs/5
// 응답: 200 {"params":{"id":"12","logId":"5"},"id타입":"string"}

// 콜론을 붙인 것들이 전부 req.params 에 들어옵니다.
// 언제나 글자입니다. 개념02 에서 본 그대로입니다.

// ── 섹션 3: 쿼리에서 (req.query) ──

app.get("/documents", (req, res) => {
  const tags = [].concat(req.query.tag || []);

  res.json({ tags });
});

// 확인: GET /documents?type=표준&page=2
// 응답: 200 {"query":{"type":"표준","page":"2"},"page타입":"string"}

// 03단원의 이 코드가
//   const 주소 = new URL(req.url, `http://${req.headers.host}`);
//   const 종류 = 주소.searchParams.get("type");
// req.query.type 하나로 끝났습니다.
//
// ★ 한글이 잘 들어오는 것을 보세요. Express 가 되돌려 줍니다.
//   주소(라우트)에는 한글을 못 쓰지만, 값에는 얼마든지 쓸 수 있습니다.

// 확인: GET /documents
// 응답: 200 {"query":{},"page타입":"undefined"}

// ★ 쿼리가 하나도 없으면 req.query 는 빈 객체 {} 입니다. undefined 가 아닙니다.
//   그래서 req.query.page 를 바로 꺼내도 터지지 않습니다. undefined 가 나올 뿐입니다.

// 확인: GET /documents?tag=안전&tag=품질
// 응답: 200 {"query":{"tag":["안전","품질"]},"page타입":"undefined"}

// ★★ 같은 이름이 두 번 오면 값이 '배열' 이 됩니다.
//   글자 하나를 기대하고 쓴 코드가 여기서 깨집니다.
//
//     req.query.tag.toLowerCase()
//     → 하나만 오면 잘 됩니다
//     → 두 개 오면 배열이라 TypeError. 서버가 죽습니다
//
//   누군가 주소를 손으로 고쳐서 ?tag=a&tag=b 로 보내면 그걸로 끝입니다.
//   안전하게 쓰려면 이렇게 합니다.
//
//     const tag = Array.isArray(req.query.tag) ? req.query.tag[0] : req.query.tag;

// ── 섹션 4: 본문에서 (req.body) ──

app.post("/documents", (req, res) => {
  res.json({
    body: req.body,
    타입: typeof req.body,
  });
});

// 확인: POST /documents {"title":"작업표준서","count":3}
// 응답: 200 {"body":{"title":"작업표준서","count":3},"타입":"object"}

// ★ count 가 3 입니다. 따옴표가 없습니다.
//   본문(JSON)으로 온 것은 타입이 그대로 살아 있습니다.
//   숫자는 숫자로, true 는 true 로 들어옵니다.
//
//   경로·쿼리는 전부 글자, 본문은 타입이 살아 있음.
//   이 차이가 "왜 어떤 건 Number 를 해야 하고 어떤 건 안 해도 되나" 의 답입니다.

// ── 섹션 5: ★ 본문이 undefined 로 나오는 두 경우 ──

// 확인: POST /documents
// 응답: 200 {"타입":"undefined"}

// 본문을 아예 안 보내면 req.body 는 undefined 입니다.
// (JSON.stringify 는 undefined 인 속성을 아예 빼고 찍습니다. 그래서 body 가 안 보입니다)
//
// ★★ Express 4 에서는 이때 빈 객체 {} 였습니다. Express 5 에서 바뀌었습니다.
//   그래서 옛날 블로그를 보고 이렇게 쓰면 서버가 죽습니다.
//
//     const { title } = req.body;
//     → TypeError: Cannot destructure property 'title' of 'req.body' as it is undefined.
//
//   안전하게 쓰려면
//     const { title } = req.body || {};
//   또는 아예 없으면 400 을 내보내면 됩니다. 아래 섹션 7 에서 합니다.

// 확인: POST /documents form:name=hong&age=20
// 응답: 200 {"body":{"name":"hong","age":"20"},"타입":"object"}

// 이건 HTML 폼으로 보낸 경우입니다. express.urlencoded 가 받아 줍니다.
// age 가 "20" 으로 글자인 것을 보세요. 폼으로 온 것은 전부 글자입니다.
// JSON 과 다릅니다.
//
// ★★ 두 번째 경우가 진짜 함정입니다 — Content-Type 을 안 맞춘 경우.
//
//   Postman 에서 Body → raw 만 고르고 JSON 으로 안 바꾸면
//   Content-Type 이 text/plain 으로 나갑니다.
//   express.json() 은 "이건 내가 읽을 게 아니네" 하고 그냥 지나갑니다.
//   결과는 req.body 가 undefined.
//
//   본문을 분명히 보냈는데 undefined 라면 99% 이 문제입니다.
//   Postman 의 Body 탭에서 raw 오른쪽 드롭다운이 JSON 인지 확인하세요.

// ── 섹션 6: JSON 이 깨져서 오면 ──

// 확인: POST /documents {title:"따옴표없음"}
// 응답: 400

// 03단원에서는 이걸 직접 막았습니다.
//
//   try { 데이터 = JSON.parse(글자); }
//   catch { res.writeHead(400); ... }
//
// express.json() 이 대신 해 줍니다. 우리는 아무것도 안 썼는데 400 이 나왔습니다.
//
// ★ 다만 지금은 응답 '내용' 이 HTML 입니다. 브라우저로 보면 에러 화면이 나옵니다.
//   API 서버라면 JSON 으로 바꿔 줘야 합니다. 개념04 에서 합니다.

// ── 섹션 7: 값을 꺼낼 때의 정석 ──

app.post("/equipments", (req, res) => {
  // ① 본문이 아예 없을 수 있으니 || {} 로 받쳐 둡니다
  const { name, line } = req.body || {};

  // ② 필수 값을 확인합니다
  const 빠진것 = [];
  if (!name) 빠진것.push("name");
  if (!line) 빠진것.push("line");

  if (빠진것.length > 0) {
    return res
      .status(400)
      .json({ error: `${빠진것.join(", ")} 을(를) 넣어 주세요` });
  }

  // ③ 여기부터는 믿고 써도 됩니다
  res.status(201).json({ name, line });
});

// 확인: POST /equipments
// 응답: 400 {"error":"name, line 을(를) 넣어 주세요"}

// 확인: POST /equipments {"name":"용접로봇"}
// 응답: 400 {"error":"line 을(를) 넣어 주세요"}

// 확인: POST /equipments {"name":"용접로봇","line":"C"}
// 응답: 201 {"name":"용접로봇","line":"C"}

// ★ return res.status(...) 처럼 return 을 붙인 이유
//   Express 는 return 을 안 붙여도 다음 라우트로 안 넘어갑니다.
//   하지만 '이 함수 안의 아래 코드' 는 그대로 실행됩니다.
//   return 이 없으면 400 을 보낸 뒤에 201 까지 보내려다 에러가 납니다.
//     → Cannot set headers after they are sent to the client
//   응답 앞에는 습관처럼 return 을 붙이세요.
//
// ★ 구조 분해로 꺼낸 이유
//   req.body.name, req.body.line 을 매번 쓰면 길어집니다.
//   한 번 꺼내 두면 아래 코드가 짧아집니다. (JS자료 09단원)

// ── 섹션 8: 헤더에서 (req.headers / req.get) ──

app.get("/headers", (req, res) => {
  res.json({
    "req.get 은 대문자로 찾아도 됨": req.get("User-Agent") !== undefined,
    "req.headers 는 대문자로 못 찾음": req.headers["User-Agent"] !== undefined,
    "req.headers 는 소문자로 찾음": req.headers["user-agent"] !== undefined,
  });
});

// 확인: GET /headers
// 응답: 200 {"req.get 은 대문자로 찾아도 됨":true,"req.headers 는 대문자로 못 찾음":false,"req.headers 는 소문자로 찾음":true}

// 03단원에서 본 대소문자 문제입니다.
// req.headers 는 Node 그대로라 전부 소문자입니다.
// req.get(이름) 은 대소문자를 안 가립니다. 이쪽이 안전합니다.
//
// 자주 쓰는 헤더
//   req.get("Content-Type")     본문이 무슨 형식인가
//   req.get("Authorization")    로그인 증표 — PART 4 에서 씁니다
//   req.get("User-Agent")       어떤 프로그램이 보냈나

// ── 섹션 9: 어디에 담아야 하나 ──

app.get("/decide", (req, res) => {
  res.json({
    경로: "그것 하나를 콕 집는 값. /documents/12 의 12",
    쿼리: "있어도 되고 없어도 되는 값. 걸러 보기·정렬·쪽 번호",
    본문: "새로 만들거나 고칠 내용. 길고 구조가 있는 값",
    헤더: "내용이 아니라 '요청에 대한 정보'. 형식·인증",
  });
});

// 확인: GET /decide
// 응답: 200 {"경로":"그것 하나를 콕 집는 값. /documents/12 의 12","쿼리":"있어도 되고 없어도 되는 값. 걸러 보기·정렬·쪽 번호","본문":"새로 만들거나 고칠 내용. 길고 구조가 있는 값","헤더":"내용이 아니라 '요청에 대한 정보'. 형식·인증"}

// 헷갈릴 때 판단 기준
//
//   "이게 없으면 무슨 요청인지 알 수 없다"     → 경로
//   "없어도 요청은 성립한다"                   → 쿼리
//   "글자가 길다 / 구조가 있다 / 비밀스럽다"    → 본문
//
// 마지막이 중요합니다.
// 비밀번호를 쿼리에 담으면 안 됩니다. 주소는 서버 기록에 그대로 남습니다.
// 브라우저 기록에도 남고, 남에게 링크를 보낼 때 딸려 갑니다.

app.listen(PORT, () => {
  console.log(`서버가 켜졌습니다.  http://localhost:${PORT}/documents`);
});

// ============================================================
// 03단원과 나란히 놓고 보기
// ============================================================
//
//   하는 일            03단원 (http)                        Express
//   ────────────────────────────────────────────────────────────────
//   경로에서 값       split("/").filter(Boolean)[1]        req.params.id
//   쿼리에서 값       new URL(...).searchParams.get("q")   req.query.q
//   본문 읽기         Promise + on("data") + on("end")     req.body
//   JSON 로 바꾸기    JSON.parse + try/catch               자동
//   깨진 JSON         직접 400                             자동 400
//   폼 데이터         직접 파싱                            req.body
//
// 03단원의 서른 줄이 Express 에서는 세 줄입니다.
// 그런데 사라진 게 아니라 express.json() 안에 들어 있을 뿐입니다.
// 안에서 무슨 일이 벌어지는지 알기 때문에, 안 될 때 어디를 볼지 알 수 있습니다.

// ============================================================
// 직접 해 볼 것
// ============================================================
//
// ✏️ 직접 해보기 1 — 맨 위의 app.use(express.json()) 을 주석 처리하고
//                    POST /documents 를 보내 보세요. req.body 가 어떻게 되나요?
//                    (확인했으면 반드시 되돌리세요)
//
// ✏️ 직접 해보기 2 — app.use(express.json()) 을 맨 아래(listen 바로 위)로 옮겨 보세요.
//                    이번에는 어떻게 되나요? 왜 그럴까요?
//
// ✏️ 직접 해보기 3 — Postman 에서 Body → raw 를 고르되 JSON 으로 바꾸지 말고
//                    POST /documents 를 보내 보세요. 무엇이 나오나요?
//
// ✏️ 직접 해보기 4 — /documents 에 정렬을 추가해 보세요.
//                    ?sort=desc 면 { 정렬: "내림차순" } 을 돌려주고,
//                    없으면 { 정렬: "기본" } 을 돌려주게 하세요.
//
// ✏️ 직접 해보기 5 — /documents?tag=a&tag=b 로 보내 보고,
//                    tag 가 하나든 여럿이든 항상 '배열' 로 다루는 코드를 써 보세요.
//                    (힌트: [].concat(req.query.tag || []))

// ── 자주 하는 실수 ──

// [실수 1] app.use(express.json()) 을 안 씀
//   req.body 가 undefined 입니다. 1번 원인입니다.

// [실수 2] app.use(express.json()) 을 라우트 아래에 씀
//   위에서부터 실행되므로 라우트가 먼저 걸립니다. 역시 undefined 입니다.
//   미들웨어는 항상 라우트보다 위에.

// [실수 3] req.body 를 바로 구조 분해함
//   const { title } = req.body;
//   → 본문을 안 보내면 TypeError 로 서버가 죽습니다.
//   req.body || {} 로 받치거나, 먼저 없는지 확인하세요.

// [실수 4] req.query 의 값을 숫자로 안 바꿈
//   req.query.page * 10  은 "2" * 10 = 20 이라 우연히 됩니다.
//   req.query.page + 10  은 "2" + 10 = "210" 이 됩니다.
//   우연히 되는 코드가 제일 무섭습니다. Number 로 분명히 바꾸세요.

// [실수 5] 같은 이름의 쿼리가 여러 개 올 수 있다는 걸 잊음
//   글자인 줄 알았는데 배열이라 TypeError 가 납니다.

// [실수 6] req.params 와 req.query 를 헷갈림
//   /documents/12   → req.params.id
//   /documents?id=12 → req.query.id
//   주소 모양이 다릅니다. 콜론을 쓴 것만 params 입니다.

// [실수 7] 비밀번호를 쿼리에 담음
//   /login?password=1234 는 서버 기록에 그대로 남습니다.
//   비밀은 반드시 본문(POST)에 담으세요.

// ── 정리 ──

// 1. 클라이언트가 값을 보내는 길은 넷뿐이다.
//    경로 req.params · 쿼리 req.query · 본문 req.body · 헤더 req.headers.
// 2. 본문을 읽으려면 app.use(express.json()) 한 줄이 반드시 있어야 한다.
//    그리고 라우트보다 위에 둬야 한다. 아래에 두면 안 읽힌다.
// 3. req.params 와 req.query 값은 언제나 글자다. 숫자로 쓰려면 Number 로 바꾼다.
// 4. Express 5 는 본문이 없으면 req.body 가 undefined 다(4 는 {} 였다).
//    바로 구조 분해하면 그 자리에서 터진다. 있는지 먼저 본다.
// 5. JSON 이 깨져서 오면 Express 가 알아서 400 을 낸다. 내가 try/catch 할 일이 아니다.
// 6. 같은 이름의 쿼리가 여러 개 오면 배열이 된다. 하나로 알고 쓰면 틀린다.
// 7. 비밀번호는 쿼리에 담지 않는다. 주소는 기록에 그대로 남는다. 본문에 담는다.
// 8. 어디에 담을지는 이렇게 나눈다.
//    무엇을 가리키는 값은 경로, 걸러 보는 조건은 쿼리, 만들고 고칠 내용은 본문.
