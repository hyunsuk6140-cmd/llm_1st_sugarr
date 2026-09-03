// ============================================================
// 05단원 연습문제 정답 — 클라우드 DB (Supabase)
// ------------------------------------------------------------
// 실행: node 연습문제_정답.js
// ============================================================
//
// 먼저 스스로 풀어 본 다음에 보세요. 설명을 꼭 읽으세요.

const { 기록하는클라이언트, 표있는클라이언트 } = require("./가짜Supabase");

const 처음자료 = [
  { id: 1, name: "용접로봇 1호", line: "A", status: "가동", temperature: 36.5 },
  { id: 2, name: "프레스 1호", line: "A", status: "정지", temperature: 41.2 },
  { id: 3, name: "프레스 2호", line: "B", status: "점검중", temperature: 39.8 },
  { id: 4, name: "컨베이어 1호", line: "B", status: "가동", temperature: null },
  { id: 5, name: "검사기 1호", line: "C", status: "가동", temperature: 22.4 },
];


// ───── 문제 1 ─────
async function 문제1(sb) {
  const { data, error } = await sb
    .from("equipments")
    .select("name")
    .eq("line", "A")
    .eq("status", "가동")
    .order("id");

  if (error) throw error;

  console.log(data.map((설비) => 설비.name).join(", "));
  // 출력: 용접로봇 1호
}

// ★ .eq() 를 이어 붙이면 AND 입니다. OR 는 .or("...") 로 따로 씁니다.
//
// ★★ if (error) throw error 를 습관으로 만드세요.
//   Supabase 는 오류를 **던지지 않습니다.** error 에 담아 줄 뿐입니다.
//   확인 안 하면 data 가 null 인 채로 다음 줄에서 터집니다. (문제 8 에서 봅니다)


// ───── 문제 2 ─────
async function 문제2() {
  const { 클라이언트, 기록 } = 기록하는클라이언트();

  await 클라이언트
    .from("equipments")
    .select("id, name")
    .eq("line", "B")
    .gte("temperature", 30)
    .order("temperature", { ascending: false })
    .order("id")
    .limit(2);

  console.log(`${기록[0].방법} ${기록[0].주소}`);
  // 출력: GET /equipments?select=id,name&line=eq.B&temperature=gte.30&order=temperature.desc,id.asc&limit=2
}

// ★★ 규칙이 보이시죠. "칸=연산.값" 입니다.
//
//   .eq("line","B")   → line=eq.B
//   .gte("t",30)      → temperature=gte.30
//   .order(...) 두 번 → order=temperature.desc,id.asc
//
// ★ .order() 를 두 번 부르면 쉼표로 이어집니다.
//   마지막을 id 로 끝낸 것은 04단원 개념03 의 규칙입니다.
//   안 그러면 쪽을 넘길 때 같은 줄이 두 번 나올 수 있습니다.


// ───── 문제 3 ─────
async function 문제3(sb) {
  const 있는것 = await sb.from("equipments").select("name").eq("id", 1).maybeSingle();
  console.log(있는것.data.name);
  // 출력: 용접로봇 1호

  const 없는것 = await sb.from("equipments").select("name").eq("id", 9999).maybeSingle();
  console.log(없는것.data);
  // 출력: null
}

// ★★★ maybeSingle 이 정답입니다.
//
//   single()      0건이면 오류(PGRST116, 406) → 404 를 내야 할 자리에서 500 이 됩니다
//   maybeSingle() 0건이면 data 가 null, error 는 없음
//
//   "없을 수도 있는 조회" 에는 maybeSingle 을 쓰세요.
//   04단원 SQLite 저장소의 `?? null` 과 정확히 같은 자리입니다.
//
// ★ 반대로 "반드시 있어야 하는 것" 에는 single 이 맞습니다.
//   방금 insert 한 줄을 받을 때 같은 경우입니다. 0건이면 진짜 문제니까요.


// ───── 문제 4 ─────
async function 문제4(sb) {
  const { data, error } = await sb
    .from("equipments")
    .insert({ name: "새 설비", line: "C" })
    .select("id, status")
    .single();

  if (error) throw error;

  console.log(`id=${data.id} status=${data.status}`);
  // 출력: id=6 status=정지
}

// ★ .select().single() 을 붙여야 만든 줄이 옵니다. (02단원의 RETURNING 과 같은 일)
//   조회를 두 번 하지 않아도 됩니다.
//
// ★ status 를 안 줬는데 '정지' 입니다. DB 의 DEFAULT 가 채웠습니다.
//   그래서 만든 줄을 받아 봐야 실제로 뭐가 들어갔는지 알 수 있습니다.


// ───── 문제 5 ─────
async function 문제5(sb) {
  const 결과 = await sb.from("equipments").insert({ name: "포장기 1호", line: "C" });
  console.log(`고치기 전: ${결과.data} / ${결과.status}`);
  // 출력: 고치기 전: null / 204

  const 고친것 = await sb
    .from("equipments")
    .insert({ name: "포장기 2호", line: "C" })
    .select("name")
    .single();

  console.log(`고친 뒤: ${고친것.data.name}`);
  // 출력: 고친 뒤: 포장기 2호
}

// ★★ 204 는 "됐는데 돌려줄 게 없다" 입니다. 오류가 아닙니다.
//
//   Supabase 는 기본으로 만든 줄을 안 돌려줍니다.
//   Prefer: return=representation 헤더가 있어야 돌려주는데,
//   그 헤더는 .select() 를 붙일 때 붙습니다.
//
// ★ 만든 것의 id 가 필요 없으면 .select() 를 안 붙이는 게 낫습니다.
//   응답이 가벼워집니다. 대량으로 넣을 때 차이가 큽니다.
//
// ★ 이름이 겹치면 안 되니 두 번째는 다른 이름을 썼습니다.
//   같은 이름으로 두 번 넣으면 23505 가 납니다. (문제 7)


// ───── 문제 6 ─────
async function 문제6(sb) {
  const 지운것 = await sb.from("equipments").delete().eq("id", 3).select("id");
  console.log(`3 지움: ${지운것.data.length}건`);
  // 출력: 3 지움: 1건

  const 없는것 = await sb.from("equipments").delete().eq("id", 9999).select("id");
  console.log(`9999 지움: ${없는것.data.length}건`);
  // 출력: 9999 지움: 0건
}

// ★★ 없는 것을 지워도 **오류가 아닙니다.** 빈 배열입니다.
//   02단원의 changes === 0 과 같은 자리입니다.
//
//   404 를 내려면 배열 길이를 봐야 합니다.
//     if (data.length === 0) return res.status(404)...
//
// ★★★ .select() 를 빼먹으면 data 가 null 이라 length 를 못 셉니다.
//   그러면 "지웠는지" 를 알 방법이 없습니다. 없는 걸 지워도 204 가 나갑니다.
//
// ★ 조건 없는 delete 는 Supabase 가 거절합니다.
//   .eq() 를 빼먹어도 표가 비워지지 않습니다. 다행스러운 안전장치입니다.


// ───── 문제 7 ─────
async function 문제7(sb) {
  const 결과 = await sb.from("equipments").insert({ name: "용접로봇 1호", line: "A" }).select();

  console.log(`code=${결과.error.code} status=${결과.status}`);
  // 출력: code=23505 status=409
}

// ★ 23505 는 Postgres 표준 오류 코드입니다. UNIQUE 위반입니다.
//   Supabase 만의 코드가 아니라 Postgres 어디서나 같습니다.
//
// ★★ error.message 에는 표 이름과 제약 이름이 들어 있습니다.
//     duplicate key value violates unique constraint "설비_name_key"
//   이걸 사용자에게 그대로 보내면 안 됩니다.
//   { 오류: "이미 있는 설비 이름입니다" } 로 바꿔서 보내세요.


// ───── 문제 8 ─────
async function 문제8(sb) {
  const 결과 = await sb.from("equipments").insert({ name: "프레스 1호", line: "A" }).select();

  console.log(결과.data === null ? "data 는 null 입니다" : "data 가 있습니다");
  // 출력: data 는 null 입니다

  try {
    console.log(결과.data.length);
  } catch (에러) {
    console.log(`${에러.constructor.name} 가 납니다`);
    // 출력: TypeError 가 납니다
  }
}

// ★★★ 이게 error 를 안 보면 생기는 일입니다.
//
//     const { data } = await sb.from("t").insert(...);
//     data.map(...)      ← 여기서 Cannot read properties of null
//
//   오류가 난 줄에서 안 터지고 **한참 뒤에** 터집니다.
//   스택을 봐도 진짜 원인(23505) 이 안 보입니다.
//
// ★ 그래서 둘 중 하나를 항상 하세요.
//
//     const { data, error } = await ...;
//     if (error) throw error;
//
//   또는
//
//     const { data } = await sb.from("t").insert(...).select().throwOnError();
//
//   throwOnError() 를 쓰면 오류일 때 진짜로 던집니다.
//   Express 5 는 async 핸들러의 예외를 자동으로 잡아 줍니다. (백엔드 04단원)


// ───── 문제 9 ─────
function 문제9() {
  console.log("string_agg 를 씁니다");
  // 출력: string_agg 를 씁니다
  console.log("ilike 를 씁니다");
  // 출력: ilike 를 씁니다

  // ★ 고친 조회는 이렇습니다.
  //
  //   select line, string_agg(name, ', ') as names
  //   from equipments
  //   where name ilike '%ROBOT%'
  //   group by line
  //   order by line;
  //
  // ★★ 두 가지를 바꿨습니다.
  //
  //   ① group_concat → string_agg
  //      이름만 다릅니다. 인자도 같습니다.
  //
  //   ② LIKE → ILIKE
  //      **이게 더 중요합니다.**
  //      SQLite 의 LIKE 는 영문 대소문자를 안 가립니다.
  //      Postgres 의 LIKE 는 가립니다. 그대로 두면 0건이 됩니다.
  //
  //      오류가 안 나고 결과만 안 나옵니다. 찾기 어려운 종류입니다.
  //
  // ★ GROUP BY 는 그대로 둬도 됩니다.
  //   line 으로 묶고 line 만 SELECT 에 있으니 Postgres 규칙에 맞습니다.
  //   여기에 name 을 그냥 적었다면 오류가 났을 겁니다. (개념02)
}


// ───── 문제 10 ─────
async function 문제10() {
  const { 클라이언트, 기록 } = 기록하는클라이언트();

  await 클라이언트
    .from("equipments")
    .select("id")
    .order("temperature", { ascending: true, nullsFirst: false });

  console.log(`${기록[0].방법} ${기록[0].주소}`);
  // 출력: GET /equipments?select=id&order=temperature.asc.nullslast
}

// ★★ nullsFirst: false → nullslast 가 붙습니다.
//
//   이걸 안 붙이면 DB 마다 다릅니다.
//     SQLite   NULL 을 작게 봅니다 → ASC 에서 맨 앞
//     Postgres NULL 을 크게 봅니다 → ASC 에서 맨 뒤
//
//   SQLite 로 개발하고 Supabase 로 옮기면 목록 첫 줄이 바뀝니다.
//   명시해 두면 어디서나 같습니다.
//
// ★ DESC 일 때도 nullsFirst: false 를 쓰면 NULL 이 뒤로 갑니다.
//   "값이 없는 건 항상 뒤로" 가 보통 원하는 동작입니다.


// ───── 문제 11 ─────
async function 문제11() {
  const { 클라이언트: 읽기막힘 } = 표있는클라이언트(처음자료, { 읽기막힘: true });
  const 읽기 = await 읽기막힘.from("equipments").select("*");
  console.log(`읽기 막힘: data=${JSON.stringify(읽기.data)} error=${읽기.error}`);
  // 출력: 읽기 막힘: data=[] error=null

  const { 클라이언트: 쓰기막힘 } = 표있는클라이언트(처음자료, { 쓰기막힘: true });
  const 쓰기 = await 쓰기막힘.from("equipments").insert({ name: "새것", line: "A" }).select();
  console.log(`쓰기 막힘: code=${쓰기.error.code} status=${쓰기.status}`);
  // 출력: 쓰기 막힘: code=42501 status=403
}

// ★★★ 읽기와 쓰기가 다릅니다. 이게 이 단원에서 제일 헷갈리는 부분입니다.
//
//   읽기가 막히면  오류가 아니라 **빈 배열**입니다
//   쓰기가 막히면  42501 오류가 옵니다
//
//   읽기를 빈 배열로 만드는 이유는 "그 줄이 있는지조차 알려 주지 않으려고" 입니다.
//   403 을 주면 "여기 뭔가 있구나" 를 알게 되니까요.
//
// ★★ 그래서 "자료를 넣었는데 목록이 비어 있어요" 를 만나면
//   코드보다 RLS 를 먼저 의심하세요. 순서는 개념04 에 있습니다.
//
// ★ 가짜 클라이언트는 RLS 를 진짜로 적용하지 않습니다. 흉내만 냅니다.
//   실제로 막히는지는 반드시 진짜 프로젝트에서 curl 로 확인하세요.


// ───── 문제 12 ─────
async function 문제12() {
  const { 클라이언트: sb, 기록 } = 기록하는클라이언트([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);

  const 설비들 = (await sb.from("equipments").select("id")).data;
  for (const 설비 of 설비들) {
    await sb.from("checks").select("id").eq("equipment_id", 설비.id);
  }
  console.log("N+1 요청 수:", 기록.length);
  // 출력: N+1 요청 수: 6

  기록.length = 0;

  await sb.from("equipments").select("id, checks(id)");
  console.log("고친 뒤 요청 수:", 기록.length);
  // 출력: 고친 뒤 요청 수: 1
}

// ★★★ 6번이 1번이 됐습니다.
//
//   로컬 SQLite 였다면 3배 차이였습니다. (03단원 개념05)
//   Supabase 는 네트워크 건너입니다. 왕복 하나가 3~30ms 입니다.
//   6번이면 그럭저럭이지만, 설비가 200대면 201번 × 3ms = 0.6초입니다.
//
// ★★ 중첩 select 가 되려면 **외래키가 있어야 합니다.**
//   checks.equipment_id 가 equipments(id) 를 REFERENCES 해야 합니다.
//   Supabase 가 그 외래키를 보고 관계를 알아냅니다.
//   외래키를 안 걸었으면 이 문법이 동작하지 않습니다.
//
// ★ 결과 모양이 SQL 의 JOIN 과 다릅니다.
//   JOIN 은 줄이 늘어나는데, 여기서는 중첩 배열로 옵니다.
//     [{ id: 1, checks: [{id:1},{id:2}] }, ...]
//   자바스크립트에서 쓰기에는 이쪽이 편합니다.


// ───── 문제 13 ─────
function 오류다듬기(오류, 상태) {
  if (상태 === 0) return { 종류: "연결실패", status: 503 };

  const 표 = {
    23505: { 종류: "중복", status: 409 },
    23514: { 종류: "값오류", status: 400 },
    23502: { 종류: "값오류", status: 400 },
    23503: { 종류: "대상없음", status: 400 },
    42501: { 종류: "권한없음", status: 403 },
  };

  return 표[오류.code] ?? { 종류: "알수없음", status: 500 };
}

function 문제13() {
  const 경우들 = [
    ["23505", { code: "23505" }, 409],
    ["23514", { code: "23514" }, 400],
    ["42501", { code: "42501" }, 403],
    ["(연결실패)", { code: "" }, 0],
    ["42P01", { code: "42P01" }, 404],
  ];

  for (const [라벨, 오류, 상태] of 경우들) {
    const 결과 = 오류다듬기(오류, 상태);
    console.log(`${라벨} → ${결과.종류}/${결과.status}`);
  }
  // 출력: 23505 → 중복/409
  // 출력: 23514 → 값오류/400
  // 출력: 42501 → 권한없음/403
  // 출력: (연결실패) → 연결실패/503
  // 출력: 42P01 → 알수없음/500

  // ★★ status 0 을 **먼저** 봐야 합니다.
  //   네트워크가 끊기면 code 가 빈 문자열입니다. 표에서 못 찾습니다.
  //   그러면 500 으로 떨어져서 "내 서버 잘못" 이 됩니다. 사실이 아닙니다.
  //
  // ★★★ 503 과 500 을 구분하는 이유
  //
  //   500  내 코드가 잘못했다. 재시도해도 똑같다.
  //   503  지금은 안 된다. 나중에 다시 오면 될 수도 있다.
  //
  //   클라이언트가 재시도할지 말지를 이걸로 정합니다.
  //   전부 500 으로 내보내면 재시도하면 될 것도 그냥 실패로 끝납니다.
  //
  // ★ 42P01(없는 표) 과 42703(없는 칸) 은 **내 오타**입니다.
  //   500 이 맞습니다. 그리고 로그에 꼭 남기세요.
  //   사용자가 아무리 다시 해도 안 됩니다. 내가 고쳐야 합니다.
}


// ───── 문제 14 ─────
function 저장소만들기(sb) {
  async function 하나(id) {
    const { data, error, status } = await sb
      .from("equipments")
      .select("id, name, line, status")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      const 다듬은것 = 오류다듬기(error, status);
      const 새오류 = new Error(error.message);
      새오류.code = error.code;
      새오류.status = 다듬은것.status;
      새오류.종류 = 다듬은것.종류;
      throw 새오류;
    }

    return data;
  }

  return { 하나 };
}

async function 문제14() {
  const { 클라이언트: sb } = 표있는클라이언트(처음자료);
  const 저장소 = 저장소만들기(sb);

  console.log((await 저장소.하나(1)).name);
  // 출력: 용접로봇 1호
  console.log(await 저장소.하나(9999));
  // 출력: null

  const { 클라이언트: 막힌것 } = 표있는클라이언트([], { 쓰기막힘: true });
  const 막힌저장소 = 저장소만들기(막힌것);

  // 쓰기막힘 설정이라 select 는 통과합니다. 오류를 직접 내게 합니다.
  const { 클라이언트: 오류나는것 } = 표있는클라이언트([], {});
  const 오류저장소 = 저장소만들기({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { code: "42501", message: "권한 없음" },
            status: 403,
          }),
        }),
      }),
    }),
  });

  try {
    await 오류저장소.하나(1);
  } catch (에러) {
    console.log("던져진 오류 code:", 에러.code);
    // 출력: 던져진 오류 code: 42501
  }

  // ★★ maybeSingle 이라 못 찾아도 error 가 안 옵니다. data 가 null 일 뿐입니다.
  //   그래서 `if (error) throw` 와 `return data` 두 줄이면 끝납니다.
  //
  //   single 을 썼다면 못 찾을 때도 error 가 와서, 그 오류가 PGRST116 인지
  //   진짜 오류인지 구분하는 코드를 또 써야 했을 겁니다.
  //
  // ★ 마지막에 손으로 만든 가짜 객체를 넣었습니다.
  //   저장소가 클라이언트를 **밖에서 받기** 때문에 이렇게 할 수 있습니다.
  //   모듈 안에서 createClient 를 불렀다면 오류 상황을 시험할 방법이 없습니다.
  //   이게 "받아서 쓰기" 의 값어치입니다. (개념05)
  //
  // ★ 안 쓴 변수(막힌저장소, 오류나는것) 는 설명용으로 남겨 뒀습니다.
  console.log("클라이언트를 주입했나:", typeof 막힌저장소.하나 === "function" && 오류나는것 !== undefined);
  // 출력: 클라이언트를 주입했나: true
}


// ───── 문제 15 ─────
function 내저장소(sb) {
  const 칸들 = "id, name, line, status";

  const 확인 = (결과) => {
    if (결과.error) throw Object.assign(new Error(결과.error.message), { code: 결과.error.code });
    return 결과.data;
  };

  return {
    전부: async () => 확인(await sb.from("equipments").select(칸들).order("id")),

    하나: async (id) => 확인(await sb.from("equipments").select(칸들).eq("id", id).maybeSingle()),

    추가: async (값) =>
      확인(await sb.from("equipments")
        .insert({ name: 값.name, line: 값.line, status: 값.status ?? "정지" })
        .select(칸들).single()),

    수정: async (id, 바꿀것) => {
      const 고칠칸 = ["name", "line", "status"].filter((칸) => 바꿀것[칸] !== undefined);
      if (고칠칸.length === 0) return 확인(await sb.from("equipments").select(칸들).eq("id", id).maybeSingle());

      const 값 = {};
      for (const 칸 of 고칠칸) 값[칸] = 바꿀것[칸];

      return 확인(await sb.from("equipments").update(값).eq("id", id).select(칸들).maybeSingle());
    },

    삭제: async (id) => 확인(await sb.from("equipments").delete().eq("id", id).select("id")).length > 0,
  };
}

async function 저장소검사(저장소) {
  const 실패 = [];
  let 통과 = 0;
  const 확인 = (이름, 조건) => { if (조건) 통과 += 1; else 실패.push(이름); };

  확인("내보내는함수", ["전부", "하나", "추가", "수정", "삭제"]
    .every((이름) => typeof 저장소[이름] === "function"));
  확인("없으면null", (await 저장소.하나(999999)) === null);
  확인("삭제false", (await 저장소.삭제(999999)) === false);

  const 시험용 = await 저장소.추가({ name: "검사용 설비", line: "A" });
  확인("id고정", (await 저장소.수정(시험용.id, { id: 888888, line: "B" })).id === 시험용.id);

  const 고친것 = await 저장소.수정(시험용.id, { line: "C" });
  확인("칸유지", 고친것.name === 시험용.name && 고친것.status === 시험용.status);

  await 저장소.삭제(시험용.id);
  return { 통과, 실패 };
}

async function 문제15() {
  const { 클라이언트: sb } = 표있는클라이언트(처음자료, { 겹치면안되는칸: "name", 기본값: { status: "정지" } });
  const 결과 = await 저장소검사(내저장소(sb));

  console.log(`통과: ${결과.통과}개, 실패: ${JSON.stringify(결과.실패)}`);
  // 출력: 통과: 5개, 실패: []

  // ★★★ 다섯 군데가 요령입니다.
  //
  //   하나()   maybeSingle — single 이면 없을 때 오류라 500 이 됩니다
  //   추가()   .select().single() — 안 붙이면 204 에 data 가 null
  //   수정()   고칠 칸 목록에 id 가 없음 — 그래야 id 가 안 바뀝니다
  //   수정()   maybeSingle — 없는 id 를 고치면 null 이어야 합니다
  //   삭제()   .select("id") 뒤 length — 안 붙이면 지웠는지 알 수 없습니다
  //
  // ★★ 이 시험은 04단원 연습문제 15번과 **같은 함수**입니다.
  //   저장소가 파일이든 SQLite 든 Supabase 든 통과해야 합니다.
  //   통과하면 services·controllers·routes 를 안 고쳐도 된다는 뜻입니다.
  //
  // ★ 시험이 확인 못 하는 것도 있습니다.
  //   RLS, 네트워크 실패, 성능. 그건 실제 프로젝트에서 봐야 합니다.
}


// ============================================================
// 실행
// ============================================================

async function 실행() {
  const { 클라이언트: sb } = 표있는클라이언트(처음자료, { 겹치면안되는칸: "name", 기본값: { status: "정지" } });

  await 문제1(sb);
  await 문제2();
  await 문제3(sb);
  await 문제4(sb);
  await 문제5(sb);
  await 문제6(sb);
  await 문제7(sb);
  await 문제8(sb);
  문제9();
  await 문제10();
  await 문제11();
  await 문제12();
  문제13();
  await 문제14();
  await 문제15();
}

실행();


// ============================================================
// SQL 로 써 볼 것 — 정답
// ============================================================
//
// ── S1 ──
//
//   create table equipments (
//     id          bigint generated always as identity primary key,
//     name        text   not null unique,
//     line        text   not null check (line in ('A','B','C')),
//     status      text   not null default '정지'
//                        check (status in ('가동','정지','점검중')),
//     temperature double precision,
//     created_at  timestamptz not null default now()
//   );
//
//   ★ AUTOINCREMENT 가 아니라 generated always as identity 입니다.
//   ★ REAL 이 아니라 double precision 입니다.
//   ★ STRICT 가 없습니다. Postgres 는 원래 타입을 지킵니다.
//   ★ 칸 이름이 전부 소문자입니다. 대문자를 쓰면 따옴표를 계속 써야 합니다.
//
// ── S2 ──
//
//   -- ★★★ 두 단계로 나눕니다. 이유는 아래에 있습니다.
//   alter table equipments add column owner_id uuid default auth.uid();
//   -- (이미 있던 줄을 채웁니다. 내 계정 id 를 넣거나, 관리자 계정 id 를 넣습니다)
//   update equipments set owner_id = '여기에-내-uuid' where owner_id is null;
//   alter table equipments alter column owner_id set not null;
//
//   ★★★ 왜 한 줄로 안 하나
//
//     alter table equipments add column owner_id uuid not null default auth.uid();
//
//     이렇게 쓰면 표에 줄이 하나라도 있을 때 **실패합니다.**
//
//     · SQL Editor 에는 로그인 토큰이 없습니다. auth.uid() 가 null 입니다
//     · 기존 줄들이 전부 null 로 채워집니다
//     · not null 을 어겨서 ALTER 자체가 거절됩니다
//       → ERROR: column "owner_id" of relation "equipments" contains null values
//
//     빈 표라면 한 줄로도 통과합니다. 하지만 통과했다고 안심하면 안 됩니다.
//     **앞으로 SQL Editor 로 넣는 줄도 owner_id 가 null 입니다.**
//     default auth.uid() 는 로그인한 사람이 앱을 통해 넣을 때만 채워집니다.
//   alter table equipments enable row level security;
//
//   create policy "로그인한 사람은 읽기"
//     on equipments for select
//     using (auth.uid() is not null);
//
//   create policy "내 것만 고치기"
//     on equipments for update
//     using (auth.uid() = owner_id)
//     with check (auth.uid() = owner_id);
//
//   ★★ update 에 using 과 with check 를 **둘 다** 썼습니다.
//     with check 를 빼면 내 설비를 남의 것으로 넘길 수 있습니다.
//       update equipments set owner_id = '남의id' where id = 1;
//     using 만 있으면 "내 줄이니 고쳐도 된다" 를 통과하고,
//     바뀐 뒤 모양은 검사하지 않습니다.
//
//   ★ insert 정책도 필요합니다. 안 만들면 아무도 못 넣습니다.
//       create policy "내 것으로 만들기" on equipments for insert
//         with check (auth.uid() = owner_id);
//
// ── S3 ──
//
//   select lines.code,
//          lines.name,
//          coalesce(string_agg(equipments.name, ', ' order by equipments.id), '(없음)') as 설비들,
//          count(equipments.id) as 대수
//   from lines
//   left join equipments on lines.code = equipments.line
//   group by lines.code, lines.name
//   order by lines.code;
//
//   ★ LEFT JOIN 이라 설비가 없는 라인도 나옵니다. (03단원 개념02)
//   ★ count(equipments.id) 입니다. count(*) 를 쓰면 빈 라인이 1 로 나옵니다.
//   ★ group by 에 lines.name 도 넣었습니다.
//     Postgres 는 SELECT 에 적은 칸을 전부 GROUP BY 에 요구합니다. (개념02)
//     SQLite 였다면 lines.code 만 적어도 통과했을 겁니다.
//   ★ string_agg 안에 order by 를 넣을 수 있습니다. 순서가 보장됩니다.
//
// ── S4 ──
//
//   create function record_check(equipment_id bigint, result text)
//   returns bigint
//   language plpgsql
//   as $$
//   declare new_id bigint;
//   begin
//     insert into checks (equipment_id, result)
//     values (record_check.equipment_id, record_check.result)
//     returning id into new_id;
//
//     if result = '이상' then
//       update equipments set status = '점검중' where id = record_check.equipment_id;
//     end if;
//
//     return new_id;
//   end;
//   $$;
//
//   클라이언트에서:
//
//     const { data, error } = await sb.rpc("record_check", {
//       equipment_id: 1,
//       result: "이상",
//     });
//
//   ★★★ 함수 하나가 통째로 한 트랜잭션입니다.
//     update 에서 실패하면 insert 도 되돌아갑니다.
//
//     클라이언트에서 insert 와 update 를 따로 부르면 이게 안 됩니다.
//     REST 요청 하나가 트랜잭션 하나라서, 두 요청을 묶을 방법이 없습니다.
//     그래서 "두 표를 같이 고쳐야 하는 업무" 는 DB 함수로 만듭니다.
//
//   ★ 인자 이름이 칸 이름과 겹쳐서 record_check.equipment_id 로 적었습니다.
//     안 그러면 Postgres 가 어느 쪽인지 몰라서 오류를 냅니다.
//     인자 이름에 p_ 를 붙이는 관례도 많이 씁니다 (p_equipment_id).
//
// ── S5 ──
//
//   # 로그인 안 한 상태로 직접 부르기
//   curl "https://xxxx.supabase.co/rest/v1/equipments?select=*" \
//        -H "apikey: 여러분의_anon_key"
//
//   [] 가 나와야 정상입니다. 자료가 나오면 RLS 가 뚫린 것입니다.
//
//   # 지워지는지도 확인
//   curl -X DELETE "https://xxxx.supabase.co/rest/v1/equipments?id=eq.1" \
//        -H "apikey: 여러분의_anon_key"
//
//   ★★★ 화면에서 확인하면 안 됩니다.
//     화면은 코드가 걸러 준 결과를 보여 줄 뿐입니다.
//     공격자는 화면을 안 씁니다. curl 을 씁니다.
//
//   ★ Supabase 대시보드의 Database → Advisors 도 확인하세요.
//     RLS 가 꺼진 표를 찾아 줍니다. 배포 전에 반드시 보세요.
