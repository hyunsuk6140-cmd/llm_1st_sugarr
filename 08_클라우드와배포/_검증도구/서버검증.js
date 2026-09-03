// ============================================================
// _검증도구/서버검증.js — 서버를 진짜로 띄우고 요청을 보내 대조한다
// ------------------------------------------------------------
// 사용:
//   node _검증도구/서버검증.js 04_Express_시작하기
//   node _검증도구/서버검증.js                    ← 모든 단원
//
// 하는 일:
//   ① 서버 파일을 자식 프로세스로 띄운다 (포트는 환경변수로 넘김)
//   ② 뜰 때까지 기다린다
//   ③ 파일에 적힌 요청을 실제로 보낸다
//   ④ 상태코드·본문·응답 헤더를 대조한다
//   ⑤ 서버를 끈다
//
// 왜 필요한가:
//   서버 자료는 "이 주소로 들어가면 이게 나온다" 가 전부인데,
//   손으로 Postman 을 눌러 확인하면 반드시 빠뜨린다.
//   그리고 자료를 고칠 때마다 처음부터 다시 눌러야 한다.
// ============================================================
//
// ── 선언 문법 ──
//
//   // 확인: GET /health
//   // 응답: 200 {"status":"ok"}
//
// 이 두 줄을 서버 파일 안에 적어 두면 검증합니다.
// 학생에게도 그대로 안내가 되므로 주석이 낭비되지 않습니다.
//
//   확인 줄:  METHOD 경로 [헤더] 본문
//   응답 줄:  상태코드 본문        (본문은 공백을 지운 뒤 비교)
//   헤더 줄:  이름=값 | 이름2=값2   (응답 줄 바로 다음, 있어도 되고 없어도 됨)
//
// 본문 쓰는 법
//
//   {"a":1}                      JSON 으로 보냅니다
//   form:name=hong&age=20        HTML 폼 형식으로 보냅니다
//   multipart:@file=사진.png      파일 업로드. 내용은 "가짜 파일 내용"
//   multipart:@file=큰.png:500    500바이트짜리 파일
//   multipart:@file=a.png&desc=설명   파일 + 글자 필드
//
// 요청 헤더 붙이는 법
//
//   // 확인: GET /me [Authorization: Bearer key-user-1]
//   // 확인: OPTIONS /x [Origin: http://localhost:5500; Access-Control-Request-Method: POST]
//
//   여러 개는 ; 로 나눕니다. ★ 헤더 값에는 한글을 못 씁니다.
//
// 응답 헤더 대조하는 법
//
//   // 확인: GET /x [Origin: http://localhost:5500]
//   // 응답: 200 {"ok":true}
//   // 헤더: access-control-allow-origin=http://localhost:5500 | vary=Origin
//
//   여러 개는 | 로 나눕니다. (헤더 값 자체에 ; 가 자주 들어가서 이렇게 정했습니다)
//   값이 (없음) 이면 "그 헤더가 없어야 한다" 는 뜻입니다.
//
// ── 주의 ──
//
//   · 선언은 '파일에 적힌 순서대로' 실행됩니다.
//     데이터가 바뀌는 서버라면 순서가 곧 시나리오입니다.
//   · 서버는 process.env.PORT 를 읽어야 합니다.
//       const PORT = Number(process.env.PORT) || 3000;
//     Number 를 빼먹으면 "3000"+100 같은 사고가 납니다.
//   · 준비가 끝난 뒤 listen 하세요. 초기화가 안 끝난 채로 요청이 오면 결과가 흔들립니다.

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const 자료뿌리 = path.join(__dirname, "..");
// ★★★ 포트를 프로세스마다 다르게 잡습니다.
//
//   원래는 34500 고정이었습니다. 그런데 자료가 여러 벌이라
//   (백엔드자료 / 클라우드자료 / AI자료) **두 개를 동시에 돌리면 부딪힙니다.**
//
//   실제로 그 일이 났습니다. 단독으로 돌리면 553요청 0실패인데
//   다른 자료와 같이 돌렸더니 "서버 안 뜸" 이 나왔습니다.
//
//   ★ 검증 도구가 흔들리면 결과를 못 믿게 됩니다.
//     그러면 "아 그거 원래 가끔 그래" 하고 넘기게 되고, 진짜 문제를 놓칩니다.
//
//   pid 로 100칸짜리 구역을 나눠 씁니다. 겹칠 확률이 크게 줄어듭니다.
const 시작포트 = 34500 + (process.pid % 60) * 100;

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

// ★ 중간에 끊겨도 자식 서버를 반드시 죽입니다.
//
//   Ctrl-C 로 멈추면 자식이 포트를 문 채 남습니다.
//   그러면 다음 실행이 "포트가 이미 쓰이고 있습니다" 로 실패합니다.
//   원인을 모른 채 포트만 바꿔 가며 헤매게 됩니다.
const 살아있는자식 = new Set();

function 자식정리() {
  for (const 자식 of 살아있는자식) {
    try {
      자식.kill();
  살아있는자식.delete(자식);
    살아있는자식.delete(자식);
    } catch {
      // 이미 죽었으면 넘어갑니다
    }
  }
  살아있는자식.clear();
}

process.on("exit", 자식정리);
for (const 신호 of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(신호, () => {
    자식정리();
    process.exit(130);
  });
}


// 공백을 없애고 비교합니다. JSON 을 예쁘게 쓰든 붙여 쓰든 같게 봅니다.
//
// ★ 다만 공백을 통째로 지우면 {"name":"홍 길동"} 과 {"name":"홍길동"} 이
//   같아져 버립니다. 값 안의 공백은 살려야 하므로 JSON 은 파싱해서 비교합니다.
const 정규화 = (글자) => {
  const 원본 = String(글자);

  try {
    return JSON.stringify(정렬해서(JSON.parse(원본)));
  } catch {
    // JSON 이 아니면 예전처럼 공백만 지웁니다 (HTML·텍스트 응답)
    return 원본.replace(/\s+/g, "");
  }
};

// 키 순서가 달라도 같게 보도록 정렬합니다.
function 정렬해서(값) {
  if (Array.isArray(값)) return 값.map(정렬해서);
  if (값 && typeof 값 === "object") {
    return Object.fromEntries(
      Object.keys(값)
        .sort()
        .map((키) => [키, 정렬해서(값[키])])
    );
  }
  return 값;
}


function 선언수집(소스) {
  const 줄들 = 소스.split(/\r?\n/);
  const 선언들 = [];

  for (let i = 0; i < 줄들.length; i++) {
    const 확인 = 줄들[i].match(/^\s*\/\/\s*확인:\s*(\S+)\s+(\S+)\s*(.*)$/);
    if (!확인) continue;

    const [, 메서드, 경로, 본문] = 확인;

    // 바로 아래 몇 줄에서 응답 선언을 찾습니다.
    let 상태 = null;
    let 기대본문 = null;
    let 기대헤더 = null;

    for (let j = i + 1; j < Math.min(i + 4, 줄들.length); j++) {
      const 응답 = 줄들[j].match(/^\s*\/\/\s*응답:\s*(\d{3})\s*(.*)$/);

      if (응답) {
        상태 = Number(응답[1]);
        기대본문 = 응답[2].trim();

        const 헤더 = (줄들[j + 1] || "").match(/^\s*\/\/\s*헤더:\s*(.+)$/);
        if (헤더) 기대헤더 = 헤더[1].trim();

        break;
      }
    }

    if (상태 === null) continue;

    선언들.push({ 행: i + 1, 메서드, 경로, 본문: 본문.trim(), 상태, 기대본문, 기대헤더 });
  }

  return 선언들;
}


function 요청만들기(선언) {
  const 헤더 = {};
  let 본문 = 선언.본문;

  // 앞에 [이름: 값; 이름2: 값2] 가 붙어 있으면 요청 헤더로 보냅니다.
  const 헤더매치 = 본문.match(/^\[([^\]]*)\]\s*(.*)$/);

  if (헤더매치) {
    for (const 쌍 of 헤더매치[1].split(";")) {
      const 자리 = 쌍.indexOf(":");
      if (자리 > 0) 헤더[쌍.slice(0, 자리).trim()] = 쌍.slice(자리 + 1).trim();
    }
    본문 = 헤더매치[2].trim();
  }

  const 옵션 = { method: 선언.메서드, signal: AbortSignal.timeout(5000) };

  if (본문) {
    if (본문.startsWith("form:")) {
      헤더["Content-Type"] = "application/x-www-form-urlencoded";
      옵션.body = 본문.slice(5);
    } else if (본문.startsWith("multipart:")) {
      const 폼 = new FormData();

      for (const 조각 of 본문.slice(10).split("&")) {
        const 자리 = 조각.indexOf("=");
        if (자리 < 0) continue;

        const 키 = 조각.slice(0, 자리).trim();
        const 값 = 조각.slice(자리 + 1).trim();

        if (키.startsWith("@")) {
          // @file=이름.pdf  또는  @file=이름.pdf:500 (500바이트)
          const 콜론 = 값.lastIndexOf(":");
          const 크기 = 콜론 > 0 ? Number(값.slice(콜론 + 1)) : NaN;
          const 파일명 = Number.isInteger(크기) ? 값.slice(0, 콜론) : 값;
          const 내용 = Number.isInteger(크기) ? "x".repeat(크기) : "가짜 파일 내용";

          폼.append(키.slice(1), new Blob([내용]), 파일명);
        } else {
          폼.append(키, 값);
        }
      }

      옵션.body = 폼; // Content-Type 은 fetch 가 boundary 와 함께 붙입니다
    } else {
      헤더["Content-Type"] = "application/json";
      옵션.body = 본문;
    }
  }

  if (Object.keys(헤더).length > 0) 옵션.headers = 헤더;

  return 옵션;
}


function 헤더대조(선언, 응답) {
  const 실패 = [];

  for (const 쌍 of 선언.기대헤더.split("|")) {
    const 자리 = 쌍.indexOf("=");
    if (자리 < 0) continue;

    const 이름 = 쌍.slice(0, 자리).trim();
    const 기대값 = 쌍.slice(자리 + 1).trim();
    const 실제값 = 응답.headers.get(이름);

    if (기대값 === "(없음)") {
      if (실제값 !== null) {
        실패.push(`${선언.행}행 ${선언.메서드} ${선언.경로} — 헤더 ${이름} 없어야 하는데 "${실제값}"`);
      }
    } else if (정규화(실제값 ?? "") !== 정규화(기대값)) {
      실패.push(
        `${선언.행}행 ${선언.메서드} ${선언.경로} — 헤더 ${이름}\n        기대: ${기대값}\n        실제: ${실제값}`
      );
    }
  }

  return 실패;
}


async function 파일검사(전체경로, 보일이름, 포트) {
  const 소스 = fs.readFileSync(전체경로, "utf8");
  const 선언들 = 선언수집(소스);

  if (선언들.length === 0) return null; // 검증할 게 없는 파일

  // ★ process.execPath — 이 도구를 돌린 것과 같은 node 로 서버를 띄웁니다.
  const 자식 = cp.spawn(process.execPath, [전체경로], {
    env: { ...process.env, PORT: String(포트) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  살아있는자식.add(자식);

  let 에러출력 = "";
  자식.stderr.on("data", (조각) => (에러출력 += 조각.toString()));

  // ★★ stdout 도 반드시 읽어야 합니다.
  //
  //   pipe 로 열어 두고 아무도 안 읽으면 버퍼가 차서 자식이 **멈춥니다.**
  //   그러면 서버가 listen 까지 못 가고, 이 도구는 "서버 안 뜸 —
  //   포트가 이미 쓰이고 있을 수 있습니다" 라고 엉뚱한 원인을 댑니다.
  //   실제 원인은 도구 자신이 파이프를 안 비운 것입니다.
  let 보통출력 = "";
  자식.stdout.on("data", (조각) => (보통출력 += 조각.toString()));

  // 서버가 뜰 때까지 기다립니다 (최대 5초)
  let 떴나 = false;

  for (let i = 0; i < 50; i++) {
    await 잠깐(100);

    try {
      await fetch(`http://127.0.0.1:${포트}/`, { signal: AbortSignal.timeout(300) });
      떴나 = true;
      break;
    } catch {
      if (자식.exitCode !== null) break;
    }
  }

  if (!떴나) {
    console.log(`\n[서버 안 뜸] ${보일이름}  (포트 ${포트})`);
    console.log("  포트가 이미 쓰이고 있을 수 있습니다. 다른 검증이 도는 중이면 끝난 뒤 다시 하세요.");
    if (에러출력) console.log("  ! " + 에러출력.split("\n").slice(0, 3).join("\n  ! "));
    자식.kill();
  살아있는자식.delete(자식);
    살아있는자식.delete(자식);
    return { 요청수: 선언들.length, 실패: 1 };
  }

  const 실패 = [];

  for (const 선언 of 선언들) {
    try {
      const 응답 = await fetch(`http://127.0.0.1:${포트}${선언.경로}`, 요청만들기(선언));
      const 글자 = await 응답.text();

      if (응답.status !== 선언.상태) {
        실패.push(`${선언.행}행 ${선언.메서드} ${선언.경로} — 상태 기대 ${선언.상태} / 실제 ${응답.status}`);
      } else if (선언.기대본문 && 정규화(글자) !== 정규화(선언.기대본문)) {
        실패.push(
          `${선언.행}행 ${선언.메서드} ${선언.경로} — 본문 다름\n        기대: ${선언.기대본문}\n        실제: ${글자.slice(0, 160)}`
        );
      }

      if (선언.기대헤더) 실패.push(...헤더대조(선언, 응답));
    } catch (에러) {
      실패.push(`${선언.행}행 ${선언.메서드} ${선언.경로} — 요청 실패: ${에러.message}`);
    }
  }

  자식.kill();
  살아있는자식.delete(자식);
  await 잠깐(150);

  if (실패.length) {
    console.log(`\n[불일치] ${보일이름}  (${선언들.length}건 중 ${실패.length}건)`);
    실패.slice(0, 12).forEach((줄) => console.log("  · " + 줄));
    if (실패.length > 12) console.log(`  ...외 ${실패.length - 12}건`);
    return { 요청수: 선언들.length, 실패: 실패.length };
  }

  console.log(`[OK] ${보일이름}  (요청 ${선언들.length}건 전부 일치)`);
  return { 요청수: 선언들.length, 실패: 0 };
}


async function 폴더검사(폴더, 포트시작) {
  if (!fs.existsSync(폴더)) {
    console.log(`[없는 폴더] ${폴더}`);
    return { 파일수: 0, 요청수: 0, 실패: 1, 다음포트: 포트시작 };
  }

  // 폴더 맨 위의 .js 를 전부 봅니다.
  // 그중 `// 확인:` 선언이 없는 파일은 파일검사가 알아서 건너뜁니다.
  // (파일 이름 규칙에 기대면 server.js 같은 것을 놓칩니다)
  const 후보 = fs
    .readdirSync(폴더, { withFileTypes: true })
    .filter((항목) =>항목.isFile() && 항목.name.endsWith(".js"))
    .map((항목) => 항목.name)
    .sort();

  let 파일수 = 0;
  let 요청수 = 0;
  let 실패 = 0;
  let 포트 = 포트시작;

  for (const 이름 of 후보) {
    const 결과 = await 파일검사(path.join(폴더, 이름), 이름, 포트);

    if (결과) {
      파일수 += 1;
      요청수 += 결과.요청수;
      실패 += 결과.실패;
      포트 += 1;
    }
  }

  console.log(
    `\n===== ${path.basename(폴더)} : 서버 파일 ${파일수}개 / 요청 ${요청수}건 / 실패 ${실패}건 =====`
  );

  return { 파일수, 요청수, 실패, 다음포트: 포트 };
}


function 단원목록() {
  return fs
    .readdirSync(자료뿌리, { withFileTypes: true })
    .filter((항목) => 항목.isDirectory() && /^\d\d_/.test(항목.name))
    .map((항목) => 항목.name)
    .sort();
}


(async () => {
  const 넘어온것 = process.argv.slice(2);
  const 대상들 = 넘어온것.length > 0 ? 넘어온것 : 단원목록();

  let 전체파일 = 0;
  let 전체요청 = 0;
  let 전체실패 = 0;
  let 포트 = 시작포트;

  for (const 대상 of 대상들) {
    const 폴더 = path.isAbsolute(대상) ? 대상 : path.join(자료뿌리, 대상);
    const 결과 = await 폴더검사(폴더, 포트);

    전체파일 += 결과.파일수;
    전체요청 += 결과.요청수;
    전체실패 += 결과.실패;
    포트 = 결과.다음포트;
  }

  if (대상들.length > 1) {
    console.log(
      `\n########## 전체: 서버 파일 ${전체파일}개 / 요청 ${전체요청}건 / 실패 ${전체실패}건 ##########`
    );
  }

  process.exit(전체실패 > 0 ? 1 : 0);
})();
