// ============================================================
// 개념 03 — 서버를 다시 만들 수 있게
// ============================================================
//
// 06단원에서 서버를 만들 때 명령을 손으로 쳤습니다.
// apt upgrade, 시간대, 스왑, Node 설치, nginx, PM2...
//
// 서버가 망가지면 그걸 다 기억해서 다시 쳐야 합니다. 못 합니다.
//
// 스크립트로 남깁니다. 그러면 서버가 **버릴 수 있는 것**이 됩니다.
//
// ★ 이 파일은 스크립트를 만들고, 실제로 문법을 검사합니다.
//
// 실행: node 개념03_서버를_다시_만들_수_있게.js
// ============================================================

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// ============================================================
// 1. 왜 스크립트로 남기나
// ============================================================

const 이유 = [
  ["서버가 망가지면 다시 만듭니다", "고치려 애쓰는 것보다 빠릅니다"],
  ["무엇을 했는지 기억이 남습니다", "석 달 뒤의 나에게도 필요합니다"],
  ["다른 사람이 만들 수 있습니다", "나만 아는 서버는 위험합니다"],
  ["시험용 서버를 똑같이 만듭니다", "★ '거기서는 되는데' 를 없앱니다"],
  ["실습을 마음 놓고 종료합니다", "06단원의 750시간을 아낍니다"],
];

for (const [무엇, 설명] of 이유) {
  console.log(`· ${무엇} — ${설명}`);
}
// 출력: · 서버가 망가지면 다시 만듭니다 — 고치려 애쓰는 것보다 빠릅니다
// 출력: · 무엇을 했는지 기억이 남습니다 — 석 달 뒤의 나에게도 필요합니다
// 출력: · 다른 사람이 만들 수 있습니다 — 나만 아는 서버는 위험합니다
// 출력: · 시험용 서버를 똑같이 만듭니다 — ★ '거기서는 되는데' 를 없앱니다
// 출력: · 실습을 마음 놓고 종료합니다 — 06단원의 750시간을 아낍니다

// ★★★ 마지막이 이 수업에서 실질적입니다.
//
//   "다시 만들기 귀찮아서" 인스턴스를 켜 둡니다. 그러다 750시간을 넘깁니다.
//   5분이면 같은 서버가 생긴다는 걸 알면 종료하는 게 안 아깝습니다.

// ============================================================
// 2. 서버 준비 스크립트
// ============================================================

const 준비스크립트 = `#!/bin/bash
# 서버준비.sh — 새 EC2 인스턴스를 쓸 수 있게 만듭니다
# 사용자 데이터에 넣거나, 접속해서 직접 실행합니다.
set -euo pipefail

echo "== 서버 준비 시작"

# ── 1. 기본 ──
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y curl git nginx
# ★ 방화벽은 AWS 보안 그룹으로 합니다 (06단원 개념04).
#   ufw 까지 켜면 막힌 곳을 두 군데서 찾게 됩니다.

# ── 2. 시간대 (로그 시각이 맞아야 합니다) ──
timedatectl set-timezone Asia/Seoul

# ── 3. 스왑 2GB ★ t3.micro 는 메모리가 1GB 뿐입니다 ──
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 4. Node 24 (apt 것은 너무 낮습니다) ──
if ! command -v node > /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi

# ── 5. PM2 ──
if ! command -v pm2 > /dev/null; then
  npm install -g pm2
fi

# ★★ pm2 install 은 **실행한 사용자의** PM2 에만 붙습니다.
#   이 스크립트는 root 로 돕니다. 그대로 걸면 root 의 PM2 에만 붙어서
#   정작 ubuntu 가 띄운 앱의 로그는 회전되지 않습니다. (개념05 의 디스크 가득참)
# ★ pm2 install 은 이미 깔려 있으면 다시 깔기만 합니다. 여러 번 돌려도 됩니다.
sudo -u ubuntu -H pm2 install pm2-logrotate
sudo -u ubuntu -H pm2 set pm2-logrotate:max_size 10M
sudo -u ubuntu -H pm2 set pm2-logrotate:retain 7

# ── 6. 앱 폴더 ──
# ★ 로그 폴더는 ecosystem.config.js 의 error_file·out_file 이 씁니다 (07단원 개념01)
mkdir -p /home/ubuntu/앱 /home/ubuntu/로그
chown -R ubuntu:ubuntu /home/ubuntu/앱 /home/ubuntu/로그

echo "== 서버 준비 끝"
node -v
# ★ 마지막 명령의 종료 코드가 곧 스크립트의 종료 코드입니다.
#   head 로 잘라 내면 pipefail 아래에서 SIGPIPE(141) 로 끝나서
#   cloud-init 이 준비를 실패로 기록합니다. 그래서 || true 를 붙입니다.
free -h || true
`;

const 연습폴더 = path.join(os.tmpdir(), "배포스크립트연습");
fs.rmSync(연습폴더, { recursive: true, force: true });
fs.mkdirSync(연습폴더, { recursive: true });

const 준비경로 = path.join(연습폴더, "서버준비.sh");
fs.writeFileSync(준비경로, 준비스크립트, "utf-8");

// ★ 문법 검사 — bash -n 은 실행하지 않고 문법만 봅니다
function 문법검사(경로) {
  try {
    execFileSync("bash", ["-n", 경로], { stdio: ["ignore", "pipe", "pipe"] });
    return "통과";
  } catch (에러) {
    return `오류: ${(에러.stderr ?? "").toString().trim().split("\n")[0]}`;
  }
}

console.log("서버준비.sh 문법:", 문법검사(준비경로));
// 출력: 서버준비.sh 문법: 통과

// ★★ bash -n 을 배포 전에 꼭 돌리세요.
//   따옴표 하나 안 닫힌 스크립트를 서버에서 실행하면
//   어디까지 됐는지 모르는 상태가 됩니다.
//   nginx -t 와 같은 역할입니다. (07단원 개념03)

// ★★★ 그런데 bash -n 은 **문법만** 봅니다. 이걸 꼭 알아야 합니다.
//
//   nginx -t 와 다릅니다. nginx -t 는 설정이 말이 되는지까지 보지만
//   bash -n 은 "파싱이 되는가" 만 봅니다. 그래서 이런 걸 못 잡습니다.
//
//     · 변수 이름에 한글을 쓴 것        ← 07단원 개념05 에서 본 그 문제
//     · 없는 명령어를 부르는 것          (rsyc, systemclt 같은 오타)
//     · 파일 경로가 틀린 것
//     · 권한이 없어서 실패할 것
//
//   ★ 한글 변수명은 특히 위험합니다.
//     bash 는 그걸 "변수 대입" 이 아니라 "명령어 실행" 으로 읽습니다.
//     문법상으로는 멀쩡한 문장이라 bash -n 이 통과시킵니다.
//     그리고 서버에서 첫 줄부터 죽습니다.
//
//       앱경로=/home/ubuntu/앱
//       → bash -n:  통과
//       → 실행:     No such file or directory  (그리고 set -e 로 즉시 종료)
//
//   ★★ 그래서 "문법 통과" 를 배포 허가로 쓰면 안 됩니다.
//     · shellcheck 를 쓰세요. 위의 것들을 대부분 잡아 줍니다.
//     · 그리고 **버릴 수 있는 서버에서 한 번 진짜로 돌려 보세요.**
//       읽어서 찾는 것보다 한 번 돌려 보는 게 빠릅니다.

// ★★★ 스크립트에서 짚어 볼 곳 다섯 군데
//
//   ① set -euo pipefail
//      실패하면 멈춥니다. (07단원 개념05 에서 직접 확인했습니다)
//
//      ★★ 그런데 **안 멈추는 자리**가 있습니다. 이걸 꼭 알아야 합니다.
//        · if 의 조건 안        if ! git diff --quiet …   (개념04 의 4번 단계)
//        · && 나 || 의 왼쪽     pm2 reload … || pm2 start …   (아래 4번 절)
//        · 함수를 조건으로 부를 때
//
//        전부 "실패해도 되는 자리" 라서 set -e 가 일부러 봐주는 것입니다.
//        ★ 그러니 그 자리에서는 실패를 **직접** 확인해야 합니다.
//          아래 앱설정.sh 와 개념04 의 배포.sh 가 바로 그 자리를 씁니다.
//
//      ★ 그리고 pipefail 은 -e 에 안 들어 있습니다. -o 로 따로 켜는 것입니다.
//        `set -e` 만 쓰면 `curl … | bash` 에서 curl 이 실패해도 그냥 갑니다.
//
//   ② DEBIAN_FRONTEND=noninteractive
//      apt 가 "이 설정 파일을 바꿀까요?" 하고 물어보면 스크립트가 멈춥니다.
//      사용자 데이터로 돌 때는 대답할 사람이 없습니다. 영원히 멈춥니다.
//
//   ③ if [ ! -f /swapfile ]
//      여러 번 실행해도 같은 결과가 되게 합니다.
//      04단원 개념02 의 "여러 번 해도 같다" 와 같은 생각입니다.
//
//   ④ command -v node > /dev/null
//      이미 있으면 건너뜁니다. 다시 설치하면 느리기만 합니다.
//
//   ⑤ chown -R ubuntu:ubuntu
//      root 로 만든 폴더를 ubuntu 가 못 씁니다. (06단원 개념02)
//      사용자 데이터는 root 로 돌기 때문에 이게 필요합니다.

// ============================================================
// 3. 여러 번 실행해도 같은가
// ============================================================
//
// 스크립트를 다시 돌려도 망가지지 않아야 합니다.
// 어디가 위험한지 봅시다.

const 여러번위험 = [
  ["apt-get install -y", "안전", "이미 있으면 그냥 넘어갑니다"],
  ["fallocate /swapfile", "★ 위험", "이미 있으면 오류. if 로 감쌌습니다"],
  ["echo >> /etc/fstab", "★ 위험", "줄이 계속 늘어납니다. if 안에 넣었습니다"],
  ["npm install -g pm2", "느림", "이미 있으면 건너뛰게 했습니다"],
  ["mkdir -p", "안전", "-p 는 이미 있어도 됩니다"],
  ["timedatectl set-timezone", "안전", "같은 값으로 여러 번 해도 됩니다"],
];

for (const [명령, 판정, 설명] of 여러번위험) {
  console.log(`${판정} | ${명령} | ${설명}`);
}
// 출력: 안전 | apt-get install -y | 이미 있으면 그냥 넘어갑니다
// 출력: ★ 위험 | fallocate /swapfile | 이미 있으면 오류. if 로 감쌌습니다
// 출력: ★ 위험 | echo >> /etc/fstab | 줄이 계속 늘어납니다. if 안에 넣었습니다
// 출력: 느림 | npm install -g pm2 | 이미 있으면 건너뛰게 했습니다
// 출력: 안전 | mkdir -p | -p 는 이미 있어도 됩니다
// 출력: 안전 | timedatectl set-timezone | 같은 값으로 여러 번 해도 됩니다

// ★★★ /etc/fstab 에 줄이 여러 번 들어가면 어떻게 되나
//
//   재부팅할 때 같은 스왑을 여러 번 켜려 합니다.
//   운이 나쁘면 부팅이 안 됩니다. 그러면 SSH 로도 못 들어갑니다.
//
//   ★ 확인하는 법: grep -c swapfile /etc/fstab 이 1 이어야 합니다.
//
//   시스템 파일에 줄을 덧붙이는 코드는 항상 조심하세요.

// ============================================================
// 4. 앱 설정 스크립트 (서버에서 sudo 로 한 번)
// ============================================================

const 앱설정스크립트 = `#!/bin/bash
# 앱설정.sh — 앱을 처음 올릴 때 한 번 실행합니다
# ★★★ root(sudo) 로 실행합니다. 앱 쪽 명령만 sudo -u ubuntu 로 내려보냅니다.
set -euo pipefail

APP_DIR=/home/ubuntu/앱
APP_USER=ubuntu
REPO=\${1:?사용: sudo bash 앱설정.sh git@github.com:내계정/내저장소.git}

# ── 1. 코드 받기 ★ ubuntu 로 받아야 파일 주인과 SSH 키가 맞습니다 ──
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" -H git clone "$REPO" "$APP_DIR"
fi

cd "$APP_DIR"

# ── 2. .env 확인 ★ 이건 사람이 만들어야 합니다 ──
if [ ! -f "$APP_DIR/.env" ]; then
  echo "!! .env 가 없습니다. 만들고 다시 실행하세요"
  echo "   nano $APP_DIR/.env"
  exit 1
fi
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

# ── 3. 의존성과 PM2 ★ 전부 ubuntu 로 ──
#   root 로 npm ci 를 하면 node_modules 주인이 root 가 되고
#   그다음 배포의 npm ci 가 EACCES 로 죽습니다.
sudo -u "$APP_USER" -H npm ci --omit=dev
sudo -u "$APP_USER" -H bash -c 'pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js'
sudo -u "$APP_USER" -H pm2 save

# ── 4. 재부팅해도 뜨게 ★ 이건 root 여야 합니다 (systemd 유닛을 깝니다) ──
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
systemctl is-enabled "pm2-$APP_USER" || echo "!! pm2-$APP_USER 등록 실패. 화면에 나온 sudo 명령을 실행하세요"

# ── 5. nginx ★ 여기부터 다시 root 구간 ──
cp "$APP_DIR/배포/nginx.conf" /etc/nginx/sites-available/앱
ln -sf /etc/nginx/sites-available/앱 /etc/nginx/sites-enabled/앱
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── 6. 확인 ★ 한 번만 보면 아직 준비 중일 때 실패로 봅니다 (개념04) ──
sleep 3
for i in 1 2 3 4 5; do
  if curl -fsS http://127.0.0.1:3000/health > /dev/null; then
    echo "== 앱 설정 끝"
    exit 0
  fi
  echo "확인 실패 ($i/5). 3초 뒤 다시"
  sleep 3
done

echo "!! health 가 5번 다 실패했습니다. sudo -u ubuntu pm2 logs 를 보세요"
exit 1
`;

const 앱설정경로 = path.join(연습폴더, "앱설정.sh");
fs.writeFileSync(앱설정경로, 앱설정스크립트, "utf-8");

console.log("앱설정.sh 문법:", 문법검사(앱설정경로));
// 출력: 앱설정.sh 문법: 통과

// ★★ ${1:?메시지} 는 "인자가 없으면 이 메시지를 내고 멈춰라" 입니다.
//   set -u 와 같이 쓰면 인자를 빠뜨리는 실수를 막습니다.
//
// ★★★ 3번의 `pm2 reload … || pm2 start …` 는 **순서가 중요합니다.**
//
//   반대로 `pm2 start … || pm2 reload …` 로 쓰면 안 됩니다.
//   이미 떠 있을 때 pm2 start 는 오류가 아니라
//     [PM2][WARN] Applications 설비api already launched …
//   라는 **경고만 내고 성공(종료 코드 0)** 으로 끝납니다.
//   그래서 `||` 뒤의 reload 가 영영 안 돌고, 새 코드가 안 올라갑니다.
//   "실패해야 돌아가는 뒷길" 은 앞 명령이 진짜로 실패할 때만 쓸모가 있습니다.
//
//   ★ PM2 에 이걸 한 명령으로 해 주는 것도 있습니다.
//       pm2 startOrReload ecosystem.config.js
//     실무에서는 이쪽이 더 흔합니다. 여기서는 `||` 가 어떻게 도는지
//     보이려고 두 줄로 적었습니다.
//
//   ★★ 그리고 이 줄은 `set -e` 가 **안 걸리는 자리**입니다. (2번 절의 ①)
//     `||` 왼쪽의 실패는 set -e 가 봐줍니다. 그래서 이렇게 쓸 수 있습니다.
//
// ★★★ .env 만은 스크립트가 못 만듭니다.
//
//   비밀 값이 들어 있으니 저장소에 둘 수 없습니다. (01단원)
//   그래서 "없으면 멈추고 알려 주기" 로 했습니다.
//
//   그냥 넘어가게 두면 앱이 켜지다가 죽습니다.
//   01단원의 설정.js 가 모자란 값을 알려 주긴 하지만,
//   그 전에 여기서 막는 게 더 친절합니다.
//
// ★ pm2 startup 은 **누가 실행하느냐**에 따라 동작이 다릅니다.
//
//   · ubuntu 로 그냥 `pm2 startup` 만 치면
//     화면에 `sudo env PATH=… pm2 startup systemd -u ubuntu --hp /home/ubuntu`
//     를 하나 알려 줍니다. **그걸 다시 실행해야** 등록됩니다.
//
//   · root(또는 sudo) 로 위 스크립트처럼 `-u ubuntu --hp` 까지 붙여 부르면
//     PM2 가 systemd 유닛을 **직접 깔고 끝냅니다.** 안내 문구가 없습니다.
//     앱설정.sh 가 그 경우입니다.
//
//   ★★ 그래서 "안내가 나왔나" 가 아니라 **"등록이 됐나"** 를 봐야 합니다.
//     systemctl is-enabled pm2-ubuntu   → enabled 가 나와야 합니다
//   그 확인 한 줄을 스크립트에 넣어 뒀습니다.
//
// ★★★ 그리고 root 로 `pm2 start` 를 하면 앱이 **root 의 PM2** 에 등록됩니다.
//   재부팅하면 pm2-ubuntu 유닛이 뜨는데 거기엔 앱이 없습니다. 앱이 안 뜹니다.
//   그래서 이 스크립트는 앱 쪽 명령을 전부 `sudo -u ubuntu` 로 내려보냅니다.

// ============================================================
// 5. 사용자 데이터에 넣기
// ============================================================
//
// 06단원 개념04 에서 본 것입니다. 인스턴스를 만들 때 넣으면
// 처음 부팅할 때 한 번 실행됩니다.
//
// ★ 그런데 서버준비.sh 를 통째로 붙여넣기는 관리가 어렵습니다.
//   저장소에서 받아서 실행하는 게 낫습니다.
//
//   #!/bin/bash
//   set -euo pipefail
//   curl -fsSL https://raw.githubusercontent.com/내계정/내저장소/main/배포/서버준비.sh -o /tmp/준비.sh
//   bash /tmp/준비.sh
//
// ★★ 그러면 저장소가 공개여야 합니다. 비공개면 토큰이 필요합니다.
//   토큰을 사용자 데이터에 적으면 그게 인스턴스 메타데이터에 남습니다.
//   조심하세요. 준비 스크립트에는 비밀 값을 안 넣는 게 낫습니다.
//
// ★ 잘 됐는지 확인:
//     sudo cat /var/log/cloud-init-output.log
//
//   여기에 스크립트의 출력이 전부 남습니다.
//   set -e 로 멈췄으면 어디서 멈췄는지 보입니다.

// ============================================================
// 6. 사람이 해야 하는 것
// ============================================================

const 사람이할것 = [
  ["AWS 계정 안전장치", "MFA·예산 알림·IAM 사용자", "06단원 개념01"],
  ["보안 그룹", "22 는 내 IP, 80·443 만", "06단원 개념04"],
  ["탄력적 IP", "할당하고 붙이기", "06단원 개념04"],
  [".env 만들기", "비밀 값이라 저장소에 못 둡니다", "01단원"],
  ["DNS 설정", "A 레코드", "07단원 개념04"],
  ["인증서", "certbot --nginx", "07단원 개념04"],
  ["pm2 startup 확인", "systemctl is-enabled pm2-ubuntu", "07단원 개념01"],
  ["Supabase·S3 준비", "표·RLS·버킷·IAM", "05·08단원"],
];

for (const [무엇, 설명, 단원] of 사람이할것) {
  console.log(`□ ${무엇} — ${설명} (${단원})`);
}
// 출력: □ AWS 계정 안전장치 — MFA·예산 알림·IAM 사용자 (06단원 개념01)
// 출력: □ 보안 그룹 — 22 는 내 IP, 80·443 만 (06단원 개념04)
// 출력: □ 탄력적 IP — 할당하고 붙이기 (06단원 개념04)
// 출력: □ .env 만들기 — 비밀 값이라 저장소에 못 둡니다 (01단원)
// 출력: □ DNS 설정 — A 레코드 (07단원 개념04)
// 출력: □ 인증서 — certbot --nginx (07단원 개념04)
// 출력: □ pm2 startup 확인 — systemctl is-enabled pm2-ubuntu (07단원 개념01)
// 출력: □ Supabase·S3 준비 — 표·RLS·버킷·IAM (05·08단원)

// ★★ 여덟 개는 사람이 합니다. 자동화할 수도 있지만(Terraform 등)
//   이 수업 범위를 넘습니다.
//
//   ★ 대신 **적어 두세요.** 이 목록 자체가 문서입니다.
//     저장소의 README 에 넣어 두면 다음 사람이 따라 할 수 있습니다.

// ============================================================
// 7. 저장소 구조
// ============================================================

const 구조 = [
  "내저장소/",
  "  routes/ controllers/ services/ repositories/   ← 앱 코드",
  "  ecosystem.config.js                            ← PM2 설정 (07단원)",
  "  배포/",
  "    서버준비.sh      새 서버를 쓸 수 있게",
  "    앱설정.sh        앱을 처음 올릴 때",
  "    배포.sh          코드를 새로 올릴 때 (개념04)",
  "    되돌리기.sh      문제가 생기면 (개념04)",
  "    배포점검.js      배포 전 자동 점검 (개념02)",
  "    nginx.conf       nginx 설정 (07단원 개념03)",
  "  .env.예시          ★ 진짜 값이 아니라 이름만",
  "  .gitignore         .env 가 들어 있어야 합니다",
  "  README.md          사람이 할 여덟 가지",
];

구조.forEach((줄) => console.log(줄));
// 출력: 내저장소/
// 출력:   routes/ controllers/ services/ repositories/   ← 앱 코드
// 출력:   ecosystem.config.js                            ← PM2 설정 (07단원)
// 출력:   배포/
// 출력:     서버준비.sh      새 서버를 쓸 수 있게
// 출력:     앱설정.sh        앱을 처음 올릴 때
// 출력:     배포.sh          코드를 새로 올릴 때 (개념04)
// 출력:     되돌리기.sh      문제가 생기면 (개념04)
// 출력:     배포점검.js      배포 전 자동 점검 (개념02)
// 출력:     nginx.conf       nginx 설정 (07단원 개념03)
// 출력:   .env.예시          ★ 진짜 값이 아니라 이름만
// 출력:   .gitignore         .env 가 들어 있어야 합니다
// 출력:   README.md          사람이 할 여덟 가지

// ★★ 배포 관련 파일이 **저장소 안에** 있는 게 중요합니다.
//
//   코드와 같이 버전 관리됩니다.
//   "nginx 설정을 언제 왜 바꿨나" 가 git 기록에 남습니다.
//   서버에서 직접 고치면 그 기록이 없습니다. (07단원 개념05)

// ── 정리 ──

console.log("두 스크립트 다 문법이 통과했나:",
  문법검사(준비경로) === "통과" && 문법검사(앱설정경로) === "통과");
// 출력: 두 스크립트 다 문법이 통과했나: true

fs.rmSync(연습폴더, { recursive: true, force: true });

// ============================================================
// 8. 직접 해 볼 것
// ============================================================
//
// □ ① 인스턴스를 하나 만들면서 사용자 데이터에 서버준비.sh 를 넣으세요
// □ ② 부팅 뒤 sudo cat /var/log/cloud-init-output.log 로 확인하세요
// □ ③ node -v 와 free -h 로 Node 와 스왑을 확인하세요
// □ ④ 같은 스크립트를 손으로 한 번 더 실행해 보세요 (망가지면 안 됩니다)
// □ ⑤ grep -c swapfile /etc/fstab 이 1 인지 확인하세요
// □ ⑥ ★ 인스턴스를 종료하고 **다시 만들어 보세요**
//        5분 안에 같은 서버가 되면 성공입니다
//
// ★ ⑥ 을 꼭 해 보세요. 그게 이 단원의 전부입니다.
//   "다시 만들 수 있다" 를 한 번 겪으면 서버를 대하는 태도가 바뀝니다.

// ============================================================
// 정리
// ============================================================
//
//   손으로 친 명령을 스크립트로 남기세요.
//   그래야 서버를 버리고 다시 만들 수 있습니다.
//
//   서버준비.sh   apt·시간대·스왑·Node·PM2·폴더
//   앱설정.sh     clone·npm ci·.env 확인·PM2·nginx·health(다섯 번 다시)
//
//   챙길 것
//     set -euo pipefail   ← if·&&·|| 안에서는 안 걸린다는 것까지 알아 두세요
//     DEBIAN_FRONTEND=noninteractive   ← 안 하면 물음표에서 멈춥니다
//     ★ root 로 할 것과 ubuntu 로 할 것을 나누기 (sudo -u ubuntu)
//     여러 번 실행해도 같게 (if 로 감싸기)
//     ★ /etc/fstab 에 줄을 덧붙이는 코드는 특히 조심
//     chown 으로 소유자 맞추기 (사용자 데이터는 root 로 돕니다)
//
//   bash -n 으로 문법을 먼저 검사하세요.
//   ★ 다만 bash -n 은 **파싱만** 봅니다. 없는 명령·틀린 경로·권한은 못 잡습니다.
//     nginx -t 만큼 믿으면 안 됩니다. shellcheck 와 '버릴 수 있는 서버에서 한 번'
//     이 진짜 검증입니다.
//
//   .env 는 스크립트가 못 만듭니다. 없으면 멈추고 알려 주게 하세요.
//   배포 스크립트를 저장소 안에 두세요. 기록이 남습니다.
//
// 다음(개념04) 에서 배포와 되돌리기를 완성합니다.
