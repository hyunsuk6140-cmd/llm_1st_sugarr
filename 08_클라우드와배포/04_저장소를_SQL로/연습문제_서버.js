// ============================================================
// 04단원 연습문제 (서버) — 목록 API 에 필터·정렬·페이지 붙이기
// ------------------------------------------------------------
// 실행: node 연습문제_서버.js
//       끄려면 Ctrl + C
// ============================================================
//
// 서버.js 의 GET /equipments 는 설비를 전부 돌려줍니다.
// 여기에 필터·정렬·페이지를 붙이는 것이 이 문제입니다.
//
// 아래 '요청:' / '이렇게:' 주석이 요구사항입니다. 전부 그렇게 동작해야 합니다.
//
// 확인하는 방법
//   ① 서버를 켜고 브라우저나 curl 로 직접 눌러 봅니다
//   ② 다 만들었으면 연습문제_서버_정답.js 와 비교해 보세요
//      정답 파일에는 '확인:' 선언이 있어서 이렇게 기계로 확인됩니다.
//
//        node _검증도구/서버검증.js 04_저장소를_SQL로
//
//      이 파일에는 일부러 '확인:' 을 안 뒀습니다.
//      아직 안 만든 상태로 검증을 돌리면 전부 실패로 나와서 시끄럽습니다.
//
// [준비] 표와 자료는 만들어 뒀습니다. TODO 만 채우세요.

const express = require("express");
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// ── DB 준비 (그대로 두세요) ──

const 폴더 = path.join(__dirname, "data");
fs.mkdirSync(폴더, { recursive: true });

const DB경로 = path.join(폴더, "연습.db");
fs.rmSync(DB경로, { force: true });
fs.rmSync(`${DB경로}-wal`, { force: true });
fs.rmSync(`${DB경로}-shm`, { force: true });

const db = new DatabaseSync(DB경로, { timeout: 5000 });
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE 설비 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT    NOT NULL UNIQUE,
    line   TEXT    NOT NULL CHECK (line IN ('A', 'B', 'C')),
    status TEXT    NOT NULL DEFAULT '정지'
                   CHECK (status IN ('가동', '정지', '점검중')),
    온도   REAL
  ) STRICT
`);

db.exec("CREATE INDEX 설비_line ON 설비(line)");

db.exec(`
  INSERT INTO 설비 (name, line, status, 온도) VALUES
    ('용접로봇 1호', 'A', '가동',   36.5),
    ('용접로봇 2호', 'A', '정지',   35.1),
    ('프레스 1호',   'A', '가동',   41.2),
    ('프레스 2호',   'B', '점검중', 39.8),
    ('컨베이어 1호', 'B', '가동',   25.0),
    ('컨베이어 2호', 'B', '정지',   NULL),
    ('검사기 1호',   'C', '가동',   22.4)
`);


// ───── 문제 1 ───── (개념03)
// 쪽 정보를 다듬는 함수를 만드세요.
//   limit 기본 3, 최소 1, 최대 5, 정수만
//   page  기본 1, 최소 1, 정수만
//
// ★ 수업용으로 작게 잡았습니다. 실무에서는 20 / 100 정도를 씁니다.

function 쪽정보다듬기(query) {
  // TODO: { limit, page, offset } 을 돌려주세요
}


// ───── 문제 2 ───── (개념04)
// 조건을 조립하는 함수를 만드세요.
//   line   A B C 중 하나일 때만 붙입니다 (아니면 무시)
//   status 가동 정지 점검중 중 하나일 때만 붙입니다
//   q      name LIKE ? — % 는 값 쪽에, ESCAPE '\' 를 붙이세요
//
// 힌트: 검색어의 % _ \ 는 이스케이프하세요.

function 검색어다듬기(글자) {
  // TODO
}

function 조건조립(query) {
  // TODO: { WHERE, 값들 } 을 돌려주세요
}


// ───── 문제 3 ───── (개념04)
// 정렬을 안전하게 조립하세요.
//   허용: id, name, line, 온도
//   방향: asc / desc (그 외는 asc)
//   마지막은 id ASC 로 끝냅니다

function 정렬조립(sort, order) {
  // TODO
}


// ───── 문제 4 ───── (개념03, 04)
// 위 세 개를 써서 목록 API 를 완성하세요.
// 응답 모양은 아래 '이렇게:' 주석을 그대로 따라야 합니다.
//
// ★ 개수 조회와 목록 조회에 같은 WHERE·같은 값을 쓰세요.

app.get("/equipments", (req, res) => {
  // TODO: 여기에 코드를 쓰세요
  res.json({ data: [], meta: {} });
});

// 요청: GET /equipments
// 이렇게: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}

// 요청: GET /equipments?page=3
// 이렇게: 200 {"data":[{"id":7,"name":"검사기 1호"}],"meta":{"page":3,"limit":3,"total":7,"totalPages":3}}

// 요청: GET /equipments?line=B
// 이렇게: 200 {"data":[{"id":4,"name":"프레스 2호"},{"id":5,"name":"컨베이어 1호"},{"id":6,"name":"컨베이어 2호"}],"meta":{"page":1,"limit":3,"total":3,"totalPages":1}}

// 요청: GET /equipments?line=A&status=가동
// 이렇게: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":2,"totalPages":1}}

// 요청: GET /equipments?q=컨베이어
// 이렇게: 200 {"data":[{"id":5,"name":"컨베이어 1호"},{"id":6,"name":"컨베이어 2호"}],"meta":{"page":1,"limit":3,"total":2,"totalPages":1}}

// 요청: GET /equipments?sort=온도&order=desc&limit=2
// 이렇게: 200 {"data":[{"id":3,"name":"프레스 1호"},{"id":4,"name":"프레스 2호"}],"meta":{"page":1,"limit":2,"total":7,"totalPages":4}}

// ★ 온도가 NULL 인 컨베이어 2호는 DESC 정렬에서 맨 뒤로 갑니다.
//   SQLite 는 NULL 을 가장 작은 값으로 봅니다.

// 요청: GET /equipments?limit=-1
// 이렇게: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}

// ★ limit=-1 이 기본값 3 으로 떨어져야 합니다.
//   안 막으면 7건 전부 나옵니다. (개념03 에서 확인한 것)

// 요청: GET /equipments?limit=999
// 이렇게: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"},{"id":4,"name":"프레스 2호"},{"id":5,"name":"컨베이어 1호"}],"meta":{"page":1,"limit":5,"total":7,"totalPages":2}}

// 요청: GET /equipments?line=Z
// 이렇게: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}

// ★ 없는 라인은 무시하고 전체를 줍니다. (개념04 의 ① 방식)

// 요청: GET /equipments?sort=name;DROP-TABLE-설비
// 이렇게: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}


// ───── 문제 5 ───── (개념05)
// 점검을 기록하는 API 를 만드세요.
//   점검 표에 기록하고
//   결과가 '이상' 이면 설비를 '점검중' 으로 바꿉니다
//   둘 다 되거나 둘 다 안 되어야 합니다
//   없는 설비면 404
//
// 힌트: 한묶음으로 를 만들어서 감싸세요. isTransaction 으로 겹침을 막으세요.

db.exec(`
  CREATE TABLE 점검 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    설비id INTEGER NOT NULL REFERENCES 설비(id),
    결과   TEXT    NOT NULL CHECK (결과 IN ('정상', '이상'))
  ) STRICT
`);

function 한묶음으로(하기) {
  // TODO
}

app.post("/equipments/:id/checks", (req, res) => {
  // TODO: 여기에 코드를 쓰세요
  res.status(500).json({ error: "아직 안 만들었습니다" });
});

// 요청: POST /equipments/1/checks {"결과":"정상"}
// 이렇게: 201 {"data":{"점검id":1,"설비상태":"가동"}}

// ★ 정상 점검이면 설비 상태를 안 바꿉니다.

// 요청: POST /equipments/1/checks {"결과":"이상"}
// 이렇게: 201 {"data":{"점검id":2,"설비상태":"점검중"}}

// ★ 이상 점검이면 점검중으로 바뀝니다. 두 표가 같이 바뀌었습니다.

// 요청: POST /equipments/9999/checks {"결과":"정상"}
// 이렇게: 404 {"error":{"code":"NOT_FOUND","message":"설비를 찾을 수 없습니다"}}

// 요청: POST /equipments/1/checks {"결과":"몰라요"}
// 이렇게: 400 {"error":{"code":"VALIDATION_FAILED","message":"결과는 정상 또는 이상이어야 합니다"}}

// 요청: GET /checks/count
// 이렇게: 200 {"data":{"전체":2}}

// ★ 잘못된 요청 두 건이 아무것도 안 남겼는지 확인하는 용도입니다.
//   400 이나 404 인데 점검이 기록됐다면 3 이나 4 가 나옵니다.

app.get("/checks/count", (req, res) => {
  res.json({ data: { 전체: db.prepare("SELECT COUNT(*) AS n FROM 점검").get().n } });
});


// ── 없는 주소 · 에러 처리기 (그대로 두세요) ──

app.use((req, res) => {
  res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: "그런 주소가 없습니다" } });
});

app.use((err, req, res, next) => {
  console.error("[처리 못한 에러]", err.message);
  res.status(500).json({ error: { code: "INTERNAL", message: "서버에서 문제가 생겼습니다" } });
});

app.listen(PORT, () => {
  console.log(`서버가 켜졌습니다.  http://localhost:${PORT}/equipments`);
});
