// ============================================================
// 09단원 연습문제 — 종합 배포
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~8은 코드로 푸는 문제, 9~12는 [손으로] 답을 적는 문제입니다.
//
// ★ 마지막의 '직접 배포하기' 가 이 과정의 마무리입니다.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { 점검하기, 코드만남기기, 파일들찾기 } = require("./배포점검");


// ───── 문제 1 ───── (개념01)
// 요청이 지나가는 여덟 곳 중, 증상을 보고 어디부터 봐야 하는지 답하세요.
//
// 기대 출력:
// 오래 기다리다 실패 → DNS·보안그룹
// 502 → 앱(PM2)
// 504 → 앱이 느림
// 목록이 비어 있음 → DB 권한(RLS)
// 사진만 안 보임 → S3

function 어디부터(증상) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 증상 of ["오래 기다리다 실패", "502", "504", "목록이 비어 있음", "사진만 안 보임"]) {
//   console.log(`${증상} → ${어디부터(증상)}`);
// }


// ───── 문제 2 ───── (개념01)
// 상태를 어디에 두는지 판정하세요.
//
// 기대 출력:
// 코드 → git (서버 밖)
// 자료 → Supabase (서버 밖)
// 파일 → S3 (서버 밖)
// 설정 → 서버의 .env
// 로그 → 서버 (임시)
// 세션 → 서버 밖 (메모리에 두면 안 됨)

function 어디에두나(무엇) {
  // TODO
}

// for (const 무엇 of ["코드", "자료", "파일", "설정", "로그", "세션"]) {
//   console.log(`${무엇} → ${어디에두나(무엇)}`);
// }


// ───── 문제 3 ───── (개념02)
// 배포점검을 돌려서 막음이 몇 건인지 세는 함수를 만드세요.
// 막음이 있으면 배포를 막아야 합니다.
//
// 기대 출력:
// 나쁜 앱: 막음 있음 → 배포 막힘
// 고친 앱: 막음 없음 → 배포 가능

function 배포해도되나(폴더) {
  // TODO: "막음 있음 → 배포 막힘" 또는 "막음 없음 → 배포 가능" 을 돌려주세요
}

function 문제3() {
  const 폴더 = path.join(os.tmpdir(), "연습3");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  // 나쁜 앱
  fs.writeFileSync(path.join(폴더, "package.json"), '{ "name": "x" }', "utf-8");
  fs.writeFileSync(path.join(폴더, ".env"), "PORT=3000", "utf-8");
  fs.writeFileSync(path.join(폴더, ".gitignore"), "node_modules/", "utf-8");

  // console.log("나쁜 앱:", 배포해도되나(폴더));

  // 고치기
  fs.writeFileSync(path.join(폴더, ".gitignore"), "node_modules/\n.env\n", "utf-8");
  fs.writeFileSync(path.join(폴더, "package-lock.json"), "{}", "utf-8");

  // console.log("고친 앱:", 배포해도되나(폴더));

  fs.rmSync(폴더, { recursive: true, force: true });
}


// ───── 문제 4 ───── (개념02)
// 배포점검에 더할 **검출 함수**를 하나 만드세요.
//   "console.log 로 설정을 통째로 찍나" — 심각도 경고
//   (이 함수를 항목 객체로 감싸 항목들 에 넣는 모양은 개념05 8번 절에 있습니다.
//    여기서는 함수만 만들면 됩니다)
//
// 기대 출력:
// 찍는 코드: 1건
// 안 찍는 코드: 0건

function 설정찍나(뿌리) {
  // TODO: 문제가 있으면 설명 배열을, 없으면 빈 배열을 돌려주세요
}

function 문제4() {
  const 폴더 = path.join(os.tmpdir(), "연습4");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  fs.writeFileSync(path.join(폴더, "나쁨.js"), "console.log(설정);", "utf-8");
  // console.log("찍는 코드:", 설정찍나(폴더).length + "건");

  fs.writeFileSync(path.join(폴더, "나쁨.js"), "console.log(설정.포트);", "utf-8");
  // console.log("안 찍는 코드:", 설정찍나(폴더).length + "건");

  fs.rmSync(폴더, { recursive: true, force: true });
}


// ───── 문제 5 ───── (개념03)
// 서버 준비 스크립트를 만들고 bash -n 으로 문법을 검사하세요.
// 여러 번 실행해도 되게 만들어야 합니다.
//
// 기대 출력:
// 문법: 통과
// set -e 있나: true
// 스왑을 if 로 감쌌나: true
// fstab 을 if 안에서 건드리나: true

function 준비스크립트만들기() {
  // TODO: 스크립트 문자열을 돌려주세요
}

function 문제5() {
  // TODO: 파일로 쓰고 bash -n 으로 검사한 뒤 위 네 가지를 확인하세요
}


// ───── 문제 6 ───── (개념04)
// 배포 스크립트를 검사하는 함수를 만드세요.
// 일곱 가지가 있는지 봅니다.
//   ★ set -e 는 set -o errexit 로도 씁니다. 둘 다 잡아야 오탐이 안 납니다.
//   ★ pipefail 은 -e 에 안 들어 있습니다. 따로 봐야 합니다.
//
// 기대 출력:
// 좋은 배포 → 없음
// 나쁜 배포 → set -e, pipefail, git reset --hard, npm ci, pm2 reload, health 확인, 되돌릴 지점 기억

function 스크립트검사(내용) {
  // TODO: 빠진 항목 이름 배열을 돌려주세요
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

// console.log("좋은 배포 →", 스크립트검사(좋은배포).join(", ") || "없음");
// console.log("나쁜 배포 →", 스크립트검사(나쁜배포).join(", "));


// ───── 문제 7 ───── (개념04)
// 배포 단계의 순서가 맞는지 판정하세요.
//
// 기대 출력:
// 맞는 순서: true
// 마이그레이션이 reload 뒤: false
// health 확인이 없음: false
// 점검이 코드 받기 전: false

function 순서맞나(단계들) {
  // TODO: true / false 를 돌려주세요
  //       규칙: 코드받기 < 점검, 마이그레이션 < reload, reload < health확인
  //             그리고 health확인이 반드시 있어야 합니다
}

const 순서들 = [
  ["맞는 순서", ["코드받기", "점검", "npm ci", "마이그레이션", "reload", "health확인"]],
  ["마이그레이션이 reload 뒤", ["코드받기", "점검", "reload", "마이그레이션", "health확인"]],
  ["health 확인이 없음", ["코드받기", "점검", "마이그레이션", "reload"]],
  ["점검이 코드 받기 전", ["점검", "코드받기", "마이그레이션", "reload", "health확인"]],
];

// for (const [이름, 단계들] of 순서들) {
//   console.log(`${이름}: ${순서맞나(단계들)}`);
// }


// ───── 문제 8 ───── (개념05)
// 사고가 났을 때 좁히는 순서를 만드세요.
// 각 단계에서 "되면 다음, 안 되면 거기가 원인" 입니다.
//
// 기대 출력:
// DNS 부터 안 됨 → DNS
// 밖에서 안 닿음 → 보안그룹
// nginx 는 답하는데 앱이 안 됨 → 앱
// 앱은 답하는데 DB 가 안 됨 → DB
// 전부 됨 → 원인 못 찾음

function 좁히기(결과) {
  // TODO: 결과는 { dns, 밖에서, nginx, 앱, DB } 형태의 true/false 입니다
}

const 경우들 = [
  ["DNS 부터 안 됨", { dns: false, 밖에서: false, nginx: false, 앱: false, DB: false }],
  ["밖에서 안 닿음", { dns: true, 밖에서: false, nginx: false, 앱: false, DB: false }],
  ["nginx 는 답하는데 앱이 안 됨", { dns: true, 밖에서: true, nginx: true, 앱: false, DB: false }],
  ["앱은 답하는데 DB 가 안 됨", { dns: true, 밖에서: true, nginx: true, 앱: true, DB: false }],
  ["전부 됨", { dns: true, 밖에서: true, nginx: true, 앱: true, DB: true }],
];

// for (const [이름, 결과] of 경우들) {
//   console.log(`${이름} → ${좁히기(결과)}`);
// }


// ============================================================
// 실행
// ============================================================

function 실행() {
  // 문제3();
  // 문제4();
  // 문제5();
}

실행();


// ============================================================
// [손으로] 답을 적어 보는 문제
// ============================================================
//
// ── 문제 9 ── (개념01)
//   "왜 SQLite 와 로컬 파일로 다 하면 안 되나요?" 라는 질문에
//   서버를 늘릴 때·배포할 때·서버가 죽을 때 각각 무슨 일이 생기는지 답하세요.
//   그리고 SQLite 가 오히려 나은 경우도 하나 쓰세요.
//
// ── 문제 10 ── (개념02)
//   배포점검에서 "SQL 에 이름을 이어 붙이나" 를 '막음' 이 아니라
//   '참고' 로 둔 이유를 설명하세요.
//   그리고 그런 항목을 '막음' 으로 만들면 무슨 일이 생기는지 쓰세요.
//
// ── 문제 11 ── (개념04)
//   배포하고 나서 사이트가 안 됩니다. 되돌렸는데도 여전히 안 됩니다.
//   무엇을 의심해야 하나요? 세 가지를 쓰세요.
//
// ── 문제 12 ── (개념05)
//   pm2 list 를 보니 앱이 online 인데 재시작 수(↺)가 847 입니다.
//   서비스는 되고 있습니다. 무엇이 문제이고 어떻게 찾나요?


// ============================================================
// ★★★ 직접 배포하기 — 이 과정의 마무리
// ============================================================
//
// 지금까지 배운 것을 전부 이어서 한 번 배포합니다.
// 04단원의 서버를 05단원의 Supabase와 08단원의 S3에 붙여서 올립니다.
//
// ── 준비 (한 번만) ──
//
// □ P1. AWS 계정 안전장치 (06단원 개념01)
//        MFA · 예산 알림 1달러 · IAM 사용자 · 리전 서울
// □ P2. Supabase 프로젝트와 표 (05단원)
//        equipments 표 · RLS 켜기 · 정책 만들기
// □ P3. S3 버킷과 IAM (08단원 개념02)
//        퍼블릭 차단 켠 채로 · 그 버킷만 허용하는 정책
// □ P4. SSH 키 (06단원 개념03)
//        ssh-keygen -t ed25519 · AWS 에 공개키 가져오기
//
// ── 서버 만들기 ──
//
// □ S1. EC2 t3.micro / Ubuntu LTS (06단원 개념04)
//        보안 그룹: 22 는 내 IP, 80·443 만
//        사용자 데이터에 서버준비.sh (09단원 개념03)
// □ S2. 탄력적 IP 붙이기
// □ S3. SSH 접속해서 node -v 와 free -h 확인
//
// ── 앱 올리기 ──
//
// □ A1. git clone 하고 npm ci (06단원 개념05)
// □ A2. .env 만들고 chmod 600 (01단원)
// □ A3. PM2 로 띄우고 startup + save (07단원 개념01)
// □ A4. ★ 실제로 재부팅해서 확인
// □ A5. nginx 설정하고 3000 을 보안 그룹에서 닫기 (07단원 개념03)
// □ A6. trust proxy 확인 — req.ip 가 내 IP 로 나오나
//
// ── HTTPS (도메인이 있으면) ──
//
// □ H1. DNS A 레코드 (07단원 개념04)
// □ H2. 보안 그룹에 443 열기
// □ H3. certbot --nginx
// □ H4. certbot renew --dry-run 통과 확인
//
// ── 배포 자동화 ──
//
// □ D1. 배포.sh · 되돌리기.sh 를 저장소에 (09단원 개념04)
// □ D2. package.json 에 npm run 배포·되돌리기·로그·상태
// □ D3. ★ 일부러 깨진 코드를 배포해서 health 확인이 막는지 보기
// □ D4. ★ 되돌리기를 실제로 한 번 해 보기
//
// ── 확인 ──
//
// □ C1. 브라우저에서 https 로 열리나
// □ C2. 사진을 올리고 다시 보이나 (S3)
// □ C3. 자료가 남아 있나 (Supabase)
// □ C4. curl 로 RLS 가 막는지 (05단원 개념04)
// □ C5. 배포점검이 통과하나
//
// ── 정리 ──
//
// □ E1. ★ 인스턴스 종료 · 탄력적 IP 해제 · S3 파일 삭제
//
// ★★★ E1 을 꼭 하세요.
//   개념03 의 스크립트가 있으면 다시 만드는 데 5분입니다.
//   그걸 한 번 겪어 보는 것이 이 과정의 마지막 배움입니다.
