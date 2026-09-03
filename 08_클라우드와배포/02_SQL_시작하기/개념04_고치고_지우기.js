// ============================================================
// 개념 04 — 고치고 지우기 (UPDATE · DELETE)
// ============================================================
//
// 넣고 읽는 건 실수해도 티가 안 납니다.
// 고치고 지우는 건 한 번 잘못하면 되돌릴 수 없습니다.
//
// 이 단원은 "어떻게 쓰는가" 보다 "어떻게 사고를 막는가" 가 중심입니다.
//
// 실행: node 개념04_고치고_지우기.js
// ============================================================

const { DatabaseSync } = require("node:sqlite");

function 새db() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE 설비 (
      id   INTEGER PRIMARY KEY,
      이름 TEXT    NOT NULL UNIQUE,
      라인 TEXT    NOT NULL,
      온도 REAL,
      상태 TEXT    NOT NULL DEFAULT '정상'
                   CHECK (상태 IN ('정상', '점검중', '고장'))
    ) STRICT
  `);
  db.exec(`
    INSERT INTO 설비 (이름, 라인, 온도) VALUES
      ('용접로봇 1호', 'A', 36.5),
      ('프레스 1호',   'A', 41.2),
      ('프레스 2호',   'B', 39.8),
      ('컨베이어 1호', 'B', 25.0),
      ('검사기 1호',   'C', 22.4)
  `);
  return db;
}

let db = 새db();

// ============================================================
// 1. UPDATE 기본
// ============================================================
//
//   UPDATE 표이름
//   SET 칸 = 값, 칸2 = 값2
//   WHERE 조건
//
// SET 이 "무엇을", WHERE 가 "어느 줄을" 정합니다.

const 상태바꾸기 = db.prepare("UPDATE 설비 SET 상태 = ? WHERE id = ?");

console.log(상태바꾸기.run("점검중", 1));
// 출력: { changes: 1, lastInsertRowid: 5 }

// changes: 1  → 한 줄이 바뀌었습니다.
//
// ★ lastInsertRowid 는 무시하세요.
//   UPDATE·DELETE 에서는 이전에 INSERT 했던 값이 그대로 남아 있는 것뿐입니다.
//   INSERT 뒤에만 의미가 있습니다.

// ============================================================
// 2. changes 로 404 를 판단합니다
// ============================================================

console.log(상태바꾸기.run("점검중", 9999));
// 출력: { changes: 0, lastInsertRowid: 5 }

// ★★ 없는 id 를 고쳐도 오류가 안 납니다. changes 가 0 일 뿐입니다.
//
//   그래서 서버에서는 이렇게 씁니다. 06단원의 404 처리가 이렇게 이어집니다.
//
//     const { changes } = 상태바꾸기.run(상태, id);
//     if (changes === 0) {
//       return res.status(404).json({ 오류: "그런 설비가 없습니다" });
//     }
//     res.json({ 결과: "고쳤습니다" });
//
//   changes 를 안 보면, 없는 설비를 고쳐 달라고 해도 200 이 나갑니다.
//   클라이언트는 성공한 줄 압니다.

// ★ 주의: 같은 값으로 고치면 changes 는 몇일까요?

const 그대로 = db.prepare("UPDATE 설비 SET 상태 = ? WHERE id = ?").run("점검중", 1);
console.log("같은 값으로 고치기:", 그대로.changes);
// 출력: 같은 값으로 고치기: 1

// 1 입니다. "값이 달라졌는지" 가 아니라 "몇 줄에 손을 댔는지" 를 셉니다.
// 그러니 changes === 0 은 "못 찾았다" 로만 읽으면 됩니다.

// ============================================================
// 3. ★★★ WHERE 를 빠뜨리면
// ============================================================
//
// SQL 에서 가장 유명한 사고입니다. 직접 봅시다.

db = 새db();

const 사고 = db.prepare("UPDATE 설비 SET 상태 = ?").run("고장");
console.log(사고);
// 출력: { changes: 5, lastInsertRowid: 5 }

console.log(JSON.stringify(db.prepare("SELECT 이름, 상태 FROM 설비").all().map((설비) => 설비.상태)));
// 출력: ["고장","고장","고장","고장","고장"]

// 5대 전부 고장이 됐습니다.
//
// 오류 메시지는 없습니다. 빨간 글씨도 없습니다.
// 그냥 조용히, 전부, 바뀝니다.
//
// ★★ 실무에서 실제로 일어납니다.
//   운영 DB 에 접속해서 WHERE 를 치다가 엔터를 먼저 눌러 버리는 식으로요.
//   회사 하나가 몇 시간 멈추는 사고의 흔한 원인입니다.
//
// ★★ 습관 세 가지
//
//   1) WHERE 를 **먼저** 칩니다.
//        UPDATE 설비 WHERE id = 3            ← 이렇게 적어 두고
//        UPDATE 설비 SET 상태='고장' WHERE id = 3   ← SET 을 끼워 넣습니다
//
//   2) SELECT 로 먼저 확인합니다.
//        SELECT * FROM 설비 WHERE id = 3;    ← 몇 줄 나오나 본다
//        UPDATE 설비 SET ... WHERE id = 3;   ← 같은 WHERE 로 고친다
//
//   3) 코드에서는 WHERE 없는 UPDATE·DELETE 를 아예 안 짭니다.
//      필요하다고 느껴지면 십중팔구 설계가 잘못된 것입니다.

// ============================================================
// 4. 여러 칸 한꺼번에 고치기
// ============================================================

db = 새db();

db.prepare(`
  UPDATE 설비
  SET 상태 = $상태, 온도 = $온도
  WHERE id = $id
`).run({ 상태: "점검중", 온도: 30.0, id: 2 });

console.log({ ...db.prepare("SELECT 이름, 상태, 온도 FROM 설비 WHERE id = 2").get() });
// 출력: { '이름': '프레스 1호', '상태': '점검중', '온도': 30 }

// ★ 30.0 을 넣었는데 30 으로 나옵니다.
//   자바스크립트에서 30.0 과 30 은 같은 값입니다. 소수점이 없어지는 게 정상입니다.
//   화면에 30.0 으로 보이고 싶으면 (30).toFixed(1) 로 만들어 쓰세요.

// ============================================================
// 5. 지금 값을 이용해서 고치기
// ============================================================

db = 새db();

db.prepare("UPDATE 설비 SET 온도 = 온도 + 1 WHERE 라인 = ?").run("A");

console.log(JSON.stringify(
  db.prepare("SELECT 이름, 온도 FROM 설비 WHERE 라인 = 'A'").all()
    .map((설비) => `${설비.이름}:${설비.온도}`)
));
// 출력: ["용접로봇 1호:37.5","프레스 1호:42.2"]

// ★★ 이게 07단원에서 겪은 "동시에 고치면 하나가 사라지는" 문제의 해법입니다.
//
//   ✗  읽고 → 자바스크립트에서 +1 → 쓴다
//        const 지금 = get(...).온도;
//        run(지금 + 1, id);          ← 읽는 사이에 남이 고치면 덮어씁니다
//
//   ○  DB 안에서 한 번에
//        UPDATE 설비 SET 온도 = 온도 + 1 WHERE id = ?
//
//   조회수 +1, 재고 -1 같은 건 반드시 이 형태로 쓰세요.
//   개념05 에서 이 차이를 20건 실험으로 다시 확인합니다.

// ============================================================
// 5-2. NULL 에 더하면 NULL
// ============================================================

db.prepare("INSERT INTO 설비 (이름, 라인) VALUES (?, ?)").run("온도없음", "D");
db.prepare("UPDATE 설비 SET 온도 = 온도 + 1 WHERE 이름 = ?").run("온도없음");

console.log("NULL + 1 =", db.prepare("SELECT 온도 FROM 설비 WHERE 이름 = '온도없음'").get().온도);
// 출력: NULL + 1 = null

// 오류가 안 납니다. 결과가 NULL 이 될 뿐입니다.
// 개념03 의 NULL 규칙 그대로 — NULL 이 낀 계산은 전부 NULL 입니다.

db.prepare("UPDATE 설비 SET 온도 = COALESCE(온도, 0) + 1 WHERE 이름 = ?").run("온도없음");
console.log("COALESCE 쓰면 =", db.prepare("SELECT 온도 FROM 설비 WHERE 이름 = '온도없음'").get().온도);
// 출력: COALESCE 쓰면 = 1

// COALESCE(값, 대신값) 는 "값이 NULL 이면 대신값을 써라" 입니다.
// 자바스크립트의 ?? 와 같은 일을 합니다.

// ============================================================
// 6. RETURNING — 고치고 나서 결과를 바로 받기
// ============================================================
//
// 보통은 이렇게 두 번 부릅니다.
//
//   run(...);              고치고
//   get(...);              다시 읽어서 응답에 담고
//
// RETURNING 을 쓰면 한 번에 끝납니다.

db = 새db();

const 바뀐것 = db.prepare(`
  UPDATE 설비 SET 상태 = ?, 온도 = ?
  WHERE id = ?
  RETURNING id, 이름, 상태, 온도
`).get("고장", 55.0, 2);

console.log({ ...바뀐것 });
// 출력: { id: 2, '이름': '프레스 1호', '상태': '고장', '온도': 55 }

// ★★ RETURNING 은 .get() 이나 .all() 로 받아야 합니다.
//   .run() 으로 받으면 { changes, lastInsertRowid } 만 나오고 줄은 사라집니다.

const 잘못받기 = db.prepare("UPDATE 설비 SET 온도 = ? WHERE id = ? RETURNING *").run(60.0, 2);
console.log(잘못받기);
// 출력: { changes: 1, lastInsertRowid: 5 }

// ★ 못 찾았을 때는 get() 이 undefined 를 줍니다. 404 판단에 그대로 쓸 수 있습니다.

const 없는것 = db.prepare("UPDATE 설비 SET 온도 = ? WHERE id = ? RETURNING *").get(60.0, 9999);
console.log(없는것);
// 출력: undefined

// INSERT 에도 됩니다. lastInsertRowid 로 다시 조회할 필요가 없어집니다.

const 만든것 = db.prepare(`
  INSERT INTO 설비 (이름, 라인) VALUES (?, ?)
  RETURNING id, 이름, 상태
`).get("펌프 1호", "D");
console.log({ ...만든것 });
// 출력: { id: 6, '이름': '펌프 1호', '상태': '정상' }

// DEFAULT 로 채워진 '정상' 까지 한 번에 받았습니다.
//
// ★ RETURNING 은 SQLite 3.35(2021) 부터입니다.
//   Postgres 에도 있습니다. MySQL 에는 없습니다.

// ============================================================
// 7. UPSERT — 있으면 고치고 없으면 넣기
// ============================================================

db = 새db();

const 등록 = db.prepare(`
  INSERT INTO 설비 (이름, 라인, 온도) VALUES (?, ?, ?)
  ON CONFLICT(이름) DO UPDATE SET 온도 = excluded.온도
`);

등록.run("펌프 1호", "D", 30.0);
console.log("처음:", db.prepare("SELECT 온도 FROM 설비 WHERE 이름 = '펌프 1호'").get().온도);
// 출력: 처음: 30

등록.run("펌프 1호", "D", 99.0);
console.log("다시:", db.prepare("SELECT 온도 FROM 설비 WHERE 이름 = '펌프 1호'").get().온도);
// 출력: 다시: 99

console.log("줄 수:", db.prepare("SELECT COUNT(*) AS n FROM 설비 WHERE 이름 = '펌프 1호'").get().n);
// 출력: 줄 수: 1

// ON CONFLICT(이름) — 이름이 겹치면
// DO UPDATE SET ...  — 넣는 대신 고쳐라
// excluded.온도      — 넣으려고 했던 그 값
//
// ★ "먼저 SELECT 해 보고 없으면 INSERT, 있으면 UPDATE" 로 짜면
//   확인과 실행 사이에 남이 끼어들 수 있습니다. (개념05 의 경합)
//   UPSERT 는 한 문장이라 그 틈이 없습니다.

// ============================================================
// 8. 규칙을 어기는 UPDATE 는 막힙니다
// ============================================================

db = 새db();

function 시도(설명, 하기) {
  try {
    하기();
    console.log(`${설명} → 통과`);
  } catch (에러) {
    console.log(`${설명} → 거절: ${에러.message}`);
  }
}

시도("없는 상태값", () => db.prepare("UPDATE 설비 SET 상태 = ? WHERE id = ?").run("수리중", 1));
// 출력: 없는 상태값 → 거절: CHECK constraint failed: 상태 IN ('정상', '점검중', '고장')
시도("겹치는 이름", () => db.prepare("UPDATE 설비 SET 이름 = ? WHERE id = ?").run("프레스 1호", 1));
// 출력: 겹치는 이름 → 거절: UNIQUE constraint failed: 설비.이름

console.log({ ...db.prepare("SELECT 이름, 상태 FROM 설비 WHERE id = 1").get() });
// 출력: { '이름': '용접로봇 1호', '상태': '정상' }

// ★ 실패한 UPDATE 는 아무것도 안 바꿉니다. 원래대로입니다.
//   개념02 에서 건 규칙이 여기서 값을 합니다.
//   코드에 if 문을 안 써도 잘못된 값이 못 들어갑니다.

// ============================================================
// 9. DELETE
// ============================================================

db = 새db();

console.log(db.prepare("DELETE FROM 설비 WHERE id = ?").run(1));
// 출력: { changes: 1, lastInsertRowid: 5 }
console.log(db.prepare("DELETE FROM 설비 WHERE id = ?").run(9999));
// 출력: { changes: 0, lastInsertRowid: 5 }
console.log(db.prepare("DELETE FROM 설비 WHERE 라인 = ?").run("B"));
// 출력: { changes: 2, lastInsertRowid: 5 }

console.log("남은:", db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 남은: 2

// UPDATE 와 똑같습니다. changes 로 404 를 판단합니다.
//
// ★★ WHERE 없는 DELETE 는 표를 비웁니다.

console.log(db.prepare("DELETE FROM 설비").run());
// 출력: { changes: 2, lastInsertRowid: 5 }
console.log("남은:", db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 남은: 0

// 표 자체는 남아 있습니다. 안이 빈 것뿐입니다. (DROP TABLE 과 다릅니다)

// ============================================================
// 10. 지우지 말고 표시만 하기 (소프트 삭제)
// ============================================================
//
// 실무에서는 진짜로 지우는 일이 생각보다 적습니다.
//
//   주문을 지웠는데 매출 통계가 틀어진다
//   회원을 지웠는데 그 사람이 쓴 글이 고아가 된다
//   "실수로 지웠어요" 를 복구할 방법이 없다
//
// 그래서 칸을 하나 두고 표시만 합니다.

const 소프트db = new DatabaseSync(":memory:");
소프트db.exec(`
  CREATE TABLE 설비 (
    id     INTEGER PRIMARY KEY,
    이름   TEXT    NOT NULL,
    삭제시각 TEXT
  ) STRICT
`);
소프트db.exec("INSERT INTO 설비 (이름) VALUES ('용접로봇 1호'), ('프레스 1호')");

소프트db.prepare(`
  UPDATE 설비 SET 삭제시각 = datetime('now', 'localtime') WHERE id = ?
`).run(1);

const 살아있는것 = 소프트db.prepare("SELECT 이름 FROM 설비 WHERE 삭제시각 IS NULL").all();
console.log(JSON.stringify(살아있는것.map((설비) => 설비.이름)));
// 출력: ["프레스 1호"]

console.log("실제로는 남아 있음:", 소프트db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 실제로는 남아 있음: 2

// ★ 대신 모든 조회에 WHERE 삭제시각 IS NULL 을 빠짐없이 붙여야 합니다.
//   하나라도 빠뜨리면 지운 게 화면에 나옵니다.
//   그래서 저장소(repository) 계층에 조회 함수를 모아 두는 게 중요합니다. (04단원)

// ============================================================
// 11. 외래키가 걸린 줄을 지우면
// ============================================================

const 관계db = new DatabaseSync(":memory:");
관계db.exec("PRAGMA foreign_keys = ON");   // ★ 버전·도구에 따라 기본값이 다릅니다

관계db.exec("CREATE TABLE 라인 (코드 TEXT PRIMARY KEY) STRICT");
관계db.exec(`
  CREATE TABLE 설비 (
    id INTEGER PRIMARY KEY,
    라인코드 TEXT NOT NULL REFERENCES 라인(코드)
  ) STRICT
`);
관계db.exec("INSERT INTO 라인 VALUES ('A')");
관계db.exec("INSERT INTO 설비 (라인코드) VALUES ('A')");

시도("설비가 있는 라인 삭제", () => 관계db.prepare("DELETE FROM 라인 WHERE 코드 = ?").run("A"));
// 출력: 설비가 있는 라인 삭제 → 거절: FOREIGN KEY constraint failed

// A 라인에 설비가 남아 있으니 라인을 못 지웁니다.
// 지웠다면 그 설비의 라인코드가 없는 라인을 가리키게 됐을 겁니다.
//
// ★ 같이 지우고 싶으면 ON DELETE CASCADE 를 걸어 둡니다.

const 연쇄db = new DatabaseSync(":memory:");
연쇄db.exec("PRAGMA foreign_keys = ON");   // ★ 이게 없으면 CASCADE 가 안 돕니다

연쇄db.exec("CREATE TABLE 라인 (코드 TEXT PRIMARY KEY) STRICT");
연쇄db.exec(`
  CREATE TABLE 설비 (
    id INTEGER PRIMARY KEY,
    라인코드 TEXT NOT NULL REFERENCES 라인(코드) ON DELETE CASCADE
  ) STRICT
`);
연쇄db.exec("INSERT INTO 라인 VALUES ('A')");
연쇄db.exec("INSERT INTO 설비 (라인코드) VALUES ('A'), ('A')");

console.log(연쇄db.prepare("DELETE FROM 라인 WHERE 코드 = ?").run("A"));
// 출력: { changes: 1, lastInsertRowid: 2 }
console.log("설비도 사라짐:", 연쇄db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 설비도 사라짐: 0

// ★★ CASCADE 는 편하지만 무섭습니다.
//   라인 하나를 지웠는데 설비 500대가 같이 사라져도 changes 는 1 로 보입니다.
//   정말 같이 사라져야 하는 관계에만 거세요.
//   (주문 ↔ 주문상세 는 CASCADE 가 맞고, 회원 ↔ 주문 은 아닙니다)

db.close();
소프트db.close();
관계db.close();
연쇄db.close();

// ============================================================
// 정리
// ============================================================
//
//   UPDATE 표 SET 칸 = ? WHERE 조건
//   DELETE FROM 표 WHERE 조건
//
//   changes === 0  →  못 찾았다 →  404
//   WHERE 를 빠뜨리면 전부 바뀝니다. 오류는 안 납니다.
//
//   온도 = 온도 + 1     DB 안에서 계산 (경합 안 남)
//   COALESCE(온도, 0)   NULL 이면 대신 쓸 값
//   RETURNING           고친 줄을 바로 받기 (.get() 으로 받을 것)
//   ON CONFLICT DO UPDATE   있으면 고치고 없으면 넣기
//   ON DELETE CASCADE   부모 지우면 자식도 (조심해서)
//
// 다음(개념05) 에서는 여러 요청이 동시에 들어올 때를 다룹니다.
// 07단원에서 자료가 사라졌던 그 실험을 SQL 로 다시 합니다.
