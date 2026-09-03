// ============================================================
// 08단원 연습문제 — S3 와 파일 저장
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~11은 코드로 푸는 문제, 12~15는 [손으로] 답을 적는 문제입니다.
//
// ★ 인터넷 없이 풀 수 있습니다. 진짜 SDK 를 쓰되 네트워크는 안 씁니다.

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const crypto = require("node:crypto");
const path = require("node:path");

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    // 검증무시: 진짜 키가 아니라 자리표시입니다 (가짜 S3 를 부르는 데만 씁니다)
    accessKeyId: "AKIAEXAMPLE0000000000",
    secretAccessKey: "examplesecretkey0000000000000000000000000",
  },
});

const 버킷 = "my-bucket";


// ───── 문제 1 ───── (개념01)
// 저장 요금을 계산하세요. GB 당 월 0.025 달러, 환율 1400원, 반올림.
//
// 기대 출력:
// 5GB → 175원
// 100GB → 3,500원
// 1024GB → 35,840원

function 저장요금(GB) {
  // TODO: 숫자를 돌려주세요
}

// for (const GB of [5, 100, 1024]) {
//   console.log(`${GB}GB → ${저장요금(GB).toLocaleString("ko-KR")}원`);
// }


// ───── 문제 2 ───── (개념01)
// DB 에 무엇을 저장해야 하는지 판정하세요.
//
// 기대 출력:
// 파일 내용 → ✗
// https://버킷.s3.../a.png → ✗
// uploads/2026/08/a.png → ○
// 원래 파일 이름 → ○

function DB에저장하나(무엇) {
  // TODO: "○" 또는 "✗" 를 돌려주세요
}

// for (const 무엇 of ["파일 내용", "https://버킷.s3.../a.png", "uploads/2026/08/a.png", "원래 파일 이름"]) {
//   console.log(`${무엇} → ${DB에저장하나(무엇)}`);
// }


// ───── 문제 3 ───── (개념02)
// IAM 정책이 어떤 동작을 허용하는지 판정하세요.
// Resource 의 * 를 아무 글자로 취급합니다.
//
// 기대 출력:
// s3:PutObject → 내버킷/uploads/a.png : 허용
// s3:DeleteObject → 내버킷/backups/db.sql : 거부
// s3:PutObject → 남의버킷/uploads/a.png : 거부
// s3:DeleteBucket → 내버킷 : 거부

const 정책 = {
  Statement: [
    {
      Effect: "Allow",
      Action: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      Resource: "내버킷/uploads/*",
    },
  ],
};

function 허용되나(정책, 동작, 자원) {
  // TODO: true / false 를 돌려주세요
}

// for (const [동작, 자원] of [["s3:PutObject","내버킷/uploads/a.png"],
//   ["s3:DeleteObject","내버킷/backups/db.sql"],
//   ["s3:PutObject","남의버킷/uploads/a.png"],
//   ["s3:DeleteBucket","내버킷"]]) {
//   console.log(`${동작} → ${자원} : ${허용되나(정책, 동작, 자원) ? "허용" : "거부"}`);
// }


// ───── 문제 4 ───── (개념02)
// 설정 객체에서 비밀 값을 가려 주는 함수를 만드세요.
//   KEY, SECRET, PASSWORD, TOKEN 이 이름에 들어가면 가립니다
//   앞 4글자 + *** + (길이자)
//
// 기대 출력:
// {"AWS_REGION":"ap-northeast-2","AWS_SECRET_ACCESS_KEY":"exam***(12자)","DB_PASSWORD":"pass***(8자)","S3_BUCKET":"my-bucket"}

function 가려서보기(설정) {
  // TODO: 새 객체를 돌려주세요
}

const 시험설정 = {
  AWS_REGION: "ap-northeast-2",
  AWS_SECRET_ACCESS_KEY: "examplekey00",
  DB_PASSWORD: "password",
  S3_BUCKET: "my-bucket",
};

// console.log(JSON.stringify(가려서보기(시험설정)));


// ───── 문제 5 ───── (개념03)
// 안전한 키를 짓는 함수를 만드세요.
//   uploads/연/월/임의16자.확장자
//   허용 확장자: .png .jpg .jpeg .gif .webp .pdf
//   그 밖은 확장자를 아예 빼세요
//
// 기대 출력:
// 사진.PNG → uploads/2026/08/ 로 시작, 확장자 .png
// ../../etc/passwd → uploads/ 로 시작, 확장자 없음
// 문서.exe → 확장자 없음
// 이름에 공백이 남나: false

function 키만들기(원래이름, 날짜 = new Date("2026-08-18T10:00:00Z")) {
  // TODO: 여기에 코드를 쓰세요
}

// const k1 = 키만들기("사진.PNG");
// console.log(`사진.PNG → ${k1.startsWith("uploads/2026/08/") ? "uploads/2026/08/ 로 시작" : "틀림"}, 확장자 ${path.extname(k1)}`);
// const k2 = 키만들기("../../etc/passwd");
// console.log(`../../etc/passwd → ${k2.startsWith("uploads/") ? "uploads/ 로 시작" : "틀림"}, 확장자 ${path.extname(k2) || "없음"}`);
// console.log(`문서.exe → 확장자 ${path.extname(키만들기("문서.exe")) || "없음"}`);
// console.log("이름에 공백이 남나:", 키만들기("내 사진 (1).png").includes(" "));


// ───── 문제 6 ───── (개념03)
// 한글 파일 이름을 메타데이터에 안전하게 넣는 함수를 만드세요.
// HTTP 헤더는 ASCII 만 받습니다.
//
// 기대 출력:
// 인코딩 결과가 ASCII 인가: true
// 되돌리면 같은가: true

function 메타데이터용(이름) {
  // TODO
}

// const 인코딩 = 메타데이터용("설비 사진.png");
// console.log("인코딩 결과가 ASCII 인가:", /^[\x00-\x7F]*$/.test(인코딩));
// console.log("되돌리면 같은가:", decodeURIComponent(인코딩) === "설비 사진.png");


// ───── 문제 7 ───── (개념03)
// Content-Disposition 헤더를 만드세요.
// filename 은 ASCII 로, filename* 는 UTF-8 로 둘 다 넣습니다.
//
// 기대 출력:
// 전체가 ASCII 인가: true
// filename* 가 있나: true
// attachment 로 시작하나: true

function 내려받기헤더(원래이름) {
  // TODO
}

// const h = 내려받기헤더("설비 사진.png");
// console.log("전체가 ASCII 인가:", /^[\x00-\x7F]*$/.test(h));
// console.log("filename* 가 있나:", h.includes("filename*=UTF-8''"));
// console.log("attachment 로 시작하나:", h.startsWith("attachment"));


// ───── 문제 8 ───── (개념04)
// 미리 서명된 URL 을 만들고 확인하세요.
//
// 기대 출력:
// 서명이 붙었나: true
// 만료: 300
// 비밀 키가 주소에 들어 있나: false
// 알고리즘: AWS4-HMAC-SHA256

async function 문제8() {
  // TODO: GetObjectCommand 로 300초짜리 주소를 만들고 위 네 가지를 확인하세요
}


// ───── 문제 9 ───── (개념04)
// 올리기용 주소를 만들 때 서명에 무엇을 넣어야 하는지 판정하세요.
//
// 기대 출력:
// Key → 필요 (다른 경로로 못 올리게)
// ContentType → 필요 (다른 종류를 못 올리게)
// ContentLength → 필요 (더 큰 파일을 못 올리게)
// 사용자이름 → 불필요

function 서명에넣나(항목) {
  // TODO: "필요 (이유)" 또는 "불필요" 를 돌려주세요
}

// for (const 항목 of ["Key", "ContentType", "ContentLength", "사용자이름"]) {
//   console.log(`${항목} → ${서명에넣나(항목)}`);
// }


// ───── 문제 10 ───── (개념05)
// 가짜 S3 를 만드세요. 진짜의 까다로운 부분 두 가지를 흉내 내야 합니다.
//   ① DeleteObject 는 없는 것을 지워도 성공
//   ② ListObjectsV2 는 하나도 없으면 Contents 가 undefined
//
// 기대 출력:
// 없는 것 지우기가 성공하나: true
// 빈 목록의 Contents: undefined
// 넣은 뒤 Contents 길이: 1

function 가짜S3만들기() {
  // TODO: { send(명령) } 을 돌려주세요
  //       PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command 를 다루세요
}

async function 문제10() {
  // TODO: 위 세 가지를 확인하세요
}


// ───── 문제 11 ───── (개념05)
// S3 판 파일 저장소를 만들고 저장소검사를 통과시키세요.
//
// 기대 출력:
// 통과: 9개, 실패: []
// 일부러 깨뜨린 판 → ["없는것지우면false"]

async function 저장소검사(저장소) {
  const 실패 = [];
  let 통과 = 0;
  const 확인 = (이름, 조건) => { if (조건) 통과 += 1; else 실패.push(이름); };

  확인("내보내는함수", ["경로", "있나", "저장", "지우기", "전부목록"]
    .every((이름) => typeof 저장소[이름] === "function"));
  확인("빈목록은빈배열", Array.isArray(await 저장소.전부목록()) && (await 저장소.전부목록()).length === 0);
  확인("없으면false", (await 저장소.있나("없는파일.png")) === false);

  await 저장소.저장("가.png", Buffer.from("가나다"), "image/png");
  확인("저장하면있음", (await 저장소.있나("가.png")) === true);

  await 저장소.저장("나.png", Buffer.from("라마바"), "image/png");
  const 목록 = await 저장소.전부목록();
  확인("목록에나옴", 목록.includes("가.png") && 목록.includes("나.png"));

  확인("지우면true", (await 저장소.지우기("가.png")) === true);
  확인("없는것지우면false", (await 저장소.지우기("없는파일.png")) === false);
  확인("지운뒤없음", (await 저장소.있나("가.png")) === false);
  확인("경로는글자", typeof (await 저장소.경로("나.png")) === "string");

  await 저장소.지우기("나.png");
  return { 통과, 실패 };
}

function S3저장소만들기(s3, 버킷, 접두 = "uploads/") {
  // TODO: 경로, 있나, 저장, 지우기, 전부목록 을 만드세요
}

async function 문제11() {
  // TODO: 제대로 만든 판과, 지우기를 항상 true 로 만든 판을 각각 검사하세요
}


// ============================================================
// 실행 (TODO 를 채우면서 주석을 하나씩 푸세요)
// ============================================================

async function 실행() {
  // await 문제8();
  // await 문제10();
  // await 문제11();
}

실행();


// ============================================================
// [손으로] 답을 적어 보는 문제
// ============================================================
//
// ── 문제 12 ── (개념01, 02)
//   "S3 버킷을 공개로 열어 두면 편한데 왜 안 되나요?" 라는 질문에
//   두 가지 이유를 들어 답하세요. 그리고 공개하지 않고 보여 주는 방법을 쓰세요.
//
// ── 문제 13 ── (개념03)
//   이미지를 S3 에 올리고 브라우저로 그 주소를 여니
//   화면에 안 뜨고 파일이 내려받아집니다. 무엇을 빠뜨렸나요?
//
// ── 문제 14 ── (개념04)
//   브라우저에서 미리 서명된 주소로 PUT 을 했는데
//   SignatureDoesNotMatch 가 납니다. 서명은 방금 받았고 만료도 안 됐습니다.
//   무엇을 확인해야 하나요?
//
// ── 문제 15 ── (개념04, 05)
//   브라우저가 S3 에 직접 올린 뒤 "다 올렸어요, 키는 이거예요" 라고 서버에 알립니다.
//   서버가 그 말을 그대로 믿으면 어떤 문제가 두 가지 생기나요?
//   각각 어떻게 막나요?


// ============================================================
// AWS 에서 해 볼 것
// ============================================================
//
// □ E1. 버킷을 만드세요. 서울 리전, 퍼블릭 액세스 차단은 켠 채로
// □ E2. IAM 사용자를 만들고 그 버킷의 uploads/* 만 허용하는 정책을 붙이세요
// □ E3. 액세스 키를 .env 에 넣고 .gitignore 를 확인하세요
// □ E4. 파일을 하나 올리고 목록으로 확인하세요
// □ E5. ContentType 없이 이미지를 올리고 브라우저로 열어 보세요 (내려받아집니다)
// □ E6. 미리 서명된 주소를 만들어 브라우저에 붙여 넣으세요
// □ E7. expiresIn 을 10 으로 주고 15초 뒤에 열어 보세요 (만료 확인)
// □ E8. 서명 한 글자를 바꾸고 열어 보세요 (SignatureDoesNotMatch)
// □ E9. IAM 정책의 Resource 에서 /* 를 빼고 올려 보세요 (AccessDenied)
// □ E10. ★ 실습이 끝나면 올린 파일을 전부 지우세요
//         aws s3 rm s3://내버킷/uploads/ --recursive
