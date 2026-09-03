// ============================================================
// 개념 04 — RLS (행 수준 보안)
// ============================================================
//
// 이상한 이야기부터 시작합니다.
//
//   Supabase 의 anon key 는 **브라우저에 그대로 넣습니다.**
//   깃허브에 올라가도 됩니다. 누구나 볼 수 있습니다.
//
// 비밀번호를 공개하는 셈인데 왜 괜찮을까요?
// RLS 때문입니다. 이 단원에서 그걸 봅니다.
//
// ★★★ 이 단원은 이 자료에서 가장 위험한 부분입니다.
//   RLS 를 안 켜면 **아무나 자료를 다 읽고 지울 수 있습니다.**
//   실제로 그렇게 털린 사고가 많습니다. 끝까지 읽으세요.
//
// 실행: node 개념04_RLS_행_수준_보안.js
// ============================================================

const { 표있는클라이언트 } = require("./가짜Supabase");

// ============================================================
// 1. 키가 두 개입니다
// ============================================================

const 키비교 = [
  ["anon (public)", "브라우저·앱에 넣어도 됨", "RLS 를 지킵니다", "공개됨"],
  ["service_role", "서버에서만", "RLS 를 **전부 무시합니다**", "절대 공개 금지"],
];

for (const [이름, 어디에, 권한, 공개] of 키비교) {
  console.log(`${이름} | ${어디에} | ${권한} | ${공개}`);
}
// 출력: anon (public) | 브라우저·앱에 넣어도 됨 | RLS 를 지킵니다 | 공개됨
// 출력: service_role | 서버에서만 | RLS 를 **전부 무시합니다** | 절대 공개 금지

// ★★★ service_role key 를 브라우저 코드에 넣으면 끝입니다.
//
//   그 키를 가진 사람은 모든 표를 읽고, 고치고, 지울 수 있습니다.
//   RLS 가 아무리 잘 짜여 있어도 소용없습니다. 통과 카드니까요.
//
//   실수로 넣는 경로가 정해져 있습니다. 조심하세요.
//
//     · Next.js 에서 NEXT_PUBLIC_ 접두사를 붙임  ← 브라우저로 나갑니다
//     · Vite 에서 VITE_ 접두사를 붙임             ← 브라우저로 나갑니다
//     · 그냥 .env 를 커밋함
//     · 프론트 코드에 하드코딩
//
//   ★ 규칙: 브라우저로 나가는 값에 service_role 을 절대 넣지 않습니다.
//     서버 코드에서만, .env 에서만 읽습니다.

// ============================================================
// 2. RLS 를 안 켜면 어떻게 되나
// ============================================================
//
// Supabase 에서 표를 만들면 RLS 가 **꺼져 있습니다.** (예전에는 그랬습니다)
// 요즘은 Table Editor 로 만들면 켜 주지만, SQL 로 만들면 꺼진 채입니다.
//
// 그 상태에서 anon key 로 무엇이 되는지 봅시다.

async function RLS없을때() {
  const { 클라이언트: sb } = 표있는클라이언트([
    { id: 1, user_id: "kim", content: "김민준의 메모", phone: "010-1111-1111" },
    { id: 2, user_id: "lee", content: "이서연의 메모", phone: "010-2222-2222" },
    { id: 3, user_id: "park", content: "박도윤의 메모", phone: "010-3333-3333" },
  ]);

  // 로그인도 안 한 사람이 anon key 만 가지고 이렇게 부릅니다
  const 전부 = await sb.from("memos").select("*");

  console.log("남의 메모까지 몇 건 보이나:", 전부.data.length);
  // 출력: 남의 메모까지 몇 건 보이나: 3
  console.log("전화번호도 보이나:", 전부.data[0].phone);
  // 출력: 전화번호도 보이나: 010-1111-1111

  const 지운것 = await sb.from("memos").delete().eq("id", 2).select();
  console.log("남의 것 지우기:", 지운것.data.length, "건 지워짐");
  // 출력: 남의 것 지우기: 1 건 지워짐

  // ★★★ 이게 실제로 일어나는 사고입니다.
  //
  //   앱을 만들어 배포합니다. 화면에는 내 메모만 보이게 잘 짜 뒀습니다.
  //   그런데 브라우저 개발자 도구를 열면 anon key 가 보입니다.
  //   그 키로 직접 요청을 보내면 **전부** 나옵니다.
  //
  //     curl "https://xxxx.supabase.co/rest/v1/memos?select=*" \
  //          -H "apikey: eyJ..."
  //
  //   화면에서 걸러 봐야 소용없습니다. 화면은 요청 결과를 보여 줄 뿐입니다.
  //   막는 것은 DB 쪽에서 해야 합니다.
  //
  // ★ 이게 SQLite 와 결정적으로 다른 점입니다.
  //
  //   SQLite  DB 는 서버 안에 있습니다. 내 API 를 거쳐야만 닿습니다.
  //           그래서 API 에서 권한을 확인하면 됐습니다.
  //
  //   Supabase DB 가 인터넷에 열려 있습니다.
  //           내 API 를 안 거치고 직접 부를 수 있습니다.
  //           그래서 **DB 자체가 스스로를 지켜야** 합니다.

  await RLS켠뒤();
}

// ============================================================
// 3. RLS 를 켜면
// ============================================================
//
// 표마다 켭니다. 켜면 **기본이 전부 차단**입니다.
//
//   alter table memos enable row level security;
//
// 이 한 줄을 실행하면 anon key 로는 아무것도 안 됩니다.

async function RLS켠뒤() {
  const { 클라이언트: 읽기막힌것 } = 표있는클라이언트(
    [
      { id: 1, user_id: "kim", content: "김민준의 메모" },
      { id: 2, user_id: "lee", content: "이서연의 메모" },
    ],
    { 읽기막힘: true }
  );

  const 결과 = await 읽기막힌것.from("memos").select("*");

  console.log("RLS 켠 뒤 읽기:", JSON.stringify(결과.data), "| error:", 결과.error);
  // 출력: RLS 켠 뒤 읽기: [] | error: null

  // ★★★ 여기를 꼭 보세요. **오류가 아니라 빈 배열입니다.**
  //
  //   403 이 오지 않습니다. "권한 없음" 이라는 메시지도 없습니다.
  //   그냥 자료가 없는 것처럼 보입니다.
  //
  //   왜 그렇게 만들었냐면 — "그 줄이 있는지 없는지" 조차 알려 주지 않기 위해서입니다.
  //   403 을 주면 "아, 여기 뭔가 있긴 있구나" 를 알게 됩니다.
  //
  // ★★ 그래서 이런 일이 생깁니다.
  //
  //   "분명히 자료를 넣었는데 목록이 비어 있어요"
  //   → 십중팔구 RLS 정책이 없거나 조건이 안 맞는 것입니다.
  //
  //   오류가 없으니 코드를 아무리 봐도 안 보입니다.
  //   Supabase 화면의 Table Editor 로 가서 자료가 있는지 먼저 확인하세요.
  //   (그 화면은 service_role 로 보기 때문에 RLS 를 통과합니다)

  const { 클라이언트: 쓰기막힌것 } = 표있는클라이언트([], { 쓰기막힘: true });
  const 넣기 = await 쓰기막힌것.from("memos").insert({ content: "새 메모" }).select();

  console.log("RLS 켠 뒤 쓰기 code:", 넣기.error.code, "| status:", 넣기.status);
  // 출력: RLS 켠 뒤 쓰기 code: 42501 | status: 403
  console.log("message:", 넣기.error.message);
  // 출력: message: new row violates row-level security policy for table "memos"

  // ★ 쓰기는 오류가 옵니다. 읽기와 다릅니다.
  //   넣으려는 줄이 정책에 안 맞으면 명확히 거절합니다.
  //   (넣으려는 줄은 이미 내가 아는 값이니 숨길 이유가 없습니다)
  //
  // ★★★ status 가 **403** 입니다. 401 이 아닙니다.
  //
  //   401 Unauthorized   "네가 누군지 모르겠다" — 로그인부터 해라
  //   403 Forbidden      "누군지는 알겠는데 이건 안 된다" — 권한이 없다
  //
  //   PostgREST 는 요청에 토큰이 **있으면** 42501 을 403 으로 냅니다.
  //   anon key 도 JWT 라서, 로그인을 안 했어도 토큰은 늘 붙어 갑니다.
  //   그래서 RLS 에 막히면 사실상 항상 403 입니다.
  //
  //   ★ 화면에서 401 과 403 을 다르게 다뤄야 합니다.
  //     401 이면 로그인 화면으로 보내고, 403 이면 "권한이 없습니다" 를 보여 주세요.
  //     401 로 착각해서 로그인 화면을 띄우면, 이미 로그인한 사용자가 무한히 맴돕니다.

  정책설명();
}

// ============================================================
// 4. 정책 쓰기
// ============================================================

function 정책설명() {
  // ★ 아래는 Supabase SQL Editor 에 치는 SQL 입니다.
  //   이 파일에서 실행할 수는 없습니다. 프로젝트를 만들었으면 직접 해 보세요.
  //
  // ── ① 표 준비 ──
  //
  //   create table memos (
  //     id      bigint generated always as identity primary key,
  //     user_id uuid   not null references auth.users(id) default auth.uid(),
  //     content text   not null,
  //     phone   text,
  //     created_at timestamptz not null default now()
  //   );
  //
  //   ★ 위 예제에서 쓴 칸 이름과 같습니다. content 와 phone 입니다.
  //     칸 이름은 영어 소문자로 통일합니다. (개념02 에서 이야기한 그 규칙)
  //
  //   alter table memos enable row level security;
  //
  //   ★ auth.users 는 Supabase 가 만들어 둔 회원 표입니다.
  //     회원가입하면 여기에 줄이 생깁니다. 내가 만들지 않습니다.
  //
  //   ★ auth.uid() 는 "지금 요청을 보낸 사람의 id" 입니다.
  //     로그인 안 했으면 null 입니다.
  //     이 함수가 RLS 의 핵심입니다.
  //
  // ── ② 읽기 정책 ──
  //
  //   create policy "내 메모만 읽기"
  //     on memos for select
  //     using (auth.uid() = user_id);
  //
  //   using 은 "어떤 줄을 보여 줄까" 입니다.
  //   조건에 맞는 줄만 보입니다. 나머지는 없는 것처럼 됩니다.
  //
  // ── ③ 쓰기 정책 ──
  //
  //   create policy "내 것으로만 만들기"
  //     on memos for insert
  //     with check (auth.uid() = user_id);
  //
  //   with check 는 "어떤 줄을 넣게 할까" 입니다.
  //   조건에 안 맞으면 42501 로 거절됩니다.
  //
  //   ★★ using 과 with check 를 헷갈리지 마세요.
  //
  //     select  → using 만
  //     insert  → with check 만
  //     update  → 둘 다 (using = 고칠 수 있는 줄, with check = 고친 뒤 모양)
  //     delete  → using 만
  //
  //   update 에서 with check 를 빼먹으면, 내 메모를 남의 것으로 바꿀 수 있습니다.
  //
  //     update memos set user_id = '남의id' where id = 1;
  //
  //   using 만 있으면 "내 줄이니 고쳐도 된다" 를 통과하고,
  //   바뀐 뒤 모양은 검사하지 않아서 남에게 넘어갑니다.
  //
  // ── ④ 고치기·지우기 ──
  //
  //   create policy "내 메모만 고치기"
  //     on memos for update
  //     using (auth.uid() = user_id)
  //     with check (auth.uid() = user_id);
  //
  //   create policy "내 메모만 지우기"
  //     on memos for delete
  //     using (auth.uid() = user_id);

  const 정책표 = [
    ["select", "using", "보여 줄 줄을 고릅니다"],
    ["insert", "with check", "넣을 수 있는 줄을 정합니다"],
    ["update", "using + with check", "★ 둘 다 필요합니다"],
    ["delete", "using", "지울 수 있는 줄을 정합니다"],
  ];

  for (const [동작, 무엇, 설명] of 정책표) {
    console.log(`${동작} | ${무엇} | ${설명}`);
  }
  // 출력: select | using | 보여 줄 줄을 고릅니다
  // 출력: insert | with check | 넣을 수 있는 줄을 정합니다
  // 출력: update | using + with check | ★ 둘 다 필요합니다
  // 출력: delete | using | 지울 수 있는 줄을 정합니다

  // ★★ 정책은 **여러 개면 OR 로 합쳐집니다.**
  //
  //   "내 메모 읽기" 와 "관리자는 다 읽기" 를 둘 다 만들면
  //   둘 중 하나만 맞아도 보입니다.
  //
  //   그래서 "이건 절대 안 보여야 해" 를 **보통 정책 하나로는** 못 막습니다.
  //   다른 정책이 열어 줄 수 있으니까요. 전체를 같이 봐야 합니다.
  //
  // ★★★ 정확히 그 용도로 만들어진 정책이 따로 있습니다. `as restrictive` 입니다.
  //
  //   create policy "정지된 계정은 절대 안 됨" on memos
  //     as restrictive for select
  //     using ( (auth.jwt() -> 'app_metadata' ->> 'suspended') is distinct from 'true' );
  //
  //   · 기본은 `as permissive` 입니다. 안 적으면 이쪽입니다. → 서로 **OR**
  //   · `as restrictive` 는 서로, 그리고 permissive 묶음과 **AND** 로 걸립니다.
  //
  //   그래서 restrictive 정책이 하나라도 거짓이면 다른 정책이 아무리 열어 줘도 막힙니다.
  //   "무조건 막아야 하는 조건" 은 restrictive 로 한 번 걸어 두세요.
  //
  //   ★ 다만 restrictive 만 만들면 아무것도 안 보입니다.
  //     허용해 주는 permissive 정책이 최소 하나는 있어야 합니다.
  //     restrictive 는 "열어 주는" 게 아니라 "열린 것을 더 좁히는" 정책입니다.

  자주쓰는정책();
}

// ============================================================
// 5. 자주 쓰는 정책 모양
// ============================================================

function 자주쓰는정책() {
  // ── ① 누구나 읽기, 로그인한 사람만 쓰기 (블로그, 공지) ──
  //
  //   create policy "누구나 읽기" on posts for select using (true);
  //   create policy "로그인해야 쓰기" on posts for insert
  //     with check (auth.uid() is not null);
  //
  // ── ② 내 것만 (메모, 장바구니, 개인 자료) ──
  //
  //   using (auth.uid() = user_id)
  //
  // ── ③ 공개 표시가 된 것 + 내 것 ──
  //
  //   using (is_public = true or auth.uid() = user_id)
  //
  // ── ④ 같은 팀 것 (다른 표를 봐야 하는 경우) ──
  //
  //   create policy "우리 팀 것만" on documents for select
  //     using (
  //       team_id in (
  //         select team_id from memberships where user_id = auth.uid()
  //       )
  //     );
  //
  //   ★★ 이런 정책은 **모든 줄마다 실행됩니다.**
  //     서브쿼리가 무거우면 조회가 아주 느려집니다.
  //     memberships(user_id) 에 색인을 꼭 거세요. (03단원 개념04)
  //
  // ── ⑤ 역할 기반 (관리자) ──
  //
  //   create policy "관리자는 전부" on equipments for all
  //     using ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );
  //
  //   ★ auth.jwt() 는 로그인 토큰의 내용입니다.
  //     여기에 role 을 넣어 두고 확인합니다.
  //     회원 표에서 조회하는 것보다 빠릅니다. (조회가 한 번 줄어듭니다)
  //
  //   ★★★ 토큰의 **맨 위 role 을 쓰면 안 됩니다.**
  //
  //     auth.jwt() ->> 'role'        ← 이건 Postgres 역할입니다
  //
  //     값이 anon / authenticated / service_role 셋 중 하나라서
  //     'admin' 과는 **영원히 안 맞습니다.**
  //     정책이 조용히 아무도 통과 못 시키는 상태가 됩니다. 오류도 안 납니다.
  //
  //   ★★★ 그리고 user_metadata 로 옮기지 마세요.
  //
  //     auth.jwt() -> 'user_metadata' ->> 'role'   ← 절대 안 됩니다
  //
  //     user_metadata 는 **사용자가 스스로 고칠 수 있습니다.**
  //     updateUser({ data: { role: 'admin' } }) 한 줄이면 관리자가 됩니다.
  //     "정책이 안 먹네" 하고 여기로 옮기는 순간 권한이 통째로 열립니다.
  //
  //     app_metadata 는 service_role 로만 바꿀 수 있습니다. 그래서 여기를 씁니다.
  //
  // ── ⑥ 읽기 전용 표 (참조 자료) ──
  //
  //   create policy "누구나 읽기" on lines for select using (true);
  //   -- insert/update/delete 정책은 안 만듭니다 → 아무도 못 씁니다

  const 흔한실수 = [
    "RLS 를 켜지 않았다 — 표를 만들 때마다 확인하세요",
    "RLS 는 켰는데 정책이 없다 — 전부 막힙니다. 목록이 빈 채로 보입니다",
    "update 에 with check 를 안 썼다 — 남의 것으로 넘길 수 있습니다",
    "using (true) 를 쓰기에도 걸었다 — 아무나 씁니다",
    "정책이 여러 개면 OR 인 걸 몰랐다 — 하나가 다 열어 줍니다 (반드시 막으려면 as restrictive)",
    "service_role key 를 브라우저에 넣었다 — RLS 가 전부 무의미해집니다",
  ];

  흔한실수.forEach((줄, 자리) => console.log(`${자리 + 1}. ${줄}`));
  // 출력: 1. RLS 를 켜지 않았다 — 표를 만들 때마다 확인하세요
  // 출력: 2. RLS 는 켰는데 정책이 없다 — 전부 막힙니다. 목록이 빈 채로 보입니다
  // 출력: 3. update 에 with check 를 안 썼다 — 남의 것으로 넘길 수 있습니다
  // 출력: 4. using (true) 를 쓰기에도 걸었다 — 아무나 씁니다
  // 출력: 5. 정책이 여러 개면 OR 인 걸 몰랐다 — 하나가 다 열어 줍니다 (반드시 막으려면 as restrictive)
  // 출력: 6. service_role key 를 브라우저에 넣었다 — RLS 가 전부 무의미해집니다

  서버는어떻게();
}

// ============================================================
// 6. 그럼 내 API 서버는 어느 키를 쓰나
// ============================================================

function 서버는어떻게() {
  // 두 가지 방식이 있습니다. 목적이 다릅니다.
  //
  // ── 방식 A: 서버가 service_role 을 씁니다 ──
  //
  //   const sb = createClient(URL, SERVICE_ROLE_KEY);
  //
  //   RLS 를 무시하니 무엇이든 됩니다.
  //   그래서 **권한 확인을 내 서버가 전부 해야 합니다.**
  //   04단원까지 해 온 방식과 같습니다. 서비스 계층에서 확인합니다.
  //
  //   ○ 업무 규칙을 한 곳에 모을 수 있습니다
  //   ○ RLS 정책을 안 짜도 됩니다
  //   ✗ 서버 코드에 실수가 있으면 그대로 뚫립니다
  //   ✗ 브라우저에서 직접 부르는 길은 못 씁니다
  //
  // ── 방식 B: 서버가 사용자 토큰을 그대로 전달합니다 ──
  //
  //   const sb = createClient(URL, ANON_KEY, {
  //     global: { headers: { Authorization: `Bearer ${사용자토큰}` } },
  //   });
  //
  //   그러면 그 사용자 자격으로 조회합니다. RLS 가 그대로 적용됩니다.
  //
  //   ○ 서버가 실수해도 RLS 가 마지막 방어선이 됩니다
  //   ○ 브라우저 직접 호출과 규칙이 같습니다
  //   ✗ 요청마다 클라이언트를 새로 만들어야 합니다
  //   ✗ 정책이 복잡하면 느려질 수 있습니다
  //
  // ★★ 어느 쪽이든 **RLS 는 켜 두세요.**
  //   방식 A 를 쓰더라도, 누군가 anon key 로 직접 부를 수 있습니다.
  //   RLS 가 꺼져 있으면 그때 다 털립니다.
  //
  //   "서버를 통해서만 오게 하면 되지 않나요?" — 그럴 수 없습니다.
  //   Supabase 의 REST 주소는 인터넷에 열려 있습니다. 끌 수 없습니다.
  //
  // ★★★ 그래서 이 수업의 권장은 이렇습니다.
  //
  //   RLS 는 항상 켠다                    ← 예외 없음
  //   기본 정책은 "내 것만" 으로 짠다
  //   업무 규칙(가동 중이면 못 지운다) 은 서버에 둔다
  //   서버는 사용자 토큰을 전달한다 (방식 B)
  //   service_role 은 배치 작업·관리 도구에서만 쓴다
  //
  // ★ 헤더에 토큰을 넣을 때 주의
  //   Authorization 값은 ASCII 여야 합니다. (개념03)
  //   토큰은 원래 ASCII 라 문제없지만, 값이 undefined 면
  //   "Bearer undefined" 가 되어 401 이 옵니다. 먼저 확인하세요.

  const 방식 = [
    ["service_role", "권한 확인을 서버가 전부", "배치·관리 도구"],
    ["사용자 토큰 전달", "RLS 가 마지막 방어선", "일반 API 서버 ← 권장"],
    ["anon key 만", "RLS 만으로", "브라우저에서 직접 부를 때"],
  ];

  for (const [무엇, 누가지키나, 언제] of 방식) {
    console.log(`${무엇} | ${누가지키나} | ${언제}`);
  }
  // 출력: service_role | 권한 확인을 서버가 전부 | 배치·관리 도구
  // 출력: 사용자 토큰 전달 | RLS 가 마지막 방어선 | 일반 API 서버 ← 권장
  // 출력: anon key 만 | RLS 만으로 | 브라우저에서 직접 부를 때

  확인하는법();
}

// ============================================================
// 7. RLS 가 정말 막는지 확인하는 법
// ============================================================

function 확인하는법() {
  // ★★★ 이건 반드시 직접 해 봐야 합니다.
  //   코드로 확인할 수 없습니다. 가짜 클라이언트로도 안 됩니다.
  //
  // ── ① 화면 말고 curl 로 직접 ──
  //
  //   curl "https://xxxx.supabase.co/rest/v1/memos?select=*" \
  //        -H "apikey: 여러분의_anon_key"
  //
  //   로그인 안 한 상태입니다. 무엇이 나오는지 보세요.
  //   [] 가 나와야 정상입니다. 자료가 나오면 정책이 뚫린 것입니다.
  //
  //   ★ 화면에서 확인하면 안 됩니다. 화면은 코드가 걸러 줄 뿐입니다.
  //     공격자는 화면을 안 씁니다.
  //
  // ── ② 다른 계정으로 로그인해서 ──
  //
  //   회원을 두 명 만들고, A 로 메모를 만든 다음
  //   B 로 로그인해서 A 의 메모가 보이는지 확인하세요.
  //
  //   ★ 브라우저 두 개(일반 창 + 시크릿 창) 로 하면 편합니다.
  //
  // ── ③ Supabase 가 알려 주는 경고 ──
  //
  //   대시보드에 RLS 가 꺼진 표가 있으면 빨간 표시가 뜹니다.
  //   Database → Advisors 에서도 확인할 수 있습니다.
  //   배포 전에 여기를 꼭 보세요.
  //
  // ── ④ 정책이 뭐가 걸려 있는지 목록으로 ──
  //
  //   select tablename, policyname, cmd, qual, with_check
  //   from pg_policies
  //   where schemaname = 'public'
  //   order by tablename;
  //
  //   ★ qual 이 using, with_check 가 with check 입니다.
  //     update 인데 with_check 가 비어 있으면 위험합니다.

  const 확인목록 = [
    "모든 표에 RLS 가 켜져 있나 (Advisors 확인)",
    "정책이 표마다 있나 (없으면 전부 막힘)",
    "update 정책에 with check 가 있나",
    "using (true) 를 쓰기에 안 걸었나",
    "service_role key 가 프론트 코드·빌드 결과에 없나",
    "로그인 안 한 curl 로 자료가 안 나오나",
    "다른 계정으로 남의 자료가 안 보이나",
  ];

  확인목록.forEach((줄, 자리) => console.log(`□ ${자리 + 1}. ${줄}`));
  // 출력: □ 1. 모든 표에 RLS 가 켜져 있나 (Advisors 확인)
  // 출력: □ 2. 정책이 표마다 있나 (없으면 전부 막힘)
  // 출력: □ 3. update 정책에 with check 가 있나
  // 출력: □ 4. using (true) 를 쓰기에 안 걸었나
  // 출력: □ 5. service_role key 가 프론트 코드·빌드 결과에 없나
  // 출력: □ 6. 로그인 안 한 curl 로 자료가 안 나오나
  // 출력: □ 7. 다른 계정으로 남의 자료가 안 보이나

  // ★ 5번을 확인하는 방법: 빌드한 결과 파일에서 찾아보세요.
  //
  //     # 프론트 빌드 폴더에서
  //     grep -r "service_role" dist/
  //     grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" dist/   # 예전 키 (JWT)
  //     grep -r "sb_secret_" dist/                             # ★ 새 키
  //
  //   ★★ Supabase 가 키 모양을 바꿨습니다. 둘 다 찾아봐야 합니다.
  //
  //     예전  anon = eyJ...             / service_role = eyJ...
  //     지금  sb_publishable_...        / sb_secret_...
  //
  //     예전 키는 둘 다 eyJ 로 시작해서 눈으로는 구분이 안 됐습니다.
  //     디코딩해서 role 이 anon 인지 service_role 인지 봐야 했습니다.
  //     새 키는 이름만 봐도 구분됩니다. secret 이 보이면 사고입니다.
  //
  //   ★ 프로젝트를 만든 시점에 따라 둘 중 하나입니다. 내 것이 어느 쪽인지 확인하세요.
}

RLS없을때();

// ============================================================
// 정리
// ============================================================
//
//   anon key 는 공개해도 됩니다. RLS 가 지켜 주기 때문입니다.
//   service_role key 는 RLS 를 전부 무시합니다. 서버에서만, .env 에서만.
//
//   RLS 를 안 켜면 anon key 만으로 남의 자료를 읽고 지울 수 있습니다.
//   화면에서 거르는 건 방어가 아닙니다. 공격자는 화면을 안 씁니다.
//
//   alter table 표 enable row level security;   ← 켜면 기본이 전부 차단
//
//   select  using
//   insert  with check
//   update  using + with check   ★ 둘 다 (안 그러면 남의 것으로 넘길 수 있음)
//   delete  using
//
//   정책이 여러 개면 OR 입니다. 하나가 열어 주면 열립니다.
//
//   읽기가 막히면 **오류가 아니라 빈 배열**입니다.
//   "자료를 넣었는데 목록이 비었다" 면 RLS 를 먼저 의심하세요.
//
//   확인은 화면이 아니라 curl 과 다른 계정으로.
//
// 다음(개념05) 에서 저장소를 Supabase 로 또 갈아 끼웁니다.
// 04단원에서 만든 저장소검사를 그대로 통과시키는 것이 목표입니다.
