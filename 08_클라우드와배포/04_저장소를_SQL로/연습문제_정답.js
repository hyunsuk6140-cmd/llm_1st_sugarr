// ============================================================
// 04단원 연습문제 정답 — 저장소를 SQL 로
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE 부품 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT    NOT NULL UNIQUE,
    창고   TEXT    NOT NULL CHECK (창고 IN ('S1', 'S2', 'P1')),
    단가   INTEGER NOT NULL CHECK (단가 >= 0),
    재고   INTEGER NOT NULL DEFAULT 0
  ) STRICT
`);

db.exec(`
  INSERT INTO 부품 (name, 창고, 단가, 재고) VALUES
    ('볼트 M6',  'S1',  120,  500),
    ('너트 M6',  'S1',   80,  300),
    ('와셔 M6',  'S2',   30, 1000),
    ('스프링',   'S2',  250,   40),
    ('베어링',   'P1', 3500,   12)
`);


// ───── 문제 1 ─────
const 하나문장 = db.prepare("SELECT id, name, 창고, 단가, 재고 FROM 부품 WHERE id = ?");

async function 하나(id) {
  return 하나문장.get(id) ?? null;
}

// ★★ ?? null 이 이 문제의 전부입니다.
//
//   .get() 은 못 찾으면 undefined 를 줍니다.
//   07단원의 파일 저장소는 null 을 돌려줬습니다.
//   서비스에 if (설비 === null) 이 있으니 undefined 면 안 걸립니다.
//   404 가 나가야 할 자리에서 500 이 납니다.
//
// ★ SELECT * 를 안 쓰고 칸을 적었습니다. 나중에 칸이 늘어도 응답이 안 바뀝니다.


// ───── 문제 2 ─────
const 추가문장 = db.prepare(`
  INSERT INTO 부품 (name, 창고, 단가, 재고) VALUES (?, ?, ?, ?)
  RETURNING id, name, 창고, 단가, 재고
`);

async function 추가(값) {
  return 추가문장.get(값.name, 값.창고, 값.단가, 값.재고 ?? 0);
}

// ★ 값.재고 ?? 0 — undefined 는 바인딩이 안 됩니다. (02단원 개념03)
//   DEFAULT 0 에 맡기려면 재고 칸을 아예 안 적은 INSERT 를 따로 만들어야 합니다.
//   문장이 두 개가 되니 여기서는 ?? 0 이 간단합니다.
//
// ★ RETURNING 으로 만든 줄을 바로 받았습니다. 다시 조회하지 않습니다.


// ───── 문제 3 ─────
const 삭제문장 = db.prepare("DELETE FROM 부품 WHERE id = ?");

async function 삭제(id) {
  return 삭제문장.run(id).changes > 0;
}

// ★ changes 를 안 보고 그냥 true 를 주면
//   없는 걸 지워 달라고 해도 204 가 나갑니다. (02단원 개념04)


// ───── 문제 4 ─────
const 고칠수있는칸 = ["name", "창고", "단가", "재고"];

async function 수정(id, 바꿀것) {
  const 칸들 = 고칠수있는칸.filter((칸) => 바꿀것[칸] !== undefined);

  if (칸들.length === 0) return 하나(id);

  const 설정 = 칸들.map((칸) => `${칸} = ?`).join(", ");
  const 값들 = 칸들.map((칸) => 바꿀것[칸]);

  return db.prepare(`
    UPDATE 부품 SET ${설정} WHERE id = ? RETURNING id, name, 창고, 단가, 재고
  `).get(...값들, id) ?? null;
}

// ★★★ 세 가지가 다 여기에 들어 있습니다.
//
//   ① 온 칸만 고친다
//      filter 로 undefined 가 아닌 칸만 골랐습니다.
//      전부 다 SET 에 넣으면 안 보낸 칸이 undefined 로 덮이려다 오류가 납니다.
//
//   ② id 는 안 바뀐다
//      고칠수있는칸 목록에 id 가 없습니다.
//      { id: 777 } 을 보내도 filter 에서 걸러집니다.
//
//   ③ 못 찾으면 null
//      RETURNING + .get() 은 못 찾으면 undefined 입니다. ?? null 로 바꿉니다.
//
// ★★ 칸 이름을 이어 붙였는데 안전한 이유
//   붙이는 값이 고칠수있는칸 배열에서만 나옵니다. 내가 코드에 적은 값입니다.
//   { "단가 = 0; DROP TABLE 부품 --": 1 } 을 보내도 filter 를 통과하지 못합니다.
//   값은 여전히 ? 로 넘어갑니다.
//
// ★ 고칠 게 없으면 UPDATE 를 안 하고 현재 값을 돌려줍니다.
//   SET 뒤가 비면 문법 오류가 납니다.

async function 문제1234() {
  console.log((await 하나(1)).name);
  // 출력: 볼트 M6
  const 없는것 = await 하나(9999);
  console.log(`${없는것} (${typeof 없는것})`);
  // 출력: null (object)

  const 만든것 = await 추가({ name: "드릴날", 창고: "P1", 단가: 5000 });
  console.log(`id=${만든것.id} name=${만든것.name} 재고=${만든것.재고}`);
  // 출력: id=6 name=드릴날 재고=0

  console.log(await 삭제(6));
  // 출력: true
  console.log(await 삭제(9999));
  // 출력: false

  console.log(`단가=${(await 수정(1, { 단가: 200 })).단가} name=${(await 하나(1)).name}`);
  // 출력: 단가=200 name=볼트 M6
  console.log(`id=${(await 수정(1, { id: 777, 재고: 490 })).id} (안 바뀜)`);
  // 출력: id=1 (안 바뀜)
  console.log(await 수정(9999, { 단가: 1 }));
  // 출력: null

  문제5부터();
}


// ───── 문제 5 ─────
function 칸없으면추가(표, 칸, 정의) {
  const 있나 = db.prepare(`
    SELECT COUNT(*) AS n FROM pragma_table_info(?) WHERE name = ?
  `).get(표, 칸).n > 0;

  if (있나) return false;

  db.exec(`ALTER TABLE ${표} ADD COLUMN ${칸} ${정의}`);
  return true;
}

// ★★ 여러 번 실행해도 같은 결과가 나옵니다.
//   서버가 켜질 때 실행되는 코드는 반드시 이래야 합니다.
//   배포할 때마다, 서버 인스턴스마다 실행되니까요.
//
// ★ SQLite 에는 ADD COLUMN IF NOT EXISTS 가 없습니다. 직접 확인해야 합니다.
//
// ★★★ pragma_table_info(?) 는 자리표시자를 받습니다.
//   ALTER TABLE 의 표·칸 이름은 못 받습니다. 그래서 이어 붙였습니다.
//   그래서 이 함수는 표·칸·정의 **셋 다 그대로 SQL 이 됩니다.**
//   사용자 입력으로 부르지 마세요. 서버가 켜질 때 내가 적은 값으로만 부르세요.
//
// ★★ 그래도 바깥에서 받아야 한다면 두 가지를 같이 하세요.
//
//   ① 허용목록으로 거릅니다 (개념04 의 정렬가능 과 같은 방법)
//   ② 이름을 큰따옴표로 인용합니다 — SQLite 의 식별자 인용 부호입니다
//
//        const 인용 = (이름) => `"${String(이름).replace(/"/g, '""')}"`;
//        db.exec(`ALTER TABLE ${인용(표)} ADD COLUMN ${인용(칸)} ${정의}`);
//
//      이름 안에 " 가 있으면 "" 로 두 번 적어 막습니다.
//      값에서 ' 를 '' 로 적는 것과 같은 규칙입니다.
//
//   ★ 정의("TEXT NOT NULL DEFAULT ''") 는 인용할 수 없습니다. SQL 조각이니까요.
//     정의만큼은 반드시 내가 만든 목록에서 골라야 합니다.


// ───── 문제 6 ─────
function 문제5부터() {
  console.log("첫 번째:", 칸없으면추가("부품", "비고", "TEXT NOT NULL DEFAULT ''"));
  // 출력: 첫 번째: true
  console.log("두 번째:", 칸없으면추가("부품", "비고", "TEXT NOT NULL DEFAULT ''"));
  // 출력: 두 번째: false
  console.log("칸 목록:", db.prepare("SELECT name FROM pragma_table_info('부품')")
    .all().map((칸) => 칸.name).join(", "));
  // 출력: 칸 목록: id, name, 창고, 단가, 재고, 비고

  const 전 = db.prepare("PRAGMA user_version").get().user_version;
  db.exec(`PRAGMA user_version = ${전 + 1}`);
  console.log(`${전} → ${db.prepare("PRAGMA user_version").get().user_version}`);
  // 출력: 0 → 1

  // ★ PRAGMA 에는 자리표시자를 못 씁니다. 재 봤습니다.
  //     db.prepare("PRAGMA user_version = ?").run(1)
  //     → near "?": syntax error
  //   그래서 숫자를 직접 넣습니다. 우리가 만든 숫자라 안전합니다.

  문제7();
}


// ───── 문제 7 ─────
function 쪽정보다듬기(query) {
  let limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  let page = Number(query.page);
  if (!Number.isInteger(page) || page < 1) page = 1;

  return { limit, page, offset: (page - 1) * limit };
}

function 문제7() {
  for (const 경우 of [{}, { limit: "10", page: "3" }, { limit: "-1" },
    { limit: "abc" }, { limit: "999" }, { limit: "5.5" }]) {
    const r = 쪽정보다듬기(경우);
    console.log(`${JSON.stringify(경우)} → ${r.limit}/${r.offset}`);
  }
  // 출력: {} → 20/0
  // 출력: {"limit":"10","page":"3"} → 10/20
  // 출력: {"limit":"-1"} → 20/0
  // 출력: {"limit":"abc"} → 20/0
  // 출력: {"limit":"999"} → 50/0
  // 출력: {"limit":"5.5"} → 20/0

  // ★★★ 네 가지를 다 챙겨야 합니다.
  //
  //   숫자로 바꾸기      Number(...)
  //   정수 확인          Number.isInteger — "5.5" 를 걸러 냅니다
  //   하한               < 1 을 막습니다  ← LIMIT -1 은 전부 돌려줍니다!
  //   상한               > 50 을 막습니다 ← ?limit=999999 를 막습니다
  //
  // ★ Number("abc") 는 NaN 이고 Number.isInteger(NaN) 은 false 입니다.
  //   Number(undefined) 도 NaN 입니다. 둘 다 기본값으로 떨어집니다.
  //
  // ★ parseInt 를 쓰면 "5.5" 가 5 가 되고 "10abc" 도 10 이 됩니다.
  //   조용히 통과시키니 이상한 값이 온 걸 모릅니다. Number 가 낫습니다.

  문제8();
}


// ───── 문제 8 ─────
function 문제8() {
  const 안좋음 = db.prepare("SELECT id FROM 부품 ORDER BY 창고 LIMIT 2 OFFSET ?");
  const 좋음 = db.prepare("SELECT id FROM 부품 ORDER BY 창고, id LIMIT 2 OFFSET ?");

  const 쪽1 = 좋음.all(0).map((행) => 행.id);
  const 쪽2 = 좋음.all(2).map((행) => 행.id);

  console.log("1쪽:", JSON.stringify(쪽1));
  // 출력: 1쪽: [5,1]
  console.log("2쪽:", JSON.stringify(쪽2));
  // 출력: 2쪽: [2,3]

  const 겹침 = 쪽1.filter((id) => 쪽2.includes(id));
  console.log("겹치는 것:", 겹침.length === 0 ? "없음" : JSON.stringify(겹침));
  // 출력: 겹치는 것: 없음

  // ★ id 가 [5,1] 부터 시작하는 게 이상해 보일 수 있습니다.
  //   창고 순으로 정렬했으니 P1(베어링 id 5) 이 S1 보다 먼저입니다.
  //   그 다음이 S1(볼트 1, 너트 2), S2(와셔 3, 스프링 4) 입니다.
  //
  // ★★ ORDER BY 창고 만 쓰면 창고가 같은 줄들의 순서가 확정되지 않습니다.
  //   쪽을 넘길 때 순서가 달라져서 같은 줄이 두 번 나오거나 빠집니다.
  //
  //   지금 자료로는 우연히 안 겹칠 수도 있습니다. 그게 더 위험합니다.
  //   개발할 때는 멀쩡하고 운영에서 터집니다.
  //
  // ★ 규칙: ORDER BY 의 마지막은 항상 PRIMARY KEY.
  //   안좋음 문장은 쓰지 않았습니다. 비교용으로 남겨 뒀습니다.
  console.log("나쁜 예도 만들어는 뒀나:", 안좋음 !== undefined);
  // 출력: 나쁜 예도 만들어는 뒀나: true

  문제9();
}


// ───── 문제 9 ─────
function 조건조립(query) {
  const 조건들 = [];
  const 값들 = [];

  if (query.창고) {
    조건들.push("창고 = ?");
    값들.push(query.창고);
  }

  if (query.q) {
    조건들.push("name LIKE ?");
    값들.push(`%${query.q}%`);
  }

  if (query.최소재고 !== undefined) {
    조건들.push("재고 >= ?");
    값들.push(Number(query.최소재고));
  }

  return {
    WHERE: 조건들.length > 0 ? `WHERE ${조건들.join(" AND ")}` : "",
    값들,
  };
}

function 문제9() {
  const a = 조건조립({ 창고: "S1", 최소재고: 400 });
  console.log(`[${a.WHERE}]`, JSON.stringify(a.값들));
  // 출력: [WHERE 창고 = ? AND 재고 >= ?] ["S1",400]

  const b = 조건조립({});
  console.log(`[${b.WHERE}]`, JSON.stringify(b.값들));
  // 출력: [] []

  const c = 조건조립({ 창고: "S1" });
  console.log("S1 것:", db.prepare(`SELECT name FROM 부품 ${c.WHERE} ORDER BY id`)
    .all(...c.값들).map((행) => 행.name).join(", "));
  // 출력: S1 것: 볼트 M6, 너트 M6

  // ★★ 조건과 값을 따로 모으는 것이 핵심입니다.
  //   두 배열의 순서가 짝을 이루니 ? 자리가 맞습니다.
  //   SQL 에 붙이는 건 "창고 = ?" 같은 내가 쓴 글자뿐입니다.
  //
  // ★ % 는 값 쪽에 붙였습니다.
  //     ✗  "name LIKE '%?%'"   ← ? 가 글자로 취급됩니다
  //     ○  "name LIKE ?" + `%${q}%`
  //
  // ★ 최소재고는 query.최소재고 로 확인했습니다. if (query.최소재고) 를 쓰면
  //   0 이 falsy 라서 "재고 0 이상" 이 걸러집니다. 흔한 실수입니다.

  문제10();
}


// ───── 문제 10 ─────
const 정렬가능 = { id: "id", name: "name", 단가: "단가", 재고: "재고" };

function 정렬조립(sort, order) {
  const 칸 = Object.hasOwn(정렬가능, sort ?? "") ? 정렬가능[sort] : "id";
  const 방향 = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  return 칸 === "id" ? `id ${방향}` : `${칸} ${방향}, id ASC`;
}

function 문제10() {
  console.log(정렬조립("단가", "desc"));
  // 출력: 단가 DESC, id ASC
  console.log(정렬조립("없는칸", "asc"));
  // 출력: id ASC
  console.log(정렬조립("name; DROP TABLE 부품", "asc"));
  // 출력: id ASC

  db.prepare(`SELECT id FROM 부품 ORDER BY ${정렬조립("name; DROP TABLE 부품", "asc")}`).all();
  console.log("표 살아 있나:", db.prepare("SELECT COUNT(*) AS n FROM 부품").get().n);
  // 출력: 표 살아 있나: 5

  // ★★★ 허용 목록에 없으면 기본값으로 떨어집니다.
  //   공격 문자열이 SQL 에 닿을 방법이 없습니다.
  //
  // ★ 객체를 쓴 이유: 바깥 이름과 안쪽 칸 이름을 다르게 할 수 있습니다.
  //     const 정렬가능 = { 이름: "name", 가격: "단가" };
  //
  // ★ String(order) 를 씌운 이유: order 가 undefined 면
  //   undefined.toLowerCase() 로 터집니다. 배열이 와도 안전합니다.
  //   (?order=a&order=b 로 보내면 배열이 됩니다)
  //
  // ★ 마지막을 id 로 끝냈습니다. 문제 8 의 이유입니다.

  문제11();
}


// ───── 문제 11 ─────
function 검색어다듬기(글자) {
  return 글자.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function 문제11() {
  // ★ 이 INSERT 를 파일 맨 위(최상위) 에 두면 안 됩니다.
  //   최상위 코드는 함수보다 **먼저** 실행됩니다.
  //   그러면 이 줄이 id 6 을 가져가서, 문제 3 의 삭제(6) 가
  //   드릴날이 아니라 이 부품을 지워 버립니다.
  //   이 자료도 한 번 그렇게 만들었다가 결과가 틀렸습니다.
  //   최상위와 함수 안이 섞이면 순서를 눈으로 따라가기 어렵습니다.
  db.prepare("INSERT INTO 부품 (name, 창고, 단가) VALUES (?, ?, ?)").run("30%_할인부품", "S1", 10);

  console.log("다듬기 전 '%' 로 검색:",
    db.prepare("SELECT name FROM 부품 WHERE name LIKE ?").all("%%%").length + "건");
  // 출력: 다듬기 전 '%' 로 검색: 6건

  console.log("다듬은 뒤 '%' 로 검색:",
    db.prepare("SELECT name FROM 부품 WHERE name LIKE ? ESCAPE '\\'")
      .all(`%${검색어다듬기("%")}%`).length + "건");
  // 출력: 다듬은 뒤 '%' 로 검색: 1건

  // ★★ 자리표시자는 SQL **문법**으로부터는 지켜 줍니다.
  //   하지만 LIKE 안에서 % 와 _ 가 갖는 뜻은 살아 있습니다.
  //   인젝션은 아니지만 검색 결과가 이상해집니다.
  //
  // ★ \ 를 **먼저** 바꿔야 합니다.
  //   % 를 \% 로 먼저 바꾸면, 그 \ 를 다시 \\ 로 바꿔서 \\% 가 됩니다.
  //   그러면 "역슬래시 다음에 아무 글자든" 이라는 뜻이 되어 버립니다.
  //   순서를 바꿔 보면 결과가 달라지는 걸 확인할 수 있습니다.

  문제12();
}


// ───── 문제 12 ─────
function 커서목록(커서, 개수) {
  const 항목들 = 커서 === null
    ? db.prepare("SELECT id FROM 부품 ORDER BY id LIMIT ?").all(개수 + 1)
    : db.prepare("SELECT id FROM 부품 WHERE id > ? ORDER BY id LIMIT ?").all(커서, 개수 + 1);

  const 더있다 = 항목들.length > 개수;
  const 보낼것 = 더있다 ? 항목들.slice(0, 개수) : 항목들;

  return {
    data: 보낼것.map((행) => 행.id),
    다음커서: 더있다 ? 보낼것[보낼것.length - 1].id : null,
  };
}

function 문제12() {
  let 커서 = null;

  for (let 쪽 = 1; 쪽 <= 3; 쪽++) {
    const r = 커서목록(커서, 2);
    console.log(`${쪽}쪽: ${JSON.stringify(r.data)} 다음=${r.다음커서}`);
    커서 = r.다음커서;
  }
  // 출력: 1쪽: [1,2] 다음=2
  // 출력: 2쪽: [3,4] 다음=4
  // 출력: 3쪽: [5,7] 다음=null

  // ★★ "개수 + 1 을 가져와서 확인" 이 핵심입니다.
  //   COUNT(*) 조회를 안 해도 "다음이 있나" 를 알 수 있습니다.
  //   마지막 쪽에서 빈 응답을 한 번 더 받는 일도 없어집니다.
  //
  //   부품이 6개인데 3쪽에서 2개만 나오고 다음=null 입니다.
  //   3개(2+1) 를 요청했는데 2개만 왔으니 더 없는 것입니다.
  //
  // ★ OFFSET 방식과 비교
  //     빠릅니다        WHERE id > 2 는 색인으로 바로 찾아갑니다
  //     어긋나지 않음   중간에 자료가 추가돼도 이미 본 것 뒤부터 봅니다
  //     대신            "3쪽으로 바로 가기" 를 못 합니다

  문제13();
}


// ───── 문제 13 ─────
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

function 문제13() {
  한묶음으로(() => {
    db.prepare("UPDATE 부품 SET 재고 = 재고 - 10 WHERE id = 1").run();
  });
  console.log("성공: 재고=" + db.prepare("SELECT 재고 FROM 부품 WHERE id=1").get().재고);
  // 출력: 성공: 재고=480

  try {
    한묶음으로(() => {
      db.prepare("UPDATE 부품 SET 재고 = 재고 - 10 WHERE id = 1").run();
      db.prepare("UPDATE 부품 SET 단가 = -1 WHERE id = 1").run(); // CHECK 위반
    });
  } catch (에러) {
    console.log("실패 잡음:", /CHECK/.test(에러.message));
    // 출력: 실패 잡음: true
  }

  console.log("되돌아갔나: 재고=" + db.prepare("SELECT 재고 FROM 부품 WHERE id=1").get().재고);
  // 출력: 되돌아갔나: 재고=480
  console.log("트랜잭션 닫혔나:", db.isTransaction === false);
  // 출력: 트랜잭션 닫혔나: true

  // ★★★ 재고가 470 이 아니라 480 입니다.
  //   두 번째 묶음의 UPDATE 도 성공했지만, 뒤의 단가 UPDATE 가 CHECK 에 걸려
  //   통째로 되돌아갔습니다.
  //   트랜잭션이 없었다면 470 이 되고, 단가는 그대로인 어긋난 상태가 남습니다.
  //
  // ★★ catch 의 ROLLBACK 을 빼먹으면
  //   트랜잭션이 열린 채로 남습니다. 그 뒤 모든 요청이
  //   "cannot start a transaction within a transaction" 으로 죽습니다.
  //   그래서 마지막에 isTransaction 을 확인했습니다.
  //
  // ★ isTransaction 확인으로 겹침을 막았습니다.
  //   서비스 함수 A 가 B 를 부르고 둘 다 트랜잭션을 열려 하면 오류가 납니다.
  //
  // ★★ 안쪽에 await 를 쓰면 안 됩니다. (개념05 에서 확인했습니다)
  //   한묶음으로 는 동기 함수라서, 안쪽이 Promise 를 돌려주면
  //   기다리지 않고 COMMIT 을 해 버립니다.

  문제14();
}


// ───── 문제 14 ─────
db.exec(`
  CREATE TABLE 출고 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    부품id INTEGER NOT NULL REFERENCES 부품(id),
    수량   INTEGER NOT NULL CHECK (수량 > 0)
  ) STRICT
`);

function 출고하기(부품id, 수량) {
  return 한묶음으로(() => {
    // ★ 확인과 차감을 한 문장에 넣었습니다. (02단원 개념05)
    const 결과 = db.prepare(`
      UPDATE 부품 SET 재고 = 재고 - ? WHERE id = ? AND 재고 >= ?
    `).run(수량, 부품id, 수량);

    if (결과.changes === 0) return false;

    db.prepare("INSERT INTO 출고 (부품id, 수량) VALUES (?, ?)").run(부품id, 수량);
    return true;
  });
}

function 문제14() {
  console.log("출고 100:", 출고하기(1, 100));
  // 출력: 출고 100: true
  console.log("출고 99999:", 출고하기(1, 99999));
  // 출력: 출고 99999: false
  console.log("재고:", db.prepare("SELECT 재고 FROM 부품 WHERE id=1").get().재고);
  // 출력: 재고: 380
  console.log("출고 기록 수:", db.prepare("SELECT COUNT(*) AS n FROM 출고").get().n);
  // 출력: 출고 기록 수: 1

  // ★★★ 두 가지가 같이 들어 있습니다.
  //
  //   ① 경합 막기 — WHERE 에 AND 재고 >= ? 를 넣었습니다
  //      재고를 먼저 SELECT 해서 if 로 비교하면, 확인과 차감 사이에
  //      다른 요청이 가져갈 수 있습니다. 재고가 음수가 됩니다.
  //
  //   ② 두 표를 같이 — 재고 차감과 출고 기록이 한 트랜잭션입니다
  //      출고 기록만 남고 재고가 안 줄면 재고가 안 맞습니다.
  //
  // ★ changes === 0 일 때 false 를 돌려주고 끝냅니다.
  //   그 뒤 INSERT 를 안 하니 출고 기록도 안 생깁니다.
  //   트랜잭션은 COMMIT 되지만 바뀐 게 없습니다. 문제없습니다.

  문제15();
}


// ───── 문제 15 ─────
const 좋은저장소 = {
  전부: async () => db.prepare("SELECT * FROM 부품 ORDER BY id").all(),
  하나: async (id) => db.prepare("SELECT * FROM 부품 WHERE id = ?").get(id) ?? null,
  추가: async (값) => db.prepare(
    "INSERT INTO 부품 (name, 창고, 단가) VALUES (?, ?, ?) RETURNING *"
  ).get(값.name, 값.창고, 값.단가),
  수정: async (id, 바꿀것) => {
    const 칸들 = ["name", "창고", "단가", "재고"].filter((칸) => 바꿀것[칸] !== undefined);
    if (칸들.length === 0) return db.prepare("SELECT * FROM 부품 WHERE id = ?").get(id) ?? null;
    return db.prepare(
      `UPDATE 부품 SET ${칸들.map((칸) => `${칸} = ?`).join(", ")} WHERE id = ? RETURNING *`
    ).get(...칸들.map((칸) => 바꿀것[칸]), id) ?? null;
  },
  삭제: async (id) => db.prepare("DELETE FROM 부품 WHERE id = ?").run(id).changes > 0,
};

const 나쁜저장소 = {
  ...좋은저장소,
  하나: async (id) => db.prepare("SELECT * FROM 부품 WHERE id = ?").get(id),
  삭제: async (id) => { db.prepare("DELETE FROM 부품 WHERE id = ?").run(id); return true; },
};

async function 저장소검사(저장소) {
  const 실패 = [];
  let 통과 = 0;

  const 확인 = (이름, 조건) => {
    if (조건) 통과 += 1;
    else 실패.push(이름);
  };

  // ① 내보내는 함수가 다 있는가
  확인("내보내는함수", ["전부", "하나", "추가", "수정", "삭제"]
    .every((이름) => typeof 저장소[이름] === "function"));

  // ② 못 찾으면 null 인가 (undefined 면 실패)
  확인("없으면null", (await 저장소.하나(999999)) === null);

  // ③ 없는 것을 지우면 false 인가
  확인("삭제false", (await 저장소.삭제(999999)) === false);

  // ④ id 를 못 바꾸는가
  const 시험용 = await 저장소.추가({
    name: `검사용_${Math.floor(Math.random() * 1e9)}`,
    창고: "S1",
    단가: 1,
  });
  확인("id고정", (await 저장소.수정(시험용.id, { id: 888888, 단가: 2 })).id === 시험용.id);

  // ⑤ 안 보낸 칸이 그대로인가
  const 고친것 = await 저장소.수정(시험용.id, { 단가: 3 });
  확인("칸유지", 고친것.name === 시험용.name && 고친것.창고 === 시험용.창고);

  await 저장소.삭제(시험용.id);

  return { 통과, 실패 };
}

async function 문제15() {
  const 좋은결과 = await 저장소검사(좋은저장소);
  console.log(`통과: ${좋은결과.통과}개, 실패: ${JSON.stringify(좋은결과.실패)}`);
  // 출력: 통과: 5개, 실패: []

  const 나쁜결과 = await 저장소검사(나쁜저장소);
  console.log(`일부러 깨뜨린 저장소 → 실패: ${JSON.stringify(나쁜결과.실패)}`);
  // 출력: 일부러 깨뜨린 저장소 → 실패: ["없으면null","삭제false"]

  // ★★★ 이 시험이 이 단원의 결론입니다.
  //
  //   저장소를 갈아 끼울 때 "이름이 같다" 로는 부족합니다.
  //   **동작이 같아야** 합니다. 그걸 확인하는 게 이 함수입니다.
  //
  //   나쁜저장소는 딱 두 군데가 다릅니다.
  //     ?? null 을 빼먹었다
  //     changes 를 안 보고 항상 true 를 준다
  //
  //   서버를 켜서 손으로 눌러 보면 둘 다 잘 동작하는 것처럼 보입니다.
  //   404 를 확인하고, 없는 걸 지워 봐야 드러납니다.
  //   시험 함수는 그걸 매번 빠짐없이 해 줍니다.
  //
  // ★ 이름을 랜덤으로 만든 이유
  //   name 에 UNIQUE 가 걸려 있어서, 같은 이름으로 두 번 추가하면 실패합니다.
  //   두 저장소를 연달아 검사하니 이름이 겹치면 안 됩니다.
  //
  // ★★ 05단원에서 Supabase 저장소를 만들 때 이 시험을 그대로 돌리면 됩니다.
  //   통과하면 서버 코드를 안 고쳐도 된다는 뜻입니다.

  db.close();
}

문제1234();
