// ============================================================
// 가짜Supabase.js — 네트워크 없이 Supabase 를 흉내 내는 도구
// ------------------------------------------------------------
// 이 단원의 예제들이 인터넷 없이도 돌아가게 해 주는 파일입니다.
// 수업 자료용이며, 실무에서 쓰는 것이 아닙니다.
// ============================================================
//
// ★ 왜 이런 걸 만드나
//
//   Supabase 는 인터넷 건너에 있습니다. 계정과 프로젝트가 필요합니다.
//   그런데 자료의 예제는 누구나 바로 돌려 볼 수 있어야 합니다.
//   그리고 "이 코드가 어떤 요청을 보내는가" 는 서버 없이도 확인할 수 있습니다.
//
//   createClient 에 fetch 를 직접 넣어 줄 수 있습니다.
//   그 fetch 가 진짜 서버 대신 대답하게 만들면 됩니다.
//
// ★★ 이건 수업용 장치만은 아닙니다.
//   실무에서 테스트를 짤 때 똑같이 합니다.
//   진짜 DB 를 안 건드리고 "내 코드가 맞는 요청을 보내는가" 만 확인하는 것입니다.

const { createClient } = require("@supabase/supabase-js");

// ★★ 주소와 키에 한글을 쓰면 안 됩니다.
//
//   키는 Authorization·apikey 헤더에 실려 나갑니다.
//   HTTP 헤더에는 ASCII 만 들어갑니다. (백엔드 05단원에서 겪은 그 문제)
//
//     const sb = createClient("https://x.supabase.co", "예시-키");
//     → TypeError: Cannot convert argument to a ByteString ...
//
//   이 파일을 만들면서 실제로 밟았습니다. 진짜 키는 어차피 ASCII 라 문제없지만,
//   시험용 값을 한글로 지으면 이렇게 터집니다.
const 예시주소 = "https://example.supabase.co";
const 예시키 = "example-anon-key";

// ── JSON 응답 만들기 ──

function JSON응답(몸, 상태 = 200, 헤더 = {}) {
  return new Response(몸 === null ? null : JSON.stringify(몸), {
    status: 상태,
    headers: { "Content-Type": "application/json", ...헤더 },
  });
}

// ── 헤더는 Headers 객체일 수도, 그냥 객체일 수도 있습니다 ──

function 헤더읽기(옵션, 이름) {
  const 헤더 = 옵션.headers;
  if (!헤더) return null;
  if (typeof 헤더.get === "function") return 헤더.get(이름);
  return 헤더[이름] ?? 헤더[이름.toLowerCase()] ?? null;
}

// ============================================================
// 요청을 기록만 하는 클라이언트
// ============================================================
//
// "내 코드가 어떤 REST 요청을 만드는가" 를 보는 데 씁니다.

function 기록하는클라이언트(돌려줄것 = []) {
  const 기록 = [];

  const 클라이언트 = createClient(예시주소, 예시키, {
    auth: { persistSession: false },
    global: {
      fetch: async (주소, 옵션 = {}) => {
        기록.push({
          방법: 옵션.method ?? "GET",
          주소: decodeURIComponent(String(주소)).replace(`${예시주소}/rest/v1`, ""),
          본문: 옵션.body ?? null,
          Prefer: 헤더읽기(옵션, "Prefer"),
          Accept: 헤더읽기(옵션, "Accept"),
        });

        return JSON응답(돌려줄것);
      },
    },
  });

  return { 클라이언트, 기록 };
}

// ============================================================
// 표를 흉내 내는 클라이언트
// ============================================================
//
// 진짜로 자료를 담아 두고, 조건에 맞는 것을 골라 줍니다.
// PostgREST 를 아주 얕게 흉내 냅니다. 배우는 데 필요한 만큼만입니다.

//   설정으로 줄 수 있는 것
//     겹치면안되는칸  그 칸이 겹치면 23505 를 냅니다 (UNIQUE 흉내)
//     기본값          insert 에서 안 준 칸을 채웁니다 (DEFAULT 흉내)
//     읽기막힘        RLS 로 읽기가 막힌 상태 → 빈 배열
//     쓰기막힘        RLS 로 쓰기가 막힌 상태 → 42501
function 표있는클라이언트(처음자료 = [], 설정 = {}) {
  let 자료 = 처음자료.map((줄) => ({ ...줄 }));
  let 다음id = 자료.reduce((큰, 줄) => Math.max(큰, 줄.id ?? 0), 0) + 1;

  // 다음 요청에서 낼 오류를 미리 정해 둘 수 있습니다
  let 낼오류 = null;
  const 오류내기 = (몸, 상태) => { 낼오류 = { 몸, 상태 }; };

  // ★ 조건걸기 가 흉내 낼 줄 아는 연산자들입니다.
  const 아는연산자 = ["eq", "neq", "gt", "gte", "lt", "lte", "is", "in", "like", "ilike"];

  // ★ 조건이 아닌 검색값입니다. 조건걸기 는 그냥 지나갑니다.
  const 조건아닌칸 = ["select", "order", "limit", "offset", "on_conflict", "columns"];

  function 검색값에서(검색값, 이름) {
    const 찾은것 = 검색값.find(([칸]) => 칸 === 이름);
    return 찾은것 ? 찾은것[1] : null;
  }

  // ============================================================
  // ★★★ 흉내 못 내는 요청은 **조용히 넘어가면 안 됩니다**
  // ============================================================
  //
  //   예전의 이 파일은 모르는 연산자를 만나면 그냥 true 를 돌려줬습니다.
  //   그래서 이런 일이 일어났습니다.
  //
  //     await sb.from("equipments").select("*").or("line.eq.A,line.eq.B");
  //     → 3줄짜리 표에서 **3줄 전부** 가 돌아왔습니다
  //
  //   막힌 게 아니라 **열린 채로 실패**한 것입니다. (fail-open 이라고 합니다)
  //   결과가 나오니 "잘 되네" 로 보입니다. 진짜 Supabase 로 갈아탄 뒤에야
  //   답이 달라진 걸 발견합니다. 그때는 어디가 문제인지 찾기가 아주 어렵습니다.
  //
  //   그래서 지금은 **큰 소리로 실패합니다.** (fail-closed 라고 합니다)
  //   흉내 못 내는 요청을 만나면 501 오류를 돌려줍니다.
  //
  // ★★ 이건 보안에서도 똑같은 원칙입니다.
  //   판단을 못 하겠으면 열어 두지 말고 닫아야 합니다. (개념04 의 RLS 와 같은 이야기)
  function 못흉내내는것(검색값) {
    const select값 = 검색값에서(검색값, "select");
    if (select값 && select값.includes("(")) {
      return "가짜Supabase 는 중첩 select (표를 이어 가져오기) 를 흉내 내지 않습니다";
    }

    for (const [칸, 값] of 검색값) {
      if (조건아닌칸.includes(칸)) continue;

      // .or() 는 or=(...) 로, .not() 은 칸=not.연산.값 으로 옵니다
      if (칸 === "or" || 칸 === "and" || 칸 === "not") {
        return `가짜Supabase 는 .${칸}() 를 흉내 내지 않습니다`;
      }

      const 연산 = 값.split(".")[0];
      if (!아는연산자.includes(연산)) {
        return `가짜Supabase 는 ${연산} 연산자를 흉내 내지 않습니다 (${칸}=${값})`;
      }
    }

    return null;
  }

  function 조건걸기(줄들, 검색값) {
    let 남은것 = 줄들;

    for (const [칸, 값] of 검색값) {
      if (조건아닌칸.includes(칸)) continue;

      const [연산, ...나머지] = 값.split(".");
      const 비교값 = 나머지.join(".");

      남은것 = 남은것.filter((줄) => {
        const 실제 = 줄[칸];

        if (연산 === "eq") return String(실제) === 비교값;
        if (연산 === "neq") return String(실제) !== 비교값;
        if (연산 === "gt") return Number(실제) > Number(비교값);
        if (연산 === "gte") return Number(실제) >= Number(비교값);
        if (연산 === "lt") return Number(실제) < Number(비교값);
        if (연산 === "lte") return Number(실제) <= Number(비교값);
        if (연산 === "is") return 비교값 === "null" ? 실제 == null : 실제 != null;
        if (연산 === "in") {
          const 값들 = 비교값.replace(/^\(|\)$/g, "").split(",").map((v) => v.replace(/^"|"$/g, ""));
          return 값들.includes(String(실제));
        }
        if (연산 === "like" || 연산 === "ilike") {
          const 정규식 = new RegExp(
            "^" + 비교값.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$",
            연산 === "ilike" ? "i" : ""
          );
          return 정규식.test(String(실제));
        }
        // ★ 여기까지 오면 모르는 연산자입니다.
        //   못흉내내는것() 이 먼저 걸러 주니 실제로는 도달하지 않습니다.
        return true;
      });
    }

    return 남은것;
  }

  function 정렬하기(줄들, 정렬값) {
    if (!정렬값) return 줄들;

    const 기준들 = 정렬값.split(",").map((조각) => {
      const [칸, 방향 = "asc"] = 조각.split(".");
      return { 칸, 내림차순: 방향.startsWith("desc") };
    });

    return [...줄들].sort((가, 나) => {
      for (const { 칸, 내림차순 } of 기준들) {
        const 가값 = 가[칸];
        const 나값 = 나[칸];
        if (가값 === 나값) continue;

        // Postgres 는 기본으로 NULL 을 가장 크게 봅니다 (SQLite 와 반대)
        if (가값 == null) return 내림차순 ? -1 : 1;
        if (나값 == null) return 내림차순 ? 1 : -1;

        const 앞 = 가값 < 나값 ? -1 : 1;
        return 내림차순 ? -앞 : 앞;
      }
      return 0;
    });
  }

  // ★★ select 에 적은 칸만 돌려줍니다.
  //
  //   예전에는 select 파라미터를 아예 무시해서, .select("id") 를 해도
  //   모든 칸이 돌아왔습니다. 진짜 Supabase 는 적어 준 칸만 줍니다.
  //   그 차이를 모른 채 짜면, 진짜로 갈아 끼운 순간 undefined 가 쏟아집니다.
  //
  // ★ "별칭:칸" 도 진짜에서는 됩니다. 그것까지 흉내 냅니다.
  //     .select("이름:name")  →  { 이름: "용접로봇 1호" }
  function 칸고르기(줄들, select값) {
    if (!줄들 || !select값 || select값 === "*") return 줄들;

    const 고를것 = select값.split(",").map((조각) => {
      const [앞, 뒤] = 조각.split(":");
      return { 이름: (뒤 ?? 앞).trim(), 별칭: 앞.trim() };
    });

    return 줄들.map((줄) => {
      const 새줄 = {};
      for (const { 이름, 별칭 } of 고를것) {
        if (이름 === "*") Object.assign(새줄, 줄);
        else 새줄[별칭] = 줄[이름];
      }
      return 새줄;
    });
  }

  const 클라이언트 = createClient(예시주소, 예시키, {
    auth: { persistSession: false },
    global: {
      fetch: async (주소, 옵션 = {}) => {
        if (낼오류) {
          const { 몸, 상태 } = 낼오류;
          낼오류 = null;
          return JSON응답(몸, 상태);
        }

        const url = new URL(String(주소));
        const 검색값 = [...url.searchParams.entries()];
        const 방법 = 옵션.method ?? "GET";
        const Accept = 헤더읽기(옵션, "Accept") ?? "";
        const Prefer = 헤더읽기(옵션, "Prefer") ?? "";
        const 하나만 = Accept.includes("pgrst.object");

        // ── ★★★ 흉내 못 내는 요청이면 여기서 큰 소리로 실패합니다 ──
        const 못하는것 = 못흉내내는것(검색값);
        if (못하는것) {
          return JSON응답({
            code: "PGRST999",
            details: "가짜Supabase.js 의 한계입니다. 진짜 Supabase 에서는 됩니다.",
            hint: "가짜Supabase.js 맨 아래 '이 파일의 한계' 를 보세요.",
            message: 못하는것,
          }, 501);
        }

        // ── RLS 흉내: 읽기를 막아 둔 경우 ──
        if (설정.읽기막힘 && 방법 === "GET") {
          return JSON응답([], 200); // ★ 오류가 아니라 빈 배열입니다
        }
        if (설정.쓰기막힘 && 방법 !== "GET") {
          // ★★★ 403 입니다. 401 이 아닙니다.
          //
          //   401 은 "네가 누군지 모르겠다" 이고
          //   403 은 "누군지는 알겠는데 권한이 없다" 입니다.
          //
          //   PostgREST 는 토큰이 **있으면** 42501 을 403 으로 냅니다.
          //   anon key 도 JWT 라서, 로그인을 안 했어도 토큰은 늘 붙어 갑니다.
          //   그래서 실제로는 거의 항상 403 입니다.
          return JSON응답({
            code: "42501",
            details: null,
            hint: null,
            message: `new row violates row-level security policy for table "${url.pathname.split("/").pop()}"`,
          }, 403);
        }

        let 결과;

        // ★ count 로 알려 줄 개수입니다.
        //   limit·offset 으로 **자르기 전**의 개수여야 합니다.
        //   "지금 화면에 3개, 전체는 120개" 를 만들 때 쓰는 값이니까요.
        let 전체개수 = 0;

        if (방법 === "GET") {
          결과 = 조건걸기(자료, 검색값);
          결과 = 정렬하기(결과, url.searchParams.get("order"));
          전체개수 = 결과.length;

          const 건너뛰기 = Number(url.searchParams.get("offset") ?? 0);
          const 개수 = url.searchParams.get("limit");
          결과 = 결과.slice(건너뛰기, 개수 ? 건너뛰기 + Number(개수) : undefined);
        } else if (방법 === "POST") {
          const 들어온것 = JSON.parse(옵션.body);
          const 줄들 = Array.isArray(들어온것) ? 들어온것 : [들어온것];
          const 겹침칸 = url.searchParams.get("on_conflict");

          결과 = [];

          for (const 줄 of 줄들) {
            const 이미있는것 = 겹침칸 ? 자료.find((있는) => 있는[겹침칸] === 줄[겹침칸]) : null;

            if (이미있는것) {
              Object.assign(이미있는것, 줄);
              결과.push({ ...이미있는것 });
              continue;
            }

            // UNIQUE 흉내
            if (설정.겹치면안되는칸) {
              const 겹치나 = 자료.some((있는) => 있는[설정.겹치면안되는칸] === 줄[설정.겹치면안되는칸]);
              if (겹치나) {
                // ★ 키 순서도 진짜 PostgREST 와 맞췄습니다.
                //   code → details → hint → message 순으로 옵니다.
                return JSON응답({
                  code: "23505",
                  details: `Key (${설정.겹치면안되는칸})=(${줄[설정.겹치면안되는칸]}) already exists.`,
                  hint: null,
                  message: `duplicate key value violates unique constraint "설비_${설정.겹치면안되는칸}_key"`,
                }, 409);
              }
            }

            // DEFAULT 흉내 — 안 준 칸을 기본값으로 채웁니다
            const 새줄 = { id: 다음id++, ...(설정.기본값 ?? {}), ...줄 };
            자료.push(새줄);
            결과.push({ ...새줄 });
          }
        } else if (방법 === "PATCH") {
          const 바꿀것 = JSON.parse(옵션.body);
          결과 = 조건걸기(자료, 검색값);
          결과.forEach((줄) => Object.assign(줄, 바꿀것));
          결과 = 결과.map((줄) => ({ ...줄 }));
        } else if (방법 === "DELETE") {
          결과 = 조건걸기(자료, 검색값).map((줄) => ({ ...줄 }));
          const 지울id들 = new Set(결과.map((줄) => 줄.id));
          자료 = 자료.filter((줄) => !지울id들.has(줄.id));
        }

        // ── select 에 적은 칸만 남깁니다 ──
        //
        // ★ 거르고 정렬한 **뒤에** 합니다.
        //   select 에 없는 칸으로도 정렬·조건을 걸 수 있으니까요.
        결과 = 칸고르기(결과, url.searchParams.get("select"));

        // ── Accept 가 pgrst.object 면 서버가 개수를 검사합니다 ──
        if (하나만) {
          if (결과.length !== 1) {
            return JSON응답({
              code: "PGRST116",
              details: `The result contains ${결과.length} rows`,
              hint: null,
              message: "JSON object requested, multiple (or no) rows returned",
            }, 406);
          }
          return JSON응답(결과[0]);
        }

        // ── 쓰기인데 return=representation 이 없으면 본문이 없습니다 ──
        if (방법 !== "GET" && !Prefer.includes("return=representation")) {
          return new Response(null, { status: 204 });
        }

        // ── Content-Range ──
        //
        // ★★ 진짜 PostgREST 는 전체 개수를 **물어봤을 때만** 알려 줍니다.
        //
        //     .select("*")                        → Content-Range: 0-2/*
        //     .select("*", { count: "exact" })    → Content-Range: 0-2/3
        //
        //   개수를 세는 건 비싼 일이라 기본으로는 안 셉니다. (03단원 개념04)
        //   슬래시 뒤의 * 가 "안 세어 봤다" 는 뜻입니다.
        //   0건이면 앞쪽도 * 가 됩니다.
        //
        // ★★★ 전체 개수는 **조건에 맞는 줄의 수**입니다. 표 전체가 아닙니다.
        //   .eq("line","A") 를 걸었으면 A 라인 줄 수가 옵니다.
        //   그리고 limit 으로 자르기 전의 수입니다. 쪽 나누기는 이 값으로 합니다.
        const 개수요청 = /count=(exact|planned|estimated)/.test(Prefer);
        const 범위 = 결과.length > 0 ? `0-${결과.length - 1}` : "*";
        const 전체 = 개수요청 ? String(방법 === "GET" ? 전체개수 : 결과.length) : "*";

        return JSON응답(결과, 방법 === "POST" ? 201 : 200, {
          "Content-Range": `${범위}/${전체}`,
        });
      },
    },
  });

  return {
    클라이언트,
    오류내기,
    지금자료: () => 자료.map((줄) => ({ ...줄 })),
  };
}

module.exports = { 기록하는클라이언트, 표있는클라이언트, JSON응답 };


// ============================================================
// 이 파일의 한계 — 꼭 읽으세요
// ============================================================
//
// 이건 진짜 Postgres 가 아닙니다. 흉내입니다.
//
//   ✗ 진짜 SQL 을 실행하지 않습니다
//   ✗ 트랜잭션이 없습니다
//   ✗ 타입 검사가 없습니다
//   ✗ RLS 를 정말로 적용하지 않습니다 (설정으로 흉내만 냅니다)
//   ✗ .or() / .not() 과 중첩 select(표 이어 가져오기) 를 처리하지 않습니다
//     ★ 다만 **조용히 넘어가지 않습니다.** 501 오류를 냅니다.
//       예전에는 or 를 만나면 전체 줄을 돌려줬습니다. 그게 더 위험했습니다.
//
//   ○ 요청 주소·본문·헤더는 **진짜 클라이언트가 만든 것** 입니다
//   ○ 응답 모양({ data, error, status })도 진짜와 같습니다
//   ○ 오류 코드(23505, PGRST116, 42501) 도 실제 값입니다
//   ○ error 의 키 순서(code, details, hint, message) 도 진짜와 같습니다
//   ○ select 에 적은 칸만 돌려줍니다
//   ○ RLS 로 쓰기가 막히면 **403** 입니다 (401 이 아닙니다)
//   ○ Content-Range 는 count 를 물어봤을 때만 전체 개수를 채웁니다
//
// ★★ 그래서 이걸로 확인할 수 있는 것은
//
//   "내가 쓴 코드가 어떤 요청을 만드는가"
//   "오류가 왔을 때 내 코드가 제대로 처리하는가"
//   "저장소가 04단원의 약속을 지키는가"
//
//   확인할 수 없는 것은
//
//   "SQL 이 진짜 맞는가"
//   "RLS 정책이 정말 막아 주는가"
//   "성능이 어떤가"
//
//   이건 실제 Supabase 프로젝트에서 직접 해 봐야 합니다.
//   개념04 에 그 절차를 적어 뒀습니다.
