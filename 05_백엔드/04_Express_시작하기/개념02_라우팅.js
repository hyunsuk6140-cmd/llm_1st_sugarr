// ============================================================
// 04단원 · 개념 02 — 라우팅 (주소와 함수를 짝지어 등록하기)
// ------------------------------------------------------------
// 실행: node 개념02_라우팅.js
//       끄려면 Ctrl + C
// ============================================================
//
// 03단원에서는 이렇게 갈래를 나눴습니다.
//
//   if (경로 === "/documents") {
//     if (req.method === "GET") { ... }
//     if (req.method === "POST") { ... }
//   }
//
// Express 에서는 이렇게 씁니다.
//
//   app.get("/documents", ...)
//   app.post("/documents", ...)
//
// if 가 사라졌습니다. 이번 파일에서 이 문법을 전부 봅니다.

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ── 섹션 1: 메서드마다 함수가 하나씩 ──

// app 에는 메서드 이름과 똑같은 함수가 있습니다.
//
//
//
// C app.post / R app.get / U app.put, app.patch / D app.delete
// 모양은 전부 같습니다.   app.메서드(주소, 함수)

app.get("/documents", (req, res) => {
  res.json({ 방법: "GET", 뜻: "목록을 봅니다" });
});

// 확인: GET /documents
// 응답: 200 {"방법":"GET","뜻":"목록을 봅니다"}

app.post("/documents", (req, res) => {
  res.status(201).json({ 방법: "POST", 뜻: "새로 만듭니다" });
});

// 확인: POST /documents
// 응답: 201 {"방법":"POST","뜻":"새로 만듭니다"}

app.delete("/documents", (req, res) => {
  res.json({ 방법: "DELETE", 뜻: "지웁니다" });
});

// 확인: DELETE /documents
// 응답: 200 {"방법":"DELETE","뜻":"지웁니다"}

// ★ 주소가 같아도 메서드가 다르면 완전히 다른 라우트입니다.
//   위 세 개는 전부 "/documents" 지만 서로 아무 상관이 없습니다.
//   03단원에서 if 를 두 겹으로 썼던 것이 여기서는 그냥 세 줄입니다.
//
// ★ delete 는 예약어 아닌가요?
//   자바스크립트에 delete 연산자가 있긴 하지만, app.delete 처럼
//   점 뒤에 오는 이름으로는 쓸 수 있습니다. 문제없습니다.
//   (Express 4 에는 app.del 이라는 옛날 이름도 있었는데 5 에서 없어졌습니다)

// ── 섹션 2: 경로에 값 끼워 넣기 (경로 파라미터) ──

// 03단원에서 가장 귀찮았던 부분입니다.
//
//   const 조각들 = 경로.split("/").filter(Boolean);
//   const 번호 = Number(조각들[1]);
//
// Express 는 주소에 콜론(:)을 붙이면 알아서 꺼내 줍니다.

app.get("/documents/:id", (req, res) => {
  res.json({
    원본: req.params.id,
    숫자: Number(req.params.id),
    타입: typeof 숫자,
  });
});

// 확인: GET /documents/12
// 응답: 200 {"받은id":"12","타입":"string"}

// :id 라고 쓰면 req.params.id 에 들어옵니다. 이름은 마음대로 지어도 됩니다.
//
//   "/documents/:번호"  →  req.params.번호      ← 됩니다. 되지만 권장하지 않습니다
//   "/documents/:id"    →  req.params.id
//
// ★★ 타입이 "string" 인 것을 꼭 보세요.
//   주소에서 나온 것은 언제나 글자입니다. 03단원과 똑같습니다.
//   Express 를 쓴다고 숫자로 바뀌지 않습니다.
//
//     문서.id === req.params.id      →  1 === "1"  →  false. 영원히 못 찾습니다
//     문서.id === Number(req.params.id)  →  이렇게 써야 합니다
//
//   이 실수는 Express 를 처음 쓰는 사람이 거의 100% 합니다.

// ── 섹션 3: 파라미터를 여러 개 ──

app.get("/lines/:line/equipments/:id", (req, res) => {
  res.json(req.params);
});

// 확인: GET /lines/A/equipments/7
// 응답: 200 {"line":"A","id":"7"}

// req.params 는 객체입니다. 콜론이 붙은 것들이 전부 들어 있습니다.
//
// ★ 주소를 이렇게 겹쳐 쓰는 것은 "A라인에 속한 7번 설비" 라는 뜻입니다.
//   자원 사이에 포함 관계가 있을 때만 쓰세요.
//   관계가 없는데 겹쳐 쓰면 주소만 길어지고 좋을 게 없습니다.

// ── 섹션 4: 값에 한글이 들어오는 것은 괜찮습니다 ──

app.get("/search/:word", (req, res) => {
  res.json({ 검색어: req.params.word, 글자수: req.params.word.length });
});

// 확인: GET /search/작업표준서
// 응답: 200 {"검색어":"작업표준서","글자수":5}

// 개념01 섹션 8 에서 "주소에 한글 쓰지 말라" 고 했는데 이건 왜 될까요?
//
//   안 되는 것:  app.get("/한글주소", ...)     ← 주소를 한글로 '정한' 것
//   되는 것:     app.get("/search/:word", ...) ← 값으로 한글이 '들어온' 것
//
// 주소 자체는 영어(/search/:word)입니다.
// :word 자리에 무엇이 오든 Express 가 받아서 되돌려 줍니다.
// 정리하면 — 주소는 영어로 정하고, 한글은 값으로 받으세요.

// ── 섹션 5: 있어도 되고 없어도 되는 파라미터 ──

// Express 5 에서 문법이 바뀐 부분입니다. 중괄호로 감쌉니다.

app.get("/reports{/:year}", (req, res) => {
  const 연도 = req.params.year || "전체";
  res.json({ 연도 });
});

// 확인: GET /reports/2026
// 응답: 200 {"연도":"2026"}

// 확인: GET /reports
// 응답: 200 {"연도":"전체"}

// 하나의 라우트가 두 주소를 모두 받습니다.
//
// ★★ Express 4 를 쓴 블로그를 보면 이렇게 나옵니다.
//
//     app.get("/reports/:year?", ...)      ← Express 4 방식
//
//   Express 5 에서 이렇게 쓰면 서버가 아예 안 켜집니다.
//
//     TypeError: Unexpected ? at index 14: /reports/:year?
//
//   물음표가 없어지고 중괄호가 생겼다고 기억하세요.
//     Express 4:  /reports/:year?
//     Express 5:  /reports{/:year}
//
//   슬래시가 중괄호 '안' 에 있는 것에 주의하세요. /reports{:year} 가 아닙니다.
//   year 가 없을 때 /reports/ 처럼 슬래시가 남으면 안 되기 때문입니다.

// ── 섹션 6: 아무 주소나 다 받기 (와일드카드) ──

// 이것도 Express 5 에서 문법이 바뀌었습니다.

app.get("/files/*splat", (req, res) => {
  res.json({ 조각들: req.params.splat });
});

// 확인: GET /files/2026/03/보고서.pdf
// 응답: 200 {"조각들":["2026","03","보고서.pdf"]}

// *splat 이라고 쓰면 나머지 전부가 req.params.splat 에 배열로 들어옵니다.
// splat 이라는 이름은 마음대로 바꿔도 됩니다. (*rest, *path ...)
//
// ★★ Express 4 에서는 이름 없이 별표만 썼습니다.
//
//     app.get("/files/*", ...)         ← Express 4 방식. 5 에서는 서버가 안 켜집니다
//     → TypeError: Missing parameter name at index 8: /files/*
//
//   별표 뒤에 반드시 이름을 붙여야 합니다.
//
// 와일드카드는 파일 경로처럼 '몇 조각이 올지 모를 때' 만 씁니다.
// 그 밖에는 쓰지 마세요. 다음 섹션의 사고가 납니다.

// ── 섹션 7: ★ 순서가 전부입니다 ──

// Express 는 위에서부터 내려오며 처음 맞는 것 하나만 실행합니다.
// 그래서 '넓은 것' 을 위에 두면 아래가 전부 죽습니다.

// 좁은 것 먼저
app.get("/orders/new", (req, res) => {
  res.json({ 화면: "새 주문 만들기" });
});

// 확인: GET /orders/new
// 응답: 200 {"화면":"새 주문 만들기"}

// 넓은 것 나중
app.get("/orders/:id", (req, res) => {
  res.json({ 화면: "주문 상세", id: req.params.id });
});

// 확인: GET /orders/7
// 응답: 200 {"화면":"주문 상세","id":"7"}

// ★ 이 둘의 순서를 바꾸면 어떻게 될까요?
//
//   app.get("/orders/:id", ...)   ← 먼저 등록
//   app.get("/orders/new", ...)   ← 나중
//
//   /orders/new 로 요청하면 :id 가 먼저 걸립니다. id 에 "new" 가 들어갑니다.
//   그러면 "new 번 주문을 찾아라" 가 되어 404 가 납니다.
//   아래 /orders/new 는 영원히 실행되지 않습니다.
//
//   에러도 안 납니다. 그냥 조용히 엉뚱한 곳으로 갑니다.
//   Express 에서 "왜 이 라우트가 안 걸리지?" 의 대부분이 순서 문제입니다.
//
// 규칙 하나만 외우세요.
//
//   ★ 구체적인 주소를 위에, :id 나 *splat 같은 것을 아래에.
//
// ✏️ 직접 해보기 — 위 두 라우트의 순서를 실제로 바꿔 보고,
//                  /orders/new 가 어떻게 되는지 눈으로 확인하세요.
//                  (확인했으면 반드시 되돌리세요)

// ── 섹션 8: 메서드를 안 가리는 app.all ──

app.all("/ping", (req, res) => {
  res.json({ 받은방법: req.method });
});

// 확인: GET /ping
// 응답: 200 {"받은방법":"GET"}

// 확인: POST /ping
// 응답: 200 {"받은방법":"POST"}

// 어떤 메서드로 와도 이 함수가 실행됩니다.
// 405(그 방법은 안 됩니다)를 직접 만들 때 씁니다. 연습문제에서 써 봅니다.

// ── 섹션 9: 같은 주소를 한 번에 묶기 (app.route) ──

// 섹션 1에서 "/documents" 를 세 번 반복해서 적었습니다.
// 주소를 한 번만 적고 메서드를 이어 붙일 수 있습니다.

app
  .route("/notes")
  .get((req, res) => {
    res.json({ 방법: "GET" });
  })
  .post((req, res) => {
    res.status(201).json({ 방법: "POST" });
  })
  .delete((req, res) => {
    res.json({ 방법: "DELETE" });
  });

// 확인: GET /notes
// 응답: 200 {"방법":"GET"}

// 확인: POST /notes
// 응답: 201 {"방법":"POST"}

// 확인: DELETE /notes
// 응답: 200 {"방법":"DELETE"}

// 주소를 한 곳에만 적으니 오타가 줄어듭니다.
// "/notes" 를 "/memos" 로 바꿀 때 한 군데만 고치면 됩니다.
//
// 꼭 이렇게 써야 하는 건 아닙니다. 취향입니다.
// 다만 남의 코드에서 자주 보이니 읽을 줄은 알아야 합니다.

// ── 섹션 10: 없는 메서드로 오면 ──

// 확인: PATCH /notes
// 응답: 404

// /notes 에 patch 는 안 만들었습니다. Express 는 404 를 줍니다.
// 405 가 더 정확하지만, Express 는 기본으로 405 를 만들어 주지 않습니다.
// 필요하면 app.all 로 직접 만들어야 합니다. (연습문제 참고)

app.listen(PORT, () => {
  console.log(`서버가 켜졌습니다.  http://localhost:${PORT}/documents`);
});

// ============================================================
// Express 4 와 5 의 문법 차이 (블로그를 볼 때 주의하세요)
// ============================================================
//
//   하는 일                Express 4              Express 5 (지금 쓰는 것)
//   ─────────────────────────────────────────────────────────────────
//   선택 파라미터          /reports/:year?        /reports{/:year}
//   아무거나 다 받기       /files/*               /files/*splat
//   전체 받기              app.get("*", ...)      app.get("/*splat", ...)
//   DELETE 짧은 이름       app.del()              없어짐. app.delete()
//
// 4 문법을 5 에 쓰면 '서버가 아예 안 켜집니다'.
// 그래서 오히려 다행입니다. 조용히 틀리는 것보다 낫습니다.
//
// 에러 메시지에 pathToRegexpError 라는 주소가 보이면
// "라우트 주소 문법이 틀렸구나" 라고 생각하면 됩니다.
//
// 지금 설치된 버전을 확인하려면 터미널에서
//   npm list express

// ============================================================
// 직접 해 볼 것
// ============================================================
//
// ✏️ 직접 해보기 1 — /equipments/:id/logs 라우트를 만들어
//                    req.params 를 그대로 돌려주게 해 보세요.

app.get("/equipments/:id/logs", (req, res) => {
  res.json(req.params);
});
//
// ✏️ 직접 해보기 2 — 섹션 2 의 라우트를 고쳐서, id 를 숫자로 바꾼 결과와
//                    타입을 함께 돌려주게 해 보세요.
//                      { 원본: "12", 숫자: 12, 타입: "number" }
//
// ✏️ 직접 해보기 3 — /files/*splat 에 아주 긴 경로를 넣어 보세요.
//                    http://localhost:3000/files/a/b/c/d/e
//                    배열이 몇 개짜리로 나오나요?
//
// ✏️ 직접 해보기 4 — app.get("/files/*", ...) 로 고쳐서 다시 켜 보세요.
//                    어떤 에러가 나나요? 어디를 고치라고 알려 주나요?
//                    (확인했으면 반드시 되돌리세요)

// ── 자주 하는 실수 ──

// [실수 1] req.params.id 를 숫자로 안 바꿈
//   가장 많이 하는 실수입니다. find 가 계속 undefined 를 줍니다.
//   Number(req.params.id) 를 습관으로 만드세요.

// [실수 2] :id 라우트를 구체적인 주소보다 위에 둠
//   /orders/new 가 :id 에 걸려서 영원히 실행되지 않습니다.
//   에러가 안 나서 찾기 어렵습니다. 구체적인 것 먼저.

// [실수 3] 콜론을 빼먹음
//   app.get("/documents/id", ...)   ← 이건 진짜 'id' 라는 글자입니다
//   /documents/id 로 와야만 걸립니다. /documents/12 는 404 입니다.

// [실수 4] Express 4 문법을 그대로 씀
//   /reports/:year?  나  /files/*  를 쓰면 서버가 안 켜집니다.
//   블로그 글이 언제 쓰였는지 확인하세요.

// [실수 5] req.params 를 req.param 이라고 씀
//   s 가 빠지면 undefined 입니다.
//   Express 4 에는 req.param() 함수가 있었지만 5 에서 없어졌습니다.

// [실수 6] 라우트 주소 앞에 / 를 안 붙임
//   app.get("documents", ...)  →  걸리지 않습니다. 항상 / 로 시작하세요.

// ── 정리 ──

// 1. 메서드마다 함수가 하나씩이다. app.get · app.post · app.put · app.delete.
//    03단원의 중첩 if 가 통째로 사라진다.
// 2. 경로에 값을 끼우려면 :id 처럼 콜론을 붙인다. req.params.id 로 꺼낸다.
// 3. req.params 값은 언제나 글자다. 숫자로 쓸 것이면 Number 로 바꾼다.
// 4. 값에 한글이 오는 것은 괜찮다. 안 되는 것은 주소 자체에 한글을 쓰는 것이다.
// 5. 순서가 전부다. /documents/new 는 /documents/:id 보다 위에 있어야 한다.
//    아래에 두면 new 가 :id 에 먼저 걸려서 영영 안 불린다.
// 6. Express 5 는 문법이 바뀌었다. :id? 는 {/:id}, /* 는 /*splat 이다.
//    블로그 대부분이 4 기준이라 그대로 쓰면 서버가 아예 안 켜진다.
// 7. app.all 은 메서드를 안 가리고, app.route 는 같은 주소를 한 번에 묶는다.
// 8. 경로는 맞는데 그 메서드를 안 만들었으면 Express 는 404 를 준다.
//    405 가 더 정확하지만 기본으로 만들어 주지 않는다. 필요하면 app.all 로 직접 만든다.
