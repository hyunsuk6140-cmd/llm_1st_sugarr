// ============================================================
// 03단원 연습문제 정답 — 표 여러 개 다루기
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE 창고 (
    코드 TEXT PRIMARY KEY,
    이름 TEXT NOT NULL,
    지역 TEXT NOT NULL
  ) STRICT;

  CREATE TABLE 부품 (
    id       INTEGER PRIMARY KEY,
    이름     TEXT    NOT NULL,
    창고코드 TEXT    REFERENCES 창고(코드),
    단가     INTEGER NOT NULL,
    재고     INTEGER NOT NULL
  ) STRICT;

  CREATE TABLE 출고 (
    id     INTEGER PRIMARY KEY,
    부품id INTEGER NOT NULL REFERENCES 부품(id),
    수량   INTEGER NOT NULL,
    날짜   TEXT    NOT NULL
  ) STRICT;
`);

db.exec(`
  INSERT INTO 창고 VALUES
    ('S1', '1창고', '수원'),
    ('S2', '2창고', '수원'),
    ('P1', '평택창고', '평택'),
    ('E1', '빈창고', '이천')
`);

db.exec(`
  INSERT INTO 부품 (이름, 창고코드, 단가, 재고) VALUES
    ('볼트 M6',  'S1',  120,  500),
    ('너트 M6',  'S1',   80,  300),
    ('와셔 M6',  'S2',   30, 1000),
    ('스프링',   'S2',  250,   40),
    ('베어링',   'P1', 3500,   12),
    ('미분류품', NULL,  100,    5)
`);

db.exec(`
  INSERT INTO 출고 (부품id, 수량, 날짜) VALUES
    (1, 100, '2026-08-01'), (1,  50, '2026-08-05'),
    (2,  30, '2026-08-01'),
    (3, 200, '2026-08-03'), (3, 100, '2026-08-07'), (3,  50, '2026-08-10'),
    (5,   2, '2026-08-02')
`);


// ───── 문제 1 ─────
const 이어붙인것 = db.prepare(`
  SELECT 부품.이름 AS 부품명, 창고.이름 AS 창고명
  FROM 부품
  JOIN 창고 ON 부품.창고코드 = 창고.코드
  ORDER BY 부품.id
`).all();

console.log(이어붙인것.map((행) => `${행.부품명}/${행.창고명}`).join(", "));
// 출력: 볼트 M6/1창고, 너트 M6/1창고, 와셔 M6/2창고, 스프링/2창고, 베어링/평택창고
//
// ★★ AS 를 안 붙이면 '이름' 이 겹쳐서 **부품 이름이 사라집니다.**
//   { 이름: '볼트 M6', 이름: '1창고' } → 뒤가 이겨서 창고 이름만 남습니다.
//   오류도 경고도 없습니다. JOIN 을 쓸 때는 겹치는 칸에 무조건 AS 를 붙이세요.
//
// ★ 미분류품이 안 나왔습니다. 창고코드가 NULL 이라 짝이 없어서입니다.
//   "숫자가 안 맞으면 JOIN 을 먼저 의심하라" 가 여기서 나옵니다.


// ───── 문제 2 ─────
const 다남긴것 = db.prepare(`
  SELECT 부품.이름 AS 부품명, COALESCE(창고.이름, '미배치') AS 창고명
  FROM 부품
  LEFT JOIN 창고 ON 부품.창고코드 = 창고.코드
  ORDER BY 부품.id
`).all();

console.log(다남긴것.map((행) => `${행.부품명}/${행.창고명}`).join(", "));
// 출력: 볼트 M6/1창고, 너트 M6/1창고, 와셔 M6/2창고, 스프링/2창고, 베어링/평택창고, 미분류품/미배치
//
// LEFT JOIN 이 왼쪽(부품) 을 다 남기고, COALESCE 가 NULL 을 '미배치' 로 바꿨습니다.
//
// ★ 왼쪽이 FROM 에 적은 표입니다. 순서를 바꾸면 결과가 달라집니다.


// ───── 문제 3 ─────
const 빈창고 = db.prepare(`
  SELECT 창고.이름
  FROM 창고
  LEFT JOIN 부품 ON 창고.코드 = 부품.창고코드
  WHERE 부품.id IS NULL
`).all();

console.log(빈창고.map((행) => 행.이름).join(", "));
// 출력: 빈창고
//
// ★ 아주 많이 쓰는 패턴입니다. 외워 둘 만합니다.
//
//     LEFT JOIN 자식 ON ...
//     WHERE 자식.열쇠 IS NULL
//
//   "주문 없는 회원", "답글 없는 글", "참조 안 되는 파일" — 다 이 모양입니다.
//   백엔드 11단원의 고아 파일 찾기가 정확히 이겁니다.
//
// ★ WHERE 에 쓸 칸은 **NOT NULL 인 칸**을 고르세요.
//   부품.창고코드 로 검사하면 창고코드가 원래 NULL 인 줄과 구분이 안 됩니다.
//   PRIMARY KEY 인 id 가 가장 안전합니다.


// ───── 문제 4 ─────
const 합계 = db.prepare("SELECT COUNT(*) AS 개수, SUM(재고) AS 재고합 FROM 부품").get();
console.log(`${합계.개수}개 ${합계.재고합}`);
// 출력: 6개 1857
//
// 500 + 300 + 1000 + 40 + 12 + 5 = 1857 입니다.


// ───── 문제 5 ─────
const 세기 = db.prepare("SELECT COUNT(*) AS 전체, COUNT(창고코드) AS 창고있음 FROM 부품").get();
console.log(`전체 ${세기.전체} / 창고있음 ${세기.창고있음}`);
// 출력: 전체 6 / 창고있음 5
//
// ★★ COUNT(*) 는 줄 수를, COUNT(칸) 은 그 칸이 NULL 이 아닌 줄만 셉니다.
//   미분류품의 창고코드가 NULL 이라 5 가 됐습니다.
//
//   이걸 모르면 "왜 개수가 다르지?" 로 한참 헤맵니다.
//   반대로 알면 이렇게 편하게 셀 수 있습니다. NULL 을 세는 데 아주 유용합니다.


// ───── 문제 6 ─────
const 창고코드별 = db.prepare(`
  SELECT 창고코드, COUNT(*) AS 개수, SUM(재고) AS 재고합
  FROM 부품
  GROUP BY 창고코드
  ORDER BY 창고코드
`).all();

console.log(창고코드별.map((행) => `${행.창고코드}:${행.개수}개(${행.재고합})`).join(", "));
// 출력: null:1개(5), P1:1개(12), S1:2개(800), S2:2개(1040)
//
// ★ GROUP BY 는 NULL 끼리도 한 덩어리로 묶습니다. 맨 앞에 나옵니다.
//   WHERE 에서 = NULL 이 안 되는 것과는 다릅니다. GROUP BY 는 묶어 줍니다.
//
// ★ 화면에 'null' 을 보여 주면 안 됩니다.
//   COALESCE(창고코드, '미배치') 로 GROUP BY 하면 보기 좋게 나옵니다.


// ───── 문제 7 ─────
const 재고많은창고 = db.prepare(`
  SELECT 창고코드
  FROM 부품
  GROUP BY 창고코드
  HAVING SUM(재고) > 500
  ORDER BY 창고코드
`).all();

console.log(재고많은창고.map((행) => 행.창고코드).join(", "));
// 출력: S1, S2
//
// ★ WHERE 에 SUM(재고) > 500 을 쓰면 오류가 납니다.
//     misuse of aggregate: SUM()
//
//   WHERE 는 묶기 **전에** 동작하니 합계가 아직 없습니다.
//   HAVING 은 묶은 **뒤에** 동작하니 합계를 쓸 수 있습니다.
//
//   순서: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT


// ───── 문제 8 ─────
const 창고별개수 = db.prepare(`
  SELECT 창고.이름, COUNT(부품.id) AS 개수
  FROM 창고
  LEFT JOIN 부품 ON 창고.코드 = 부품.창고코드
  GROUP BY 창고.코드
  ORDER BY 개수, 창고.이름
`).all();

console.log(창고별개수.map((행) => `${행.이름}:${행.개수}`).join(", "));
// 출력: 빈창고:0, 평택창고:1, 1창고:2, 2창고:2
//
// ★★★ COUNT(부품.id) 를 썼습니다. COUNT(*) 를 쓰면 빈창고가 **1** 로 나옵니다.
//
//   LEFT JOIN 은 짝이 없어도 줄을 하나 만듭니다. 부품 칸이 전부 NULL 인 줄입니다.
//   COUNT(*) 는 그 줄도 한 줄로 세니까 1 이 됩니다.
//   COUNT(부품.id) 는 NULL 을 안 세니까 0 이 됩니다.
//
//   "주문이 0건인 회원이 1건으로 보인다" 는 버그가 정확히 이겁니다.
//   LEFT JOIN 뒤에 세려면 **오른쪽 표의 칸**을 세세요.
//
// ★ ORDER BY 에 SELECT 의 별칭(개수) 을 썼습니다. SQL 이 허용합니다.
//   ORDER BY 는 SELECT 뒤에 동작하기 때문입니다.


// ───── 문제 9 ─────
console.log(db.prepare("SELECT SUM(단가 * 재고) AS 금액 FROM 부품").get().금액);
// 출력: 166500
//
//   120×500  =  60000
//    80×300  =  24000
//    30×1000 =  30000
//   250×40   =  10000
//  3500×12   =  42000
//   100×5    =    500
//            = 166500
//
// ★ SUM(단가) * SUM(재고) 가 아닙니다. 그건 전혀 다른 값입니다.
//   줄마다 곱한 다음 더해야 합니다. SUM(단가 * 재고) 가 맞습니다.
//
// ★ 단가를 INTEGER 로 뒀기 때문에 딱 떨어집니다.
//   REAL 로 뒀다면 175500.00000000003 같은 값이 나올 수 있습니다. (개념03)


// ───── 문제 10 ─────
const 출고건수 = db.prepare(`
  SELECT 부품.이름, COUNT(출고.id) AS 건수
  FROM 부품
  LEFT JOIN 출고 ON 부품.id = 출고.부품id
  GROUP BY 부품.id
  ORDER BY 부품.id
`).all();

console.log(출고건수.map((행) => `${행.이름}:${행.건수}`).join(", "));
// 출력: 볼트 M6:2, 너트 M6:1, 와셔 M6:3, 스프링:0, 베어링:1, 미분류품:0
//
// 문제 8 과 같은 모양입니다. LEFT JOIN + COUNT(오른쪽.id) + GROUP BY.
// 이 세 개가 한 묶음으로 붙어 다닙니다.


// ───── 문제 11 ─────
const 출고된것 = db.prepare(`
  SELECT 이름 FROM 부품
  WHERE EXISTS (SELECT 1 FROM 출고 WHERE 출고.부품id = 부품.id)
  ORDER BY id
`).all();

console.log(출고된것.map((행) => 행.이름).join(", "));
// 출력: 볼트 M6, 너트 M6, 와셔 M6, 베어링
//
// ★ EXISTS 는 "한 건이라도 있으면" 입니다. 찾자마자 멈춥니다.
//   (SELECT COUNT(*) ...) > 0 으로 세면 끝까지 셉니다. EXISTS 가 낫습니다.
//
// ★ JOIN 으로도 되지만 주의가 필요합니다.
//     SELECT 부품.이름 FROM 부품 JOIN 출고 ON ...
//   → 볼트가 출고 2건이라 **2줄** 나옵니다. DISTINCT 를 붙여야 합니다.
//   EXISTS 는 줄이 늘어나지 않습니다. 그래서 이런 경우에 더 안전합니다.


// ───── 문제 12 ─────
const 등급별 = db.prepare(`
  SELECT CASE
           WHEN 재고 >= 100 THEN '충분'
           WHEN 재고 >= 20  THEN '보통'
           ELSE                  '부족'
         END AS 등급,
         COUNT(*) AS 개수
  FROM 부품
  GROUP BY 등급
  ORDER BY 등급
`).all();

console.log(등급별.map((행) => `${행.등급}:${행.개수}`).join(", "));
// 출력: 보통:1, 부족:2, 충분:3
//
// 충분(500, 300, 1000) 3개 / 보통(40) 1개 / 부족(12, 5) 2개입니다.
//
// ★★ WHEN 은 위에서부터 검사하고 처음 맞는 데서 멈춥니다.
//   순서를 뒤집어서 >= 20 을 위로 올리면 500 도 '보통' 이 됩니다.
//   범위를 나눌 때는 **큰 값부터** 적으세요.
//
// ★ CASE 로 만든 별칭을 GROUP BY 에서 바로 쓸 수 있습니다.
//   SQLite·MySQL 은 됩니다. Postgres 도 GROUP BY 는 됩니다.


// ───── 문제 13 ─────
const 창고통계 = db.prepare(`
  SELECT 창고.이름,
         COUNT(부품.id)                          AS 개수,
         COALESCE(ROUND(AVG(부품.단가), 1), 0)   AS 평균단가
  FROM 창고
  LEFT JOIN 부품 ON 창고.코드 = 부품.창고코드
  GROUP BY 창고.코드
  ORDER BY 창고.이름
`).all();

for (const 행 of 창고통계) {
  console.log(`${행.이름}:${행.개수}개,평균${행.평균단가}`);
}
// 출력: 1창고:2개,평균100
// 출력: 2창고:2개,평균140
// 출력: 빈창고:0개,평균0
// 출력: 평택창고:1개,평균3500
//
// ★★★ 세 가지를 다 챙겨야 이 결과가 나옵니다. 하나라도 빠지면 이렇게 됩니다.
//
//   LEFT JOIN 을 안 쓰면       → 빈창고가 목록에서 사라집니다
//   COUNT(*) 를 쓰면           → 빈창고가 1개로 나옵니다
//   COALESCE 를 안 쓰면        → 빈창고 평균이 null 로 나가서
//                                화면에서 평균.toFixed(1) 이 터집니다
//
//   통계 API 를 만들 때마다 이 세 개를 확인하세요. 실제로 다 겪는 일입니다.
//
// ★ 정렬이 '1창고, 2창고, 빈창고, 평택창고' 입니다.
//   한글은 숫자 다음이라 1, 2 가 먼저 옵니다. (백엔드 06단원의 정렬 규칙)


// ───── 문제 14 ─────
const 빈창고_NOT_IN = db.prepare(`
  SELECT 이름 FROM 창고
  WHERE 코드 NOT IN (SELECT 창고코드 FROM 부품)
`);

console.log("NOT IN 으로:", JSON.stringify(빈창고_NOT_IN.all().map((행) => 행.이름)));
// 출력: NOT IN 으로: []

const 빈창고_NOT_EXISTS = db.prepare(`
  SELECT 이름 FROM 창고
  WHERE NOT EXISTS (SELECT 1 FROM 부품 WHERE 부품.창고코드 = 창고.코드)
`);

console.log("NOT EXISTS 로:", JSON.stringify(빈창고_NOT_EXISTS.all().map((행) => 행.이름)));
// 출력: NOT EXISTS 로: ["빈창고"]
//
// ★ 문제 3 에서 LEFT JOIN 으로 찾은 것과 같은 답입니다. 빈창고 1개.
//   NOT IN 만 0건입니다. 오류도 경고도 없습니다.
//
// ★★★ 왜 그런가 — 서브쿼리 결과를 직접 봅시다.

console.log("서브쿼리 결과:", JSON.stringify(
  db.prepare("SELECT 창고코드 FROM 부품 ORDER BY id").all().map((행) => 행.창고코드)
));
// 출력: 서브쿼리 결과: ["S1","S1","S2","S2","P1",null]
//
//   맨 끝에 null 이 있습니다. 미분류품의 창고코드입니다.
//   그래서 조건이 이렇게 됩니다.
//
//     'E1' NOT IN ('S1', 'S1', 'S2', 'S2', 'P1', NULL)
//
//   풀어 쓰면 "E1 은 S1 과 다르고, S2 와 다르고, ... NULL 과 다르다" 입니다.
//
//     'E1' <> 'S1'  → 참
//     'E1' <> 'P1'  → 참
//     'E1' <> NULL  → **모름**
//
//   전부 참이어야 통과인데 하나가 "모름" 이라 결과도 "모름" 이 됩니다.
//   모름은 WHERE 를 통과하지 못합니다. 그래서 0건입니다.
//
// ★★ 무서운 점: 부품 표에 NULL 이 하나만 생겨도 이렇게 됩니다.
//   어제까지 잘 나오던 조회가 오늘 0건이 됩니다.
//   오류가 안 나니까 원인을 찾기까지 몇 시간이 걸립니다.
//
// ★ 고치는 방법 두 가지
//
//   ○ NOT EXISTS 를 쓴다                          ← 권합니다
//   ○ 서브쿼리에 WHERE 창고코드 IS NOT NULL 을 붙인다

console.log("NULL 을 걸러도:", JSON.stringify(
  db.prepare(`
    SELECT 이름 FROM 창고
    WHERE 코드 NOT IN (SELECT 창고코드 FROM 부품 WHERE 창고코드 IS NOT NULL)
  `).all().map((행) => 행.이름)
));
// 출력: NULL 을 걸러도: ["빈창고"]
//
// 둘 다 됩니다. 그런데 NOT EXISTS 를 권하는 이유가 있습니다.
// IS NOT NULL 은 **빼먹기 쉽습니다.** 빼먹으면 조용히 0건이 됩니다.
// NOT EXISTS 는 애초에 NULL 을 신경 쓸 일이 없습니다.
//
// ★ IN (NOT 이 없는 쪽) 은 괜찮습니다. NULL 이 있어도 있는 것만 찾아 줍니다.
//   문제가 되는 건 NOT IN 뿐입니다.


// ───── 문제 15 ─────
let 조회수 = 0;

function 세면서(문장) {
  return {
    all: (...값) => { 조회수 += 1; return 문장.all(...값); },
    get: (...값) => { 조회수 += 1; return 문장.get(...값); },
  };
}

const 부품목록 = 세면서(db.prepare("SELECT id, 이름 FROM 부품"));
const 출고합 = 세면서(db.prepare("SELECT COALESCE(SUM(수량), 0) AS 합 FROM 출고 WHERE 부품id = ?"));

function N더하기1() {
  return 부품목록.all().map((부품) => ({ 이름: 부품.이름, 출고량: 출고합.get(부품.id).합 }));
}

조회수 = 0;
const 느린것 = N더하기1();
console.log("N+1 조회 횟수:", 조회수);
// 출력: N+1 조회 횟수: 7

const 한번에문장 = 세면서(db.prepare(`
  SELECT 부품.이름, COALESCE(SUM(출고.수량), 0) AS 출고량
  FROM 부품
  LEFT JOIN 출고 ON 부품.id = 출고.부품id
  GROUP BY 부품.id
  ORDER BY 부품.id
`));

조회수 = 0;
const 빠른것 = 한번에문장.all().map((행) => ({ 이름: 행.이름, 출고량: 행.출고량 }));
console.log("고친 뒤 조회 횟수:", 조회수);
// 출력: 고친 뒤 조회 횟수: 1
console.log("결과 같은가:", JSON.stringify(느린것) === JSON.stringify(빠른것));
// 출력: 결과 같은가: true
//
// 부품 6개 + 목록 1번 = 7번이 1번이 됐습니다.
//
// ★ .map((행) => ({ 이름, 출고량 })) 로 다시 만든 이유:
//   node:sqlite 가 주는 행은 프로토타입이 없어서 JSON.stringify 비교에는
//   문제없지만, 키 순서와 여분 칸을 정리하려고 새로 만들었습니다.
//   실무에서는 그냥 그대로 res.json 에 넘기면 됩니다. (02단원 개념02)
//
// ★★ COALESCE(SUM(...), 0) 을 빼면 출고 없는 부품의 출고량이 null 이 됩니다.
//   N+1 쪽 조회에도 같은 COALESCE 가 들어 있는 걸 보세요.
//   두 방식의 결과를 정말 같게 만들려면 양쪽 다 챙겨야 합니다.


// ───── 문제 16 ─────
function 출고까지() {
  const 부품들 = db.prepare("SELECT id, 이름 FROM 부품 ORDER BY id").all(); // 1번
  const 출고들 = db.prepare("SELECT 부품id, 수량 FROM 출고 ORDER BY id").all(); // 2번

  const 묶음 = new Map();
  for (const 출고 of 출고들) {
    if (!묶음.has(출고.부품id)) 묶음.set(출고.부품id, []);
    묶음.get(출고.부품id).push(출고.수량);
  }

  return 부품들.map((부품) => ({
    id: 부품.id,
    이름: 부품.이름,
    출고들: 묶음.get(부품.id) ?? [],
  }));
}

const 붙인것 = 출고까지();
console.log(`${붙인것[0].이름}: ${붙인것[0].출고들.length}건`);
// 출력: 볼트 M6: 2건
console.log(`${붙인것[3].이름}: ${붙인것[3].출고들.length}건`);
// 출력: 스프링: 0건
//
// ★★ filter 를 쓰면 안 되는 이유
//
//     ✗  출고들.filter((출고) => 출고.부품id === 부품.id)
//
//   부품마다 출고 전체를 훑습니다. 부품 200개 × 출고 4000건 = 80만 번입니다.
//   조회는 2번인데 자바스크립트가 느려집니다. N+1 을 고쳤다고 착각하기 쉽습니다.
//
//     ○  Map 에 한 번 담고 꺼내 쓴다 → 담기 4000번 + 꺼내기 200번
//
// ★★ ?? [] 를 빼먹지 마세요.
//   출고가 없는 스프링은 Map 에 아예 없어서 undefined 가 나옵니다.
//   그게 화면으로 나가면 .length 나 .map 에서 터집니다.


// ───── 문제 17 ─────
db.exec("CREATE INDEX 출고_부품id ON 출고(부품id)");
db.exec("CREATE INDEX 출고_날짜 ON 출고(날짜)");

function 색인쓰나(sql) {
  const 계획 = db.prepare("EXPLAIN QUERY PLAN " + sql).all();
  return 계획.some((줄) => 줄.detail.startsWith("SEARCH")) ? "SEARCH" : "SCAN";
}

console.log("부품id = 1        :", 색인쓰나("SELECT * FROM 출고 WHERE 부품id = 1"));
// 출력: 부품id = 1        : SEARCH
console.log("부품id + 0 = 1    :", 색인쓰나("SELECT * FROM 출고 WHERE 부품id + 0 = 1"));
// 출력: 부품id + 0 = 1    : SCAN
console.log("날짜 LIKE '%08%'  :", 색인쓰나("SELECT * FROM 출고 WHERE 날짜 LIKE '%08%'"));
// 출력: 날짜 LIKE '%08%'  : SCAN
console.log("날짜 >= 로 범위    :", 색인쓰나("SELECT * FROM 출고 WHERE 날짜 >= '2026-08-01' AND 날짜 < '2026-09-01'"));
// 출력: 날짜 >= 로 범위    : SEARCH
//
// ★★ 같은 칸, 같은 색인인데 결과가 다릅니다. 규칙은 하나입니다.
//
//   **색인 걸린 칸을 그대로 두고 비교해야** 색인을 씁니다.
//
//     ✗  부품id + 0 = 1          칸에 계산을 붙임
//     ✗  date(날짜) = '2026-08-01'  칸에 함수를 씌움 ← 아주 흔한 실수
//     ✗  날짜 LIKE '%08%'         앞에 % 가 있으면 시작점을 모름
//     ○  날짜 >= '...' AND 날짜 < '...'  칸은 그대로, 값 쪽을 맞춤
//
// ★ "이번 달 자료" 를 뽑을 때 date() 나 strftime() 을 쓰기 쉽습니다.
//   그러면 색인이 죽습니다. 범위로 바꾸는 습관을 들이세요.
//
// ★ 실제로 느린지 확인할 때는 EXPLAIN QUERY PLAN 을 찍어 보세요.
//   추측하지 말고 물어보면 됩니다.

db.close();
