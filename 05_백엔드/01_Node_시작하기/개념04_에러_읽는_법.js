// ============================================================
// 01단원 · 개념 04 — 에러 메시지 읽는 법
// ------------------------------------------------------------
// 실행: node 개념04_에러_읽는_법.js
// ============================================================
//
// 백엔드를 시작하면 에러를 훨씬 자주 만납니다.
// 브라우저에서는 화면이 안 바뀌는 정도였지만,
// 서버에서는 프로그램이 통째로 죽습니다.
//
// 그런데 좋은 소식이 있습니다.
// 에러 메시지에는 **무엇이 잘못됐고 어디서 잘못됐는지가 전부 적혀 있습니다.**
//
// 초보자와 익숙한 사람의 차이는 "에러를 안 내는 것" 이 아닙니다.
// 에러를 읽고 5초 만에 원인을 찾느냐, 30분을 헤매느냐의 차이입니다.
//
// 이 파일은 그 읽는 법만 다룹니다. 이 단원에서 가장 실용적인 파일입니다.

// ── 섹션 1: 에러는 세 부분으로 되어 있다 ──

// 에러를 일부러 하나 내 보고, 그 안을 뜯어 봅시다.
// (try/catch 로 잡았기 때문에 프로그램이 안 죽습니다. JS자료 12단원에서 배웠죠)

try {
  const user = undefined;
  console.log(user.length);
} catch (error) {
  // ① 에러의 '종류'
  console.log(error.name);
  // 출력: TypeError

  // ② 사람이 읽는 '설명'
  console.log(error.message);
  // 출력: Cannot read properties of null (reading 'length')
}

// 터미널에 빨갛게 뜨는 것은 이 둘을 합친 모양입니다.
//
//     TypeError: Cannot read properties of null (reading 'length')
//     ─────────  ────────────────────────────────────────────────
//        종류                      설명
//
// ③ 세 번째는 '어디서' 입니다. error.stack 에 들어 있습니다.
//    아래 섹션 2에서 봅니다.

// ✏️ 직접 해보기 1 — try 안의 user 를 undefined 로 바꿔 보세요.
//                    error.message 가 어떻게 달라지나요?

// ── 섹션 2: 스택 — 어디서 났는지 ──

try {
  const user = null;
  console.log(user.length);
} catch (error) {
  const firstLine = error.stack.split("\n")[1];

  console.log(firstLine.includes("개념04_에러_읽는_법.js"));
  // 출력: true
  // 스택의 둘째 줄에 '파일 이름' 이 들어 있습니다.
  //
  // ★ 맥에서는 false 가 나올 수 있습니다. 맥이 한글 파일 이름을
  //   자소를 나눠(NFD) 저장해서, 눈에는 같아 보여도 컴퓨터에게는
  //   다른 문자열이기 때문입니다. 윈도우에서는 true 입니다.
}

// 실제 스택은 이렇게 생겼습니다. 여러 줄입니다.
//
//     TypeError: Cannot read properties of null (reading 'length')
//         at Object.<anonymous> (C:\...\개념04_에러_읽는_법.js:55:22)
//         at Module._compile (node:internal/modules/cjs/loader:1234:14)
//         at Module._load (node:internal/modules/cjs/loader:1012:12)
//         ... 계속
//
// ★ 읽는 요령 딱 하나
//
//     "내 파일 이름이 나오는 첫 줄" 만 보세요.
//
//   위 예에서는 개념04_에러_읽는_법.js:55:22 입니다.
//   55번째 줄, 22번째 글자에서 났다는 뜻입니다. 거기로 가면 됩니다.
//
//   node:internal/... 로 시작하는 줄들은 Node 내부입니다. 볼 필요 없습니다.
//   node_modules 가 들어간 줄도 대개 볼 필요 없습니다.
//
// 처음에는 빨간 글씨가 20줄쯤 쏟아져서 겁이 납니다.
// 그중 볼 것은 맨 윗줄 하나와 내 파일이 나오는 줄 하나, 딱 둘입니다.

// ✏️ 직접 해보기 2 — 위 try 안에서 error.stack 을 통째로 찍어 보세요.
//                    몇 줄이 나오고, 그중 내 파일은 몇 번째 줄인가요?

// ── 섹션 3: 자주 만나는 에러 다섯 가지 ──

// 백엔드에서 만나는 에러의 90%는 이 다섯입니다.
// 하나씩 일부러 내 보면서 메시지를 눈에 익히세요.

// [1] ReferenceError — 없는 이름을 불렀다
try {
  console.log(존재하지않는변수);
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
  // 출력: ReferenceError: 존재하지않는변수 is not defined
}
// 원인: 오타이거나, 만들기 전에 썼거나, require 를 빼먹었습니다.
// 찾는 법: 그 이름을 파일에서 검색(Ctrl+F)해 보세요. 한 번만 나오면 오타입니다.

// [2] TypeError — 없는 것에서 뭔가를 꺼내려 했다
try {
  const data = null;
  console.log(data.name);
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
  // 출력: TypeError: Cannot read properties of null (reading 'name')
}
// 원인: 값이 null 이나 undefined 인데 점을 찍었습니다.
// ★ 백엔드에서 가장 많이 보는 에러입니다.
//   데이터베이스에서 못 찾았을 때, 요청에 값이 안 왔을 때 계속 납니다.
// 찾는 법: 점 왼쪽의 값을 console.log 로 찍어 보세요. 왜 비었는지가 진짜 원인입니다.

// [3] TypeError — 함수가 아닌 것을 함수처럼 불렀다
try {
  const list = [1, 2, 3];
  list.push2(4);
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
  // 출력: TypeError: list.push2 is not a function
}
// 원인: 메소드 이름 오타이거나, 그 자료형에 없는 메소드입니다.
// 찾는 법: 메시지에 이름이 그대로 나옵니다. push2 → push 로 고치면 됩니다.

// [4] Cannot find module — 파일이나 패키지를 못 찾았다
try {
  require("./없는파일");
} catch (error) {
  console.log(error.message.split("\n")[0]);
  // 출력: Cannot find module './없는파일'
}
// 원인 세 가지 중 하나입니다.
//   · 경로가 틀렸다              → ./ 를 빼먹었거나 폴더가 다릅니다
//   · npm install 을 안 했다     → node_modules 에 없습니다
//   · 파일 이름 오타
// 찾는 법: ./ 가 있으면 파일을, 없으면 package.json 을 확인하세요.

// [5] SyntaxError — 문법이 깨졌다
try {
  JSON.parse("{잘못된}");
} catch (error) {
  console.log(error.name);
  // 출력: SyntaxError
}
// 원인: 괄호·따옴표 짝이 안 맞거나, JSON 형식이 틀렸습니다.
// ★ 코드 자체의 SyntaxError 는 특별합니다.
//   파일을 아예 못 읽어서 **한 줄도 실행되지 않습니다.**
//   console.log 를 넣어도 안 찍힙니다. 그럴 땐 문법부터 의심하세요.

// [6] 예고 — EADDRINUSE
//   04단원에서 서버를 만들면 이걸 만납니다.
//     Error: listen EADDRINUSE: address already in use :::3000
//   "3000번 포트를 이미 누가 쓰고 있다" 는 뜻입니다.
//   앞서 켜 둔 서버를 안 끄고 또 켰을 때 납니다. 그 터미널에서 Ctrl+C 로 끄면 됩니다.

// ✏️ 직접 해보기 3 — 위 다섯 가지를 try/catch 없이 그냥 써 보고,
//                    터미널에 실제로 어떻게 빨갛게 나오는지 눈으로 보세요.
//                    (확인했으면 지우세요. 안 지우면 뒤 코드가 실행 안 됩니다)

// ── 섹션 4: 에러가 나도 서버는 안 죽게 ──

// 서버는 하루 종일 켜져 있어야 합니다.
// 요청 하나가 잘못됐다고 서버 전체가 죽으면 안 됩니다.

function 안전하게계산(value) {
  try {
    return value.toFixed(2);
  } catch (error) {
    console.log("계산 실패:", error.message);
    return "계산할 수 없음";
  }
}

console.log(안전하게계산(3.14159));
// 출력: 3.14
console.log(안전하게계산(null));
// 출력: 계산 실패: Cannot read properties of null (reading 'toFixed')
// 출력: 계산할 수 없음

// 두 번째 호출에서 에러가 났는데도 프로그램이 안 죽고 계속 돕니다.
// 이게 try/catch 를 쓰는 이유입니다.
//
// [주의] 그렇다고 모든 곳을 try/catch 로 감싸지는 마세요.
//   에러를 잡아 놓고 아무 말도 안 하면, 뭐가 잘못됐는지 영영 모르게 됩니다.
//   반드시 console.log 로 남기거나, 사용자에게 알려 주세요.
//   04단원에서 Express 의 에러 처리 방법을 따로 배웁니다.

// ✏️ 직접 해보기 4 — 안전하게계산("문자열") 을 넣으면 어떻게 될까요?
//                    먼저 예상하고 실행해 보세요.

// ── 섹션 5: console.log 로 원인 좁히기 ──

// 에러 메시지만으로 안 풀릴 때가 있습니다. 그때 쓰는 방법입니다.
//
// [요령 1] 이름표를 붙여 찍으세요
//   console.log(value);              ← 여러 개 찍으면 뭐가 뭔지 모릅니다
//   console.log("계산 전 value:", value);   ← 이렇게

const order = { id: 1, items: ["라떼"] };

console.log("주문 확인:", order);
// 출력: 주문 확인: { id: 1, items: [ '라떼' ] }

// [요령 2] 점 왼쪽을 먼저 찍으세요
//   order.customer.name 에서 에러가 났다면
//   order 를 찍고, order.customer 를 찍어 보세요.
//   어디서 비는지 바로 보입니다.

console.log(order.customer);
// 출력: undefined
// 여기가 비어 있으니 order.customer.name 은 TypeError 가 납니다.

// [요령 3] 자료형을 의심하세요
console.log(typeof order.id, typeof order.items);
// 출력: number object
// 숫자인 줄 알았는데 문자열인 경우가 정말 많습니다.
// 특히 터미널 인자, 요청으로 들어온 값은 전부 문자열입니다.

// [요령 4] 여기까지 왔는지 확인하세요
//   console.log("여기1"); ... console.log("여기2");
//   어디까지 찍히는지 보면 어느 줄에서 멈췄는지 알 수 있습니다.
//   원시적이지만 가장 빠를 때가 많습니다.

// ✏️ 직접 해보기 5 — order 에 customer 를 추가한 뒤
//                    order.customer.name 을 안전하게 꺼내 보세요. (JS자료 07단원의 ?. )

// ── 섹션 6: 자주 하는 실수 ──

// ★ 아래에서 SyntaxError 라고 적힌 것은 눈으로만 보세요. 주석을 풀지 마세요.

// [실수 1] 에러를 안 읽고 코드부터 고침
//   가장 많이 하는 실수입니다. 메시지에 답이 적혀 있는데 안 봅니다.
//   빨간 글씨가 뜨면 **맨 윗줄부터 소리 내어 읽으세요.**

// [실수 2] 스택 전체를 붙여 놓고 "에러가 나요" 라고 물어봄
//   맨 윗줄과 내 파일이 나오는 줄만 보면 됩니다.
//   질문할 때도 그 두 줄과 해당 코드를 보여 주는 게 훨씬 빠릅니다.

// [실수 3] catch 에서 아무것도 안 함
//   try { ... } catch (e) {}
//   에러가 조용히 사라집니다. 나중에 원인을 절대 못 찾습니다.
//   최소한 console.log(e.message) 는 남기세요.

// [실수 4] SyntaxError 인데 console.log 를 넣어 찾으려 함
//   문법 에러는 파일을 아예 못 읽습니다. console.log 가 안 찍힙니다.
//   "아무것도 안 찍힌다" 면 문법부터 보세요. VS Code 가 빨간 밑줄로 알려 줍니다.

// [실수 5] 터미널을 안 보고 브라우저만 봄
//   백엔드 에러는 **터미널에 나옵니다.** 브라우저 화면은 그냥 멈춰 있습니다.
//   서버를 만들면 터미널을 항상 한쪽에 띄워 두세요.

// ── 정리 ──

// 1. 에러는 종류(name) + 설명(message) + 위치(stack) 세 부분이다.
// 2. 스택은 '내 파일 이름이 나오는 첫 줄' 만 보면 된다. 줄 번호가 적혀 있다.
// 3. ReferenceError = 없는 이름 / TypeError = null·undefined 에 점 찍음
// 4. Cannot find module = 경로 오타이거나 npm install 을 안 했다.
// 5. SyntaxError 는 파일 전체가 안 돌아간다. 아무것도 안 찍히면 문법을 의심한다.
// 6. try/catch 로 잡되, catch 를 비워 두지 않는다.
// 7. 막히면 점 왼쪽을 찍어 보고, 자료형을 의심하고, 이름표를 붙여 찍는다.
// 8. 백엔드 에러는 브라우저가 아니라 터미널에 나온다.

// ============================================================
// 직접 해보기 정답
// ============================================================
//
// 1) const user = undefined;
//    → TypeError: Cannot read properties of undefined (reading 'length')
//      null 이 undefined 로 바뀌었을 뿐 나머지는 같습니다.
//      둘 다 "값이 없는데 점을 찍었다" 는 같은 원인입니다.
//
// 2) console.log(error.stack);
//    → 보통 8~12줄쯤 나옵니다.
//      1번째 줄: 에러 종류와 설명
//      2번째 줄: 내 파일과 줄 번호   ← 여기만 보면 됩니다
//      3번째 줄부터: node:internal/... (Node 내부. 볼 필요 없음)
//
// 3) 예를 들어 이렇게 써 보세요.
//      console.log(없는변수);
//    → 터미널에 빨간 글씨가 쏟아지고 프로그램이 거기서 멈춥니다.
//      그 아래에 있던 코드는 실행되지 않습니다.
//      try/catch 가 있고 없고의 차이를 눈으로 확인하는 것이 목적입니다.
//
// 4) console.log(안전하게계산("문자열"));
//    // 출력: 계산 실패: value.toFixed is not a function
//    // 출력: 계산할 수 없음
//    → 문자열에는 toFixed 가 없어서 TypeError 가 나고, catch 가 잡았습니다.
//      에러 종류는 달라도 처리 방식은 같습니다.
//
// 5) const order2 = { id: 1, items: ["라떼"], customer: { name: "김민준" } };
//    console.log(order2.customer?.name);        // 출력: 김민준
//    console.log(order.customer?.name);         // 출력: undefined
//    → ?. 를 쓰면 customer 가 없어도 에러 없이 undefined 가 나옵니다.
//      서버에서 들어온 데이터를 다룰 때 이 습관이 에러를 크게 줄여 줍니다.
