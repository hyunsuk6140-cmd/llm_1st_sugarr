// ============================================================
// 07단원 연습문제 정답 — PM2 와 배포
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

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


// ───── 문제 1 ─────
function 판정(방법) {
  const 표 = {
    "node 앱.js": ["✗", "✗", "✗"],
    "nohup node 앱.js &": ["○", "✗", "✗"],
    "pm2 start": ["○", "○", "✗"],
    "pm2 start + startup + save": ["○", "○", "○"],
  };

  return (표[방법] ?? ["?", "?", "?"]).join(" / ");
}

for (const 방법 of ["node 앱.js", "nohup node 앱.js &", "pm2 start", "pm2 start + startup + save"]) {
  console.log(`${방법}: ${판정(방법)}`);
}
// 출력: node 앱.js: ✗ / ✗ / ✗
// 출력: nohup node 앱.js &: ○ / ✗ / ✗
// 출력: pm2 start: ○ / ○ / ✗
// 출력: pm2 start + startup + save: ○ / ○ / ○

// ★★★ 세 번째 줄이 이 문제의 핵심입니다.
//
//   pm2 start 만 하면 재부팅 때 안 뜹니다.
//   PM2 가 systemd 에 등록돼 있지 않고, 띄울 목록도 저장돼 있지 않으니까요.
//
//   startup 은 "PM2 자체를 재부팅 때 띄워라",
//   save 는 "이 목록을 기억해라" 입니다. **둘 다** 필요합니다.
//
// ★ nohup 은 두 번째 칸이 ✗ 인 게 결정적입니다.
//   SIGHUP 만 무시할 뿐, 앱이 오류로 죽으면 아무도 안 살립니다.
//   새벽에 죽으면 아침까지 멈춰 있습니다.


// ───── 문제 2 ─────
function 문제2() {
  const 폴더 = path.join(os.tmpdir(), "연습2");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  const 앱 = path.join(폴더, "앱.js");
  fs.writeFileSync(앱, "setInterval(() => {}, 1000);", "utf-8");

  pm2("delete", "all");
  pm2("start", 앱, "--name", "연습앱2");
  기다리기(3000);

  const 지금 = 상태();

  console.log("프로세스 수:", 지금.length);
  // 출력: 프로세스 수: 1
  console.log("상태:", 지금[0].pm2_env.status);
  // 출력: 상태: online
  console.log("모드:", 지금[0].pm2_env.exec_mode);
  // 출력: 모드: fork_mode
  console.log("재시작:", 지금[0].pm2_env.restart_time);
  // 출력: 재시작: 0

  pm2("delete", "all");
  console.log("지운 뒤:", 상태().length);
  // 출력: 지운 뒤: 0

  fs.rmSync(폴더, { recursive: true, force: true });
}

문제2();

// ★ 기다리기(3000) 이 필요한 이유
//   pm2 start 는 명령이 끝나도 프로세스가 아직 준비 중일 수 있습니다.
//   바로 jlist 를 부르면 status 가 launching 으로 나옵니다.
//
// ★★ 실무에서도 같은 문제를 만납니다.
//   배포 스크립트에서 pm2 reload 뒤에 바로 health 를 부르면 실패합니다.
//   개념05 의 스크립트에 sleep 3 이 있는 이유입니다.


// ───── 문제 3 ─────
function 몇개뜨나(코어수, 옵션) {
  if (옵션 === "max" || 옵션 === "0") return 코어수;

  const 숫자 = Number(옵션);
  return 숫자 < 0 ? 코어수 + 숫자 : 숫자;
}

for (const [코어, 옵션] of [[4, "2"], [4, "max"], [4, "0"], [4, "-1"], [2, "max"]]) {
  console.log(`코어 ${코어}개에서 -i ${옵션} → ${몇개뜨나(코어, 옵션)}개`);
}
// 출력: 코어 4개에서 -i 2 → 2개
// 출력: 코어 4개에서 -i max → 4개
// 출력: 코어 4개에서 -i 0 → 4개
// 출력: 코어 4개에서 -i -1 → 3개
// 출력: 코어 2개에서 -i max → 2개

// ★ -1 은 "코어 수보다 하나 적게" 입니다.
//   하나를 OS 나 nginx 에게 남겨 두는 것입니다.
//
// ★★ EC2 의 micro 는 **종류에 따라 코어 수가 다릅니다.**
//
//     t2.micro   코어 1개 / 메모리 1GB
//     t3.micro   코어 2개 / 메모리 1GB
//
//   그래서 max 는 서버마다 결과가 달라집니다.
//   t2.micro 에서 max 는 1개라 무중단 배포가 아예 안 됩니다. (개념02)
//   **-i 2 처럼 개수를 직접 적으세요.** 코어가 1개여도 2개는 띄울 수 있습니다.
//
//   Node 하나가 50~100MB 를 쓰니 2개면 200MB 쯤입니다.
//   여기에 nginx 와 OS 를 더하면 빠듯합니다. 06단원의 스왑을 꼭 만들어 두세요.


// ───── 문제 4 ─────
function 문제4() {
  const 폴더 = path.join(os.tmpdir(), "연습4");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  const 앱 = path.join(폴더, "앱.js");
  fs.writeFileSync(앱, "setInterval(() => {}, 1000);", "utf-8");

  pm2("delete", "all");
  pm2("start", 앱, "--name", "연습앱4", "-i", "3");
  기다리기(4000);

  const 지금 = 상태();

  console.log("프로세스 수:", 지금.length);
  // 출력: 프로세스 수: 3
  console.log("모드:", 지금[0].pm2_env.exec_mode);
  // 출력: 모드: cluster_mode
  console.log("인스턴스 번호:", 지금.map((것) => 것.pm2_env.NODE_APP_INSTANCE).join(","));
  // 출력: 인스턴스 번호: 0,1,2
  console.log("PID 가 전부 다른가:", new Set(지금.map((것) => 것.pid)).size === 3);
  // 출력: PID 가 전부 다른가: true

  pm2("delete", "all");
  fs.rmSync(폴더, { recursive: true, force: true });
}

문제4();

// ★★ NODE_APP_INSTANCE 가 0,1,2 로 붙습니다.
//   이 값이 문제 5 의 열쇠입니다.
//
// ★ 이 앱은 포트를 안 엽니다. 그래도 cluster_mode 로 뜹니다.
//   -i 를 주면 무조건 클러스터입니다. 포트와는 별개입니다.


// ───── 문제 5 ─────
function 정기작업돌까(인스턴스번호) {
  // fork 모드면 값이 없습니다. 그때는 도는 게 맞습니다.
  return 인스턴스번호 === undefined || 인스턴스번호 === "0";
}

for (const 번호 of ["0", "1", "3", undefined]) {
  const 라벨 = 번호 === undefined ? "값이 없으면(fork 모드)" : `${번호}번은`;
  console.log(`${라벨} 도나: ${정기작업돌까(번호)}`);
}
// 출력: 0번은 도나: true
// 출력: 1번은 도나: false
// 출력: 3번은 도나: false
// 출력: 값이 없으면(fork 모드) 도나: true

// ★★★ 실제로는 이렇게 씁니다.
//
//     if (정기작업돌까(process.env.NODE_APP_INSTANCE)) {
//       setInterval(오래된로그지우기, 24 * 60 * 60 * 1000);
//     }
//
// ★★ undefined 를 true 로 처리한 게 중요합니다.
//
//   fork 모드로 돌리거나, 개발할 때 그냥 node 앱.js 로 실행하면
//   NODE_APP_INSTANCE 가 없습니다.
//   그때 false 를 주면 정기 작업이 아예 안 돕니다.
//   "로컬에서는 되는데 개발할 때는 안 돌아요" 의 반대 경우입니다.
//
// ★ 값이 **문자열** "0" 입니다. 숫자 0 이 아닙니다.
//   환경 변수는 항상 글자입니다. (08단원의 PORT 와 같은 이야기)
//   === 0 으로 비교하면 영원히 false 입니다.


// ───── 문제 6 ─────
function Express가보는것(헤더, 소켓주소, trustProxy) {
  if (!trustProxy) {
    return { ip: 소켓주소, protocol: "http" };
  }

  // ★★★ 맨 앞이 아니라 **맨 뒤**를 봅니다.
  //   맨 앞은 사용자가 위조할 수 있습니다. 맨 뒤가 nginx 가 붙인 진짜 주소입니다.
  //   (아래 설명과 개념03 의 $proxy_add_x_forwarded_for 를 같이 보세요)
  const xff = 헤더["x-forwarded-for"];
  const 목록 = xff ? xff.split(",").map((것) => 것.trim()).filter(Boolean) : [];
  const 믿을주소 = 목록.length > 0 ? 목록[목록.length - 1] : 소켓주소;

  return {
    ip: 믿을주소,
    protocol: 헤더["x-forwarded-proto"] ?? "http",
  };
}

const 온헤더 = { "x-forwarded-for": "1.2.3.4", "x-forwarded-proto": "https" };

for (const 켬 of [false, true]) {
  const r = Express가보는것(온헤더, "127.0.0.1", 켬);
  console.log(`trust proxy ${켬 ? "켬" : "끔"}: ip=${r.ip} protocol=${r.protocol}`);
}
// 출력: trust proxy 끔: ip=127.0.0.1 protocol=http
// 출력: trust proxy 켬: ip=1.2.3.4 protocol=https

// ★★★ 개념03 에서 실제로 재 본 그대로입니다.
//
//   trust proxy 를 안 켜면 **모든 사용자가 127.0.0.1** 로 보입니다.
//   로그가 의미를 잃고, IP 속도 제한이 전 세계를 한 덩어리로 묶습니다.
//
// ★★ 헤더는 이미 와 있습니다. Express 가 안 믿는 것뿐입니다.
//   그래서 "헤더가 안 온다" 고 오해하고 nginx 설정을 뒤지게 됩니다.
//   먼저 req.headers 를 찍어 보세요. 있으면 앱 쪽 문제입니다.
//
// ★★★ X-Forwarded-For 는 쉼표로 이어진 목록일 수 있습니다.
//     "진짜사용자, 프록시1, 프록시2"
//
//   교과서적으로는 맨 앞이 원래 사용자입니다.
//   그런데 맨 앞은 **누구나 위조해서 보낼 수 있습니다.**
//
//     curl -H "X-Forwarded-For: 1.2.3.4" https://내서버/
//     → 목록이 "1.2.3.4, 진짜사용자" 가 됩니다
//
//   그래서 맨 앞을 쓰면 IP 차단·속도 제한이 통째로 무력해집니다.
//   **위 정답이 split(",")[0] 이 아니라 맨 뒤를 쓴 이유입니다.**
//
// ★★ Express 에 숫자(프록시 개수) 를 주면 그 일을 대신 해 줍니다.
//   뒤에서 n번째를 봅니다. 위조한 앞부분은 무시됩니다.
//   여기서는 프록시가 nginx 하나(trust proxy 1) 라 맨 뒤가 됩니다.
//   CloudFront → nginx 처럼 2단이면 2 를 적어야 뒤에서 두 번째를 봅니다.


// ───── 문제 7 ─────
function nginx진단(증상) {
  const 표 = {
    "502": "앱이 안 떠 있습니다 (pm2 list)",
    "413": "nginx 의 client_max_body_size",
    "504": "앱이 너무 느립니다",
    "모든 IP 가 127.0.0.1": "trust proxy 를 켜세요",
  };

  return 표[증상] ?? "모르겠습니다";
}

for (const 증상 of ["502", "413", "504", "모든 IP 가 127.0.0.1"]) {
  console.log(`${증상} → ${nginx진단(증상)}`);
}
// 출력: 502 → 앱이 안 떠 있습니다 (pm2 list)
// 출력: 413 → nginx 의 client_max_body_size
// 출력: 504 → 앱이 너무 느립니다
// 출력: 모든 IP 가 127.0.0.1 → trust proxy 를 켜세요

// ★★ 502 와 504 를 구분하세요.
//
//   502 Bad Gateway      뒤에 있는 앱에 **연결이 안 됐습니다**
//                        → 앱이 안 떴거나 포트가 다릅니다
//
//   504 Gateway Timeout  연결은 됐는데 **답이 안 왔습니다**
//                        → 앱이 느립니다. 조회가 오래 걸리거나 무한 반복
//
//   06단원의 refused / timed out 과 같은 구조입니다.
//   "닿았나 vs 안 닿았나" 가 어디를 볼지 정해 줍니다.
//
// ★★★ 413 이 제일 헷갈립니다.
//   앱 로그에 아무것도 안 남습니다. 요청이 앱에 닿지도 못했으니까요.
//   업로드가 안 되는데 앱 로그가 조용하면 nginx 를 보세요.


// ───── 문제 8 ─────
function 어디까지(단계들, setE) {
  const 한것 = [];

  for (const [이름, 성공하나] of 단계들) {
    한것.push(이름);
    if (!성공하나 && setE) break;
  }

  return { 한것, 개수: 한것.length };
}

const 단계 = [["git pull", false], ["npm ci", true], ["migrate", true], ["reload", true]];

for (const setE of [false, true]) {
  const r = 어디까지(단계, setE);
  console.log(`set -e ${setE ? "있이" : "없이"}: ${r.한것.join(", ")} (${r.개수}단계)`);
}
// 출력: set -e 없이: git pull, npm ci, migrate, reload (4단계)
// 출력: set -e 있이: git pull (1단계)

// ★★★ 위쪽이 사고입니다.
//
//   git pull 이 실패했는데 npm ci 를 하고, 마이그레이션을 돌리고, reload 를 했습니다.
//   **옛 코드에 새 DB 구조**라는 아무도 시험해 본 적 없는 조합이 됩니다.
//   그리고 "배포 완료" 라고 나옵니다.
//
//   set -e 한 줄이 이걸 막습니다.
//
// ★ 실패한 배포가 **실패로 보이는 것**이 중요합니다.
//   조용히 반쯤 성공하는 게 제일 나쁩니다.


// ───── 문제 9 ─────
function 스크립트검사(내용) {
  const 검사들 = [
    ["set -e", /set\s+-e/],
    ["git reset --hard", /git\s+reset\s+--hard/],
    ["npm ci", /npm\s+ci/],
    ["pm2 reload", /pm2\s+reload/],
    ["health 확인", /curl\s+-[a-zA-Z]*f/],
  ];

  return 검사들.filter(([, 정규식]) => !정규식.test(내용)).map(([이름]) => 이름);
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

console.log("좋은 스크립트 → 빠진 것:", 스크립트검사(좋은스크립트).join(", ") || "없음");
// 출력: 좋은 스크립트 → 빠진 것: 없음
console.log("나쁜 스크립트 → 빠진 것:", 스크립트검사(나쁜스크립트).join(", "));
// 출력: 나쁜 스크립트 → 빠진 것: set -e, git reset --hard, npm ci, pm2 reload, health 확인

// ★★ 나쁜 스크립트가 다섯 개를 다 빠뜨렸습니다. 하나씩 무엇이 문제인지:
//
//   set -e 없음        실패해도 계속 갑니다 (문제 8)
//   git pull           서버에서 파일을 고친 적이 있으면 충돌로 멈춥니다
//   npm install        package-lock 과 다른 버전이 깔릴 수 있습니다
//   pm2 restart        클러스터를 전부 죽였다 살립니다 (개념02)
//   health 확인 없음    안 떠도 "완료" 라고 나옵니다
//
// ★ 이 검사 함수를 배포 스크립트에 넣어 두는 것도 방법입니다.
//   그런데 그것보다는 **좋은 스크립트를 한 번 만들어 두고 계속 쓰는** 게 낫습니다.
//   09단원에서 그 파일을 만듭니다.


// ───── 문제 10 ─────
function 문제10() {
  const 폴더 = path.join(os.tmpdir(), "셸연습");
  fs.rmSync(폴더, { recursive: true, force: true });
  fs.mkdirSync(폴더, { recursive: true });

  function 만들고실행(이름, setE) {
    const 경로 = path.join(폴더, 이름);
    fs.writeFileSync(경로, [
      "#!/bin/bash",
      setE ? "set -e" : "",
      'echo "1단계"',
      "false",
      'echo "2단계"',
    ].filter(Boolean).join("\n"), "utf-8");

    try {
      const 결과 = execFileSync("bash", [경로], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      return { 끝까지: true, 출력: 결과.trim() };
    } catch (에러) {
      return { 끝까지: false, 출력: (에러.stdout ?? "").trim() };
    }
  }

  const 있이 = 만들고실행("있이.sh", true);
  console.log("set -e 있이 끝까지 갔나:", 있이.끝까지);
  // 출력: set -e 있이 끝까지 갔나: false
  console.log("set -e 있이 찍힌 것:", JSON.stringify(있이.출력));
  // 출력: set -e 있이 찍힌 것: "1단계"

  const 없이 = 만들고실행("없이.sh", false);
  console.log("set -e 없이 끝까지 갔나:", 없이.끝까지);
  // 출력: set -e 없이 끝까지 갔나: true
  console.log("set -e 없이 찍힌 것:", JSON.stringify(없이.출력));
  // 출력: set -e 없이 찍힌 것: "1단계\n2단계"

  fs.rmSync(폴더, { recursive: true, force: true });
}

문제10();

// ★★★ 눈으로 확인했습니다.
//
//   set -e 없이는 false(실패) 뒤에도 "2단계" 가 찍혔습니다.
//   있으면 거기서 멈췄습니다.
//
//   ★ 그리고 종료 코드도 다릅니다.
//     set -e 가 있으면 스크립트 전체가 0 이 아닌 값으로 끝납니다.
//     그래야 이걸 부른 쪽(깃허브 액션 등) 이 "실패" 로 인식합니다.
//     없으면 0 으로 끝나서 "성공" 으로 보입니다.
//
// ★ false 는 "무조건 실패하는 명령" 입니다. 시험할 때 유용합니다.
//   반대는 true 입니다.


// ============================================================
// [손으로] 문제 정답
// ============================================================
//
// ── 문제 11 ──
//
//   **pm2 save 를 안 했습니다.**
//
//   pm2 startup 은 "재부팅할 때 PM2 자체를 띄워라" 를 systemd 에 등록합니다.
//   그런데 PM2 는 뜨면서 "무엇을 띄울지" 를 저장된 목록에서 읽습니다.
//   그 목록을 만드는 게 pm2 save 입니다.
//
//   startup 만 하면 PM2 프로세스는 뜨는데 앱이 없는 상태가 됩니다.
//   pm2 list 를 하면 목록이 비어 있습니다.
//
//   ★ 해결:
//       pm2 start ...      앱을 띄우고
//       pm2 save           그 상태를 저장
//
//   ★★ 앱 구성을 바꿀 때마다(이름 변경, 인스턴스 수 변경, 앱 추가)
//     pm2 save 를 다시 하세요. 안 하면 옛 목록이 뜹니다.
//
//   ★★★ 그리고 **실제로 재부팅해서 확인하세요.**
//     sudo reboot 를 치고 2분 뒤에 pm2 list 를 보는 것입니다.
//     "했으니 되겠지" 로 넘기면 진짜 재부팅이 일어나는 날 알게 됩니다.
//
// ── 문제 12 ──
//
//   **프로세스 4개가 각자 setInterval 을 돌려서 하루에 네 번 지웁니다.**
//
//   클러스터는 앱 코드 전체를 4번 실행합니다.
//   setInterval 도 4개가 생깁니다. 각자 자정에 로그를 지웁니다.
//
//   지우기만 하면 그나마 낫습니다. 만드는 작업이면 자료가 4배가 됩니다.
//   메일을 보내는 작업이면 사용자가 같은 메일을 4통 받습니다.
//
//   ★ 해결 ① 한 프로세스에서만 (문제 5)
//
//       if (process.env.NODE_APP_INSTANCE === undefined ||
//           process.env.NODE_APP_INSTANCE === "0") {
//         setInterval(오래된로그지우기, 하루);
//       }
//
//   ★★ 해결 ② 정기 작업을 앱에서 빼기 (더 좋습니다)
//
//     · 별도 파일로 만들고 pm2 로 fork 모드 하나만 띄웁니다
//         pm2 start 정기작업.js --name 정기작업        (-i 없이)
//     · 또는 시스템 cron 에 등록합니다
//         0 0 * * * cd /home/ubuntu/앱 && node 정기작업.js
//
//     이러면 웹 서버와 정기 작업이 분리됩니다.
//     정기 작업이 무거워도 API 응답이 안 느려집니다.
//     정기 작업이 죽어도 서비스는 돕니다.
//
//   ★ 여러 서버로 늘리면 ① 도 안 통합니다.
//     서버마다 0번 프로세스가 있으니까요.
//     그때는 DB 에 잠금을 두거나 전용 스케줄러를 씁니다.
//
// ── 문제 13 ──
//
//   **nginx 의 client_max_body_size 기본값이 1MB 입니다.**
//
//   요청이 앱에 닿기 전에 nginx 가 끊습니다.
//   그래서 multer 의 5MB 설정은 아무 상관이 없습니다.
//   앱 로그가 조용한 것도 그 때문입니다. 앱은 이 요청을 본 적이 없습니다.
//
//   ★ 확인:
//       sudo tail -f /var/log/nginx/error.log
//       # "client intended to send too large body" 가 보입니다
//
//   ★ 해결:
//       server 블록에 client_max_body_size 10M; 을 넣고
//       sudo nginx -t && sudo systemctl reload nginx
//
//   ★★ 두 값을 어떻게 맞출까
//
//       nginx  10M   (조금 크게)
//       multer 5MB   (진짜 제한)
//
//     5~10MB 사이는 앱이 받아서 **우리 오류 형식**으로 거절합니다.
//       { error: { code: "FILE_TOO_LARGE", message: "5MB 까지 올릴 수 있습니다" } }
//
//     10MB 초과는 nginx 가 미리 끊습니다. 서버 자원을 아낍니다.
//     nginx 를 앱보다 작게 잡으면 앱의 친절한 오류 메시지를 못 보여 줍니다.
//
// ── 문제 14 ──
//
//   **trust proxy 를 안 켜서 req.protocol 이 항상 http 입니다.**
//
//   미들웨어가 이렇게 판단합니다.
//     "protocol 이 http 네? https 로 보내자"
//   브라우저가 https 로 다시 옵니다.
//   nginx 가 https 를 풀어서 http 로 앱에 넘깁니다.
//   앱이 또 "http 네? https 로 보내자"
//   ... 영원히 반복됩니다.
//
//   ★ 해결 ① app.set("trust proxy", 1) 을 켭니다
//     그러면 X-Forwarded-Proto 를 읽어서 https 로 인식합니다.
//
//   ★★ 해결 ② **그 미들웨어를 지웁니다** (이게 더 낫습니다)
//     nginx 가 이미 80 → 443 리디렉션을 하고 있습니다. (개념04 의 return 301)
//     앱이 같은 일을 또 할 이유가 없습니다.
//     책임이 두 곳에 나뉘면 이런 사고가 납니다.
//
//   ★ 브라우저 오류 메시지: ERR_TOO_MANY_REDIRECTS
//     이걸 보면 "누가 어디로 보내고 있나" 를 먼저 그려 보세요.
//     curl -IL 로 리디렉션 사슬을 볼 수 있습니다.
//
// ── 문제 15 ──
//
//   **health 확인이 빠졌습니다.**
//
//   스크립트가 pm2 reload 까지만 하고 "배포 끝" 을 찍은 것입니다.
//   reload 명령 자체는 성공합니다. 앱이 켜지다가 죽어도 명령은 성공입니다.
//
//   왜 앱이 죽었을까요? 흔한 것들:
//     · .env 에 새 값이 필요한데 안 넣었습니다 (01단원의 설정.js 가 멈춥니다)
//     · 마이그레이션이 실패했는데 그냥 넘어갔습니다 (set -e 도 없었을 것)
//     · npm ci 를 안 해서 새 패키지가 없습니다
//
//   ★ 해결: 스크립트 마지막에 넣습니다
//
//       sleep 3
//       curl -fsS http://127.0.0.1:3000/health > /dev/null
//
//     -f 는 200 이 아니면 실패로 끝냅니다. set -e 가 그걸 잡아서
//     스크립트가 0 이 아닌 값으로 끝납니다. "배포 실패" 가 보입니다.
//
//   ★★ 그리고 health 를 제대로 만드세요.
//     res.send("ok") 만 하면 Node 는 떴는데 DB 가 안 되는 경우를 못 잡습니다.
//     DB 를 한 번 건드려 보는 게 좋습니다. (개념05)
//
//   ★★★ **확인이 없는 배포는 배포가 아닙니다.**
//     "명령을 쳤다" 와 "서비스가 된다" 는 다릅니다.
//     그 사이를 이어 주는 게 health 확인입니다.

pm2("kill");
