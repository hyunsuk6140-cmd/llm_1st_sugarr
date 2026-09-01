// ============================================================
// 02단원 · 개념 01 — path, 경로 다루기
// ------------------------------------------------------------
// 실행: node 개념01_path_경로_다루기.js
// ============================================================
//
// 백엔드가 하는 일의 절반은 '파일 다루기' 입니다.
//   사용자가 올린 문서를 저장하고
//   저장한 문서를 찾아서 읽고
//   필요 없어지면 지웁니다
//
// 그런데 파일을 다루려면 먼저 '어디에 있는지' 를 정확히 말할 수 있어야 합니다.
// 그게 경로(path)입니다. 그래서 이 단원은 경로부터 시작합니다.
//
// ── 왜 직접 문자열로 안 쓰나 ──
//
// 이렇게 쓰면 안 될까요?
//
//     const 파일경로 = "uploads/2026/보고서.pdf";
//
// 문제는 운영체제마다 구분자가 다르다는 것입니다.
//
//     윈도우      uploads\2026\보고서.pdf      (역슬래시)
//     맥·리눅스   uploads/2026/보고서.pdf      (슬래시)
//
// 내 컴퓨터(윈도우)에서 잘 되던 코드가
// EC2(리눅스)에 올리는 순간 파일을 못 찾습니다.
//
// 그래서 Node 는 path 라는 내장 모듈을 줍니다.
// 설치할 필요 없습니다. Node 에 이미 들어 있습니다.

const path = require("path");

// ── 섹션 1: join — 경로 조각 이어 붙이기 ──

console.log(path.join("uploads", "2026", "보고서.pdf"));
// 출력: uploads\2026\보고서.pdf
// 윈도우라서 \ 로 이어졌습니다. 리눅스에서 실행하면 / 로 이어집니다.
// 우리는 "이어 붙여라" 라고만 말했고, 구분자는 path 가 알아서 골랐습니다.

// 슬래시를 몇 개를 쓰든 알아서 정리해 줍니다.
console.log(path.join("uploads/", "/2026/", "a.pdf"));
// 출력: uploads\2026\a.pdf
// 직접 문자열을 더했다면 uploads//2026//a.pdf 가 됐을 겁니다.

// .. 는 "한 단계 위로" 라는 뜻입니다. 이것도 정리해 줍니다.
console.log(path.join("uploads", "..", "docs", "a.txt"));
// 출력: docs\a.txt
// uploads 로 들어갔다가 다시 나와서 docs 로 들어간 것이라 uploads 가 사라졌습니다.

console.log(path.join("public", "images", "logo.png"));
// ✏️ 직접 해보기 1 — path.join("public", "images", "logo.png") 를 출력해 보세요.

// ── 섹션 2: 경로에서 정보 꺼내기 ──

const filePath = "/data/uploads/보고서.pdf";

// [파일 이름만]
console.log(path.basename(filePath));
// 출력: 보고서.pdf

// [확장자를 뺀 이름만]
console.log(path.basename(filePath, ".pdf"));
// 출력: 보고서
// 두 번째 인자로 "뗄 확장자" 를 넘기면 그것만 떼어 줍니다.

// [확장자만]
console.log(path.extname(filePath));
// 출력: .pdf
// 점이 함께 나옵니다. ".pdf" 이지 "pdf" 가 아닙니다.

// 확장자가 없으면 빈 문자열입니다.
console.log(path.extname("README") === "");
// 출력: true

// [폴더 부분만]
console.log(path.dirname("uploads/2026/a.pdf"));
// 출력: uploads/2026

// 한 번에 다 꺼내는 방법도 있습니다.
const parsed = path.parse(filePath);
console.log(parsed.base, parsed.name, parsed.ext);
// 출력: 보고서.pdf 보고서 .pdf

// ✏️ 직접 해보기 2 — "회의록_2026.docx" 에서 확장자와 확장자 뺀 이름을 각각 출력해 보세요.

console.log(path.extname("회의록_2026.docx"));

console.log(path.basename("회의록_2026.docx", ".docx"));

// ── 섹션 3: 왜 이게 중요한가 — 파일 업로드 ──

// 나중에 사용자가 파일을 올리면 이런 일을 해야 합니다.
//
//   ① 올린 파일의 확장자를 확인한다      → .pdf 만 허용
//   ② 이름이 겹치지 않게 새 이름을 만든다  → 덮어쓰기 방지
//   ③ 저장할 경로를 만든다
//
// 지금 배운 것만으로 다 됩니다.

const uploadedName = "작업표준서.pdf";

// ① 확장자 확인
const ext = path.extname(uploadedName);
console.log(ext === ".pdf");
// 출력: true

// ② 이름이 겹치지 않게 (시간을 붙이는 방법이 흔합니다)
const baseName = path.basename(uploadedName, ext);
const newName = `${baseName}_사본${ext}`;
console.log(newName);
// 출력: 작업표준서_사본.pdf

// ③ 저장 경로 만들기
console.log(path.join("uploads", "2026", newName));
// 출력: uploads\2026\작업표준서_사본.pdf

// 09단원에서 multer 로 진짜 파일 업로드를 만들 때 이 세 줄을 그대로 씁니다.

// ✏️ 직접 해보기 3 — "검사성적서.xlsx" 를 받아
//                    "uploads/검사성적서_백업.xlsx" 경로를 만들어 출력해 보세요.

const name = "검사성적서.xlsx";
const a = path.extname(name);
const b = path.basename(name, a);
console.log(path.join("uploads", `${b}_백업${a}`));

// ── 섹션 4: __dirname — 이 파일이 있는 폴더 ──

// 아주 중요한 함정이 하나 있습니다.
//
//   경로를 "uploads/a.txt" 라고 쓰면
//   '터미널이 지금 있는 폴더' 를 기준으로 찾습니다. (process.cwd())
//
//   그런데 서버를 실행하는 위치는 매번 다를 수 있습니다.
//   그러면 같은 코드가 어떤 날은 되고 어떤 날은 안 됩니다.

console.log(typeof process.cwd());
// 출력: string
// 터미널이 있는 폴더. 어디서 실행하느냐에 따라 바뀝니다.

console.log(typeof __dirname);
// 출력: string
// ★ 이 '파일' 이 있는 폴더. 어디서 실행하든 항상 같습니다.

console.log(typeof __filename);
// 출력: string
// 이 파일의 전체 경로(파일 이름까지)

// 그래서 실무에서는 항상 __dirname 을 기준으로 씁니다.
//
//     const 저장폴더 = path.join(__dirname, "uploads");
//
// 이렇게 쓰면 어디서 node 를 실행하든 같은 폴더를 가리킵니다.

console.log(path.basename(__dirname));
// 출력: 02_파일_다루기
// 지금 이 파일이 들어 있는 폴더 이름입니다.

console.log(path.basename(__filename));
// 출력: 개념01_path_경로_다루기.js

// ✏️ 직접 해보기 4 — __dirname 과 process.cwd() 를 각각 통째로 찍어 보세요.
//                    그다음 한 단계 위 폴더로 나가서(cd ..) 다시 실행해 보세요.
//                    무엇이 바뀌고 무엇이 안 바뀌나요?
console.log(__dirname);
console.log(process.cwd());

// ── 섹션 5: 절대 경로와 상대 경로 ──

// 절대 경로 : 맨 처음부터 다 적은 것.  C:\Users\... 또는 /home/...
// 상대 경로 : 지금 위치를 기준으로 한 것.  uploads/a.txt

console.log(path.isAbsolute("uploads/a.txt"));
// 출력: false
console.log(path.isAbsolute("C:/data"));
// 출력: true
// ★ 위 true 는 윈도우 기준입니다. C: 는 윈도우의 드라이브 표기라서
//   맥·리눅스에서 실행하면 false 가 나옵니다. (거기서는 / 로 시작해야 절대 경로)

// resolve 는 상대 경로를 절대 경로로 바꿔 줍니다.
console.log(path.isAbsolute(path.resolve("uploads")));
// 출력: true

// join 과 resolve 의 차이
//   join    조각을 이어 붙이기만 합니다. 상대 경로면 상대 경로 그대로.
//   resolve 항상 절대 경로를 만들어 줍니다. (기준은 터미널 위치)
//
// 파일을 실제로 읽고 쓸 때는 절대 경로가 안전합니다.
// 그래서 path.join(__dirname, ...) 형태를 씁니다. __dirname 이 절대 경로라서요.

console.log(path.isAbsolute(path.join(__dirname, "uploads")));
// 출력: true

// ✏️ 직접 해보기 5 — path.join(__dirname, "data", "설정.json") 을 출력해 보세요.
console.log(path.join(__dirname, "data", "설정.json"));

// ── 섹션 6: 자주 하는 실수 ──

// ★ 아래에서 SyntaxError 라고 적힌 것은 눈으로만 보세요. 주석을 풀지 마세요.

// [실수 1] 경로를 직접 이어 붙임
//   const p = "uploads" + "/" + name;
//   실수: 윈도우에서는 되는데 리눅스 서버에 올리면 깨질 수 있습니다.
//         슬래시가 두 번 들어가거나 빠지는 일도 흔합니다.
//         무조건 path.join 을 쓰세요.

// [실수 2] 확장자 비교에서 점을 빼먹음
console.log(path.extname("a.pdf") === "pdf");
// 출력: false
// 실수: extname 은 ".pdf" 를 돌려줍니다. 점을 포함해서 비교해야 합니다.

// [실수 3] 대소문자를 그대로 비교
console.log(path.extname("보고서.PDF") === ".pdf");
// 출력: false
// 실수: 사용자가 대문자로 올릴 수 있습니다.
//       toLowerCase() 로 낮춰서 비교하세요.
console.log(path.extname("보고서.PDF").toLowerCase() === ".pdf");
// 출력: true

// [실수 4] __dirname 대신 상대 경로를 씀
//   fs.readFileSync("data.json")
//   실수: 터미널 위치가 바뀌면 파일을 못 찾습니다.
//         "내 컴퓨터에선 되는데 서버에선 안 돼요" 의 단골 원인입니다.
//         path.join(__dirname, "data.json") 으로 쓰세요.

// [실수 5] 사용자가 준 파일명을 그대로 경로에 붙임
//   path.join("uploads", 사용자입력)
//   실수: 사용자가 "../../비밀.txt" 같은 걸 보내면
//         엉뚱한 폴더의 파일을 건드릴 수 있습니다. (경로 탈출 공격)
//         09단원에서 안전하게 처리하는 법을 배웁니다.
//         지금은 "사용자 입력을 그대로 경로에 쓰면 위험하다" 만 기억하세요.

// ── 정리 ──

// 1. 경로는 직접 이어 붙이지 말고 path.join 을 쓴다. 운영체제 차이를 없애 준다.
// 2. basename(파일명) / extname(확장자, 점 포함) / dirname(폴더) 으로 조각을 꺼낸다.
// 3. extname 은 ".pdf" 다. 점을 빼먹지 말고, 대소문자는 낮춰서 비교한다.
// 4. __dirname 은 '이 파일이 있는 폴더'. 어디서 실행하든 안 바뀐다.
// 5. process.cwd() 는 '터미널이 있는 폴더'. 실행 위치에 따라 바뀐다.
// 6. 파일을 실제로 다룰 때는 path.join(__dirname, ...) 형태를 쓴다.
// 7. 사용자가 준 파일명을 검사 없이 경로에 붙이면 위험하다.

// ============================================================
// 직접 해보기 정답
// ============================================================
//
// 1) console.log(path.join("public", "images", "logo.png"));
//    // 출력: public\images\logo.png
//
// 2) console.log(path.extname("회의록_2026.docx"));
//    // 출력: .docx
//    console.log(path.basename("회의록_2026.docx", ".docx"));
//    // 출력: 회의록_2026
//    → 밑줄과 숫자는 확장자와 상관없습니다. 마지막 점 뒤만 확장자입니다.
//
// 3) const name = "검사성적서.xlsx";
//    const e = path.extname(name);
//    const b = path.basename(name, e);
//    console.log(path.join("uploads", `${b}_백업${e}`));
//    // 출력: uploads\검사성적서_백업.xlsx
//
// 4) console.log(__dirname);
//    console.log(process.cwd());
//    → 같은 폴더에서 실행하면 둘이 같습니다.
//      한 단계 위로 나가서 node 02_파일_다루기/개념01_....js 로 실행하면
//      __dirname 은 그대로 02_파일_다루기 를 가리키고,
//      process.cwd() 는 위 폴더로 바뀝니다.
//      이 차이 때문에 상대 경로를 쓰면 파일을 못 찾게 됩니다.
//
// 5) console.log(path.join(__dirname, "data", "설정.json"));
//    // 출력: (컴퓨터마다 다름) C:\Users\...\02_파일_다루기\data\설정.json
//    → 앞부분은 컴퓨터마다 다르지만 뒤쪽 \data\설정.json 은 같습니다.
