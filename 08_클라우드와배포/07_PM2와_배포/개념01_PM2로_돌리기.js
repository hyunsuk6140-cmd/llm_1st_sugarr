// ============================================================
// 개념 01 — PM2 로 돌리기
// ============================================================
//
// 06단원에서 확인한 문제 두 개입니다.
//
//   SSH 를 닫으면 서버가 죽는다
//   서버가 오류로 죽으면 아무도 안 살린다
//
// PM2 가 둘 다 해결합니다. 그리고 그 이상도 합니다.
//
// ★ 이 파일은 PM2 를 실제로 띄웠다 내립니다. 몇 초 걸립니다.
//   node_modules 에 pm2 가 설치돼 있어야 합니다. (npm install)
//
// 실행: node 개념01_PM2로_돌리기.js
// ============================================================

const { execFileSync, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// ============================================================
// 1. PM2 가 하는 일
// ============================================================

const 하는일 = [
  ["SSH 를 닫아도 살아 있음", "SIGHUP 을 안 받게 떼어 놓습니다"],
  ["죽으면 다시 띄움", "★ nohup 이 못 하던 것"],
  ["재부팅해도 뜸", "systemd 에 등록해서"],
  ["로그를 파일로 모음", "날짜별로 나눌 수도 있습니다"],
  ["CPU·메모리를 보여 줌", "pm2 monit"],
  ["여러 개를 동시에 돌림", "클러스터 (개념02)"],
  ["끊김 없이 새 코드로 교체", "reload (개념02)"],
  ["메모리를 너무 쓰면 재시작", "max_memory_restart"],
];

for (const [무엇, 설명] of 하는일) {
  console.log(`· ${무엇} — ${설명}`);
}
// 출력: · SSH 를 닫아도 살아 있음 — SIGHUP 을 안 받게 떼어 놓습니다
// 출력: · 죽으면 다시 띄움 — ★ nohup 이 못 하던 것
// 출력: · 재부팅해도 뜸 — systemd 에 등록해서
// 출력: · 로그를 파일로 모음 — 날짜별로 나눌 수도 있습니다
// 출력: · CPU·메모리를 보여 줌 — pm2 monit
// 출력: · 여러 개를 동시에 돌림 — 클러스터 (개념02)
// 출력: · 끊김 없이 새 코드로 교체 — reload (개념02)
// 출력: · 메모리를 너무 쓰면 재시작 — max_memory_restart

// ★★ 두 번째가 핵심입니다. nohup 과의 결정적 차이입니다.
//
//   서버는 죽습니다. 처리 못 한 예외, 메모리 부족, 라이브러리 버그.
//   새벽 3시에 죽으면 아침까지 서비스가 멈춰 있습니다.
//
//   PM2 는 죽는 즉시 다시 띄웁니다. 몇 초 안에 복구됩니다.
//   근본 원인은 그대로지만, 사용자에게는 잠깐 느린 정도로 끝납니다.

// ============================================================
// 2. 설치
// ============================================================
//
//   # 서버 전체에 (EC2 에서 이렇게 합니다)
//   sudo npm install -g pm2
//
//   # 또는 프로젝트에만
//   npm install --save-dev pm2
//   npx pm2 ...
//
// ★ 06단원에서 "npm install 에 sudo 를 쓰지 말라" 고 했는데
//   -g 는 예외입니다. 시스템 폴더에 설치하는 것이라 권한이 필요합니다.
//
// ★★ nvm 을 썼다면 -g 도 sudo 없이 됩니다. nvm 이 내 폴더에 설치하니까요.
//   그런데 그러면 PM2 가 systemd 에서 안 보입니다. (06단원 개념05 의 PATH 문제)
//   서버에서는 NodeSource 로 설치하고 sudo npm i -g pm2 하는 쪽이 덜 헤맵니다.

// ============================================================
// 3. 직접 띄워 봅니다
// ============================================================

const 연습폴더 = path.join(os.tmpdir(), "pm2연습");
fs.rmSync(연습폴더, { recursive: true, force: true });
fs.mkdirSync(연습폴더, { recursive: true });

const 앱경로 = path.join(연습폴더, "앱.js");
fs.writeFileSync(앱경로, `
const http = require("http");

const 서버 = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ pid: process.pid }));
});

서버.listen(3199, () => console.log("떴습니다", process.pid));
`, "utf-8");

// pm2 를 부르는 함수 (조용히)
//
// ★ npx 나 pm2 명령을 바로 부르지 않고 pm2 의 js 파일을 node 로 실행합니다.
//   윈도우에서 .cmd 파일을 execFileSync 로 부르면 EINVAL 이 납니다.
//   (실제로 이 파일을 쓰다가 밟았습니다)
//   node 로 js 를 직접 부르면 어느 OS 에서나 똑같이 동작합니다.
//
//   ★ 여러분이 서버에서 쓸 때는 그냥 pm2 start ... 로 치면 됩니다.
//     이건 이 자료가 자동으로 검사되게 하려는 장치입니다.
const pm2진입점 = path.join(__dirname, "..", "node_modules", "pm2", "bin", "pm2");

function pm2(...인자) {
  try {
    return execFileSync(process.execPath, [pm2진입점, ...인자],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], cwd: __dirname });
  } catch (에러) {
    // ★ pm2 delete all 은 지울 게 없으면 0 이 아닌 값으로 끝납니다.
    //   스크립트에서 부를 때는 이걸 감안해야 합니다.
    //   배포 스크립트를 짤 때도 같은 문제를 만납니다. (개념05)
    return 에러.stdout ?? "";
  }
}

function 지금상태() {
  return JSON.parse(pm2("jlist"));
}

// 동기적으로 기다리는 함수
//
// ★ 셸의 sleep 이나 timeout 을 쓰면 OS 마다 다릅니다.
//   Atomics.wait 는 어디서나 똑같이 동작합니다.
function 기다리기(밀리초) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 밀리초);
}

pm2("delete", "all"); // 먼저 정리

pm2("start", 앱경로, "--name", "연습앱");

// PM2 가 프로세스를 띄울 시간을 줍니다
기다리기(3000);

const 처음 = 지금상태();

console.log("몇 개가 도나:", 처음.length);
// 출력: 몇 개가 도나: 1
console.log("이름:", 처음[0].name);
// 출력: 이름: 연습앱
console.log("상태:", 처음[0].pm2_env.status);
// 출력: 상태: online
console.log("실행 방식:", 처음[0].pm2_env.exec_mode);
// 출력: 실행 방식: fork_mode
console.log("재시작 횟수:", 처음[0].pm2_env.restart_time);
// 출력: 재시작 횟수: 0

// ============================================================
// 4. ★★ 죽여도 살아나는지 확인
// ============================================================

const 첫PID = 처음[0].pid;

try {
  if (process.platform === "win32") {
    execSync(`taskkill /PID ${첫PID} /F`, { stdio: "ignore" });
  } else {
    process.kill(첫PID, "SIGKILL");
  }
} catch (에러) {
  // 이미 죽었으면 무시
}

기다리기(4000);

const 죽인뒤 = 지금상태();

console.log("여전히 도나:", 죽인뒤[0].pm2_env.status);
// 출력: 여전히 도나: online
console.log("PID 가 바뀌었나:", 죽인뒤[0].pid !== 첫PID);
// 출력: PID 가 바뀌었나: true
console.log("재시작 횟수:", 죽인뒤[0].pm2_env.restart_time);
// 출력: 재시작 횟수: 1

// ★★★ 이게 nohup 과의 차이입니다.
//
//   SIGKILL 로 강제로 죽였습니다. 프로그램이 손쓸 틈이 없는 신호입니다.
//   그런데 몇 초 뒤에 새 PID 로 다시 떠 있습니다.
//
//   nohup 으로 띄웠다면 그걸로 끝이었습니다.
//
// ★ 재시작 횟수를 눈여겨보세요.
//   이 숫자가 계속 올라가면 서버가 반복해서 죽고 있다는 뜻입니다.
//   PM2 가 살려 주니까 서비스는 되는데, 안에서 뭔가 잘못되고 있는 것입니다.
//
//     pm2 list 로 ↺ 칸을 보세요. 숫자가 크면 로그를 확인하세요.
//
// ★★ 무한 재시작을 막는 장치도 있습니다.
//   PM2 는 너무 빨리 반복해서 죽으면 errored 로 바꾸고 포기합니다.
//   min_uptime 과 max_restarts 로 조절합니다. (아래 설정 파일)

// ============================================================
// 5. 자주 쓰는 명령
// ============================================================

const 명령들 = [
  ["pm2 start 앱.js --name 이름", "띄우기"],
  ["pm2 list", "목록과 상태"],
  ["pm2 logs 이름", "로그 실시간 (Ctrl+C 로 나감)"],
  ["pm2 logs 이름 --lines 200", "지난 로그 200줄"],
  ["pm2 restart 이름", "껐다 켜기"],
  ["pm2 reload 이름", "★ 끊김 없이 교체 (클러스터에서)"],
  ["pm2 stop 이름", "멈추기 (목록에는 남음)"],
  ["pm2 delete 이름", "목록에서 지우기"],
  ["pm2 monit", "CPU·메모리 실시간"],
  ["pm2 describe 이름", "자세한 정보"],
  ["pm2 flush", "로그 파일 비우기"],
  ["pm2 startup", "★ 재부팅해도 뜨게 (한 번만)"],
  ["pm2 save", "★ 지금 목록을 기억 (startup 과 같이)"],
];

for (const [명령, 설명] of 명령들) {
  console.log(`${명령} — ${설명}`);
}
// 출력: pm2 start 앱.js --name 이름 — 띄우기
// 출력: pm2 list — 목록과 상태
// 출력: pm2 logs 이름 — 로그 실시간 (Ctrl+C 로 나감)
// 출력: pm2 logs 이름 --lines 200 — 지난 로그 200줄
// 출력: pm2 restart 이름 — 껐다 켜기
// 출력: pm2 reload 이름 — ★ 끊김 없이 교체 (클러스터에서)
// 출력: pm2 stop 이름 — 멈추기 (목록에는 남음)
// 출력: pm2 delete 이름 — 목록에서 지우기
// 출력: pm2 monit — CPU·메모리 실시간
// 출력: pm2 describe 이름 — 자세한 정보
// 출력: pm2 flush — 로그 파일 비우기
// 출력: pm2 startup — ★ 재부팅해도 뜨게 (한 번만)
// 출력: pm2 save — ★ 지금 목록을 기억 (startup 과 같이)

// ============================================================
// 6. ★★★ 재부팅해도 뜨게 하기
// ============================================================
//
// pm2 start 만 하면 **재부팅하면 안 뜹니다.** 여기서 많이 놓칩니다.
//
//   ① pm2 startup
//      → 화면에 sudo 로 시작하는 명령을 하나 알려 줍니다
//      → 그걸 그대로 복사해서 실행합니다 (systemd 에 등록됩니다)
//
//   ② pm2 save
//      → 지금 돌고 있는 목록을 파일로 저장합니다
//      → 재부팅하면 이 목록대로 다시 띄웁니다
//
// ★★ ② 를 빼먹는 실수가 아주 흔합니다.
//   startup 만 하면 "PM2 는 뜨는데 앱은 없는" 상태가 됩니다.
//   앱을 바꿀 때마다 pm2 save 를 다시 하세요.
//
// ★ 확인하는 법
//
//     sudo reboot
//     # 1~2분 뒤 다시 접속해서
//     pm2 list
//
//   실제로 재부팅해서 확인하세요. "되겠지" 로 넘기면 새벽에 당합니다.

// ============================================================
// 7. 설정 파일로 관리하기
// ============================================================
//
// 명령줄 옵션이 길어지면 파일로 뺍니다. ecosystem.config.js 라고 부릅니다.

const 설정예시 = [
  "module.exports = {",
  "  apps: [{",
  '    name: "설비api",',
  '    script: "./서버.js",',
  '    cwd: "/home/ubuntu/앱",',
  "",
  '    instances: 2,            // 개념02 — max 는 코어 수라 서버마다 달라집니다',
  '    exec_mode: "cluster",',
  "",
  "    env: {",
  '      NODE_ENV: "production",',
  "      PORT: 3000,",
  "    },",
  "",
  '    max_memory_restart: "300M",   // 이만큼 넘으면 재시작',
  "    min_uptime: 10000,            // 10초는 살아야 정상 기동으로 침",
  "    max_restarts: 10,             // 이보다 자주 죽으면 포기",
  "",
  '    error_file: "/home/ubuntu/로그/오류.log",',
  '    out_file: "/home/ubuntu/로그/출력.log",',
  '    log_date_format: "YYYY-MM-DD HH:mm:ss",',
  "",
  "    kill_timeout: 5000,           // 정리할 시간을 5초 줌",
  "    wait_ready: true,             // 준비됐다고 알릴 때까지 기다림",
  "  }],",
  "};",
];

설정예시.forEach((줄) => console.log(줄));
// 출력: module.exports = {
// 출력:   apps: [{
// 출력:     name: "설비api",
// 출력:     script: "./서버.js",
// 출력:     cwd: "/home/ubuntu/앱",
// 출력:
// 출력:     instances: 2,            // 개념02 — max 는 코어 수라 서버마다 달라집니다
// 출력:     exec_mode: "cluster",
// 출력:
// 출력:     env: {
// 출력:       NODE_ENV: "production",
// 출력:       PORT: 3000,
// 출력:     },
// 출력:
// 출력:     max_memory_restart: "300M",   // 이만큼 넘으면 재시작
// 출력:     min_uptime: 10000,            // 10초는 살아야 정상 기동으로 침
// 출력:     max_restarts: 10,             // 이보다 자주 죽으면 포기
// 출력:
// 출력:     error_file: "/home/ubuntu/로그/오류.log",
// 출력:     out_file: "/home/ubuntu/로그/출력.log",
// 출력:     log_date_format: "YYYY-MM-DD HH:mm:ss",
// 출력:
// 출력:     kill_timeout: 5000,           // 정리할 시간을 5초 줌
// 출력:     wait_ready: true,             // 준비됐다고 알릴 때까지 기다림
// 출력:   }],
// 출력: };

// 이렇게 두고 이것만 치면 됩니다.
//
//   pm2 start ecosystem.config.js
//
// ★★★ package.json 에 "type": "module" 이 있다면 이대로는 안 됩니다.
//
//   위 파일은 module.exports = 로 쓴 **CommonJS** 입니다.
//   그런데 "type": "module" 이면 Node 가 .js 를 전부 ES 모듈로 읽습니다.
//   그래서 PM2 가 이 파일을 읽는 순간 터집니다.
//
//     ReferenceError: module is not defined in ES module scope
//
//   ★ 고치는 법 — 확장자를 .cjs 로 바꾸면 끝입니다.
//
//     mv ecosystem.config.js ecosystem.config.cjs
//     pm2 start ecosystem.config.cjs
//
//   .cjs 는 "type" 설정과 **상관없이 항상 CommonJS** 로 읽힙니다.
//   PM2 는 .cjs 도 그대로 받습니다. (.json 이나 .yaml 로 써도 됩니다)
//
//   ★★ 앱 코드(서버.js) 가 ESM 인 것과는 상관없습니다.
//     PM2 는 설정 파일만 읽고, 앱은 별도 프로세스로 띄웁니다.
//     **설정 파일만** CommonJS 면 됩니다.
//
//   08단원 개념03 의 "CommonJS 와 ESM 을 섞지 마세요" 와 같은 이야기입니다.
//   한 프로젝트 안에서도 파일마다 규칙이 다를 수 있다는 걸 알아 두세요.
//
// ★★ 챙길 것 몇 가지
//
//   max_memory_restart
//     메모리 누수가 있어도 서비스가 안 죽습니다. 근본 해결은 아닙니다.
//     micro(t2·t3 둘 다) 는 메모리가 1GB 라 300M 쯤이 적당합니다.
//     (06단원 개념04 의 스왑과 같이)
//
//   instances
//     ★ "max" 로 두면 **코어 수**만큼 뜹니다. 서버마다 달라집니다.
//     t2.micro 는 코어가 1개라 max 가 1개가 되어 무중단 배포가 안 됩니다.
//     개수를 직접 적는 편이 안전합니다. (개념02 에서 자세히 봅니다)
//
//   min_uptime / max_restarts
//     설정이 잘못돼서 켜자마자 죽는 경우, 무한히 재시작하며 CPU 를 태웁니다.
//     이 두 개가 있으면 몇 번 해 보고 errored 로 멈춥니다.
//     그러면 pm2 list 에서 바로 보입니다.
//
//   kill_timeout
//     PM2 가 SIGINT 를 보내고 이 시간만큼 기다린 뒤 SIGKILL 합니다.
//     처리 중인 요청을 마칠 시간입니다. 개념02 의 우아한 종료와 짝입니다.
//
// ★ .env 를 쓴다면 env 에 다 적을 필요가 없습니다.
//   01단원의 설정.js 가 .env 를 읽으니 그대로 두면 됩니다.
//   NODE_ENV 만 여기서 주는 식으로 섞어 쓰기도 합니다.
//   **어느 쪽인지 정하고 한 곳에만 두세요.** 두 곳에 있으면 뭐가 이기는지 헷갈립니다.

// ============================================================
// 8. 로그
// ============================================================
//
//   pm2 logs                  전부
//   pm2 logs 설비api           그것만
//   pm2 logs --err            오류만
//   pm2 flush                 비우기
//
// ★★★ 로그가 디스크를 채웁니다. 실제로 자주 나는 사고입니다.
//
//   요청마다 한 줄씩 쌓이면 몇 달 뒤 몇 GB 가 됩니다.
//   06단원의 8GB 디스크가 꽉 차면 서버가 통째로 멈춥니다.
//   DB 도 못 쓰고 로그도 못 쓰니 원인 파악도 어렵습니다.
//
//   ★ pm2-logrotate 를 꼭 설치하세요.
//
//     pm2 install pm2-logrotate
//     pm2 set pm2-logrotate:max_size 10M
//     pm2 set pm2-logrotate:retain 7
//     pm2 set pm2-logrotate:compress true
//
//   10MB 가 넘으면 새 파일로 넘기고, 7개만 남기고, 압축합니다.
//
// ★ 디스크가 얼마나 남았는지 가끔 보세요.
//
//     df -h

// ── 정리 ──

pm2("delete", "all");

console.log("정리 뒤 남은 프로세스:", 지금상태().length);
// 출력: 정리 뒤 남은 프로세스: 0

pm2("kill"); // PM2 자체도 종료
fs.rmSync(연습폴더, { recursive: true, force: true });

// ============================================================
// 9. 확인 목록
// ============================================================
//
//   □ pm2 startup 을 하고 알려 준 sudo 명령을 실행했나
//   □ pm2 save 를 했나 (앱을 바꿀 때마다 다시)
//   □ 실제로 재부팅해서 확인했나
//   □ pm2-logrotate 를 설치했나
//   □ max_memory_restart 를 걸었나
//   □ pm2 list 의 ↺ 숫자가 이상하게 크지 않나
//
// ★ 세 번째를 꼭 하세요. "될 것 같다" 와 "된다" 는 다릅니다.

// ============================================================
// 정리
// ============================================================
//
//   PM2 는 nohup 이 못 하던 것을 합니다 — **죽으면 다시 띄웁니다.**
//   (직접 SIGKILL 로 죽여서 확인했습니다. PID 가 바뀌고 재시작 횟수가 1 이 됐습니다)
//
//   pm2 start / list / logs / restart / reload / stop / delete
//
//   재부팅해도 뜨게 하려면 **두 개를 다** 해야 합니다
//     pm2 startup   (알려 주는 sudo 명령까지 실행)
//     pm2 save      (앱을 바꿀 때마다 다시)
//
//   ecosystem.config.js 로 설정을 모으세요
//     max_memory_restart · min_uptime · max_restarts · kill_timeout
//
//   pm2-logrotate 를 설치하세요. 로그가 디스크를 채우면 서버가 멈춥니다.
//
// 다음(개념02) 에서 여러 개를 동시에 돌리고, 끊김 없이 새 코드로 바꿉니다.
