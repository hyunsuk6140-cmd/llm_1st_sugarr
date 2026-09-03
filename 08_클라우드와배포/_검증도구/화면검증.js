// ============================================================
// _검증도구/화면검증.js — 진짜 크롬으로 화면을 눌러 보고 글자를 대조한다
// ------------------------------------------------------------
// 사용:
//   node _검증도구/화면검증.js 10_프론트엔드_연동
//   node _검증도구/화면검증.js                  ← public 폴더가 있는 단원 전부
//
// 준비:
//   npm install --save-dev puppeteer-core
//
// 왜 필요한가:
//   서버검증은 '서버가 무엇을 주는지' 만 봅니다.
//   화면이 그걸 제대로 그리는지는 확인하지 못합니다.
//
//   버튼을 눌렀을 때 로딩이 뜨는지, 에러 글이 나오는지,
//   빈 목록에 안내가 나오는지 — 전부 눌러 봐야 압니다.
// ============================================================
//
// ── 선언 문법 ──
//
// 서버 파일 안에 이렇게 적어 두면 검증합니다.
//
//   // 화면: 01_기본.html  button[data-할일="목록"]
//   // 보임: #결과  컨베이어 1호
//
//   화면 줄:  페이지파일  [누를 선택자]      ← 선택자는 없어도 됩니다
//   입력 줄:  선택자=값  선택자2=값2         ← 없어도 됩니다 (화면과 보임 사이)
//   보임 줄:  읽을 선택자  들어 있어야 할 글자
//
// 여러 개를 눌러야 하면 화면 줄의 선택자를 쉼표가 아니라 ' >> ' 로 잇습니다.
//
//   // 화면: 04_목록.html  button#다음쪽 >> button#다음쪽
//
// 안 보여야 하는 것을 확인하려면 글자 앞에 ! 를 붙입니다.
//
//   // 보임: #결과  !불러오는 중

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const 자료뿌리 = path.join(__dirname, "..");

// ★ 건너뛴 것과 통과한 것은 다릅니다. 전체검증이 구분할 수 있게 따로 알립니다.
const 건너뜀코드 = 2;
const 포트 = 3000;

const 크롬후보 = [
  process.env.CHROME_PATH,
  // 윈도우
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // 리눅스
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

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



function 크롬찾기() {
  for (const 경로 of 크롬후보) if (fs.existsSync(경로)) return 경로;
  return null;
}


function 선언수집(소스) {
  const 줄들 = 소스.split(/\r?\n/);
  const 선언들 = [];

  for (let i = 0; i < 줄들.length; i++) {
    const 화면 = 줄들[i].match(/^\s*\/\/\s*화면:\s*(\S+)\s*(.*)$/);
    if (!화면) continue;

    const 페이지 = 화면[1];
    const 누를것 = 화면[2].trim();

    let 입력 = null;
    const 보임들 = [];

    for (let j = i + 1; j < Math.min(i + 8, 줄들.length); j++) {
      const 입력줄 = 줄들[j].match(/^\s*\/\/\s*입력:\s*(.+)$/);
      if (입력줄) {
        입력 = 입력줄[1].trim();
        continue;
      }

      const 보임줄 = 줄들[j].match(/^\s*\/\/\s*보임:\s*(\S+)\s+(.+)$/);
      if (보임줄) {
        보임들.push({ 선택자: 보임줄[1], 글자: 보임줄[2].trim() });
        continue;
      }

      // 화면·입력·보임 이 아닌 줄을 만나면 그 선언은 끝난 것입니다.
      if (보임들.length > 0) break;
      if (!/^\s*(\/\/)?\s*$/.test(줄들[j])) break;
    }

    if (보임들.length === 0) continue;

    선언들.push({ 행: i + 1, 페이지, 누를것, 입력, 보임들 });
  }

  return 선언들;
}


async function 선언하나(페이지객체, 선언, 기준주소) {
  const 실패 = [];

  await 페이지객체.goto(`${기준주소}/${선언.페이지}`, { waitUntil: "load" });

  // 값 넣기
  if (선언.입력) {
    for (const 쌍 of 선언.입력.split(/\s+(?=\S+=)/)) {
      const 자리 = 쌍.indexOf("=");
      if (자리 < 0) continue;

      const 선택자 = 쌍.slice(0, 자리).trim();
      const 값 = 쌍.slice(자리 + 1).trim();

      await 페이지객체.$eval(
        선택자,
        (요소, 넣을값) => {
          요소.value = 넣을값;
          요소.dispatchEvent(new Event("input", { bubbles: true }));
          요소.dispatchEvent(new Event("change", { bubbles: true }));
        },
        값
      );
    }
  }

  // 누르기 (그리고 사이사이 값 넣기)
  //
  //   #보내기 >> 입력(#name=검사기 1호) >> #보내기
  //
  // 처럼 쓰면 누르기와 값 넣기를 섞을 수 있습니다.
  // 폼을 보내면 화면이 비워지는 경우가 있어서 필요합니다.
  if (선언.누를것 && 선언.누를것 !== "-") {
    for (const 하나 of 선언.누를것.split(">>").map((s) => s.trim())) {
      // 파일(#선택자=경로)  — 파일 고르기
      const 파일하나 = 하나.match(/^파일\((.+)\)$/);

      if (파일하나) {
        const 자리 = 파일하나[1].indexOf("=");
        const 선택자 = 파일하나[1].slice(0, 자리).trim();
        const 상대경로 = 파일하나[1].slice(자리 + 1).trim();
        const 진짜경로 = path.isAbsolute(상대경로) ? 상대경로 : path.join(자료뿌리, 상대경로);

        const 요소 = await 페이지객체.$(선택자);
        await 요소.uploadFile(진짜경로);

        // change 이벤트를 일으켜 미리보기 같은 것이 돌게 합니다.
        await 페이지객체.$eval(선택자, (el) =>
          el.dispatchEvent(new Event("change", { bubbles: true }))
        );

        await 잠깐(200);
        continue;
      }

      const 입력하나 = 하나.match(/^입력\((.+)\)$/);

      if (입력하나) {
        const 자리 = 입력하나[1].indexOf("=");
        const 선택자 = 입력하나[1].slice(0, 자리).trim();
        const 값 = 입력하나[1].slice(자리 + 1).trim();

        await 페이지객체.$eval(
          선택자,
          (요소, 넣을값) => {
            요소.value = 넣을값;
            요소.dispatchEvent(new Event("input", { bubbles: true }));
            요소.dispatchEvent(new Event("change", { bubbles: true }));
          },
          값
        );
        continue;
      }

      // ★ 화면이 그려질 때까지 기다렸다 누릅니다.
      //   목록처럼 요청을 받아 그리는 것은 바로 없습니다.
      //   안 기다리면 "No element found for selector" 가 납니다.
      await 페이지객체.waitForSelector(하나, { timeout: 5000 });
      await 페이지객체.click(하나);
      await 잠깐(400);
    }
  } else {
    await 잠깐(300); // 화면이 처음 그려질 시간
  }

  // 대조
  //
  // ★ 한 번만 보고 판단하면 안 됩니다.
  //   응답이 늦게 오는 경우가 있습니다. 특히 '서버에 못 닿는' 경우는
  //   연결이 끊길 때까지 몇 초가 걸립니다.
  //   그래서 최대 4초 동안 조금씩 기다리며 다시 봅니다.
  //   (실패할 때만 4초를 다 쓰고, 성공하면 바로 넘어갑니다)
  for (const 볼것 of 선언.보임들) {
    const 없어야하나 = 볼것.글자.startsWith("!");
    const 찾을글 = 없어야하나 ? 볼것.글자.slice(1) : 볼것.글자;

    let 실제 = null;
    let 통과 = false;

    for (let 번째 = 0; 번째 < 40; 번째++) {
      try {
        실제 = await 페이지객체.$eval(볼것.선택자, (요소) => 요소.textContent);
      } catch {
        실제 = null;
      }

      if (실제 !== null) {
        const 들었나 = 실제.includes(찾을글);
        if (없어야하나 ? !들었나 : 들었나) {
          통과 = true;
          break;
        }
      }

      await 잠깐(100);
    }

    if (통과) continue;

    if (실제 === null) {
      실패.push(`${선언.행}행 ${선언.페이지} — ${볼것.선택자} 를 화면에서 못 찾음`);
    } else if (없어야하나) {
      실패.push(`${선언.행}행 ${선언.페이지} ${볼것.선택자} — "${찾을글}" 이 없어야 하는데 있음`);
    } else {
      실패.push(
        `${선언.행}행 ${선언.페이지} ${볼것.선택자}\n        기대: "${찾을글}" 이 들어 있어야 함\n        실제: ${실제.replace(/\s+/g, " ").slice(0, 140)}`
      );
    }
  }

  return 실패;
}


async function 파일검사(퍼페티어, 크롬, 전체경로, 보일이름) {
  const 소스 = fs.readFileSync(전체경로, "utf8");
  const 선언들 = 선언수집(소스);

  if (선언들.length === 0) return null;

  const 자식 = cp.spawn(process.execPath, [전체경로], {
    env: { ...process.env, PORT: String(포트) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  살아있는자식.add(자식);

  let 에러출력 = "";
  자식.stderr.on("data", (조각) => (에러출력 += 조각.toString()));

  const 기준주소 = `http://localhost:${포트}`;
  let 떴나 = false;

  for (let i = 0; i < 50; i++) {
    await 잠깐(100);
    try {
      await fetch(기준주소 + "/", { signal: AbortSignal.timeout(300) });
      떴나 = true;
      break;
    } catch {
      if (자식.exitCode !== null) break;
    }
  }

  if (!떴나) {
    console.log(`\n[서버 안 뜸] ${보일이름}`);
    if (에러출력) console.log("  ! " + 에러출력.split("\n")[0]);
    자식.kill();
  살아있는자식.delete(자식);
    살아있는자식.delete(자식);
    return { 선언수: 선언들.length, 실패: 1 };
  }

  const 브라우저 = await 퍼페티어.launch({ executablePath: 크롬, headless: "new" });
  const 페이지객체 = await 브라우저.newPage();

  const 콘솔에러 = [];
  페이지객체.on("pageerror", (에러) => 콘솔에러.push(에러.message));

  const 실패 = [];

  for (const 선언 of 선언들) {
    try {
      실패.push(...(await 선언하나(페이지객체, 선언, 기준주소)));
    } catch (에러) {
      실패.push(`${선언.행}행 ${선언.페이지} — ${에러.message.split("\n")[0]}`);
    }
  }

  await 브라우저.close();
  자식.kill();
  살아있는자식.delete(자식);
  await 잠깐(150);

  if (콘솔에러.length) {
    console.log(`\n[화면 에러] ${보일이름}`);
    [...new Set(콘솔에러)].slice(0, 5).forEach((줄) => console.log("  ! " + 줄));
  }

  if (실패.length) {
    console.log(`\n[불일치] ${보일이름}  (${선언들.length}건 중 ${실패.length}건)`);
    실패.slice(0, 12).forEach((줄) => console.log("  · " + 줄));
    return { 선언수: 선언들.length, 실패: 실패.length };
  }

  console.log(`[OK] ${보일이름}  (화면 ${선언들.length}건 전부 일치)`);
  return { 선언수: 선언들.length, 실패: 콘솔에러.length > 0 ? 1 : 0 };
}


function 단원목록() {
  return fs
    .readdirSync(자료뿌리, { withFileTypes: true })
    .filter((항목) => 항목.isDirectory() && /^\d\d_/.test(항목.name))
    .filter((항목) => fs.existsSync(path.join(자료뿌리, 항목.name, "public")))
    .map((항목) => 항목.name)
    .sort();
}


(async () => {
  let 퍼페티어;

  try {
    퍼페티어 = require("puppeteer-core");
  } catch (에러) {
    if (에러.code === "MODULE_NOT_FOUND") {
      console.log("[건너뜀] puppeteer-core 가 없습니다.");
      console.log("쓰려면:  npm install --save-dev puppeteer-core");
      process.exit(건너뜀코드);
    }

    // ★ 여기가 중요합니다. 설치돼 있는데 require 가 실패하는 경우가 있습니다.
    //   puppeteer-core 는 ESM 이라 옛 Node 에서는 require 로 못 읽습니다.
    //   (Node 22.12 미만: ERR_REQUIRE_ESM)
    //   예전에는 이걸 "없음" 으로 뭉개서, 설치돼 있는데도 조용히 건너뛰었습니다.
    try {
      퍼페티어 = (await import("puppeteer-core")).default;
    } catch (또에러) {
      console.log("[건너뜀] puppeteer-core 를 읽지 못했습니다.");
      console.log(`  require: ${에러.code ?? 에러.message}`);
      console.log(`  import : ${또에러.code ?? 또에러.message}`);
      process.exit(건너뜀코드);
    }
  }

  const 크롬 = 크롬찾기();

  if (!크롬) {
    console.log("[건너뜀] 크롬을 찾지 못했습니다. CHROME_PATH 환경변수로 알려 주세요.");
    console.log("  찾아본 곳:");
    for (const 경로 of 크롬후보) console.log(`    ${경로}`);
    process.exit(건너뜀코드);
  }

  const 넘어온것 = process.argv.slice(2);
  const 대상들 = 넘어온것.length > 0 ? 넘어온것 : 단원목록();

  let 전체선언 = 0;
  let 전체실패 = 0;

  for (const 대상 of 대상들) {
    const 폴더 = path.isAbsolute(대상) ? 대상 : path.join(자료뿌리, 대상);

    if (!fs.existsSync(폴더)) {
      console.log(`[없는 폴더] ${폴더}`);
      전체실패 += 1;
      continue;
    }

    let 선언수 = 0;
    let 실패 = 0;

    // 폴더 맨 위의 .js 를 전부 봅니다.
    // `// 화면:` 선언이 없는 파일은 파일검사가 알아서 건너뜁니다.
    const 후보 = fs
      .readdirSync(폴더, { withFileTypes: true })
      .filter((항목) => 항목.isFile() && 항목.name.endsWith(".js"))
      .map((항목) => 항목.name)
      .sort();

    for (const 이름 of 후보) {
      const 결과 = await 파일검사(퍼페티어, 크롬, path.join(폴더, 이름), 이름);

      if (결과) {
        선언수 += 결과.선언수;
        실패 += 결과.실패;
      }
    }

    console.log(`\n===== ${path.basename(폴더)} : 화면 ${선언수}건 / 실패 ${실패}건 =====`);
    전체선언 += 선언수;
    전체실패 += 실패;
  }

  console.log(`\n########## 전체: 화면 ${전체선언}건 / 실패 ${전체실패}건 ##########`);

  // ★ 선언이 하나도 없으면 "통과" 가 아니라 "아무것도 안 봤음" 입니다.
  //   조용히 0 으로 끝내면 전체검증이 "이상 없음" 이라고 알려 줍니다.
  if (전체선언 === 0 && 전체실패 === 0) {
    console.log("\n[건너뜀] `// 화면:` 선언이 한 건도 없습니다. 검사한 것이 없습니다.");
    console.log("  선언을 넣거나, 이 자료에 화면 검증이 필요 없다면 도구를 정리하세요.");
    process.exit(건너뜀코드);
  }

  process.exit(전체실패 > 0 ? 1 : 0);
})();
