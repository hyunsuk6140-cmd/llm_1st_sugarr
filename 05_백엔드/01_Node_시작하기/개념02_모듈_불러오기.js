// ============================================================
// 01단원 · 개념 02 — 파일 나눠 쓰기 (모듈)
// ------------------------------------------------------------
// 실행: node 개념02_모듈_불러오기.js
// ============================================================
//
// 서버 코드는 금방 커집니다. 한 파일에 다 넣으면 아무도 못 읽습니다.
// 그래서 기능별로 파일을 나누고, 필요한 것만 서로 꺼내 씁니다.
//
// ── 그런데 방식이 두 가지입니다 ──
//
//   CommonJS   require / module.exports    ← Node 가 처음부터 쓰던 방식
//   ESM        import  / export            ← 나중에 표준이 된 방식
//
// 프론트(React·Vite)에서는 ESM 을 씁니다.
// 백엔드에서는 아직도 CommonJS 가 훨씬 많이 보입니다.
//
// 이 자료는 **CommonJS 를 기본으로** 씁니다. 이유는 두 가지입니다.
//   ① Express 문서와 인터넷 예제 대부분이 require 로 되어 있습니다
//   ② 검색해서 나오는 코드를 그대로 쓸 수 있어야 합니다
//
// 둘 다 알아야 합니다. 이 파일에서 차이를 정리합니다.

// ── 섹션 1: require 로 가져오기 ──

// 같은 폴더의 계산기.js 를 통째로 가져옵니다.
const calc = require("./계산기");

// 가져온 것은 객체입니다. 점으로 꺼내 씁니다.
console.log(typeof calc);
// 출력: object

console.log(calc.TAX_RATE);
// 출력: 0.1

console.log(calc.add(3, 4));
// 출력: 7

console.log(calc.addTax(10000));
// 출력: 11000

console.log(calc.keyLength());
// 읽는 법
//     const 담을이름 = require("./파일경로");
//                              ─────────
//                              ./ 로 시작하면 "내가 만든 파일"
//
// ★ .js 를 안 붙여도 됩니다. require("./계산기") 로 충분합니다.
//   (프론트의 import 는 .js 를 꼭 붙여야 했죠. 여기가 다릅니다)

// ✏️ 직접 해보기 1 — calc.keyLength() 를 찍어 보세요. 몇이 나올까요?

// ── 섹션 2: 필요한 것만 꺼내 오기 ──

// 매번 calc. 을 붙이기 번거로우면, 가져오면서 바로 꺼낼 수 있습니다.
// JS자료 09단원에서 배운 객체 구조분해입니다.

const { add, addTax } = require("./계산기");

console.log(add(10, 20));
// 출력: 30
console.log(addTax(5000));
// 출력: 5500

// 실무 코드에서 이 형태를 가장 많이 봅니다.
//
//     const express = require("express");           통째로
//     const { Router } = require("express");        필요한 것만

// 내보내지 않은 것은 가져올 수 없습니다.
const { SECRET_KEY } = require("./계산기");
console.log(SECRET_KEY);
// 출력: undefined
// 에러가 아니라 undefined 입니다. 조용해서 더 헷갈립니다.
// "왜 undefined 지?" 싶으면 그 파일의 module.exports 를 먼저 확인하세요.

// ✏️ 직접 해보기 2 — 계산기.js 를 열어서 module.exports 에 무엇이 담겼는지 확인하세요.

// ── 섹션 3: 한 번만 실행된다 ──

// 같은 파일을 두 번 require 하면 어떻게 될까요?
const calc1 = require("./계산기");
const calc2 = require("./계산기");

console.log(calc1 === calc2);
// 출력: true
// 같은 것입니다. Node 는 한 번 읽은 모듈을 기억해 두고 다시 씁니다.
//
// 그래서 모듈 안에 값을 담아 두면 온 프로그램이 그 값을 공유합니다.
// 나중에 데이터베이스 연결을 한 곳에 두고 여기저기서 가져다 쓰는 것이 이 성질 덕분입니다.

// ✏️ 직접 해보기 3 — 계산기.js 맨 아래에 console.log("계산기 불러옴") 을 추가하고
//                    이 파일을 실행해 보세요. 몇 번 찍힐까요?

// ── 섹션 4: ESM 과 뭐가 다른가 ──

// 프론트에서 배운 것과 나란히 놓고 보세요.
//
//   [내보내기]
//     CommonJS   module.exports = { add };
//     ESM        export { add };            /  export default ...
//
//   [가져오기]
//     CommonJS   const { add } = require("./계산기");
//     ESM        import { add } from "./계산기.js";
//
//   [확장자]
//     CommonJS   생략 가능    require("./계산기")
//     ESM        꼭 써야 함   import ... from "./계산기.js"
//
//   [쓸 수 있는 위치]
//     CommonJS   어디서든 가능. 함수 안, if 안에서도 됩니다
//     ESM        파일 맨 위에서만
//
// 한 파일에서 둘을 섞어 쓸 수는 없습니다.
// package.json 에 "type": "module" 이 있으면 ESM, 없으면 CommonJS 입니다.
// 이 자료의 폴더에는 그게 없으니 CommonJS 로 동작합니다.

// CommonJS 는 함수 안에서도 부를 수 있습니다. 이건 ESM 이 못 하는 일입니다.
function loadWhenNeeded() {
  const later = require("./계산기");
  return later.add(1, 1);
}

console.log(loadWhenNeeded());
// 출력: 2

// ✏️ 직접 해보기 4 — 위 표를 보고, 아래 코드가 왜 에러가 나는지 말해 보세요.
//                    import { add } from "./계산기.js";

// ── 섹션 5: Node 가 이미 갖고 있는 모듈 ──

// ./ 없이 이름만 쓰면 "내가 만든 파일" 이 아니라
// "Node 에 원래 있는 것" 이나 "npm 으로 설치한 것" 을 찾습니다.

const path = require("path");
const os = require("os");

console.log(typeof path.join);
// 출력: function

console.log(path.join("uploads", "docs", "a.pdf"));
// 출력: uploads\docs\a.pdf
// 윈도우는 \ 로, 맥·리눅스는 / 로 이어 줍니다.
// 운영체제마다 다른 것을 알아서 맞춰 주는 것이 path 의 역할입니다.
// (나중에 EC2 리눅스에 올릴 때 이것 덕분에 안 깨집니다)

console.log(typeof os.platform());
// 출력: string

// 설치가 필요 없습니다. Node 에 이미 들어 있습니다. 02단원에서 자세히 봅니다.

// ✏️ 직접 해보기 5 — path.join("a", "b", "c.txt") 를 찍어 보세요.

// ── 섹션 6: 자주 하는 실수 ──

// ★ 아래에서 SyntaxError 라고 적힌 것은 눈으로만 보세요. 주석을 풀지 마세요.
//   SyntaxError 는 파일을 아예 못 읽게 만들어 출력이 한 줄도 안 나옵니다.

// [실수 1] ./ 를 빼먹음 → 에러
// const calc = require("계산기");
// 실수: Error: Cannot find module '계산기'
//       ./ 가 없으면 npm 패키지를 찾습니다. 내 파일은 반드시 ./ 로 시작합니다.

// [실수 2] module.exports 를 안 씀
//   파일에 함수를 만들어 놓고 module.exports 를 안 하면
//   require 로 가져와 봐야 빈 객체 {} 입니다. 에러도 안 납니다.
//   "분명 만들었는데 undefined 가 나온다" 면 이걸 의심하세요.

// [실수 3] exports 와 module.exports 를 헷갈림
//   exports.add = add;        ← 이것도 됩니다
//   exports = { add };        ← 이건 안 됩니다 (조용히 실패)
//   헷갈리니 이 자료에서는 module.exports 만 씁니다.

// [실수 4] CommonJS 파일에서 import 를 씀 → SyntaxError
// import { add } from "./계산기.js";
// 실수: SyntaxError: Cannot use import statement outside a module
//       이 폴더는 CommonJS 입니다. require 를 쓰세요.

// [실수 5] 순환 참조
//   A.js 가 B.js 를 부르고, B.js 가 다시 A.js 를 부르는 경우입니다.
//   에러 없이 한쪽이 undefined 가 되어 아주 찾기 어렵습니다.
//   파일을 나눌 때 "한 방향으로만 흐르게" 설계하세요.

// ── 정리 ──

// 1. 이 자료는 CommonJS 를 쓴다. require / module.exports.
// 2. const calc = require("./파일");  — 내 파일은 ./ 로 시작, .js 는 생략 가능.
// 3. module.exports 에 담은 것만 밖에서 쓸 수 있다. 안 담으면 undefined.
// 4. 구조분해로 필요한 것만 꺼내는 형태를 가장 많이 쓴다.
// 5. 같은 모듈을 여러 번 불러도 한 번만 실행되고 같은 것을 돌려준다.
// 6. ./ 없이 이름만 쓰면 Node 내장 모듈이나 npm 패키지를 찾는다.

// ============================================================
// 직접 해보기 정답
// ============================================================
//
// 1) console.log(calc.keyLength());
//    // 출력: 12
//    → SECRET_KEY 는 못 가져오지만, 그 값을 쓰는 함수는 가져올 수 있습니다.
//      "밖으로 안 나갑니다" 가 12글자입니다.
//      값은 숨기고 기능만 열어 주는 것 — 모듈을 나누는 이유 중 하나입니다.
//
// 2) module.exports = { TAX_RATE, add, addTax, keyLength };
//    → SECRET_KEY 는 없습니다. 그래서 undefined 가 나온 것입니다.
//
// 3) 한 번만 찍힙니다.
//    이 파일에서 require("./계산기") 를 네 번이나 했는데도 한 번입니다.
//    Node 가 처음 한 번만 실행하고 그 결과를 기억해 두기 때문입니다. (섹션 3)
//    확인했으면 계산기.js 에서 그 줄을 다시 지우세요.
//
// 4) 이 폴더에는 package.json 의 "type": "module" 이 없어서 CommonJS 로 동작합니다.
//    CommonJS 파일에서는 import 를 쓸 수 없습니다.
//    → SyntaxError: Cannot use import statement outside a module
//
// 5) console.log(path.join("a", "b", "c.txt"));
//    // 출력: a\b\c.txt      (윈도우 기준. 맥·리눅스는 a/b/c.txt)
