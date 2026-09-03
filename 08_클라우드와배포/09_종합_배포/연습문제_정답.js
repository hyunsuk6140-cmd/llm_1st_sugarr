// ============================================================
// 09단원 연습문제 정답 — 종합 배포
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { 점검하기, 코드만남기기, 파일들찾기 } = require("./배포점검");


// ───── 문제 1 ─────
function 어디부터(증상) {
  const 표 = {
    "오래 기다리다 실패": "DNS·보안그룹",
    "502": "앱(PM2)",
    "504": "앱이 느림",
    "목록이 비어 있음": "DB 권한(RLS)",
    "사진만 안 보임": "S3",
  };

  return 표[증상] ?? "모르겠습니다";
}

for (const 증상 of ["오래 기다리다 실패", "502", "504", "목록이 비어 있음", "사진만 안 보임"]) {
  console.log(`${증상} → ${어디부터(증상)}`);
}
// 출력: 오래 기다리다 실패 → DNS·보안그룹
// 출력: 502 → 앱(PM2)
// 출력: 504 → 앱이 느림
// 출력: 목록이 비어 있음 → DB 권한(RLS)
// 출력: 사진만 안 보임 → S3

// ★★ 첫 줄과 둘째 줄의 차이가 핵심입니다.
//
//   "오래 기다리다 실패" 는 패킷이 아예 안 갔다는 뜻입니다 (timed out).
//   중간에서 막혔습니다. 서버 안은 볼 필요가 없습니다.
//
//   502 는 nginx 까지는 갔다는 뜻입니다. nginx 가 답한 것이니까요.
//   앱이 안 떠 있습니다. pm2 list 를 보세요.
//
//   06단원의 refused / timed out 구분이 여기까지 이어집니다.
//
// ★★★ "목록이 비어 있음" 이 제일 헷갈립니다.
//   오류가 안 나고 로그도 조용합니다. (05단원 개념04 에서 확인했습니다)
//   RLS 로 읽기가 막히면 **빈 배열**이 옵니다.
//   코드를 아무리 봐도 안 보입니다. Supabase 쪽을 먼저 보세요.


// ───── 문제 2 ─────
function 어디에두나(무엇) {
  const 표 = {
    코드: "git (서버 밖)",
    자료: "Supabase (서버 밖)",
    파일: "S3 (서버 밖)",
    설정: "서버의 .env",
    로그: "서버 (임시)",
    세션: "서버 밖 (메모리에 두면 안 됨)",
  };

  return 표[무엇] ?? "?";
}

for (const 무엇 of ["코드", "자료", "파일", "설정", "로그", "세션"]) {
  console.log(`${무엇} → ${어디에두나(무엇)}`);
}
// 출력: 코드 → git (서버 밖)
// 출력: 자료 → Supabase (서버 밖)
// 출력: 파일 → S3 (서버 밖)
// 출력: 설정 → 서버의 .env
// 출력: 로그 → 서버 (임시)
// 출력: 세션 → 서버 밖 (메모리에 두면 안 됨)

// ★★★ 서버에 남는 것은 **설정과 로그뿐**입니다.
//
//   그래서 서버를 버릴 수 있습니다.
//   .env 만 다시 만들면 5분 안에 같은 서버가 됩니다. (개념03)
//
// ★★ 세션이 중요합니다.
//   메모리에 두면 PM2 클러스터에서 프로세스마다 따로가 됩니다. (07단원 개념02)
//   로그인했는데 새로고침하면 풀립니다.
//   토큰(JWT) 을 쓰거나 DB·Redis 에 두세요.
//
// ★ 로그는 서버에 남습니다. 그래서 서버를 버리면 로그도 사라집니다.
//   중요한 로그는 밖으로 보내야 합니다. (개념05)


// ───── 문제 3 ─────
function 배포해도되나(폴더) {
  const 결과 = 점검하기(폴더);
  return 결과.막음.length > 0 ? "막음 있음 → 배포 막힘" : "막음 없음 → 배포 가능";
}

function 문제3() {
  const 폴더 = path.join(os.tmpdir(), "연습3");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  fs.writeFileSync(path.join(폴더, "package.json"), '{ "name": "x" }', "utf-8");
  fs.writeFileSync(path.join(폴더, ".env"), "PORT=3000", "utf-8");
  fs.writeFileSync(path.join(폴더, ".gitignore"), "node_modules/", "utf-8");

  console.log("나쁜 앱:", 배포해도되나(폴더));
  // 출력: 나쁜 앱: 막음 있음 → 배포 막힘

  fs.writeFileSync(path.join(폴더, ".gitignore"), "node_modules/\n.env\n", "utf-8");
  fs.writeFileSync(path.join(폴더, "package-lock.json"), "{}", "utf-8");

  console.log("고친 앱:", 배포해도되나(폴더));
  // 출력: 고친 앱: 막음 없음 → 배포 가능

  fs.rmSync(폴더, { recursive: true, force: true });

  문제4();
}

// ★★ 두 가지를 고쳤습니다.
//   .gitignore 에 .env 추가 — 01단원
//   package-lock.json 만들기 — 06단원 (npm ci 를 쓰려면 필요합니다)
//
// ★ 이걸 배포 스크립트에 넣으면 자동으로 막힙니다.
//     node 배포/배포점검.js .
//   막음이 있으면 종료 코드 1 이고, set -e 가 배포를 멈춥니다.


// ───── 문제 4 ─────
function 설정찍나(뿌리) {
  const 문제 = [];

  for (const 파일 of 파일들찾기(뿌리)) {
    const 소스 = fs.readFileSync(파일, "utf-8");
    const 코드 = 코드만남기기(소스);

    // 설정 객체를 통째로 찍는 경우만 (설정.포트 같은 건 괜찮습니다)
    if (/console\.log\s*\(\s*설정\s*\)/.test(코드)) {
      문제.push(`${path.relative(뿌리, 파일)} — 설정에 비밀 값이 들어 있습니다`);
    }
  }

  return 문제;
}

function 문제4() {
  const 폴더 = path.join(os.tmpdir(), "연습4");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  fs.writeFileSync(path.join(폴더, "나쁨.js"), "console.log(설정);", "utf-8");
  console.log("찍는 코드:", 설정찍나(폴더).length + "건");
  // 출력: 찍는 코드: 1건

  fs.writeFileSync(path.join(폴더, "나쁨.js"), "console.log(설정.포트);", "utf-8");
  console.log("안 찍는 코드:", 설정찍나(폴더).length + "건");
  // 출력: 안 찍는 코드: 0건

  fs.rmSync(폴더, { recursive: true, force: true });

  문제5();
}

// ★★ 정규식을 좁게 잡은 게 중요합니다.
//
//   /console\.log\(설정\)/     통째로 찍는 것만 잡습니다
//   /console\.log\(설정/       설정.포트 까지 잡힙니다 ← 오탐
//
//   \s* 로 공백을 허용하고, 뒤에 \s*\) 를 요구해서
//   "설정" 하나만 인자로 준 경우만 잡습니다.
//
// ★★★ 코드만남기기 를 쓴 이유
//   주석에 "console.log(설정) 을 하지 마세요" 라고 적어 두면
//   그것까지 잡힙니다. 실제로 이 자료가 그런 문장을 여러 번 씁니다.
//   도구를 만들 때 늘 만나는 문제입니다. (개념02)
//
// ★ 이 함수를 배포점검.js 에 **항목으로 등록**하려면 감싸기만 하면 됩니다.
//   배포점검.js 를 열어 항목들 배열에 이렇게 한 칸을 더합니다.
//
//     {
//       이름: "console.log 로 설정을 통째로 찍나",
//       단원: "08",
//       심각도: "경고",
//       보기: 설정찍나,
//     },
//
//   개념05 8번 절의 모양 그대로입니다.
//   여기서는 검출 함수만 확인하려고 등록은 안 했습니다.
//   (등록하면 앞의 문제 3 이 쓰는 점검하기 결과까지 같이 바뀝니다)


// ───── 문제 5 ─────
function 준비스크립트만들기() {
  return `#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git nginx

timedatectl set-timezone Asia/Seoul

if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

if ! command -v node > /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
`;
}

function 문제5() {
  const 폴더 = path.join(os.tmpdir(), "연습5");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  const 내용 = 준비스크립트만들기();
  const 경로 = path.join(폴더, "준비.sh");
  fs.writeFileSync(경로, 내용, "utf-8");

  let 문법;
  try {
    execFileSync("bash", ["-n", 경로], { stdio: ["ignore", "pipe", "pipe"] });
    문법 = "통과";
  } catch (에러) {
    문법 = "오류";
  }

  console.log("문법:", 문법);
  // 출력: 문법: 통과
  console.log("set -e 있나:", /set\s+-[a-z]*e/.test(내용));
  // 출력: set -e 있나: true
  console.log("스왑을 if 로 감쌌나:", /if\s+\[\s+!\s+-f\s+\/swapfile\s+\]/.test(내용));
  // 출력: 스왑을 if 로 감쌌나: true

  // fstab 을 건드리는 줄이 if 블록 안에 있는지
  const fstab줄 = 내용.split("\n").findIndex((줄) => /\/etc\/fstab/.test(줄));
  const if줄 = 내용.split("\n").findIndex((줄) => /if\s+\[\s+!\s+-f\s+\/swapfile/.test(줄));
  const fi줄 = 내용.split("\n").findIndex((줄, 자리) => 줄.trim() === "fi" && 자리 > if줄);

  console.log("fstab 을 if 안에서 건드리나:", if줄 < fstab줄 && fstab줄 < fi줄);
  // 출력: fstab 을 if 안에서 건드리나: true

  fs.rmSync(폴더, { recursive: true, force: true });

  문제6();
}

// ★★★ fstab 확인이 이 문제의 핵심입니다.
//
//   if 밖에 두면 스크립트를 돌릴 때마다 같은 줄이 하나씩 늘어납니다.
//   재부팅할 때 같은 스왑을 여러 번 켜려 하고, 운이 나쁘면 부팅이 안 됩니다.
//   그러면 SSH 로도 못 들어갑니다. 인스턴스를 새로 만들어야 합니다.
//
//   ★ 서버에서 확인: grep -c swapfile /etc/fstab 이 1 이어야 합니다.
//
// ★★ DEBIAN_FRONTEND=noninteractive 를 빼먹으면
//   apt 가 "설정 파일을 바꿀까요?" 하고 물어보다가 영원히 멈춥니다.
//   사용자 데이터로 돌 때는 대답할 사람이 없습니다.
//
// ★ command -v node 로 이미 있으면 건너뜁니다.
//   04단원 개념02 의 "여러 번 해도 같다" 와 같은 생각입니다.


// ───── 문제 6 ─────
function 스크립트검사(내용) {
  const 검사들 = [
    // ★ set -e 와 set -o errexit 는 같은 뜻입니다. 둘 다 봐야 오탐이 안 납니다.
    ["set -e", /set\s+-[a-z]*e|set\s+-o\s+errexit/],
    // ★★ pipefail 은 -e 에 안 들어 있습니다. 따로 봅니다.
    ["pipefail", /set\s+-[a-zA-Z]*o\s+pipefail/],
    ["git reset --hard", /git\s+reset\s+--hard/],
    ["npm ci", /npm\s+ci/],
    ["pm2 reload", /pm2\s+reload/],
    // ★ curl 은 -f 와 --fail 이 같습니다.
    ["health 확인", /curl\s+-[a-zA-Z]*f|curl\s+--fail/],
    ["되돌릴 지점 기억", /rev-parse|이전커밋/],
  ];

  return 검사들.filter(([, 무늬]) => !무늬.test(내용)).map(([이름]) => 이름);
}

const 좋은배포 = `#!/bin/bash
set -euo pipefail
cd /home/ubuntu/앱
PREV_SHA=$(git rev-parse HEAD)
git fetch origin && git reset --hard origin/main
npm ci --omit=dev
pm2 reload 앱 --update-env
sleep 3
curl -fsS http://127.0.0.1:3000/health > /dev/null`;

const 나쁜배포 = `#!/bin/bash
cd /home/ubuntu/앱
git pull
npm install
pm2 restart 앱`;

function 문제6() {
  console.log("좋은 배포 →", 스크립트검사(좋은배포).join(", ") || "없음");
  // 출력: 좋은 배포 → 없음
  console.log("나쁜 배포 →", 스크립트검사(나쁜배포).join(", "));
  // 출력: 나쁜 배포 → set -e, pipefail, git reset --hard, npm ci, pm2 reload, health 확인, 되돌릴 지점 기억

  // ★★ 나쁜 배포도 **평소에는 잘 됩니다.**
  //   git pull 이 성공하고, npm install 이 성공하고, restart 가 성공하면
  //   결과는 같습니다.
  //
  //   차이는 **뭔가 잘못됐을 때** 나옵니다.
  //     git pull 이 충돌로 실패해도 계속 갑니다
  //     npm install 이 다른 버전을 깝니다
  //     restart 가 클러스터를 다 죽입니다
  //     앱이 안 떠도 "완료" 라고 나옵니다
  //     되돌릴 지점을 모릅니다
  //
  //   잘 될 때가 아니라 안 될 때로 판단하세요.

  문제7();
}


// ───── 문제 7 ─────
function 순서맞나(단계들) {
  const 자리 = (이름) => 단계들.indexOf(이름);

  if (자리("health확인") < 0) return false;

  const 규칙들 = [
    ["코드받기", "점검"],
    ["마이그레이션", "reload"],
    ["reload", "health확인"],
  ];

  return 규칙들.every(([먼저, 나중]) => {
    const a = 자리(먼저);
    const b = 자리(나중);
    if (a < 0 || b < 0) return true; // 둘 중 하나가 없으면 이 규칙은 넘어갑니다
    return a < b;
  });
}

const 순서들 = [
  ["맞는 순서", ["코드받기", "점검", "npm ci", "마이그레이션", "reload", "health확인"]],
  ["마이그레이션이 reload 뒤", ["코드받기", "점검", "reload", "마이그레이션", "health확인"]],
  ["health 확인이 없음", ["코드받기", "점검", "마이그레이션", "reload"]],
  ["점검이 코드 받기 전", ["점검", "코드받기", "마이그레이션", "reload", "health확인"]],
];

function 문제7() {
  for (const [이름, 단계들] of 순서들) {
    console.log(`${이름}: ${순서맞나(단계들)}`);
  }
  // 출력: 맞는 순서: true
  // 출력: 마이그레이션이 reload 뒤: false
  // 출력: health 확인이 없음: false
  // 출력: 점검이 코드 받기 전: false

  // ★★ 각 규칙의 이유
  //
  //   코드받기 < 점검
  //     받기 전에 점검하면 **옛 코드**를 점검합니다. 아무 의미가 없습니다.
  //
  //   마이그레이션 < reload
  //     새 코드가 새 칸을 찾는데 없으면 500 입니다.
  //     칸을 먼저 만들고 코드를 바꿔야 합니다.
  //
  //   reload < health확인
  //     바꾸기 전에 확인하면 옛 코드가 답합니다. 당연히 통과합니다.
  //
  // ★★★ health확인이 없으면 무조건 false 로 했습니다.
  //   순서가 아무리 맞아도 확인이 없으면 배포한 게 아닙니다. (07단원 개념05)

  문제8();
}


// ───── 문제 8 ─────
function 좁히기(결과) {
  if (!결과.dns) return "DNS";
  if (!결과.밖에서) return "보안그룹";
  if (!결과.nginx) return "nginx";
  if (!결과.앱) return "앱";
  if (!결과.DB) return "DB";
  return "원인 못 찾음";
}

const 경우들 = [
  ["DNS 부터 안 됨", { dns: false, 밖에서: false, nginx: false, 앱: false, DB: false }],
  ["밖에서 안 닿음", { dns: true, 밖에서: false, nginx: false, 앱: false, DB: false }],
  ["nginx 는 답하는데 앱이 안 됨", { dns: true, 밖에서: true, nginx: true, 앱: false, DB: false }],
  ["앱은 답하는데 DB 가 안 됨", { dns: true, 밖에서: true, nginx: true, 앱: true, DB: false }],
  ["전부 됨", { dns: true, 밖에서: true, nginx: true, 앱: true, DB: true }],
];

function 문제8() {
  for (const [이름, 결과] of 경우들) {
    console.log(`${이름} → ${좁히기(결과)}`);
  }
  // 출력: DNS 부터 안 됨 → DNS
  // 출력: 밖에서 안 닿음 → 보안그룹
  // 출력: nginx 는 답하는데 앱이 안 됨 → 앱
  // 출력: 앱은 답하는데 DB 가 안 됨 → DB
  // 출력: 전부 됨 → 원인 못 찾음

  // ★★★ **바깥에서 안으로** 순서대로 봅니다.
  //   처음 안 되는 곳이 원인입니다. 그 뒤는 볼 필요가 없습니다.
  //
  //   실제 명령으로는 이렇습니다.
  //     nslookup 내도메인.com                        → dns
  //     curl -I https://내도메인.com                 → 밖에서
  //     (서버에서) curl -I localhost                 → nginx
  //     (서버에서) curl localhost:3000/health        → 앱
  //     pm2 logs 에서 DB 오류 확인                    → DB
  //
  //   다섯 번이면 어디인지 나옵니다.
  //
  // ★★ "전부 됨" 인데 사용자는 안 된다고 하면
  //   · 특정 사용자만 그런가 (RLS·권한)
  //   · 특정 화면만 그런가 (그 API 만 확인)
  //   · 캐시나 CDN 문제인가
  //   · 사용자의 네트워크 문제인가
  //   를 봐야 합니다. 이때가 제일 어렵습니다.
}


// ============================================================
// 실행
// ============================================================

문제3();


// ============================================================
// [손으로] 문제 정답
// ============================================================
//
// ── 문제 9 ──
//
//   **서버를 늘릴 때**
//     SQLite 파일이 서버마다 따로 생깁니다.
//     A 에 저장한 것을 B 가 못 봅니다.
//     사용자에게는 "새로고침하면 있다 없다 한다" 로 나타납니다.
//     업로드 파일도 마찬가지입니다. (05단원 개념01, 08단원 개념01 에서 확인)
//
//   **배포할 때**
//     요즘 배포 방식(컨테이너 등) 은 컴퓨터를 통째로 바꿉니다.
//     그 안의 파일이 사라집니다. 배포할 때마다 자료가 0 이 됩니다.
//     EC2 에 직접 올리면 디스크가 남아서 괜찮지만,
//     그러면 **서버를 못 버립니다.** 계속 그 컴퓨터를 지켜야 합니다.
//
//   **서버가 죽을 때**
//     자료도 같이 죽습니다. 백업을 직접 해 뒀어야 합니다.
//     백업을 같은 서버에 뒀다면 그것도 같이 사라집니다.
//
//   ★ SQLite 가 오히려 나은 경우
//     · 서버가 한 대고 앞으로도 한 대일 때 (사내 도구, 개인 프로젝트)
//     · 읽기가 압도적으로 많을 때 (블로그, 문서 사이트)
//     · 응답이 아주 빨라야 할 때 — 네트워크 왕복이 없습니다
//     · 데스크톱·모바일 앱 안에 넣을 때
//
//     05단원 개념01 에서 정리한 그대로입니다.
//     "클라우드가 항상 낫다" 가 아닙니다. 필요가 다른 것입니다.
//
// ── 문제 10 ──
//
//   **칸 이름을 이어 붙이는 것 자체는 잘못이 아니기 때문입니다.**
//
//   04단원 개념04 에서 이렇게 가르쳤습니다.
//
//     const 정렬가능 = { id: "id", name: "name" };
//     const 칸 = 정렬가능[sort] ?? "id";
//     db.prepare(`SELECT * FROM 설비 ORDER BY ${칸}`)
//
//   허용 목록으로 걸렀으니 안전합니다. 값은 여전히 ? 로 갑니다.
//   칸 이름은 자리표시자로 못 넘기니 이 방법밖에 없습니다.
//
//   도구는 "허용 목록으로 걸렀는지" 를 판단할 수 없습니다.
//   그건 사람이 봐야 합니다. 그래서 '참고' 입니다.
//
//   ★★ '막음' 으로 만들면 무슨 일이 생기나
//
//     정상적인 코드가 배포를 막습니다.
//     사람들이 "이 도구 왜 이래" 하면서 **꺼 버립니다.**
//     그러면 진짜 문제(값을 이어 붙인 것) 도 같이 안 보게 됩니다.
//
//     오탐이 많은 도구는 안 쓰게 됩니다. 그게 제일 나쁩니다.
//     그래서 '막음' 은 **확실한 것만** 넣어야 합니다.
//
//   ★ 실제로 이 도구를 만들면서 그 오탐이 났고, 고쳤습니다. (개념02)
//
// ── 문제 11 ──
//
//   코드는 확실히 예전 것으로 돌아갔습니다. 그런데도 안 된다면
//   **코드 밖**에 원인이 있습니다. 세 가지를 의심하세요.
//
//   ① **마이그레이션**
//      DB 구조가 바뀐 채로 남아 있습니다. 코드만 되돌렸으니까요.
//      옛 코드가 없어진 칸을 찾거나, 바뀐 타입에 걸릴 수 있습니다.
//      ★ 그래서 마이그레이션은 뒤로 호환되게 만들어야 합니다.
//        (04단원 개념02, 07단원 개념05, 09단원 개념04)
//
//   ② **.env 나 외부 설정**
//      새 코드를 위해 .env 를 고쳤을 수 있습니다.
//      Supabase 의 RLS 정책이나 S3 의 IAM 정책을 바꿨을 수도 있습니다.
//      그건 git 에 없으니 되돌려지지 않습니다.
//
//   ③ **외부 서비스**
//      코드와 무관하게 Supabase 나 S3 가 안 되는 것일 수 있습니다.
//      배포와 우연히 겹친 것입니다.
//      → 상태 페이지를 확인하고, health 가 DB 까지 보는지 확인하세요.
//
//   ★ 그래서 되돌리기 스크립트의 마지막 메시지가
//     "되돌렸는데도 안 되면 DB 나 설정을 보세요" 인 것입니다. (개념04)
//     그 한 줄이 사람을 엉뚱한 데서 헤매지 않게 합니다.
//
// ── 문제 12 ──
//
//   **앱이 반복해서 죽고 PM2 가 계속 살리고 있습니다.**
//
//   서비스는 됩니다. 그래서 아무도 모릅니다.
//   그런데 죽는 순간마다 처리 중이던 요청은 실패합니다.
//   847번이면 847번 이상 사용자가 오류를 봤습니다.
//
//   ★ 찾는 순서
//
//     ① pm2 logs 설비api --lines 200 --err
//        죽기 직전 로그를 봅니다. 같은 오류가 반복되면 그게 원인입니다.
//
//     ② free -h 와 sudo dmesg -T | grep -i oom
//        메모리 부족으로 커널이 죽인 것인지 봅니다. (06단원 개념04)
//        t3.micro 는 1GB 라 흔합니다. 스왑이 있는지도 확인하세요.
//        ★ Ubuntu 는 기본이 kernel.dmesg_restrict=1 이라
//          일반 사용자가 그냥 dmesg 를 못 씁니다. sudo 를 붙이거나
//          journalctl -k | grep -i oom 을 쓰세요. (-T 는 시각 표시)
//
//     ③ pm2 describe 설비api
//        메모리 사용량이 계속 오르는지 봅니다.
//        max_memory_restart 에 걸려서 재시작되는 것일 수 있습니다.
//        그러면 메모리 누수입니다. (07단원 개념01)
//
//     ④ 처리 못 한 예외
//        Promise 를 catch 안 한 것이 있으면 프로세스가 죽습니다.
//        (Node 는 처리 못 한 Promise 실패를 기본으로 프로세스 종료로 다룹니다)
//
//          process.on("unhandledRejection", (에러) => {
//            console.error("처리 못 한 Promise 실패", 에러);
//          });
//
//        이걸 넣어 두면 로그에 남아서 찾을 수 있습니다.
//
//   ★★ 미리 알아채는 법
//     pm2 list 의 ↺ 숫자를 가끔 보세요. (개념05)
//     또는 재시작 수가 갑자기 늘면 알려 주는 감시를 붙이세요.
//
//   ★★★ "살아나니까 괜찮다" 가 아닙니다.
//     PM2 는 시간을 벌어 줄 뿐입니다. 원인은 그대로입니다.
//     그 사이 사용자는 계속 실패를 봅니다.
