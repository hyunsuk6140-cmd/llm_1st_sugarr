// ============================================================
// 개념 03 — 자바스크립트 클라이언트
// ============================================================
//
// Supabase 는 표를 만들면 REST API 가 자동으로 생깁니다.
// 그 API 를 편하게 부르는 것이 @supabase/supabase-js 입니다.
//
// 이 파일은 인터넷 없이 돕니다. 가짜Supabase.js 가 대답합니다.
// 대신 **요청 주소는 진짜 클라이언트가 만든 것** 입니다. 그대로 믿어도 됩니다.
//
// 실행: node 개념03_자바스크립트_클라이언트.js
// ============================================================

const { 기록하는클라이언트, 표있는클라이언트 } = require("./가짜Supabase");

// ============================================================
// 1. 만들기
// ============================================================
//
// 실제로는 이렇게 씁니다. (01단원의 설정 모듈을 그대로 씁니다)
//
//   const { createClient } = require("@supabase/supabase-js");
//   const 설정 = require("./설정");
//
//   const sb = createClient(설정.SUPABASE_URL, 설정.SUPABASE_ANON_KEY);
//
// ★ 키에 한글을 쓰면 안 됩니다.
//   키는 apikey·Authorization 헤더에 실립니다. 헤더는 ASCII 만 받습니다.
//   (백엔드 05단원에서 만난 그 ByteString 오류입니다)
//   진짜 키는 어차피 ASCII 니 문제없지만, 시험용 값을 한글로 지으면 터집니다.

// ============================================================
// 2. 어떤 요청이 만들어지는가
// ============================================================
//
// 클라이언트가 만드는 주소를 직접 봅시다. 이게 PostgREST 문법입니다.

const { 클라이언트: 기록용, 기록 } = 기록하는클라이언트();

async function 요청보기() {
  await 기록용.from("equipments").select("id, name");
  await 기록용.from("equipments").select("*").eq("line", "A");
  await 기록용.from("equipments").select("*").neq("status", "정지");
  await 기록용.from("equipments").select("*").gte("temperature", 30).lt("temperature", 40);
  await 기록용.from("equipments").select("*").in("line", ["A", "B"]);
  await 기록용.from("equipments").select("*").is("temperature", null);
  await 기록용.from("equipments").select("*").ilike("name", "%로봇%");
  await 기록용.from("equipments").select("*").or("line.eq.A,line.eq.B");
  await 기록용.from("equipments").select("*").order("temperature", { ascending: false }).order("id");
  await 기록용.from("equipments").select("*").range(20, 39);
  await 기록용.from("equipments").select("*").limit(5);

  for (const 것 of 기록) {
    console.log(`${것.방법} ${것.주소}`);
  }
  // 출력: GET /equipments?select=id,name
  // 출력: GET /equipments?select=*&line=eq.A
  // 출력: GET /equipments?select=*&status=neq.정지
  // 출력: GET /equipments?select=*&temperature=gte.30&temperature=lt.40
  // 출력: GET /equipments?select=*&line=in.(A,B)
  // 출력: GET /equipments?select=*&temperature=is.null
  // 출력: GET /equipments?select=*&name=ilike.%로봇%
  // 출력: GET /equipments?select=*&or=(line.eq.A,line.eq.B)
  // 출력: GET /equipments?select=*&order=temperature.desc,id.asc
  // 출력: GET /equipments?select=*&offset=20&limit=20
  // 출력: GET /equipments?select=*&limit=5

  await 다음();
}

// ★★ 규칙이 보이시죠.
//
//   .eq("line","A")      →  ?line=eq.A
//   .gte("t",30)         →  ?t=gte.30
//   .in("line",["A","B"]) →  ?line=in.(A,B)
//   .order("t",{ascending:false}) → ?order=t.desc
//
//   "칸=연산.값" 이 기본형입니다. 이걸 알면 문서를 덜 봐도 됩니다.
//
// ★ .range(20, 39) 는 offset·limit 으로 바뀝니다. 끝 번호를 **포함**합니다.
//   range(0, 19) 가 20개입니다. LIMIT 20 OFFSET 0 과 같습니다.
//   0부터 세고 끝을 포함한다는 점을 헷갈리기 쉽습니다.
//
// ★★ 조건을 여러 개 붙이면 전부 AND 입니다.
//   OR 를 쓰려면 .or("a.eq.1,b.eq.2") 처럼 문자열로 적어야 합니다.
//   이 문자열은 PostgREST 문법이지 SQL 이 아닙니다.

// ============================================================
// 3. 결과 모양 — data 와 error
// ============================================================

async function 다음() {
  const { 클라이언트: sb } = 표있는클라이언트([
    { id: 1, name: "용접로봇 1호", line: "A", status: "가동", temperature: 36.5 },
    { id: 2, name: "프레스 1호", line: "A", status: "정지", temperature: 41.2 },
    { id: 3, name: "컨베이어 1호", line: "B", status: "가동", temperature: null },
  ], { 겹치면안되는칸: "name" });

  const 결과 = await sb.from("equipments").select("id, name").eq("line", "A");

  console.log("키들:", Object.keys(결과).join(", "));
  // 출력: 키들: success, error, data, count, status, statusText
  console.log("data:", JSON.stringify(결과.data));
  // 출력: data: [{"id":1,"name":"용접로봇 1호"},{"id":2,"name":"프레스 1호"}]
  console.log("error:", 결과.error);
  // 출력: error: null

  // ★★ .select("id, name") 이라고 적었으니 **그 두 칸만** 옵니다.
  //   line·status·temperature 는 안 옵니다. SQL 의 SELECT 와 같습니다.
  //   전부 필요하면 .select("*") 또는 .select() 라고 쓰세요.
  //
  //   ★ 필요한 칸만 적는 습관을 들이세요.
  //     네트워크로 오가는 양이 줄고, 실수로 남의 개인정보를 흘릴 일도 줄어듭니다.

  // ★★★ 여기가 가장 중요합니다.
  //
  //   **오류가 나도 예외를 던지지 않습니다.**
  //   error 에 담아서 돌려줄 뿐입니다.
  //
  //     const { data } = await sb.from("t").select();
  //     data.map(...)     ← 오류였다면 data 가 null 이라 여기서 터집니다
  //
  //   그래서 error 를 **반드시** 확인해야 합니다.
  //
  //     const { data, error } = await sb.from("t").select();
  //     if (error) throw error;
  //
  //   백엔드 03단원의 fetch 와 반대입니다.
  //   fetch 는 404 여도 성공으로 치고, 여기는 오류를 error 에 담습니다.
  //   둘 다 "직접 확인해야 한다" 는 점은 같습니다.
  //
  // ★ 그래서 마지막에 .throwOnError() 를 붙이는 방식도 많이 씁니다.
  //   그러면 오류일 때 진짜로 던집니다. Express 5 가 잡아 줍니다.

  await 하나꺼내기(sb);
}

// ============================================================
// 4. 한 줄만 꺼내기 — single 과 maybeSingle
// ============================================================

async function 하나꺼내기(sb) {
  const 있는것 = await sb.from("equipments").select("*").eq("id", 1).single();
  console.log("single 있음:", 있는것.data.name, "| error:", 있는것.error);
  // 출력: single 있음: 용접로봇 1호 | error: null

  const 없는것 = await sb.from("equipments").select("*").eq("id", 9999).single();
  console.log("single 없음: data =", 없는것.data, "| code =", 없는것.error?.code, "| status =", 없는것.status);
  // 출력: single 없음: data = null | code = PGRST116 | status = 406

  const 없는것2 = await sb.from("equipments").select("*").eq("id", 9999).maybeSingle();
  console.log("maybeSingle 없음: data =", 없는것2.data, "| error:", 없는것2.error);
  // 출력: maybeSingle 없음: data = null | error: null

  // ★★ 차이가 명확합니다.
  //
  //   single()       0건이면 **오류**입니다 (PGRST116, 406)
  //   maybeSingle()  0건이면 data 가 null, error 는 없습니다
  //
  //   "반드시 있어야 하는 것" 은 single, "없을 수도 있는 것" 은 maybeSingle.
  //
  //   404 를 내야 하는 조회(GET /equipments/:id) 에는 maybeSingle 이 낫습니다.
  //   error 가 없으니 data === null 만 보면 됩니다.
  //   04단원 저장소의 `?? null` 과 같은 자리입니다.
  //
  // ★★★ 재미있는 점: 이 둘은 검사하는 곳이 다릅니다.
  //
  //   single()      Accept 헤더를 바꿔서 **서버**가 검사하게 합니다
  //   maybeSingle() **클라이언트**가 결과 개수를 셉니다
  //
  //   그래서 single() 은 406 이라는 HTTP 상태가 붙어 옵니다.
  //   가짜 서버를 만들 때도 이걸 흉내 내야 했습니다.

  const { 클라이언트: 기록용2, 기록: 기록2 } = 기록하는클라이언트([{ id: 1 }]);
  await 기록용2.from("equipments").select("*").single();
  console.log("single 의 Accept:", 기록2[0].Accept);
  // 출력: single 의 Accept: application/vnd.pgrst.object+json

  await 넣고고치기(sb);
}

// ============================================================
// 5. 넣기 · 고치기 · 지우기
// ============================================================

async function 넣고고치기(sb) {
  // ── 넣기 ──
  const 만든것 = await sb
    .from("equipments")
    .insert({ name: "검사기 1호", line: "C", status: "정지" })
    .select()
    .single();

  console.log("insert:", JSON.stringify(만든것.data));
  // 출력: insert: {"id":4,"name":"검사기 1호","line":"C","status":"정지"}

  // ★★ .select() 를 안 붙이면 만든 줄이 안 옵니다.

  const 조용히 = await sb.from("equipments").insert({ name: "포장기 1호", line: "C" });
  console.log("select 없이 insert:", 조용히.data, "| status:", 조용히.status);
  // 출력: select 없이 insert: null | status: 204

  // 204 는 "됐는데 줄 게 없다" 입니다.
  // 만든 것의 id 가 필요하면 .select() 를 붙이세요.
  // (02단원의 RETURNING 과 같은 일을 합니다)

  // ── 여러 줄 한 번에 ──
  const 여러개 = await sb
    .from("equipments")
    .insert([
      { name: "펌프 1호", line: "A" },
      { name: "펌프 2호", line: "B" },
    ])
    .select();

  console.log("여러 줄:", 여러개.data.length, "개");
  // 출력: 여러 줄: 2 개

  // ★ 배열로 넘기면 한 번의 요청으로 여러 줄이 들어갑니다.
  //   반복문으로 하나씩 넣지 마세요. N+1 입니다. (03단원 개념05)

  // ── 고치기 ──
  const 고친것 = await sb
    .from("equipments")
    .update({ status: "점검중" })
    .eq("id", 2)
    .select()
    .single();

  console.log("update:", 고친것.data.status);
  // 출력: update: 점검중

  // ★★★ WHERE 를 빠뜨리면 전부 바뀝니다. (02단원 개념04 의 그 사고)
  //
  //     await sb.from("equipments").update({ status: "고장" });
  //
  //   .eq() 를 안 붙였습니다. 표 전체가 고장이 됩니다.
  //
  //   ★ 다행히 Supabase 는 이걸 막아 줍니다.
  //     조건 없는 update·delete 는 서버가 거절합니다. (21000 오류가 옵니다)
  //
  //   ★★★ 이건 **PostgREST 의 기능이 아닙니다.**
  //
  //     `pg_safeupdate` 라는 Postgres 확장이 하는 일입니다.
  //     Supabase 가 자기 서버에 이 확장을 켜 둔 것뿐입니다.
  //
  //     그래서 **직접 Postgres + PostgREST 를 띄운 곳에서는 이 보호가 없습니다.**
  //     조건 없는 delete 한 번에 표가 통째로 비워집니다.
  //
  //     남의 안전장치에 기대지 마세요. 코드에서 조건을 빼먹지 않는 게 먼저입니다.

  // ── 지우기 ──
  const 지운것 = await sb.from("equipments").delete().eq("id", 4).select();
  console.log("delete:", JSON.stringify(지운것.data.map((줄) => 줄.name)));
  // 출력: delete: ["검사기 1호"]

  const 없는것지우기 = await sb.from("equipments").delete().eq("id", 9999).select();
  console.log("없는 것 지우기:", JSON.stringify(없는것지우기.data), "| error:", 없는것지우기.error);
  // 출력: 없는 것 지우기: [] | error: null

  // ★★ 없는 것을 지워도 오류가 아닙니다. 빈 배열입니다.
  //   02단원의 changes === 0 과 같은 자리입니다.
  //   404 를 내려면 배열 길이를 봐야 합니다.
  //
  //     const { data } = await sb.from("t").delete().eq("id", id).select();
  //     if (data.length === 0) return res.status(404)...

  // ── 있으면 고치고 없으면 넣기 (UPSERT) ──
  await sb.from("equipments").upsert({ name: "펌프 1호", line: "C" }, { onConflict: "name" });

  const 확인 = await sb.from("equipments").select("line").eq("name", "펌프 1호").single();
  console.log("upsert 뒤 line:", 확인.data.line);
  // 출력: upsert 뒤 line: C

  await 오류처리(sb);
}

// ============================================================
// 6. 오류 — Postgres 코드로 판단합니다
// ============================================================

async function 오류처리(sb) {
  const 중복 = await sb.from("equipments").insert({ name: "용접로봇 1호", line: "A" }).select();

  console.log("code:", 중복.error.code, "| status:", 중복.status);
  // 출력: code: 23505 | status: 409
  console.log("message:", 중복.error.message);
  // 출력: message: duplicate key value violates unique constraint "설비_name_key"
  console.log("error 키:", Object.keys(중복.error).join(", "));
  // 출력: error 키: code, details, hint, message

  // ★★ 이 메시지를 사용자에게 그대로 보내면 안 됩니다.
  //   표 이름과 칸 이름이 새어 나갑니다. 04단원 서버.js 에서 한 것처럼 바꿔야 합니다.
  //
  // ★ 자주 만나는 코드들 (전부 Postgres 표준 코드입니다)

  const 코드표 = [
    ["23505", "UNIQUE 위반 — 겹치는 값", "409 이미 있습니다"],
    ["23503", "외래키 위반 — 가리키는 게 없음", "400 대상이 없습니다"],
    ["23502", "NOT NULL 위반 — 값이 빠짐", "400 필수입니다"],
    ["23514", "CHECK 위반 — 허용 안 되는 값", "400 값이 올바르지 않습니다"],
    ["42501", "RLS 에 막힘 — 권한 없음", "403 권한이 없습니다"],
    ["42P01", "그런 표가 없음 (오타)", "500 내 잘못입니다"],
    ["42703", "그런 칸이 없음 (오타)", "500 내 잘못입니다"],
    ["PGRST116", "single() 인데 0건 또는 2건 이상", "404 또는 500"],
  ];

  for (const [코드, 뜻, 내응답] of 코드표) {
    console.log(`${코드} | ${뜻} | ${내응답}`);
  }
  // 출력: 23505 | UNIQUE 위반 — 겹치는 값 | 409 이미 있습니다
  // 출력: 23503 | 외래키 위반 — 가리키는 게 없음 | 400 대상이 없습니다
  // 출력: 23502 | NOT NULL 위반 — 값이 빠짐 | 400 필수입니다
  // 출력: 23514 | CHECK 위반 — 허용 안 되는 값 | 400 값이 올바르지 않습니다
  // 출력: 42501 | RLS 에 막힘 — 권한 없음 | 403 권한이 없습니다
  // 출력: 42P01 | 그런 표가 없음 (오타) | 500 내 잘못입니다
  // 출력: 42703 | 그런 칸이 없음 (오타) | 500 내 잘못입니다
  // 출력: PGRST116 | single() 인데 0건 또는 2건 이상 | 404 또는 500

  // ★★ 42P01 과 42703 은 **내 코드의 오타**입니다.
  //   사용자 잘못이 아니니 400 이 아니라 500 입니다.
  //   그리고 로그에 남겨야 합니다. 표 이름을 잘못 쓴 걸 빨리 알아야 하니까요.

  await 망가짐(sb);
}

// ============================================================
// 6-2. 네트워크가 끊기면
// ============================================================

async function 망가짐() {
  const { createClient } = require("@supabase/supabase-js");

  const 끊긴것 = createClient("https://example.supabase.co", "example-key", {
    auth: { persistSession: false },
    global: { fetch: async () => { throw new TypeError("fetch failed"); } },
  });

  const 결과 = await 끊긴것.from("equipments").select();

  console.log("data:", 결과.data);
  // 출력: data: null
  console.log("status:", 결과.status);
  // 출력: status: 0
  console.log("code:", JSON.stringify(결과.error.code));
  // 출력: code: ""
  console.log("message:", 결과.error.message.split("\n")[0]);
  // 출력: message: TypeError: fetch failed

  // ★★★ 여기서도 예외를 안 던집니다. error 에 담아 줍니다.
  //
  //   status 가 **0** 입니다. HTTP 응답 자체를 못 받았다는 뜻입니다.
  //   code 는 빈 문자열입니다. Postgres 가 대답한 게 아니니까요.
  //
  // ★ 그래서 오류를 나눌 때 이렇게 봅니다.
  //
  //     status === 0        → 네트워크·DNS 문제. 재시도해 볼 만합니다.
  //     code 가 23xxx       → 자료 문제. 재시도해도 똑같습니다.
  //     code 가 42xxx       → 내 코드 문제. 고쳐야 합니다.
  //
  // ★★ SQLite 에서는 이런 경우가 없었습니다. 같은 컴퓨터에 있었으니까요.
  //   클라우드 DB 로 오면 **네트워크 실패를 반드시 다뤄야 합니다.**
  //   DB 가 잠깐 안 될 수도 있고, 재배포 중일 수도 있습니다.

  await 관계와함수();
}

// ============================================================
// 7. 표를 이어서 가져오기
// ============================================================

async function 관계와함수() {
  const { 클라이언트: 기록용3, 기록: 기록3 } = 기록하는클라이언트();

  await 기록용3.from("equipments").select("id, name, checks(id, result)");
  await 기록용3.from("equipments").select("*, checks!inner(id)").eq("checks.result", "이상");
  await 기록용3.from("checks").select("id, equipments(name)");
  await 기록용3.from("equipments").select("id, checks(count)");

  기록3.forEach((것) => console.log(것.주소));
  // 출력: /equipments?select=id,name,checks(id,result)
  // 출력: /equipments?select=*,checks!inner(id)&checks.result=eq.이상
  // 출력: /checks?select=id,equipments(name)
  // 출력: /equipments?select=id,checks(count)

  // ★★ 03단원의 JOIN 을 이렇게 씁니다.
  //
  //   checks(id, result)     설비마다 점검 목록을 **배열로** 붙여 줍니다
  //                          → LEFT JOIN 에 해당합니다. 없으면 빈 배열입니다.
  //   checks!inner(id)       INNER JOIN — 점검이 없는 설비는 빠집니다
  //   checks(count)          개수만 가져옵니다
  //
  //   결과 모양이 다릅니다. SQL 의 JOIN 은 줄이 늘어나는데(03단원 개념02),
  //   여기서는 **중첩된 배열**로 옵니다.
  //
  //     [{ id: 1, name: "용접로봇 1호", checks: [{id:1,...},{id:2,...}] }]
  //
  //   자바스크립트에서 쓰기에는 이쪽이 훨씬 편합니다.
  //
  // ★★★ 그리고 이게 N+1 을 없애는 방법입니다. (03단원 개념05)
  //
  //     ✗  설비 목록을 받고, 설비마다 점검을 또 조회  → 요청 201번
  //     ○  .select("*, checks(id)")                  → 요청 1번
  //
  //   네트워크 왕복이 200번 줄어듭니다. 여기서는 그게 곧 몇 초입니다.
  //
  // ★ 이게 되려면 두 표 사이에 **외래키가 있어야 합니다.**
  //   Supabase 가 외래키를 보고 관계를 알아냅니다.
  //   외래키를 안 걸었으면 이 문법이 동작하지 않습니다.
  //   03단원에서 REFERENCES 를 강조한 이유가 하나 더 생긴 셈입니다.

  // ── DB 함수 부르기 ──

  const { 클라이언트: 기록용4, 기록: 기록4 } = 기록하는클라이언트(3);
  await 기록용4.rpc("count_by_line", { target_line: "A" });

  console.log(`${기록4[0].방법} ${기록4[0].주소} ${기록4[0].본문}`);
  // 출력: POST /rpc/count_by_line {"target_line":"A"}

  // ★ Postgres 함수를 만들어 두고 rpc 로 부릅니다.
  //
  //     create function count_by_line(target_line text)
  //     returns integer language sql as $$
  //       select count(*)::integer from equipments where line = target_line;
  //     $$;
  //
  // ★★ 언제 쓰나
  //
  //   · 여러 표를 한 트랜잭션으로 고쳐야 할 때  ← 이게 제일 중요합니다
  //   · 복잡한 집계를 한 번의 왕복으로 끝내고 싶을 때
  //
  //   클라이언트에서 update 를 두 번 부르면 그 사이에 아무 일이나 일어납니다.
  //   트랜잭션으로 묶으려면 DB 함수 안에서 해야 합니다. (개념05 에서 다시 봅니다)

  마무리();
}

// ============================================================
// 8. 값에 쉼표가 들어가면
// ============================================================

function 마무리() {
  const { 클라이언트: 기록용5, 기록: 기록5 } = 기록하는클라이언트();

  기록용5.from("t").select().eq("name", "볼트,너트").then(() => {
    기록용5.from("t").select().in("name", ["볼트,너트", "와셔"]).then(() => {
      기록용5.from("t").select().in("name", ['따옴표"있음', "와셔"]).then(() => {
        기록5.forEach((것) => console.log(것.주소));
        // 출력: /t?select=*&name=eq.볼트,너트
        // 출력: /t?select=*&name=in.("볼트,너트",와셔)
        // 출력: /t?select=*&name=in.(따옴표"있음,와셔)

        // ★★ .in() 은 쉼표가 든 값을 따옴표로 감싸 줍니다. 잘 처리합니다.
        //
        // ★★★ 그런데 값 안에 **큰따옴표**가 있으면 감싸지 않습니다.
        //   마지막 줄을 보세요. 따옴표가 그대로 들어가 있습니다.
        //   PostgREST 가 이걸 어떻게 읽을지 보장되지 않습니다.
        //
        //   실제로 겪을 일이 드물지만, 사용자 입력을 .in() 에 그대로 넣지 마세요.
        //   03단원에서 배운 대로 허용 목록으로 거르거나, 값을 검사하세요.
        //
        // ★ 이게 SQL 자리표시자와 다른 점입니다.
        //   02단원의 ? 는 값이 무엇이든 완벽하게 지켜 줬습니다.
        //   PostgREST 는 값을 **URL 문자열로 조립**합니다. 규칙이 더 약합니다.
        //
        //   그래도 SQL 인젝션은 안 됩니다. PostgREST 가 SQL 을 직접 만들지 않고
        //   구조화된 형태로 해석하기 때문입니다.
        //   다만 "이상한 값이 이상한 결과를 낸다" 는 있을 수 있습니다.

        console.log("SQL 인젝션이 되나:", false);
        // 출력: SQL 인젝션이 되나: false
      });
    });
  });
}

요청보기();

// ============================================================
// 정리
// ============================================================
//
//   createClient(URL, ANON_KEY)  — 키는 ASCII 여야 합니다
//
//   조건    .eq .neq .gt .gte .lt .lte .in .is .like .ilike .or
//           →  ?칸=연산.값  으로 바뀝니다. 여러 개는 전부 AND
//   정렬    .order("칸", { ascending: false, nullsFirst: false })
//   범위    .range(0, 19)  ← 0부터, 끝을 포함, 20개
//
//   결과    { data, error, count, status }
//           **오류를 던지지 않습니다.** error 를 반드시 확인하세요.
//           .throwOnError() 를 붙이면 던집니다.
//
//   single()      0건이면 오류 (PGRST116, 406) — 서버가 검사
//   maybeSingle() 0건이면 data 가 null — 클라이언트가 검사
//   404 를 낼 조회에는 maybeSingle 이 낫습니다
//
//   insert/update/delete 는 .select() 를 붙여야 결과가 옵니다 (아니면 204)
//   없는 것을 지워도 오류가 아닙니다. data.length 로 판단하세요.
//
//   오류 코드  23505 중복 · 23503 외래키 · 23514 CHECK · 42501 RLS
//              42P01·42703 은 내 오타 → 500
//              status 0 은 네트워크 실패
//
//   .select("*, checks(id)")  로 N+1 을 없애세요. 외래키가 있어야 합니다.
//   트랜잭션이 필요하면 DB 함수 + rpc 를 쓰세요.
//
// 다음(개념04) 에서 브라우저에 키를 노출해도 되는 이유 — RLS 를 봅니다.
