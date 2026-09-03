// ============================================================
// 개념 03 — nginx 를 앞에 세우기
// ============================================================
//
// 지금 우리 서버는 3000 포트에서 돕니다.
// 사용자에게 "http://13.125.x.x:3000 으로 오세요" 라고 할 수는 없습니다.
//
// 앞에 nginx 를 세웁니다. nginx 가 80 을 받아서 3000 으로 넘겨줍니다.
// 이런 걸 리버스 프록시라고 합니다.
//
// ★ nginx 자체는 리눅스에 설치해야 합니다. 여기서는 못 돌립니다.
//   대신 **nginx 가 하는 일을 Node 로 흉내 내서** 확인합니다.
//   특히 "프록시를 세우면 무엇이 달라지는가" 를 직접 재 봅니다.
//
// 실행: node 개념03_nginx를_앞에_세우기.js
// ============================================================

// 이파일은끝납니다
// ★ 위 한 줄은 검증 도구에게 주는 표시입니다.
//   이 파일은 서버를 띄우지만 마지막에 스스로 닫습니다.
//   그 표시가 없으면 도구가 "끝나지 않는 서버 파일" 로 보고 건너뜁니다.

const express = require("express");
const http = require("node:http");

// ============================================================
// 1. 왜 앞에 세우나
// ============================================================

const 이유들 = [
  ["80·443 을 쓸 수 있음", "1024 미만 포트는 root 만 엽니다. 앱을 root 로 돌리면 안 됩니다"],
  ["HTTPS 를 붙임", "인증서를 nginx 가 다룹니다. 앱은 몰라도 됩니다 (개념04)"],
  ["정적 파일을 빠르게", "이미지·CSS 를 Node 가 아니라 nginx 가 내보냅니다"],
  ["여러 앱을 한 서버에", "/api 는 3000, /admin 은 3001 로"],
  ["앱이 죽어도 뭔가는 보임", "502 페이지를 대신 보여 줍니다"],
  ["요청을 걸러 냄", "크기 제한, 속도 제한, 이상한 요청 차단"],
];

for (const [무엇, 설명] of 이유들) {
  console.log(`· ${무엇} — ${설명}`);
}
// 출력: · 80·443 을 쓸 수 있음 — 1024 미만 포트는 root 만 엽니다. 앱을 root 로 돌리면 안 됩니다
// 출력: · HTTPS 를 붙임 — 인증서를 nginx 가 다룹니다. 앱은 몰라도 됩니다 (개념04)
// 출력: · 정적 파일을 빠르게 — 이미지·CSS 를 Node 가 아니라 nginx 가 내보냅니다
// 출력: · 여러 앱을 한 서버에 — /api 는 3000, /admin 은 3001 로
// 출력: · 앱이 죽어도 뭔가는 보임 — 502 페이지를 대신 보여 줍니다
// 출력: · 요청을 걸러 냄 — 크기 제한, 속도 제한, 이상한 요청 차단
//
// ★ 06단원에서 "3000 포트를 보안 그룹에서 열지 마라" 고 한 이유가 이것입니다.
//   80·443 만 열고, 3000 은 서버 안에서만 열려 있습니다.
//   밖에서는 3000 에 닿을 방법이 아예 없습니다.

// ============================================================
// 2. 설치와 설정
// ============================================================
//
//   sudo apt update
//   sudo apt install -y nginx
//   sudo systemctl status nginx
//
// ★ Amazon Linux 2023 이면 apt 가 없습니다. sudo dnf install -y nginx 입니다.
//   (Amazon Linux 2 는 sudo amazon-linux-extras install -y nginx1)
//   이 수업은 06단원에서 Ubuntu 를 골랐다는 전제로 apt 를 씁니다.
//
// 설치하면 바로 돕니다. 브라우저로 서버 IP 를 열면 nginx 기본 페이지가 나옵니다.
// (보안 그룹에서 80 을 열어 뒀다면요)
//
// ── 설정 파일 위치 — ★★ 배포판마다 다릅니다 ──
//
//   /etc/nginx/nginx.conf                   전체 설정 (어디서나 같습니다)
//
//   ① Debian·Ubuntu
//     /etc/nginx/sites-available/기본        사이트별 설정을 여기에 만들고
//     /etc/nginx/sites-enabled/기본          여기에 링크를 겁니다
//
//   ② Amazon Linux·RHEL·Rocky
//     /etc/nginx/conf.d/기본.conf            여기에 만들면 바로 읽힙니다
//     ★ sites-available · sites-enabled 디렉터리가 **아예 없습니다.**
//       "그 폴더가 없어요" 는 배포판이 달라서입니다. 만들지 말고 conf.d 를 쓰세요.
//       대신 파일 이름이 **.conf 로 끝나야** 읽힙니다. (include conf.d/*.conf)
//
// ★★★ ① 은 파일을 만든 것만으로는 안 켜집니다. **링크를 걸어야 합니다.**
//   이 명령을 빼먹고 "설정을 고쳤는데 아무 일도 안 일어난다" 로 헤맵니다.
//
//     sudo nano /etc/nginx/sites-available/기본        # 아래 설정을 여기에 씁니다
//     sudo ln -s /etc/nginx/sites-available/기본 /etc/nginx/sites-enabled/기본
//     sudo rm /etc/nginx/sites-enabled/default        # ★ 기본 페이지를 끕니다
//     sudo nginx -t && sudo systemctl reload nginx
//
//   ★ ln -s 의 원본은 **절대 경로**로 적으세요.
//     sites-enabled 안에서 상대 경로로 걸면 깨진 링크가 됩니다.
//
//   ★★ default 를 안 지우면 계속 nginx 기본 페이지가 나옵니다.
//     server_name 이 안 맞으면 nginx 는 **첫 번째 server 블록**에게 넘깁니다.
//     그게 default 라서 그렇습니다. "설정이 안 먹는다" 의 흔한 원인입니다.
//
//   끄고 싶으면 링크만 지우면 됩니다. 설정 파일은 남습니다.
//     sudo rm /etc/nginx/sites-enabled/기본
//
// ★ ② 는 링크가 필요 없습니다. conf.d 에 넣고 reload 하면 끝입니다.
//   대신 기본 페이지는 /etc/nginx/nginx.conf 안의 server 블록이라
//   거기를 직접 고치거나 server_name 을 맞춰 줘야 합니다.

const 설정 = [
  "server {",
  "    listen 80;",
  "    server_name 설비.example.com;",
  "",
  "    # 업로드 크기 제한 (기본이 1MB 라 파일 업로드가 막힙니다)",
  "    client_max_body_size 10M;",
  "",
  "    location / {",
  "        proxy_pass http://127.0.0.1:3000;",
  "",
  "        proxy_http_version 1.1;",
  "        proxy_set_header Host              $host;",
  "        proxy_set_header X-Real-IP         $remote_addr;",
  "        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;",
  "        proxy_set_header X-Forwarded-Proto $scheme;",
  "",
  "        proxy_read_timeout 60s;",
  "    }",
  "",
  "    location /uploads/ {",
  "        alias /home/ubuntu/앱/uploads/;",
  "        expires 7d;",
  "    }",
  "}",
];

설정.forEach((줄) => console.log(줄));
// 출력: server {
// 출력:     listen 80;
// 출력:     server_name 설비.example.com;
// 출력:
// 출력:     # 업로드 크기 제한 (기본이 1MB 라 파일 업로드가 막힙니다)
// 출력:     client_max_body_size 10M;
// 출력:
// 출력:     location / {
// 출력:         proxy_pass http://127.0.0.1:3000;
// 출력:
// 출력:         proxy_http_version 1.1;
// 출력:         proxy_set_header Host              $host;
// 출력:         proxy_set_header X-Real-IP         $remote_addr;
// 출력:         proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
// 출력:         proxy_set_header X-Forwarded-Proto $scheme;
// 출력:
// 출력:         proxy_read_timeout 60s;
// 출력:     }
// 출력:
// 출력:     location /uploads/ {
// 출력:         alias /home/ubuntu/앱/uploads/;
// 출력:         expires 7d;
// 출력:     }
// 출력: }

// 적용하는 법
//
//   sudo nginx -t              ★ 문법 검사. 반드시 먼저
//   sudo systemctl reload nginx
//
// ★★ nginx -t 를 꼭 하세요.
//   설정이 틀린 채로 reload 하면 nginx 가 안 뜹니다. 사이트 전체가 죽습니다.
//   -t 는 검사만 하고 아무것도 안 바꿉니다.
//
// ★ reload 는 무중단입니다. restart 는 잠깐 끊깁니다. (PM2 와 같은 이야기)

// ============================================================
// 3. ★★★ 프록시를 세우면 IP 가 달라집니다 — 직접 재 봅니다
// ============================================================
//
// nginx 를 앞에 세우면 앱이 보는 "요청한 사람" 이 바뀝니다.
// 이걸 모르면 로그·차단·통계가 전부 틀립니다.

const app = express();

app.get("/whoami", (req, res) => {
  res.json({
    ip: req.ip,
    protocol: req.protocol,
    받은_X_Forwarded_For: req.headers["x-forwarded-for"] ?? null,
    받은_X_Forwarded_Proto: req.headers["x-forwarded-proto"] ?? null,
  });
});

const 뒤 = app.listen(3301);

// nginx 흉내 — 위 설정의 proxy_set_header 네 줄이 하는 일을 코드로 옮긴 것입니다
const 프록시 = http.createServer((req, res) => {
  const 진짜주소 = req.socket.remoteAddress;

  // ★ $proxy_add_x_forwarded_for 흉내 — "기존 값 + 진짜 주소" 로 **이어 붙입니다.**
  //   덮어쓰면 앞단 프록시가 남긴 기록이 사라집니다. (아래 4번에서 왜 중요한지 봅니다)
  const 기존XFF = req.headers["x-forwarded-for"];
  const 이어붙인XFF = 기존XFF ? `${기존XFF}, ${진짜주소}` : 진짜주소;

  const 요청 = http.request({
    hostname: "127.0.0.1",
    port: 3301,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      "x-real-ip": 진짜주소,
      "x-forwarded-for": 이어붙인XFF,
      "x-forwarded-proto": "https", // nginx 가 HTTPS 를 받았다고 가정
    },
  }, (뒤응답) => {
    res.writeHead(뒤응답.statusCode, 뒤응답.headers);
    뒤응답.pipe(res);
  });

  req.pipe(요청);
});

프록시.listen(3300);

async function 재보기() {
  const 직접 = await (await fetch("http://localhost:3301/whoami")).json();
  console.log("직접 왔을 때 ip:", 직접.ip, "/ protocol:", 직접.protocol);
  // 출력: 직접 왔을 때 ip: ::1 / protocol: http

  const 프록시통해 = await (await fetch("http://localhost:3300/whoami")).json();
  console.log("프록시 통해 ip:", 프록시통해.ip, "/ protocol:", 프록시통해.protocol);
  // 출력: 프록시 통해 ip: ::ffff:127.0.0.1 / protocol: http

  console.log("X-Forwarded-For 는 왔나:", 프록시통해.받은_X_Forwarded_For !== null);
  // 출력: X-Forwarded-For 는 왔나: true
  console.log("X-Forwarded-Proto:", 프록시통해.받은_X_Forwarded_Proto);
  // 출력: X-Forwarded-Proto: https

  // ★★★ 두 가지가 잘못됐습니다.
  //
  //   ① req.ip 가 127.0.0.1 입니다.
  //      **모든 사용자가 같은 IP 로 보입니다.** nginx 의 주소니까요.
  //      로그에 아무 의미가 없어집니다.
  //      IP 로 속도 제한을 걸면 전 세계 사용자가 한 덩어리가 됩니다.
  //
  //   ② req.protocol 이 http 입니다.
  //      사용자는 https 로 왔는데요. nginx→앱 구간이 http 라서 그렇습니다.
  //      "http 면 https 로 보내라" 는 코드를 넣으면 무한 반복이 됩니다.
  //
  //   헤더는 제대로 왔습니다. Express 가 안 믿는 것뿐입니다.

  await 고치기();
}

// ============================================================
// 4. 고치는 법 — trust proxy
// ============================================================

async function 고치기() {
  app.set("trust proxy", 1);

  const 고친뒤 = await (await fetch("http://localhost:3300/whoami")).json();

  console.log("trust proxy 뒤 ip:", 고친뒤.ip, "/ protocol:", 고친뒤.protocol);
  // 출력: trust proxy 뒤 ip: ::1 / protocol: https

  console.log("직접 왔을 때와 ip 가 같아졌나:", 고친뒤.ip === "::1");
  // 출력: 직접 왔을 때와 ip 가 같아졌나: true

  // ★★★ 한 줄로 둘 다 고쳐졌습니다.
  //
  //     app.set("trust proxy", 1);
  //
  //   "앞에 프록시가 1대 있으니 그게 준 헤더를 믿어라" 는 뜻입니다.
  //   그러면 Express 가
  //     req.ip       ← X-Forwarded-For 에서 읽습니다
  //     req.protocol ← X-Forwarded-Proto 에서 읽습니다
  //
  // ★★ 숫자가 중요합니다. 프록시 개수를 적습니다.
  //
  //     1        프록시 1대 (nginx 만)
  //     2        CloudFront → nginx 처럼 2대
  //     true     ✗ 전부 믿습니다. 쓰지 마세요
  //     "loopback"  127.0.0.1 에서 온 것만 믿습니다 (안전한 편)
  //
  // ★★★ true 를 쓰면 안 되는 이유
  //
  //   X-Forwarded-For 는 그냥 헤더입니다. 누구나 만들어 보낼 수 있습니다.
  //
  //     curl -H "X-Forwarded-For: 1.2.3.4" https://내서버/
  //
  //   true 면 이걸 그대로 믿습니다. IP 차단을 아무 의미 없게 만듭니다.
  //   숫자를 적으면 "뒤에서 n번째 값" 만 봅니다. 앞쪽에 끼워 넣은 건 무시됩니다.
  //
  // ★ 그래서 nginx 설정도 중요합니다.
  //     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  //   $proxy_add_x_forwarded_for 는 "기존 값 + 진짜 주소" 를 이어 붙입니다.
  //   그래서 맨 뒤가 nginx 가 본 진짜 주소입니다.

  뒤.close();
  프록시.close();

  주의점();
}

// ============================================================
// 5. 자주 막히는 것들
// ============================================================

function 주의점() {
  const 막힘 = [
    ["502 Bad Gateway", "앱이 안 떠 있습니다", "pm2 list 로 확인. 포트가 맞나"],
    ["413 Request Entity Too Large", "★ 업로드가 큽니다", "client_max_body_size 를 올리세요"],
    ["504 Gateway Timeout", "앱이 60초 안에 답을 안 했습니다", "proxy_read_timeout 또는 앱을 고치세요"],
    ["모든 IP 가 127.0.0.1", "trust proxy 를 안 켰습니다", "app.set('trust proxy', 1)"],
    ["웹소켓이 안 됨", "Upgrade 헤더를 안 넘겼습니다", "proxy_set_header Upgrade / Connection"],
    ["정적 파일이 404", "alias 경로가 틀렸습니다", "끝의 / 를 맞추세요"],
    ["nginx 가 안 뜸", "설정에 오타가 있습니다", "sudo nginx -t 로 확인"],
  ];

  for (const [증상, 이유, 대응] of 막힘) {
    console.log(`${증상} | ${이유} | ${대응}`);
  }
  // 출력: 502 Bad Gateway | 앱이 안 떠 있습니다 | pm2 list 로 확인. 포트가 맞나
  // 출력: 413 Request Entity Too Large | ★ 업로드가 큽니다 | client_max_body_size 를 올리세요
  // 출력: 504 Gateway Timeout | 앱이 60초 안에 답을 안 했습니다 | proxy_read_timeout 또는 앱을 고치세요
  // 출력: 모든 IP 가 127.0.0.1 | trust proxy 를 안 켰습니다 | app.set('trust proxy', 1)
  // 출력: 웹소켓이 안 됨 | Upgrade 헤더를 안 넘겼습니다 | proxy_set_header Upgrade / Connection
  // 출력: 정적 파일이 404 | alias 경로가 틀렸습니다 | 끝의 / 를 맞추세요
  // 출력: nginx 가 안 뜸 | 설정에 오타가 있습니다 | sudo nginx -t 로 확인

  // ★★★ 413 이 제일 헷갈립니다.
  //
  //   백엔드 09단원에서 multer 로 업로드 제한을 5MB 로 뒀습니다.
  //   그런데 nginx 의 기본값은 **1MB** 입니다.
  //
  //   2MB 파일을 올리면 앱에 닿기도 전에 nginx 가 413 을 냅니다.
  //   앱 로그에는 아무것도 안 남습니다. 그래서 원인을 못 찾습니다.
  //
  //   ★ 두 곳의 값을 맞추세요. nginx 를 앱보다 조금 크게 잡습니다.
  //       nginx  client_max_body_size 10M
  //       multer limits.fileSize 5MB
  //
  //     그러면 5MB 초과는 앱이 잡아서 우리 오류 형식으로 답합니다.
  //     10MB 초과는 nginx 가 미리 끊습니다. 서버 자원을 아낍니다.
  //
  // ★★ 502 를 만나면 순서대로 보세요.
  //
  //     pm2 list                     앱이 도나
  //     curl localhost:3000          서버 안에서는 되나
  //     sudo tail -f /var/log/nginx/error.log    nginx 가 뭐라 하나
  //
  //   대개 앱이 안 떠 있거나 포트가 다릅니다.

  웹소켓();
}

// ============================================================
// 6. 웹소켓을 쓴다면
// ============================================================

function 웹소켓() {
  const 웹소켓설정 = [
    "location /socket.io/ {",
    "    proxy_pass http://127.0.0.1:3000;",
    "    proxy_http_version 1.1;",
    "    proxy_set_header Upgrade    $http_upgrade;",
    '    proxy_set_header Connection "upgrade";',
    "    proxy_set_header Host       $host;",
    "    proxy_read_timeout 3600s;",
    "}",
  ];

  웹소켓설정.forEach((줄) => console.log(줄));
  // 출력: location /socket.io/ {
  // 출력:     proxy_pass http://127.0.0.1:3000;
  // 출력:     proxy_http_version 1.1;
  // 출력:     proxy_set_header Upgrade    $http_upgrade;
  // 출력:     proxy_set_header Connection "upgrade";
  // 출력:     proxy_set_header Host       $host;
  // 출력:     proxy_read_timeout 3600s;
  // 출력: }

  // ★ 웹소켓은 HTTP 로 시작해서 프로토콜을 바꿉니다.
  //   Upgrade 와 Connection 헤더를 넘겨야 그게 됩니다.
  //   안 넘기면 연결이 계속 끊깁니다.
  //
  // ★★ 그리고 클러스터와 궁합이 나쁩니다. (개념02)
  //   웹소켓은 한 프로세스에 계속 붙어 있어야 하는데
  //   클러스터는 요청마다 다른 프로세스로 보낼 수 있습니다.
  //   Redis 어댑터를 쓰거나, 웹소켓 앱만 fork 모드로 따로 띄웁니다.

  정적파일();
}

// ============================================================
// 7. 정적 파일은 nginx 가 내보내게
// ============================================================

function 정적파일() {
  // 백엔드 08단원에서 express.static 을 썼습니다. 잘 동작합니다.
  // 그런데 nginx 가 있으면 nginx 에게 맡기는 게 훨씬 빠릅니다.
  //
  //   Node    파일을 읽어서 응답으로 만들어 보냅니다. 그동안 다른 일을 못 합니다
  //   nginx   이 일에 최적화돼 있습니다. 훨씬 적은 자원으로 훨씬 많이 보냅니다
  //
  // ★ 특히 09단원의 업로드 파일이 그렇습니다.
  //   사진 100장을 Node 가 내보내면 API 응답까지 느려집니다.

  const 비교 = [
    ["HTML·CSS·JS", "nginx", "root 나 alias 로"],
    ["업로드된 사진", "nginx", "★ 또는 S3 (08단원)"],
    ["API 응답", "Node", "당연히"],
    ["권한 확인이 필요한 파일", "Node", "누가 볼 수 있는지 판단해야 하니까"],
  ];

  for (const [무엇, 누가, 비고] of 비교) {
    console.log(`${무엇} → ${누가} (${비고})`);
  }
  // 출력: HTML·CSS·JS → nginx (root 나 alias 로)
  // 출력: 업로드된 사진 → nginx (★ 또는 S3 (08단원))
  // 출력: API 응답 → Node (당연히)
  // 출력: 권한 확인이 필요한 파일 → Node (누가 볼 수 있는지 판단해야 하니까)

  // ★★ 마지막 줄이 중요합니다.
  //   "내 파일만 볼 수 있어야 하는" 파일을 nginx 로 내보내면
  //   주소만 알면 누구나 봅니다. 그건 Node 를 거쳐야 합니다.
  //   (05단원 RLS 와 같은 이야기입니다 — 막는 것은 코드가 아니라 구조로)

  마무리();
}

// ============================================================
// 8. 확인 목록
// ============================================================

function 마무리() {
  const 확인 = [
    "sudo nginx -t 가 통과하나",
    "보안 그룹에 80(과 443) 만 열려 있나 (3000 은 닫혀 있나)",
    "app.set('trust proxy', 1) 을 했나",
    "client_max_body_size 를 업로드 제한보다 크게 잡았나",
    "정적 파일을 nginx 가 내보내나",
    "502 가 나면 어디를 볼지 아나",
  ];

  확인.forEach((줄, 자리) => console.log(`□ ${자리 + 1}. ${줄}`));
  // 출력: □ 1. sudo nginx -t 가 통과하나
  // 출력: □ 2. 보안 그룹에 80(과 443) 만 열려 있나 (3000 은 닫혀 있나)
  // 출력: □ 3. app.set('trust proxy', 1) 을 했나
  // 출력: □ 4. client_max_body_size 를 업로드 제한보다 크게 잡았나
  // 출력: □ 5. 정적 파일을 nginx 가 내보내나
  // 출력: □ 6. 502 가 나면 어디를 볼지 아나

  // ============================================================
  // 9. EC2 에서 해 볼 것
  // ============================================================
  //
  //   sudo apt install -y nginx
  //   sudo nano /etc/nginx/sites-available/default
  //   # 위 2번의 설정을 넣고
  //   sudo nginx -t
  //   sudo systemctl reload nginx
  //
  //   curl -I http://내IP/         # 200 이 나와야 합니다
  //   curl http://내IP/equipments  # 앱의 응답이 나와야 합니다
  //
  // ── 확인해 볼 것들 ──
  //
  //   ① trust proxy 없이 req.ip 를 찍어 보세요. 127.0.0.1 이 나옵니다.
  //      켜고 다시 보면 내 진짜 IP 가 나옵니다.
  //
  //   ② pm2 stop 앱 을 하고 브라우저를 열어 보세요. 502 가 나옵니다.
  //      /var/log/nginx/error.log 에 "connect() failed" 가 남습니다.
  //
  //   ③ 2MB 짜리 파일을 업로드해 보세요. 413 이 납니다.
  //      client_max_body_size 10M 을 넣고 reload 하면 됩니다.
  //
  //   ④ 보안 그룹에서 3000 을 닫고도 사이트가 되는지 확인하세요.
  //      되면 제대로 된 것입니다.
}

재보기();

// ============================================================
// 정리
// ============================================================
//
//   nginx 를 80 에 두고 3000 으로 넘깁니다. 보안 그룹은 80·443 만 엽니다.
//
//   proxy_set_header 네 줄이 핵심입니다
//     Host / X-Real-IP / X-Forwarded-For / X-Forwarded-Proto
//
//   ★★ 앱에서 app.set("trust proxy", 1) 을 하세요.
//     안 하면 재 본 대로 이렇게 됩니다.
//       모든 사용자의 req.ip 가 127.0.0.1
//       req.protocol 이 https 인데 http 로 보임
//     true 는 쓰지 마세요. 헤더는 누구나 위조할 수 있습니다.
//
//   client_max_body_size 를 업로드 제한보다 크게 (기본 1MB → 413)
//   sudo nginx -t 를 항상 먼저. 틀린 설정으로 reload 하면 사이트가 죽습니다.
//
//   502 는 앱이 안 뜬 것, 413 은 nginx 크기 제한, 504 는 앱이 느린 것
//
//   정적 파일은 nginx 가, 권한이 필요한 파일은 Node 가.
//
// 다음(개념04) 에서 HTTPS 를 붙입니다. 무료입니다.
