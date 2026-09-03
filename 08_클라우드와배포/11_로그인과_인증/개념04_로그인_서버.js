// ============================================================
// 개념 04 — 로그인 서버
// ============================================================
//
// 개념01~03 에서 만든 것을 진짜 서버에 붙입니다.
//
//   비밀번호.js   개념01 의 결론
//   토큰.js       개념03 의 결론
//
// 백엔드 05단원 개념03 의 서버와 나란히 놓고 보세요.
// 미들웨어 모양은 그대로입니다. `key-user-1` 자리에 진짜 토큰이 들어갔을 뿐입니다.
//
// 실행: node 개념04_로그인_서버.js
//       끄려면 Ctrl + C
// ============================================================

const express = require("express");
const { DatabaseSync } = require("node:sqlite");

const { 만들기, 맞나, 시간만쓰기 } = require("./비밀번호");
const { 발급, 확인 } = require("./토큰");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());


// ============================================================
// 0. 시각을 밖에서 넣는 이유
// ============================================================
//
// ★ 이 서버는 시각을 고정합니다. 진짜 서버라면 Date.now() 를 씁니다.
//
//   토큰 안에는 발급 시각이 들어갑니다. (개념03 의 5번)
//   그래서 돌릴 때마다 토큰 글자가 달라집니다.
//   그러면 아래 `// 확인:` 선언에 토큰을 적어 둘 수가 없습니다.
//   검증 도구가 돌릴 때마다 다른 답을 받게 되니까요.
//
//   시각을 밖에서 넣게 만들어 두면 **시험할 수 있는 서버** 가 됩니다.
//   "만료되면 401 이 맞나" 를 두 시간 기다리지 않고 확인할 수 있습니다.
const 지금 = () => Number(process.env.지금시각) || new Date("2026-08-27T10:00:00Z").getTime();

const 한시간 = 60 * 60;


// ============================================================
// 1. 사용자 표 (개념02 와 같습니다)
// ============================================================

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE 사용자 (
    id       INTEGER PRIMARY KEY,
    아이디   TEXT    NOT NULL UNIQUE,
    비밀번호 TEXT    NOT NULL,
    역할     TEXT    NOT NULL DEFAULT 'user'
  ) STRICT;

  CREATE TABLE 설비 (
    id     INTEGER PRIMARY KEY,
    이름   TEXT    NOT NULL,
    주인id INTEGER NOT NULL REFERENCES 사용자(id)
  ) STRICT;
`);

const 넣기 = db.prepare("INSERT INTO 사용자 (아이디, 비밀번호, 역할) VALUES (?, ?, ?)");
const 아이디로찾기 = db.prepare("SELECT * FROM 사용자 WHERE 아이디 = ?");
const id로찾기 = db.prepare("SELECT id, 아이디, 역할 FROM 사용자 WHERE id = ?");

// 시험용 사람 둘. ★ 이렇게 코드에 적는 것은 자료라서 그렇습니다.
넣기.run("kim", 만들기("abcd1234"), "user");
넣기.run("boss", 만들기("boss1234"), "admin");

db.prepare("INSERT INTO 설비 (이름, 주인id) VALUES (?, ?)").run("컨베이어 1호", 1);
db.prepare("INSERT INTO 설비 (이름, 주인id) VALUES (?, ?)").run("프레스 1호", 2);


function HttpError(코드, 메시지) {
  const 에러 = new Error(메시지);
  에러.status = 코드;
  return 에러;
}


// ============================================================
// 2. 회원가입
// ============================================================

app.post("/signup", (req, res) => {
  // ★ 받은 것에서 **두 개만** 꺼냅니다. (개념02 의 5번)
  const { 아이디, 비밀번호 } = req.body ?? {};

  if (typeof 아이디 !== "string" || !/^[a-z0-9_]{3,20}$/.test(아이디)) {
    throw HttpError(400, "아이디는 영소문자·숫자·밑줄 3~20자입니다");
  }
  if (typeof 비밀번호 !== "string" || 비밀번호.length < 8 || 비밀번호.length > 200) {
    throw HttpError(400, "비밀번호는 8자 이상 200자 이하입니다");
  }

  try {
    const 결과 = 넣기.run(아이디, 만들기(비밀번호), "user");
    // ★ 201 입니다. 만들었으니까요. (백엔드 06단원)
    res.status(201).json({ data: { id: Number(결과.lastInsertRowid), 아이디 } });
  } catch (에러) {
    if (String(에러.message).includes("UNIQUE")) {
      throw HttpError(409, "이미 있는 아이디입니다");
    }
    throw 에러;
  }
});

// 확인: POST /signup {"아이디":"newbie","비밀번호":"abcd1234"}
// 응답: 201 {"data":{"id":3,"아이디":"newbie"}}

// 확인: POST /signup {"아이디":"newbie","비밀번호":"abcd1234"}
// 응답: 409 {"error":"이미 있는 아이디입니다"}

// 확인: POST /signup {"아이디":"newbie2","비밀번호":"123"}
// 응답: 400 {"error":"비밀번호는 8자 이상 200자 이하입니다"}

// ★ 응답에 비밀번호도, 해시도 없습니다. 넣을 이유가 없습니다.
//
// ★ 409 는 "지금 상태와 부딪힌다" 는 뜻입니다.
//   400(요청이 잘못됨) 과 다릅니다. 요청 자체는 멀쩡한데 이미 있는 것뿐입니다.
//
// ★★ 여기서 409 를 주는 것은 **사용자 열거가 됩니다.**
//   아이디를 넣어 보면 가입 여부를 알 수 있습니다.
//   그런데 안 알려 주면 가입하려는 사람이 왜 안 되는지 모릅니다.
//   개념02 의 6번에서 "로그인은 뭉뚱그린다" 고 했지만 **가입은 다릅니다.**
//   진짜 서비스는 이메일로 가입시켜서, 화면에는 "메일을 보냈습니다" 만 띄우고
//   메일 내용으로 가릅니다. 여기서는 자료라 간단히 갑니다.


// ============================================================
// 3. 로그인 — 토큰을 발급합니다
// ============================================================

app.post("/login", (req, res) => {
  const { 아이디, 비밀번호 } = req.body ?? {};

  if (typeof 아이디 !== "string" || typeof 비밀번호 !== "string") {
    throw HttpError(400, "아이디와 비밀번호가 필요합니다");
  }

  const 사람 = 아이디로찾기.get(아이디);

  if (!사람) {
    시간만쓰기(비밀번호);
    throw HttpError(401, "아이디 또는 비밀번호가 올바르지 않습니다");
  }
  if (!맞나(비밀번호, 사람.비밀번호)) {
    throw HttpError(401, "아이디 또는 비밀번호가 올바르지 않습니다");
  }

  // ★ 토큰에 넣는 것은 이 세 개뿐입니다. 비밀번호는 근처에도 안 갑니다.
  const 토큰 = 발급({ sub: 사람.id, 아이디: 사람.아이디, 역할: 사람.역할 }, 지금(), 한시간);

  res.json({ data: { 토큰 } });
});

// 확인: POST /login {"아이디":"kim","비밀번호":"abcd1234"}
// 응답: 200 {"data":{"토큰":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyODQwMH0.F5k88F5wW5GwyNeYbfg6nkkYHd40qqf4QXBVw5mpWkc"}}

// 확인: POST /login {"아이디":"kim","비밀번호":"틀린것입니다"}
// 응답: 401 {"error":"아이디 또는 비밀번호가 올바르지 않습니다"}

// 확인: POST /login {"아이디":"없는사람","비밀번호":"abcd1234"}
// 응답: 401 {"error":"아이디 또는 비밀번호가 올바르지 않습니다"}

// ★ 위 두 줄의 응답이 **글자 하나까지 같습니다.** 개념02 의 6번 그대로입니다.
//
// ★ 토큰이 저렇게 길게 보이는 것은 시각을 고정했기 때문입니다.
//   진짜 서버는 부를 때마다 달라집니다. (iat 이 바뀌니까요)


// ============================================================
// 4. 인증 미들웨어
// ============================================================
//
// 백엔드 05단원 개념03 의 `인증()` 과 모양이 같습니다.
// 달라진 곳은 딱 한 줄, 키 목록에서 찾는 대신 토큰을 확인하는 것입니다.

function 인증(req, res, next) {
  const 헤더값 = req.get("Authorization");

  if (!헤더값) throw HttpError(401, "로그인이 필요합니다");

  const [방식, 토큰] = 헤더값.split(" ");

  if (방식 !== "Bearer" || !토큰) {
    throw HttpError(401, "Authorization 형식이 올바르지 않습니다");
  }

  const 결과 = 확인(토큰, 지금());

  if (!결과.된것) {
    // ★ 왜 안 되는지 그대로 알려 줘도 됩니다.
    //   "만료되었습니다" 를 알려 줘야 앱이 조용히 다시 받아 올 수 있습니다. (개념05)
    //   비밀번호와 달리 여기서 새는 정보가 없습니다.
    throw HttpError(401, 결과.이유);
  }

  // ★★ 토큰 내용을 그대로 믿을 것인가, DB 에서 다시 찾을 것인가
  //
  //   그대로 믿기   DB 를 안 뒤져서 빠릅니다.
  //                 대신 토큰을 준 뒤에 역할이 바뀌어도 한 시간 동안 옛 역할입니다.
  //                 탈퇴한 사람도 만료 전까지 들어옵니다.
  //
  //   다시 찾기     항상 최신입니다. 대신 요청마다 DB 를 한 번 더 뒤집니다.
  //
  //   여기서는 다시 찾습니다. 목록 한 번 뒤지는 것보다
  //   "탈퇴했는데 아직 들어와진다" 가 훨씬 곤란하기 때문입니다.
  //   ★ 읽기가 아주 많은 서비스라면 반대로 정하기도 합니다. 정답이 하나가 아닙니다.
  const 사람 = id로찾기.get(결과.내용.sub);

  if (!사람) throw HttpError(401, "없는 사용자입니다");

  req.user = 사람;
  next();
}

function 관리자만(req, res, next) {
  if (req.user.역할 !== "admin") throw HttpError(403, "관리자만 할 수 있습니다");
  next();
}


// ============================================================
// 5. 로그인해야 볼 수 있는 주소
// ============================================================

app.get("/me", 인증, (req, res) => {
  res.json({ data: req.user });
});

// 확인: GET /me
// 응답: 401 {"error":"로그인이 필요합니다"}

// 확인: GET /me [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyODQwMH0.F5k88F5wW5GwyNeYbfg6nkkYHd40qqf4QXBVw5mpWkc]
// 응답: 200 {"data":{"id":1,"아이디":"kim","역할":"user"}}

// ★ 한 글자만 고친 토큰을 보내 봅니다. (개념03 의 7-1 을 서버에서 하는 것입니다)
// 확인: GET /me [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6ImFkbWluIiwiaWF0IjoxNzg3ODI0ODAwLCJleHAiOjE3ODc4Mjg0MDB9.F5k88F5wW5GwyNeYbfg6nkkYHd40qqf4QXBVw5mpWkc]
// 응답: 401 {"error":"서명이 맞지 않습니다"}

// ★ 두 시간 전에 발급된 토큰입니다.
// 확인: GET /me [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJpYXQiOjE3ODc4MTc2MDAsImV4cCI6MTc4NzgyMTIwMH0.rznCfvgfJRuuzAmgW_pxfomdYh-nE_2DFd7E-UOALf4]
// 응답: 401 {"error":"만료되었습니다"}

// 확인: GET /me [Authorization: Bearer notatoken]
// 응답: 401 {"error":"토큰 모양이 아닙니다"}

// ★ 시험용 토큰을 영어로만 쓴 이유가 여기 있습니다.
//   헤더 값에는 한글을 못 담습니다. 담으면 요청이 나가지도 못합니다.
//   (백엔드 05단원 개념02, 그리고 개념02 에서 아이디에 한글을 막은 이유)

// ★ `/me` 응답에 비밀번호가 없는 것은 우연이 아닙니다.
//   `id로찾기` 문장이 `SELECT id, 아이디, 역할` 입니다. `SELECT *` 가 아닙니다.
//   ★ `SELECT *` 로 가져와서 지우는 것보다, 처음부터 안 가져오는 편이 안전합니다.
//     지우는 것은 빠뜨릴 수 있지만, 안 가져온 것은 샐 수가 없습니다.


// ============================================================
// 6. 401 과 403, 그리고 404
// ============================================================

app.get("/equipments", 인증, (req, res) => {
  res.json({ data: db.prepare("SELECT id, 이름 FROM 설비").all() });
});

// 확인: GET /equipments
// 응답: 401 {"error":"로그인이 필요합니다"}

// 확인: GET /equipments [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyODQwMH0.F5k88F5wW5GwyNeYbfg6nkkYHd40qqf4QXBVw5mpWkc]
// 응답: 200 {"data":[{"id":1,"이름":"컨베이어 1호"},{"id":2,"이름":"프레스 1호"}]}

app.delete("/equipments/:id", 인증, 관리자만, (req, res) => {
  const 결과 = db.prepare("DELETE FROM 설비 WHERE id = ?").run(Number(req.params.id));

  if (결과.changes === 0) throw HttpError(404, "없는 설비입니다");

  res.status(204).end();
});

// 확인: DELETE /equipments/1
// 응답: 401 {"error":"로그인이 필요합니다"}

// 확인: DELETE /equipments/1 [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyODQwMH0.F5k88F5wW5GwyNeYbfg6nkkYHd40qqf4QXBVw5mpWkc]
// 응답: 403 {"error":"관리자만 할 수 있습니다"}

// 확인: DELETE /equipments/1 [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsIuyVhOydtOuUlCI6ImJvc3MiLCLsl63tlaAiOiJhZG1pbiIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg3ODI4NDAwfQ.QR_im4Umfl8FVW7qVvGSvGkk7eaL_t_HrPAi5xyiIoo]
// 응답: 204

// 확인: DELETE /equipments/1 [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsIuyVhOydtOuUlCI6ImJvc3MiLCLsl63tlaAiOiJhZG1pbiIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg3ODI4NDAwfQ.QR_im4Umfl8FVW7qVvGSvGkk7eaL_t_HrPAi5xyiIoo]
// 응답: 404 {"error":"없는 설비입니다"}

// ★ 네 줄을 나란히 보세요. 백엔드 05단원에서 본 그 표입니다.
//
//   토큰 없음      401   너 누구니
//   user 토큰      403   누군지는 알겠는데 안 돼
//   admin 토큰     204   통과
//   admin, 없는 것 404   통과했는데 그런 게 없어
//
// ★ 순서가 곧 시나리오입니다. 세 번째 줄에서 지웠기 때문에 네 번째가 404 입니다.
//
// ★★ 403 대신 404 를 주는 곳도 있습니다.
//   "권한이 없다" 고 알려 주면 **그게 있다는 것** 은 알려 준 셈입니다.
//   `/admin/설정` 이 403 이면 그런 주소가 있다는 뜻이니까요.
//   숨겨야 하는 것이면 404 로 없는 척합니다. 정하기 나름입니다.


// ============================================================
// 7. 내 것만 고칠 수 있게
// ============================================================
//
// 역할만으로는 부족한 곳이 있습니다.
// "로그인한 사람" 이라고 다 통과시키면 남의 것을 고칩니다.

app.patch("/equipments/:id", 인증, (req, res) => {
  const 설비 = db.prepare("SELECT * FROM 설비 WHERE id = ?").get(Number(req.params.id));

  if (!설비) throw HttpError(404, "없는 설비입니다");

  // ★★ 이 한 줄이 실무에서 제일 자주 빠집니다.
  //   인증(로그인했나)까지만 하고 **이 사람 것이 맞나** 를 안 봅니다.
  //   그러면 주소의 숫자만 바꿔서 남의 자료를 고칩니다.
  //   이걸 IDOR 이라고 부릅니다. 남의 id 를 넣어 보는 것뿐인데 뚫립니다.
  if (설비.주인id !== req.user.id && req.user.역할 !== "admin") {
    throw HttpError(403, "내 설비가 아닙니다");
  }

  const { 이름 } = req.body ?? {};

  if (typeof 이름 !== "string" || !이름.trim()) throw HttpError(400, "이름이 필요합니다");

  db.prepare("UPDATE 설비 SET 이름 = ? WHERE id = ?").run(이름, 설비.id);

  res.json({ data: { id: 설비.id, 이름 } });
});

// 확인: PATCH /equipments/2 [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIuyVhOydtOuUlCI6ImtpbSIsIuyXre2VoCI6InVzZXIiLCJpYXQiOjE3ODc4MjQ4MDAsImV4cCI6MTc4NzgyODQwMH0.F5k88F5wW5GwyNeYbfg6nkkYHd40qqf4QXBVw5mpWkc] {"이름":"내가 고친다"}
// 응답: 403 {"error":"내 설비가 아닙니다"}

// 2번 설비의 주인은 boss(id 2) 입니다. kim 은 못 고칩니다.

// 확인: PATCH /equipments/2 [Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsIuyVhOydtOuUlCI6ImJvc3MiLCLsl63tlaAiOiJhZG1pbiIsImlhdCI6MTc4NzgyNDgwMCwiZXhwIjoxNzg3ODI4NDAwfQ.QR_im4Umfl8FVW7qVvGSvGkk7eaL_t_HrPAi5xyiIoo] {"이름":"프레스 2호"}
// 응답: 200 {"data":{"id":2,"이름":"프레스 2호"}}

// ★ 규칙으로 외우세요.
//   **주소에 남의 id 를 넣어 보면 뚫리나?** 를 라우트마다 물어보세요.
//   `req.user.id` 를 안 쓰는 라우트가 있으면 거기가 구멍일 확률이 높습니다.


// ============================================================
// 8. 에러 처리기
// ============================================================
//
// 백엔드 04단원 개념04 와 같습니다. 인자가 네 개여야 합니다.

app.use((err, req, res, next) => {
  const 코드 = err.status || 500;

  // ★ 500 일 때 err.message 를 그대로 내보내면 안 됩니다.
  //   DB 에러 메시지에 표 이름·칸 이름이 다 들어 있습니다.
  //   서버 로그에는 남기고, 밖에는 뭉뚱그려 말합니다.
  if (코드 === 500) {
    console.error(err);
    return res.status(500).json({ error: "서버 오류" });
  }

  res.status(코드).json({ error: err.message });
});


// ============================================================
// 9. HTTPS 가 아니면 여기까지가 다 소용없습니다
// ============================================================
//
// 지금까지 한 것을 다시 봅시다.
//
//   비밀번호를 안 저장하고, 토큰을 서명하고, 만료를 넣었습니다.
//
// 그런데 **http:// 로 주고받으면** 중간에 있는 사람이 다 봅니다.
// 로그인 요청의 비밀번호도, 응답의 토큰도 그냥 글자입니다.
// 토큰을 그대로 베껴서 쓰면 그 사람으로 로그인한 것과 같습니다.
//
// ★ 07단원 개념04 에서 HTTPS 를 붙였습니다. 그게 이 단원의 전제입니다.
//   로그인을 붙이는 순간 HTTPS 는 선택이 아닙니다.
//
// ★ 카페 와이파이에서 http 사이트에 로그인하면 어떻게 되는지가 이 이야기입니다.


app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
  console.log("");
  console.log("  로그인:  curl -X POST http://localhost:3000/login -H 'Content-Type: application/json' -d '{\"아이디\":\"kim\",\"비밀번호\":\"abcd1234\"}'");
  console.log("  내 정보: curl http://localhost:3000/me -H 'Authorization: Bearer 받은토큰'");
});
