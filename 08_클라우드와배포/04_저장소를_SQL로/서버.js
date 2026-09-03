// ============================================================
// 04단원 서버 — 07단원의 계층 구조 + SQL 저장소
// ------------------------------------------------------------
// 실행: node 서버.js
//       끄려면 Ctrl + C
// ============================================================
//
// 이 파일과 routes / controllers / services / utils 는
// 백엔드 07단원과 **같습니다.**
//
// 바뀐 것은 repositories/설비저장소.js 하나뿐입니다.
// 파일(JSON) 대신 SQLite 를 씁니다.
//
// 개념01 을 실행하면 "정말 안 고쳤는지" 를 기계로 확인할 수 있습니다.
// ============================================================

const express = require("express");

const 설비라우트 = require("./routes/설비라우트");
const 설비저장소 = require("./repositories/설비저장소");
const { AppError, 에러 } = require("./utils/AppError");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ★ Number() 를 씌운 이유는 백엔드 08단원에서 겪었습니다.
//   환경 변수는 항상 글자입니다. PORT + 100 이 "3000100" 이 되는 사고가 있었습니다.

app.use(express.json());

app.use("/equipments", 설비라우트);

// ★★ 붙이는 주소를 바꾸면 컨트롤러의 Location 헤더도 같이 바꿔야 합니다.
//   등록 성공(201) 은 "만들어진 것이 여기 있습니다" 를 Location 으로 알려 주는데,
//   그 주소가 실제로 없으면 프론트가 그대로 따라가서 404 를 받습니다.
//   07단원은 /api/v1/equipments 에 붙였고, 이 단원은 /equipments 에 붙였습니다.
//   그래서 설비컨트롤러.js 의 Location 도 /equipments/:id 로 맞춰 두었습니다.


// ── 없는 주소 ──

app.use((req, res, next) => {
  next(에러.주소없음());
});


// ── 에러 처리기 ──
//
// 06단원에서 만든 것과 같습니다. 인자가 네 개여야 Express 가 알아봅니다.

app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // ── DB 가 던지는 에러를 사람이 읽을 수 있게 바꿉니다 ──
  //
  // ★★ 이 부분이 04단원에서 새로 생긴 것입니다.
  //
  //   저장소는 SQL 을 알지만, 사용자에게 SQL 오류를 보여 주면 안 됩니다.
  //     "UNIQUE constraint failed: 설비.name"  ← 표 이름과 칸 이름이 새어 나갑니다
  //
  //   서비스가 미리 확인해서 대부분은 여기까지 안 옵니다.
  //   그래도 확인과 저장 사이에 다른 요청이 끼어들면 (02단원 개념05)
  //   서비스를 통과한 뒤에 DB 에서 막힐 수 있습니다.
  //   그때를 위한 마지막 그물입니다.

  if (err.code === "ERR_SQLITE_ERROR") {
    if (/UNIQUE constraint failed/.test(err.message)) {
      return res.status(409).json({
        error: { code: "DUPLICATED", message: "이미 있는 설비 이름입니다" },
      });
    }

    if (/CHECK constraint failed/.test(err.message)) {
      return res.status(400).json({
        error: { code: "VALIDATION_FAILED", message: "허용되지 않는 값입니다" },
      });
    }

    if (/FOREIGN KEY constraint failed/.test(err.message)) {
      return res.status(400).json({
        error: { code: "VALIDATION_FAILED", message: "가리키는 대상이 없습니다" },
      });
    }
  }

  console.error("[처리 못한 에러]", err);

  res.status(500).json({
    error: { code: "INTERNAL", message: "서버에서 문제가 생겼습니다" },
  });
});


// ── 켜기 ──

// ★ id 를 직접 적었습니다. 07단원의 서버가 넘겨 주던 것과 같은 모양입니다.
//   파일 저장소는 준 것을 그대로 파일에 씁니다. id 가 없으면 id 없는 줄이 되고,
//   그다음 추가() 의 Math.max(...[undefined]) 가 NaN 이 됩니다.
//   저장소를 갈아 끼워도 같게 돌아야 하니 여기서 id 를 채워 줍니다. (개념01 2번)
const 처음데이터 = [
  { id: 1, name: "컨베이어 1호", line: "A", status: "가동" },
  { id: 2, name: "프레스 1호", line: "B", status: "정지" },
];

async function 시작하기() {
  await 설비저장소.초기화(처음데이터);

  app.listen(PORT, () => {
    console.log(`서버가 켜졌습니다.  http://localhost:${PORT}/equipments`);
  });
}

시작하기().catch((에러) => {
  console.error("서버를 켜지 못했습니다:", 에러);
  process.exit(1);
});


// ============================================================
// 확인해 볼 것들
// ============================================================

// 확인: GET /equipments
// 응답: 200 {"data":[{"id":1,"name":"컨베이어 1호","line":"A","status":"가동"},{"id":2,"name":"프레스 1호","line":"B","status":"정지"}]}

// 확인: GET /equipments/1
// 응답: 200 {"data":{"id":1,"name":"컨베이어 1호","line":"A","status":"가동"}}

// 확인: GET /equipments/9999
// 응답: 404 {"error":{"code":"NOT_FOUND","message":"설비를 찾을 수 없습니다"}}

// ★ 404 가 제대로 나오는 게 중요합니다.
//   저장소의 ?? null 을 빼먹으면 여기서 500 이 납니다.

// 확인: POST /equipments {"name":"용접로봇 1호","line":"C"}
// 응답: 201 {"data":{"id":3,"name":"용접로봇 1호","line":"C","status":"정지"}}

// ★ id 3 이 붙었습니다. AUTOINCREMENT 가 매긴 번호입니다.
// ★ status 를 안 보냈는데 '정지' 입니다. 서비스의 규칙 ③ 입니다.

// 확인: POST /equipments {"name":"용접로봇 1호","line":"A"}
// 응답: 409 {"error":{"code":"DUPLICATED","message":"이미 있는 설비 이름입니다"}}

// ★ 서비스의 이름 중복 검사가 먼저 걸립니다. DB 의 UNIQUE 까지 가지 않습니다.

// 확인: POST /equipments {"name":"짧","line":"A"}
// 응답: 400 {"error":{"code":"VALIDATION_FAILED","message":"입력값이 올바르지 않습니다","details":[{"키":"name","이유":"2글자 이상이어야 합니다"}]}}

// 확인: POST /equipments {"name":"새설비","line":"Z"}
// 응답: 400 {"error":{"code":"VALIDATION_FAILED","message":"입력값이 올바르지 않습니다","details":[{"키":"line","이유":"A, B, C 중 하나여야 합니다"}]}}

// 확인: PATCH /equipments/2 {"status":"점검중"}
// 응답: 200 {"data":{"id":2,"name":"프레스 1호","line":"B","status":"점검중"}}

// 확인: PATCH /equipments/2 {"status":"가동"}
// 응답: 409 {"error":{"code":"CONFLICT","message":"점검중인 설비는 정지를 거쳐야 가동할 수 있습니다"}}

// ★ 서비스의 규칙 ④ 입니다. 저장소를 바꿔도 업무 규칙은 그대로 살아 있습니다.

// 확인: DELETE /equipments/1
// 응답: 409 {"error":{"code":"CONFLICT","message":"가동 중인 설비는 삭제할 수 없습니다. 먼저 정지시키세요"}}

// 확인: DELETE /equipments/3
// 응답: 204

// 확인: GET /equipments/3
// 응답: 404 {"error":{"code":"NOT_FOUND","message":"설비를 찾을 수 없습니다"}}

// 확인: GET /없는주소
// 응답: 404 {"error":{"code":"ROUTE_NOT_FOUND","message":"그런 주소가 없습니다"}}


// ============================================================
// 그래서 무엇이 달라졌나
// ============================================================
//
// 밖에서 보면 **아무것도 안 달라졌습니다.**
// 같은 주소, 같은 응답, 같은 상태코드, 같은 오류 메시지.
//
// 안에서는 이런 게 사라졌습니다.
//
//   · JSON 파일 전체를 읽고 쓰는 코드
//   · 쓰기를 줄 세우는 큐 (07단원 개념04)
//   · 임시 파일에 쓰고 이름 바꾸기
//   · Math.max 로 id 만들기
//
// 그리고 이런 게 생겼습니다.
//
//   · 이름 중복을 DB 가 막아 줍니다 (UNIQUE)
//   · 라인·상태 값을 DB 가 막아 줍니다 (CHECK)
//   · 하나(id) 가 목록을 다 안 읽습니다 (색인)
//   · 동시에 고쳐도 안 사라집니다 (한 문장 UPDATE)
//
// ★★ 계층을 나눠 둔 값어치가 여기서 나옵니다.
//   나누지 않았다면 라우트 다섯 개를 다 고쳐야 했습니다.
//   지금은 파일 하나입니다.
//
//   05단원에서 Supabase 로 또 갈아 끼웁니다. 그때도 이 파일 하나입니다.
