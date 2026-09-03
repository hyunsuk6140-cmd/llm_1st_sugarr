// ============================================================
// 개념 02 — 표(테이블) 만들기
// ============================================================
//
// 개념01 에서 "데이터베이스는 규칙을 지켜 준다" 고 했습니다.
// 그 규칙을 적는 곳이 바로 표를 만드는 문장, CREATE TABLE 입니다.
//
// 여기서 대충 적으면 나중에 코드로 그걸 다 막아야 합니다.
// 여기서 꼼꼼히 적으면 코드가 짧아집니다.
//
// 실행: node 개념02_표_만들기.js
// ============================================================

const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON");   // ★ 버전·도구에 따라 기본값이 다릅니다. 직접 켭니다.


// ============================================================
// 1. 가장 작은 표
// ============================================================

db.exec(`
  CREATE TABLE 메모 (
    id   INTEGER PRIMARY KEY,
    내용 TEXT
  ) STRICT
`);

// 문법을 뜯어보면 이렇습니다.
//
//   CREATE TABLE 메모 (      ← "메모" 라는 이름의 표를 만들어라
//     id   INTEGER PRIMARY KEY,   ← 칸 이름, 타입, 규칙
//     내용 TEXT                   ← 마지막 칸 뒤에는 쉼표를 안 찍습니다
//   ) STRICT                 ← 타입을 지키게 하는 옵션 (개념01 참고)
//
// 칸(column) 하나가 한 줄입니다. 쉼표로 구분합니다.

db.prepare("INSERT INTO 메모 (내용) VALUES (?)").run("첫 메모");

const 메모하나 = db.prepare("SELECT * FROM 메모").get();
console.log(메모하나);
// 출력: [Object: null prototype] { id: 1, '내용': '첫 메모' }

// ============================================================
// 1-2. [Object: null prototype] 이 뭔가요
// ============================================================
//
// 처음 보면 오류처럼 보이지만 아닙니다. 값은 멀쩡합니다.

console.log(메모하나.내용, 메모하나.id);
// 출력: 첫 메모 1

// node:sqlite 는 결과를 "프로토타입이 없는 객체" 로 돌려줍니다.
// 보통 객체는 Object 를 부모로 갖는데, 이건 부모가 없습니다.
//
// 왜 그렇게 만들었냐면 — 칸 이름이 'toString' 이나 'constructor' 인 경우에
// 원래 있던 메서드와 부딪히지 않게 하려는 것입니다. 안전 장치입니다.
//
// 값을 꺼내 쓰는 데는 아무 지장이 없습니다.
// 다만 화면에 찍을 때 저 꼬리표가 붙어서 보기 싫을 뿐입니다.
//
// 없애고 싶으면 펼쳐서 새 객체로 만들면 됩니다.

console.log({ ...메모하나 });
// 출력: { id: 1, '내용': '첫 메모' }

// ★ 그대로 res.json(행) 해도 잘 나갑니다. JSON 으로 바꿀 때는 상관없습니다.
//   눈으로 확인할 때만 { ...행 } 이나 JSON.stringify 를 쓰세요.
//
// ★ '내용' 에 따옴표가 붙은 것도 눈여겨보세요.
//   console.log 는 키가 영문·숫자·밑줄·달러로만 돼 있을 때만 따옴표를 뗍니다.
//   한글은 자바스크립트 이름으로 써도 되는 글자인데도(const 내용 = 1 이 됩니다)
//   화면에 찍을 때는 따옴표가 붙습니다. 이것도 정상입니다.
//
// ★ 문법 문제가 아니라 '보여 주는 방식' 일 뿐입니다.
//   console.log({ $x: 1 }) 도 { '$x': 1 } 로 나옵니다. $x 는 멀쩡한 이름인데도요.

// ★ 표 이름과 칸 이름에 한글을 써도 됩니다.
//   수업에서는 읽기 쉬우라고 한글을 씁니다.
//   회사에서는 영어를 쓰는 곳이 더 많습니다. 팀 규칙을 따르세요.

// ============================================================
// 2. 타입 — STRICT 에서 쓸 수 있는 건 여섯 가지뿐
// ============================================================
//
//   INT       정수            INTEGER 와 같은 값이지만 자동 번호가 안 됩니다 (아래 3번)
//   INTEGER   정수            42, -7, 0
//   REAL      실수            36.5, -0.1
//   TEXT      글자            '용접로봇 1호'
//   BLOB      덩어리(사진 등)  거의 안 씁니다. 파일은 09단원처럼 디스크에 두세요.
//   ANY       아무거나        STRICT 를 부분적으로 푸는 탈출구. 되도록 쓰지 마세요.
//
// ★ 자주 틀리는 것들:
//
//   VARCHAR(50)  → SQLite 에는 없습니다. TEXT 를 쓰세요.
//                  길이 제한이 필요하면 CHECK 로 겁니다 (아래 4번).
//   BIGINT       → STRICT 에서는 **표를 만들 때 오류**가 납니다.
//                  unknown datatype 이라고 합니다. INTEGER 를 쓰세요.
//   BOOLEAN      → 없습니다. INTEGER 에 0/1 을 넣습니다.
//   DATETIME     → 없습니다. TEXT 에 '2026-08-14 15:28:05' 로 넣습니다.
//   DECIMAL      → 없습니다. 돈은 REAL 대신 INTEGER 에 "원 단위" 로 넣으세요.
//                  (0.1 + 0.2 !== 0.3 문제를 피합니다)

// ★★ STRICT 를 안 붙이면 오타도 그냥 지나갑니다. 재 봅시다.

db.exec("CREATE TABLE 헐렁 (수량 INTEGR)"); // ← INTEGER 를 INTEGR 로 잘못 씀
console.log("STRICT 없는 표: 오타 타입도 그냥 만들어집니다");
// 출력: STRICT 없는 표: 오타 타입도 그냥 만들어집니다

try {
  db.exec("CREATE TABLE 엄격 (수량 INTEGR) STRICT");
} catch (에러) {
  console.log(에러.message);
  // 출력: unknown datatype for 엄격.수량: "INTEGR"
}

// 오타 하나 때문에 몇 시간 헤매는 일이 실제로 있습니다.
// STRICT 는 그걸 만드는 순간에 잡아 줍니다.

// ============================================================
// 3. PRIMARY KEY — 한 줄을 가리키는 번호
// ============================================================
//
//   INTEGER PRIMARY KEY 라고 쓰면 SQLite 가 알아서 번호를 매깁니다.
//   개념01 에서 본 그 id 입니다.
//
// ★ 반드시 INTEGER 여야 자동 번호가 됩니다.
//
//   INT PRIMARY KEY 로 쓰면 자동으로 안 매겨집니다. 값을 안 주면
//   NOT NULL constraint failed 가 납니다. (SQLite 만의 특이한 규칙)
//
//   ★ BIGINT 는 STRICT 에서 아예 표가 안 만들어집니다. 위 2번을 보세요.
//     글자 하나 차이(INT / INTEGER)로 동작이 갈립니다. 눈으로 확인하세요.
//
// 번호 말고 다른 걸 열쇠로 쓸 수도 있습니다.

db.exec(`
  CREATE TABLE 라인 (
    코드 TEXT PRIMARY KEY,
    이름 TEXT NOT NULL
  ) STRICT
`);

const 라인넣기 = db.prepare("INSERT INTO 라인 (코드, 이름) VALUES (?, ?)");
라인넣기.run("A", "조립 1라인");
라인넣기.run("B", "조립 2라인");

try {
  라인넣기.run("A", "또 A라인");
} catch (에러) {
  console.log(에러.message);
  // 출력: UNIQUE constraint failed: 라인.코드
}

// PRIMARY KEY 는 "겹치면 안 된다" 를 자동으로 포함합니다.

// ============================================================
// 4. 규칙(제약) 네 가지
// ============================================================

db.exec(`
  CREATE TABLE 설비 (
    id       INTEGER PRIMARY KEY,
    이름     TEXT    NOT NULL UNIQUE,
    라인코드 TEXT    NOT NULL REFERENCES 라인(코드),
    상태     TEXT    NOT NULL DEFAULT '정상'
                     CHECK (상태 IN ('정상', '점검중', '고장')),
    온도     REAL,
    등록시각 TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  ) STRICT
`);

// 하나씩 봅시다.
//
//   NOT NULL     비어 있으면 안 된다
//   UNIQUE       같은 값이 두 번 들어가면 안 된다
//   DEFAULT      안 넣으면 이 값으로 채워라
//   CHECK (...)  이 조건에 맞아야 한다
//   REFERENCES   다른 표에 있는 값이어야 한다 (외래키, 6번에서 설명)

const 넣기 = db.prepare(`
  INSERT INTO 설비 (이름, 라인코드, 상태, 온도) VALUES (?, ?, ?, ?)
`);

function 시도(설명, 하기) {
  try {
    하기();
    console.log(`${설명} → 통과`);
  } catch (에러) {
    console.log(`${설명} → 거절: ${에러.message}`);
  }
}

시도("제대로 넣기 ", () => 넣기.run("용접로봇 1호", "A", "정상", 36.5));
// 출력: 제대로 넣기  → 통과
시도("이름이 겹침 ", () => 넣기.run("용접로봇 1호", "B", "정상", 20));
// 출력: 이름이 겹침  → 거절: UNIQUE constraint failed: 설비.이름
시도("이름이 비었음", () => 넣기.run(null, "B", "정상", 20));
// 출력: 이름이 비었음 → 거절: NOT NULL constraint failed: 설비.이름
시도("없는 상태값 ", () => 넣기.run("프레스 1호", "B", "수리중", 20));
// 출력: 없는 상태값  → 거절: CHECK constraint failed: 상태 IN ('정상', '점검중', '고장')
시도("온도는 비어도", () => 넣기.run("프레스 1호", "B", "정상", null));
// 출력: 온도는 비어도 → 통과

// ★ 온도만 통과했습니다. NOT NULL 을 안 붙였기 때문입니다.
//   "비어도 되는 칸" 을 의도적으로 고르세요.
//   고민되면 일단 NOT NULL 을 붙이는 편이 낫습니다. 나중에 푸는 게 더 쉽습니다.

// ★★ CHECK 는 조건이면 뭐든 됩니다. 자주 쓰는 것들:
//
//   CHECK (온도 BETWEEN -50 AND 200)         범위
//   CHECK (length(이름) BETWEEN 1 AND 50)    길이 (VARCHAR(50) 대신)
//   CHECK (이름 <> '')                       빈 글자 막기 ← NOT NULL 로는 못 막습니다
//   CHECK (수량 >= 0)                        음수 막기

// ============================================================
// 4-2. NOT NULL 로는 빈 글자를 못 막습니다
// ============================================================

시도("빈 글자 이름", () => 넣기.run("", "B", "정상", 20));
// 출력: 빈 글자 이름 → 통과

// ★ "" 는 NULL 이 아닙니다. 길이 0 짜리 글자입니다.
//   폼에서 아무것도 안 치고 보내면 대부분 "" 로 옵니다.
//   그래서 NOT NULL 만 믿으면 빈 이름이 그대로 들어갑니다.
//
//   막으려면 CHECK (이름 <> '') 를 같이 걸어야 합니다.
//   06단원의 검증(validation) 을 DB 쪽에도 한 번 더 거는 셈입니다.

// ============================================================
// 5. DEFAULT — 안 넣으면 채워지는 값
// ============================================================

db.prepare("INSERT INTO 설비 (이름, 라인코드) VALUES (?, ?)").run("컨베이어 1호", "A");

const 방금 = db.prepare("SELECT 이름, 상태, 온도 FROM 설비 WHERE 이름 = ?").get("컨베이어 1호");
console.log({ ...방금 });
// 출력: { '이름': '컨베이어 1호', '상태': '정상', '온도': null }

// 상태를 안 넣었는데 '정상' 이 들어갔습니다. DEFAULT 덕분입니다.
// 온도는 DEFAULT 가 없어서 NULL 이 됐습니다.

const 시각 = db.prepare("SELECT 등록시각 FROM 설비 WHERE 이름 = ?").get("컨베이어 1호");
console.log("등록시각 길이:", 시각.등록시각.length);
// 출력: 등록시각 길이: 19

// 19글자 — '2026-08-14 15:28:05' 형태입니다.
// (실행할 때마다 값이 달라지니 길이만 확인했습니다)
//
// ★ datetime('now') 는 UTC 입니다. 한국 시각을 원하면
//   datetime('now', 'localtime') 을 쓰세요. 9시간 차이가 납니다.

// ============================================================
// 6. 외래키 — "저 표에 있는 값이어야 한다"
// ============================================================
//
// 설비.라인코드 는 라인.코드 중 하나여야 합니다.
// 없는 라인을 적으면 막아야 데이터가 어그러지지 않습니다.

시도("없는 라인 Z", () => 넣기.run("검사기 1호", "Z", "정상", 20));
// 출력: 없는 라인 Z → 거절: FOREIGN KEY constraint failed
시도("있는 라인 B", () => 넣기.run("검사기 1호", "B", "정상", 20));
// 출력: 있는 라인 B → 통과

// ★★ 여기가 중요합니다.
//
//   SQLite 는 원래 외래키 검사가 꺼진 채로 시작합니다.
//   그래서 인터넷 자료 대부분이 "PRAGMA foreign_keys = ON 을 꼭 켜라" 고 합니다.
//
//   node:sqlite 는 **Node 24 부터** 켜 놓고 시작합니다.
//   ★ Node 22 는 꺼져 있습니다. 같은 코드가 버전에 따라 다르게 돕니다.
//
//   그래서 이 파일은 맨 위에서 직접 켰습니다. 확인해 봅시다.

console.log({ ...db.prepare("PRAGMA foreign_keys").get() });
// 출력: { foreign_keys: 1 }

// 1 이면 켜져 있는 겁니다.
//
// ★★★ 기본값을 믿지 말고 직접 켜세요.
//
//   Node 22 · better-sqlite3 · sqlite3 명령줄 도구는 0 으로 시작합니다.
//   기본값에 기대면 "내 컴퓨터에서는 막혔는데 서버에서는 안 막히는" 일이 납니다.
//   오류가 안 나서 알아채지도 못합니다. 그냥 이상한 자료가 쌓입니다.
//
//   PRAGMA 는 **연결마다** 겁니다. 연결을 새로 만들면 다시 켜야 합니다.

// ============================================================
// 7. 표 안을 들여다보기
// ============================================================

const 칸들 = db.prepare("PRAGMA table_info('설비')").all();

for (const 칸 of 칸들) {
  console.log(`${칸.name} / ${칸.type} / ${칸.notnull ? "NOT NULL" : "비어도 됨"}`);
}
// 출력: id / INTEGER / 비어도 됨
// 출력: 이름 / TEXT / NOT NULL
// 출력: 라인코드 / TEXT / NOT NULL
// 출력: 상태 / TEXT / NOT NULL
// 출력: 온도 / REAL / 비어도 됨
// 출력: 등록시각 / TEXT / NOT NULL

// ★ id 가 "비어도 됨" 으로 나오는 게 이상해 보일 수 있습니다.
//   PRIMARY KEY 라서 어차피 자동으로 채워지기 때문에 NOT NULL 표시가 안 붙습니다.
//   pk 값을 보면 1 로 표시됩니다.

console.log("id 의 pk 표시:", 칸들[0].pk);
// 출력: id 의 pk 표시: 1

const 표들 = db.prepare(`
  SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
`).all();
console.log(표들.map((표) => 표.name));
// 출력: [ '라인', '메모', '설비', '헐렁' ]

// sqlite_master 는 SQLite 가 스스로 관리하는 표입니다.
// 어떤 표가 있는지, 어떻게 만들었는지가 다 들어 있습니다.

const 만든문장 = db.prepare(`
  SELECT sql FROM sqlite_master WHERE name = '라인'
`).get();
console.log(만든문장.sql.replace(/\s+/g, " ").trim());
// 출력: CREATE TABLE 라인 ( 코드 TEXT PRIMARY KEY, 이름 TEXT NOT NULL ) STRICT

// 내가 적은 CREATE TABLE 이 그대로 저장돼 있습니다.
// 남의 DB 파일을 받았을 때 구조를 알아내는 방법입니다.

// ============================================================
// 8. 이미 있는 표를 또 만들면
// ============================================================

try {
  db.exec("CREATE TABLE 라인 (코드 TEXT)");
} catch (에러) {
  console.log(에러.message);
  // 출력: table 라인 already exists
}

// 서버를 켤 때마다 CREATE TABLE 을 실행하면 두 번째부터 이 오류가 납니다.
// 그래서 IF NOT EXISTS 를 붙입니다.

db.exec("CREATE TABLE IF NOT EXISTS 라인 (코드 TEXT)");
console.log("IF NOT EXISTS → 아무 일도 안 일어남");
// 출력: IF NOT EXISTS → 아무 일도 안 일어남

// ★ 주의: 이미 있으면 "그냥 넘어갑니다".
//   안에 적은 내용이 달라도 고쳐 주지 않습니다.
//   위에서 라인 표를 (코드 TEXT) 로 다시 적었지만 이름 칸은 그대로 있습니다.

console.log(db.prepare("PRAGMA table_info('라인')").all().map((칸) => 칸.name));
// 출력: [ '코드', '이름' ]

// 이게 나중에 "분명히 칸을 추가했는데 왜 없지?" 의 원인입니다.
// 표 구조를 바꿀 때는 ALTER TABLE 을 써야 합니다.

// ============================================================
// 9. 표 구조 바꾸기 (ALTER TABLE)
// ============================================================

db.exec("ALTER TABLE 설비 ADD COLUMN 비고 TEXT NOT NULL DEFAULT ''");
console.log(db.prepare("PRAGMA table_info('설비')").all().map((칸) => 칸.name).join(", "));
// 출력: id, 이름, 라인코드, 상태, 온도, 등록시각, 비고

// ★ NOT NULL 칸을 추가할 때는 DEFAULT 를 같이 줘야 합니다.
//   이미 들어 있는 줄들을 뭘로 채울지 SQLite 가 알 수 없기 때문입니다.

try {
  db.exec("ALTER TABLE 설비 ADD COLUMN 담당자 TEXT NOT NULL");
} catch (에러) {
  console.log(에러.message);
  // 출력: Cannot add a NOT NULL column with default value NULL
}

// SQLite 의 ALTER TABLE 은 할 수 있는 게 적습니다.
//
//   ADD COLUMN              ○
//   RENAME TO / RENAME COLUMN  ○
//   DROP COLUMN             ○ (3.35 부터, 조건 있음)
//   칸 타입 바꾸기            ✗
//   제약 추가·삭제            ✗
//
// 못 하는 걸 해야 하면 새 표를 만들고 옮겨 담습니다.
// Postgres 나 MySQL 은 이런 제약이 없습니다. (05단원 Supabase)

// ============================================================
// 10. 표 지우기
// ============================================================

db.exec("DROP TABLE 헐렁");
console.log(db.prepare(`
  SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
`).all().map((표) => 표.name));
// 출력: [ '라인', '메모', '설비' ]

// ★★ DROP TABLE 은 되돌릴 수 없습니다. 안에 든 자료가 전부 사라집니다.
//   운영 중인 DB 에서는 절대 손으로 치지 마세요.
//   개념04 의 "WHERE 를 빠뜨린 DELETE" 와 같은 급의 사고입니다.

db.exec("DROP TABLE IF EXISTS 없는표");
console.log("DROP TABLE IF EXISTS → 없어도 오류 안 남");
// 출력: DROP TABLE IF EXISTS → 없어도 오류 안 남

db.close();

// ============================================================
// 정리
// ============================================================
//
//   CREATE TABLE 이름 (칸 타입 규칙, ...) STRICT
//
//   타입     INT / INTEGER / REAL / TEXT / BLOB / ANY  — 이 여섯 개뿐
//   PRIMARY KEY   줄을 가리키는 열쇠. INTEGER 면 자동 번호
//   NOT NULL      비면 안 됨 (빈 글자 "" 는 못 막음)
//   UNIQUE        겹치면 안 됨
//   DEFAULT 값    안 넣으면 채움
//   CHECK (조건)  조건에 맞아야 함
//   REFERENCES    다른 표에 있는 값이어야 함
//
//   IF NOT EXISTS  이미 있으면 넘어감 (내용은 안 고쳐 줌)
//   ALTER TABLE    칸 추가·이름 변경 정도만 가능
//   DROP TABLE     되돌릴 수 없음
//
// 다음(개념03) 에서는 만든 표에 자료를 넣고 꺼내 봅니다.
// SQL 인젝션이 어떻게 일어나는지도 직접 해 봅니다.
