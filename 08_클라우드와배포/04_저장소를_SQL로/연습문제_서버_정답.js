// ============================================================
// 04단원 연습문제 정답 (서버) — 목록 API 에 필터·정렬·페이지 붙이기
// ------------------------------------------------------------
// 실행: node 연습문제_서버_정답.js
//       끄려면 Ctrl + C
// ============================================================
//
// 서버.js 의 GET /equipments 는 설비를 전부 돌려줍니다.
// 여기에 필터·정렬·페이지를 붙이는 것이 이 문제입니다.
//
// 먼저 스스로 만들어 본 다음에 보세요. 설명을 꼭 읽으세요.

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

const DB경로 = path.join(폴더, "연습정답.db");
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
  let limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1) limit = 3;
  if (limit > 5) limit = 5;

  let page = Number(query.page);
  if (!Number.isInteger(page) || page < 1) page = 1;

  return { limit, page, offset: (page - 1) * limit };
}

// ★★ 네 가지를 다 챙겨야 합니다. 하나라도 빠지면 확인 항목에서 걸립니다.
//
//   Number(...)           글자로 오니까
//   Number.isInteger      "5.5" 를 걸러 냅니다
//   < 1                   LIMIT -1 은 전부 돌려줍니다 (개념03)
//   > 5                   ?limit=999 를 막습니다


// ───── 문제 2 ───── (개념04)
// 조건을 조립하는 함수를 만드세요.
//   line   A B C 중 하나일 때만 붙입니다 (아니면 무시)
//   status 가동 정지 점검중 중 하나일 때만 붙입니다
//   q      name LIKE ? — % 는 값 쪽에, ESCAPE '\' 를 붙이세요
//
// 힌트: 검색어의 % _ \ 는 이스케이프하세요.

function 검색어다듬기(글자) {
  // \ 를 먼저 바꿔야 합니다. 순서를 바꾸면 이중으로 바뀝니다.
  return String(글자).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const 라인값들 = ["A", "B", "C"];
const 상태값들 = ["가동", "정지", "점검중"];

function 조건조립(query) {
  const 조건들 = [];
  const 값들 = [];

  if (라인값들.includes(query.line)) {
    조건들.push("line = ?");
    값들.push(query.line);
  }

  if (상태값들.includes(query.status)) {
    조건들.push("status = ?");
    값들.push(query.status);
  }

  if (query.q) {
    조건들.push("name LIKE ? ESCAPE '\\'");
    값들.push(`%${검색어다듬기(query.q)}%`);
  }

  return {
    WHERE: 조건들.length > 0 ? `WHERE ${조건들.join(" AND ")}` : "",
    값들,
  };
}

// ★★ 조건과 값을 따로 모으는 것이 전부입니다.
//   SQL 에 붙는 건 "line = ?" 처럼 내가 쓴 글자뿐입니다.
//
// ★ includes 로 걸렀습니다. line=Z 는 조건이 안 붙어서 전체가 나옵니다.
//   400 을 내는 쪽이 나을 수도 있습니다. (개념04 의 5-2)
//   여기서는 무시하는 쪽으로 정했습니다.
//
// ★ % 는 값 쪽에 붙였습니다. "name LIKE '%?%'" 는 동작하지 않습니다.


// ───── 문제 3 ───── (개념04)
// 정렬을 안전하게 조립하세요.
//   허용: id, name, line, 온도
//   방향: asc / desc (그 외는 asc)
//   마지막은 id ASC 로 끝냅니다

const 정렬가능 = { id: "id", name: "name", line: "line", 온도: "온도" };

function 정렬조립(sort, order) {
  const 칸 = Object.hasOwn(정렬가능, sort ?? "") ? 정렬가능[sort] : "id";
  const 방향 = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  return 칸 === "id" ? `id ${방향}` : `${칸} ${방향}, id ASC`;
}

// ★★★ 허용 목록에 없으면 id 로 떨어집니다.
//   sort=name;DROP-TABLE-설비 가 와도 SQL 에 닿지 않습니다.
//   (확인 항목의 주소에 공백을 안 쓴 이유: 검증 도구가 공백 뒤를 본문으로 읽습니다)
//
// ★ 마지막을 id ASC 로 끝냈습니다. 안 하면 같은 줄이 두 쪽에 나옵니다. (개념03)
//
// ★ String(order) — order 가 없으면 undefined.toLowerCase() 로 터집니다.


// ───── 문제 4 ───── (개념03, 04)
// 위 세 개를 써서 목록 API 를 완성하세요.
// 응답 모양은 아래 '확인:' 주석을 그대로 따라야 합니다.
//
// ★ 개수 조회와 목록 조회에 같은 WHERE·같은 값을 쓰세요.

app.get("/equipments", (req, res) => {
  const { WHERE, 값들 } = 조건조립(req.query);
  const 정렬 = 정렬조립(req.query.sort, req.query.order);
  const { limit, page, offset } = 쪽정보다듬기(req.query);

  // ★★ 같은 WHERE 와 같은 값들을 두 조회에 씁니다.
  //   따로 만들면 조건을 추가할 때 한쪽만 고쳐서 숫자가 어긋납니다.
  const 전체개수 = db.prepare(`SELECT COUNT(*) AS n FROM 설비 ${WHERE}`).get(...값들).n;

  const 항목들 = db.prepare(`
    SELECT id, name FROM 설비
    ${WHERE}
    ORDER BY ${정렬}
    LIMIT ? OFFSET ?
  `).all(...값들, limit, offset);

  res.json({
    data: 항목들,
    meta: {
      page,
      limit,
      total: 전체개수,
      totalPages: Math.ceil(전체개수 / limit),
    },
  });
});

// ★ SELECT 에 id, name 만 적었습니다. 확인 항목의 응답이 그 모양이니까요.
//   실무에서도 목록에는 필요한 칸만 담습니다. 상세는 GET /equipments/:id 에서.

// 확인: GET /equipments
// 응답: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}

// 확인: GET /equipments?page=3
// 응답: 200 {"data":[{"id":7,"name":"검사기 1호"}],"meta":{"page":3,"limit":3,"total":7,"totalPages":3}}

// 확인: GET /equipments?line=B
// 응답: 200 {"data":[{"id":4,"name":"프레스 2호"},{"id":5,"name":"컨베이어 1호"},{"id":6,"name":"컨베이어 2호"}],"meta":{"page":1,"limit":3,"total":3,"totalPages":1}}

// 확인: GET /equipments?line=A&status=가동
// 응답: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":2,"totalPages":1}}

// 확인: GET /equipments?q=컨베이어
// 응답: 200 {"data":[{"id":5,"name":"컨베이어 1호"},{"id":6,"name":"컨베이어 2호"}],"meta":{"page":1,"limit":3,"total":2,"totalPages":1}}

// 확인: GET /equipments?sort=온도&order=desc&limit=2
// 응답: 200 {"data":[{"id":3,"name":"프레스 1호"},{"id":4,"name":"프레스 2호"}],"meta":{"page":1,"limit":2,"total":7,"totalPages":4}}

// ★ 온도가 NULL 인 컨베이어 2호는 DESC 정렬에서 맨 뒤로 갑니다.
//   SQLite 는 NULL 을 가장 작은 값으로 봅니다.

// 확인: GET /equipments?limit=-1
// 응답: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}

// ★ limit=-1 이 기본값 3 으로 떨어져야 합니다.
//   안 막으면 7건 전부 나옵니다. (개념03 에서 확인한 것)

// 확인: GET /equipments?limit=999
// 응답: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"},{"id":4,"name":"프레스 2호"},{"id":5,"name":"컨베이어 1호"}],"meta":{"page":1,"limit":5,"total":7,"totalPages":2}}

// 확인: GET /equipments?line=Z
// 응답: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}

// ★ 없는 라인은 무시하고 전체를 줍니다. (개념04 의 ① 방식)

// 확인: GET /equipments?sort=name;DROP-TABLE-설비
// 응답: 200 {"data":[{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"용접로봇 2호"},{"id":3,"name":"프레스 1호"}],"meta":{"page":1,"limit":3,"total":7,"totalPages":3}}


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
  if (db.isTransaction) return 하기();

  db.exec("BEGIN");
  try {
    const 결과 = 하기();
    db.exec("COMMIT");
    return 결과;
  } catch (에러) {
    db.exec("ROLLBACK");
    throw 에러;
  }
}

// ★★ catch 의 ROLLBACK 을 빼먹으면 트랜잭션이 열린 채로 남습니다.
//   그 뒤 모든 요청이 "cannot start a transaction within a transaction" 으로 죽습니다.
//   서버검증을 돌리면 두 번째 요청부터 전부 실패해서 바로 드러납니다.

app.post("/equipments/:id/checks", (req, res) => {
  const 설비id = Number(req.params.id);
  const 결과 = (req.body || {}).결과;

  // ── 검증을 먼저 (트랜잭션 밖에서) ──
  if (결과 !== "정상" && 결과 !== "이상") {
    return res.status(400).json({
      error: { code: "VALIDATION_FAILED", message: "결과는 정상 또는 이상이어야 합니다" },
    });
  }

  const 설비 = db.prepare("SELECT id, status FROM 설비 WHERE id = ?").get(설비id);

  if (!설비) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "설비를 찾을 수 없습니다" },
    });
  }

  // ── 두 표를 같이 바꾸는 부분만 트랜잭션으로 ──
  const 만든것 = 한묶음으로(() => {
    const 점검 = db.prepare(`
      INSERT INTO 점검 (설비id, 결과) VALUES (?, ?) RETURNING id
    `).get(설비id, 결과);

    if (결과 === "이상") {
      db.prepare("UPDATE 설비 SET status = ? WHERE id = ?").run("점검중", 설비id);
    }

    const 지금 = db.prepare("SELECT status FROM 설비 WHERE id = ?").get(설비id);

    return { 점검id: 점검.id, 설비상태: 지금.status };
  });

  res.status(201).json({ data: 만든것 });
});

// ★★★ 순서가 중요합니다.
//
//   ① 검증 (400)          트랜잭션 밖
//   ② 있는지 확인 (404)    트랜잭션 밖
//   ③ 두 표 고치기         트랜잭션 안
//
//   400·404 를 트랜잭션 안에서 처리하면 열고 바로 닫는 낭비가 생깁니다.
//   그리고 res.json 을 트랜잭션 안에서 부르면 안 됩니다.
//
// ★★ 트랜잭션 안에 await 가 하나도 없습니다. (개념05)
//   전부 동기 DB 호출입니다. 그래서 중간에 다른 요청이 끼어들 수 없습니다.
//
// ★ 400·404 인 요청은 점검을 하나도 안 남깁니다.
//   GET /checks/count 가 2 인 것으로 확인합니다.
//   INSERT 를 검증보다 먼저 하면 4 가 나옵니다.

// 확인: POST /equipments/1/checks {"결과":"정상"}
// 응답: 201 {"data":{"점검id":1,"설비상태":"가동"}}

// ★ 정상 점검이면 설비 상태를 안 바꿉니다.

// 확인: POST /equipments/1/checks {"결과":"이상"}
// 응답: 201 {"data":{"점검id":2,"설비상태":"점검중"}}

// ★ 이상 점검이면 점검중으로 바뀝니다. 두 표가 같이 바뀌었습니다.

// 확인: POST /equipments/9999/checks {"결과":"정상"}
// 응답: 404 {"error":{"code":"NOT_FOUND","message":"설비를 찾을 수 없습니다"}}

// 확인: POST /equipments/1/checks {"결과":"몰라요"}
// 응답: 400 {"error":{"code":"VALIDATION_FAILED","message":"결과는 정상 또는 이상이어야 합니다"}}

// 확인: GET /checks/count
// 응답: 200 {"data":{"전체":2}}

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
