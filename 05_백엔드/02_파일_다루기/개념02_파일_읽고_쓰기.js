// ============================================================
// 02단원 · 개념 02 — 파일 읽고 쓰기 (fs)
// ------------------------------------------------------------
// 실행: node 개념02_파일_읽고_쓰기.js
// ============================================================
//
// 브라우저는 컴퓨터의 파일을 마음대로 못 읽습니다. 위험하니까요.
// 하지만 Node 는 읽고 쓰고 지울 수 있습니다. 서버니까요.
//
// 그 일을 하는 것이 fs 모듈입니다. (fs = file system, 파일 시스템)
// 설치할 필요 없습니다. Node 에 이미 들어 있습니다.
//
// 이 폴더에 샘플_문서.txt 를 미리 만들어 두었습니다. 열어 보고 오세요.

const fs = require("fs");
const path = require("path");

// 앞 단원에서 배운 대로 __dirname 을 기준으로 경로를 만듭니다.
// 이렇게 해야 어디서 실행하든 같은 파일을 가리킵니다.
const 샘플경로 = path.join(__dirname, "샘플_문서.txt");

// ── 섹션 1: 파일 읽기 ──

const text = fs.readFileSync(샘플경로, "utf-8");

console.log(typeof text);
// 출력: string

console.log(text.split("\n")[0]);
// 출력: 작업표준서
// 첫 줄만 꺼냈습니다. 파일 전체가 하나의 긴 문자열로 들어옵니다.

// 빈 줄을 빼고 몇 줄인지 세어 봅시다.
const lines = text.split("\n").filter((line) => line !== "");
console.log(lines.length);
// 출력: 4

console.log(lines[2]);
// 출력: 담당: 김민준

// 읽어 온 것은 그냥 문자열입니다.
// 지금까지 배운 split, filter, includes 를 전부 쓸 수 있습니다.
console.log(text.includes("김민준"));
// 출력: true

// ✏️ 직접 해보기 1 — 마지막 줄(작성일)만 꺼내어 출력해 보세요.
console.log(lines[3]);

// ── 섹션 2: "utf-8" 을 빼먹으면 ──

// 두 번째 인자를 안 주면 글자가 아니라 '바이트 덩어리' 가 나옵니다.
const raw = fs.readFileSync(샘플경로);

console.log(raw.constructor.name);
// 출력: Buffer
// Buffer 는 "컴퓨터가 저장한 그대로의 0과 1" 입니다. 사람이 못 읽습니다.

// 찍어 보면 <Buffer ec9e91 ...> 처럼 알 수 없는 숫자가 나옵니다.
// 글자로 보려면 인코딩을 알려 줘야 합니다.
console.log(raw.toString("utf-8").split("\n")[0]);
// 출력: 작업표준서

// ★ 규칙: 글자 파일을 읽을 때는 항상 "utf-8" 을 두 번째 인자로 주세요.
//
//   fs.readFileSync(경로, "utf-8")     ← 글자로 읽기 (거의 항상 이것)
//   fs.readFileSync(경로)              ← 바이트 그대로 (이미지·PDF 등)
//
// 나중에 파일 업로드에서 PDF 나 이미지를 다룰 때는 utf-8 없이 읽습니다.
// 글자가 아니라 그냥 데이터 덩어리니까요.

// ✏️ 직접 해보기 2 — utf-8 없이 읽은 것을 그대로 console.log 해 보세요.
//                    어떻게 생겼나요?

// ── 섹션 3: 파일 쓰기 ──

// 이 예제가 만드는 파일들은 매번 결과를 같게 하려고 먼저 지우고 시작합니다.
const 출력경로 = path.join(__dirname, "결과_보고서.txt");
const 로그경로 = path.join(__dirname, "결과_기록.txt");

[출력경로, 로그경로].forEach((p) => {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
});

// writeFileSync 로 새 파일을 만듭니다.
fs.writeFileSync(출력경로, "첫 번째 줄입니다\n", "utf-8");

console.log(fs.existsSync(출력경로));
// 출력: true
// 파일이 진짜 생겼습니다. 탐색기에서 이 폴더를 열어 확인해 보세요.

console.log(fs.readFileSync(출력경로, "utf-8"));
// 출력: 첫 번째 줄입니다
// 출력:
// (파일 끝에 \n 이 있어서 빈 줄이 하나 더 찍힙니다)

// ★ 아주 중요 — writeFileSync 는 '덮어씁니다'
fs.writeFileSync(출력경로, "두 번째로 쓴 내용\n", "utf-8");

console.log(fs.readFileSync(출력경로, "utf-8").trim());
// 출력: 두 번째로 쓴 내용
// 첫 번째 줄이 사라졌습니다. 파일을 통째로 새로 쓴 것입니다.
//
// 실수로 중요한 파일에 쓰면 원래 내용이 날아갑니다. 되돌릴 수 없습니다.

// 폴더가 없으면 에러가 납니다. 파일은 만들어 주지만 폴더는 안 만들어 줍니다.
// (폴더 만들기는 개념04에서 배웁니다)

// ✏️ 직접 해보기 3 — "메모.txt" 라는 파일에 자기 이름을 써 보세요.
//                    그다음 탐색기에서 열어 확인하세요.
fs.writeFileSync(path.join(__dirname, "메모.txt"), "정현숙", "utf-8");
// ── 섹션 4: 이어 쓰기 ──

// 덮어쓰지 않고 뒤에 붙이려면 appendFileSync 입니다.
fs.appendFileSync(로그경로, "1번 접속\n", "utf-8");
fs.appendFileSync(로그경로, "2번 접속\n", "utf-8");
fs.appendFileSync(로그경로, "3번 접속\n", "utf-8");
fs.appendFileSync(로그경로, "4번 접속\n", "utf-8");

const 기록 = fs.readFileSync(로그경로, "utf-8");
console.log(기록.trim().split("\n").length);
// 출력: 3

console.log(기록.trim().split("\n")[2]);
// 출력: 3번 접속

// 파일이 없으면 새로 만들어 주고, 있으면 뒤에 붙입니다.
//
//   writeFileSync   덮어쓰기   (설정 파일 저장 등)
//   appendFileSync  이어 쓰기  (접속 기록, 로그 등)
//
// 서버가 무슨 일을 했는지 기록을 남길 때 append 를 씁니다.

// ✏️ 직접 해보기 4 — 로그경로에 "4번 접속" 을 한 줄 더 붙이고,
//                    줄 수가 4가 되는지 확인해 보세요.

// ── 섹션 5: 없는 파일을 읽으면 ──

// 파일이 없으면 에러가 납니다. undefined 가 아닙니다.
console.log(fs.existsSync(path.join(__dirname, "없는파일.txt")));
// 출력: false

try {
  fs.readFileSync(path.join(__dirname, "없는파일.txt"), "utf-8");
} catch (error) {
  console.log(error.code);
  // 출력: ENOENT
  // ENOENT = Error NO ENTry. "그런 파일이나 폴더가 없다" 는 뜻입니다.
  // 파일을 다룰 때 가장 많이 보는 에러 코드입니다. 외워 두세요.
}

// 그래서 읽기 전에 두 가지 중 하나를 합니다.
//
//   ① existsSync 로 먼저 확인한다
//   ② try/catch 로 감싼다
//
// 서버에서는 ②를 더 많이 씁니다. 확인하고 읽는 사이에 파일이 지워질 수도 있으니까요.

function 안전하게읽기(파일경로) {
  try {
    return fs.readFileSync(파일경로, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null; // 파일이 없는 것은 에러라기보다 '없는 상태' 입니다
    }
    throw error; // 그 밖의 에러(권한 등)는 그대로 위로 넘깁니다
  }
}

console.log(안전하게읽기(path.join(__dirname, "없는파일.txt")));
// 출력: null
console.log(안전하게읽기(샘플경로).split("\n")[0]);
// 출력: 작업표준서

// ✏️ 직접 해보기 5 — 안전하게읽기 에 결과_기록.txt 경로를 넣어 보세요.
//                    null 이 나올까요, 내용이 나올까요?

// ── 섹션 6: 파일 지우기 ──

const 임시경로 = path.join(__dirname, "임시파일.txt");

fs.writeFileSync(임시경로, "곧 지워질 파일", "utf-8");
console.log(fs.existsSync(임시경로));
// 출력: true

fs.unlinkSync(임시경로);
console.log(fs.existsSync(임시경로));
// 출력: false

// unlink 라는 이름이 낯설죠. delete 가 아닙니다.
// 리눅스에서 파일을 지우는 명령 이름이 unlink 라서 그대로 따랐습니다.
//
// ★ 휴지통으로 안 갑니다. 바로 사라집니다. 되돌릴 수 없습니다.
//   경로를 잘못 쓰면 엉뚱한 파일이 사라집니다. 항상 확인하고 지우세요.

// ✏️ 직접 해보기 6 — 파일을 만들고, 있는지 확인하고, 지우고, 다시 확인하는
//                    네 줄을 직접 써 보세요.
fs.writeFileSync(path.join(__dirname, "연습.txt"), "테스트", "utf-8");
console.log(fs.existsSync(path.join(__dirname, "연습.txt")));
fs.unlinkSync(path.join(__dirname, "연습.txt"));
console.log(fs.existsSync(path.join(__dirname, "연습.txt")));
// ── 섹션 7: 자주 하는 실수 ──

// ★ 아래에서 SyntaxError 라고 적힌 것은 눈으로만 보세요. 주석을 풀지 마세요.

// [실수 1] "utf-8" 을 빼먹음
//   const t = fs.readFileSync(경로);
//   실수: 에러는 안 나지만 Buffer 가 나옵니다.
//         t.split(...) 을 하려다 TypeError 가 납니다.
//         "왜 글자가 이상하지?" 싶으면 이걸 의심하세요.

// [실수 2] 상대 경로를 씀
//   fs.readFileSync("샘플_문서.txt", "utf-8");
//   실수: 터미널 위치에 따라 ENOENT 가 납니다.
//         path.join(__dirname, ...) 으로 쓰세요. (개념01)

// [실수 3] writeFileSync 로 실수로 덮어씀
//   기존 파일에 쓰면 원래 내용이 통째로 사라집니다.
//   이어 쓰려던 거라면 appendFileSync 입니다.

// [실수 4] 없는 폴더에 쓰려 함
//   fs.writeFileSync(path.join(__dirname, "없는폴더", "a.txt"), "내용");
//   실수: ENOENT 가 납니다. 파일은 만들어 주지만 폴더는 안 만들어 줍니다.
//         폴더부터 만들어야 합니다. (개념04)

// [실수 5] Sync 를 안 붙임
//   const t = fs.readFile(경로, "utf-8");
//   실수: readFile(Sync 없음)은 비동기라서 결과를 바로 안 줍니다.
//         t 에는 undefined 가 들어갑니다. 개념03에서 자세히 봅니다.

// [실수 6] 지우기 전에 확인을 안 함
//   fs.unlinkSync(경로);
//   실수: 파일이 없으면 ENOENT 로 프로그램이 죽습니다.
//         existsSync 로 확인하거나 try/catch 로 감싸세요.

// ── 정리 ──

// 1. fs 는 Node 내장 모듈. 파일을 읽고 쓰고 지운다.
// 2. readFileSync(경로, "utf-8") — utf-8 을 빼면 Buffer 가 나온다.
// 3. writeFileSync 는 덮어쓰기, appendFileSync 는 이어 쓰기.
// 4. existsSync 로 있는지 확인한다. 없는 파일을 읽으면 ENOENT 에러.
// 5. ENOENT = 그런 파일이나 폴더가 없다. 가장 많이 보는 코드.
// 6. unlinkSync 로 지운다. 휴지통을 거치지 않는다.
// 7. 경로는 항상 path.join(__dirname, ...) 으로 만든다.
// 8. 폴더는 자동으로 안 만들어진다. 없으면 ENOENT.

// ============================================================
// 직접 해보기 정답
// ============================================================
//
// 1) const lines2 = text.split("\n").filter((line) => line !== "");
//    console.log(lines2[lines2.length - 1]);
//    // 출력: 작성일: 2026-03-05
//    → at(-1) 을 써도 됩니다. lines2.at(-1)
//
// 2) console.log(fs.readFileSync(샘플경로));
//    // 출력: <Buffer ec 9e 91 ec 97 85 ...>   처럼 나옵니다
//    → 16진수 숫자입니다. 한글 한 글자가 3바이트를 차지하는 것도 보입니다.
//      사람이 읽으라고 만든 게 아니라 컴퓨터가 저장한 그대로입니다.
//
// 3) fs.writeFileSync(path.join(__dirname, "메모.txt"), "김민준", "utf-8");
//    → 폴더에 메모.txt 가 생깁니다. 확인했으면 지워도 됩니다.
//
// 4) fs.appendFileSync(로그경로, "4번 접속\n", "utf-8");
//    const 기록2 = fs.readFileSync(로그경로, "utf-8");
//    console.log(기록2.trim().split("\n").length);
//    // 출력: 4
//
// 5) 내용이 나옵니다. 섹션 4에서 이미 만들었기 때문입니다.
//    console.log(안전하게읽기(로그경로).trim().split("\n")[0]);
//    // 출력: 1번 접속
//
// 6) const p = path.join(__dirname, "연습.txt");
//    fs.writeFileSync(p, "테스트", "utf-8");
//    console.log(fs.existsSync(p));   // 출력: true
//    fs.unlinkSync(p);
//    console.log(fs.existsSync(p));   // 출력: false
