// ============================================================
// 개념 02 — 표 구조를 바꿔야 할 때 (마이그레이션)
// ============================================================
//
// 서버를 만들어 배포했습니다. 자료가 쌓였습니다.
// 그런데 "설비에 담당자 칸을 추가해 주세요" 라는 요청이 옵니다.
//
// CREATE TABLE 을 고치면 될까요? 안 됩니다.
// IF NOT EXISTS 때문에 이미 있는 표는 그냥 넘어갑니다. (02단원 개념02)
//
// 이 단원은 "이미 자료가 든 표를 어떻게 바꾸는가" 입니다.
// 실무에서 제일 조심해야 하는 작업입니다.
//
// 실행: node 개념02_스키마_바꾸기.js
// ============================================================

const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");

const 폴더 = path.join(__dirname, "data");
fs.mkdirSync(폴더, { recursive: true });

// ============================================================
// 1. 문제 상황 만들기
// ============================================================
//
// 이미 운영 중인 DB 를 흉내 냅니다. 자료가 들어 있습니다.

const DB경로 = path.join(폴더, "마이그레이션연습.db");
fs.rmSync(DB경로, { force: true });
fs.rmSync(`${DB경로}-wal`, { force: true });
fs.rmSync(`${DB경로}-shm`, { force: true });

const db = new DatabaseSync(DB경로);
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS 설비 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT    NOT NULL UNIQUE,
    line   TEXT    NOT NULL,
    status TEXT    NOT NULL DEFAULT '정지'
  ) STRICT
`);

db.exec(`
  INSERT INTO 설비 (name, line, status) VALUES
    ('컨베이어 1호', 'A', '가동'),
    ('프레스 1호',   'B', '정지')
`);

console.log("지금 칸:", db.prepare("SELECT name FROM pragma_table_info('설비')").all()
  .map((칸) => 칸.name).join(", "));
// 출력: 지금 칸: id, name, line, status

// ★ pragma_table_info('설비') 는 PRAGMA table_info 를 표처럼 쓰는 문법입니다.
//   WHERE 나 JOIN 을 붙일 수 있어서 편합니다. SQLite 3.16 부터 됩니다.

// ============================================================
// 2. 안 되는 방법 — CREATE TABLE 을 고치기
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS 설비 (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT    NOT NULL UNIQUE,
    line    TEXT    NOT NULL,
    status  TEXT    NOT NULL DEFAULT '정지',
    담당자   TEXT
  ) STRICT
`);

console.log("고친 뒤 칸:", db.prepare("SELECT name FROM pragma_table_info('설비')").all()
  .map((칸) => 칸.name).join(", "));
// 출력: 고친 뒤 칸: id, name, line, status

// ★★★ 담당자 칸이 안 생겼습니다. 오류도 안 났습니다.
//
//   IF NOT EXISTS 는 "있으면 아무것도 하지 마라" 입니다.
//   안에 뭘 적었는지는 보지도 않습니다.
//
//   그래서 이런 일이 생깁니다.
//
//     내 컴퓨터  DB 파일을 지우고 다시 켰다  → 담당자 칸이 있다  → 잘 된다
//     운영 서버  DB 파일이 그대로다          → 담당자 칸이 없다  → 500 이 난다
//
//   "제 컴퓨터에서는 되는데요" 의 아주 흔한 원인입니다.

// ============================================================
// 3. 되는 방법 — ALTER TABLE
// ============================================================

db.exec("ALTER TABLE 설비 ADD COLUMN 담당자 TEXT");

console.log("ALTER 뒤 칸:", db.prepare("SELECT name FROM pragma_table_info('설비')").all()
  .map((칸) => 칸.name).join(", "));
// 출력: ALTER 뒤 칸: id, name, line, status, 담당자

console.log("기존 자료는:", JSON.stringify(
  db.prepare("SELECT name, 담당자 FROM 설비 ORDER BY id").all().map((행) => `${행.name}/${행.담당자}`)
));
// 출력: 기존 자료는: ["컨베이어 1호/null","프레스 1호/null"]

// 자료는 그대로 있고, 새 칸만 NULL 로 채워졌습니다.
//
// ★ NOT NULL 칸을 추가하려면 DEFAULT 를 같이 줘야 합니다. (02단원 개념02)
//     ALTER TABLE 설비 ADD COLUMN 비고 TEXT NOT NULL DEFAULT ''

// ============================================================
// 4. 그럼 코드에 어떻게 적어 두나
// ============================================================
//
// 서버를 켤 때마다 ALTER TABLE 을 실행하면 두 번째부터 오류가 납니다.

try {
  db.exec("ALTER TABLE 설비 ADD COLUMN 담당자 TEXT");
} catch (에러) {
  console.log(에러.message);
  // 출력: duplicate column name: 담당자
}

// ★ SQLite 에는 ADD COLUMN IF NOT EXISTS 가 없습니다.
//   (Postgres 에는 있습니다)
//
// 세 가지 방법이 있습니다. 하나씩 봅니다.

// ============================================================
// 5. 방법 ① 칸이 있는지 보고 결정하기
// ============================================================

function 칸있나(표, 칸) {
  return db.prepare(`
    SELECT COUNT(*) AS n FROM pragma_table_info(?) WHERE name = ?
  `).get(표, 칸).n > 0;
}

function 칸없으면추가(표, 칸, 정의) {
  if (칸있나(표, 칸)) return false;

  db.exec(`ALTER TABLE ${표} ADD COLUMN ${칸} ${정의}`);
  return true;
}

console.log("담당자 추가:", 칸없으면추가("설비", "담당자", "TEXT"));
// 출력: 담당자 추가: false
console.log("메모 추가:", 칸없으면추가("설비", "메모", "TEXT NOT NULL DEFAULT ''"));
// 출력: 메모 추가: true
console.log("메모 또 추가:", 칸없으면추가("설비", "메모", "TEXT NOT NULL DEFAULT ''"));
// 출력: 메모 또 추가: false

// ★ 몇 번 실행해도 결과가 같습니다. 이런 성질을 "여러 번 해도 같다" 고 합니다.
//   서버가 켜질 때 실행되는 코드는 반드시 이래야 합니다.
//   배포할 때마다, 서버 인스턴스마다 실행되니까요.
//
// ★ 표 이름과 칸 이름을 이어 붙였습니다. 위험하지 않나요?
//   내가 코드에 적은 값만 들어갑니다. 사용자 입력이 닿지 않습니다.
//   ALTER TABLE 의 표·칸 이름은 자리표시자로 못 넘깁니다. 어쩔 수 없습니다.
//   대신 이 함수를 사용자 입력으로 부르지 않도록 하세요.

// ============================================================
// 6. 방법 ② 번호를 매겨서 관리하기 (권합니다)
// ============================================================
//
// 칸을 하나 추가하는 정도면 방법 ① 로 됩니다.
// 그런데 바꿀 게 많아지면 순서가 중요해집니다.
//
//   3번 작업: 점검 표를 만든다
//   4번 작업: 점검 표에 색인을 건다      ← 3번이 먼저여야 합니다
//   5번 작업: 설비의 옛 자료를 옮긴다
//
// SQLite 에는 "지금 몇 번까지 했는지" 를 적어 두는 자리가 있습니다.

console.log("지금 버전:", db.prepare("PRAGMA user_version").get().user_version);
// 출력: 지금 버전: 0

// 0 입니다. 아무것도 안 했다는 뜻입니다.
// 이걸 이용해서 작업 목록을 만듭니다.

const 작업들 = [
  // 1번
  (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS 점검 (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        설비id INTEGER NOT NULL REFERENCES 설비(id) ON DELETE CASCADE,
        결과   TEXT    NOT NULL CHECK (결과 IN ('정상', '이상')),
        시각   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      ) STRICT
    `);
  },
  // 2번
  (db) => {
    // 03단원 개념04 — 외래키에는 색인을 직접 걸어야 합니다
    db.exec("CREATE INDEX IF NOT EXISTS 점검_설비id ON 점검(설비id)");
  },
  // 3번
  (db) => {
    db.exec("ALTER TABLE 설비 ADD COLUMN 등록시각 TEXT");
    db.exec("UPDATE 설비 SET 등록시각 = '2026-01-01 00:00:00' WHERE 등록시각 IS NULL");
  },
];

function 마이그레이션(db) {
  const 지금 = db.prepare("PRAGMA user_version").get().user_version;
  let 한것 = 0;

  for (let 번호 = 지금; 번호 < 작업들.length; 번호++) {
    db.exec("BEGIN");
    try {
      작업들[번호](db);

      // ★ PRAGMA 에는 자리표시자를 못 씁니다. 재 봤습니다.
      //     db.prepare("PRAGMA user_version = ?").run(5)
      //     → near "?": syntax error
      //   그래서 숫자를 직접 넣습니다. 우리가 만든 숫자라 안전합니다.
      db.exec(`PRAGMA user_version = ${번호 + 1}`);

      db.exec("COMMIT");
      한것 += 1;
    } catch (에러) {
      db.exec("ROLLBACK");
      throw new Error(`${번호 + 1}번 작업 실패: ${에러.message}`);
    }
  }

  return 한것;
}

console.log("처음 실행 — 한 작업 수:", 마이그레이션(db));
// 출력: 처음 실행 — 한 작업 수: 3
console.log("버전:", db.prepare("PRAGMA user_version").get().user_version);
// 출력: 버전: 3

console.log("두 번째 실행 — 한 작업 수:", 마이그레이션(db));
// 출력: 두 번째 실행 — 한 작업 수: 0

// 두 번째에는 아무것도 안 합니다. 이미 3번까지 했다고 적혀 있으니까요.

console.log("점검 표 생겼나:", db.prepare(`
  SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = '점검'
`).get().n === 1);
// 출력: 점검 표 생겼나: true

console.log("등록시각 채워졌나:", db.prepare(`
  SELECT COUNT(*) AS n FROM 설비 WHERE 등록시각 IS NOT NULL
`).get().n);
// 출력: 등록시각 채워졌나: 2

// ★★ 작업 하나하나를 트랜잭션으로 감쌌습니다. (02단원 개념05)
//   3번 작업은 ALTER 와 UPDATE 두 문장입니다.
//   ALTER 만 되고 UPDATE 에서 실패하면 반쯤 바뀐 상태로 남습니다.
//   그러면 다시 실행할 때 "duplicate column name" 이 나서 영원히 막힙니다.
//
// ★★★ 규칙 세 가지
//
//   ① 작업 목록에서 **이미 배포한 것을 절대 고치지 않습니다.**
//      1번을 고치면, 이미 3번까지 간 서버에서는 그 수정이 실행되지 않습니다.
//      고칠 게 있으면 4번을 새로 추가하세요.
//
//   ② 작업 순서를 바꾸지 않습니다. 번호가 곧 순서입니다.
//
//   ③ 되돌리는 작업은 만들지 않는 편이 낫습니다.
//      "칸을 지우는 되돌리기" 는 자료를 잃습니다.
//      잘못됐으면 바로잡는 작업을 새로 추가하세요.

// ============================================================
// 7. 방법 ③ 표를 다시 만들기
// ============================================================
//
// SQLite 로는 못 하는 것들이 있습니다. (02단원 개념02)
//
//   칸 타입 바꾸기          ✗
//   NOT NULL 붙이기/떼기    ✗
//   CHECK 추가/삭제         ✗
//   칸 순서 바꾸기          ✗
//
// 이럴 때는 새 표를 만들고 옮겨 담습니다.
//
// 예: line 칸에 CHECK 를 걸고 싶습니다. 지금은 아무 값이나 들어갑니다.

db.prepare("INSERT INTO 설비 (name, line) VALUES (?, ?)").run("이상한설비", "Z");
console.log("Z 라인이 들어갔나:", db.prepare(`
  SELECT COUNT(*) AS n FROM 설비 WHERE line = 'Z'
`).get().n);
// 출력: Z 라인이 들어갔나: 1

// 잘못된 자료를 먼저 정리한 다음, 표를 다시 만듭니다.

// ★★★ 그 전에 — 자식 표에 자료를 넣어 둡니다. 이게 살아남는지 볼 겁니다.
//   점검.설비id 는 설비(id) 를 ON DELETE CASCADE 로 가리키고 있습니다. (1번 작업)

for (const 행 of db.prepare("SELECT id FROM 설비").all()) {
  db.prepare("INSERT INTO 점검 (설비id, 결과) VALUES (?, '정상')").run(행.id);
}
console.log("재작성 전 점검 기록:", db.prepare("SELECT COUNT(*) AS n FROM 점검").get().n, "건");
// 출력: 재작성 전 점검 기록: 3 건

// ★★★ 외래키를 끄고 시작합니다. 이 한 줄이 없으면 자료가 사라집니다.
//
//   ④ 에서 DROP TABLE 설비 를 합니다.
//   외래키가 켜져 있으면 그 순간 ON DELETE CASCADE 가 돕니다.
//   → 점검 표의 기록이 **전부** 지워집니다.
//
//   ★ 더 나쁜 것은 아무도 모른다는 겁니다.
//     오류도 안 나고, 아래 PRAGMA foreign_key_check 도 0 건입니다.
//     가리킬 대상이 없어진 게 아니라, 가리키던 줄이 같이 사라진 거니까요.
//
//   ★ 트랜잭션 **밖**에서 꺼야 합니다.
//     BEGIN 안에서 이 PRAGMA 를 쓰면 아무 일도 일어나지 않습니다.
//
//   이건 SQLite 공식 문서가 정한 표 재작성 순서입니다.

db.exec("PRAGMA foreign_keys = OFF");

db.exec("BEGIN");
try {
  // ① 잘못된 자료 정리 (안 하면 새 표의 CHECK 에 걸려서 실패합니다)
  db.prepare("UPDATE 설비 SET line = 'A' WHERE line NOT IN ('A', 'B', 'C')").run();

  // ② 원하는 모양으로 새 표를 만든다
  db.exec(`
    CREATE TABLE 설비_새것 (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT    NOT NULL UNIQUE,
      line     TEXT    NOT NULL CHECK (line IN ('A', 'B', 'C')),
      status   TEXT    NOT NULL DEFAULT '정지'
                       CHECK (status IN ('가동', '정지', '점검중')),
      담당자    TEXT,
      메모      TEXT    NOT NULL DEFAULT '',
      등록시각  TEXT
    ) STRICT
  `);

  // ③ 옮겨 담는다 (칸을 하나하나 적으세요. * 를 쓰면 순서가 어긋납니다)
  db.exec(`
    INSERT INTO 설비_새것 (id, name, line, status, 담당자, 메모, 등록시각)
    SELECT id, name, line, status, 담당자, 메모, 등록시각 FROM 설비
  `);

  // ④ 옛 표를 지우고 이름을 바꾼다
  db.exec("DROP TABLE 설비");
  db.exec("ALTER TABLE 설비_새것 RENAME TO 설비");

  // ⑤ 색인을 다시 만든다 ★ 잊기 쉽습니다
  db.exec("CREATE INDEX IF NOT EXISTS 설비_line ON 설비(line)");

  // ⑥ ★ COMMIT **전에** 외래키가 어긋나지 않았는지 봅니다
  //   COMMIT 뒤에 보면 어긋난 걸 찾아도 되돌릴 방법이 없습니다.
  const 어긋남 = db.prepare("PRAGMA foreign_key_check").all();
  if (어긋남.length > 0) {
    throw new Error(`외래키가 어긋났습니다: ${어긋남.length}건`);
  }

  db.exec("COMMIT");
  console.log("표 다시 만들기 성공");
  // 출력: 표 다시 만들기 성공
} catch (에러) {
  db.exec("ROLLBACK");
  console.log("실패해서 되돌림:", 에러.message);
} finally {
  // ★ 성공하든 실패하든 반드시 다시 켭니다. 끈 채로 두면 그 뒤가 전부 무방비입니다.
  db.exec("PRAGMA foreign_keys = ON");
}

console.log("재작성 후 점검 기록:", db.prepare("SELECT COUNT(*) AS n FROM 점검").get().n, "건");
// 출력: 재작성 후 점검 기록: 3 건
// ★ 그대로 남아 있습니다. PRAGMA foreign_keys = OFF 가 지켜 준 것입니다.
//   그 한 줄을 빼고 다시 돌려 보세요. 0 건이 됩니다.

console.log("자료 살아 있나:", db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 자료 살아 있나: 3

try {
  db.prepare("INSERT INTO 설비 (name, line) VALUES (?, ?)").run("또이상한설비", "Z");
} catch (에러) {
  console.log(에러.message);
  // 출력: CHECK constraint failed: line IN ('A', 'B', 'C')
}

// 이제 Z 라인이 막힙니다.

// ★★ 놓치기 쉬운 것들
//
//   · 색인을 다시 만들어야 합니다. DROP TABLE 하면 그 표의 색인도 같이 사라집니다.
//   · 다른 표가 이 표를 REFERENCES 하고 있으면 그쪽도 손봐야 합니다.
//     (점검.설비id 가 설비(id) 를 가리키고 있습니다. 아래에서 확인합니다)
//   · SELECT * 를 쓰지 마세요. 칸 순서가 다르면 값이 엉뚱한 칸에 들어갑니다.
//     오류도 안 납니다. 타입이 맞으면 그냥 들어갑니다.

console.log("점검 표의 외래키가 아직 살아 있나:", db.prepare(`
  SELECT COUNT(*) AS n FROM pragma_foreign_key_list('점검') WHERE "table" = '설비'
`).get().n === 1);
// 출력: 점검 표의 외래키가 아직 살아 있나: true

// ★ 이름을 바꿨더니 외래키가 새 표를 가리키게 됐습니다. 운이 좋았습니다.
//   실제로는 legacy_alter_table 설정에 따라 달라집니다.
//   자식 표가 있는 표를 다시 만들 때는
//   PRAGMA foreign_key_check 로 반드시 확인하세요.

const 어긋난것 = db.prepare("PRAGMA foreign_key_check").all();
console.log("어긋난 외래키 건수:", 어긋난것.length);
// 출력: 어긋난 외래키 건수: 0

// ============================================================
// 8. 백업 없이 하지 마세요
// ============================================================
//
// 위 작업들은 다 자료를 만집니다. DROP TABLE 이 들어 있습니다.
// 트랜잭션이 지켜 주는 건 "그 실행 안에서" 뿐입니다.
//
// 코드가 잘못 짜여 있으면(예: 옮겨 담을 칸을 빠뜨렸으면)
// COMMIT 이 성공해도 자료가 사라집니다. 되돌릴 방법이 없습니다.
//
// ★ SQLite 백업은 파일 복사입니다. 다만 WAL 파일까지 같이 복사해야 합니다.
//
//   더 안전한 방법은 SQLite 에게 시키는 것입니다.

const 백업경로 = path.join(폴더, "백업.db");
fs.rmSync(백업경로, { force: true });

db.exec(`VACUUM INTO '${백업경로.replace(/\\/g, "/")}'`);

console.log("백업 파일 생겼나:", fs.existsSync(백업경로));
// 출력: 백업 파일 생겼나: true

const 백업db = new DatabaseSync(백업경로);
console.log("백업 안의 설비 수:", 백업db.prepare("SELECT COUNT(*) AS n FROM 설비").get().n);
// 출력: 백업 안의 설비 수: 3
백업db.close();

// ★★ VACUUM INTO 는 서버가 돌아가는 중에도 안전합니다.
//   WAL 에 있는 내용까지 정리해서 하나의 파일로 만들어 줍니다.
//   -wal, -shm 파일이 따로 안 생깁니다. 그 파일 하나만 챙기면 됩니다.
//   SQLite 3.27(2019) 부터 됩니다.
//
// ★ 경로의 \ 를 / 로 바꿨습니다.
//
//   SQLite 자체는 \ 를 특별하게 보지 않습니다. 그냥 글자입니다.
//   (SELECT length('a\b') 는 3 입니다)
//   작은따옴표 안에서 이스케이프가 되는 건 '' 뿐입니다.
//
//   바꾸는 진짜 이유는 **자바스크립트 쪽**입니다.
//   JS 문자열에서 "C:\앱" 이라고 쓰면 \앱 이 이스케이프로 먹혀 버립니다.
//   "C:\\앱" 이라고 두 번 써야 하는데, 잊기 쉽습니다.
//
//   윈도우도 / 를 경로 구분자로 받아 줍니다. 그래서 / 로 통일하는 게 편합니다.
//
// ★★★ 운영 순서
//
//   1) VACUUM INTO 로 백업
//   2) 백업 파일을 열어서 자료가 들어 있는지 확인   ← 이걸 꼭 하세요
//   3) 마이그레이션 실행
//   4) 확인
//
//   백업을 만들었다는 것과 그 백업이 쓸 수 있다는 것은 다릅니다.

db.close();

// ============================================================
// 정리
// ============================================================
//
//   CREATE TABLE IF NOT EXISTS 를 고쳐도 이미 있는 표는 안 바뀝니다.
//   "제 컴퓨터에서는 되는데요" 의 흔한 원인입니다.
//
//   칸 추가        ALTER TABLE ... ADD COLUMN
//                  NOT NULL 이면 DEFAULT 를 같이
//                  두 번 실행되면 duplicate column name
//
//   여러 번 해도 같게 만드는 법
//     ① pragma_table_info 로 칸이 있는지 보고 결정
//     ② PRAGMA user_version 으로 번호를 매겨 관리 ← 권합니다
//     ③ 못 바꾸는 것은 새 표 만들고 옮겨 담기
//
//   번호 관리 규칙
//     이미 배포한 작업은 절대 고치지 않는다
//     순서를 바꾸지 않는다
//     작업 하나를 트랜잭션으로 감싼다
//
//   표를 다시 만들 때 잊는 것
//     색인 다시 만들기, 외래키 확인, SELECT * 안 쓰기
//
//   VACUUM INTO '경로'  로 백업하고, 백업을 열어서 확인하세요.
//
// 다음(개념03) 에서 목록이 커졌을 때 나눠서 주는 법을 봅니다.
