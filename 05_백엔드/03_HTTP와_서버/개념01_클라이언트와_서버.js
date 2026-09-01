// ============================================================
// 03단원 · 개념 01 — 클라이언트와 서버, 그리고 URL
// ------------------------------------------------------------
// 실행: node 개념01_클라이언트와_서버.js
// ============================================================
//
// 지금까지 만든 것은 '내 컴퓨터에서 혼자 도는 프로그램' 이었습니다.
// 이제부터는 '남이 접속해서 쓰는 프로그램' 을 만듭니다. 그게 서버입니다.
//
// ── 클라이언트와 서버 ──
//
//   클라이언트(client)   요청하는 쪽.  브라우저, 앱
//   서버(server)         응답하는 쪽.  우리가 만들 것
//
//   손님(클라이언트)이 주문하고, 주방(서버)이 만들어 내보냅니다.
//
// 지금까지 배운 것으로 나누면 이렇습니다.
//
//   HTML·CSS·React  →  클라이언트. 브라우저에서 돕니다
//   Node·Express    →  서버. 우리 컴퓨터(나중엔 EC2)에서 돕니다
//
// ── 한 번의 왕복 ──
//
//   ① 브라우저가 요청을 보낸다        "문서 목록 좀 주세요"
//   ② 서버가 받아서 처리한다          파일을 읽거나 DB 를 뒤집니다
//   ③ 서버가 응답을 보낸다            "여기 있습니다" + 데이터
//   ④ 브라우저가 받아서 화면에 그린다
//
// 12단원(JS자료)에서 fetch 로 했던 것이 ①과 ④입니다.
// 이제 ②와 ③, 즉 '받아 주는 쪽' 을 만듭니다.
//
// ★ 중요 — 서버는 먼저 말을 걸 수 없습니다.
//   항상 클라이언트가 물어봐야 대답합니다.
//   서버가 알아서 브라우저에 뭔가 보내는 일은 없습니다.

// ── 섹션 1: URL 을 뜯어봅시다 ──

// 요청을 보내려면 '어디로' 를 알아야 합니다. 그게 URL 입니다.
// Node 에는 URL 을 분석해 주는 도구가 이미 들어 있습니다.

const 주소 = new URL(
  "https://api.example.com:8080/documents/12?type=pdf&page=2#top",
);

//   https :// api.example.com : 8080 /documents/12 ?type=pdf&page=2 #top
//   ─────     ──────────────   ────  ─────────────  ───────────────  ────
//   프로토콜      호스트         포트      경로            쿼리        해시

console.log(주소.protocol);
// 출력: https:
// 콜론이 함께 나옵니다. "https" 가 아니라 "https:" 입니다.

console.log(주소.hostname);
// 출력: api.example.com
// 어느 컴퓨터인지를 가리킵니다.

console.log(주소.port);
// 출력: 8080
// 그 컴퓨터의 몇 번 문으로 들어갈지입니다. 섹션 3에서 자세히 봅니다.

console.log(주소.pathname);
// 출력: /documents/12
// ★ 서버에서 가장 중요한 부분입니다. "무엇을 달라는가" 가 여기 담깁니다.

console.log(주소.hash);
// 출력: #top
// 페이지 안의 위치입니다. ★ 서버로 전송되지 않습니다. 브라우저만 씁니다.

// ✏️ 직접 해보기 1 — "http://localhost:3000/api/users" 를 URL 로 만들어
//                    hostname, port, pathname 을 각각 출력해 보세요.

// ── 섹션 2: 쿼리 스트링 — 조건을 함께 보내기 ──

// 경로 뒤 ? 부터가 쿼리입니다. "어떤 조건으로" 를 담습니다.
//
//     /documents?type=pdf&page=2
//               ─────────────────
//               ? 로 시작, & 로 여러 개, 각각은 이름=값

console.log(주소.search);
// 출력: ?type=pdf&page=2
// 통째로 문자열입니다. 직접 자르지 마세요. 아래 방법이 있습니다.

console.log(주소.searchParams.get("type"), 주소.searchParams.get("page"));
// 출력: pdf 2

console.log([...주소.searchParams.keys()]);
// 출력: [ 'type', 'page' ]

// ★ 아주 중요 — 꺼낸 값은 언제나 문자열입니다.
console.log(typeof 주소.searchParams.get("page"));
// 출력: string
// page=2 라고 숫자를 보냈지만 "2" 로 들어옵니다.
// 계산하려면 Number 로 바꿔야 합니다. 01단원의 그 함정과 같습니다.

// 없는 것을 꺼내면 null 입니다.
console.log(주소.searchParams.get("없는것"));
// 출력: null
// undefined 가 아니라 null 입니다. 확인하고 쓰세요.

// 쿼리가 아예 없으면 search 는 빈 문자열입니다.
const 주소2 = new URL("http://localhost:3000/api/docs");
console.log(JSON.stringify(주소2.search));
// 출력: ""

// ✏️ 직접 해보기 2 — "/search?q=작업표준서&limit=10" 에서
//                    q 와 limit 을 꺼내고, limit 의 자료형을 확인해 보세요.
//                    (앞에 http://localhost:3000 을 붙여야 URL 이 만들어집니다)

const a = new URL("http://localhost:3000/search?q=작업표준서&limit=10");
console.log(a.searchParams.get("q"));
console.log(a.searchParams.get("limit"));
console.log(typeof a.searchParams.get("limit"));

// ── 섹션 3: localhost 와 포트 ──

// 서버를 만들면 이런 주소로 접속하게 됩니다.
//
//     http://localhost:3000
//
// [localhost]
//   "이 컴퓨터" 를 뜻하는 이름입니다. 127.0.0.1 과 같습니다.
//   내 컴퓨터에서 돌고 있는 서버에 내가 접속하는 것입니다.
//   옆자리 사람은 이 주소로 못 들어옵니다. 각자의 컴퓨터를 가리키니까요.
//
// [포트(port)]
//   컴퓨터 하나에 프로그램이 여러 개 돌 수 있습니다.
//   "그중 몇 번째 프로그램에게 갈 것인가" 를 정하는 번호입니다.
//   건물이 컴퓨터라면 포트는 호실 번호입니다.
//
//   3000, 5000, 8080 을 개발할 때 많이 씁니다. 아무 번호나 써도 됩니다.
//   다만 0~1023 은 이미 정해진 용도가 있어 피합니다.
//     80   → http (그래서 웹 주소에 포트를 안 씁니다)
//     443  → https
//
//   http://example.com 은 사실 http://example.com:80 입니다.
//   80 은 기본값이라 안 적는 것뿐입니다.

const 로컬 = new URL("http://localhost:3000/api/documents");

console.log(로컬.hostname, 로컬.port, 로컬.pathname);
// 출력: localhost 3000 /api/documents

// ★ 한 포트에는 프로그램 하나만 붙을 수 있습니다.
//   이미 3000 번을 쓰고 있는데 또 서버를 켜면 이 에러가 납니다.
//
//     Error: listen EADDRINUSE: address already in use :::3000
//
//   01단원에서 예고했던 그 에러입니다.
//   앞서 켜 둔 서버를 그 터미널에서 Ctrl + C 로 끄면 됩니다.

// ✏️ 직접 해보기 3 — 포트를 4000 으로 바꾼 주소를 만들어 port 를 출력해 보세요.
const 로컬1 = new URL("http://localhost:4000/api");
console.log(로컬1.port);

// ── 섹션 4: 경로 설계 — 무엇을 달라는가 ──

// 서버는 경로를 보고 무엇을 할지 정합니다.
// 그래서 경로를 어떻게 지을지가 중요합니다.
//
//   /documents          문서 전체 목록
//   /documents/12       12번 문서 하나
//   /documents/12/파일  12번 문서의 파일
//
// 규칙 하나만 기억하세요.
//
//     ★ 경로에는 '이름(명사)' 을 쓰고, '동작(동사)' 은 쓰지 않습니다.
//
//   좋음   /documents          나쁨   /getDocuments
//   좋음   /documents/12       나쁨   /deleteDocument?id=12
//
// 그럼 "가져오기" 와 "지우기" 는 어떻게 구분할까요?
// 경로가 아니라 '메서드' 로 구분합니다. 다음 파일(개념02)에서 배웁니다.

// 경로를 조각으로 나누는 것은 지금까지 배운 것으로 됩니다.
const 조각 = 로컬.pathname.split("/").filter((s) => s !== "");

console.log(조각);
// 출력: [ 'api', 'documents' ]
// 맨 앞의 / 때문에 빈 문자열이 하나 생겨서 filter 로 걸렀습니다.

const 상세 = new URL("http://localhost:3000/api/documents/12");
const 상세조각 = 상세.pathname.split("/").filter((s) => s !== "");

console.log(상세조각[2]);
// 출력: 12
console.log(typeof 상세조각[2]);
// 출력: string
// 경로에서 꺼낸 것도 문자열입니다. 숫자로 쓰려면 Number 로 바꿔야 합니다.

// ✏️ 직접 해보기 4 — "/api/lines/A/machines/3" 을 조각으로 나눠 출력해 보세요.
const 상세1 = new URL("http://localhost:3000/api/lines/A/machines/3");
const 상세조각1 = 상세1.pathname.split("/").filter((s) => s !== "");
console.log(상세조각1);

// ── 섹션 5: 우리가 만들 구조 ──

// 이 과정에서 최종적으로 만들 모양입니다.
//
//     [브라우저]                    [서버]                  [저장소]
//     React 화면        →  fetch  →  Express        →  파일 / DB
//        ↑                            │
//        └──────  JSON 응답  ─────────┘
//
//   · 화면은 React 가 그립니다 (PART 2 에서 배웠습니다)
//   · 데이터는 서버가 줍니다 (지금 배우는 것)
//   · 둘은 fetch 로 대화합니다 (JS자료 12단원에서 배웠습니다)
//   · 주고받는 것은 JSON 입니다
//
// 그래서 서버가 하는 일은 딱 이것뿐입니다.
//
//     "요청을 받아서 → 판단하고 → JSON 을 돌려준다"
//
// 화면을 그리는 일은 안 합니다. 그건 브라우저 몫입니다.

// ── 섹션 6: 자주 하는 실수 ──

// ★ 아래에서 SyntaxError 라고 적힌 것은 눈으로만 보세요. 주석을 풀지 마세요.

// [실수 1] http:// 를 빼먹음 → 에러가 아니라 '조용히 이상한 결과'
const 잘못된주소 = new URL("localhost:3000/api");
console.log(잘못된주소.protocol, JSON.stringify(잘못된주소.hostname));
// 출력: localhost: ""
//
// 실수: 에러가 안 납니다. 그래서 더 위험합니다.
//       "localhost:" 를 프로토콜로 읽어 버렸습니다. https: 자리에 들어간 것입니다.
//       hostname 은 빈 문자열이 되어, 나중에 요청을 보내면 엉뚱한 곳으로 갑니다.
//       http:// 를 반드시 붙이세요.

// 반대로 경로만 주면 그때는 에러가 납니다.
try {
  new URL("/api/documents");
} catch (error) {
  console.log(error.code);
  // 출력: ERR_INVALID_URL
  // 어디 컴퓨터인지가 없어서 URL 로 인정받지 못합니다.
}

// [실수 2] 쿼리 값을 숫자로 착각
//   const page = 주소.searchParams.get("page");
//   const 다음 = page + 1;        →  "21" (이어붙이기)
//   실수: Number(page) + 1 로 써야 3 이 됩니다.

// [실수 3] search 를 직접 자름
//   주소.search.split("=")[1]
//   실수: 값이 여러 개면 깨집니다. searchParams 를 쓰세요.

// [실수 4] 경로에 동사를 씀
//   /getDocuments  /createDocument  /deleteDocument
//   실수: 문법 에러는 아니지만 실무에서 쓰지 않는 방식입니다.
//         경로는 명사, 동작은 메서드로 구분합니다. (개념02)

// [실수 5] 해시(#)를 서버가 볼 수 있다고 생각
//   #top 은 브라우저에만 남고 서버로 전송되지 않습니다.
//   서버에서 읽으려 해도 절대 못 읽습니다.

// [실수 6] localhost 를 남에게 알려 줌
//   "http://localhost:3000 으로 들어와 보세요" 라고 해도 상대는 못 들어옵니다.
//   그 사람 컴퓨터의 3000 번을 보게 되니까요.
//   남이 접속하게 하려면 인터넷에 올려야 합니다. (PART 4 의 EC2)

// ── 정리 ──

// 1. 클라이언트가 요청하고 서버가 응답한다. 서버가 먼저 말을 걸 수는 없다.
// 2. URL 은 프로토콜 / 호스트 / 포트 / 경로 / 쿼리 / 해시로 되어 있다.
// 3. pathname 이 "무엇을", search 가 "어떤 조건으로" 를 담는다.
// 4. searchParams.get 으로 쿼리를 꺼낸다. 값은 언제나 문자열, 없으면 null.
// 5. 해시(#)는 서버로 전송되지 않는다.
// 6. localhost 는 내 컴퓨터, 포트는 그중 몇 번 프로그램인지.
// 7. 한 포트에는 프로그램 하나. 중복되면 EADDRINUSE.
// 8. 경로에는 명사를 쓴다. 동작은 메서드로 구분한다.

// ============================================================
// 직접 해보기 정답
// ============================================================
//
// 1) const u = new URL("http://localhost:3000/api/users");
//    console.log(u.hostname);   // 출력: localhost
//    console.log(u.port);       // 출력: 3000
//    console.log(u.pathname);   // 출력: /api/users
//
// 2) const u = new URL("http://localhost:3000/search?q=작업표준서&limit=10");
//    console.log(u.searchParams.get("q"));           // 출력: 작업표준서
//    console.log(u.searchParams.get("limit"));       // 출력: 10
//    console.log(typeof u.searchParams.get("limit")); // 출력: string
//    → 10 이 아니라 "10" 입니다. 목록을 자를 때 slice(0, "10") 처럼 쓰면
//      의도대로 동작하지 않습니다. Number 로 바꾸세요.
//
// 3) const u = new URL("http://localhost:4000/api");
//    console.log(u.port);   // 출력: 4000
//    → 포트가 다르면 완전히 다른 프로그램입니다.
//      3000 번 서버를 켜 둔 채로 4000 번 서버를 또 켤 수 있습니다.
//
// 4) const u = new URL("http://localhost:3000/api/lines/A/machines/3");
//    console.log(u.pathname.split("/").filter((s) => s !== ""));
//    // 출력: [ 'api', 'lines', 'A', 'machines', '3' ]
//    → "A 라인의 3번 설비" 라는 뜻입니다.
//      경로만 봐도 무엇을 달라는지 읽히는 것이 좋은 설계입니다.
