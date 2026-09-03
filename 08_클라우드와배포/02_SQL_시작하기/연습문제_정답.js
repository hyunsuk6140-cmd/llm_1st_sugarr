// ============================================================
// 02단원 연습문제 정답 — SQL 시작하기
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(":memory:");


// ───── 문제 1 ─────
db.exec(`
  CREATE TABLE 부품 (
    id   INTEGER PRIMARY KEY,
    이름 TEXT    NOT NULL UNIQUE,
    단가 INTEGER NOT NULL CHECK (단가 >= 0),
    재고 INTEGER NOT NULL DEFAULT 0
  ) STRICT
`);

console.log(db.prepare("PRAGMA table_info('부품')").all().map((칸) => 칸.name).join(","));
// 출력: id,이름,단가,재고
//
// UNIQUE 는 "겹치면 안 됨", NOT NULL 은 "비면 안 됨" 입니다. 둘 다 필요합니다.
// CHECK (단가 >= 0) 을 안 걸면 음수 단가가 그냥 들어갑니다.
// DEFAULT 0 이 없으면 재고를 안 넣었을 때 NOT NULL 위반으로 거절됩니다.
//
// ★ 단가를 REAL 로 하지 마세요. 돈은 정수(원 단위)로 다룹니다.
//   실수로 다루면 0.1 + 0.2 가 0.30000000000000004 가 되는 문제를 만납니다.


// ───── 문제 2 ─────
const 부품넣기 = db.prepare("INSERT INTO 부품 (이름, 단가, 재고) VALUES (?, ?, ?)");

for (const [이름, 단가, 재고] of [
  ["볼트 M6", 120, 500],
  ["너트 M6", 80, 300],
  ["와셔 M6", 30, 1000],
]) {
  부품넣기.run(이름, 단가, 재고);
}

console.log(db.prepare("SELECT COUNT(*) AS n FROM 부품").get().n);
// 출력: 3
//
// ★ prepare 를 반복문 **밖에서** 한 번만 했습니다.
//   안에서 하면 매번 SQL 을 다시 해석합니다. 건수가 많아지면 눈에 띄게 느려집니다.


// ───── 문제 3 ─────
db.prepare("INSERT INTO 부품 (이름, 단가) VALUES (?, ?)").run("스프링", 250);

console.log(db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = ?").get("스프링").재고);
// 출력: 0
//
// 재고 칸을 아예 안 적었습니다. DEFAULT 0 이 채워 줍니다.
//
// ★ 여기서 NULL 을 넣으면 다릅니다.
//     VALUES (?, ?, NULL)  → NOT NULL 위반으로 거절됩니다.
//   DEFAULT 는 "칸을 안 적었을 때" 만 동작합니다.


// ───── 문제 4 ─────
try {
  부품넣기.run("불량부품", -100, 1);
} catch (에러) {
  console.log(에러.message);
  // 출력: CHECK constraint failed: 단가 >= 0
}
//
// 메시지에 CHECK 조건이 그대로 나옵니다.
// 그래서 CHECK 를 쓸 때 조건을 읽기 좋게 적어 두면 디버깅이 편합니다.
//
// ★ 이 오류를 그대로 사용자에게 보여 주면 안 됩니다.
//   06단원처럼 { 오류: "단가는 0 이상이어야 합니다" } 로 바꿔서 보내세요.


// ───── 문제 5 ─────
const 부족한것 = db.prepare(`
  SELECT 이름 FROM 부품 WHERE 재고 < ? ORDER BY 재고
`).all(400);

console.log(부족한것.map((부품) => 부품.이름).join(", "));
// 출력: 스프링, 너트 M6
//
// ORDER BY 재고 는 작은 것부터입니다. (ASC 가 기본)
// 스프링 0, 너트 300 순서입니다.
//
// ★ 400 을 SQL 에 직접 박지 않고 자리표시자로 넘겼습니다.
//   지금은 내가 정한 값이라 안전하지만, 나중에 이 함수가 인자를 받게 되면
//   고칠 곳이 없어집니다. 처음부터 ? 로 쓰는 습관을 들이세요.


// ───── 문제 6 ─────
console.log(db.prepare("SELECT COUNT(*) AS n FROM 부품 WHERE 이름 LIKE ?").get("%M6%").n);
// 출력: 3
//
// ★ % 는 SQL 문장이 아니라 **값** 쪽에 붙입니다.
//
//     ✗  WHERE 이름 LIKE '%?%'      ← ? 가 글자로 취급됩니다
//     ○  WHERE 이름 LIKE ?          + .get("%M6%")
//
//   전자는 오류도 안 나고 결과만 안 나와서 한참 헤맵니다.


// ───── 문제 7 ─────
const 찾을이름 = ["볼트 M6", "와셔 M6", "없는부품"];

const 물음표들 = 찾을이름.map(() => "?").join(", ");
// 검증무시: 끼워 넣는 것은 ? 뿐입니다
const 찾은것 = db.prepare(`
  SELECT 이름 FROM 부품 WHERE 이름 IN (${물음표들}) ORDER BY id
`).all(...찾을이름);

console.log(찾은것.map((부품) => 부품.이름).join(", "));
// 출력: 볼트 M6, 와셔 M6
//
// 개수만큼 ? 를 만들어 붙였습니다.
// 이어 붙인 건 "?, ?, ?" 뿐이고 값은 여전히 자리표시자로 갑니다. 안전합니다.
//
// ★ 배열을 통째로 넘기면 안 됩니다.
//     .all(찾을이름)  →  Unknown named parameter '0'
//
// ★ ORDER BY 를 붙였습니다. 안 붙이면 순서가 보장되지 않습니다.
//   IN 에 적은 순서대로 나온다는 보장도 없습니다.


// ───── 문제 8 ─────
db.prepare("UPDATE 부품 SET 재고 = 재고 - ? WHERE 이름 = ?").run(30, "볼트 M6");

console.log(db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = ?").get("볼트 M6").재고);
// 출력: 470
//
// ★★ 읽어서 빼고 쓰는 방식과의 차이가 이 단원의 핵심입니다.
//
//     ✗  const 지금 = get(...).재고;
//        run(지금 - 30, "볼트 M6");
//
//   지금은 잘 됩니다. 요청이 하나뿐이니까요.
//   요청 20개가 동시에 오면 대부분이 사라집니다. (문제 17 에서 직접 봅니다)


// ───── 문제 9 ─────
const 없는것고치기 = db.prepare("UPDATE 부품 SET 단가 = ? WHERE id = ?").run(999, 9999);

console.log(없는것고치기.changes);
// 출력: 0
//
// 오류가 나지 않습니다. changes 가 0 일 뿐입니다.
//
// ★ 그래서 서버에서는 이렇게 씁니다.
//     if (changes === 0) return res.status(404).json({ 오류: "없습니다" });
//   이걸 빼먹으면 없는 걸 고쳐 달라고 해도 200 이 나갑니다.


// ───── 문제 10 ─────
const 고친것 = db.prepare(`
  UPDATE 부품 SET 단가 = ? WHERE 이름 = ? RETURNING 이름, 단가
`).get(300, "스프링");

console.log(`${고친것.이름}:${고친것.단가}`);
// 출력: 스프링:300
//
// ★ RETURNING 은 .get() 이나 .all() 로 받아야 합니다.
//   .run() 으로 받으면 { changes, lastInsertRowid } 만 나오고 줄이 사라집니다.
//
// ★ 못 찾으면 undefined 가 나옵니다. 404 판단에 그대로 쓸 수 있습니다.
//     const 고친것 = ...get(...);
//     if (!고친것) return res.status(404)...


// ───── 문제 11 ─────
db.exec("ALTER TABLE 부품 ADD COLUMN 메모 TEXT");

console.log(db.prepare("SELECT COUNT(*) AS n FROM 부품 WHERE 메모 IS NULL").get().n);
// 출력: 4
//
// ★ = NULL 로 세면 0 이 나옵니다. 오류도 안 납니다.
//   NULL 은 무엇과도 같지 않아서 = 비교가 절대 참이 되지 않습니다.
//   IS NULL / IS NOT NULL 을 쓰세요.
//
// ★ 메모 칸에 NOT NULL 을 붙이려면 DEFAULT 도 같이 줘야 합니다.
//     ALTER TABLE 부품 ADD COLUMN 메모 TEXT NOT NULL DEFAULT ''
//   이미 들어 있는 4줄을 뭘로 채울지 SQLite 가 알 수 없기 때문입니다.


// ───── 문제 12 ─────
const 지운것 = db.prepare("DELETE FROM 부품 WHERE 재고 = ?").run(0);

console.log(지운것.changes);
// 출력: 1
//
// 재고 0 인 건 스프링 하나였습니다.
//
// ★ WHERE 를 빠뜨렸다면 4줄이 전부 지워졌을 겁니다. 경고도 없이요.
//   DELETE 를 칠 때는 WHERE 를 먼저 치는 습관을 들이세요.


// ───── 문제 13 ─────
const 이름으로찾기 = db.prepare("SELECT 이름 FROM 부품 WHERE 이름 = ?");

function 부품찾기(이름) {
  const 찾은것 = 이름으로찾기.get(이름);
  return 찾은것 ? 찾은것.이름 : "없음";
}

console.log(부품찾기("볼트 M6"));
// 출력: 볼트 M6
console.log(부품찾기("드릴"));
// 출력: 없음
//
// ★ .get() 은 못 찾으면 undefined 입니다. null 이 아닙니다.
//   그래서 찾은것 && 찾은것.이름 이나 찾은것?.이름 으로도 됩니다.
//
// ★ 흔한 실수: 찾은것.이름 을 바로 쓰면
//   "Cannot read properties of undefined" 로 500 이 납니다.
//   .get() 뒤에는 항상 확인이 필요합니다.


// ───── 문제 14 ─────
function 위험한검색(이름) {
  // 검증무시: 문제 14 가 고치라고 낸 '나쁜 예' 입니다
  return db.prepare(`SELECT * FROM 부품 WHERE 이름 = '${이름}'`).all();
}

const 공격문자열 = "' OR '1'='1";

console.log(위험한검색(공격문자열).length);
// 출력: 3

function 안전한검색(이름) {
  return db.prepare("SELECT * FROM 부품 WHERE 이름 = ?").all(이름);
}

console.log(안전한검색(공격문자열).length);
// 출력: 0
//
// 위험한 쪽은 만들어진 SQL 이 이렇게 됩니다.
//
//   SELECT * FROM 부품 WHERE 이름 = '' OR '1'='1'
//
// 내가 넣은 따옴표가 SQL 의 따옴표를 닫았고, 뒤의 글자가 문법으로 읽혔습니다.
// 조건이 "항상 참" 이 되어 부품 전체가 나옵니다.
//
// 안전한 쪽은 저 글자 전체를 "찾을 이름" 으로 취급합니다.
// 그런 이름의 부품이 없으니 0 건입니다.
//
// ★ 고친 건 한 군데뿐입니다. 이어 붙이기를 자리표시자로 바꾼 것.
//   따옴표를 이스케이프하는 식으로 막으려 하지 마세요. 반드시 새어 나갑니다.


// ───── 문제 15 ─────
const 입고문장 = db.prepare(`
  INSERT INTO 부품 (이름, 단가, 재고) VALUES (?, ?, ?)
  ON CONFLICT(이름) DO UPDATE SET 재고 = 재고 + excluded.재고
`);

function 입고(이름, 단가, 수량) {
  입고문장.run(이름, 단가, 수량);
}

입고("드릴날", 5000, 500);
console.log(db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = '드릴날'").get().재고);
// 출력: 500
입고("드릴날", 5000, 50);
console.log(db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = '드릴날'").get().재고);
// 출력: 550
console.log(db.prepare("SELECT COUNT(*) AS n FROM 부품").get().n);
// 출력: 4
//
// 줄이 하나만 생겼습니다. 두 번째 호출은 새로 넣지 않고 재고만 더했습니다.
//
//   ON CONFLICT(이름)        이름이 겹치면
//   DO UPDATE SET ...        넣는 대신 고쳐라
//   excluded.재고            넣으려고 했던 그 값 (여기서는 50)
//   재고 = 재고 + excluded.재고   기존 재고에 더해라
//
// ★★ "SELECT 해서 있으면 UPDATE, 없으면 INSERT" 로 짜면
//   확인과 실행 사이에 다른 요청이 끼어들 수 있습니다.
//   그러면 같은 이름으로 INSERT 를 두 번 시도해서 UNIQUE 위반이 납니다.
//   UPSERT 는 한 문장이라 그 틈이 없습니다.


// ───── 문제 16 ─────
const 출고문장 = db.prepare(`
  UPDATE 부품 SET 재고 = 재고 - ? WHERE 이름 = ? AND 재고 >= ?
`);

function 출고(이름, 수량) {
  return 출고문장.run(수량, 이름, 수량).changes > 0;
}

console.log(출고("볼트 M6", 100));
// 출력: true
console.log(출고("볼트 M6", 99999));
// 출력: false
console.log(db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = '볼트 M6'").get().재고);
// 출력: 370
//
// 재고가 어떻게 370 이 됐는지 따라가 봅시다.
//
//   문제 2 에서 넣을 때        500
//   문제 8 에서 30 을 뺌       470
//   출고 100 성공              370
//   출고 99999 실패            370  ← 실패한 출고는 아무것도 안 건드립니다
//
// ★ 두 번째 출고에서 -99629 가 되지 않았다는 게 핵심입니다.
//   WHERE 조건에 안 걸려서 UPDATE 가 0 줄에 적용됐습니다.
//
// ★★ 이 함수의 진짜 핵심은 이겁니다.
//
//     WHERE 이름 = ? AND 재고 >= ?
//
//   재고를 먼저 읽어서 if 로 비교하지 않았습니다.
//   확인과 차감을 한 문장에 넣었습니다. 그 사이에 끼어들 틈이 없습니다.
//
//     ✗  const 지금 = get(...).재고;
//        if (지금 >= 수량) run(지금 - 수량, 이름);   ← 사이에 남이 가져갑니다
//
//   이 모양이 재고를 음수로 만드는 원인입니다. 실제 쇼핑몰에서 나는 사고입니다.


// ───── 문제 17 ─────
async function 실험(처리) {
  db.prepare("DELETE FROM 부품 WHERE 이름 = '테스트부품'").run();
  db.prepare("INSERT INTO 부품 (이름, 단가, 재고) VALUES ('테스트부품', 1, 0)").run();
  await Promise.all(Array.from({ length: 20 }, () => 처리()));
  return db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = '테스트부품'").get().재고;
}

async function 유실되는_방식() {
  const 지금 = db.prepare("SELECT 재고 FROM 부품 WHERE 이름 = '테스트부품'").get().재고;
  await new Promise((풀기) => setImmediate(풀기));
  db.prepare("UPDATE 부품 SET 재고 = ? WHERE 이름 = '테스트부품'").run(지금 + 1);
}

async function 안전한_방식() {
  await new Promise((풀기) => setImmediate(풀기));
  db.prepare("UPDATE 부품 SET 재고 = 재고 + 1 WHERE 이름 = '테스트부품'").run();
}

async function 실행() {
  console.log("유실:", await 실험(유실되는_방식));
  // 출력: 유실: 1
  console.log("안전:", await 실험(안전한_방식));
  // 출력: 안전: 20

  // 20번 다 실행됐는데 1 이 됐습니다. 19건이 사라졌습니다.
  //
  // 20개가 전부 await 앞에서 재고 0 을 읽었습니다.
  // 깨어난 뒤 각자 "0 + 1 = 1" 을 씁니다. 20번 다 1 을 씁니다.
  //
  // ★★★ DB 를 쓴다고 이 문제가 저절로 사라지지 않습니다.
  //   "읽고 → 계산하고 → 쓴다" 는 모양 자체가 문제입니다.
  //   DB 한테 계산까지 시켜야 합니다. 그게 두 번째 방식입니다.
  //
  // ★ 백엔드 07단원에서 파일로 저장할 때 겪었던 것과 같은 문제입니다.
  //   그때는 "쓰기를 줄 세워서" 해결했습니다.
  //   DB 에서는 UPDATE 한 문장으로 끝납니다. 이게 DB 를 쓰는 이유 중 하나입니다.

  db.close();
}

실행();
