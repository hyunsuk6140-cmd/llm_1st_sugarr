// ============================================================
// 04단원 연습문제 — 저장소를 SQL 로
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~10은 기본, 11~14는 응용, 15는 [도전] 입니다.
//
// 서버로 만드는 문제는 연습문제_서버.js 에 있습니다.
//
// [준비] 아래는 그대로 두세요.

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


// ───── 문제 1 ───── (개념01)
// 저장소의 하나(id) 함수를 만드세요.
// 못 찾으면 반드시 null 을 돌려줘야 합니다. undefined 가 아닙니다.
//
// 힌트: .get() 은 못 찾으면 undefined 를 줍니다. ?? 를 쓰세요.
//
// 기대 출력:
// 볼트 M6
// null (object)

async function 하나(id) {
  // TODO: 여기에 코드를 쓰세요
}

// 하나(1).then((것) => console.log(것.name));
// 하나(9999).then((것) => console.log(`${것} (${typeof 것})`));


// ───── 문제 2 ───── (개념01)
// 추가(값) 를 만드세요. RETURNING 으로 만든 줄을 바로 돌려주세요.
// 재고를 안 주면 0 이 되어야 합니다.
//
// 기대 출력:
// id=6 name=드릴날 재고=0

async function 추가(값) {
  // TODO: 여기에 코드를 쓰세요
}

// 추가({ name: "드릴날", 창고: "P1", 단가: 5000 })
//   .then((것) => console.log(`id=${것.id} name=${것.name} 재고=${것.재고}`));


// ───── 문제 3 ───── (개념01)
// 삭제(id) 를 만드세요. 정말 지웠으면 true, 없었으면 false 입니다.
//
// 기대 출력:
// true
// false

async function 삭제(id) {
  // TODO: 여기에 코드를 쓰세요
}

// 삭제(6).then(console.log);
// 삭제(9999).then(console.log);


// ───── 문제 4 ───── (개념01)
// 수정(id, 바꿀것) 을 만드세요. 세 가지를 지켜야 합니다.
//   · 온 칸만 고칩니다 (안 보낸 칸은 그대로)
//   · id 는 절대 안 바뀝니다
//   · 못 찾으면 null
//
// 힌트: ["name","창고","단가","재고"] 중 undefined 가 아닌 것만 고르세요.
//       칸 이름은 이어 붙이고 값은 ? 로 넘깁니다.
//
// 기대 출력:
// 단가=200 name=볼트 M6
// id=1 (안 바뀜)
// null

async function 수정(id, 바꿀것) {
  // TODO: 여기에 코드를 쓰세요
}

// 수정(1, { 단가: 200 }).then((것) => console.log(`단가=${것.단가} name=${것.name}`));
// 수정(1, { id: 777, 재고: 490 }).then((것) => console.log(`id=${것.id} (안 바뀜)`));
// 수정(9999, { 단가: 1 }).then(console.log);


// ───── 문제 5 ───── (개념02)
// 칸이 이미 있는지 보고, 없을 때만 추가하는 함수를 만드세요.
// 여러 번 실행해도 오류가 안 나야 합니다.
//
// 힌트: pragma_table_info(?) 를 표처럼 조회할 수 있습니다.
//
// 기대 출력:
// 첫 번째: true
// 두 번째: false
// 칸 목록: id, name, 창고, 단가, 재고, 비고

function 칸없으면추가(표, 칸, 정의) {
  // TODO: 여기에 코드를 쓰세요 (추가했으면 true, 이미 있으면 false)
}

// console.log("첫 번째:", 칸없으면추가("부품", "비고", "TEXT NOT NULL DEFAULT ''"));
// console.log("두 번째:", 칸없으면추가("부품", "비고", "TEXT NOT NULL DEFAULT ''"));
// console.log("칸 목록:", db.prepare("SELECT name FROM pragma_table_info('부품')")
//   .all().map((칸) => 칸.name).join(", "));


// ───── 문제 6 ───── (개념02)
// PRAGMA user_version 을 읽고 1 올리는 것을 확인하세요.
//
// 힌트: PRAGMA 에는 자리표시자를 쓸 수 없습니다. db.exec 로 숫자를 직접 넣으세요.
//
// 기대 출력:
// 0 → 1

// TODO: 여기에 코드를 쓰세요


// ───── 문제 7 ───── (개념03)
// query 를 받아 { limit, page, offset } 을 돌려주는 함수를 만드세요.
//   limit 기본 20, 최소 1, 최대 50, 정수만
//   page  기본 1, 최소 1, 정수만
//
// 기대 출력:
// {} → 20/0
// {"limit":"10","page":"3"} → 10/20
// {"limit":"-1"} → 20/0
// {"limit":"abc"} → 20/0
// {"limit":"999"} → 50/0
// {"limit":"5.5"} → 20/0

function 쪽정보다듬기(query) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 경우 of [{}, {limit:"10",page:"3"}, {limit:"-1"}, {limit:"abc"}, {limit:"999"}, {limit:"5.5"}]) {
//   const r = 쪽정보다듬기(경우);
//   console.log(`${JSON.stringify(경우)} → ${r.limit}/${r.offset}`);
// }


// ───── 문제 8 ───── (개념03)
// 창고 순으로 정렬해서 2개씩 나눠 봤을 때
// 같은 부품이 두 쪽에 나오지 않게 하세요.
//
// 힌트: ORDER BY 의 마지막을 PRIMARY KEY 로 끝내세요.
//       창고 순이라 P1(베어링) 이 S1 보다 먼저 나옵니다.
//
// 기대 출력:
// 1쪽: [5,1]
// 2쪽: [2,3]
// 겹치는 것: 없음

// TODO: 여기에 코드를 쓰세요


// ───── 문제 9 ───── (개념04)
// 조건을 조립하는 함수를 만드세요.
//   창고 가 오면 창고 = ?
//   q 가 오면 name LIKE ?  (% 는 값 쪽에)
//   최소재고 가 오면 재고 >= ?
// 조건이 없으면 WHERE 를 안 붙입니다.
//
// 기대 출력:
// [WHERE 창고 = ? AND 재고 >= ?] ["S1",400]
// [] []
// S1 것: 볼트 M6, 너트 M6

function 조건조립(query) {
  // TODO: { WHERE, 값들 } 을 돌려주세요
}

// const a = 조건조립({ 창고: "S1", 최소재고: 400 });
// console.log(`[${a.WHERE}]`, JSON.stringify(a.값들));
// const b = 조건조립({});
// console.log(`[${b.WHERE}]`, JSON.stringify(b.값들));
// const c = 조건조립({ 창고: "S1" });
// console.log("S1 것:", db.prepare(`SELECT name FROM 부품 ${c.WHERE} ORDER BY id`)
//   .all(...c.값들).map((행) => 행.name).join(", "));


// ───── 문제 10 ───── (개념04)
// 정렬을 안전하게 조립하세요.
//   허용: id, name, 단가, 재고
//   방향: asc / desc (그 외는 asc)
//   마지막은 id 로 끝냅니다
//
// 기대 출력:
// 단가 DESC, id ASC
// id ASC
// id ASC
// 표 살아 있나: 5

function 정렬조립(sort, order) {
  // TODO: 여기에 코드를 쓰세요
}

// console.log(정렬조립("단가", "desc"));
// console.log(정렬조립("없는칸", "asc"));
// console.log(정렬조립("name; DROP TABLE 부품", "asc"));
// db.prepare(`SELECT id FROM 부품 ORDER BY ${정렬조립("name; DROP TABLE 부품", "asc")}`).all();
// console.log("표 살아 있나:", db.prepare("SELECT COUNT(*) AS n FROM 부품").get().n);


// ───── 문제 11 ───── (개념04, 응용)
// 검색어에 % 나 _ 가 들어와도 글자로 취급되게 하세요.
//
// 기대 출력:
// 다듬기 전 '%' 로 검색: 6건
// 다듬은 뒤 '%' 로 검색: 1건

function 검색어다듬기(글자) {
  // TODO: \ % _ 를 이스케이프하세요. \ 를 먼저 바꿔야 합니다.
}

// ★★ 아래 INSERT 를 파일 맨 위(최상위) 로 빼면 안 됩니다.
//   최상위 코드는 함수보다 **먼저** 실행됩니다.
//   그러면 이 줄이 id 6 을 가져가서, 문제 3 의 삭제(6) 가
//   드릴날이 아니라 이 부품을 지워 버립니다.
//   그래서 문제 11 은 함수 안에 묶어 두었습니다.

function 문제11() {
  db.prepare("INSERT INTO 부품 (name, 창고, 단가) VALUES (?, ?, ?)").run("30%_할인부품", "S1", 10);

  // console.log("다듬기 전 '%' 로 검색:",
  //   db.prepare("SELECT name FROM 부품 WHERE name LIKE ?").all("%%%").length + "건");
  // TODO: ESCAPE 를 써서 1건이 나오게 하세요
}

// 문제11();


// ───── 문제 12 ───── (개념03, 응용)
// 커서 방식으로 목록을 주는 함수를 만드세요.
//   개수 + 1 을 가져와서 다음이 있는지 판단하세요.
//   다음이 없으면 다음커서는 null 입니다.
//
// 기대 출력:
// 1쪽: [1,2] 다음=2
// 2쪽: [3,4] 다음=4
// 3쪽: [5,7] 다음=null

function 커서목록(커서, 개수) {
  // TODO: { data: [id...], 다음커서 } 를 돌려주세요
}

// let 커서 = null;
// for (let 쪽 = 1; 쪽 <= 3; 쪽++) {
//   const r = 커서목록(커서, 2);
//   console.log(`${쪽}쪽: ${JSON.stringify(r.data)} 다음=${r.다음커서}`);
//   커서 = r.다음커서;
// }


// ───── 문제 13 ───── (개념05, 응용)
// 트랜잭션으로 감싸는 함수를 만드세요.
//   이미 트랜잭션 안이면 새로 열지 않습니다
//   실패하면 ROLLBACK 하고 에러를 다시 던집니다
//
// 기대 출력:
// 성공: 재고=480
// 실패 잡음: true
// 되돌아갔나: 재고=480
// 트랜잭션 닫혔나: true

function 한묶음으로(하기) {
  // TODO: 여기에 코드를 쓰세요
}

// 한묶음으로(() => {
//   db.prepare("UPDATE 부품 SET 재고 = 재고 - 10 WHERE id = 1").run();
// });
// console.log("성공: 재고=" + db.prepare("SELECT 재고 FROM 부품 WHERE id=1").get().재고);
//
// try {
//   한묶음으로(() => {
//     db.prepare("UPDATE 부품 SET 재고 = 재고 - 10 WHERE id = 1").run();
//     db.prepare("UPDATE 부품 SET 단가 = -1 WHERE id = 1").run();  // CHECK 위반
//   });
// } catch (에러) { console.log("실패 잡음:", /CHECK/.test(에러.message)); }
//
// console.log("되돌아갔나: 재고=" + db.prepare("SELECT 재고 FROM 부품 WHERE id=1").get().재고);
// console.log("트랜잭션 닫혔나:", db.isTransaction === false);


// ───── 문제 14 ───── (개념05, 응용)
// 출고를 처리하는 함수를 만드세요.
//   재고가 모자라면 아무것도 하지 않고 false
//   충분하면 재고를 빼고, 출고 표에 기록하고, true
//   두 표가 같이 바뀌어야 합니다
//
// ★ 재고를 먼저 SELECT 해서 if 로 비교하면 안 됩니다. (02단원 개념05)
//
// 기대 출력:
// 출고 100: true
// 출고 99999: false
// 재고: 380
// 출고 기록 수: 1

db.exec(`
  CREATE TABLE 출고 (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    부품id INTEGER NOT NULL REFERENCES 부품(id),
    수량   INTEGER NOT NULL CHECK (수량 > 0)
  ) STRICT
`);

function 출고하기(부품id, 수량) {
  // TODO: 여기에 코드를 쓰세요
}

// console.log("출고 100:", 출고하기(1, 100));
// console.log("출고 99999:", 출고하기(1, 99999));
// console.log("재고:", db.prepare("SELECT 재고 FROM 부품 WHERE id=1").get().재고);
// console.log("출고 기록 수:", db.prepare("SELECT COUNT(*) AS n FROM 출고").get().n);


// ───── 문제 15 ───── (개념01, [도전])
// 저장소가 약속을 지키는지 확인하는 시험 함수를 만드세요.
// 아래 다섯 가지를 확인하고, 하나라도 어긋나면 어긋난 항목 이름을 모아 주세요.
//
//   내보내는함수  전부·하나·추가·수정·삭제 가 다 있는가
//   없으면null    하나(9999) 가 null 인가 (undefined 면 실패)
//   삭제false     삭제(9999) 가 false 인가
//   id고정        수정으로 id 를 못 바꾸는가
//   칸유지        수정에서 안 보낸 칸이 그대로인가
//
// 기대 출력:
// 통과: 5개, 실패: []
// 일부러 깨뜨린 저장소 → 실패: ["없으면null","삭제false"]

async function 저장소검사(저장소) {
  // TODO: { 통과: 수, 실패: [이름...] } 을 돌려주세요
}

// 제대로 만든 저장소 — **문제 1~4 에서 직접 만든 함수**를 그대로 씁니다.
// ★ 그래야 "내가 만든 저장소가 규칙을 지키나" 를 스스로 검사하는 셈이 됩니다.
//   (전부 는 앞 문제에 없어서 여기서만 만듭니다)
const 좋은저장소 = {
  전부: async () => db.prepare("SELECT * FROM 부품 ORDER BY id").all(),
  하나,
  추가,
  수정,
  삭제,
};

// 일부러 깨뜨린 저장소 — 두 군데가 틀렸습니다
const 나쁜저장소 = {
  ...좋은저장소,
  하나: async (id) => db.prepare("SELECT * FROM 부품 WHERE id = ?").get(id), // ?? null 빠짐
  삭제: async (id) => { db.prepare("DELETE FROM 부품 WHERE id = ?").run(id); return true; },
};

// 저장소검사(좋은저장소).then((r) => console.log(`통과: ${r.통과}개, 실패: ${JSON.stringify(r.실패)}`));
// 저장소검사(나쁜저장소).then((r) => console.log(`일부러 깨뜨린 저장소 → 실패: ${JSON.stringify(r.실패)}`));
