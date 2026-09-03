// ============================================================
// 개념 05 — 서버를 올리고 돌리기
// ============================================================
//
// EC2 에 접속했습니다. 이제 우리 서버를 올려서 돌립니다.
//
// 그리고 이 단원의 진짜 주제는 마지막에 있습니다.
//
//   SSH 창을 닫으면 서버가 같이 죽습니다.
//
// 왜 그런지 여기서 **실제로 재현해서** 확인합니다.
//
// 실행: node 개념05_서버_올리고_돌리기.js
// ============================================================

const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// ============================================================
// 1. Node 설치 — apt 로 하지 마세요
// ============================================================
//
// 우분투의 apt 에 들어 있는 node 는 버전이 아주 낮습니다.
//
//   sudo apt install nodejs     ← ✗ 옛날 버전이 깔립니다
//
// node:sqlite (02단원) 같은 최신 기능이 없습니다.
// NodeSource 저장소를 추가해서 받습니다.
//
//   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
//   sudo apt install -y nodejs
//
//   node -v    # v24.x.x 가 나와야 합니다
//   npm -v
//
// ★★ curl ... | bash 는 "받아서 바로 실행" 입니다. 위험한 형태입니다.
//   내용을 안 보고 실행하는 것이니까요.
//   NodeSource 는 널리 쓰이는 공식 경로라 관례적으로 이렇게 씁니다.
//   출처를 모르는 스크립트에는 절대 이렇게 하지 마세요.
//
//   불안하면 먼저 받아서 읽어 보세요.
//
//     curl -fsSL https://deb.nodesource.com/setup_24.x -o setup.sh
//     less setup.sh
//     sudo -E bash setup.sh
//
// ★ 다른 방법: nvm (버전을 여러 개 쓸 수 있습니다)
//
//     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
//     source ~/.bashrc
//     nvm install 24
//
//   ★★ nvm 은 함정이 하나 있습니다.
//     nvm 은 ~/.bashrc 에서 설정됩니다. 로그인 셸에서만 읽힙니다.
//     PM2 나 systemd 가 서비스로 실행할 때는 그게 안 읽혀서
//     "node: command not found" 가 납니다. (07단원에서 다시 봅니다)
//
//     처음에는 NodeSource 로 시스템에 설치하는 쪽이 덜 헤맵니다.

// ============================================================
// 2. 코드 올리기 — git 으로
// ============================================================
//
// 개념03 에서 scp 로 코드를 올리지 말라고 했습니다. git 을 씁니다.
//
//   sudo apt install -y git
//   cd ~
//   git clone https://github.com/내계정/내저장소.git 앱
//   cd 앱
//   npm ci
//
// ★★ npm install 이 아니라 npm ci 입니다.
//
//   npm install   package.json 을 보고 설치. 버전이 조금 달라질 수 있습니다
//   npm ci        package-lock.json 그대로 설치. **내 컴퓨터와 완전히 같습니다**
//
//   "내 컴퓨터에서는 되는데 서버에서는 안 돼요" 의 원인 중 하나가 이것입니다.
//   서버에서는 항상 npm ci 를 쓰세요.
//
//   ★ npm ci 는 node_modules 를 지우고 새로 만듭니다. 더 느립니다. 대신 확실합니다.
//   ★ package-lock.json 을 git 에 꼭 올리세요. 안 올리면 ci 를 못 씁니다.
//
// ── 비공개 저장소라면 ──
//
//   HTTPS 로 clone 하면 아이디·비밀번호를 물어봅니다. 매번 칩니다.
//   SSH 키를 쓰는 게 낫습니다.
//
//     # 서버에서 배포용 키를 만들고
//     ssh-keygen -t ed25519 -C "ec2-deploy" -f ~/.ssh/id_ed25519 -N ""
//     cat ~/.ssh/id_ed25519.pub
//
//     # 그 내용을 깃허브 저장소 → Settings → Deploy keys 에 등록
//     # (계정 전체 키가 아니라 그 저장소만 읽는 키입니다. 더 안전합니다)
//
//     git clone git@github.com:내계정/내저장소.git 앱
//
// ★★★ 개인키를 서버에 올리지 마세요.
//   내 노트북의 SSH 키를 scp 로 서버에 복사하는 사람이 있습니다.
//   그 서버가 뚫리면 내 깃허브 계정 전체가 넘어갑니다.
//   서버에서 새로 만들고, 저장소별 Deploy key 로 등록하세요.

// ============================================================
// 3. .env 를 서버에 만들기
// ============================================================
//
// 01단원에서 .env 는 git 에 안 올린다고 했습니다.
// 그러니 서버에는 없습니다. 직접 만들어야 합니다.
//
//   nano ~/앱/.env
//
//     NODE_ENV=production
//     PORT=3000
//     SUPABASE_URL=https://xxxx.supabase.co
//     SUPABASE_ANON_KEY=eyJ...
//
//   chmod 600 ~/앱/.env      ← ★ 개념02 의 그 600
//
// ★ 또는 내 컴퓨터에서 보냅니다.
//
//     scp -i 키 ./.env.production ubuntu@주소:/home/ubuntu/앱/.env
//
// ★★ 01단원에서 만든 설정.js 가 여기서 값을 합니다.
//   모자란 값이 있으면 서버가 켜지면서 바로 멈추고 뭐가 없는지 알려 줍니다.
//   그게 없으면 한참 뒤에 undefined 때문에 이상한 오류가 납니다.

// ============================================================
// 4. 돌려 보기
// ============================================================
//
//   cd ~/앱
//   node 서버.js
//
//   서버가 켜졌습니다.  http://localhost:3000/equipments
//
// 다른 창에서 확인합니다.
//
//   curl localhost:3000/equipments
//
// ★★ localhost 로는 되는데 브라우저로 IP:3000 이 안 된다면
//
//   ① 보안 그룹에서 3000 을 안 열었습니다 → timed out
//   ② 서버가 127.0.0.1 에만 붙었습니다 → refused
//
//   ②는 이런 코드일 때 생깁니다.
//
//     app.listen(3000, "127.0.0.1")   ← 자기 자신에게서만 받습니다
//     app.listen(3000)                ← 어디서나 받습니다 (기본값)
//
// ★★★ 그런데 3000 을 보안 그룹에서 열지 마세요.
//   07단원에서 nginx 를 앞에 세우고 80 만 엽니다.
//   지금은 SSH 안에서 curl 로 확인하면 됩니다.

// ============================================================
// 5. ★★★ SSH 연결이 끊기면 서버가 죽습니다 — 재현
// ============================================================
//
// 개념02 에서 SIGHUP 을 이야기했습니다. 실제로 확인합니다.
//
// EC2 에서는 이렇게 재현합니다.
//
//   shopt -s huponexit      # ★ 이걸 먼저 켜야 재현됩니다 (아래 설명)
//   node 서버.js &          # & 는 뒤에서 돌리라는 뜻
//   exit                    # SSH 를 닫음
//   # 다시 접속해서
//   ps aux | grep node      # 없습니다
//
// ★★★ shopt -s huponexit 를 빼면 재현이 안 될 수 있습니다.
//
//   bash 는 exit 로 **얌전히 끝날 때는** 뒤에서 돌던 잡에게 SIGHUP 을
//   보내지 않습니다. huponexit 라는 설정의 기본값이 off 이기 때문입니다.
//   그래서 Ubuntu 에서 & 로 띄우고 exit 만 치면 그냥 살아 있곤 합니다.
//
//   반대로 **연결이 툭 끊기면** 확실히 죽습니다.
//   SSH 창을 그냥 닫거나 네트워크가 끊기면 sshd 가 셸에게 SIGHUP 을 보내고,
//   셸은 그걸 자기 잡들에게 그대로 넘깁니다. 이때는 설정과 상관없습니다.
//
//     exit 로 나감           셸 설정에 따라 다릅니다 (기본값에서는 안 죽습니다)
//     창을 닫음 / 연결 끊김   죽습니다
//
//   ★ 그래서 실습은 셋 중 하나로 하세요.
//
//       ① shopt -s huponexit 를 켜고 exit
//       ② exit 대신 SSH 창을 그냥 닫기 (또는 와이파이를 끊기)
//       ③ 다시 접속해서 직접 신호 보내기 → kill -HUP <PID>
//
// 여기서는 부모 프로세스가 죽으면 어떻게 되는지를 봅니다.

const 연습폴더 = path.join(os.tmpdir(), "서버연습");
fs.rmSync(연습폴더, { recursive: true, force: true });
fs.mkdirSync(연습폴더, { recursive: true });

// SIGHUP 을 받으면 무슨 일이 일어나는지 보는 작은 프로그램
const 아이경로 = path.join(연습폴더, "아이.js");
fs.writeFileSync(아이경로, `
const fs = require("fs");
const 기록 = process.argv[2];

fs.appendFileSync(기록, "시작\\n");

process.on("SIGHUP", () => {
  fs.appendFileSync(기록, "SIGHUP 받음\\n");
  process.exit(0);
});

process.on("SIGTERM", () => {
  fs.appendFileSync(기록, "SIGTERM 받음 — 정리하고 끝냅니다\\n");
  process.exit(0);
});

setInterval(() => {}, 1000);
`, "utf-8");

const 기록경로 = path.join(연습폴더, "기록.txt");
fs.writeFileSync(기록경로, "", "utf-8");

const 아이 = spawn(process.execPath, [아이경로, 기록경로], { stdio: "ignore" });

setTimeout(() => {
  // 터미널이 닫힌 것처럼 SIGHUP 을 보냅니다
  try {
    process.kill(아이.pid, "SIGHUP");
  } catch (에러) {
    // 윈도우에서는 신호가 다르게 동작합니다. 아래에서 설명합니다.
  }

  setTimeout(() => {
    const 기록 = fs.readFileSync(기록경로, "utf-8").trim().split("\n").filter(Boolean);

    console.log("프로그램이 남긴 기록:", JSON.stringify(기록));
    // 출력?: 프로그램이 남긴 기록: ["시작"]      ← ★ 윈도우 기준. 리눅스·맥은 "SIGHUP 받음" 이 더 붙습니다

    // ★★ 윈도우에서는 "시작" 만 나옵니다.
    //
    //   윈도우에는 유닉스 신호가 없습니다. Node 가 흉내만 냅니다.
    //   process.kill(pid, "SIGHUP") 은 윈도우에서 그냥 프로세스를 끝냅니다.
    //   핸들러가 불리지 않습니다.
    //
    //   **리눅스(EC2) 에서 같은 코드를 돌리면 "SIGHUP 받음" 이 찍힙니다.**
    //   그게 SSH 를 닫았을 때 서버에 일어나는 일입니다.
    //
    // ★ 그래서 이 실습은 EC2 에서 다시 해 보세요. 파일이 두 줄이 됩니다.

    console.log("이 컴퓨터는 윈도우인가:", process.platform === "win32");
    // 출력?: 이 컴퓨터는 윈도우인가: true      ← ★ 기계마다 다릅니다

    try { 아이.kill("SIGKILL"); } catch (에러) { /* 이미 죽었으면 무시 */ }
    fs.rmSync(연습폴더, { recursive: true, force: true });

    해결책();
  }, 300);
}, 300);

// ============================================================
// 6. 해결 — 되는 것과 안 되는 것
// ============================================================

function 해결책() {
  const 방법들 = [
    ["node 서버.js", "✗", "SSH 를 닫으면 죽습니다"],
    ["node 서버.js &", "✗", "연결이 끊기면 같이 죽습니다. 백그라운드일 뿐입니다"],
    ["nohup node 서버.js &", "△", "SIGHUP 을 무시합니다. 죽으면 안 살아납니다"],
    ["screen / tmux", "△", "사람이 붙었다 떨어졌다 하는 용도입니다"],
    ["systemd 서비스", "○", "리눅스 표준. 재부팅해도 뜹니다"],
    ["PM2", "○", "★ 07단원. Node 에 맞춰 만들어졌습니다"],
  ];

  for (const [방법, 판정, 설명] of 방법들) {
    console.log(`${판정} ${방법} — ${설명}`);
  }
  // 출력: ✗ node 서버.js — SSH 를 닫으면 죽습니다
  // 출력: ✗ node 서버.js & — 연결이 끊기면 같이 죽습니다. 백그라운드일 뿐입니다
  // 출력: △ nohup node 서버.js & — SIGHUP 을 무시합니다. 죽으면 안 살아납니다
  // 출력: △ screen / tmux — 사람이 붙었다 떨어졌다 하는 용도입니다
  // 출력: ○ systemd 서비스 — 리눅스 표준. 재부팅해도 뜹니다
  // 출력: ○ PM2 — ★ 07단원. Node 에 맞춰 만들어졌습니다

  // ★★ & 만으로는 안 됩니다. 여기서 많이 헷갈립니다.
  //
  //   & 는 "터미널을 돌려 달라" 는 뜻일 뿐입니다.
  //   그 프로세스는 여전히 그 터미널에 속해 있습니다.
  //   터미널이 닫히면 SIGHUP 을 같이 받습니다.
  //
  //   ★ 단, exit 로 얌전히 나갈 때는 셸 설정(huponexit, 기본값 off) 때문에
  //     안 죽기도 합니다. 창을 닫거나 연결이 끊기면 확실히 죽습니다.
  //     "가끔 살아 있더라" 를 믿고 & 로 운영하면 안 되는 이유입니다.
  //
  // ★ nohup 은 "SIGHUP 을 무시해라" 입니다. 그래서 안 죽습니다.
  //   급할 때 쓸 만합니다. 그런데 이런 게 안 됩니다.
  //
  //     · 서버가 오류로 죽으면 그걸로 끝입니다. 아무도 안 살립니다
  //     · 재부팅하면 안 뜹니다
  //     · 로그가 nohup.out 한 파일에 무한정 쌓입니다
  //     · CPU·메모리를 얼마나 쓰는지 볼 방법이 없습니다
  //
  //   그래서 07단원에서 PM2 를 씁니다.

  자동시작();
}

// ============================================================
// 7. 재부팅해도 뜨게 — systemd (참고)
// ============================================================

function 자동시작() {
  // PM2 를 쓸 것이지만, systemd 를 알아 두면 좋습니다.
  // 리눅스 서버의 표준 방식이고, PM2 도 결국 systemd 에 등록합니다.
  //
  //   sudo nano /etc/systemd/system/설비앱.service
  //
  // 내용:

  const 서비스파일 = [
    "[Unit]",
    "Description=설비관리 API",
    "After=network.target",
    "",
    "[Service]",
    "Type=simple",
    "User=ubuntu",
    "WorkingDirectory=/home/ubuntu/앱",
    "ExecStart=/usr/bin/node 서버.js",
    "Restart=always",
    "RestartSec=3",
    "Environment=NODE_ENV=production",
    "EnvironmentFile=/home/ubuntu/앱/.env",
    "",
    "[Install]",
    "WantedBy=multi-user.target",
  ];

  서비스파일.forEach((줄) => console.log(줄));
  // 출력: [Unit]
  // 출력: Description=설비관리 API
  // 출력: After=network.target
  // 출력:
  // 출력: [Service]
  // 출력: Type=simple
  // 출력: User=ubuntu
  // 출력: WorkingDirectory=/home/ubuntu/앱
  // 출력: ExecStart=/usr/bin/node 서버.js
  // 출력: Restart=always
  // 출력: RestartSec=3
  // 출력: Environment=NODE_ENV=production
  // 출력: EnvironmentFile=/home/ubuntu/앱/.env
  // 출력:
  // 출력: [Install]
  // 출력: WantedBy=multi-user.target

  // 등록하고 켭니다.
  //
  //   sudo systemctl daemon-reload
  //   sudo systemctl enable 설비앱      # 재부팅해도 뜨게
  //   sudo systemctl start 설비앱
  //   sudo systemctl status 설비앱      # 상태 확인
  //   sudo journalctl -u 설비앱 -f      # 로그 보기
  //
  // ★★ 챙길 것 네 가지
  //
  //   User=ubuntu           root 로 돌리지 마세요 (개념02)
  //   ExecStart 는 절대 경로  PATH 가 다릅니다. which node 로 확인하세요
  //   Restart=always        죽으면 다시 띄웁니다
  //   EnvironmentFile       .env 를 읽습니다
  //
  // ★★★ ExecStart 에 node 만 적으면 안 됩니다.
  //   systemd 는 로그인 셸이 아니라서 PATH 가 다릅니다.
  //   nvm 으로 설치했다면 경로가 ~/.nvm/versions/... 안에 있습니다.
  //   which node 로 확인해서 절대 경로를 적으세요.
  //   이게 "직접 실행하면 되는데 서비스로는 안 된다" 의 흔한 원인입니다.

  마무리();
}

// ============================================================
// 8. 확인 목록
// ============================================================

function 마무리() {
  const 확인 = [
    "node -v 가 24 이상인가 (apt 로 깐 게 아닌가)",
    "npm ci 로 설치했나 (npm install 이 아니라)",
    "package-lock.json 을 git 에 올렸나",
    ".env 를 서버에 만들고 chmod 600 했나",
    "대소문자 때문에 모듈을 못 찾지는 않나 (개념02)",
    "스왑을 만들었나 (개념04 — 안 하면 npm ci 가 죽습니다)",
    "SSH 를 닫아도 서버가 살아 있나",
    "재부팅해도 서버가 뜨나",
  ];

  확인.forEach((줄, 자리) => console.log(`□ ${자리 + 1}. ${줄}`));
  // 출력: □ 1. node -v 가 24 이상인가 (apt 로 깐 게 아닌가)
  // 출력: □ 2. npm ci 로 설치했나 (npm install 이 아니라)
  // 출력: □ 3. package-lock.json 을 git 에 올렸나
  // 출력: □ 4. .env 를 서버에 만들고 chmod 600 했나
  // 출력: □ 5. 대소문자 때문에 모듈을 못 찾지는 않나 (개념02)
  // 출력: □ 6. 스왑을 만들었나 (개념04 — 안 하면 npm ci 가 죽습니다)
  // 출력: □ 7. SSH 를 닫아도 서버가 살아 있나
  // 출력: □ 8. 재부팅해도 서버가 뜨나

  // ★ 7번과 8번이 07단원의 주제입니다.
  //   그리고 "배포를 한 줄로 만들기" 까지 합니다.

  // ============================================================
  // 9. EC2 에서 직접 해 볼 것
  // ============================================================
  //
  // ★ 아래는 EC2 에 접속해서 하세요. 이 파일에서는 못 합니다.
  //
  // ── ① SIGHUP 재현 ──
  //
  //   cat > 시험.js <<'EOF'
  //   const fs = require("fs");
  //   fs.appendFileSync("기록.txt", "시작\n");
  //   process.on("SIGHUP", () => {
  //     fs.appendFileSync("기록.txt", "SIGHUP 받음\n");
  //     process.exit(0);
  //   });
  //   setInterval(() => {}, 1000);
  //   EOF
  //
  //   shopt -s huponexit      # ★ 이게 있어야 exit 로도 재현됩니다
  //   node 시험.js &
  //   exit                    # SSH 닫기
  //   # 다시 접속해서
  //   cat 기록.txt             # "시작" 과 "SIGHUP 받음" 두 줄
  //   ps aux | grep 시험       # 없습니다
  //
  //   ★ huponexit 를 안 켜면 exit 만으로는 안 죽습니다. 그럴 때는
  //     SSH 창을 그냥 닫아 보거나, 다시 접속해서 직접 신호를 보내세요.
  //
  //       kill -HUP $(pgrep -f 시험.js)   # SIGHUP 을 직접 보냄
  //       cat 기록.txt                     # 두 줄이 됩니다
  //
  // ── ② nohup 으로 하면 ──
  //
  //   shopt -s huponexit      # ①과 같은 조건으로 맞춰 놓고
  //   nohup node 시험.js &
  //   exit
  //   # 다시 접속해서
  //   ps aux | grep 시험       # ★ 살아 있습니다
  //   cat 기록.txt             # SIGHUP 줄이 없습니다 (무시했으니까)
  //
  //   kill $(pgrep -f 시험.js)   # 정리
  //
  // ── ③ 메모리가 모자라면 ──
  //
  //   free -h                          # 스왑이 있나
  //   node -e "const a=[]; while(true) a.push(new Array(1e6).fill(0));"
  //
  //   스왑이 없으면 금방 Killed 가 뜹니다. 있으면 한참 버팁니다.
  //   ★ 이건 서버가 느려지니 한 번만 해 보고 Ctrl+C 로 끄세요.
}

// ============================================================
// 정리
// ============================================================
//
//   Node 는 apt 말고 NodeSource 로 설치하세요. apt 것은 너무 낮습니다.
//   코드는 git clone, 설치는 **npm ci** (npm install 이 아닙니다)
//   .env 는 서버에서 만들고 chmod 600
//   개인키를 서버에 올리지 말고, 저장소별 Deploy key 를 쓰세요
//
//   ★★ SSH 연결이 끊기면 서버가 죽습니다. SIGHUP 때문입니다.
//     & 를 붙여도 죽습니다. & 는 터미널만 돌려줄 뿐입니다.
//     (exit 로 얌전히 나갈 때는 셸 설정에 따라 안 죽기도 합니다. 믿을 게 못 됩니다)
//     nohup 은 SIGHUP 을 무시해서 살아남습니다. 대신 죽으면 안 살아납니다.
//
//   제대로 하려면 systemd 나 PM2 를 씁니다.
//     User=ubuntu · ExecStart 는 절대 경로 · Restart=always · EnvironmentFile
//
//   localhost 는 되는데 밖에서 안 되면
//     timed out → 보안 그룹 / refused → 127.0.0.1 에만 붙었나
//
// 06단원 끝입니다. 연습문제를 풀어 보세요.
// 07단원에서 PM2 로 제대로 돌리고, nginx 를 앞에 세우고, 배포를 한 줄로 만듭니다.
