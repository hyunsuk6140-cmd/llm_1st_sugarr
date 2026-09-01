const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "요청을 처리하지 못했습니다.");
  }

  return data;
}

export function login(payload) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCategories() {
  return request("/categories");
}

export function getQuestions(category = "전체") {
  return request(`/questions?category=${encodeURIComponent(category)}`);
}

export function createQuestion(question) {
  return request("/questions", {
    method: "POST",
    body: JSON.stringify(question),
  });
}

export function updateQuestion(questionId, question) {
  return request(`/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(question),
  });
}

export function deleteQuestion(questionId, userId) {
  return request(`/questions/${questionId}?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export function submitAttempt(payload) {
  return request("/attempts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getStats(userId) {
  return request(`/users/${userId}/stats`);
}

export function getAttempts(userId) {
  return request(`/users/${userId}/attempts`);
}

export function getWrongNotes(userId) {
  return request(`/users/${userId}/wrong-notes`);
}

export function deleteWrongNote(userId, questionId) {
  return request(`/users/${userId}/wrong-notes/${questionId}`, {
    method: "DELETE",
  });
}

export function getExams() {
  return request("/exams");
}

export function createExam(exam) {
  return request("/exams", {
    method: "POST",
    body: JSON.stringify(exam),
  });
}
