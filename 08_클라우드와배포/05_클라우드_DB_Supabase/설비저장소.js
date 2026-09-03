// ============================================================
// 설비저장소.js — Supabase 판 저장소
// ------------------------------------------------------------
// 04단원의 repositories/설비저장소.js 를 Supabase 로 다시 쓴 것입니다.
//
// **내보내는 함수의 이름과 약속이 똑같습니다.**
//
//   전부()          → 배열
//   하나(id)        → 객체 또는 null
//   추가(값)        → id 가 붙은 객체
//   수정(id, 바꿀것) → 객체 또는 null
//   삭제(id)        → true / false
//   초기화(목록)     → 없음
//
// 그래서 services / controllers / routes 는 또 한 글자도 안 고칩니다.
//
// 07단원(파일) → 04단원(SQLite) → 05단원(Supabase)
// 세 번을 갈아 끼우는 동안 위층은 그대로입니다.
// ============================================================

// ★ 클라이언트를 밖에서 받습니다. 여기서 createClient 를 부르지 않습니다.
//
//   왜냐면 — 시험할 때 가짜 클라이언트를 넣어야 하기 때문입니다.
//   모듈 안에서 만들어 버리면 바꿔 끼울 방법이 없습니다.
//
//   이걸 "의존성 주입" 이라고 합니다. 어렵게 들리지만
//   "만들어서 쓰지 말고 받아서 쓰기" 일 뿐입니다.

const 표이름 = "equipments";
const 칸들 = "id, name, line, status";

function 만들기(sb) {
  // ── 오류를 던지는 곳을 한 군데로 ──
  //
  // Supabase 는 오류를 던지지 않고 error 에 담아 줍니다. (개념03)
  // 함수마다 if (error) throw 를 쓰면 여섯 번 반복됩니다.

  function 확인(결과) {
    if (결과.error) throw 다듬은오류(결과.error, 결과.status);
    return 결과.data;
  }

  // ── Postgres 오류를 우리 오류로 ──
  //
  // 04단원 서버.js 의 에러 처리기가 하던 일을 여기로 옮겼습니다.
  // 저장소가 "DB 를 아는 유일한 층" 이니, DB 오류를 번역하는 것도 여기가 맞습니다.

  function 다듬은오류(오류, 상태) {
    const 새오류 = new Error(오류.message);
    새오류.code = 오류.code;
    새오류.status = 상태;

    if (오류.code === "23505") {
      새오류.status = 409;
      새오류.종류 = "중복";
    } else if (오류.code === "23514" || 오류.code === "23502") {
      새오류.status = 400;
      새오류.종류 = "값오류";
    } else if (오류.code === "23503") {
      새오류.status = 400;
      새오류.종류 = "대상없음";
    } else if (오류.code === "42501") {
      새오류.status = 403;
      새오류.종류 = "권한없음";
    } else if (상태 === 0) {
      새오류.status = 503;
      새오류.종류 = "연결실패";
    } else {
      새오류.status = 500;
      새오류.종류 = "알수없음";
    }

    return 새오류;
  }

  // ── 밖에 내주는 것 ──

  async function 전부() {
    return 확인(await sb.from(표이름).select(칸들).order("id"));
  }

  // ★ .order("id") 를 붙였습니다. 안 붙이면 순서가 보장되지 않습니다.
  //   04단원 개념03 에서 배운 그 규칙입니다. Postgres 에서도 같습니다.

  async function 하나(id) {
    return 확인(await sb.from(표이름).select(칸들).eq("id", id).maybeSingle());
  }

  // ★★ maybeSingle 을 썼습니다. single 이 아닙니다.
  //
  //   single 은 0건일 때 오류(PGRST116) 를 냅니다.
  //   그러면 확인() 이 던져 버려서 404 가 아니라 500 이 됩니다.
  //
  //   maybeSingle 은 0건일 때 data 가 null 입니다.
  //   04단원의 `?? null` 과 정확히 같은 자리입니다.
  //   갈아 끼울 때 여기가 가장 실수하기 쉽습니다.

  async function 추가(값) {
    const 만든것 = 확인(
      await sb
        .from(표이름)
        .insert({ name: 값.name, line: 값.line, status: 값.status ?? "정지" })
        .select(칸들)
        .single()
    );

    return 만든것;
  }

  // ★ .select() 를 안 붙이면 204 가 오고 data 가 null 입니다. (개념03)
  //   여기서는 single 이 맞습니다. 방금 넣었으니 반드시 1건이어야 합니다.
  //   0건이면 그건 진짜 문제라서 오류로 터지는 게 맞습니다.

  async function 수정(id, 바꿀것) {
    const 고칠칸 = ["name", "line", "status"].filter((칸) => 바꿀것[칸] !== undefined);

    if (고칠칸.length === 0) return 하나(id);

    const 값 = {};
    for (const 칸 of 고칠칸) 값[칸] = 바꿀것[칸];

    return 확인(
      await sb.from(표이름).update(값).eq("id", id).select(칸들).maybeSingle()
    );
  }

  // ★ id 는 고칠 수 있는 칸 목록에 없습니다. 04단원과 같습니다.
  // ★ 없는 id 를 고치면 0건이 되고 maybeSingle 이 null 을 줍니다.

  async function 삭제(id) {
    const 지운것 = 확인(await sb.from(표이름).delete().eq("id", id).select("id"));
    return 지운것.length > 0;
  }

  // ★★ .select("id") 를 붙여야 지운 줄이 옵니다.
  //   안 붙이면 204 에 data 가 null 이라 length 를 못 셉니다.
  //   02단원의 changes > 0 과 같은 판단을 이렇게 합니다.

  async function 초기화(목록) {
    // ★★★ 여기가 SQLite 판과 가장 다릅니다.
    //
    //   04단원에서는 BEGIN/COMMIT 으로 묶었습니다.
    //   Supabase 클라이언트에는 트랜잭션이 **없습니다.**
    //
    //   REST 요청 하나가 트랜잭션 하나입니다.
    //   요청 두 개를 하나로 묶을 방법이 클라이언트 쪽에 없습니다.
    //
    //   그래서 아래 두 요청 사이에 서버가 죽으면 표가 빈 채로 남습니다.
    //   수업용 함수라 그냥 두지만, 실무에서 이런 게 필요하면
    //   DB 함수를 만들고 rpc 로 불러야 합니다. (개념03, 그리고 아래 설명)

    await 확인(await sb.from(표이름).delete().gte("id", 0).select("id"));

    if (목록.length === 0) return;

    const 넣을것 = 목록.map((설비) => {
      const 줄 = { name: 설비.name, line: 설비.line, status: 설비.status ?? "정지" };
      if (설비.id !== undefined) 줄.id = 설비.id;
      return 줄;
    });

    확인(await sb.from(표이름).insert(넣을것).select("id"));
  }

  // ★ .gte("id", 0) 을 붙인 이유
  //   조건 없는 delete 는 Supabase 가 거절합니다. (개념03)
  //   "전부 지우기" 를 하려면 항상 참인 조건이라도 붙여야 합니다.
  //
  // ★★ 이 안전장치는 Supabase 가 켜 둔 `pg_safeupdate` 확장이 해 주는 일입니다.
  //   PostgREST 가 원래 해 주는 게 아닙니다.
  //   직접 띄운 Postgres 에서는 이 줄이 없어도 통과하고, 표가 비워집니다.

  return { 전부, 하나, 추가, 수정, 삭제, 초기화 };
}

module.exports = { 만들기 };


// ============================================================
// 04단원 SQLite 판과 비교
// ============================================================
//
//   전부()    SELECT ... ORDER BY id   →  .select().order("id")
//   하나(id)  .get() ?? null            →  .maybeSingle()
//   추가()    INSERT ... RETURNING      →  .insert().select().single()
//   수정()    UPDATE ... RETURNING      →  .update().select().maybeSingle()
//   삭제()    changes > 0               →  .select("id") 뒤 length > 0
//   초기화()  BEGIN/COMMIT              →  ✗ 트랜잭션이 없습니다
//
// ★★ 없어진 것
//
//   트랜잭션. 이건 진짜로 없습니다.
//   여러 표를 한 번에 고쳐야 하면 Postgres 함수를 만들고 rpc 로 부르세요.
//
//     create function 점검기록(설비id bigint, 결과 text)
//     returns bigint language plpgsql as $$
//     declare 새id bigint;
//     begin
//       insert into checks (equipment_id, result) values (설비id, 결과)
//         returning id into 새id;
//       if 결과 = '이상' then
//         update equipments set status = '점검중' where id = 설비id;
//       end if;
//       return 새id;
//     end $$;
//
//   함수 하나가 통째로 한 트랜잭션입니다. 중간에 실패하면 전부 되돌아갑니다.
//   클라이언트에서는 이렇게 부릅니다.
//
//     await sb.rpc("점검기록", { 설비id: 1, 결과: "이상" });
//
// ★★ 생긴 것
//
//   네트워크 실패를 다뤄야 합니다 (status 0 → 503)
//   RLS 에 막힐 수 있습니다 (42501 → 403)
//   요청 하나하나가 왕복입니다 → N+1 을 더 조심해야 합니다
