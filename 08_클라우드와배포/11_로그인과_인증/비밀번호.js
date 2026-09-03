// ============================================================
// 비밀번호.js — 개념01 의 결론만 모아 둔 것
// ------------------------------------------------------------
// 개념02~05 가 이 파일을 가져다 씁니다.
//
//   const { 만들기, 맞나 } = require("./비밀번호");
//
// 왜 파일로 뺐나:
//   네 파일에 같은 코드를 네 번 쓰면, 고칠 때 세 군데를 빠뜨립니다.
//   비밀번호 다루는 코드는 특히 그러면 안 됩니다.
//   백엔드 07단원의 `repositories/` 와 같은 생각입니다.
// ============================================================

const crypto = require("node:crypto");

// 저장 모양:  scrypt$소금$섞은것
const 방식이름 = "scrypt";
const 길이 = 64;


// 비밀번호를 저장할 수 있는 모양으로 바꿉니다.
function 만들기(비밀번호) {
  const 소금 = crypto.randomBytes(16).toString("hex");
  const 섞은것 = crypto.scryptSync(비밀번호, 소금, 길이).toString("hex");

  return `${방식이름}$${소금}$${섞은것}`;
}


// 친 비밀번호가 저장된 것과 맞는지 봅니다.
function 맞나(비밀번호, 저장된것) {
  // ★ 저장된 것이 없거나 모양이 이상해도 **에러를 내지 않고 false** 를 줍니다.
  //   여기서 에러가 나면 서버가 500 을 내고, 그것만으로도
  //   "이 아이디는 있는데 저장 모양이 깨졌구나" 를 알려 주게 됩니다.
  if (typeof 저장된것 !== "string") return false;

  const 칸들 = 저장된것.split("$");

  if (칸들.length !== 3) return false;

  const [방식, 소금, 섞은것] = 칸들;

  if (방식 !== 방식이름) return false;
  if (섞은것.length !== 길이 * 2) return false;

  const 다시섞은것 = crypto.scryptSync(비밀번호, 소금, 길이).toString("hex");

  // 시간이 일정한 비교입니다. 이유는 개념01 의 6번에 있습니다.
  return crypto.timingSafeEqual(Buffer.from(다시섞은것, "hex"), Buffer.from(섞은것, "hex"));
}


// ★ 아이디가 없을 때도 시간을 똑같이 쓰려고 만들어 둔 것입니다.
//   개념02 의 5번에서 왜 필요한지 봅니다.
const 버리는값 = 만들기(crypto.randomBytes(16).toString("hex"));

function 시간만쓰기(비밀번호) {
  맞나(비밀번호, 버리는값);
}


module.exports = { 만들기, 맞나, 시간만쓰기 };
