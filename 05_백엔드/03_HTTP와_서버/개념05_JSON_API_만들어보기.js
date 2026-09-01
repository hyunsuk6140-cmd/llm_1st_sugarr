// ============================================================
// 03단원 · 개념 05 — JSON API 하나를 끝까지 만들어 보기
// ------------------------------------------------------------
// 실행: node 개념05_JSON_API_만들어보기.js
//       끄려면 Ctrl + C
// ============================================================
//
// 지금까지 배운 것을 전부 합칩니다.
// 문서를 등록하고, 보고, 고치고, 지우는 API 를 만듭니다.
//
//   GET    /documents        목록 보기
//   GET    /documents?type=  종류로 걸러 보기
//   GET    /documents/1      하나만 보기
//   POST   /documents        새로 만들기
//   PUT    /documents/1      고치기
//   DELETE /documents/1      지우기
//
// 이 여섯 개를 CRUD 라고 부릅니다.
//   Create(만들기) Read(읽기) Update(고치기) Delete(지우기)
//
// 세상의 거의 모든 서버가 이 네 가지를 합니다.
// 쇼핑몰이든 SNS 든 사내 문서 시스템이든 똑같습니다.
// 이 파일 하나를 이해하면 뼈대는 다 이해한 것입니다.
//
// ★ 04단원에서 똑같은 것을 Express 로 다시 만듭니다.
//   그때 이 파일을 옆에 놓고 비교해 보세요. 절반으로 줄어듭니다.

const http = require("http");
const fs = require("fs/promises");
const PORT = process.env.PORT || 3000;
const 저장파일 = "documents.json";
// ── 섹션 1: 데이터는 어디에 두나 ──

// 지금은 그냥 변수에 담아 둡니다. 이걸 '메모리에 둔다' 고 합니다.
//
// let 인 이유: 추가·삭제하면서 배열 자체를 바꿔 끼울 것이기 때문입니다.

let 문서들 = [];
let 다음번호 = 1;

// 새 문서에 붙일 번호입니다. 하나 만들 때마다 1씩 올립니다.

async function 불러오기() {
  try {
    const 글자 = await fs.readFile(저장파일, "utf-8");
    const 데이터 = JSON.parse(글자);

    문서들 = 데이터.문서들;
    다음번호 = 데이터.다음번호;
  } catch (에러) {
    if (에러.code === "ENOENT") {
      문서들 = [];
      다음번호 = 1;
      return;
    }

    throw 에러;
  }
}

async function 저장하기() {
  const 데이터 = {
    문서들,
    다음번호,
  };

  await fs.writeFile(저장파일, JSON.stringify(데이터, null, 2), "utf-8");
}
// ★ 여기에는 큰 문제가 있습니다. 미리 알고 가세요.
//
//   서버를 껐다 켜면 문서들이 처음 두 개로 돌아갑니다.
//   변수는 프로그램이 살아 있는 동안만 존재하기 때문입니다.
//
//   해결 순서는 이렇습니다.
//     ① 파일에 저장한다        → 02단원에서 배웠습니다. 아래 ✏️ 3번
//     ② 데이터베이스에 저장한다 → PART 4 에서 배웁니다. 진짜 해결책입니다.
//
//   지금 단계에서는 '서버가 어떻게 생겼는지' 에만 집중합니다.
//   저장 방법은 나중에 갈아 끼우면 됩니다. 그래서 이 순서로 배웁니다.

// ── 섹션 2: 응답 도우미 ──

function JSON응답(res, 상태코드, 데이터) {
  res.writeHead(상태코드, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(데이터));
}

// 204 는 '성공했지만 돌려줄 내용이 없다' 입니다. 본문을 아예 안 보냅니다.
// 그래서 Content-Type 도 붙이지 않습니다. 내용이 없으니 형식도 없습니다.
function 내용없음(res) {
  res.writeHead(204);
  res.end();
}

function 본문읽기(req) {
  return new Promise((resolve, reject) => {
    let 쌓은글자 = "";
    req.setEncoding("utf-8");
    req.on("data", (조각) => (쌓은글자 += 조각));
    req.on("end", () => resolve(쌓은글자));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  const 주소 = new URL(req.url, `http://${req.headers.host}`);
  const 경로 = 주소.pathname;

  // ── 섹션 3: 주소에서 번호 꺼내기 ──

  // 개념03 끝에서 말한 세 번째 불편함입니다.
  // /documents/1 에서 1 을 직접 잘라 내야 합니다.
  //
  //   "/documents/1".split("/")  →  [ '', 'documents', '1' ]
  //                                   ↑ 맨 앞이 빈 글자입니다
  //
  // 맨 앞 빈 글자가 거슬리니 filter 로 걸러 냅니다.
  // filter(Boolean) 은 "빈 글자·0·undefined 를 버려라" 라는 뜻입니다. (JS자료 06단원)

  const 조각들 = 경로.split("/").filter(Boolean);

  //   /documents      →  [ 'documents' ]              번호글자 = undefined
  //   /documents/1    →  [ 'documents', '1' ]         번호글자 = '1'

  const 첫조각 = 조각들[0];
  const 번호글자 = 조각들[1];

  if (첫조각 !== "documents") {
    JSON응답(res, 404, { error: "그런 주소가 없습니다" });
    return;
  }

  // 확인: GET /없는주소
  // 응답: 404 {"error":"그런 주소가 없습니다"}

  // ── 섹션 4: 목록 보기 (Read) ──

  // if (번호글자 === undefined && req.method === "GET") {
  //   const 종류 = 주소.searchParams.get("type");

  //   // 쿼리가 없으면 전부, 있으면 걸러서 돌려줍니다.
  //   // 쿼리는 '있어도 되고 없어도 되는 것' 에 씁니다. (개념01)
  //   const 결과 = 종류 ? 문서들.filter((문서) => 문서.type === 종류) : 문서들;

  //   JSON응답(res, 200, 결과);
  //   return;
  // }

  if (번호글자 === undefined && req.method === "GET") {
    const 종류 = 주소.searchParams.get("type");
    const 정렬 = 주소.searchParams.get("sort");
    const 검색어 = 주소.searchParams.get("q");

    let 결과 = 종류 ? 문서들.filter((문서) => 문서.type === 종류) : 문서들;

    if (정렬 === "desc") {
      결과 = [...결과].sort((a, b) => b.id - a.id);
    }
    if (검색어) {
      결과 = 결과.filter((문서) => 문서.title.includes(검색어));
    }
    JSON응답(res, 200, 결과);

    return;
  }
  // 확인: GET /documents
  // 응답: 200 [{"id":1,"title":"작업표준서","type":"표준"},{"id":2,"title":"검사성적서","type":"성적"}]

  // 확인: GET /documents?type=표준
  // 응답: 200 [{"id":1,"title":"작업표준서","type":"표준"}]

  // ★ 결과가 없어도 404 가 아닙니다.
  //   ?type=없는종류 로 요청하면 빈 배열 [] 과 200 이 나옵니다.
  //   "목록을 달라" 는 요청은 성공했고, 그 목록이 비어 있을 뿐입니다.
  //   빈 목록은 정상이지 에러가 아닙니다. 이걸 헷갈리는 사람이 아주 많습니다.

  // ── 섹션 5: 하나만 보기 ──

  if (번호글자 !== undefined && req.method === "GET") {
    // 주소에서 꺼낸 것은 언제나 글자입니다. 숫자로 바꿔야 합니다.
    const 번호 = Number(번호글자);

    // 숫자로 바꿀 수 없는 것이 올 수 있습니다. /documents/abc 처럼요.
    if (!Number.isInteger(번호)) {
      JSON응답(res, 400, { error: "번호는 숫자여야 합니다" });
      return;
    }

    // 확인: GET /documents/abc
    // 응답: 400 {"error":"번호는 숫자여야 합니다"}

    const 문서 = 문서들.find((문서) => 문서.id === 번호);

    // find 는 못 찾으면 undefined 를 줍니다. 반드시 확인해야 합니다.
    if (!문서) {
      JSON응답(res, 404, { error: `${번호}번 문서가 없습니다` });
      return;
    }

    // 확인: GET /documents/99
    // 응답: 404 {"error":"99번 문서가 없습니다"}

    JSON응답(res, 200, 문서);
    return;
  }

  // 확인: GET /documents/1
  // 응답: 200 {"id":1,"title":"작업표준서","type":"표준"}

  // ★ 여기가 목록과 결정적으로 다릅니다.
  //   "1번 문서를 달라" 했는데 없으면 그건 실패입니다. 404 가 맞습니다.
  //
  //   정리하면
  //     목록 요청 + 결과 0건  → 200 []       (성공, 비어 있음)
  //     개별 요청 + 못 찾음   → 404          (실패)

  // ── 섹션 6: 새로 만들기 (Create) ──

  if (번호글자 === undefined && req.method === "POST") {
    const 글자 = await 본문읽기(req);

    let 데이터;
    try {
      데이터 = JSON.parse(글자 || "{}");
    } catch {
      JSON응답(res, 400, { error: "JSON 형식이 아닙니다" });
      return;
    }

    // catch 뒤의 (에러) 를 생략했습니다. 안 쓸 거라면 빼도 됩니다.

    if (!데이터.title) {
      JSON응답(res, 400, { error: "title 을 넣어 주세요" });
      return;
    }

    // 확인: POST /documents {"type":"점검"}
    // 응답: 400 {"error":"title 을 넣어 주세요"}

    const 새문서 = {
      id: 다음번호,
      title: 데이터.title,
      type: 데이터.type || "기타", // 안 주면 기본값
    };

    다음번호 += 1;
    문서들.push(새문서);
    await 저장하기();
    // 201 은 '만들었다' 입니다. 200 이 아닙니다. (개념02)
    // Location 헤더로 "만든 것은 이 주소에 있다" 를 알려 주는 게 예의입니다.
    res.writeHead(201, {
      "Content-Type": "application/json; charset=utf-8",
      Location: `/documents/${새문서.id}`,
    });
    res.end(JSON.stringify(새문서));
    return;
  }

  // 직접 해보기 새문서를 만들어 추가해 보세요.

  // 확인: POST /documents {"title":"설비점검표","type":"점검"}
  // 응답: 201 {"id":3,"title":"설비점검표","type":"점검"}

  // ★ 만든 것을 그대로 돌려주는 이유
  //   보낸 쪽은 id 를 모릅니다. 서버가 정해 주니까요.
  //   돌려주지 않으면 화면을 새로 그리려고 목록을 또 불러와야 합니다.
  //   만든 결과를 돌려주면 요청 한 번을 아낍니다. 습관처럼 돌려주세요.

  // ── 섹션 7: 고치기 (Update) ──

  if (번호글자 !== undefined && req.method === "PUT") {
    const 번호 = Number(번호글자);
    const 문서 = 문서들.find((문서) => 문서.id === 번호);

    if (!문서) {
      JSON응답(res, 404, { error: `${번호}번 문서가 없습니다` });
      return;
    }

    const 글자 = await 본문읽기(req);
    let 데이터;
    try {
      데이터 = JSON.parse(글자 || "{}");
    } catch {
      JSON응답(res, 400, { error: "JSON 형식이 아닙니다" });
      return;
    }

    // 온 것만 바꿉니다. 안 온 것은 그대로 둡니다.
    // ?? 는 "왼쪽이 null 이나 undefined 일 때만 오른쪽" 입니다. (JS자료 09단원)
    문서.title = 데이터.title ?? 문서.title;
    문서.type = 데이터.type ?? 문서.type;
    await 저장하기();
    JSON응답(res, 200, 문서);
    return;
  }

  // 확인: PUT /documents/3 {"title":"설비점검표(개정)"}
  // 응답: 200 {"id":3,"title":"설비점검표(개정)","type":"점검"}

  // type 을 안 보냈는데 "점검" 이 그대로 남아 있는 것을 보세요.
  //
  // ★ 왜 || 가 아니라 ?? 인가
  //   title 을 빈 글자 "" 로 보내면 || 는 이걸 '없는 값' 으로 보고 무시합니다.
  //   ?? 는 null/undefined 만 없는 값으로 봅니다. "" 는 통과시킵니다.
  //   "일부러 빈 값으로 고치고 싶다" 를 살리려면 ?? 여야 합니다.
  //   숫자 0 을 다룰 때도 똑같은 함정이 있습니다.

  // ── 섹션 8: 지우기 (Delete) ──

  if (번호글자 !== undefined && req.method === "DELETE") {
    const 번호 = Number(번호글자);
    const 있나 = 문서들.some((문서) => 문서.id === 번호);

    if (!있나) {
      JSON응답(res, 404, { error: `${번호}번 문서가 없습니다` });
      return;
    }

    // filter 는 '남길 것' 을 고릅니다. 지울 것을 빼고 새 배열을 만듭니다.
    문서들 = 문서들.filter((문서) => 문서.id !== 번호);
    await 저장하기();
    // 지웠으니 돌려줄 내용이 없습니다. 204 입니다.
    내용없음(res);
    return;
  }

  // 확인: DELETE /documents/3
  // 응답: 204

  // ★ 문서들 을 let 으로 선언한 이유가 여기 있습니다.
  //   filter 는 원본을 안 바꾸고 새 배열을 줍니다.
  //   그 새 배열을 다시 담아야 하므로 const 로는 안 됩니다.
  //
  //   splice 로 원본에서 빼내는 방법도 있지만,
  //   "새로 만들어 갈아 끼우기" 가 실수가 적습니다. (React 에서도 이 방식입니다)

  // ── 섹션 9: 경로는 맞는데 메서드가 다른 경우 ──

  JSON응답(res, 405, { error: "이 주소에서는 쓸 수 없는 방법입니다" });

  // 확인: PATCH /documents
  // 응답: 405 {"error":"이 주소에서는 쓸 수 없는 방법입니다"}
});

async function 시작하기() {
  await 불러오기();

  server.listen(PORT, () => {
    console.log(`서버가 켜졌습니다. http://localhost:${PORT}/documents`);
  });
}

시작하기();
// ── 지우고 나서 목록을 다시 보면 ──
//
// 3번을 지웠으니 처음 두 개만 남아 있습니다.
//
// 확인: GET /documents
// 응답: 200 [{"id":1,"title":"작업표준서","type":"표준"},{"id":2,"title":"검사성적서","type":"성적"}]
//
// 다음번호 는 4 인 채로 남아 있습니다. 3 으로 되돌리지 않습니다.
// 지워진 번호를 재활용하면 옛날 기록과 헷갈리기 때문입니다.
// (02단원 연습문제 14에서 본 것과 같은 이야기입니다)

// ============================================================
// Postman 으로 순서대로 해 보기
// ============================================================
//
// 아래를 위에서부터 차례로 눌러 보세요. 서버는 켜 둔 채로 합니다.
//
//   1  GET    http://localhost:3000/documents              2건
//   2  POST   http://localhost:3000/documents              201, id 3
//              Body → raw → JSON
//              { "title": "설비점검표", "type": "점검" }
//   3  GET    http://localhost:3000/documents              3건으로 늘어남
//   4  GET    http://localhost:3000/documents/3            방금 만든 것
//   5  PUT    http://localhost:3000/documents/3            제목만 바뀜
//              { "title": "설비점검표(개정)" }
//   6  DELETE http://localhost:3000/documents/3            204, 본문 없음
//   7  GET    http://localhost:3000/documents              다시 2건
//   9  GET    http://localhost:3000/documents?sort=desc
//   8  Ctrl+C 로 서버를 끄고 다시 켠 뒤 1번을 다시                다시 2건
//
// 8번이 오늘의 마지막 교훈입니다.
// 2번에서 만든 문서는 서버를 끄는 순간 사라집니다.
// 그래서 데이터베이스가 필요합니다.

// ============================================================
// 직접 해 볼 것
// ============================================================
//
// ✏️ 직접 해보기 1 — 목록에 정렬을 추가해 보세요.
//                    ?sort=desc 이면 id 가 큰 것부터 나오게 합니다.
//                    (힌트: [...문서들].sort((a, b) => b.id - a.id)
//                     원본을 정렬하면 진짜로 순서가 바뀌어 버립니다.
//                     복사본을 만들어 정렬하세요)
//
// ✏️ 직접 해보기 2 — 제목 검색을 추가해 보세요.
//                    ?q=표준 이면 title 에 '표준' 이 든 것만 나오게 합니다.
//                    (힌트: includes)
//
// ✏️ 직접 해보기 3 — ★ 이번 단원의 진짜 과제입니다.
//                    문서들 을 파일에 저장해서, 서버를 껐다 켜도 남게 만드세요.
//
//                      · 02단원 개념05 의 불러오기/저장하기를 그대로 씁니다
//                      · 서버가 켜질 때 documents.json 을 읽어 문서들 에 담고
//                      · POST / PUT / DELETE 마다 다시 저장합니다
//                      · 파일이 없으면 빈 배열로 시작해야 합니다 (ENOENT)
//                      · 다음번호 도 저장해야 합니다. 안 하면 껐다 켤 때
//                        번호가 처음부터 다시 시작해 겹칩니다
//
//                    다 만들었으면 위 8번 시나리오를 다시 해 보세요.
//                    이번에는 서버를 껐다 켜도 3번 문서가 남아 있어야 합니다.
//
// ✏️ 직접 해보기 4 — 지금 이 서버는 두 사람이 동시에 POST 하면 어떻게 될까요?
//                    ✏️3 을 파일로 만들었다면 무슨 일이 생길까요?
//                    (02단원 개념05 마지막에 적힌 네 가지 이유를 다시 읽어 보세요)

// ── 자주 하는 실수 ──

// [실수 1] 주소에서 꺼낸 번호를 숫자로 안 바꿈
//   문서들.find((문서) => 문서.id === 번호글자)
//   → 1 === "1" 은 false 입니다. 영원히 못 찾습니다.
//   경로에서 나온 것도 쿼리에서 나온 것도 전부 글자입니다. Number() 를 거치세요.

// [실수 2] find 결과를 확인 안 하고 바로 씀
//   const 문서 = 문서들.find(...);
//   문서.title            ← 못 찾았으면 undefined 입니다
//   → TypeError: Cannot read properties of undefined
//   → 서버가 죽습니다. find 뒤에는 항상 if (!문서) 를 붙이세요.

// [실수 3] 만든 뒤 200 을 돌려줌
//   틀린 건 아니지만 201 이 정확합니다. Location 헤더도 함께 주세요.

// [실수 4] 204 에 본문을 담음
//   res.writeHead(204); res.end("지웠습니다");
//   → 204 는 '내용 없음' 이라는 약속이라 이 글자는 버려집니다.
//   메시지를 주고 싶으면 200 에 담아 보내세요.

// [실수 5] 목록이 비었다고 404 를 줌
//   빈 배열은 정상입니다. 200 에 [] 를 담아 주세요.
//   프론트가 "에러다!" 하고 빨간 화면을 띄우게 됩니다.

// [실수 6] 문서들 을 const 로 선언하고 filter 로 삭제하려 함
//   → TypeError: Assignment to constant variable.
//   배열 자체를 갈아 끼울 거라면 let 이어야 합니다.

// [실수 7] PUT 에서 받은 데이터를 통째로 덮어씀
//   문서들[번호] = 데이터
//   → 보낸 쪽이 title 만 보냈다면 id 와 type 이 통째로 사라집니다.
//   속성 하나씩 골라 덮으세요.

// ── 정리 ──

// 1. CRUD 는 만들기·읽기·고치기·지우기 넷이다. 세상의 거의 모든 서버가 이 넷을 한다.
// 2. 주소에서 꺼낸 번호는 글자다. Number 로 바꿔야 find 가 맞는다.
// 3. find 는 못 찾으면 undefined 다. 확인하고 없으면 404 를 준다.
// 4. 목록은 결과가 비어도 404 가 아니다. 빈 배열에 200 이다.
//    '하나만 보기' 와 결정적으로 다른 점이다.
// 5. 새로 만들면 201 을 주고, 만든 것을 그대로 돌려준다.
//    번호가 몇 번으로 붙었는지 부른 쪽이 알아야 하기 때문이다.
// 6. 지우면 204 를 주고 본문을 담지 않는다. 204 는 '내용 없음' 이라는 뜻이다.
// 7. PUT 은 받은 것만 갈아 끼운다. 통째로 덮으면 안 보낸 값이 사라진다.
//    없으면 원래 값을 쓰도록 ?? 를 쓴다. || 는 0 과 "" 까지 갈아 끼워서 안 된다.
// 8. 배열에서 지우려면 let 으로 선언해야 한다. filter 는 새 배열을 돌려주기 때문이다.
// 9. 메모리에 담은 데이터는 서버를 끄면 사라진다. 07단원에서 파일로 옮긴다.
