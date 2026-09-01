// ============================================================
// 02단원 연습문제 — 파일 다루기
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~12는 기본, 13은 응용, 14는 [도전], 15는 에러 확인입니다.
//
// [준비] 아래 두 줄은 그대로 두세요. 모든 문제에서 씁니다.

const fs = require("fs");
const path = require("path");

// 이 연습문제가 쓸 폴더입니다. 매번 결과가 같도록 먼저 지우고 시작합니다.
const 작업폴더 = path.join(__dirname, "연습_작업");
fs.rmSync(작업폴더, { recursive: true, force: true });
fs.mkdirSync(작업폴더, { recursive: true });

// ───── 문제 1 ───── (개념01)
// "uploads", "2026", "03", "보고서.pdf" 네 조각을 이어 붙인 경로를 출력하세요.
//
// 기대 출력:
// uploads\2026\03\보고서.pdf
//
// (윈도우 기준입니다. 맥·리눅스는 uploads/2026/03/보고서.pdf 로 나옵니다)

console.log(path.join("uploads", "2026", "03", "보고서.pdf"));

// ───── 문제 2 ───── (개념01)
// 아래 파일 이름이 PDF 인지 판정해 true/false 로 출력하세요.
// 대문자로 올려도 true 가 나와야 합니다.
//
// 힌트: extname 은 점을 포함해 ".PDF" 를 줍니다. 소문자로 낮춰서 비교하세요.

const 파일명1 = "작업표준서.PDF";

// 기대 출력:
// true

console.log(path.extname(파일명1).toLowerCase() === ".pdf");

// ───── 문제 3 ───── (개념01)
// 위 파일명에서 확장자를 뗀 이름만 출력하세요.
// (대문자 확장자여도 제대로 떼어져야 합니다)
//
// 힌트: basename 의 두 번째 인자에 '뗄 확장자' 를 넘깁니다.
//       그 확장자는 extname 으로 구할 수 있습니다.
//
// 기대 출력:
// 작업표준서

const 확장자 = path.extname(파일명1);

console.log(path.basename(파일명1, 확장자));

// ───── 문제 4 ───── (개념02)
// 같은 폴더의 샘플_문서.txt 를 읽어서 첫 줄만 출력하세요.
//
// 힌트: 경로는 path.join(__dirname, ...) 으로 만드세요.
//       "utf-8" 을 빼먹으면 안 됩니다.
//
// 기대 출력:
// 작업표준서

const 샘플경로 = path.join(__dirname, "샘플_문서.txt");
const text = fs.readFileSync(샘플경로, "utf-8");
console.log(text.split("\n")[0]);

// ───── 문제 5 ───── (개념02)
// 같은 파일에서 빈 줄을 뺀 줄 수를 출력하세요.
//
// 기대 출력:
// 4

const lines = text.split("\n").filter((line) => line !== "");
console.log(lines.length);

// ───── 문제 6 ───── (개념02)
// 작업폴더 안에 "메모.txt" 를 만들고 "첫 줄\n" 을 쓰세요.
// 그다음 그 파일이 있는지 확인해 출력하세요.
//
// 기대 출력:
// true

const 메모 = path.join(작업폴더, "메모.txt");
fs.writeFileSync(메모, "첫 줄\n", "utf-8");
console.log(fs.existsSync(메모));

// ───── 문제 7 ───── (개념02)
// 방금 만든 메모.txt 에 "둘째 줄\n" 과 "셋째 줄\n" 을 이어 붙이고,
// 전체 줄 수를 출력하세요. (덮어쓰면 안 됩니다)
//
// 힌트: 이어 쓰는 것은 appendFileSync 입니다.
//
// 기대 출력:
// 3

fs.appendFileSync(메모, "둘째 줄\n", "utf-8");
fs.appendFileSync(메모, "셋째 줄\n", "utf-8");

const 메모내용 = fs.readFileSync(메모, "utf-8");
console.log(메모내용.trim().split("\n").length);

// ───── 문제 8 ───── (개념02)
// 없는 파일을 읽어 보고, 에러 코드만 출력하세요.
// 프로그램이 죽으면 안 됩니다.
//
// 기대 출력:
// ENOENT

try {
  fs.readFileSync(path.join(__dirname, "없는파일.txt"), "utf-8");
} catch (error) {
  console.log(error.code);
}

// ───── 문제 9 ───── (개념04)
// 작업폴더 안에 "docs/2026/03" 을 한 번에 만들고, 있는지 확인해 출력하세요.
//
// 힌트: 여러 단계를 한 번에 만드는 옵션이 있습니다.
//
// 기대 출력:
// true

const 한번에 = path.join(작업폴더, "docs", "2026", "03");
fs.mkdirSync(한번에, { recursive: true });
console.log(fs.existsSync(한번에));

// ───── 문제 10 ───── (개념04)
// 아래 세 파일을 작업폴더에 만든 뒤,
// 작업폴더에서 .txt 파일만 골라 이름을 정렬해 출력하세요.

// (이 세 줄은 그대로 두세요)
fs.writeFileSync(path.join(작업폴더, "a.txt"), "A", "utf-8");
fs.writeFileSync(path.join(작업폴더, "b.pdf"), "B", "utf-8");
fs.writeFileSync(path.join(작업폴더, "c.txt"), "C", "utf-8");

// 기대 출력:
// [ 'a.txt', 'c.txt', '메모.txt' ]

const txt목록 = fs
  .readdirSync(작업폴더)
  .filter((name) => path.extname(name) === ".txt");
console.log(txt목록);

// ───── 문제 11 ───── (개념04)
// 작업폴더 안에서 '폴더' 인 것만 골라 이름을 출력하세요.
//
// 힌트: readdirSync 에 { withFileTypes: true } 를 주면
//       각 항목에 isDirectory() 를 쓸 수 있습니다.
//
// 기대 출력:
// [ 'docs' ]

const 폴더만 = fs
  .readdirSync(작업폴더, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);
console.log("폴더만", 폴더만);

// ───── 문제 12 ───── (개념05)
// 아래 배열을 작업폴더의 "설비.json" 에 사람이 읽기 좋게 저장한 뒤,
// 다시 읽어서 두 번째 설비의 이름을 출력하세요.

const 설비들 = [
  { id: 1, name: "컨베이어", line: "A" },
  { id: 2, name: "프레스", line: "B" },
];

// 힌트: 저장할 때 stringify(값, null, 2), 읽을 때 parse 입니다.
//
// 기대 출력:
// 프레스

const 설비파일 = path.join(작업폴더, "설비.json");
fs.writeFileSync(설비파일, JSON.stringify(설비들, null, 2), "utf-8");
const 설비읽기 = JSON.parse(fs.readFileSync(설비파일, "utf-8"));
console.log(설비읽기[1].name);
// ───── 문제 13 ───── [응용]
// 업로드된 파일을 저장할 경로를 만드는 makeSavePath 함수를 만드세요.
//
//   makeSavePath("검사성적서.XLSX", new Date(2026, 2, 5))
//     → "연습_작업\2026\03\검사성적서_20260305.xlsx"
//
// 규칙:
//   - 확장자는 소문자로 통일합니다
//   - 폴더는 작업폴더/년/월 이고, 월은 두 자리입니다 (03)
//   - 파일명 뒤에 _년월일 을 붙입니다 (20260305)
//   - 폴더가 없으면 만들어야 합니다
//   - 만들어진 경로를 돌려줍니다
//
// 힌트: getMonth() 는 0부터입니다. padStart(2, "0") 으로 두 자리를 맞추세요.
//       path.join 이 만든 경로에서 작업폴더 부분을 빼고 보려면
//       path.relative(__dirname, 경로) 를 쓰면 됩니다.
//
// 기대 출력:
// 연습_작업\2026\03\검사성적서_20260305.xlsx
// true
//
// (경로는 윈도우 기준입니다. 맥·리눅스는 연습_작업/2026/03/... 로 나옵니다)

// TODO: 여기에 코드를 쓰세요
// (두 번째 줄은 그 폴더가 실제로 만들어졌는지 확인해 출력하세요)

// ───── 문제 14 ───── [도전]
// 설비.json 을 비동기로 다루는 함수 세 개를 만들고 차례로 실행하세요.
//
//   불러오기()          파일이 없으면 [] , 있으면 배열
//   추가하기(name, line) id 는 가장 큰 값 + 1 로 붙여서 추가
//   삭제하기(id)         그 id 를 뺀 목록으로 저장
//
// 전부 fs.promises 와 await 를 쓰세요. Sync 를 쓰면 안 됩니다.
//
// 힌트: await 는 async 함수 안에서만 쓸 수 있습니다.
//       async function main() { ... } 으로 감싸고 맨 아래에서 main() 을 부르세요.
//       ★ 이 문제의 출력은 다른 문제들보다 '나중에' 찍힙니다. 정상입니다.
//
// 기대 출력:
// 3
// [ '컨베이어', '프레스', '용접로봇' ]
// [ 1, 3 ]

// TODO: 여기에 코드를 쓰세요
// (추가하기("용접로봇", "C") 후 id / 이름 목록 / 삭제하기(2) 후 id 목록 순서로 출력)

// ───── 문제 15 ───── (에러 확인 — 맨 마지막)
// 아래 두 줄의 주석을 풀고 실행해서 어떤 에러가 나는지 확인하세요.
// 확인했으면 반드시 다시 주석 처리하세요.

// const 없는폴더경로 = path.join(작업폴더, "없는폴더", "파일.txt");
// fs.writeFileSync(없는폴더경로, "내용", "utf-8");

// 무슨 에러 코드가 났나요? 무엇을 먼저 했어야 할까요?
// 답: __________________________________________
