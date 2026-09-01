// ============================================================
// 04단원 · 개념 05 — nodemon 과 파일 나누기 (express.Router)
// ------------------------------------------------------------
// 실행: node 개념05_nodemon과_파일_나누기.js
//       또는  npx nodemon 개념05_nodemon과_파일_나누기.js
//       끄려면 Ctrl + C
// ============================================================
//
// 이 파일은 혼자가 아닙니다. 옆의 routes 폴더를 함께 보세요.
//
//   04_Express_시작하기/
//     개념05_nodemon과_파일_나누기.js   ← 지금 이 파일
//     routes/
//       documents.js
//       equipments.js

// ============================================================
// 1부 — nodemon
// ============================================================
//
// 지금까지 코드를 고칠 때마다 이걸 반복했습니다.
//
//   Ctrl + C 로 끄고 → 위쪽 화살표 → Enter
//
// 하루에 백 번쯤 합니다. 정말 번거롭습니다.
// nodemon 은 파일이 바뀌면 알아서 서버를 다시 켜 주는 도구입니다.
//
//
// ── 설치 ──
//
//   npm install --save-dev nodemon
//
//   --save-dev 를 붙이는 이유
//     nodemon 은 '개발할 때만' 필요합니다.
//     서버에 올릴 때는 필요 없습니다. 그래서 devDependencies 에 넣습니다.
//     (01단원 개념03 에서 본 그 구분입니다)
//
//   이 자료는 맨 위 폴더에 이미 설치해 두었습니다.
//
//
// ── 실행 ──
//
//   npx nodemon 개념05_nodemon과_파일_나누기.js
//
//   npx 는 "node_modules 에 설치된 명령을 실행해라" 라는 뜻입니다.
//   설치는 했는데 명령어를 못 찾을 때 npx 를 앞에 붙이면 됩니다.
//
//   켜 두고 파일을 아무거나 고친 뒤 저장해 보세요. 터미널에 이렇게 나옵니다.
//
//     [nodemon] restarting due to changes...
//     [nodemon] starting `node 개념05_...js`
//
//
// ── package.json 에 등록해 두면 더 짧아집니다 ──
//
//   "scripts": {
//     "dev": "nodemon 개념05_nodemon과_파일_나누기.js",
//     "start": "node server.js"
//   }
//
//   npm run dev     개발할 때
//   npm start       서버에 올렸을 때
//
//   실무 프로젝트는 거의 다 이 두 개가 있습니다.
//   처음 보는 프로젝트를 받으면 package.json 의 scripts 부터 보세요.
//
//
// ── nodemon 이 못 고쳐 주는 것 ──
//
//   ① package.json 을 고쳤을 때는 다시 켜야 할 때가 있습니다
//   ② 문법 에러가 나면 그냥 멈춥니다. 고치고 저장하면 다시 살아납니다
//   ③ 켜져 있는 상태에서 브라우저만 새로고침하면 소용없습니다
//      → 터미널에 restarting 이 떴는지 꼭 확인하세요
//
//   ★ "고쳤는데 반영이 안 돼요" 의 절반은
//     nodemon 이 아예 안 켜져 있는 경우입니다. node 로 켜 놓고 착각한 것입니다.

// ============================================================
// 2부 — 파일 나누기
// ============================================================

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

console.log("실행1");
// ── 섹션 1: 왜 나누나 ──

// 지금까지는 라우트를 전부 한 파일에 적었습니다.
// 자원이 세 개만 되어도 이렇게 됩니다.
//
//   app.get("/documents", ...)          20줄
//   app.get("/documents/:id", ...)      20줄
//   app.post("/documents", ...)         25줄
//   app.delete("/documents/:id", ...)   15줄
//   app.get("/equipments", ...)         20줄
//   ...
//
// 500줄짜리 파일이 됩니다. 고칠 곳을 찾는 데만 한참 걸립니다.
// 여러 명이 같이 만들면 같은 파일을 동시에 고쳐서 충돌이 납니다.
//
// 그래서 '자원별로 파일을 나눕니다'.
// 문서 관련은 routes/documents.js, 설비 관련은 routes/equipments.js 로.

// ── 섹션 2: 라우터 데려오기 ──

const documentsRouter = require("./routes/documents");
const equipmentsRouter = require("./routes/equipments");
const healthRouter = require("./routes/health");

// ★ "./" 로 시작하는 것에 주의하세요.
//   ./routes/documents  → 내 폴더 아래 routes 폴더의 documents.js
//   routes/documents    → node_modules 에서 찾습니다. 없으니 에러
//   (01단원 개념02 에서 본 그 규칙입니다)
//
// ★ 확장자 .js 는 생략할 수 있습니다. 붙여도 됩니다.

// ── 섹션 3: 주소 앞부분을 정해서 붙이기 ──

app.use("/documents", documentsRouter);
app.use("/equipments", equipmentsRouter);
app.use("/health", healthRouter);

// 이 두 줄이 하는 일
//
//   "/documents 로 시작하는 요청은 documentsRouter 에게 넘겨라"
//
// documents.js 안에는 router.get("/") 라고만 적혀 있습니다.
// 앞에 "/documents" 가 붙어서 최종 주소가 완성됩니다.
//
//   app.use("/documents", ...)  +  router.get("/")      →  GET /documents
//   app.use("/documents", ...)  +  router.get("/:id")   →  GET /documents/:id
//
// ★ 이 방식의 진짜 장점
//   나중에 주소를 /api/documents 로 바꾸고 싶다면
//   여기 한 줄만 고치면 됩니다.
//
//     app.use("/api/documents", documentsRouter);
//
//   documents.js 는 한 글자도 안 고쳐도 됩니다.

// ── 섹션 4: 잘 붙었는지 확인 ──

// 확인: GET /health
// 응답: 200 {"status":"ok"}

// 확인: GET /documents
// 응답: 200 [{"id":1,"title":"작업표준서"},{"id":2,"title":"검사성적서"}]

// 확인: GET /documents/1
// 응답: 200 {"id":1,"title":"작업표준서"}

// 확인: GET /documents/99
// 응답: 404 {"error":"99번 문서가 없습니다"}

// 확인: POST /documents {"title":"신규문서"}
// 응답: 201 {"id":3,"title":"신규문서"}

// 확인: GET /documents
// 응답: 200 [{"id":1,"title":"작업표준서"},{"id":2,"title":"검사성적서"},{"id":3,"title":"신규문서"}]

// 확인: DELETE /documents/3
// 응답: 204

// 확인: GET /equipments
// 응답: 200 [{"id":1,"name":"컨베이어","line":"A"},{"id":2,"name":"프레스","line":"B"}]

// 확인: GET /equipments?line=A
// 응답: 200 [{"id":1,"name":"컨베이어","line":"A"}]

// 확인: GET /equipments/1
// 응답: 200 {"id":1,"name":"컨베이어","line":"A"}

// 라우트를 다른 파일에 적었는데도 똑같이 동작합니다.
// 옮겼을 뿐 달라진 것은 없습니다.

// ── 섹션 5: 404 와 에러 처리기는 여전히 맨 아래 ──

app.use((req, res) => {
  res.status(404).json({ error: "그런 주소가 없습니다" });
});

// 확인: GET /없는주소
// 응답: 404 {"error":"그런 주소가 없습니다"}

app.use((err, req, res, next) => {
  console.error(`[에러] ${req.method} ${req.path} — ${err.message}`);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON 형식이 아닙니다" });
  }

  const 코드 = err.status || 500;

  if (코드 === 500) {
    return res.status(500).json({ error: "서버에서 문제가 생겼습니다" });
  }

  res.status(코드).json({ error: err.message });
});

// ★ 라우터를 아무리 많이 붙여도 이 두 개는 항상 맨 마지막입니다.
//   app.use("/documents", ...) 보다 위에 두면 문서 라우트가 전부 404 가 됩니다.

app.listen(PORT, () => {
  console.log(`서버가 켜졌습니다.  http://localhost:${PORT}/documents`);
});

// ============================================================
// 실무 폴더 구조 미리 보기
// ============================================================
//
// 지금은 이렇습니다.
//
//   프로젝트/
//     server.js          ← 미들웨어 + 라우터 연결 + listen
//     routes/
//       documents.js     ← 라우트 + 실제 일 처리
//       equipments.js
//
// 조금 더 커지면 이렇게 나눕니다. (07단원, PART 4)
//
//   프로젝트/
//     server.js          ← listen 만
//     app.js             ← 미들웨어 + 라우터 연결
//     routes/            ← "어떤 주소로 오면 누구를 부를까"
//       documents.js
//     controllers/       ← "실제로 무슨 일을 할까"
//       documents.js
//     models/            ← "데이터를 어떻게 읽고 쓸까"
//       documents.js
//     middlewares/       ← 공통으로 거쳐 갈 것들
//
// 왜 이렇게까지 나누나
//   ① 고칠 곳을 바로 찾을 수 있습니다
//      "주소가 이상해" → routes,  "계산이 이상해" → controllers
//   ② 데이터베이스를 바꿔도 models 만 고치면 됩니다
//   ③ 여러 명이 다른 파일을 고치니 충돌이 안 납니다
//
// ★ 지금 당장 다 나눌 필요는 없습니다.
//   파일이 200줄쯤 되면 그때 나누세요.
//   50줄짜리를 다섯 파일로 쪼개면 오히려 보기 어렵습니다.

// ============================================================
// 직접 해 볼 것
// ============================================================
//
// ✏️ 직접 해보기 1 — nodemon 으로 켜 두고 routes/documents.js 의
//                    문서 제목을 바꿔 보세요. 터미널에 restarting 이 뜨나요?
//                    브라우저를 새로고침하면 바뀐 제목이 보이나요?
//
// ✏️ 직접 해보기 2 — app.use("/documents", ...) 를
//                    app.use("/api/documents", ...) 로 바꿔 보세요.
//                    routes/documents.js 는 안 고쳐도 되는지 확인하세요.
//
// ✏️ 직접 해보기 3 — routes/notes.js 를 새로 만들어 메모 API 를 붙여 보세요.
//                    documents.js 를 복사해서 고치면 됩니다.
//                    목록·하나·만들기 세 개면 충분합니다.
//
// ✏️ 직접 해보기 4 — routes/equipments.js 의 맨 아래
//                    module.exports = router; 를 지우고 켜 보세요.
//                    어떤 에러가 나나요? 메시지를 읽고 뜻을 짐작해 보세요.
//                    (확인했으면 반드시 되돌리세요)
//
// ✏️ 직접 해보기 5 — routes/documents.js 안에서
//                    router.get("/documents") 라고 잘못 써 보세요.
//                    이제 어떤 주소로 들어가야 나오나요?
//                    (힌트: /documents/documents)

// ── 자주 하는 실수 ──

// [실수 1] 라우터 파일 안에 전체 주소를 씀
//   router.get("/documents", ...) 라고 쓰면 최종 주소가
//   /documents/documents 가 됩니다. 라우터 안에서는 "/" 부터 시작하세요.

// [실수 2] module.exports 를 빼먹음
//   → Router.use() requires a middleware function but got a Object
//   "라우터를 달라고 했는데 빈 객체가 왔다" 는 뜻입니다.

// [실수 3] require 경로에 ./ 를 안 붙임
//   require("routes/documents") 는 node_modules 에서 찾습니다.
//   → Cannot find module 'routes/documents'

// [실수 4] app.use 를 app.get 으로 씀
//   app.get("/documents", documentsRouter) 라고 쓰면
//   GET 만, 그것도 /documents 딱 하나만 걸립니다. /documents/1 은 안 됩니다.
//   라우터를 붙일 때는 반드시 app.use 입니다.

// [실수 5] 404 처리기를 라우터보다 위에 둠
//   라우터가 통째로 무시됩니다. 항상 맨 아래.

// [실수 6] nodemon 을 안 켜 놓고 반영이 안 된다고 함
//   터미널 맨 위에 [nodemon] 이 보이는지 확인하세요.

// ── 정리 ──

// 1. 라우트가 늘면 파일을 나눈다. express.Router() 로 묶어서 따로 두고 app.use 로 붙인다.
// 2. 라우터 파일 안에는 앞부분을 뺀 나머지 주소만 쓴다.
//    앞부분은 붙이는 쪽에서 정한다 — app.use("/documents", 라우터).
//    안에 전체 주소를 또 쓰면 /documents/documents 가 된다.
// 3. 라우터 파일 끝에 module.exports 를 빼먹으면 안 된다. 안 하면 붙일 것이 없다.
// 4. require 경로에는 ./ 를 붙인다. 안 붙이면 node_modules 에서 찾는다.
// 5. 라우터는 app.use 로 붙인다. app.get 이 아니다.
// 6. 404 처리기와 에러 처리기는 라우터를 붙인 다음, 여전히 맨 아래에 둔다.
// 7. nodemon 을 켜 두면 파일을 고칠 때마다 알아서 다시 켜 준다.
//    안 켜 놓고 "반영이 안 된다" 고 하는 일이 제일 많다.
