// ============================================================
// 07단원 연습문제 — PM2 와 배포
// ------------------------------------------------------------
// 실행: node 연습문제.js
// ============================================================
//
// TODO 자리에 코드를 쓰고, '기대 출력'과 같은지 확인하세요.
// 1~10은 코드로 푸는 문제, 11~15는 [손으로] 답을 적는 문제입니다.
//
// ★ PM2 를 실제로 띄우는 문제가 있습니다. 시간이 좀 걸립니다.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// pm2 를 부르는 도구 (개념01 과 같습니다)
const pm2진입점 = path.join(__dirname, "..", "node_modules", "pm2", "bin", "pm2");

function pm2(...인자) {
  try {
    return execFileSync(process.execPath, [pm2진입점, ...인자],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], cwd: __dirname });
  } catch (에러) {
    return 에러.stdout ?? "";
  }
}

const 상태 = () => JSON.parse(pm2("jlist"));

function 기다리기(밀리초) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 밀리초);
}


// ───── 문제 1 ───── (개념01)
// 서버를 돌리는 방법을 받아 세 가지를 판정하세요. (06단원 문제 10 의 확장)
//   SSH 닫아도 사나 / 죽으면 다시 뜨나 / 재부팅해도 뜨나
//
// 기대 출력:
// node 앱.js: ✗ / ✗ / ✗
// nohup node 앱.js &: ○ / ✗ / ✗
// pm2 start: ○ / ○ / ✗
// pm2 start + startup + save: ○ / ○ / ○

function 판정(방법) {
  // TODO: "○ / ○ / ○" 형태로 돌려주세요
}

// for (const 방법 of ["node 앱.js", "nohup node 앱.js &", "pm2 start", "pm2 start + startup + save"]) {
//   console.log(`${방법}: ${판정(방법)}`);
// }


// ───── 문제 2 ───── (개념01)
// PM2 로 앱을 띄우고, 상태·모드·재시작 횟수를 확인하세요.
// 확인이 끝나면 지우세요.
//
// 기대 출력:
// 프로세스 수: 1
// 상태: online
// 모드: fork_mode
// 재시작: 0
// 지운 뒤: 0

function 문제2() {
  const 폴더 = path.join(os.tmpdir(), "연습2");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  const 앱 = path.join(폴더, "앱.js");
  fs.writeFileSync(앱, 'setInterval(() => {}, 1000);', "utf-8");

  // TODO: pm2 로 "연습앱2" 라는 이름으로 띄우고, 3초 기다린 뒤 확인하세요
  // TODO: 확인이 끝나면 지우고 폴더도 정리하세요
}

// 문제2();


// ───── 문제 3 ───── (개념02)
// 코어 수를 받아 PM2 의 -i 옵션이 몇 개를 띄우는지 계산하세요.
//
// 기대 출력:
// 코어 4개에서 -i 2 → 2개
// 코어 4개에서 -i max → 4개
// 코어 4개에서 -i 0 → 4개
// 코어 4개에서 -i -1 → 3개
// 코어 2개에서 -i max → 2개

function 몇개뜨나(코어수, 옵션) {
  // TODO: 숫자를 돌려주세요
}

// for (const [코어, 옵션] of [[4,"2"],[4,"max"],[4,"0"],[4,"-1"],[2,"max"]]) {
//   console.log(`코어 ${코어}개에서 -i ${옵션} → ${몇개뜨나(코어, 옵션)}개`);
// }


// ───── 문제 4 ───── (개념02)
// 클러스터로 띄우고, 프로세스 수와 인스턴스 번호를 확인하세요.
//
// 기대 출력:
// 프로세스 수: 3
// 모드: cluster_mode
// 인스턴스 번호: 0,1,2
// PID 가 전부 다른가: true

function 문제4() {
  // TODO: -i 3 으로 띄우고 확인한 뒤 지우세요
}

// 문제4();


// ───── 문제 5 ───── (개념02)
// 클러스터에서 정기 작업이 여러 번 도는 문제를 고치세요.
// NODE_APP_INSTANCE 가 "0" 인 프로세스에서만 돌게 하는 함수를 만드세요.
//
// 기대 출력:
// 0번은 도나: true
// 1번은 도나: false
// 3번은 도나: false
// 값이 없으면(fork 모드): true

function 정기작업돌까(인스턴스번호) {
  // TODO: 여기에 코드를 쓰세요
  //       값이 없으면(fork 모드) 도는 게 맞습니다
}

// for (const 번호 of ["0", "1", "3", undefined]) {
//   const 라벨 = 번호 === undefined ? "값이 없으면(fork 모드)" : `${번호}번은`;
//   console.log(`${라벨} 도나: ${정기작업돌까(번호)}`);
// }


// ───── 문제 6 ───── (개념03)
// nginx 가 보낸 헤더를 받아, trust proxy 를 켰을 때와 안 켰을 때
// Express 가 무엇을 보는지 판정하세요.
//
// 기대 출력:
// trust proxy 끔: ip=127.0.0.1 protocol=http
// trust proxy 켬: ip=1.2.3.4 protocol=https

function Express가보는것(헤더, 소켓주소, trustProxy) {
  // TODO: { ip, protocol } 을 돌려주세요
  //       trust proxy 를 켜면 X-Forwarded-* 를 믿고, 끄면 소켓 주소와 http
}

const 온헤더 = { "x-forwarded-for": "1.2.3.4", "x-forwarded-proto": "https" };

// for (const 켬 of [false, true]) {
//   const r = Express가보는것(온헤더, "127.0.0.1", 켬);
//   console.log(`trust proxy ${켬 ? "켬" : "끔"}: ip=${r.ip} protocol=${r.protocol}`);
// }


// ───── 문제 7 ───── (개념03)
// nginx 관련 오류를 받아 어디를 봐야 하는지 알려 주세요.
//
// 기대 출력:
// 502 → 앱이 안 떠 있습니다 (pm2 list)
// 413 → nginx 의 client_max_body_size
// 504 → 앱이 너무 느립니다
// 모든 IP 가 127.0.0.1 → trust proxy 를 켜세요

function nginx진단(증상) {
  // TODO: 여기에 코드를 쓰세요
}

// for (const 증상 of ["502", "413", "504", "모든 IP 가 127.0.0.1"]) {
//   console.log(`${증상} → ${nginx진단(증상)}`);
// }


// ───── 문제 8 ───── (개념05)
// 배포 단계 목록을 받아, set -e 가 있을 때와 없을 때
// 어디까지 실행되는지 보여 주세요.
//
// 기대 출력:
// set -e 없이: git pull, npm ci, migrate, reload (4단계)
// set -e 있이: git pull (1단계)

function 어디까지(단계들, setE) {
  // TODO: { 한것: [이름...], 개수: n } 을 돌려주세요
  //       [이름, 성공하나] 배열을 받습니다
}

const 단계 = [["git pull", false], ["npm ci", true], ["migrate", true], ["reload", true]];

// for (const setE of [false, true]) {
//   const r = 어디까지(단계, setE);
//   console.log(`set -e ${setE ? "있이" : "없이"}: ${r.한것.join(", ")} (${r.개수}단계)`);
// }


// ───── 문제 9 ───── (개념05)
// 배포 스크립트를 검사하는 함수를 만드세요.
// 아래 다섯 가지가 있는지 보고, 없는 것을 알려 주세요.
//
//   set -e (또는 set -euo pipefail)
//   git reset --hard (git pull 이 아니라)
//   npm ci (npm install 이 아니라)
//   pm2 reload (pm2 restart 가 아니라)
//   health 확인 (curl -f)
//
// 기대 출력:
// 좋은 스크립트 → 빠진 것: 없음
// 나쁜 스크립트 → 빠진 것: set -e, git reset --hard, npm ci, pm2 reload, health 확인

function 스크립트검사(내용) {
  // TODO: 빠진 항목 이름 배열을 돌려주세요
}

const 좋은스크립트 = `#!/bin/bash
set -euo pipefail
cd /home/ubuntu/앱
git fetch origin && git reset --hard origin/main
npm ci --omit=dev
pm2 reload 설비api --update-env
sleep 3
curl -fsS http://127.0.0.1:3000/health > /dev/null`;

const 나쁜스크립트 = `#!/bin/bash
cd /home/ubuntu/앱
git pull
npm install
pm2 restart 설비api`;

// console.log("좋은 스크립트 → 빠진 것:", 스크립트검사(좋은스크립트).join(", ") || "없음");
// console.log("나쁜 스크립트 → 빠진 것:", 스크립트검사(나쁜스크립트).join(", "));


// ───── 문제 10 ───── (개념05)
// set -e 가 정말 멈추는지 bash 로 확인하세요.
//
// 기대 출력:
// set -e 있이 끝까지 갔나: false
// set -e 있이 찍힌 것: "1단계"
// set -e 없이 끝까지 갔나: true
// set -e 없이 찍힌 것: "1단계\n2단계"

function 문제10() {
  // TODO: 스크립트 두 개를 만들어 bash 로 실행하고 비교하세요
  //       힌트: execFileSync("bash", [경로], {...}) 를 try/catch 로
}

// 문제10();


// ============================================================
// [손으로] 답을 적어 보는 문제
// ============================================================
//
// ── 문제 11 ── (개념01)
//   pm2 start 로 앱을 띄우고 pm2 startup 도 했습니다.
//   그런데 서버를 재부팅하니 앱이 안 떠 있습니다. 왜일까요?
//
// ── 문제 12 ── (개념02)
//   "매일 자정에 오래된 로그를 지우는" 작업을 setInterval 로 넣었습니다.
//   pm2 start 앱.js -i 4 로 띄웠더니 로그가 이상하게 지워집니다.
//   무엇이 문제이고 어떻게 고치나요?
//
// ── 문제 13 ── (개념03)
//   백엔드 09단원에서 multer 로 5MB 까지 업로드를 허용했습니다.
//   그런데 2MB 파일을 올리는데 413 이 납니다. 앱 로그에는 아무것도 없습니다.
//   원인이 무엇인가요?
//
// ── 문제 14 ── (개념04)
//   HTTPS 를 켠 뒤 브라우저가 "리디렉션이 너무 많습니다" 를 띄웁니다.
//   앱에는 "http 면 https 로 보내는" 미들웨어가 있습니다. 왜 그럴까요?
//
// ── 문제 15 ── (개념05)
//   배포 스크립트가 "배포 끝" 을 찍었는데 사이트가 502 입니다.
//   스크립트의 무엇이 빠졌을까요?


// ============================================================
// EC2 에서 해 볼 것
// ============================================================
//
// □ E1. sudo npm i -g pm2 로 설치하고 앱을 띄우세요
// □ E2. pm2 startup 과 pm2 save 를 하고 **실제로 재부팅해서** 확인하세요
// □ E3. pm2 install pm2-logrotate 를 하세요
// □ E4. -i 2 로 띄우고 /whoami 를 여러 번 불러 PID 가 번갈아 나오는지 보세요
// □ E5. 부하를 주면서 pm2 reload 와 pm2 restart 를 각각 해 보고 비교하세요
// □ E6. nginx 를 설치하고 80 → 3000 으로 넘기세요. 3000 은 보안 그룹에서 닫으세요
// □ E7. trust proxy 를 껐다 켜면서 req.ip 를 확인하세요
// □ E8. 2MB 파일을 올려 413 을 만들고, client_max_body_size 로 고치세요
// □ E9. 배포 스크립트를 만들고 npm run 배포 로 부를 수 있게 하세요
// □ E10. ★ 실습이 끝나면 인스턴스를 종료하세요 (06단원 개념01)
