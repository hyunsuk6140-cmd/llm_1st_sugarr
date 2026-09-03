// ============================================================
// 개념 03 — 올리고 내려받기
// ============================================================
//
// 이제 코드로 S3 를 다룹니다.
//
// ★ 실제로 올리려면 버킷과 키가 있어야 합니다.
//   이 파일은 **요청이 어떻게 만들어지는지**를 네트워크 없이 확인합니다.
//   진짜로 올리는 것은 맨 아래 "직접 해 볼 것" 에 있습니다.
//
// 실행: node 개념03_올리고_내려받기.js
// ============================================================

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const crypto = require("node:crypto");
const path = require("node:path");

// ============================================================
// 1. 클라이언트 만들기
// ============================================================
//
// 실제로는 01단원의 설정.js 에서 값을 읽습니다.
//
//   const s3 = new S3Client({
//     region: 설정.AWS_REGION,
//     credentials: {
//       accessKeyId: 설정.AWS_ACCESS_KEY_ID,
//       secretAccessKey: 설정.AWS_SECRET_ACCESS_KEY,
//     },
//   });
//
// ★★ EC2 라면 credentials 를 아예 적지 마세요. (개념02)
//   IAM 역할을 붙였으면 SDK 가 알아서 찾습니다.
//
//   const s3 = new S3Client({ region: 설정.AWS_REGION });
//
// ★ 여기서는 가짜 키를 씁니다. 요청을 만들어 보기만 할 것이라 괜찮습니다.

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    // 검증무시: 진짜 키가 아니라 자리표시입니다 (가짜 S3 를 부르는 데만 씁니다)
    accessKeyId: "AKIAEXAMPLE0000000000",
    secretAccessKey: "examplesecretkey0000000000000000000000000",
  },
});

const 버킷 = "my-bucket";

console.log("클라이언트를 만들었나:", s3 instanceof S3Client);
// 출력: 클라이언트를 만들었나: true

// ★ 최상단에서 await 를 쓰지 않았습니다.
//   require 를 쓰는 파일(CommonJS) 에서 최상단 await 를 쓰면
//   Node 가 이 파일을 ES 모듈로 다시 해석하려다 require 에서 터집니다.
//   실제로 이 파일을 쓰다가 밟았습니다. 섞어 쓰지 마세요.

// ============================================================
// 2. ★★ 키를 어떻게 지을까
// ============================================================
//
// 백엔드 09단원에서 배운 것과 같은 문제입니다.
// 사용자가 올린 이름을 그대로 쓰면 안 됩니다.

const 나쁜키 = [
  ["사진.png", "겹칩니다. 다른 사람이 덮어씁니다"],
  ["../../etc/passwd", "경로를 벗어나려는 시도"],
  ["a".repeat(2000), "키는 1024바이트까지입니다"],
  ["내 사진 (1).png", "공백·괄호가 URL 에서 지저분해집니다"],
];

for (const [키, 문제] of 나쁜키) {
  const 보일것 = 키.length > 30 ? 키.slice(0, 20) + "...(" + 키.length + "자)" : 키;
  console.log(`✗ ${보일것} — ${문제}`);
}
// 출력: ✗ 사진.png — 겹칩니다. 다른 사람이 덮어씁니다
// 출력: ✗ ../../etc/passwd — 경로를 벗어나려는 시도
// 출력: ✗ aaaaaaaaaaaaaaaaaaaa...(2000자) — 키는 1024바이트까지입니다
// 출력: ✗ 내 사진 (1).png — 공백·괄호가 URL 에서 지저분해집니다

// ★ 그래서 키는 서버가 짓습니다.

function 키만들기(원래이름, 날짜 = new Date("2026-08-18T10:00:00Z")) {
  // 확장자만 원래 것에서 가져옵니다 (소문자로)
  const 확장자 = path.extname(원래이름).toLowerCase();

  // 허용하는 확장자만 (백엔드 09단원의 그 검사)
  const 허용 = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf"];
  const 쓸확장자 = 허용.includes(확장자) ? 확장자 : "";

  const 연 = 날짜.getUTCFullYear();
  const 월 = String(날짜.getUTCMonth() + 1).padStart(2, "0");
  const 임의 = crypto.randomBytes(8).toString("hex");

  return `uploads/${연}/${월}/${임의}${쓸확장자}`;
}

const 만든키 = 키만들기("내 사진 (1).PNG");

console.log("uploads/ 로 시작하나:", 만든키.startsWith("uploads/2026/08/"));
// 출력: uploads/ 로 시작하나: true
console.log("확장자:", path.extname(만든키));
// 출력: 확장자: .png
console.log("공백이 있나:", 만든키.includes(" "));
// 출력: 공백이 있나: false

console.log("위험한 이름도 안전한가:", 키만들기("../../etc/passwd").startsWith("uploads/"));
// 출력: 위험한 이름도 안전한가: true

// ★★ 원래 이름은 **DB 에 따로 저장**합니다. (개념01)
//
//     { key: "uploads/2026/08/a1b2c3d4e5f6.png", 원래이름: "내 사진 (1).PNG" }
//
//   내려받을 때 원래 이름으로 보여 주면 됩니다. (아래 5번)
//
// ★ 날짜로 폴더를 나눈 이유
//   한 "폴더" 에 파일이 수십만 개면 목록 조회가 느려집니다.
//   그리고 "2026년 8월 것만 지우기" 같은 정리가 쉬워집니다.

// ============================================================
// 3. 올리기
// ============================================================

const 올리기명령 = new PutObjectCommand({
  Bucket: 버킷,
  Key: "uploads/2026/08/example.png",
  Body: Buffer.from("가짜 사진 내용"),
  ContentType: "image/png",
  CacheControl: "max-age=31536000",   // ★ 1년입니다. 아래 설명을 꼭 보세요
  Metadata: { "original-name": encodeURIComponent("설비 사진.png") },
});

console.log("명령 이름:", 올리기명령.constructor.name);
// 출력: 명령 이름: PutObjectCommand
console.log("ContentType:", 올리기명령.input.ContentType);
// 출력: ContentType: image/png
console.log("본문 바이트:", 올리기명령.input.Body.length);
// 출력: 본문 바이트: 20

// ★★★ CacheControl: "max-age=31536000" 은 **1년**입니다. (60*60*24*365)
//
//   브라우저와 CDN 이 1년 동안 다시 안 물어봅니다. 그만큼 빠르고 요금도 아낍니다.
//   그런데 1년은 **되돌릴 수 없습니다.**
//   잘못 올린 파일을 고쳐서 덮어써도, 이미 받아 간 브라우저는 1년 내내 옛것을 봅니다.
//   "고쳤는데 왜 안 바뀌죠" 의 가장 지독한 형태입니다.
//
// ★★ 그래서 이 값은 **키가 안 바뀌는 것을 전제**로 씁니다.
//
//   위 2번처럼 키에 임의 문자(a1b2c3d4e5f6) 를 넣으면
//   내용이 바뀔 때 키도 같이 바뀝니다. 새 키는 새 주소라 캐시가 문제가 안 됩니다.
//   그래서 여기서는 1년을 걸어도 안전합니다.
//
//   ★ 반대로 **같은 키에 덮어쓸 수 있는 파일이라면 이 줄을 빼세요.**
//     uploads/사용자12/프로필.png 처럼 고정 키에 프로필 사진을 덮어쓰는 식이면
//     사진을 바꿔도 1년 동안 옛 사진이 보입니다.
//     굳이 걸려면 max-age=300 처럼 짧게 두세요.

// 실제로 보내려면 이렇게 합니다.
//
//   await s3.send(올리기명령);

// ★★★ ContentType 을 꼭 주세요.
//
//   안 주면 application/octet-stream 이 됩니다.
//   그러면 브라우저가 이미지를 화면에 안 띄우고 **내려받기**를 합니다.
//   "사진이 안 보이고 다운로드돼요" 의 원인이 이것입니다.
//
//   multer 를 쓴다면 file.mimetype 이 있습니다. 그걸 넣으세요.
//   ★ 다만 mimetype 은 클라이언트가 보낸 값이라 믿을 수 없습니다.
//     확장자와 대조하거나, 파일 앞부분을 읽어 진짜 종류를 확인하세요.
//
// ★★ Metadata 에 한글을 그대로 넣으면 안 됩니다.
//
//   메타데이터는 HTTP 헤더로 갑니다. 헤더는 ASCII 만 받습니다.
//   백엔드 05단원에서 만난 그 ByteString 문제입니다.
//   encodeURIComponent 로 감싸고, 읽을 때 decodeURIComponent 하세요.

const 원래이름 = "설비 사진.png";
const 인코딩됨 = encodeURIComponent(원래이름);

console.log("인코딩:", 인코딩됨);
// 출력: 인코딩: %EC%84%A4%EB%B9%84%20%EC%82%AC%EC%A7%84.png
console.log("ASCII 인가:", /^[\x00-\x7F]*$/.test(인코딩됨));
// 출력: ASCII 인가: true
console.log("되돌리면:", decodeURIComponent(인코딩됨));
// 출력: 되돌리면: 설비 사진.png

// ============================================================
// 4. 내려받기
// ============================================================
//
//   const 응답 = await s3.send(new GetObjectCommand({ Bucket, Key }));
//   const 글자 = await 응답.Body.transformToString();
//   const 바이트 = await 응답.Body.transformToByteArray();
//
// ★★ 응답.Body 는 **스트림** 입니다. 통째로 메모리에 올라오지 않습니다.
//
//   큰 파일을 다룰 때 중요합니다.
//   100MB 파일을 통째로 읽으면 t3.micro 의 1GB 메모리가 위험합니다.
//
//   Express 로 흘려보낼 때는 이렇게 합니다.
//
//     const 응답 = await s3.send(new GetObjectCommand({ Bucket, Key }));
//     res.setHeader("Content-Type", 응답.ContentType);
//     응답.Body.pipe(res);
//
//   pipe 는 조금씩 읽어서 조금씩 보냅니다. 메모리를 안 씁니다.
//
// ★★★ 그런데 이 방식(서버가 받아서 전달) 은 권할 때가 정해져 있습니다.
//
//   ○ 권한 확인이 꼭 필요한 파일 (내 것만 볼 수 있는)
//   ✗ 그냥 이미지 보여 주기 → 미리 서명된 URL 이 낫습니다 (개념04)
//
//   서버를 거치면 그만큼 서버가 일합니다. 07단원 개념03 의 이야기와 같습니다.

// ============================================================
// 5. 원래 이름으로 내려받게 하기
// ============================================================
//
// 키는 a1b2c3d4.png 인데 사용자에게는 "설비 사진.png" 로 저장되게 하고 싶습니다.
// Content-Disposition 헤더를 씁니다. 백엔드 09단원에서 한 그대로입니다.

function 내려받기헤더(원래이름) {
  const ascii안전 = 원래이름.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii안전}"; filename*=UTF-8''${encodeURIComponent(원래이름)}`;
}

const 헤더 = 내려받기헤더("설비 사진.png");

console.log(헤더);
// 출력: attachment; filename="__ __.png"; filename*=UTF-8''%EC%84%A4%EB%B9%84%20%EC%82%AC%EC%A7%84.png
console.log("전체가 ASCII 인가:", /^[\x00-\x7F]*$/.test(헤더));
// 출력: 전체가 ASCII 인가: true

// ★★ filename 과 filename* 를 둘 다 적습니다.
//
//   filename    옛 브라우저용. ASCII 만 됩니다 → 한글이 _ 로 바뀝니다
//   filename*   요즘 브라우저용. UTF-8 을 퍼센트 인코딩해서 넣습니다
//
//   요즘 브라우저는 filename* 를 보고 "설비 사진.png" 로 저장합니다.
//
// ★ S3 에 올릴 때 미리 지정할 수도 있습니다.
//     new PutObjectCommand({ ..., ContentDisposition: 내려받기헤더(원래이름) })
//   그러면 미리 서명된 URL 로 받아도 그 이름으로 저장됩니다. (개념04)

// ============================================================
// 6. 목록·정보·삭제
// ============================================================

const 목록명령 = new ListObjectsV2Command({
  Bucket: 버킷,
  Prefix: "uploads/2026/08/",
  MaxKeys: 100,
});

console.log("Prefix:", 목록명령.input.Prefix);
// 출력: Prefix: uploads/2026/08/
console.log("한 번에 최대:", 목록명령.input.MaxKeys);
// 출력: 한 번에 최대: 100

// ★★ 목록은 한 번에 최대 1000개까지 옵니다. 더 있으면 나눠 받아야 합니다.
//
//   let 이어받기 = undefined;
//   do {
//     const 결과 = await s3.send(new ListObjectsV2Command({
//       Bucket, Prefix, ContinuationToken: 이어받기,
//     }));
//     (결과.Contents ?? []).forEach((것) => console.log(것.Key, 것.Size));
//     이어받기 = 결과.NextContinuationToken;
//   } while (이어받기);
//
// ★ 결과.Contents 가 **없을 수 있습니다.** 하나도 없으면 undefined 입니다.
//   ?? [] 를 빼먹으면 "Cannot read properties of undefined" 가 납니다.
//   05단원의 maybeSingle 과 같은 종류의 실수입니다.

const 정보명령 = new HeadObjectCommand({ Bucket: 버킷, Key: "uploads/a.png" });
console.log("정보 명령:", 정보명령.constructor.name);
// 출력: 정보 명령: HeadObjectCommand

// ★ HeadObject 는 파일 내용을 안 받고 정보만 받습니다.
//   크기·수정 시각·ContentType 을 알 수 있습니다.
//   "이 파일이 있나" 를 확인할 때 씁니다. 전송 요금이 거의 안 듭니다.
//
// ★★ 없으면 오류가 납니다. try/catch 로 감싸세요.
//
//     try {
//       await s3.send(new HeadObjectCommand({ Bucket, Key }));
//       return true;
//     } catch (에러) {
//       if (에러.name === "NotFound") return false;
//       throw 에러;   // ← 다른 오류는 그대로 던지세요
//     }
//
//   권한이 없어도 NotFound 처럼 보일 수 있습니다. 그것까지 삼키면 안 됩니다.

const 삭제명령 = new DeleteObjectCommand({ Bucket: 버킷, Key: "uploads/a.png" });
console.log("삭제 명령:", 삭제명령.constructor.name);
// 출력: 삭제 명령: DeleteObjectCommand

// ★★★ S3 의 삭제는 **없는 것을 지워도 성공** 입니다.
//
//   02단원의 changes === 0 이나 05단원의 빈 배열과 다릅니다.
//   "지웠는지" 를 알 수 없습니다.
//
//   그래서 404 를 내려면 지우기 전에 DB 에서 확인해야 합니다.
//   어차피 DB 에 키를 저장해 뒀으니(개념01) 거기서 판단하면 됩니다.

const 여러개삭제 = new DeleteObjectsCommand({
  Bucket: 버킷,
  Delete: { Objects: [{ Key: "uploads/a.png" }, { Key: "uploads/b.png" }] },
});

console.log("한 번에 지울 개수:", 여러개삭제.input.Delete.Objects.length);
// 출력: 한 번에 지울 개수: 2

// ★ 한 번에 1000개까지 지울 수 있습니다. 요청 수를 아낍니다.
//   반복문에서 하나씩 지우면 요청 수가 그만큼 늘고 프리티어를 잡아먹습니다.

// ============================================================
// 7. 오류 다루기
// ============================================================

const 오류들 = [
  ["NoSuchBucket", "버킷 이름이 틀렸거나 다른 리전입니다"],
  ["NoSuchKey", "그 키의 파일이 없습니다"],
  ["AccessDenied", "★ IAM 정책을 확인하세요 (개념02)"],
  ["InvalidAccessKeyId", "키 ID 가 틀렸습니다"],
  ["SignatureDoesNotMatch", "비밀 키가 틀렸습니다. 공백이 섞였을 수 있습니다"],
  ["PermanentRedirect", "★ 리전이 다릅니다"],
  ["EntityTooLarge", "한 번에 5GB 를 넘겼습니다. 멀티파트를 쓰세요"],
];

for (const [이름, 뜻] of 오류들) {
  console.log(`${이름} → ${뜻}`);
}
// 출력: NoSuchBucket → 버킷 이름이 틀렸거나 다른 리전입니다
// 출력: NoSuchKey → 그 키의 파일이 없습니다
// 출력: AccessDenied → ★ IAM 정책을 확인하세요 (개념02)
// 출력: InvalidAccessKeyId → 키 ID 가 틀렸습니다
// 출력: SignatureDoesNotMatch → 비밀 키가 틀렸습니다. 공백이 섞였을 수 있습니다
// 출력: PermanentRedirect → ★ 리전이 다릅니다
// 출력: EntityTooLarge → 한 번에 5GB 를 넘겼습니다. 멀티파트를 쓰세요

// ★★ SignatureDoesNotMatch 가 나면 비밀 키를 다시 보세요.
//   .env 에 복사할 때 앞뒤 공백이나 줄바꿈이 섞이는 일이 흔합니다.
//   따옴표로 감싸면 그 따옴표까지 값이 될 수도 있습니다.
//
// ★★ AccessDenied 는 거의 항상 IAM 정책 문제입니다.
//   개념02 에서 본 것처럼 Resource 에 /* 를 빠뜨렸거나,
//   ListBucket 을 버킷이 아니라 버킷/* 에 준 경우입니다.

// ============================================================
// 8. 직접 해 볼 것
// ============================================================
//
// ★ 진짜 버킷과 키가 있어야 합니다. 개념02 의 준비를 먼저 하세요.
//
//   // 올리기 (이 자료는 CommonJS 로 통일합니다 — 위 1번의 그 이야기입니다)
//   const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
//   const s3 = new S3Client({ region: 설정.AWS_REGION, credentials: {...} });
//
//   await s3.send(new PutObjectCommand({
//     Bucket: 설정.S3_BUCKET,
//     Key: "uploads/시험.txt",
//     Body: "안녕하세요",
//     ContentType: "text/plain; charset=utf-8",
//   }));
//
//   // 내려받기
//   const 응답 = await s3.send(new GetObjectCommand({
//     Bucket: 설정.S3_BUCKET, Key: "uploads/시험.txt",
//   }));
//   console.log(await 응답.Body.transformToString());
//
//   // 목록
//   const 목록 = await s3.send(new ListObjectsV2Command({
//     Bucket: 설정.S3_BUCKET, Prefix: "uploads/",
//   }));
//   (목록.Contents ?? []).forEach((것) => console.log(것.Key, 것.Size));
//
//   // 지우기
//   await s3.send(new DeleteObjectCommand({
//     Bucket: 설정.S3_BUCKET, Key: "uploads/시험.txt",
//   }));
//
// ── 확인해 볼 것 ──
//
//   ① ContentType 을 빼고 이미지를 올린 뒤 브라우저로 열어 보세요.
//      화면에 안 뜨고 내려받기가 될 것입니다.
//
//   ② IAM 정책의 Resource 에서 /* 를 빼고 올려 보세요. AccessDenied 가 납니다.
//
//   ③ 없는 키를 DeleteObject 로 지워 보세요. 오류가 안 납니다.
//
//   ④ 리전을 us-east-1 로 바꾸고 올려 보세요. PermanentRedirect 가 납니다.
//
//   ★ 실습이 끝나면 올린 파일을 지우세요. (06단원 개념01 의 정리 습관)

console.log("이 파일에서 확인한 것: 키 짓기, 헤더 만들기, 명령 모양");
// 출력: 이 파일에서 확인한 것: 키 짓기, 헤더 만들기, 명령 모양
console.log("실제 업로드는 버킷과 키가 있어야 합니다");
// 출력: 실제 업로드는 버킷과 키가 있어야 합니다

// ============================================================
// 정리
// ============================================================
//
//   키는 서버가 짓습니다. 사용자 이름을 그대로 쓰지 마세요.
//     uploads/연/월/임의문자.확장자
//     원래 이름은 DB 에 따로 저장
//
//   ContentType 을 꼭 주세요. 안 주면 이미지가 다운로드됩니다.
//   Metadata 에 한글을 넣으려면 encodeURIComponent (헤더는 ASCII 만)
//
//   Body 는 스트림입니다. pipe 로 흘려보내세요. 통째로 읽지 마세요.
//   원래 이름으로 저장되게 하려면 Content-Disposition 에 filename*
//
//   목록은 1000개씩 나눠 옵니다. Contents 가 undefined 일 수 있습니다.
//   삭제는 없는 것을 지워도 성공합니다. 404 는 DB 로 판단하세요.
//   여러 개는 DeleteObjects 로 한 번에 (요청 수 아끼기)
//
//   AccessDenied → IAM 정책 / PermanentRedirect → 리전
//   SignatureDoesNotMatch → 비밀 키에 공백이 섞였는지
//
// 다음(개념04) 에서 서버를 거치지 않고 브라우저가 직접 올립니다.
