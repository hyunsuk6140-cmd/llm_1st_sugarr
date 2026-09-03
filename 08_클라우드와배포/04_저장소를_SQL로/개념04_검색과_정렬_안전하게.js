// ============================================================
// 개념 04 — 검색·정렬 조건을 안전하게 조립하기
// ============================================================
//
// 목록 화면에는 보통 이런 것들이 붙습니다.
//
//   GET /equipments?line=A&status=가동&q=프레스&sort=name&order=desc&page=2
//
// 조건이 올 때도 있고 안 올 때도 있습니다.
// 조건 개수만큼 SQL 을 미리 만들어 둘 수는 없습니다. 2의 n승 개가 됩니다.
//
// 그래서 조립해야 합니다. 그런데 조립하다가 인젝션이 생깁니다.
// 안전하게 조립하는 방법을 정리합니다.
//
// 실행: node 개념04_검색과_정렬_안전하게.js
// ============================================================

const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE 설비 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT    NOT NULL UNIQUE,
    line   TEXT    NOT NULL,
    status TEXT    NOT NULL,
    온도   REAL
  ) STRICT
`);

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

// ============================================================
// 1. 안 되는 방법 — 이어 붙이기
// ============================================================
//
// 처음에는 이렇게 짜기 쉽습니다.

function 위험한검색(query) {
  let sql = "SELECT id, name FROM 설비 WHERE 1 = 1";

  if (query.line) sql += ` AND line = '${query.line}'`;
  if (query.q) sql += ` AND name LIKE '%${query.q}%'`;

  return db.prepare(sql).all();
}

console.log("정상 요청:", JSON.stringify(위험한검색({ line: "A" }).map((행) => 행.name)));
// 출력: 정상 요청: ["용접로봇 1호","용접로봇 2호","프레스 1호"]

console.log("검색어:", JSON.stringify(위험한검색({ q: "프레스" }).map((행) => 행.name)));
// 출력: 검색어: ["프레스 1호","프레스 2호"]

// 잘 동작합니다. 그런데 이런 요청이 오면요.

const 공격 = 위험한검색({ line: "A' OR '1'='1" });
console.log("공격 결과:", 공격.length, "건");
// 출력: 공격 결과: 7 건

// A 라인만 물어봤는데 7건 전부 나왔습니다. (02단원 개념03 의 그 인젝션입니다)
//
// ★ WHERE 1 = 1 은 "AND 를 붙이기 편하게" 쓰는 관례입니다.
//   그 자체는 문제가 없습니다. 문제는 값을 이어 붙인 것입니다.

// ============================================================
// 2. 되는 방법 — 조건과 값을 따로 모으기
// ============================================================

function 안전한검색(query) {
  const 조건들 = [];
  const 값들 = [];

  if (query.line) {
    조건들.push("line = ?");
    값들.push(query.line);
  }

  if (query.status) {
    조건들.push("status = ?");
    값들.push(query.status);
  }

  if (query.q) {
    조건들.push("name LIKE ?");
    값들.push(`%${query.q}%`); // ★ % 는 값 쪽에 붙입니다
  }

  const WHERE = 조건들.length > 0 ? `WHERE ${조건들.join(" AND ")}` : "";

  return db.prepare(`
    SELECT id, name, line, status FROM 설비
    ${WHERE}
    ORDER BY id
  `).all(...값들);
}

console.log("조건 없음:", 안전한검색({}).length, "건");
// 출력: 조건 없음: 7 건
console.log("line=A:", JSON.stringify(안전한검색({ line: "A" }).map((행) => 행.name)));
// 출력: line=A: ["용접로봇 1호","용접로봇 2호","프레스 1호"]
console.log("두 조건:", JSON.stringify(안전한검색({ line: "A", status: "가동" }).map((행) => 행.name)));
// 출력: 두 조건: ["용접로봇 1호","프레스 1호"]
console.log("검색어:", JSON.stringify(안전한검색({ q: "컨베이어" }).map((행) => 행.name)));
// 출력: 검색어: ["컨베이어 1호","컨베이어 2호"]
console.log("공격:", 안전한검색({ line: "A' OR '1'='1" }).length, "건");
// 출력: 공격: 0 건

// ★★ 핵심 두 가지
//
//   ① 조건은 배열에, 값은 다른 배열에 모읍니다.
//      두 배열의 순서가 짝을 이룹니다. 그래서 ? 자리가 맞습니다.
//
//   ② SQL 에 이어 붙이는 건 `line = ?` 같은 **내가 쓴 글자**뿐입니다.
//      사용자 값은 절대 문장에 안 들어갑니다.
//
// ★ 조건이 없으면 WHERE 자체를 안 붙입니다.
//   WHERE 만 남으면 문법 오류가 납니다.
//   (WHERE 1 = 1 을 쓰면 이 처리를 안 해도 되지만, 위 방식이 더 명확합니다)
//
// ★★ % 를 값에 붙인 이유 (아주 흔한 실수)
//
//     ✗  조건들.push("name LIKE '%?%'")   ← ? 가 글자로 취급됩니다
//     ○  조건들.push("name LIKE ?"); 값들.push(`%${query.q}%`)
//
//   전자는 오류도 안 나고 결과만 안 나옵니다. 원인 찾기가 어렵습니다.

// ============================================================
// 3. ★ 검색어에 % 나 _ 가 들어오면
// ============================================================

db.prepare("INSERT INTO 설비 (name, line, status) VALUES (?, ?, ?)").run("50%_할인기", "C", "정지");

console.log("'%' 로 검색:", 안전한검색({ q: "%" }).length, "건");
// 출력: '%' 로 검색: 8 건

// ★★ 8건 전부 나왔습니다. % 가 "아무 글자든" 이라는 뜻으로 읽혔기 때문입니다.
//
//   자리표시자는 **SQL 문법**으로부터는 지켜 줍니다.
//   하지만 LIKE 안에서 % 와 _ 가 갖는 뜻은 그대로 살아 있습니다.
//   이건 인젝션은 아니지만, 검색 결과가 이상해집니다.
//
// ★ 막으려면 ESCAPE 를 씁니다.

function 검색어다듬기(글자) {
  // \ 를 먼저 바꿔야 합니다. 순서를 바꾸면 이중으로 바뀝니다.
  return 글자.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function 제대로검색(검색어) {
  return db.prepare(`
    SELECT name FROM 설비
    WHERE name LIKE ? ESCAPE '\\'
    ORDER BY id
  `).all(`%${검색어다듬기(검색어)}%`);
}

console.log("'%' 로 제대로:", JSON.stringify(제대로검색("%").map((행) => 행.name)));
// 출력: '%' 로 제대로: ["50%_할인기"]
console.log("'_' 로 제대로:", JSON.stringify(제대로검색("_").map((행) => 행.name)));
// 출력: '_' 로 제대로: ["50%_할인기"]
console.log("'프레스' 는 그대로:", 제대로검색("프레스").length, "건");
// 출력: '프레스' 는 그대로: 2 건

// ESCAPE '\' 는 "\ 다음 글자는 특수문자가 아니라 그냥 글자로 봐라" 입니다.
//
// ★ 검색창을 만들 때는 이걸 꼭 넣으세요.
//   사용자가 % 를 치면 전체 목록이 나오는 게 정상은 아닙니다.

// ============================================================
// 4. 정렬 — 칸 이름은 자리표시자로 못 넘깁니다
// ============================================================

const 진짜온도순 = db.prepare("SELECT name FROM 설비 ORDER BY 온도 DESC LIMIT 3");
console.log("온도 DESC:", JSON.stringify(진짜온도순.all().map((행) => 행.name)));
// 출력: 온도 DESC: ["프레스 1호","프레스 2호","용접로봇 1호"]

const 자리표시자로 = db.prepare("SELECT name FROM 설비 ORDER BY ? DESC LIMIT 3");
console.log("? 로 온도:", JSON.stringify(자리표시자로.all("온도").map((행) => 행.name)));
// 출력: ? 로 온도: ["50%_할인기","검사기 1호","용접로봇 1호"]

// ★ 오류는 안 나는데 **전혀 다른 순서**가 나왔습니다. (02단원 개념03 에서 본 것)
//   '온도' 라는 **글자**로 정렬한 셈이라 모든 줄이 같은 값입니다.
//   순서가 확정되지 않아서 SQLite 가 편한 대로 내보냅니다.
//
// ★★ 이런 버그가 제일 나쁩니다.
//   오류가 없으니 배포됩니다. 정렬이 이상한데 왜 그런지 알 수가 없습니다.
//
// ★★ 그래서 허용 목록을 씁니다. 이어 붙이되, 내가 정한 값만 붙입니다.

const 정렬가능 = {
  id: "id",
  name: "name",
  line: "line",
  status: "status",
  온도: "온도",
};

function 정렬조립(sort, order) {
  // ★ hasOwn 을 쓰는 이유 — 아래 8번에서 설명합니다
  const 칸 = Object.hasOwn(정렬가능, sort ?? "") ? 정렬가능[sort] : "id";
  const 방향 = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  // ★ 개념03 의 규칙 — 마지막은 PRIMARY KEY 로 끝냅니다
  return 칸 === "id" ? `id ${방향}` : `${칸} ${방향}, id ASC`;
}

console.log(정렬조립("name", "desc"));
// 출력: name DESC, id ASC
console.log(정렬조립("온도", "asc"));
// 출력: 온도 ASC, id ASC
console.log(정렬조립(undefined, undefined));
// 출력: id ASC
console.log(정렬조립("없는칸", "desc"));
// 출력: id DESC
console.log(정렬조립("name; DROP TABLE 설비", "asc"));
// 출력: id ASC
console.log(정렬조립("constructor", "asc"));
// 출력: id ASC

// ★★★ 공격 문자열이 왔을 때 SQL 에 닿을 방법이 없습니다.
//   목록에 **직접 적어 넣은 키**인지 확인하고, 아니면 "id" 를 쓰기 때문입니다.
//
// ★★★ 왜 `정렬가능[sort] ?? "id"` 가 아니라 Object.hasOwn 인가
//
//   `??` 는 왼쪽이 undefined 일 때만 오른쪽을 씁니다.
//   그런데 자바스크립트 객체는 **부모에게서 물려받은 키**가 있습니다.
//
//     정렬가능["constructor"]  →  function Object() { ... }   ← undefined 가 아닙니다!
//     정렬가능["toString"]     →  function toString() { ... }
//     정렬가능["valueOf"]      →  function valueOf() { ... }
//
//   `??` 를 쓰면 이 값들이 그대로 통과해서 SQL 에 함수가 박힙니다.
//
//     ORDER BY function Object() { [native code] } ASC, id ASC
//     → near "Object": syntax error  →  500
//
//   ★ 인젝션(임의의 SQL 실행)은 아닙니다. 하지만 주소창에
//     ?sort=constructor 만 쳐도 서버가 500 을 뱉습니다.
//
//   Object.hasOwn 은 "내가 직접 적어 넣은 키인가" 만 봅니다.
//   물려받은 것은 false 라서 "id" 로 떨어집니다.
//
//   ★ sort ?? "" 를 쓴 이유 — sort 가 undefined 면
//     Object.hasOwn(객체, undefined) 가 "undefined" 라는 문자열 키를 찾습니다.
//     동작에 문제는 없지만, 뜻을 분명히 하려고 빈 문자열로 바꿉니다.
//
// ★ 객체(정렬가능) 를 쓴 이유
//   배열 + includes 로도 됩니다. 오히려 이 함정이 없어서 더 안전합니다.
//
//     if (!["id", "name"].includes(sort)) sort = "id";   ← constructor 도 그냥 걸러집니다
//
//   객체를 쓰면 이름을 바꿔 줄 수 있습니다.
//
//     const 정렬가능 = { 이름: "name", 라인: "line" };
//
//   API 에서는 한글 이름을 받고 DB 에서는 영어 칸을 쓰는 식으로요.
//   바깥 이름과 안쪽 칸 이름을 분리할 수 있습니다.
//   ★ 그 편함을 쓰는 대신 hasOwn 을 같이 써야 합니다.
//
// ★★ order 에 String() 을 씌운 이유
//   order 가 undefined 면 undefined.toLowerCase() 로 터집니다.
//   String(undefined) 는 "undefined" 라서 안전하게 ASC 가 됩니다.
//   배열이 와도(?order=a&order=b 로 보내면 배열이 됩니다) 터지지 않습니다.

// ============================================================
// 5. 다 합쳐서
// ============================================================

function 쪽정보다듬기(query) {
  let limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  let page = Number(query.page);
  if (!Number.isInteger(page) || page < 1) page = 1;

  return { limit, page, offset: (page - 1) * limit };
}

const 상태값들 = ["가동", "정지", "점검중"];
const 라인값들 = ["A", "B", "C"];

function 목록조회(query) {
  const 조건들 = [];
  const 값들 = [];

  // ★ 값이 정해진 것은 목록으로 확인합니다.
  //   이상한 값이 오면 조건을 아예 안 붙입니다.
  //   (400 을 낼 수도 있습니다. 아래에서 이야기합니다)
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

  // 숫자 범위
  const 최소온도 = Number(query.최소온도);
  if (Number.isFinite(최소온도)) {
    조건들.push("온도 >= ?");
    값들.push(최소온도);
  }

  const WHERE = 조건들.length > 0 ? `WHERE ${조건들.join(" AND ")}` : "";
  const 정렬 = 정렬조립(query.sort, query.order);
  const { limit, page, offset } = 쪽정보다듬기(query);

  // ★★ 개수 조회와 목록 조회에 **같은 WHERE 와 같은 값들**을 씁니다.
  //   이걸 따로 만들면 반드시 어긋납니다. 조건을 하나 추가할 때 한쪽만 고치니까요.
  const 전체개수 = db.prepare(`SELECT COUNT(*) AS n FROM 설비 ${WHERE}`).get(...값들).n;

  const 항목들 = db.prepare(`
    SELECT id, name, line, status, 온도 FROM 설비
    ${WHERE}
    ORDER BY ${정렬}
    LIMIT ? OFFSET ?
  `).all(...값들, limit, offset);

  return {
    data: 항목들,
    meta: { page, limit, total: 전체개수, totalPages: Math.ceil(전체개수 / limit) },
  };
}

const 경우들 = [
  {},
  { line: "A" },
  { line: "A", status: "가동" },
  { q: "로봇" },
  { sort: "온도", order: "desc", limit: "3" },
  { 최소온도: "39" },
  { line: "Z" },
  { line: "A' OR '1'='1" },
  { sort: "id; DROP TABLE 설비" },
];

for (const 경우 of 경우들) {
  const 결과 = 목록조회(경우);
  const 이름들 = 결과.data.map((행) => 행.name).slice(0, 3).join(", ");
  console.log(`${결과.meta.total}건 ← ${JSON.stringify(경우)}`);
  console.log(`     ${이름들}`);
}
// 출력: 8건 ← {}
// 출력:      용접로봇 1호, 용접로봇 2호, 프레스 1호
// 출력: 3건 ← {"line":"A"}
// 출력:      용접로봇 1호, 용접로봇 2호, 프레스 1호
// 출력: 2건 ← {"line":"A","status":"가동"}
// 출력:      용접로봇 1호, 프레스 1호
// 출력: 2건 ← {"q":"로봇"}
// 출력:      용접로봇 1호, 용접로봇 2호
// 출력: 8건 ← {"sort":"온도","order":"desc","limit":"3"}
// 출력:      프레스 1호, 프레스 2호, 용접로봇 1호
// 출력: 2건 ← {"최소온도":"39"}
// 출력:      프레스 1호, 프레스 2호
// 출력: 8건 ← {"line":"Z"}
// 출력:      용접로봇 1호, 용접로봇 2호, 프레스 1호
// 출력: 8건 ← {"line":"A' OR '1'='1"}
// 출력:      용접로봇 1호, 용접로봇 2호, 프레스 1호
// 출력: 8건 ← {"sort":"id; DROP TABLE 설비"}
// 출력:      용접로봇 1호, 용접로봇 2호, 프레스 1호

// ★ 정렬을 붙였는데도 8건인 것들을 보세요.
//   line=Z 와 line=A' OR '1'='1 은 조건이 걸러져서 필터가 안 붙었습니다.
//   sort 에 공격 문자열이 온 것도 기본값 id 로 떨어졌습니다.

console.log("표가 살아 있나:", db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 표가 살아 있나: 8

// ============================================================
// 5-2. ★ 이상한 값이 오면 무시할까, 400 을 낼까
// ============================================================
//
// 위 코드는 line=Z 를 **무시**했습니다. 그래서 8건 전부 나왔습니다.
// line=A' OR '1'='1 도 무시했습니다.
//
// 이게 맞을까요? 두 가지 생각이 있습니다.
//
//   ① 무시한다 (지금 코드)
//      화면이 안 깨집니다. 목록은 어쨌든 나옵니다.
//      대신 사용자는 "필터가 안 먹네" 하고 헷갈립니다.
//
//   ② 400 을 낸다
//      { 오류: "line 은 A, B, C 중 하나입니다" }
//      프론트의 버그를 빨리 찾을 수 있습니다.
//      대신 필터 하나 잘못됐다고 목록 전체가 안 나옵니다.
//
// ★ 실무에서는 이렇게 나눕니다.
//
//   사람이 직접 치는 값(검색어) → 무시하거나 다듬는다
//   프론트가 만드는 값(정렬 기준, 필터) → 400 을 낸다
//
//   프론트가 만드는 값이 틀렸다는 건 코드에 버그가 있다는 뜻입니다.
//   조용히 무시하면 그 버그가 오래 남습니다.
//
// ★★ 어느 쪽이든 **정해서 문서에 적으세요.**
//   같은 API 에서 어떤 필터는 무시되고 어떤 필터는 400 이면
//   프론트 담당자가 매번 물어봐야 합니다.

// ============================================================
// 6. 조립을 함수로 빼두기
// ============================================================
//
// 표가 여러 개면 위 코드를 표마다 복사하게 됩니다.
// 조립하는 부분만 따로 만들어 두면 재사용할 수 있습니다.

function 조건모으기(규칙들, query) {
  const 조건들 = [];
  const 값들 = [];

  for (const 규칙 of 규칙들) {
    const 온값 = query[규칙.이름];
    if (온값 === undefined || 온값 === "") continue;

    const 다듬은값 = 규칙.다듬기 ? 규칙.다듬기(온값) : 온값;
    if (다듬은값 === null) continue; // 다듬기가 null 을 주면 버립니다

    조건들.push(규칙.조건);
    값들.push(다듬은값);
  }

  return {
    WHERE: 조건들.length > 0 ? `WHERE ${조건들.join(" AND ")}` : "",
    값들,
  };
}

const 설비규칙 = [
  { 이름: "line", 조건: "line = ?", 다듬기: (값) => (라인값들.includes(값) ? 값 : null) },
  { 이름: "status", 조건: "status = ?", 다듬기: (값) => (상태값들.includes(값) ? 값 : null) },
  { 이름: "q", 조건: "name LIKE ? ESCAPE '\\'", 다듬기: (값) => `%${검색어다듬기(값)}%` },
  {
    이름: "최소온도",
    조건: "온도 >= ?",
    다듬기: (값) => (Number.isFinite(Number(값)) ? Number(값) : null),
  },
];

const 조립1 = 조건모으기(설비규칙, { line: "A", q: "로봇" });
console.log(조립1.WHERE);
// 출력: WHERE line = ? AND name LIKE ? ESCAPE '\'
console.log(JSON.stringify(조립1.값들));
// 출력: ["A","%로봇%"]

const 조립2 = 조건모으기(설비규칙, { line: "Z", 최소온도: "abc" });
console.log(`[${조립2.WHERE}]`, JSON.stringify(조립2.값들));
// 출력: [] []

// 둘 다 걸러져서 조건이 하나도 안 남았습니다.
//
// ★ 규칙을 표(배열) 로 만들어 두면 조건을 추가할 때 한 줄만 늘리면 됩니다.
//   그리고 어떤 필터가 있는지 한눈에 보입니다.
//
// ★★ 여기서 멈추세요. 더 일반화하려는 유혹이 있습니다.
//   { 이름: "line", 연산: "=" } 처럼 만들어서 SQL 을 자동 생성하고 싶어집니다.
//   그러다 보면 작은 ORM 을 만들게 됩니다.
//   조건이 열 개 넘어가고 표가 다섯 개 넘어가면 그때 생각하세요.
//   그전에는 조금 반복하는 게 낫습니다. 읽기 쉬우니까요.

// ============================================================
// 7. 색인을 잊지 마세요
// ============================================================
//
// 필터를 만들면 그 칸으로 조회가 들어옵니다. 색인이 필요합니다. (03단원 개념04)

console.log("색인 없을 때:", db.prepare(`
  EXPLAIN QUERY PLAN SELECT id FROM 설비 WHERE line = 'A'
`).all()[0].detail);
// 출력: 색인 없을 때: SCAN 설비

db.exec("CREATE INDEX 설비_line ON 설비(line)");

console.log("색인 있을 때:", db.prepare(`
  EXPLAIN QUERY PLAN SELECT id FROM 설비 WHERE line = 'A'
`).all()[0].detail);
// 출력: 색인 있을 때: SEARCH 설비 USING COVERING INDEX 설비_line (line=?)

// ★★ 그런데 LIKE '%검색어%' 는 색인을 못 씁니다. (03단원 개념04)

console.log("LIKE 검색:", db.prepare(`
  EXPLAIN QUERY PLAN SELECT id FROM 설비 WHERE name LIKE '%로봇%'
`).all()[0].detail);
// 출력: LIKE 검색: SCAN 설비 USING COVERING INDEX sqlite_autoindex_설비_1

// 검색 기능은 늘 풀 스캔입니다. 줄이 수십만이면 느립니다.
//
// ★ 대응 방법
//
//   · 검색을 다른 필터와 **함께** 쓰게 만든다 (line 을 먼저 고르게)
//   · "앞에서부터 일치" 로 바꾼다 → LIKE '로봇%' + COLLATE NOCASE 색인
//   · 진짜 검색이 필요하면 전문 검색(FTS5) 을 쓴다
//
// ★★ 정렬에도 색인이 필요합니다.
//   ORDER BY 온도 DESC 를 자주 쓰면 온도에 색인을 거세요.
//   안 걸면 매번 전체를 정렬합니다.
//
//   다만 정렬 가능한 칸을 다섯 개 열어 두고 색인을 다섯 개 만들면
//   쓰기가 느려집니다. 실제로 쓰이는 정렬만 열어 두세요.

db.close();

// ============================================================
// 정리
// ============================================================
//
//   조건 조립
//     조건들 배열과 값들 배열을 따로 모읍니다
//     SQL 에 붙이는 건 내가 쓴 글자뿐, 값은 항상 ?
//     조건이 없으면 WHERE 를 아예 안 붙입니다
//
//   LIKE
//     % 는 값 쪽에 붙입니다  ('%?%' 는 안 됩니다)
//     사용자가 % 나 _ 를 치면 뜻이 살아 있습니다 → ESCAPE '\' 로 막으세요
//
//   정렬
//     칸 이름은 자리표시자로 못 넘깁니다 (오류 없이 정렬만 안 됩니다)
//     허용 목록(객체) 으로 걸러서 이어 붙입니다
//     마지막은 PRIMARY KEY 로 끝냅니다
//     order 에는 String() 을 씌우세요
//
//   개수 조회와 목록 조회에 같은 WHERE·같은 값을 쓰세요
//
//   이상한 값 처리
//     사람이 치는 값은 다듬고, 프론트가 만드는 값은 400 을 냅니다
//     무엇을 골랐든 문서에 적으세요
//
//   필터로 쓰는 칸에는 색인을 거세요. LIKE '%..%' 는 색인을 못 씁니다.
//
// 다음(개념05) 에서 트랜잭션을 어느 층에 둘지 정리합니다.
