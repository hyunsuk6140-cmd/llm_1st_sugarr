// ============================================================
// utils/AppError.js — 상태코드와 코드가 붙은 에러
// ------------------------------------------------------------
// 06단원 개념04 에서 만든 것을 파일로 뺐습니다.
// ============================================================

class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);

    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const { 조사 } = require("./한국어");

const 에러 = {
  // ★ 06단원에서 만든 조사 함수를 씁니다.
  //   "설비을(를)" 이 아니라 "설비를" 로 나옵니다.
  없음: (무엇) => new AppError(404, "NOT_FOUND", `${조사(무엇, "을", "를")} 찾을 수 없습니다`),

  검증실패: (항목들) =>
    new AppError(400, "VALIDATION_FAILED", "입력값이 올바르지 않습니다", 항목들),

  중복: (무엇) => new AppError(409, "DUPLICATED", `이미 있는 ${무엇}입니다`),

  상태충돌: (메시지) => new AppError(409, "CONFLICT", 메시지),

  주소없음: () => new AppError(404, "ROUTE_NOT_FOUND", "그런 주소가 없습니다"),
};

module.exports = { AppError, 에러 };
