// ============================================================
// 02단원 · 개념 01 — 왜 데이터베이스인가
// ------------------------------------------------------------
// 실행: node 개념01_왜_데이터베이스인가.js
// ============================================================
//
// 백엔드자료 07단원에서 파일에 저장하는 법을 배웠습니다.
// 그리고 그 한계도 직접 재 봤습니다.
//
//   · 20건을 동시에 넣었더니 1건만 남았습니다 (19건이 조용히 사라짐)
//   · 하나 고치려고 10만 건을 전부 읽고 전부 다시 썼습니다
//   · "A라인 가동 중" 을 찾으려면 전부 훑어야 했습니다
//   · 서버를 두 대 띄우면 줄 세우기가 소용없었습니다
//   · 중간에 실패하면 되돌릴 방법이 없었습니다
//
// 이번 단원에서 이 다섯 가지가 어떻게 해결되는지 봅니다.

const { DatabaseSync } = require("node:sqlite");


// ── 섹션 1: SQLite 는 설치가 필요 없습니다 ──

// Node 에 SQLite 가 내장돼 있습니다. npm install 이 필요 없습니다.
//
//   const { DatabaseSync } = require("node:sqlite");
//
// ★★ 버전을 먼저 확인하세요. 이 자료는 **Node 24 이상**을 기준으로 합니다.
//
//   · Node 22    → --experimental-sqlite 를 붙여야 씁니다.
//                  그냥 실행하면 ERR_UNKNOWN_BUILTIN_MODULE 이 납니다.
//                    node --experimental-sqlite 개념01_왜_데이터베이스인가.js
//   · Node 23.4 이상 → 플래그 없이 그냥 됩니다.
//
//   node -v 로 확인하세요. 22 라면 24 로 올리는 것을 권합니다.
//   (버전에 따라 달라지는 게 이것만은 아닙니다. 개념02 6번의 외래키도 그렇습니다)
//
// ★ node: 로 시작하는 것은 '내장 모듈' 이라는 표시입니다.
//   fs, path, http 와 같은 부류입니다. (백엔드자료 01단원)

const db = new DatabaseSync(":memory:");

// ":memory:" 는 '파일 없이 메모리에만' 이라는 뜻입니다.
// 프로그램이 끝나면 사라집니다. 시험할 때 편합니다.
//
// 진짜로 남기려면 파일 이름을 줍니다.
//   new DatabaseSync("./data/설비.db")
//
// ★ 그 파일 하나가 데이터베이스 전부입니다.
//   복사하면 백업이고, 옮기면 이사입니다. 이게 SQLite 의 가장 큰 장점입니다.

console.log(db.prepare("SELECT sqlite_version() AS 버전").get().버전);
// 출력: 3.53.1


// ── 섹션 2: 표를 만듭니다 ──

// 데이터베이스는 데이터를 '표' 로 관리합니다.
//
//   id | name          | line | status
//   ---+---------------+------+-------
//    1 | 컨베이어 1호   | A    | 가동
//    2 | 프레스 1호     | B    | 정지
//
// 표를 만드는 명령이 CREATE TABLE 입니다.

db.exec(`
  CREATE TABLE 설비 (
    id     INTEGER PRIMARY KEY,
    name   TEXT NOT NULL,
    line   TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '정지'
  ) STRICT
`);

// 한 줄씩 뜯어봅니다.
//
//   id INTEGER PRIMARY KEY   번호. 안 넣으면 알아서 붙여 줍니다
//   name TEXT NOT NULL       글자. 비워 둘 수 없습니다
//   status ... DEFAULT '정지'  안 주면 '정지' 로
//   STRICT                   ★ 타입을 지키게 합니다. 섹션 6 에서 봅니다
//
// ★ exec 와 prepare 의 차이
//   exec     결과를 안 받는 명령 (CREATE, DROP 등)
//   prepare  값을 넣거나 받는 명령 (INSERT, SELECT 등)


// ── 섹션 3: 넣습니다 (INSERT) ──

const 넣기 = db.prepare("INSERT INTO 설비 (name, line) VALUES (?, ?)");

const 결과 = 넣기.run("컨베이어 1호", "A");

console.log(JSON.stringify(결과));
// 출력: {"changes":1,"lastInsertRowid":1}

// ★ ? 는 '여기에 값이 들어갑니다' 라는 자리입니다.
//   run 에 넘긴 값이 순서대로 들어갑니다.
//
//   ★★ 값을 글자로 이어 붙이면 절대 안 됩니다.
//     `INSERT INTO 설비 (name) VALUES ('${이름}')`
//     이렇게 쓰면 SQL 인젝션이 됩니다. 개념03 에서 진짜로 뚫어 봅니다.
//
// ★ 돌려주는 것
//   changes           몇 줄이 바뀌었나
//   lastInsertRowid   방금 넣은 것의 번호
//
//   07단원에서 Math.max(...ids) + 1 로 직접 번호를 붙였습니다.
//   데이터베이스는 알아서 붙여 주고, 그 번호를 알려 줍니다.

넣기.run("프레스 1호", "B");
넣기.run("용접로봇 1호", "C");


// ── 섹션 4: 읽습니다 (SELECT) ──

const 전부 = db.prepare("SELECT * FROM 설비").all();

console.log(JSON.stringify(전부));
// 출력: [{"id":1,"name":"컨베이어 1호","line":"A","status":"정지"},{"id":2,"name":"프레스 1호","line":"B","status":"정지"},{"id":3,"name":"용접로봇 1호","line":"C","status":"정지"}]

// ★ 그냥 자바스크립트 객체 배열입니다. 바로 res.json 에 넣어도 됩니다.

const 하나 = db.prepare("SELECT * FROM 설비 WHERE id = ?").get(2);

console.log(JSON.stringify(하나));
// 출력: {"id":2,"name":"프레스 1호","line":"B","status":"정지"}

const 없는것 = db.prepare("SELECT * FROM 설비 WHERE id = ?").get(99);

console.log(없는것);
// 출력: undefined

// ★★ 못 찾으면 undefined 입니다. null 이 아닙니다.
//
//   07단원의 저장소는 null 을 돌려주기로 정했습니다.
//   데이터베이스는 undefined 를 줍니다.
//   저장소에서 ?? null 로 맞춰 주면 부르는 쪽은 안 바뀝니다. (04단원에서 합니다)
//
// ★ all 과 get 의 차이
//   all  전부 배열로. 없으면 빈 배열 []
//   get  첫 하나만. 없으면 undefined
//
//   목록에는 all, 하나 찾을 때는 get 입니다.


// ── 섹션 5: 조건으로 찾습니다 ──

// 07단원에서는 전부 읽어서 filter 로 훑었습니다.
// SQL 은 "이런 걸 달라" 고 말만 하면 됩니다.

const A라인 = db.prepare("SELECT * FROM 설비 WHERE line = ?").all("A");

console.log(A라인.length, A라인[0].name);
// 출력: 1 컨베이어 1호

const 이름순 = db.prepare("SELECT name FROM 설비 ORDER BY name").all();

console.log(JSON.stringify(이름순.map((설비) => 설비.name)));
// 출력: ["용접로봇 1호","컨베이어 1호","프레스 1호"]

// ★★ 여기가 파일 저장과 결정적으로 다른 점입니다.
//
//   파일:  전부 읽는다 → 자바스크립트로 filter → sort → slice
//   SQL :  "이런 걸 이 순서로 이만큼 달라" 라고 말한다
//
//   10만 건이면 파일은 10만 건을 전부 메모리에 올려야 합니다.
//   데이터베이스는 필요한 것만 골라서 줍니다.
//   그리고 '색인' 을 만들어 두면 전부 훑지도 않습니다. (03단원)
//
// ★ 정렬 결과를 보세요. 용접 → 컨베이어 → 프레스 순입니다.
//   06단원에서 재 본 한글 사전 순서와 같습니다. (ㅇ, ㅋ, ㅍ)


// ── 섹션 6: ★ SQLite 는 타입이 느슨합니다 ──

// STRICT 없이 만든 표는 INTEGER 칸에 글자를 넣어도 받아 줍니다.

const 느슨한db = new DatabaseSync(":memory:");
느슨한db.exec("CREATE TABLE 느슨 (id INTEGER PRIMARY KEY, 수량 INTEGER)");

느슨한db.prepare("INSERT INTO 느슨 (수량) VALUES (?)").run(100);
느슨한db.prepare("INSERT INTO 느슨 (수량) VALUES (?)").run("백개");

console.log(JSON.stringify(느슨한db.prepare("SELECT 수량, typeof(수량) AS 실제타입 FROM 느슨").all()));
// 출력: [{"수량":100,"실제타입":"integer"},{"수량":"백개","실제타입":"text"}]

// ★★★ INTEGER 라고 적어 뒀는데 "백개" 가 들어갔습니다.
//
//   SQLite 는 원래 타입을 느슨하게 봅니다. 다른 데이터베이스와 다릅니다.
//   나중에 수량 을 더하려 하면 "백개" 때문에 이상한 결과가 나옵니다.
//   그리고 언제 들어갔는지도 모릅니다.
//
// ★ STRICT 를 붙이면 막아 줍니다. 그런데 '완전히' 막는 건 아닙니다.
//   실제로 재 봤습니다.

const 엄격db = new DatabaseSync(":memory:");
엄격db.exec("CREATE TABLE 엄격 (수량 INTEGER, 이름 TEXT) STRICT");

function 넣어보기(칸, 값) {
  try {
    엄격db.prepare(`INSERT INTO 엄격 (${칸}) VALUES (?)`).run(값);

    const 마지막 = 엄격db
      .prepare(`SELECT ${칸} AS 값, typeof(${칸}) AS 타입 FROM 엄격 ORDER BY rowid DESC LIMIT 1`)
      .get();

    return `통과 → ${JSON.stringify(마지막.값)} (${마지막.타입})`;
  } catch (에러) {
    return `거절 → ${에러.message}`;
  }
}

console.log(넣어보기("수량", 100));
// 출력: 통과 → 100 (integer)
console.log(넣어보기("수량", "100"));
// 출력: 통과 → 100 (integer)
console.log(넣어보기("수량", "백개"));
// 출력: 거절 → cannot store TEXT value in INTEGER column 엄격.수량
console.log(넣어보기("수량", 1.5));
// 출력: 거절 → cannot store REAL value in INTEGER column 엄격.수량
console.log(넣어보기("이름", 123));
// 출력: 통과 → "123.0" (text)

// ★★ 재 본 결과를 정리하면 이렇습니다.
//
//   STRICT 는 "그 타입이거나, 손실 없이 바꿀 수 있으면" 받아 줍니다.
//
//     "100" → INTEGER   ○  손실 없이 100 이 됩니다
//     "백개" → INTEGER   ✗  숫자로 못 바꿉니다
//     1.5   → INTEGER   ✗  소수점을 버려야 하니 손실입니다
//     123   → TEXT      ○  글자로 바꿀 수 있습니다
//
// ★★★ 마지막 줄을 보세요. 123 을 넣었는데 "123.0" 이 저장됐습니다.
//
//   자바스크립트의 숫자는 전부 실수(double)입니다.
//   SQLite 는 그걸 REAL 로 받고, TEXT 로 바꾸면서 "123.0" 이 됩니다.
//
//   숫자를 글자 칸에 넣을 일이 있다면 직접 String(123) 으로 바꿔 넣으세요.
//   안 그러면 나중에 "123" 으로 찾는 코드가 아무것도 못 찾습니다.
//
// ★ 그래도 STRICT 를 붙이세요.
//   "백개" 같은 게 INTEGER 칸에 들어가는 것만 막아도 충분히 값어치를 합니다.
//   SQLite 3.37(2021) 부터 됩니다. 안 붙일 이유가 거의 없습니다.
//   Postgres·MySQL 은 원래 타입을 지킵니다. STRICT 가 그쪽에 맞추는 것입니다.


// ── 섹션 7: ★ 지운 번호가 다시 나옵니다 ──

const 번호db = new DatabaseSync(":memory:");
번호db.exec("CREATE TABLE 것 (id INTEGER PRIMARY KEY, name TEXT NOT NULL) STRICT");

const 것넣기 = 번호db.prepare("INSERT INTO 것 (name) VALUES (?)");
것넣기.run("첫째");
것넣기.run("둘째");
것넣기.run("셋째");

번호db.prepare("DELETE FROM 것 WHERE id = 3").run();
것넣기.run("넷째");

console.log(JSON.stringify(번호db.prepare("SELECT id, name FROM 것").all()));
// 출력: [{"id":1,"name":"첫째"},{"id":2,"name":"둘째"},{"id":3,"name":"넷째"}]

// ★★★ 3번을 지웠는데 '넷째' 가 다시 3번을 받았습니다.
//
//   07단원 연습문제에서 본 그 문제입니다.
//   Math.max(...ids) + 1 로 붙이면 지운 번호가 재활용된다고 했는데,
//   SQLite 도 기본은 똑같습니다.
//
//   왜 위험한가
//     3번 설비의 점검기록이 남아 있으면, 그 기록이 '넷째' 의 것으로 보입니다.
//     남이 북마크해 둔 /equipments/3 이 다른 설비를 가리킵니다.
//
// ★ 막는 법: AUTOINCREMENT 를 붙입니다.

const 자동db = new DatabaseSync(":memory:");
자동db.exec("CREATE TABLE 것 (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL) STRICT");

const 자동넣기 = 자동db.prepare("INSERT INTO 것 (name) VALUES (?)");
자동넣기.run("첫째");
자동넣기.run("둘째");
자동넣기.run("셋째");

자동db.prepare("DELETE FROM 것 WHERE id = 3").run();
자동넣기.run("넷째");

console.log(JSON.stringify(자동db.prepare("SELECT id, name FROM 것").all()));
// 출력: [{"id":1,"name":"첫째"},{"id":2,"name":"둘째"},{"id":4,"name":"넷째"}]

// ★ 이번에는 4번을 받았습니다. 3번은 영영 안 씁니다.
//
//   AUTOINCREMENT 는 '지금까지 쓴 가장 큰 번호' 를 따로 기억합니다.
//   조금 느리지만, 번호가 겹치지 않는 것이 훨씬 중요합니다.
//
//   Postgres 는 SERIAL·IDENTITY, MySQL 은 AUTO_INCREMENT 로 같은 일을 합니다.


// ── 섹션 8: 어떤 데이터베이스를 쓰나 ──

const 비교 = {
  SQLite: "파일 하나. 설치 없음. 서버 한 대·읽기 중심에 좋습니다. 이 자료에서 씁니다",
  PostgreSQL: "가장 많이 쓰는 관계형 DB. Supabase 가 이걸 씁니다 (05단원)",
  MySQL: "웹에서 오래 쓰인 것. 회사에 이미 있는 경우가 많습니다",
  MongoDB: "표가 아니라 JSON 을 그대로 담습니다. SQL 을 안 씁니다",
};

for (const 이름 of Object.keys(비교)) {
  console.log(`${이름}: ${비교[이름]}`);
}
// 출력: SQLite: 파일 하나. 설치 없음. 서버 한 대·읽기 중심에 좋습니다. 이 자료에서 씁니다
// 출력: PostgreSQL: 가장 많이 쓰는 관계형 DB. Supabase 가 이걸 씁니다 (05단원)
// 출력: MySQL: 웹에서 오래 쓰인 것. 회사에 이미 있는 경우가 많습니다
// 출력: MongoDB: 표가 아니라 JSON 을 그대로 담습니다. SQL 을 안 씁니다

// ★ 왜 SQLite 로 배우나
//   ① 설치가 없습니다. 수업 시간의 절반을 설치에 쓰지 않아도 됩니다
//   ② SQL 문법은 거의 같습니다. 여기서 배운 것이 Postgres 에서 그대로 통합니다
//   ③ 파일 하나라 망가뜨려도 지우고 다시 만들면 됩니다
//
// ★ 실제 서비스에서도 SQLite 를 씁니다
//   "장난감" 이 아닙니다. 비행기 안, 휴대폰 앱, 브라우저 안에 전부 들어 있습니다.
//   다만 '서버를 여러 대 띄우는' 구조에는 안 맞습니다. 그때 Postgres 로 갑니다.


// ── 섹션 9: 앞으로 이렇게 갑니다 ──

const 계획 = [
  "02단원 (지금) — 표 만들기, 넣고 읽고 고치고 지우기, 트랜잭션",
  "03단원 — 여러 표를 잇기(JOIN), 집계, 색인, 느린 쿼리 찾기",
  "04단원 — 07단원의 repositories/ 만 SQL 로 바꿔 끼우기",
  "05단원 — Supabase (인터넷에 있는 Postgres)",
];

계획.forEach((줄) => console.log(줄));
// 출력: 02단원 (지금) — 표 만들기, 넣고 읽고 고치고 지우기, 트랜잭션
// 출력: 03단원 — 여러 표를 잇기(JOIN), 집계, 색인, 느린 쿼리 찾기
// 출력: 04단원 — 07단원의 repositories/ 만 SQL 로 바꿔 끼우기
// 출력: 05단원 — Supabase (인터넷에 있는 Postgres)

// ★ 04단원이 이 과정의 결론입니다.
//   백엔드자료에서 계층을 나눈 이유가 거기서 드러납니다.
//   repositories 한 폴더만 고치고, services·controllers·routes 는 안 건드립니다.


// ============================================================
// 07단원의 다섯 가지 문제, 어떻게 되나
// ============================================================
//
//   문제                          데이터베이스는                단원
//   ────────────────────────────────────────────────────────────────
//   동시에 쓰면 사라짐             트랜잭션과 잠금으로 막습니다   02 개념05 ★
//   하나 고치려고 전부 다시 씀      그 줄만 고칩니다              02 개념04
//   조건 검색이 느림               색인으로 바로 찾습니다         03
//   서버 여러 대                   데이터는 한 곳입니다           04·05
//   중간 실패를 못 되돌림           트랜잭션으로 되돌립니다        02 개념05
//
// ★ 개념05 에서 07단원의 '20건 중 1건' 실험을 그대로 다시 합니다.
//   이번에는 20건이 전부 남습니다. 직접 재 봅니다.


// ============================================================
// 직접 해 볼 것
// ============================================================
//
// ✏️ 직접 해보기 1 — ":memory:" 를 "./시험.db" 로 바꾸고 두 번 실행해 보세요.
//                    두 번째에 어떤 에러가 나나요? 왜 그럴까요?
//                    (힌트: 표를 또 만들려고 합니다)
//
// ✏️ 직접 해보기 2 — 그 파일을 탐색기에서 열어 보세요. 크기가 얼마인가요?
//                    메모장으로 열면 무엇이 보이나요?
//
// ✏️ 직접 해보기 3 — 설비를 하나 더 넣고 SELECT 로 확인해 보세요.
//                    status 를 안 주면 무엇이 들어가나요?
//
// ✏️ 직접 해보기 4 — STRICT 를 빼고 표를 만든 뒤,
//                    line 칸에 숫자 123 을 넣어 보세요. 들어가나요?
//
// ✏️ 직접 해보기 5 — name 을 빼고 INSERT 해 보세요. 어떤 에러가 나나요?
//
// ✏️ 직접 해보기 6 — 섹션 7 을 파일 데이터베이스로 해 보세요.
//                    프로그램을 껐다 켜도 AUTOINCREMENT 가 기억하나요?
//
// ✏️ 직접 해보기 7 — DB Browser for SQLite 를 설치해 보세요.
//                    만든 .db 파일을 열면 표가 눈에 보입니다.
//                    수업에서 확인할 때 아주 편합니다.


// ── 자주 하는 실수 ──

// [실수 1] 값을 글자로 이어 붙임
//   SQL 인젝션이 됩니다. 반드시 ? 를 쓰세요. 개념03 에서 뚫어 봅니다.

// [실수 2] STRICT 를 안 붙임
//   INTEGER 칸에 글자가 들어갑니다. 나중에 계산이 틀립니다.

// [실수 3] AUTOINCREMENT 를 안 붙임
//   지운 번호가 재활용됩니다. 남의 데이터를 가리키게 됩니다.

// [실수 4] get 결과를 확인 안 함
//   못 찾으면 undefined 입니다. 바로 .name 을 읽으면 TypeError 입니다.

// [실수 5] 파일 DB 로 시험하면서 표를 매번 만들려 함
//   두 번째 실행에서 "table already exists" 가 납니다.
//   CREATE TABLE IF NOT EXISTS 를 쓰거나, 파일을 지우고 시작하세요.

// [실수 6] 데이터베이스를 안 닫음
//   db.close() 를 부르는 습관을 들이세요. 파일 DB 에서는 특히 중요합니다.
