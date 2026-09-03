// ============================================================
// 개념 04 — 미리 서명된 URL
// ============================================================
//
// 개념02 에서 "버킷을 공개하지 마세요" 라고 했습니다.
// 그럼 비공개 버킷의 파일을 브라우저에 어떻게 보여 줄까요?
//
// 서버가 **짧게 사는 주소**를 만들어 줍니다.
// 그 주소로는 그 파일만, 그 시간 동안만 됩니다.
//
// ★ 이 단원은 네트워크 없이 대부분 확인할 수 있습니다.
//   서명은 **내 컴퓨터에서 계산**하는 것이기 때문입니다. AWS 에 안 물어봅니다.
//
// 실행: node 개념04_미리_서명된_URL.js
// ============================================================

const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    // 검증무시: 진짜 키가 아니라 자리표시입니다 (가짜 S3 를 부르는 데만 씁니다)
    accessKeyId: "AKIAEXAMPLE0000000000",
    secretAccessKey: "examplesecretkey0000000000000000000000000",
  },
});

const 버킷 = "my-bucket";

// ============================================================
// 1. 어떻게 동작하나
// ============================================================
//
// 서버가 이렇게 계산합니다.
//
//   ① "이 버킷의 이 키를, 이 방법으로, 이 시각까지" 라는 문장을 만듭니다
//   ② 그 문장을 **비밀 키로 서명**합니다 (해시 계산)
//   ③ 서명을 주소 뒤에 붙입니다
//
// S3 가 그 주소를 받으면 같은 계산을 해 봅니다.
// 서명이 맞으면 "이건 키를 가진 사람이 허락한 요청이구나" 하고 통과시킵니다.
//
// ★★★ 그래서 **AWS 에 물어보지 않고** 주소를 만들 수 있습니다.
//   순수한 계산입니다. 인터넷이 끊겨 있어도 됩니다.
//   아래에서 실제로 만들어 봅니다.

async function 만들어보기() {
  const 주소 = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: 버킷, Key: "uploads/2026/08/사진.png" }),
    { expiresIn: 300 }
  );

  const u = new URL(주소);

  console.log("호스트:", u.host);
  // 출력: 호스트: my-bucket.s3.ap-northeast-2.amazonaws.com
  console.log("경로:", decodeURIComponent(u.pathname));
  // 출력: 경로: /uploads/2026/08/사진.png
  console.log("알고리즘:", u.searchParams.get("X-Amz-Algorithm"));
  // 출력: 알고리즘: AWS4-HMAC-SHA256
  console.log("만료(초):", u.searchParams.get("X-Amz-Expires"));
  // 출력: 만료(초): 300
  console.log("서명 길이:", u.searchParams.get("X-Amz-Signature").length);
  // 출력: 서명 길이: 64

  // ★ 서명이 64글자입니다. SHA-256 해시를 16진수로 적은 길이입니다.
  //
  // ★★ 한글 키는 퍼센트 인코딩됩니다.
  //   주소에는 %EC%82%AC... 로 들어가고, 디코딩하면 원래 이름이 나옵니다.
  //   그래서 한글 파일 이름도 문제없습니다.
  //   (다만 개념03 처럼 키는 영어+숫자로 짓는 게 낫습니다)

  console.log("주소 안에 비밀 키가 들어 있나:", 주소.includes("examplesecretkey"));
  // 출력: 주소 안에 비밀 키가 들어 있나: false

  // ★★★ 이게 핵심입니다.
  //   **비밀 키는 주소에 안 들어갑니다.** 서명 결과만 들어갑니다.
  //   그래서 이 주소를 브라우저에 줘도 안전합니다.
  //   서명으로부터 비밀 키를 되돌릴 수 없습니다.

  await 올리기용();
}

// ============================================================
// 2. 올리기용 주소도 만들 수 있습니다
// ============================================================

async function 올리기용() {
  const 올리기주소 = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: 버킷,
      Key: "uploads/2026/08/새사진.png",
      ContentType: "image/png",
    }),
    { expiresIn: 60 }
  );

  console.log("올리기 주소도 만들어지나:", 올리기주소.includes("X-Amz-Signature"));
  // 출력: 올리기 주소도 만들어지나: true
  console.log("만료:", new URL(올리기주소).searchParams.get("X-Amz-Expires"));
  // 출력: 만료: 60

  // ★★★ 여기가 이 단원의 핵심입니다.
  //
  //   **브라우저가 서버를 거치지 않고 S3 에 직접 올릴 수 있습니다.**
  //
  //     ① 브라우저: "사진을 올리려는데 주소 좀 주세요" → 내 서버
  //     ② 서버: 키를 짓고, 올리기용 주소를 만들어 줍니다 (60초짜리)
  //     ③ 브라우저: 그 주소로 파일을 **S3 에 바로** PUT 합니다
  //     ④ 브라우저: "다 올렸어요, 키는 이거예요" → 내 서버
  //     ⑤ 서버: DB 에 키를 저장합니다
  //
  //   ★ 파일이 내 서버를 거치지 않습니다.
  //     100MB 동영상을 올려도 서버 메모리와 대역폭을 안 씁니다.
  //     t3.micro 로도 큰 파일을 받을 수 있습니다.
  //
  //   ★★ multer 가 필요 없어집니다. (백엔드 09단원)
  //     대신 "④ 다 올렸어요" 를 믿을 수 있는지가 문제가 됩니다. 아래 5번.

  await 시간();
}

// ============================================================
// 3. 만료 시간
// ============================================================

async function 시간() {
  const 짧게 = await getSignedUrl(s3, new GetObjectCommand({ Bucket: 버킷, Key: "a.png" }), { expiresIn: 60 });
  const 길게 = await getSignedUrl(s3, new GetObjectCommand({ Bucket: 버킷, Key: "a.png" }), { expiresIn: 604800 });

  console.log("1분:", new URL(짧게).searchParams.get("X-Amz-Expires"));
  // 출력: 1분: 60
  console.log("7일:", new URL(길게).searchParams.get("X-Amz-Expires"));
  // 출력: 7일: 604800

  try {
    await getSignedUrl(s3, new GetObjectCommand({ Bucket: 버킷, Key: "a.png" }), { expiresIn: 604801 });
  } catch (에러) {
    console.log("7일을 넘기면:", 에러.message.includes("expiration"));
    // 출력: 7일을 넘기면: true
  }

  // ★★ 최대 7일입니다. 그 이상은 못 만듭니다.
  //
  // ★★★ 그런데 짧게 잡으세요. 얼마나 짧게?
  //
  //   화면에 이미지 보여 주기   5~15분   (페이지를 보는 동안만)
  //   내려받기 링크            5분      (누르면 바로 받으니까)
  //   업로드용                 1~5분    (받자마자 쓰니까)
  //   메일로 보내는 링크        1시간~1일 (나중에 열 수 있게)
  //
  // ★ 왜 짧아야 하나
  //   그 주소는 **누구에게 줘도 열립니다.** 로그인 확인을 안 합니다.
  //   카톡으로 전달하면 그 사람도 봅니다.
  //   짧으면 새어 나가도 금방 못 쓰게 됩니다.
  //
  // ★★ 반대로 너무 짧으면 문제가 생깁니다.
  //   목록 화면에서 사진 50장의 주소를 1분짜리로 만들었는데
  //   사용자가 2분 뒤에 스크롤하면 아래쪽 사진이 깨집니다.
  //   화면을 보는 시간보다 길게 잡으세요.

  await 서버에서();
}

// ============================================================
// 4. 서버 코드로는 이렇게 생깁니다
// ============================================================

async function 서버에서() {
  // ── 보여 주기용 주소 만들어 주는 API ──
  //
  //   app.get("/equipments/:id/photo-url", async (req, res) => {
  //     const 설비 = await 저장소.하나(Number(req.params.id));
  //     if (!설비) return res.status(404).json({ 오류: "없습니다" });
  //
  //     // ★ 여기서 권한을 확인합니다
  //     if (설비.owner_id !== req.user.id) {
  //       return res.status(403).json({ 오류: "권한이 없습니다" });
  //     }
  //
  //     const 주소 = await getSignedUrl(s3,
  //       new GetObjectCommand({ Bucket: 설정.S3_BUCKET, Key: 설비.photo_key }),
  //       { expiresIn: 600 });
  //
  //     res.json({ url: 주소, 만료초: 600 });
  //   });
  //
  // ★★★ **권한 확인은 주소를 만들기 전에** 합니다.
  //   주소를 만들어 준 뒤에는 확인할 방법이 없습니다. S3 가 서명만 봅니다.
  //   이게 05단원 RLS 와 다른 점입니다. RLS 는 DB 가 매번 확인해 줍니다.
  //   여기서는 **내 서버가 마지막 문지기**입니다.
  //
  // ★★★ 그 문지기가 제일 먼저 볼 것은 "누구냐" 입니다.
  //
  //   로그인 확인 없는 sign 주소는 **아무나 쓰는 파일 창고**가 됩니다.
  //   주소만 알면 누구든 우리 버킷에 파일을 올릴 수 있고,
  //   요금은 우리가 냅니다. (6번의 금지 목록 첫 줄이 이것입니다)
  //
  //   위의 보여 주기용 API 는 req.user.id 로 권한을 봤습니다.
  //   올리기용도 똑같이, 아니 더 엄격하게 봐야 합니다.

  // ── 올리기용 주소 만들어 주는 API ──
  //
  //   app.post("/uploads/sign", async (req, res) => {
  //     // ★★★ 맨 먼저 로그인부터 확인합니다
  //     if (!req.user) {
  //       return res.status(401).json({ 오류: "로그인이 필요합니다" });
  //     }
  //
  //     const { 파일이름, 종류, 크기 } = req.body ?? {};
  //
  //     // ★ 검증을 여기서 다 해야 합니다
  //     if (!허용종류.includes(종류)) {
  //       return res.status(400).json({ 오류: "이미지만 올릴 수 있습니다" });
  //     }
  //     if (크기 > 5 * 1024 * 1024) {
  //       return res.status(400).json({ 오류: "5MB 까지" });
  //     }
  //
  //     const 키 = 키만들기(파일이름);          // 개념03
  //
  //     const 주소 = await getSignedUrl(s3,
  //       new PutObjectCommand({
  //         Bucket: 설정.S3_BUCKET,
  //         Key: 키,
  //         ContentType: 종류,
  //         ContentLength: 크기,     // ★ 크기를 서명에 넣습니다
  //       }),
  //       { expiresIn: 60,
  //         signableHeaders: new Set(["content-type"]) });   // ★ 이게 있어야 종류가 잠깁니다
  //
  //     res.json({ url: 주소, key: 키 });
  //   });

  const 서명에넣을것 = [
    ["Key", "그 키에만 올릴 수 있습니다", "다른 경로로 못 올립니다"],
    ["ContentType", "그 종류만", "★ signableHeaders 에 넣어야 잠깁니다"],
    ["ContentLength", "그 크기만", "★ 더 큰 파일을 못 올립니다"],
    ["expiresIn", "그 시간만", "주소가 새어도 곧 못 씁니다"],
  ];

  for (const [무엇, 뜻, 효과] of 서명에넣을것) {
    console.log(`${무엇} | ${뜻} | ${효과}`);
  }
  // 출력: Key | 그 키에만 올릴 수 있습니다 | 다른 경로로 못 올립니다
  // 출력: ContentType | 그 종류만 | ★ signableHeaders 에 넣어야 잠깁니다
  // 출력: ContentLength | 그 크기만 | ★ 더 큰 파일을 못 올립니다
  // 출력: expiresIn | 그 시간만 | 주소가 새어도 곧 못 씁니다

  // ★★★ ContentType 은 **그냥 넣으면 서명에 안 들어갑니다.**
  //
  //   PutObjectCommand 에 ContentType 을 적어도, SDK 가 서명할 때 **일부러 뺍니다.**
  //   (s3-request-presigner 가 content-type 을 unsignableHeaders 에 넣어 둡니다)
  //
  //   주소를 만들어서 X-Amz-SignedHeaders 를 직접 보면 알 수 있습니다.
  //
  //     그냥 넣으면            → X-Amz-SignedHeaders=host
  //     signableHeaders 지정   → X-Amz-SignedHeaders=content-type;host
  //
  //   ★ 앞의 것은 브라우저가 image/png 로 서명받고 text/html 로 올려도 통과합니다.
  //     "이미지만 올라온다" 고 믿고 그 파일을 그대로 보여 주면
  //     남이 올린 HTML 이 우리 도메인에서 실행됩니다.
  //
  //   ★ 그래서 signableHeaders 를 꼭 지정하세요.
  //
  //     getSignedUrl(s3, 명령, {
  //       expiresIn: 60,
  //       signableHeaders: new Set(["content-type"]),
  //     })
  //
  //   ★★ 그래도 이건 "신고한 종류" 를 잠글 뿐입니다.
  //     png 라고 신고하고 진짜 png 헤더를 붙인 HTML 을 올릴 수 있습니다.
  //     아래 5번의 "파일 내용" 이 그 이야기입니다.

  // ★★★ ContentLength 를 서명에 넣는 게 중요합니다.
  //
  //   안 넣으면 브라우저가 **얼마든지 큰 파일**을 올릴 수 있습니다.
  //   서버는 "5MB 까지" 라고 검사했지만, 그건 클라이언트가 신고한 값입니다.
  //   실제로는 500MB 를 올릴 수 있습니다. 저장 요금이 나갑니다.
  //
  //   ContentLength 를 서명에 넣으면 S3 가 그 크기만 받습니다.

  await 확인();
}

// ============================================================
// 5. ★★ 브라우저를 믿으면 안 됩니다
// ============================================================

async function 확인() {
  const 못믿는것 = [
    ["파일 크기", "신고한 값입니다", "ContentLength 를 서명에 넣으세요"],
    ["파일 종류", "확장자·mimetype 모두 위조 가능", "signableHeaders 로 잠그세요"],
    ["올렸다는 신고", "★ 안 올리고 신고만 할 수 있습니다", "HeadObject 로 확인하세요"],
    ["파일 내용", "이미지라면서 스크립트를 올릴 수 있습니다", "받아서 검사하거나 격리"],
  ];

  for (const [무엇, 문제, 대응] of 못믿는것) {
    console.log(`${무엇} | ${문제} | ${대응}`);
  }
  // 출력: 파일 크기 | 신고한 값입니다 | ContentLength 를 서명에 넣으세요
  // 출력: 파일 종류 | 확장자·mimetype 모두 위조 가능 | signableHeaders 로 잠그세요
  // 출력: 올렸다는 신고 | ★ 안 올리고 신고만 할 수 있습니다 | HeadObject 로 확인하세요
  // 출력: 파일 내용 | 이미지라면서 스크립트를 올릴 수 있습니다 | 받아서 검사하거나 격리

  // ★★★ 세 번째가 이 방식의 약점입니다.
  //
  //   브라우저가 "다 올렸어요, 키는 uploads/a.png 예요" 라고 합니다.
  //   서버가 그 말을 믿고 DB 에 저장합니다.
  //   그런데 실제로는 안 올렸습니다. DB 에는 있는데 파일이 없습니다.
  //
  //   ★ 확인 방법: 서버가 HeadObject 로 진짜 있는지 봅니다. (개념03)
  //
  //     app.post("/uploads/complete", async (req, res) => {
  //       const { key } = req.body;
  //
  //       // 내가 방금 서명해 준 키인지 확인 (아무 키나 받으면 안 됩니다)
  //       if (!key.startsWith(`uploads/${올해}/`)) {
  //         return res.status(400).json({ 오류: "이상한 키입니다" });
  //       }
  //
  //       // ★★★ try 는 HeadObject **한 줄만** 감쌉니다. 이유는 아래에 있습니다.
  //       let 정보;
  //       try {
  //         정보 = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
  //       } catch (에러) {
  //         if (에러.name === "NotFound") {
  //           return res.status(400).json({ 오류: "올라온 파일이 없습니다" });
  //         }
  //         throw 에러;   // ← 그 밖의 오류는 그대로 던집니다 (개념03)
  //       }
  //
  //       if (정보.ContentLength > 5 * 1024 * 1024) {
  //         await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
  //         return res.status(400).json({ 오류: "너무 큽니다" });
  //       }
  //
  //       await 저장소.사진저장(key, 정보.ContentLength);   // ★ try 밖입니다
  //       res.status(201).json({ ok: true });
  //     });
  //
  // ★★★ try 를 넓게 잡으면 안 됩니다. 아주 흔한 실수입니다.
  //
  //   try 안에 DB 쓰기까지 넣으면 **DB 오류도 "올라온 파일이 없습니다"(400)** 가 됩니다.
  //   진짜 원인은 DB 인데 화면에는 파일 이야기가 뜹니다. 원인을 영원히 못 찾습니다.
  //   IAM 권한이 모자라 AccessDenied 가 나도 똑같이 400 으로 삼켜집니다.
  //   "파일을 분명히 올렸는데 없다고 해요" 의 정체가 대개 이것입니다.
  //
  //   ★ 개념03 의 "다른 오류는 그대로 던지세요" 와 정확히 같은 원칙입니다.
  //     **try 는 내가 이름을 아는 오류 하나만 감쌉니다.**
  //     나머지는 던져서 500 으로 나가게 두세요. 그래야 로그에 남습니다.
  //
  // ★★ 반대 경우도 있습니다 — **올렸는데 신고를 안 한 파일**입니다.
  //
  //   S3 에는 있는데 DB 에는 없습니다. 아무도 안 쓰는 파일이 쌓입니다.
  //   백엔드 11단원의 "고아 파일" 과 같은 문제입니다.
  //
  //   ★ 정리하는 법
  //     · S3 수명 주기 규칙으로 "uploads/temp/ 아래는 1일 뒤 삭제"
  //     · 또는 정기 작업으로 DB 에 없는 키를 찾아 지우기 (03단원 개념02 의 LEFT JOIN)
  //
  //   ★★ 정기 작업은 07단원 개념02 를 기억하세요.
  //     클러스터로 돌리면 네 번 실행됩니다.

  await 하지말것();
}

// ============================================================
// 6. 하지 말아야 할 것
// ============================================================

async function 하지말것() {
  const 하지말것 = [
    ["주소를 DB 에 저장", "만료되면 죽은 주소가 남습니다. 키만 저장하세요"],
    ["주소를 캐시에 오래 두기", "같은 이유입니다"],
    ["만료를 7일로 크게", "새어 나가면 일주일간 열립니다"],
    ["권한 확인 없이 주소 발급", "★ 아무나 남의 파일 주소를 받아 갑니다"],
    ["프론트에서 서명", "★★★ 비밀 키를 브라우저에 넣는 것입니다"],
  ];

  for (const [무엇, 이유] of 하지말것) {
    console.log(`✗ ${무엇} — ${이유}`);
  }
  // 출력: ✗ 주소를 DB 에 저장 — 만료되면 죽은 주소가 남습니다. 키만 저장하세요
  // 출력: ✗ 주소를 캐시에 오래 두기 — 같은 이유입니다
  // 출력: ✗ 만료를 7일로 크게 — 새어 나가면 일주일간 열립니다
  // 출력: ✗ 권한 확인 없이 주소 발급 — ★ 아무나 남의 파일 주소를 받아 갑니다
  // 출력: ✗ 프론트에서 서명 — ★★★ 비밀 키를 브라우저에 넣는 것입니다

  // ★★★ 마지막이 최악입니다.
  //
  //   "브라우저에서 바로 서명하면 서버 왕복이 없어서 빠르겠는데?"
  //   그러려면 브라우저에 비밀 키를 줘야 합니다.
  //   그 순간 그 키로 **버킷의 모든 것**을 할 수 있게 됩니다.
  //
  //   서명은 반드시 서버에서 합니다. 예외가 없습니다.
  //
  // ★★ 네 번째도 자주 놓칩니다.
  //   /uploads/sign?key=남의파일.png 처럼 키를 그대로 받으면
  //   아무 파일의 주소나 만들어 줍니다.
  //   키는 서버가 짓거나, DB 에서 확인한 것만 쓰세요.

  // ── 첫 번째를 왜 하면 안 되는지 확인해 봅시다 ──

  const 지금 = await getSignedUrl(s3, new GetObjectCommand({ Bucket: 버킷, Key: "a.png" }), { expiresIn: 300 });

  console.log("주소 길이가 긴가:", 지금.length > 300);
  // 출력: 주소 길이가 긴가: true
  console.log("만료 정보가 들어 있나:", 지금.includes("X-Amz-Date"));
  // 출력: 만료 정보가 들어 있나: true

  // ★ 주소에 "언제 만든 것인지" 가 들어 있습니다.
  //   그래서 저장해 두면 시간이 지나 죽습니다.
  //   그리고 아주 깁니다. DB 칸을 낭비합니다.
  //
  //   ★ 키만 저장하고, 필요할 때마다 만드세요.
  //     만드는 데 드는 시간은 밀리초 이하입니다. 계산일 뿐이니까요.

  마무리();
}

// ============================================================
// 7. 브라우저 쪽 코드
// ============================================================

function 마무리() {
  const 브라우저코드 = [
    "// ① 서버에서 올리기용 주소를 받습니다",
    'const 파일 = 입력창.files[0];',
    'const 서명응답 = await fetch("/uploads/sign", {',
    '  method: "POST",',
    '  headers: { "Content-Type": "application/json" },',
    "  body: JSON.stringify({ 파일이름: 파일.name, 종류: 파일.type, 크기: 파일.size }),",
    "});",
    "const { url, key } = await 서명응답.json();",
    "",
    "// ② S3 에 바로 올립니다 (내 서버를 안 거칩니다)",
    "const 올린결과 = await fetch(url, {",
    '  method: "PUT",',
    '  headers: { "Content-Type": 파일.type },   // ★ 서명한 것과 같아야 합니다',
    "  body: 파일,",
    "});",
    "",
    "if (!올린결과.ok) throw new Error(`올리기 실패: ${올린결과.status}`);",
    "",
    "// ③ 다 올렸다고 서버에 알립니다",
    'await fetch("/uploads/complete", {',
    '  method: "POST",',
    '  headers: { "Content-Type": "application/json" },',
    "  body: JSON.stringify({ key }),",
    "});",
  ];

  브라우저코드.forEach((줄) => console.log(줄));
  // 출력: // ① 서버에서 올리기용 주소를 받습니다
  // 출력: const 파일 = 입력창.files[0];
  // 출력: const 서명응답 = await fetch("/uploads/sign", {
  // 출력:   method: "POST",
  // 출력:   headers: { "Content-Type": "application/json" },
  // 출력:   body: JSON.stringify({ 파일이름: 파일.name, 종류: 파일.type, 크기: 파일.size }),
  // 출력: });
  // 출력: const { url, key } = await 서명응답.json();
  // 출력:
  // 출력: // ② S3 에 바로 올립니다 (내 서버를 안 거칩니다)
  // 출력: const 올린결과 = await fetch(url, {
  // 출력:   method: "PUT",
  // 출력:   headers: { "Content-Type": 파일.type },   // ★ 서명한 것과 같아야 합니다
  // 출력:   body: 파일,
  // 출력: });
  // 출력:
  // 출력: if (!올린결과.ok) throw new Error(`올리기 실패: ${올린결과.status}`);
  // 출력:
  // 출력: // ③ 다 올렸다고 서버에 알립니다
  // 출력: await fetch("/uploads/complete", {
  // 출력:   method: "POST",
  // 출력:   headers: { "Content-Type": "application/json" },
  // 출력:   body: JSON.stringify({ key }),
  // 출력: });

  // ★★★ ② 의 Content-Type 이 서명할 때 넣은 것과 **정확히 같아야** 합니다.
  //   — 단, signableHeaders 로 content-type 을 잠갔을 때만 그렇습니다.
  //
  //   잠갔다면 서명이 그 값까지 포함해서 계산되므로,
  //   하나라도 다르면 S3 가 SignatureDoesNotMatch 로 거절합니다.
  //
  //   ★ 안 잠갔다면 아무 값이나 통과합니다. 앞의 3번에서 본 그대로입니다.
  //     그래서 잠그는 겁니다.
  //
  //   그래서 서명 요청에 파일.type 을 보내고, 올릴 때도 같은 값을 씁니다.
  //
  // ★★ FormData 를 쓰면 안 됩니다.
  //   PUT 으로 **파일 자체**를 본문에 담습니다. multipart 가 아닙니다.
  //   백엔드 09단원의 multer 업로드와 다른 방식입니다.
  //   FormData 로 보내면 파일 앞뒤에 경계 문자열이 붙어서 파일이 깨집니다.
  //
  // ★ CORS 설정이 필요합니다. (개념02 의 그 설정)
  //   안 하면 브라우저가 PUT 을 막습니다.
  //   백엔드 08단원에서 배운 그 CORS 입니다. 이번엔 S3 쪽에 겁니다.
  //
  // ★★ 진행률을 보여 주려면 fetch 로는 안 됩니다.
  //   XMLHttpRequest 의 upload.onprogress 를 써야 합니다.
  //   백엔드 10단원에서 한 그대로입니다.

  // ============================================================
  // 8. 직접 해 볼 것
  // ============================================================
  //
  // □ ① 진짜 버킷으로 주소를 만들고 브라우저에 붙여 넣어 보세요
  //      → 파일이 보입니다
  //
  // □ ② expiresIn 을 10 으로 주고 15초 뒤에 열어 보세요
  //      → AccessDenied 와 "Request has expired" 가 나옵니다
  //
  // □ ③ 주소의 서명(X-Amz-Signature) 한 글자를 바꾸고 열어 보세요
  //      → SignatureDoesNotMatch 가 나옵니다
  //
  // □ ④ 올리기용 주소를 만들고 curl 로 올려 보세요
  //
  //      curl -X PUT --upload-file 시험.png \
  //           -H "Content-Type: image/png" "그주소"
  //
  // □ ⑤ Content-Type 을 다르게 주고 올려 보세요
  //      → signableHeaders 를 넣었으면 SignatureDoesNotMatch 가 납니다
  //
  // □ ⑥ ★★ signableHeaders 를 **빼고** ⑤ 를 다시 해 보세요
  //      → 그냥 올라갑니다. text/html 로 바꿔서 올려 보세요.
  //        이게 "이미지만 받는 줄 알았는데" 사고가 나는 경로입니다.
  //
  // ★ ②③⑤⑥ 을 꼭 해 보세요. "정말 막히는구나" 를 눈으로 봐야 합니다.
  //   특히 ⑤ 와 ⑥ 을 **붙여서** 하세요. 한 줄 차이로 갈립니다.
  //   05단원에서 RLS 를 curl 로 확인하라고 한 것과 같은 이유입니다.
}

만들어보기();

// ============================================================
// 정리
// ============================================================
//
//   서명은 **내 컴퓨터에서 계산**합니다. AWS 에 안 물어봅니다.
//   그래서 인터넷 없이도 주소가 만들어집니다. (여기서 직접 확인했습니다)
//   비밀 키는 주소에 안 들어갑니다. 서명 결과만 들어갑니다.
//
//   보여 주기(GET) 와 올리기(PUT) 둘 다 만들 수 있습니다.
//   올리기 주소를 주면 **파일이 내 서버를 안 거칩니다.**
//
//   서명에 넣을 것
//     Key · ContentType · ContentLength · expiresIn
//     ★ ContentLength 를 빼면 얼마든지 큰 파일이 올라옵니다
//
//   만료는 짧게. 최대 7일. 화면 보는 시간보다는 길게.
//
//   ★ 권한 확인은 주소를 만들기 **전에** 합니다. 만든 뒤에는 못 막습니다.
//   ★ 서명은 반드시 서버에서. 프론트에서 하면 비밀 키를 넘기는 것입니다.
//   ★ 주소를 DB 에 저장하지 마세요. 키만 저장하고 그때그때 만드세요.
//
//   브라우저가 "다 올렸다" 는 말을 믿지 마세요. HeadObject 로 확인하세요.
//   올렸는데 신고 안 한 파일은 수명 주기 규칙이나 정기 작업으로 정리하세요.
//
//   PUT 으로 파일 자체를 보냅니다. FormData 가 아닙니다.
//   Content-Type 이 서명한 것과 정확히 같아야 합니다.
//
// 다음(개념05) 에서 백엔드 09단원의 파일 저장소를 S3 로 갈아 끼웁니다.
