// ============================================================
// 02단원 · 개념 04 — 폴더 다루기
// ------------------------------------------------------------
// 실행: node 개념04_폴더_다루기.js
// ============================================================
//
// 앞에서 파일을 읽고 썼습니다. 그런데 실제 서비스에서는
// 파일을 아무 데나 쌓아 두지 않습니다. 폴더로 정리합니다.
//
//     uploads/
//       2026/
//         03/
//           작업표준서.pdf
//           검사성적서.xlsx
//
// 이번 파일에서는 폴더를 만들고, 안을 들여다보고, 지우는 법을 배웁니다.
// 파일 업로드 서버를 만들 때 그대로 씁니다.

const fs = require("fs");
const path = require("path");

// 이 예제가 쓸 연습용 폴더입니다.
const 연습폴더 = path.join(__dirname, "연습_업로드");

// 매번 결과가 같도록 먼저 통째로 지우고 시작합니다.
// force: true 는 "없어도 에러 내지 말라" 는 뜻입니다.
fs.rmSync(연습폴더, { recursive: true, force: true });

// ── 섹션 1: 폴더 만들기 ──

fs.mkdirSync(연습폴더);

console.log(fs.existsSync(연습폴더));
// 출력: true
// 탐색기에서 이 폴더를 열어 보세요. 연습_업로드 폴더가 생겼습니다.

// 이미 있는 폴더를 또 만들면 에러가 납니다.
try {
  fs.mkdirSync(연습폴더);
} catch (error) {
  console.log(error.code);
  // 출력: EEXIST
  // EEXIST = already EXISTs. "이미 있다" 는 뜻입니다.
}

// 그래서 보통 확인하고 만듭니다.
if (!fs.existsSync(연습폴더)) {
  fs.mkdirSync(연습폴더);
}

// ✏️ 직접 해보기 1 — "임시폴더" 를 만들고 existsSync 로 확인해 보세요.

// ── 섹션 2: 여러 단계를 한 번에 ──

// uploads/2026/03 처럼 여러 단계를 만들려면 어떻게 할까요?
// 하나씩 만들 필요 없습니다. recursive 옵션을 주면 됩니다.

const 깊은경로 = path.join(연습폴더, "2026", "03");

fs.mkdirSync(깊은경로, { recursive: true });

console.log(fs.existsSync(깊은경로));
// 출력: true
// 2026 폴더도 03 폴더도 한 번에 만들어졌습니다.

// recursive: true 는 보너스가 하나 더 있습니다.
// 이미 있어도 에러를 안 냅니다. EEXIST 가 안 납니다.
fs.mkdirSync(깊은경로, { recursive: true });
console.log("두 번 만들어도 에러가 안 났습니다");
// 출력: 두 번 만들어도 에러가 안 났습니다

// ★ 그래서 실무에서는 거의 항상 이 형태를 씁니다.
//
//     fs.mkdirSync(저장폴더, { recursive: true });
//
//   확인할 필요도 없고, 몇 단계든 한 번에 만들어집니다.

// ✏️ 직접 해보기 2 — 연습폴더 안에 "docs/pdf" 를 한 번에 만들어 보세요.
const 파일경로 = path.join(연습폴더, "docs", "pdf");
fs.mkdirSync(파일경로, { recursive: true });
console.log("확인", fs.existsSync(파일경로));
// ── 섹션 3: 폴더 안 목록 보기 ──

// 파일 몇 개를 넣어 봅시다.
fs.writeFileSync(path.join(연습폴더, "작업표준서.pdf"), "내용1", "utf-8");
fs.writeFileSync(path.join(연습폴더, "검사성적서.xlsx"), "내용22", "utf-8");
fs.writeFileSync(path.join(깊은경로, "3월보고서.pdf"), "내용333", "utf-8");

const 목록 = fs.readdirSync(연습폴더);

console.log(목록.sort());
// 출력: [ '2026', '검사성적서.xlsx', '작업표준서.pdf' ]

// 세 가지를 눈여겨보세요.
//   ① 폴더(2026)와 파일이 섞여 나옵니다
//   ② 이름만 나옵니다. 전체 경로가 아닙니다
//   ③ 안쪽 폴더(2026/03)의 파일은 안 나옵니다. 한 겹만 봅니다
//
// sort() 를 붙인 이유
//   운영체제마다 순서가 다를 수 있습니다.
//   순서가 중요하면 직접 정렬하세요. (JS자료 08단원의 sort)

// 확장자로 걸러내는 것은 지금까지 배운 것으로 됩니다.
const pdf목록 = fs
  .readdirSync(연습폴더)
  .filter((name) => path.extname(name) === ".pdf");
console.log(pdf목록);
// 출력: [ '작업표준서.pdf' ]

// ✏️ 직접 해보기 3 — 깊은경로 폴더의 목록을 출력해 보세요.
console.log("깊은경로", fs.readdirSync(깊은경로));

// ── 섹션 4: 파일인가 폴더인가 ──

// 목록에는 파일과 폴더가 섞여 나옵니다. 구분하려면 statSync 를 씁니다.

const 파일정보 = fs.statSync(path.join(연습폴더, "작업표준서.pdf"));

console.log(파일정보.isFile(), 파일정보.isDirectory());
// 출력: true false

const 폴더정보 = fs.statSync(path.join(연습폴더, "2026"));

console.log(폴더정보.isFile(), 폴더정보.isDirectory());
// 출력: false true

// 크기도 알 수 있습니다. '글자 수' 가 아니라 '바이트 수' 입니다.
console.log(파일정보.size);
// 출력: 7
//
// 이 파일에 쓴 내용은 "내용1" — 세 글자입니다. 그런데 7바이트입니다.
//
//     내  →  3바이트
//     용  →  3바이트
//     1   →  1바이트
//     ─────────────
//            7바이트
//
// utf-8 에서 한글은 한 글자에 3바이트, 영어와 숫자는 1바이트를 씁니다.
// 그래서 "글자 수 × 1 = 크기" 가 아닙니다.
//
// 나중에 "파일 크기 5MB 까지만 허용" 같은 제한을 걸 때
// 세는 단위가 바이트라는 것을 기억하세요. (09단원 multer)

// 수정 시각도 있습니다.
console.log(파일정보.mtime.constructor.name);
// 출력: Date
// JS자료 14단원에서 배운 그 Date 객체입니다. getFullYear() 같은 걸 그대로 쓸 수 있습니다.

// 파일과 폴더를 한 번에 구분하는 더 편한 방법도 있습니다.
const 항목들 = fs.readdirSync(연습폴더, { withFileTypes: true });
const 구분 = 항목들
  .map((e) => `${e.name}:${e.isDirectory() ? "폴더" : "파일"}`)
  .sort();

console.log(구분);
// 출력: [ '2026:폴더', '검사성적서.xlsx:파일', '작업표준서.pdf:파일' ]

// withFileTypes: true 를 주면 이름 대신 '정보가 담긴 객체' 가 나옵니다.
// statSync 를 하나씩 부르는 것보다 훨씬 빠릅니다.

// ✏️ 직접 해보기 4 — 연습폴더에서 '폴더만' 골라 이름을 출력해 보세요.

const 폴더만 = fs
  .readdirSync(연습폴더, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);
console.log("폴더만", 폴더만);
// 출력: [ '2026' ]

// ── 섹션 5: 지우기 ──

// [파일 하나] — 앞에서 배운 unlinkSync
fs.unlinkSync(path.join(연습폴더, "검사성적서.xlsx"));
console.log(fs.existsSync(path.join(연습폴더, "검사성적서.xlsx")));
// 출력: false

// [빈 폴더] — rmdirSync
const 빈폴더 = path.join(연습폴더, "빈폴더");
fs.mkdirSync(빈폴더);
fs.rmdirSync(빈폴더);
console.log(fs.existsSync(빈폴더));
// 출력: false

// [안에 뭐가 든 폴더] — rmSync 에 recursive
// rmdirSync 로는 안 됩니다. 비어 있지 않다고 에러가 납니다.
console.log(fs.existsSync(깊은경로));
// 출력: true

fs.rmSync(path.join(연습폴더, "2026"), { recursive: true });
console.log(fs.existsSync(깊은경로));
// 출력: false
// 안에 있던 3월보고서.pdf 까지 통째로 사라졌습니다.

// ★★ 아주 위험합니다 ★★
//   rmSync 에 recursive: true 를 주면 그 아래를 전부 지웁니다.
//   경로를 잘못 쓰면 되돌릴 수 없습니다. 휴지통에도 안 갑니다.
//
//   실무에서는 지우기 전에 반드시 확인합니다.
//     · 경로를 console.log 로 찍어 보고
//     · 그 경로가 내가 만든 폴더 안인지 확인하고
//     · 그다음에 지웁니다
//
//   사용자가 보낸 값을 그대로 rmSync 에 넣는 일은 절대 하지 마세요.

// ✏️ 직접 해보기 5 — 폴더를 만들고, 안에 파일을 하나 넣고,
//                    rmdirSync 로 지워 보세요. 무슨 에러가 나나요?

// ── 섹션 6: 실전 — 업로드 폴더 준비하기 ──

// 파일 업로드 서버가 시작할 때 하는 일을 그대로 만들어 봅시다.
// "오늘 날짜 폴더에 저장한다" 는 흔한 방식입니다.

function 저장폴더만들기(기준폴더, 날짜) {
  const 년 = 날짜.getFullYear();
  const 월 = String(날짜.getMonth() + 1).padStart(2, "0");

  const 대상 = path.join(기준폴더, String(년), 월);

  // 없으면 만들고, 있으면 그냥 넘어갑니다
  fs.mkdirSync(대상, { recursive: true });

  return 대상;
}

const 오늘폴더 = 저장폴더만들기(연습폴더, new Date(2026, 11, 25));

console.log(path.basename(오늘폴더));
// 출력: 03
console.log(path.basename(path.dirname(오늘폴더)));
// 출력: 2026
// 2026/03 폴더가 만들어졌습니다. getMonth() 는 0부터라 +1 했습니다. (JS자료 14단원)

// 이제 여기에 파일을 저장하면 됩니다.
const 저장경로 = path.join(오늘폴더, "새문서.pdf");
fs.writeFileSync(저장경로, "업로드된 내용", "utf-8");

console.log(fs.existsSync(저장경로));
// 출력: true

// 09단원에서 multer 를 배우면 이 함수를 그대로 씁니다.
// 달라지는 것은 "파일 내용이 어디서 오느냐" 뿐입니다.

// 뒷정리 — 연습용이라 통째로 지웁니다.
// fs.rmSync(연습폴더, { recursive: true, force: true });
console.log(fs.existsSync(연습폴더));
// 출력: false

// ✏️ 직접 해보기 6 — 저장폴더만들기 에 new Date(2026, 11, 25) 를 넣으면
//                    어떤 폴더가 만들어질까요? 먼저 예상하고 확인하세요.

// ── 섹션 7: 자주 하는 실수 ──

// ★ 아래에서 SyntaxError 라고 적힌 것은 눈으로만 보세요. 주석을 풀지 마세요.

// [실수 1] 폴더 없이 파일부터 쓰려 함
//   fs.writeFileSync(path.join(__dirname, "없는폴더", "a.txt"), "내용");
//   실수: ENOENT 가 납니다. 파일은 만들어 주지만 폴더는 안 만들어 줍니다.
//         쓰기 전에 mkdirSync(폴더, { recursive: true }) 를 먼저 하세요.

// [실수 2] recursive 를 안 씀
//   fs.mkdirSync(path.join(a, "b", "c"));
//   실수: b 가 없으면 ENOENT 입니다. 한 단계씩만 만들어 줍니다.
//         { recursive: true } 를 붙이면 다 만들어 주고 이미 있어도 안전합니다.

// [실수 3] readdirSync 결과를 그대로 경로로 씀
//   const files = fs.readdirSync(폴더);
//   fs.readFileSync(files[0]);
//   실수: readdirSync 는 '이름' 만 줍니다. 전체 경로가 아닙니다.
//         path.join(폴더, files[0]) 로 합쳐야 합니다.

// [실수 4] 안쪽 폴더까지 다 보일 거라 생각함
//   readdirSync 는 한 겹만 봅니다. 안쪽 폴더의 파일은 안 나옵니다.
//   전부 훑으려면 폴더를 만날 때마다 다시 들어가야 합니다.

// [실수 5] rmSync 를 함부로 씀
//   fs.rmSync(경로, { recursive: true, force: true });
//   실수: 경로가 틀리면 엉뚱한 폴더가 통째로 사라집니다.
//         특히 사용자 입력을 경로에 넣으면 절대 안 됩니다.

// [실수 6] 폴더를 unlinkSync 로 지우려 함
//   fs.unlinkSync(폴더경로);
//   실수: EPERM 이나 EISDIR 에러가 납니다.
//         파일은 unlink, 폴더는 rmdir 또는 rm 입니다.

// ── 정리 ──

// 1. mkdirSync(경로, { recursive: true }) — 여러 단계를 한 번에, 있어도 안전.
// 2. readdirSync(폴더) — 한 겹의 이름 목록. 전체 경로가 아니다.
// 3. withFileTypes: true 를 주면 파일인지 폴더인지 바로 알 수 있다.
// 4. statSync 로 크기(size)와 수정 시각(mtime)을 알 수 있다.
// 5. 파일은 unlinkSync, 빈 폴더는 rmdirSync, 내용 있는 폴더는 rmSync + recursive.
// 6. 지우는 것은 되돌릴 수 없다. 경로를 반드시 확인하고 지운다.
// 7. 파일을 쓰기 전에 폴더를 먼저 만든다. 폴더는 자동으로 안 생긴다.

// ============================================================
// 직접 해보기 정답
// ============================================================
//
// 1) const p = path.join(__dirname, "임시폴더");
//    fs.mkdirSync(p, { recursive: true });
//    console.log(fs.existsSync(p));   // 출력: true
//    fs.rmSync(p, { recursive: true, force: true });   // 확인 후 정리
//
// 2) fs.mkdirSync(path.join(연습폴더, "docs", "pdf"), { recursive: true });
//    → docs 와 pdf 가 한 번에 만들어집니다.
//
// 3) console.log(fs.readdirSync(깊은경로));
//    // 출력: [ '3월보고서.pdf' ]
//    → 섹션 5에서 지우기 전에 실행해야 나옵니다.
//
// 4) const 폴더만 = fs.readdirSync(연습폴더, { withFileTypes: true })
//      .filter((e) => e.isDirectory())
//      .map((e) => e.name);
//    console.log(폴더만);
//    // 출력: [ '2026' ]
//    → filter 와 map 은 JS자료 08단원에서 배운 그대로입니다.
//
// 5) const p = path.join(__dirname, "안빈폴더");
//    fs.mkdirSync(p, { recursive: true });
//    fs.writeFileSync(path.join(p, "a.txt"), "내용", "utf-8");
//    try {
//      fs.rmdirSync(p);
//    } catch (e) {
//      console.log(e.code);   // 출력: ENOTEMPTY
//    }
//    fs.rmSync(p, { recursive: true, force: true });
//    → ENOTEMPTY = NOT EMPTY. "비어 있지 않다" 는 뜻입니다.
//      안에 뭐가 있으면 rmdirSync 로는 못 지웁니다.
//
// 6) 2026/12 폴더가 만들어집니다.
//    new Date(2026, 11, 25) 의 11 은 12월입니다. getMonth() 가 0부터라
//    +1 을 하면 12 가 되고, padStart 로 "12" 가 됩니다.
//    (한 자리 달이면 "03" 처럼 앞에 0이 붙습니다)
