// (빌드 결과 흉내 — 실제로는 한 줄로 뭉쳐져 있고 훨씬 깁니다)
const API_URL="https://api.example.com";
function 설비목록(){return fetch(API_URL+"/api/v1/equipments").then(r=>r.json())}
document.querySelector("#root").textContent="설비 관리 화면";
설비목록();
