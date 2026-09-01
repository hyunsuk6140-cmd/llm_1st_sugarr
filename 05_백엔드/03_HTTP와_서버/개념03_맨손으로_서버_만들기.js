// ============================================================
// 03단원 · 개념 03 — 맨손으로 서버 만들기 (http 모듈)
// ------------------------------------------------------------
// 실행: node 개념03_맨손으로_서버_만들기.js
//       그다음 브라우저에서 http://localhost:3000 을 여세요.
//       끄려면 이 터미널에서 Ctrl + C 입니다.
// ============================================================
//
// 04단원부터는 Express 를 씁니다. 훨씬 편하니까요.
// 그런데 그 전에 한 번은 맨손으로 만들어 봐야 합니다.
//
// 왜냐하면 Express 가 해 주는 일이 무엇인지 알아야
// 문제가 생겼을 때 어디를 봐야 할지 알 수 있기 때문입니다.
//
// ★ 이 파일은 지금까지와 다릅니다.
//   실행하면 프로그램이 안 끝납니다. 계속 켜져 있습니다.
//   그게 정상입니다. 서버는 요청을 기다려야 하니까요.
//   끄려면 Ctrl + C 를 누르세요.

const http = require("http");

// 포트는 환경변수로 받고, 없으면 3000 을 씁니다.
// (나중에 서버에 올리면 포트를 밖에서 정해 주는 일이 많습니다. PART 4)
const PORT = process.env.PORT || 3000;

// ── 섹션 1: 가장 작은 서버 ──

// createServer 에 함수를 하나 넘깁니다.
// 그 함수는 '요청이 올 때마다' 실행됩니다. 08단원(JS자료)의 콜백입니다.
//
//     (req, res) => { ... }
//      ───  ───
//      요청  응답
//
//   req  누가 무엇을 달라고 했는지가 담겨 있습니다 (읽기만)
//   res  내가 무엇을 돌려줄지를 담는 곳입니다 (쓰기만)

const server = http.createServer((req, res) => {
  // 요청이 올 때마다 터미널에 기록을 남깁니다.
  // 서버를 만들 때 이 한 줄이 아주 큰 도움이 됩니다.
  console.log(`${req.method} ${req.url}`);

  // ── 섹션 2: 경로에 따라 다르게 응답하기 ──

  // req.url 에는 경로와 쿼리가 함께 들어옵니다. (/documents?page=2)
  // 경로만 떼어 내려면 URL 로 분석합니다.
  const 주소 = new URL(req.url, `http://${req.headers.host}`);

  const 경로 = 주소.pathname;

  // req.url 은 항상 상대 경로라 앞에 기준 주소를 붙여야 URL 이 만들어집니다.
  // (개념01 실수 1에서 본 그 이유입니다)

  if (경로 === "/") {
    // writeHead(상태코드, 헤더객체)
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("안녕하세요. 문서 서버입니다.");
    return; // ★ 응답한 뒤에는 반드시 빠져나옵니다
  }

  // 확인: GET /
  // 응답: 200 안녕하세요. 문서 서버입니다.

  if (경로 === "/health") {
    // 서버가 살아 있는지 확인하는 주소입니다.
    // 실무에서 거의 항상 만듭니다. PART 4 에서 배포할 때 씁니다.
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (경로 === "/about") {
    // 서버가 살아 있는지 확인하는 주소입니다.
    // 실무에서 거의 항상 만듭니다. PART 4 에서 배포할 때 씁니다.
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end("안녕하세요. 제 이름은 000입니다.");
    return;
  }
  // 확인: GET /health
  // 응답: 200 {"status":"ok"}

  // ── 섹션 3: 메서드까지 함께 보기 ──

  if (경로 === "/documents") {
    if (req.method === "GET") {
      const 목록 = [
        { id: 1, title: "작업표준서" },
        { id: 2, title: "검사성적서" },
        { id: 3, title: "업무매뉴얼" },
      ];
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(목록));
      return;
    }

    // 확인: GET /documents
    // 응답: 200 [{"id":1,"title":"작업표준서"},{"id":2,"title":"검사성적서"}]

    if (req.method === "POST") {
      // 새로 만들었으니 201 입니다. (개념02)
      res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ id: 3, message: "만들었습니다" }));
      return;
    }

    // 확인: POST /documents
    // 응답: 201 {"id":3,"message":"만들었습니다"}

    // 경로는 맞는데 메서드가 다른 경우입니다.
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("이 주소에서는 쓸 수 없는 방법입니다");
    return;

    // 확인: DELETE /documents
    // 응답: 405 이 주소에서는 쓸 수 없는 방법입니다
  }

  // ── 섹션 4: 쿼리 읽기 ──

  if (경로 === "/search") {
    console.log("searchParams", 주소.searchParams);

    const 검색어 = 주소.searchParams.get("q");

    if (!검색어) {
      // 필수 값이 없으니 400 입니다. 500 이 아닙니다. (개념02)
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "q 를 넣어 주세요" }));
      return;
    }

    // 확인: GET /search
    // 응답: 400 {"error":"q 를 넣어 주세요"}

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ 검색어, 결과수: 0 }));
    return;

    // 확인: GET /search?q=작업표준서
    // 응답: 200 {"검색어":"작업표준서","결과수":0}
  }

  // ── 섹션 5: 어디에도 안 걸리면 404 ──

  // 위에서 아무것도 return 하지 않았다면 모르는 주소입니다.
  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "그런 주소가 없습니다" }));

  // 확인: GET /없는주소
  // 응답: 404 {"error":"그런 주소가 없습니다"}
});

// ── 섹션 6: 서버 켜기 ──

server.listen(PORT, () => {
  console.log(`서버가 켜졌습니다.  http://localhost:${PORT}`);
  console.log("끄려면 Ctrl + C 를 누르세요.");
});

// listen 을 부르는 순간부터 프로그램이 안 끝납니다.
// "요청 올 때까지 계속 기다리는 상태" 가 됩니다.
//
// 이 콜백은 서버가 다 켜졌을 때 딱 한 번 실행됩니다.
// 요청이 올 때마다 실행되는 것이 아닙니다. 위쪽 createServer 의 콜백과 다릅니다.

// ============================================================
// 직접 해 볼 것
// ============================================================
//
// 서버를 켜고 브라우저에서 아래 주소들을 차례로 열어 보세요.
// 그때마다 터미널에 GET / 처럼 기록이 남는 것도 함께 보세요.
//
//   http://localhost:3000/                  → 인사말
//   http://localhost:3000/health            → {"status":"ok"}
//   http://localhost:3000/documents         → 문서 목록
//   http://localhost:3000/search            → 400 에러
//   http://localhost:3000/search?q=표준서    → 검색어가 되돌아옴
//   http://localhost:3000/아무거나           → 404
//
// ✏️ 직접 해보기 1 — /about 경로를 추가해 자기소개를 돌려주게 해 보세요.
//                    (고친 뒤에는 Ctrl+C 로 끄고 다시 켜야 반영됩니다)
//
// ✏️ 직접 해보기 2 — /documents 의 목록에 문서를 하나 더 추가해 보세요.
//
// ✏️ 직접 해보기 3 — 브라우저 주소창으로는 POST 를 보낼 수 없습니다.
//                    왜 그럴까요? (힌트: 주소창에 주소를 치면 항상 GET 입니다)
//                    POST 를 보내려면 Postman 이 필요합니다. 다음 파일에서 씁니다.

//
// ── 서버 코드를 고쳤는데 반영이 안 될 때 ──
//
//   서버는 켤 때 파일을 한 번 읽고 그대로 돕니다.
//   파일을 고쳐도 이미 도는 서버는 옛날 코드입니다.
//   Ctrl + C 로 끄고 다시 켜야 합니다.
//
//   매번 끄고 켜는 게 번거롭습니다. 그래서 04단원에서 nodemon 을 씁니다.
//   파일이 바뀌면 알아서 다시 켜 주는 도구입니다.
//
//
// ── 이 코드의 문제점 ──
//
// 잘 동작하지만 벌써 불편한 것이 보입니다.
//
//   ① if 가 계속 늘어납니다. 주소가 30개면 if 가 30개입니다.
//   ② 경로마다 writeHead 와 JSON.stringify 를 반복해서 씁니다.
//   ③ /documents/12 처럼 번호가 낀 주소는 직접 잘라 내야 합니다.
//   ④ POST 로 온 본문(body)을 읽으려면 코드가 훨씬 복잡해집니다.
//
// 이 넷을 전부 해결해 주는 것이 Express 입니다. 04단원에서 만납니다.
// 지금 불편함을 느껴 봐야 Express 가 왜 고마운지 알 수 있습니다.

// ── 자주 하는 실수 ──

// [실수 1] res.end 를 안 부름
//   응답을 안 끝내면 브라우저가 계속 빙빙 돕니다. 영원히 기다립니다.
//   어느 갈래로 가든 반드시 res.end 로 끝내세요.

// [실수 2] 응답한 뒤에 return 을 안 함
//   아래 코드가 계속 실행되어 응답을 두 번 보내려 합니다.
//   → Error: Cannot set headers after they are sent to the client
//   서버를 만들 때 가장 많이 보는 에러입니다. return 을 꼭 붙이세요.

// [실수 3] 객체를 그대로 res.end 에 넣음
//   res.end({ id: 1 })
//   → TypeError. 보낼 수 있는 것은 글자나 Buffer 뿐입니다.
//   JSON.stringify 로 글자로 바꿔서 보내세요.

// [실수 4] charset=utf-8 을 빼먹음
//   한글이 깨져서 보입니다. Content-Type 에 꼭 붙이세요.

// [실수 5] 서버를 안 끄고 또 켬
//   → Error: listen EADDRINUSE: address already in use :::3000
//   앞 터미널에서 Ctrl + C 로 끄거나, 다른 포트를 쓰세요.

// [실수 6] 파일을 고치고 새로고침만 함
//   서버는 다시 켜야 반영됩니다. 브라우저 새로고침으로는 안 됩니다.

// ── 정리 ──

// 1. http.createServer 로 서버를 만들고 listen 으로 켠다.
//    실행하면 프로그램이 안 끝나는 것이 정상이다. 요청을 기다리는 중이다.
// 2. 요청 하나가 오면 콜백이 한 번 돈다. req 는 들어온 것, res 는 내보낼 것이다.
// 3. 갈래는 손으로 나눈다. req.url 과 req.method 를 if 로 하나씩 본다.
//    이 손으로 나누는 일을 04단원부터 Express 가 대신해 준다.
// 4. 응답은 반드시 res.end 로 끝낸다. 안 부르면 브라우저가 계속 기다린다.
// 5. 응답한 뒤에는 return 을 붙인다. 안 붙이면 아래로 흘러가 두 번 보낸다.
// 6. 객체는 그대로 못 보낸다. JSON.stringify 로 글자로 바꿔서 보낸다.
// 7. 한글이 깨지면 charset=utf-8 을 빼먹은 것이다.
// 8. 고쳤으면 Ctrl + C 로 껐다가 다시 켜야 반영된다. 새로고침만으로는 안 된다.
