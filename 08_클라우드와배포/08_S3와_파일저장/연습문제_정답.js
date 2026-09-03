// ============================================================
// 08단원 연습문제 정답 — S3 와 파일 저장
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

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


// ───── 문제 1 ─────
function 저장요금(GB) {
  return Math.round(GB * 0.025 * 1400);
}

for (const GB of [5, 100, 1024]) {
  console.log(`${GB}GB → ${저장요금(GB).toLocaleString("ko-KR")}원`);
}
// 출력: 5GB → 175원
// 출력: 100GB → 3,500원
// 출력: 1024GB → 35,840원

// ★ 저장 자체는 쌉니다. 1TB 를 한 달 두는 게 3만 5천 원쯤입니다.
//
// ★★ 문제가 되는 것은 **전송과 요청 수** 입니다.
//   버킷을 공개해 두고 누가 큰 파일을 반복해서 받으면
//   저장 요금의 몇십 배가 전송 요금으로 나옵니다.
//   그래서 개념02 에서 "공개하지 마세요" 라고 한 것입니다.


// ───── 문제 2 ─────
function DB에저장하나(무엇) {
  const 저장할것 = ["uploads/2026/08/a.png", "원래 파일 이름"];
  return 저장할것.includes(무엇) ? "○" : "✗";
}

for (const 무엇 of ["파일 내용", "https://버킷.s3.../a.png", "uploads/2026/08/a.png", "원래 파일 이름"]) {
  console.log(`${무엇} → ${DB에저장하나(무엇)}`);
}
// 출력: 파일 내용 → ✗
// 출력: https://버킷.s3.../a.png → ✗
// 출력: uploads/2026/08/a.png → ○
// 출력: 원래 파일 이름 → ○

// ★★ 왜 URL 을 저장하면 안 되나
//
//   ① 버킷이나 서비스를 옮기면 모든 기록을 고쳐야 합니다
//      S3 → Cloudflare R2 로 옮기면 주소가 전부 바뀝니다
//
//   ② 미리 서명된 URL 이면 만료됩니다 (개념04)
//      저장해 둔 주소가 며칠 뒤에는 죽은 주소가 됩니다
//
//   ③ 주소가 아주 깁니다. DB 칸을 낭비합니다
//
//   ★ 키만 저장하고, 주소는 그때그때 만드세요. 계산이라 빠릅니다.
//
// ★ 원래 이름을 따로 저장하는 이유
//   키는 겹치지 않게 임의로 짓습니다. 사용자에게 a1b2c3.png 를 보여 줄 수는 없습니다.
//   내려받을 때 원래 이름으로 저장되게 하려면 그 값이 필요합니다. (문제 7)


// ───── 문제 3 ─────
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
  return 정책.Statement.some((문장) => {
    if (문장.Effect !== "Allow") return false;
    if (!문장.Action.includes(동작)) return false;

    const 규칙 = new RegExp(
      "^" + 문장.Resource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*") + "$"
    );
    return 규칙.test(자원);
  });
}

for (const [동작, 자원] of [
  ["s3:PutObject", "내버킷/uploads/a.png"],
  ["s3:DeleteObject", "내버킷/backups/db.sql"],
  ["s3:PutObject", "남의버킷/uploads/a.png"],
  ["s3:DeleteBucket", "내버킷"],
]) {
  console.log(`${동작} → ${자원} : ${허용되나(정책, 동작, 자원) ? "허용" : "거부"}`);
}
// 출력: s3:PutObject → 내버킷/uploads/a.png : 허용
// 출력: s3:DeleteObject → 내버킷/backups/db.sql : 거부
// 출력: s3:PutObject → 남의버킷/uploads/a.png : 거부
// 출력: s3:DeleteBucket → 내버킷 : 거부

// ★★★ 두 번째를 보세요. **같은 버킷인데 거부**됩니다.
//
//   Resource 가 내버킷/uploads/* 라서 backups/ 는 범위 밖입니다.
//   경로로 나눠 두면 같은 버킷 안에서도 격리됩니다.
//
//   AmazonS3FullAccess 를 줬다면 백업까지 지울 수 있었습니다.
//   키가 새는 날 그 차이가 전부입니다.
//
// ★ 네 번째는 Action 목록에 없어서 거부됩니다.
//   IAM 은 기본이 거부입니다. Allow 를 적은 것만 됩니다.
//
// ★★ 정규식으로 * 를 흉내 냈습니다. 진짜 IAM 은 더 복잡합니다.
//   (Condition, Deny 우선, 여러 정책 합치기 등)
//   그래도 "무엇이 허용되나" 를 그려 보는 데는 충분합니다.


// ───── 문제 4 ─────
function 가려서보기(설정) {
  const 복사 = { ...설정 };

  for (const 키이름 of Object.keys(복사)) {
    if (/KEY|SECRET|PASSWORD|TOKEN/i.test(키이름)) {
      const 값 = String(복사[키이름]);
      복사[키이름] = 값.slice(0, 4) + "***" + `(${값.length}자)`;
    }
  }

  return 복사;
}

const 시험설정 = {
  AWS_REGION: "ap-northeast-2",
  AWS_SECRET_ACCESS_KEY: "examplekey00",
  DB_PASSWORD: "password",
  S3_BUCKET: "my-bucket",
};

console.log(JSON.stringify(가려서보기(시험설정)));
// 출력: {"AWS_REGION":"ap-northeast-2","AWS_SECRET_ACCESS_KEY":"exam***(12자)","DB_PASSWORD":"pass***(8자)","S3_BUCKET":"my-bucket"}

// ★★ 왜 필요한가
//   01단원에서 만든 설정.js 를 통째로 console.log 하면 키가 로그에 남습니다.
//   PM2 가 그 로그를 파일로 저장합니다. (07단원 개념01)
//   그 파일을 누가 보거나, 로그를 외부 서비스로 보내면 키가 새어 나갑니다.
//
// ★ 앞 4글자를 남긴 이유
//   "어느 키인지" 는 알아야 디버깅이 됩니다.
//   AKIA 로 시작하는지 정도만 봐도 도움이 됩니다.
//
// ★ 길이를 남긴 이유
//   값이 들어는 갔는지 확인할 수 있습니다.
//   (0자) 로 보이면 .env 를 못 읽은 것입니다.
//
// ★★ 정규식에 i 를 붙였습니다.
//   aws_secret_access_key 처럼 소문자로 적는 경우도 있습니다.


// ───── 문제 5 ─────
function 키만들기(원래이름, 날짜 = new Date("2026-08-18T10:00:00Z")) {
  const 확장자 = path.extname(원래이름).toLowerCase();
  const 허용 = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf"];
  const 쓸확장자 = 허용.includes(확장자) ? 확장자 : "";

  const 연 = 날짜.getUTCFullYear();
  const 월 = String(날짜.getUTCMonth() + 1).padStart(2, "0");
  const 임의 = crypto.randomBytes(8).toString("hex");

  return `uploads/${연}/${월}/${임의}${쓸확장자}`;
}

const k1 = 키만들기("사진.PNG");
console.log(`사진.PNG → ${k1.startsWith("uploads/2026/08/") ? "uploads/2026/08/ 로 시작" : "틀림"}, 확장자 ${path.extname(k1)}`);
// 출력: 사진.PNG → uploads/2026/08/ 로 시작, 확장자 .png

const k2 = 키만들기("../../etc/passwd");
console.log(`../../etc/passwd → ${k2.startsWith("uploads/") ? "uploads/ 로 시작" : "틀림"}, 확장자 ${path.extname(k2) || "없음"}`);
// 출력: ../../etc/passwd → uploads/ 로 시작, 확장자 없음

console.log(`문서.exe → 확장자 ${path.extname(키만들기("문서.exe")) || "없음"}`);
// 출력: 문서.exe → 확장자 없음

console.log("이름에 공백이 남나:", 키만들기("내 사진 (1).png").includes(" "));
// 출력: 이름에 공백이 남나: false

// ★★★ 핵심은 **원래 이름에서 확장자만 가져오는 것** 입니다.
//   이름 자체는 하나도 안 씁니다. 그래서 무슨 이름이 와도 안전합니다.
//
// ★ ../../etc/passwd 는 extname 이 빈 문자열입니다.
//   백엔드 09단원에서 재 봤던 것 — 점으로 시작하는 이름은 확장자가 없습니다.
//   그래서 확장자 없이 uploads/ 아래에 안전하게 들어갑니다.
//
// ★★ .exe 를 걸러 내는 게 중요합니다.
//   실행 파일을 올리게 두면 안 됩니다.
//   그런데 **확장자만으로는 부족합니다.** 내용이 실행 파일일 수 있습니다.
//   확장자 검사는 첫 번째 방어선일 뿐입니다.
//
// ★ 소문자로 낮춘 이유
//   .PNG 와 .png 는 같은 것으로 봐야 합니다.
//   S3 키는 대소문자를 가리니 통일해 두는 게 낫습니다.
//
// ★ randomBytes(8) 은 16글자 16진수입니다.
//   Date.now() 만 쓰면 같은 밀리초에 두 개가 올라올 때 겹칩니다.


// ───── 문제 6 ─────
function 메타데이터용(이름) {
  return encodeURIComponent(이름);
}

const 인코딩 = 메타데이터용("설비 사진.png");
console.log("인코딩 결과가 ASCII 인가:", /^[\x00-\x7F]*$/.test(인코딩));
// 출력: 인코딩 결과가 ASCII 인가: true
console.log("되돌리면 같은가:", decodeURIComponent(인코딩) === "설비 사진.png");
// 출력: 되돌리면 같은가: true

// ★★ S3 메타데이터는 HTTP 헤더(x-amz-meta-...) 로 갑니다.
//   헤더는 ASCII 만 받습니다.
//
//   백엔드 05단원에서 만난 그 오류입니다.
//     TypeError: Cannot convert argument to a ByteString
//
//   05단원의 Supabase 키에 한글을 넣었을 때도 같은 오류가 났습니다.
//   "헤더에는 한글을 못 넣는다" 는 이 수업에서 세 번 만나는 규칙입니다.
//
// ★ 읽을 때 decodeURIComponent 를 잊지 마세요.
//   안 하면 사용자가 %EC%84%A4... 를 보게 됩니다.


// ───── 문제 7 ─────
function 내려받기헤더(원래이름) {
  const ascii안전 = 원래이름.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii안전}"; filename*=UTF-8''${encodeURIComponent(원래이름)}`;
}

const h = 내려받기헤더("설비 사진.png");
console.log("전체가 ASCII 인가:", /^[\x00-\x7F]*$/.test(h));
// 출력: 전체가 ASCII 인가: true
console.log("filename* 가 있나:", h.includes("filename*=UTF-8''"));
// 출력: filename* 가 있나: true
console.log("attachment 로 시작하나:", h.startsWith("attachment"));
// 출력: attachment 로 시작하나: true

// ★★ 둘 다 넣는 이유
//   filename    옛 브라우저가 봅니다. ASCII 만 되니 한글이 _ 가 됩니다
//   filename*   요즘 브라우저가 봅니다. 한글이 제대로 나옵니다
//
//   요즘 브라우저는 filename* 를 우선합니다. 그래서 한글 이름으로 저장됩니다.
//
// ★ 따옴표를 지운 이유
//   원래 이름에 " 가 있으면 헤더가 깨집니다.
//     filename="내"사진".png"  ← 어디까지가 이름인지 모릅니다
//   헤더를 조립할 때는 항상 이런 걸 생각해야 합니다.
//
// ★★ attachment 대신 inline 을 쓰면 브라우저가 화면에 띄웁니다.
//   이미지를 보여 줄 때는 inline, 내려받게 할 때는 attachment 입니다.


// ───── 문제 8 ─────
async function 문제8() {
  const 주소 = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: 버킷, Key: "uploads/a.png" }),
    { expiresIn: 300 }
  );

  const u = new URL(주소);

  console.log("서명이 붙었나:", u.searchParams.has("X-Amz-Signature"));
  // 출력: 서명이 붙었나: true
  console.log("만료:", u.searchParams.get("X-Amz-Expires"));
  // 출력: 만료: 300
  console.log("비밀 키가 주소에 들어 있나:", 주소.includes("examplesecretkey"));
  // 출력: 비밀 키가 주소에 들어 있나: false
  console.log("알고리즘:", u.searchParams.get("X-Amz-Algorithm"));
  // 출력: 알고리즘: AWS4-HMAC-SHA256

  // ★★★ 세 번째가 이 문제의 핵심입니다.
  //
  //   비밀 키는 주소에 안 들어갑니다. 그 키로 **계산한 결과**만 들어갑니다.
  //   해시는 되돌릴 수 없으니, 서명을 봐도 비밀 키를 알 수 없습니다.
  //
  //   그래서 이 주소를 브라우저에 줘도 됩니다.
  //   반대로 비밀 키 자체를 브라우저에 주면 그 순간 끝입니다.
  //
  // ★ 이 주소를 만드는 데 네트워크를 안 썼습니다. 순수한 계산입니다.
  //   그래서 아주 빠릅니다. 목록 화면에서 50장의 주소를 만들어도 부담이 없습니다.
}


// ───── 문제 9 ─────
function 서명에넣나(항목) {
  const 표 = {
    Key: "필요 (다른 경로로 못 올리게)",
    ContentType: "필요 (다른 종류를 못 올리게)",
    ContentLength: "필요 (더 큰 파일을 못 올리게)",
  };

  return 표[항목] ?? "불필요";
}

function 문제9() {
  for (const 항목 of ["Key", "ContentType", "ContentLength", "사용자이름"]) {
    console.log(`${항목} → ${서명에넣나(항목)}`);
  }
  // 출력: Key → 필요 (다른 경로로 못 올리게)
  // 출력: ContentType → 필요 (다른 종류를 못 올리게)
  // 출력: ContentLength → 필요 (더 큰 파일을 못 올리게)
  // 출력: 사용자이름 → 불필요
}

// ★★★ ContentLength 를 빠뜨리는 실수가 흔합니다.
//
//   서버에서 "5MB 까지" 라고 검사했다고 안심하면 안 됩니다.
//   그 5MB 는 브라우저가 **신고한 값**입니다.
//   서명에 안 넣으면 실제로는 500MB 를 올릴 수 있습니다.
//
//   S3 는 서명에 적힌 것만 강제합니다. 서버의 if 문은 S3 가 모릅니다.
//
// ★ 사용자 이름은 서명에 넣을 필요가 없습니다.
//   S3 는 그런 걸 모릅니다. 권한은 **주소를 만들어 줄 때** 서버가 확인합니다.
//   한 번 만들어 준 주소는 누가 쓰든 통합니다. 그래서 만료를 짧게 잡습니다.


// ───── 문제 10 ─────
function 가짜S3만들기() {
  const 안에든것 = new Map();

  return {
    async send(명령) {
      const 이름 = 명령.constructor.name;
      const 입력 = 명령.input;

      if (이름 === "PutObjectCommand") {
        안에든것.set(입력.Key, { 내용: Buffer.from(입력.Body), 종류: 입력.ContentType });
        return { ETag: '"가짜"' };
      }

      if (이름 === "HeadObjectCommand") {
        const 것 = 안에든것.get(입력.Key);
        if (!것) {
          const 에러 = new Error("NotFound");
          에러.name = "NotFound";
          throw 에러;
        }
        return { ContentLength: 것.내용.length, ContentType: 것.종류 };
      }

      if (이름 === "DeleteObjectCommand") {
        // ★ 있든 없든 성공합니다
        안에든것.delete(입력.Key);
        return {};
      }

      if (이름 === "ListObjectsV2Command") {
        const 접두 = 입력.Prefix ?? "";
        const 키들 = [...안에든것.keys()].filter((키) => 키.startsWith(접두)).sort();

        // ★ 하나도 없으면 Contents 가 없습니다
        return 키들.length === 0
          ? { KeyCount: 0 }
          : { KeyCount: 키들.length, Contents: 키들.map((키) => ({ Key: 키 })) };
      }

      throw new Error(`모르는 명령: ${이름}`);
    },
  };
}

async function 문제10() {
  const 가짜 = 가짜S3만들기();

  await 가짜.send(new DeleteObjectCommand({ Bucket: 버킷, Key: "없는파일" }));
  console.log("없는 것 지우기가 성공하나:", true);
  // 출력: 없는 것 지우기가 성공하나: true

  const 빈목록 = await 가짜.send(new ListObjectsV2Command({ Bucket: 버킷, Prefix: "uploads/" }));
  console.log("빈 목록의 Contents:", 빈목록.Contents);
  // 출력: 빈 목록의 Contents: undefined

  await 가짜.send(new PutObjectCommand({ Bucket: 버킷, Key: "uploads/a.png", Body: Buffer.from("x") }));
  const 찬목록 = await 가짜.send(new ListObjectsV2Command({ Bucket: 버킷, Prefix: "uploads/" }));
  console.log("넣은 뒤 Contents 길이:", 찬목록.Contents.length);
  // 출력: 넣은 뒤 Contents 길이: 1

  // ★★★ 가짜를 만들 때 **진짜의 까다로운 부분**을 흉내 내야 합니다.
  //
  //   편하게 만들면 이렇게 됩니다.
  //     · 없는 것을 지우면 오류를 낸다     → 진짜와 다릅니다
  //     · 빈 목록도 Contents: [] 를 준다  → 진짜와 다릅니다
  //
  //   그러면 시험이 통과하는데 실제로는 터집니다.
  //   가짜가 진짜보다 친절하면 시험이 아무것도 못 잡습니다.
  //
  // ★ 05단원의 가짜Supabase 도 같은 원칙으로 만들었습니다.
  //   single() 이 0건일 때 406 을 내는 것까지 흉내 냈습니다.
}


// ───── 문제 11 ─────
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
  async function 있나(키) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: 버킷, Key: 접두 + 키 }));
      return true;
    } catch (에러) {
      if (에러.name === "NotFound") return false;
      throw 에러;
    }
  }

  return {
    경로: async (키) => `https://${버킷}.s3.example.com/${접두}${키}?서명=...`,

    있나,

    저장: async (키, 내용, 종류 = "application/octet-stream") => {
      await s3.send(new PutObjectCommand({ Bucket: 버킷, Key: 접두 + 키, Body: 내용, ContentType: 종류 }));
    },

    지우기: async (키) => {
      const 있었나 = await 있나(키);
      await s3.send(new DeleteObjectCommand({ Bucket: 버킷, Key: 접두 + 키 }));
      return 있었나;
    },

    전부목록: async () => {
      const 결과 = await s3.send(new ListObjectsV2Command({ Bucket: 버킷, Prefix: 접두 }));
      return (결과.Contents ?? []).map((것) => 것.Key.slice(접두.length)).sort();
    },
  };
}

async function 문제11() {
  const 제대로 = S3저장소만들기(가짜S3만들기(), 버킷);
  const 결과 = await 저장소검사(제대로);

  console.log(`통과: ${결과.통과}개, 실패: ${JSON.stringify(결과.실패)}`);
  // 출력: 통과: 9개, 실패: []

  const 가짜2 = 가짜S3만들기();
  const 깨뜨린것 = {
    ...S3저장소만들기(가짜2, 버킷),
    지우기: async (키) => {
      await 가짜2.send(new DeleteObjectCommand({ Bucket: 버킷, Key: "uploads/" + 키 }));
      return true;
    },
  };

  const 결과2 = await 저장소검사(깨뜨린것);
  console.log("일부러 깨뜨린 판 →", JSON.stringify(결과2.실패));
  // 출력: 일부러 깨뜨린 판 → ["없는것지우면false"]

  // ★★★ 이 실수는 **조용히 틀립니다.**
  //
  //   오류가 안 납니다. 로그에 아무것도 안 남습니다.
  //   없는 파일을 지워 달라고 해도 "지웠습니다" 라고 답합니다.
  //   404 를 내야 할 자리에서 204 가 나갑니다.
  //
  //   이런 종류가 제일 오래 살아남습니다. 아무도 눈치를 못 채니까요.
  //   시험이 없으면 못 잡습니다.
  //
  // ★★ 04단원 연습문제 15번의 "삭제false" 와 완전히 같은 항목입니다.
  //   저장 방식이 파일이든 SQLite 든 Supabase 든 S3 든,
  //   **같은 실수를 같은 시험이 잡습니다.**
  //   그래서 시험을 한 번 잘 만들어 두면 계속 씁니다.
}


// ============================================================
// 실행 — 연습문제.js 의 실행() 과 같은 모양입니다
// ============================================================
//
// ★ 문제마다 다음 문제를 부르는 식으로 이어 붙이지 않았습니다.
//   그렇게 하면 연습문제.js 의 실행() 을 그대로 풀었을 때
//   문제10·11 이 두 번 돕니다. 부르는 곳은 한 군데로 모읍니다.

async function 실행() {
  await 문제8();
  문제9();
  await 문제10();
  await 문제11();
}

실행();


// ============================================================
// [손으로] 문제 정답
// ============================================================
//
// ── 문제 12 ──
//
//   **이유 ①: 자료가 새어 나갑니다.**
//
//   공개 버킷은 주소만 알면 누구나 받습니다. 로그인 확인이 없습니다.
//   주소가 uploads/1.png 처럼 규칙적이면 순서대로 훑을 수도 있습니다.
//   그리고 공개 버킷을 찾아다니는 프로그램이 실제로 돌아다닙니다.
//   뉴스에 나오는 "고객 정보 유출" 의 상당수가 이것입니다.
//
//   **이유 ②: 요금이 나갑니다.**
//
//   누가 큰 파일을 반복해서 받으면 전송 요금이 그대로 청구됩니다.
//   내가 막을 방법이 없습니다. 주소를 아는 사람은 계속 받을 수 있습니다.
//   "S3 청구서 폭탄" 사례가 여럿 있습니다.
//
//   **공개하지 않고 보여 주는 방법: 미리 서명된 URL**
//
//   서버가 "이 파일을 10분간 볼 수 있는 주소" 를 만들어 줍니다.
//   그 주소로는 그 파일만, 그 시간 동안만 됩니다.
//   버킷은 계속 비공개입니다.
//
//   ★ 그리고 주소를 만들어 주기 **전에** 서버가 권한을 확인합니다.
//     그게 진짜 방어선입니다. 만든 뒤에는 못 막습니다.
//
//   ★★ 05단원의 RLS 와 같은 생각입니다.
//     공개해 놓고 화면에서 거르는 게 아니라, 애초에 닿지 못하게 만듭니다.
//
// ── 문제 13 ──
//
//   **ContentType 을 안 줬습니다.**
//
//   안 주면 S3 가 application/octet-stream 으로 저장합니다.
//   브라우저는 그걸 "무슨 파일인지 모르겠으니 내려받자" 로 해석합니다.
//
//   ★ 고치는 법
//     올릴 때 ContentType 을 주세요.
//
//       new PutObjectCommand({ ..., ContentType: "image/png" })
//
//     multer 를 쓴다면 file.mimetype 이 있습니다.
//
//   ★★ 이미 올린 파일은 어떻게 하나
//     복사하면서 메타데이터를 바꿉니다.
//
//       aws s3 cp s3://버킷/a.png s3://버킷/a.png \
//         --content-type image/png --metadata-directive REPLACE
//
//   ★ mimetype 을 그대로 믿지 마세요.
//     클라이언트가 보낸 값입니다. .exe 를 image/png 라고 신고할 수 있습니다.
//     확장자와 대조하거나, 파일 앞부분(매직 넘버) 을 읽어 확인하세요.
//
// ── 문제 14 ──
//
//   **서명할 때와 올릴 때의 값이 다릅니다.** 대개 Content-Type 입니다.
//
//   서명은 "이 버킷, 이 키, 이 Content-Type, 이 크기" 를 전부 포함해서
//   계산됩니다. 하나라도 다르면 서명이 안 맞습니다.
//
//   ★ 확인할 것
//
//     ① Content-Type 이 정확히 같은가
//        서명: "image/png"
//        보낼 때: "image/png"      ← 같아야 합니다
//        브라우저가 "image/png; charset=..." 을 붙이면 다릅니다
//
//        ★ 단, 이건 getSignedUrl 에 signableHeaders 로 content-type 을
//          잠갔을 때만 해당합니다. 안 잠갔으면 Content-Type 이 달라도
//          서명은 멀쩡히 통과합니다 — 그러면 원인은 ②나 ③입니다.
//
//     ② ContentLength 를 서명에 넣었다면 파일 크기가 같은가
//
//     ③ FormData 로 보내고 있지 않은가
//        ★ PUT 으로 **파일 자체**를 본문에 담아야 합니다
//        FormData 로 보내면 앞뒤에 경계 문자열이 붙어서 크기와 내용이 달라집니다
//        (백엔드 09단원의 multipart 업로드와 다른 방식입니다)
//
//     ④ 키에 한글이나 특수문자가 있는데 인코딩이 다르지 않은가
//
//   ★★ 만료가 아닌 것은 확인했다니 ①③ 부터 보세요. 대부분 그 둘입니다.
//
// ── 문제 15 ──
//
//   **문제 ①: 안 올리고 신고만 할 수 있습니다.**
//
//   DB 에는 키가 있는데 S3 에는 파일이 없습니다.
//   목록 화면에서 이미지가 전부 깨져 보입니다.
//
//   ★ 막는 법: 서버가 HeadObject 로 진짜 있는지 확인합니다.
//
//       try {
//         const 정보 = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
//         if (정보.ContentLength > 제한) { 지우고 400 }
//         await 저장소.기록(key, 정보.ContentLength);
//       } catch {
//         return res.status(400).json({ 오류: "올라온 파일이 없습니다" });
//       }
//
//     크기도 여기서 다시 확인할 수 있습니다. 진짜 크기니까요.
//
//   ★★ 그리고 **아무 키나 받으면 안 됩니다.**
//     내가 서명해 준 키인지 확인하세요.
//     안 그러면 남의 파일 키를 보내서 자기 것으로 등록할 수 있습니다.
//
//   **문제 ②: 올렸는데 신고를 안 한 파일이 쌓입니다.**
//
//   S3 에는 있는데 DB 에는 없습니다. 아무도 안 쓰는 파일이 요금만 먹습니다.
//   사용자가 업로드 중에 창을 닫으면 그렇게 됩니다.
//   백엔드 11단원의 "고아 파일" 과 같은 문제입니다.
//
//   ★ 막는 법 두 가지
//
//     ① S3 수명 주기 규칙
//        uploads/temp/ 아래에 먼저 올리고, 신고를 받으면 정식 경로로 옮깁니다.
//        temp/ 는 1일 뒤 자동 삭제되게 설정합니다.
//
//     ② 정기 작업으로 정리
//        DB 에 없는 키를 찾아 지웁니다. (03단원 개념02 의 LEFT JOIN 패턴)
//        ★ 클러스터로 돌리면 네 번 실행됩니다. (07단원 개념02)
//          NODE_APP_INSTANCE 확인을 넣거나 별도 프로세스로 빼세요.
//
//   ★★ ① 이 더 낫습니다. 사람이 안 챙겨도 알아서 정리됩니다.
//     "잊어버려도 되는 구조" 를 만드는 게 운영을 편하게 합니다.
