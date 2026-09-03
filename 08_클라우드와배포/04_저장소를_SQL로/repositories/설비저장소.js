// ============================================================
// repositories/설비저장소.js — 설비 데이터를 읽고 쓰는 곳 (SQL 판)
// ------------------------------------------------------------
// 백엔드 07단원의 같은 이름 파일을 SQL 로 다시 쓴 것입니다.
// **내보내는 함수의 이름과 약속이 똑같습니다.**
//
//   전부()          → 배열
//   하나(id)        → 객체 또는 null
//   추가(값)        → id 가 붙은 객체
//   수정(id, 바꿀것) → 객체 또는 null
//   삭제(id)        → true / false
//   초기화(목록)     → 없음
//
// 그래서 services / controllers / routes 는 **한 글자도 안 고칩니다.**
// 07단원에서 "나중에 DB 로 바꿀 때 이 파일만 고칩니다" 라고 했던
// 그 약속을 지키는 파일입니다.
// ============================================================

const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// ── DB 열기 ──

const DB경로 = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(__dirname, "..", "data", "설비.db");

fs.mkdirSync(path.dirname(DB경로), { recursive: true });

const db = new DatabaseSync(DB경로, { timeout: 5000 });

// 02단원 개념05 에서 정리한 두 줄입니다.
db.exec("PRAGMA journal_mode = WAL"); // 쓰는 중에도 읽기가 막히지 않게
db.exec("PRAGMA foreign_keys = ON"); // node:sqlite 는 기본이 ON 이지만 명시

// ── 표 만들기 ──
//
// 서버를 켤 때마다 실행됩니다. IF NOT EXISTS 라서 두 번째부터는 넘어갑니다.
// (02단원 개념02 — 안에 적은 내용이 달라도 고쳐 주지 않는다는 점을 기억하세요)

db.exec(`
  CREATE TABLE IF NOT EXISTS 설비 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT    NOT NULL UNIQUE,
    line   TEXT    NOT NULL CHECK (line IN ('A', 'B', 'C')),
    status TEXT    NOT NULL DEFAULT '정지'
                   CHECK (status IN ('가동', '정지', '점검중'))
  ) STRICT
`);

// ★ 칸 이름이 영어입니다. 07단원의 JSON 이 { id, name, line, status } 였으니
//   그대로 맞춰야 서비스가 안 고쳐집니다.
//   "저장소가 바깥의 모양을 지킨다" 는 게 이 파일의 일입니다.
//
// ★ AUTOINCREMENT 를 붙인 이유 (02단원 개념01)
//   안 붙이면 지운 id 가 재활용됩니다.
//   3번을 지우고 새로 넣으면 또 3번이 됩니다.
//   07단원의 파일 저장소는 Math.max(...ids) + 1 이라 재활용되지 않았습니다.
//   그 동작을 맞추려면 AUTOINCREMENT 가 필요합니다.
//
// ★ CHECK 를 걸어 뒀지만 서비스에도 검증이 있습니다. 중복인가요?
//   아닙니다. 역할이 다릅니다.
//     서비스의 검증  → 사용자에게 "line 은 A, B, C 중 하나입니다" 를 알려 줌
//     DB 의 CHECK    → 어떤 경로로 들어와도 이상한 값이 안 들어가게 막음
//   서비스를 안 거치는 배치 작업이나 손으로 치는 SQL 도 있습니다.
//   마지막 방어선은 DB 에 있어야 합니다.

// ── 문장 미리 준비 ──
//
// 02단원 개념03 에서 본 것처럼, prepare 는 모듈이 처음 불릴 때 한 번만 합니다.
// 요청마다 다시 하면 매번 SQL 을 새로 해석합니다.

const 문장 = {
  전부: db.prepare("SELECT id, name, line, status FROM 설비 ORDER BY id"),
  하나: db.prepare("SELECT id, name, line, status FROM 설비 WHERE id = ?"),
  추가: db.prepare(`
    INSERT INTO 설비 (name, line, status) VALUES (?, ?, ?)
    RETURNING id, name, line, status
  `),
  번호까지추가: db.prepare(`
    INSERT INTO 설비 (id, name, line, status) VALUES (?, ?, ?, ?)
    RETURNING id, name, line, status
  `),
  삭제: db.prepare("DELETE FROM 설비 WHERE id = ?"),
  비우기: db.prepare("DELETE FROM 설비"),
  번호되돌리기: db.prepare("DELETE FROM sqlite_sequence WHERE name = '설비'"),
};

// ★ 왜 SELECT * 를 안 쓰나 (02단원 개념03)
//   나중에 칸을 하나 추가하면 그게 그대로 API 응답에 실려 나갑니다.
//   비밀번호 같은 칸이었다면 사고입니다.
//   필요한 칸을 적어 두면 칸이 늘어도 응답은 그대로입니다.


// ── 밖에 내주는 것 ──

async function 전부() {
  return 문장.전부.all();
}

// ★ async 를 붙였습니다. node:sqlite 는 동기인데 왜?
//
//   서비스가 await 저장소.전부() 로 부르고 있기 때문입니다.
//   그 코드를 안 고치는 게 이 단원의 목표입니다.
//
//   async 함수는 값을 Promise 로 감싸서 돌려줍니다.
//   그러니 await 로 받아도 잘 동작합니다.
//
//   ★★ 그리고 이게 나중에 도움이 됩니다.
//      05단원에서 Supabase(진짜 비동기) 로 바꿀 때
//      함수 모양이 이미 async 라서 안쪽만 고치면 됩니다.

async function 하나(id) {
  return 문장.하나.get(id) ?? null;
}

// ★ .get() 은 못 찾으면 undefined 입니다. (02단원 개념03)
//   07단원의 약속은 null 이었습니다. ?? null 로 맞춰 줍니다.
//
//   이 한 줄이 없으면 서비스의 if (설비 === null) 이 안 걸립니다.
//   undefined 는 null 과 === 로 같지 않습니다.
//   그러면 404 가 나가야 할 자리에서 500 이 납니다.
//   저장소를 갈아 끼울 때 가장 실수하기 쉬운 지점입니다.

async function 추가(값) {
  return 문장.추가.get(값.name, 값.line, 값.status ?? "정지");
}

// ★ RETURNING 으로 만든 줄을 바로 받았습니다. (02단원 개념04)
//   파일 판에서는 목록을 다시 읽어야 했지만 여기서는 한 번에 끝납니다.
//
// ★ 값.status ?? "정지" — undefined 는 바인딩이 안 됩니다. (02단원 개념03)
//   서비스가 항상 status 를 넣어 주지만, 저장소가 스스로도 지키게 해 둡니다.

async function 수정(id, 바꿀것) {
  // 바꿀 수 있는 칸만 골라 냅니다. id 는 절대 안 바꿉니다.
  const 고칠칸 = ["name", "line", "status"].filter((칸) => 바꿀것[칸] !== undefined);

  if (고칠칸.length === 0) return 하나(id);

  const 설정 = 고칠칸.map((칸) => `${칸} = ?`).join(", ");
  const 값들 = 고칠칸.map((칸) => 바꿀것[칸]);

  const 결과 = db
    .prepare(`UPDATE 설비 SET ${설정} WHERE id = ? RETURNING id, name, line, status`)
    .get(...값들, id);

  return 결과 ?? null;
}

// ★★ 여기만 prepare 를 미리 못 했습니다. 고칠 칸이 매번 다르기 때문입니다.
//
//   그럼 이어 붙이는 게 위험하지 않나요? (02단원 개념03 의 인젝션)
//   이어 붙이는 것은 **칸 이름**뿐이고, 그 칸 이름은
//   ["name", "line", "status"] 라는 **내가 정한 목록**에서만 나옵니다.
//   사용자가 { "name; DROP TABLE 설비": 1 } 을 보내도 filter 에서 걸러집니다.
//
//   값은 여전히 ? 로 넘어갑니다. 안전합니다.
//   "칸 이름은 허용 목록으로, 값은 자리표시자로" 가 규칙입니다.
//
// ★ 고칠 게 없으면 UPDATE 를 안 하고 현재 값을 돌려줍니다.
//   SET 뒤가 비면 문법 오류가 나기 때문입니다.
//   07단원 파일 판도 { ...원래, ...{} } 라서 원래 값이 나왔습니다. 같은 동작입니다.

async function 삭제(id) {
  return 문장.삭제.run(id).changes > 0;
}

// ★ changes 로 판단합니다. (02단원 개념04)
//   07단원에서 목록 길이를 비교했던 것과 같은 일을 합니다.

async function 초기화(목록) {
  db.exec("BEGIN");
  try {
    문장.비우기.run();
    문장.번호되돌리기.run();

    for (const 설비 of 목록) {
      // ★ id 를 준 경우에는 그 번호를 그대로 씁니다.
      if (설비.id !== undefined) {
        문장.번호까지추가.get(설비.id, 설비.name, 설비.line, 설비.status ?? "정지");
      } else {
        문장.추가.get(설비.name, 설비.line, 설비.status ?? "정지");
      }
    }

    db.exec("COMMIT");
  } catch (에러) {
    db.exec("ROLLBACK");
    throw 에러;
  }
}

// ★★ 트랜잭션으로 묶었습니다. (02단원 개념05)
//   "비우고 다시 채운다" 는 도중에 실패하면 안 됩니다.
//   3번째 설비에서 UNIQUE 위반이 나면, 표가 비어 있는 상태로 남습니다.
//   ROLLBACK 이 있으면 원래 자료가 그대로 돌아옵니다.
//
// ★ sqlite_sequence 를 지우는 이유
//   AUTOINCREMENT 는 "지금까지 쓴 최대 번호" 를 그 표에 기억합니다.
//   안 지우면 초기화 뒤에도 id 가 1 이 아니라 이어집니다.
//   시험할 때마다 id 가 달라지면 서버검증이 못 씁니다.
//
// ★★★ id 를 그대로 쓰게 만든 이유 — 여기서 한 번 걸렸습니다.
//
//   처음에는 id 를 무시하고 AUTOINCREMENT 에 맡겼습니다.
//   그러면 07단원의 서버 코드가 깨집니다. 07단원은 이렇게 넘겨 주니까요.
//
//     await 저장소.초기화([{ id: 1, name: "컨베이어 1호", ... }, ...]);
//
//   파일 저장소는 준 것을 그대로 파일에 씁니다. id 가 살아남습니다.
//   SQL 저장소가 id 를 무시하면 **약속이 달라진 것**입니다.
//
//   개념01 의 대조 시험이 이걸 잡아 줬습니다.
//   "이름만 같으면 안 되고 동작이 같아야 한다" 가 이런 뜻입니다.
//
// ★ 명시적으로 id 를 넣으면 sqlite_sequence 도 그 값에 맞춰 올라갑니다.
//   그래서 초기화 뒤 추가() 는 3번을 받습니다. 파일 판과 같습니다.
//
// ★ 이 함수는 수업용입니다. 진짜 서버에는 있으면 안 됩니다.
//   (07단원과 같은 이야기입니다)

module.exports = { 전부, 하나, 추가, 수정, 삭제, 초기화 };


// ============================================================
// 07단원 파일 판과 비교
// ============================================================
//
//   전부()    readFile + JSON.parse       →  SELECT ... ORDER BY id
//   하나(id)  목록을 다 읽고 find          →  WHERE id = ?   ← 훨씬 빠릅니다
//   추가()    Math.max(...ids) + 1        →  AUTOINCREMENT
//   수정()    { ...원래, ...바꿀것 }       →  UPDATE ... SET (고칠 칸만)
//   삭제()    filter 하고 길이 비교        →  DELETE + changes
//
// ★★ 없어진 것들이 있습니다.
//
//   ① 쓰기 큐 (07단원 개념04 의 '동시에 쓰면 사라진다')
//      파일 판은 읽고→고치고→쓰기 라서 요청이 겹치면 유실됐습니다.
//      SQL 은 UPDATE 한 문장이라 그럴 일이 없습니다.
//      줄 세우는 코드가 통째로 사라졌습니다.
//
//   ② 임시 파일 + rename (찢어진 읽기 막기)
//      SQLite 가 대신 해 줍니다.
//
//   ③ id 겹침 걱정
//      AUTOINCREMENT 가 처리합니다.
//
// ★★★ 그리고 이 파일 밖은 아무것도 안 바뀌었습니다.
//   services / controllers / routes 를 07단원과 비교해 보세요.
//   똑같습니다. 개념01 에서 기계로 확인합니다.
