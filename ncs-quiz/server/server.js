import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initialQuestions from "../src/data/questions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const PORT = Number(process.env.PORT || 4000);
const CATEGORY_ORDER = [
  "전체",
  "수리능력",
  "의사소통능력",
  "문제해결능력",
  "자원관리능력",
  "정보능력",
  "조직이해능력",
];

const defaultDb = {
  users: [],
  questions: initialQuestions,
  attempts: [],
  wrongNotes: [],
  exams: [
    {
      id: 1,
      title: "기본 NCS 연습",
      category: "전체",
      questionIds: initialQuestions.map((question) => question.id),
      createdAt: new Date().toISOString(),
    },
  ],
};

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeDb(defaultDb);
  }
}

async function readDb() {
  await ensureDb();
  const data = await readFile(DB_PATH, "utf8");
  const db = JSON.parse(data);
  const existingQuestionIds = new Set(db.questions.map((question) => question.id));
  const missingQuestions = initialQuestions.filter(
    (question) => !existingQuestionIds.has(question.id),
  );

  if (missingQuestions.length > 0) {
    db.questions.push(...missingQuestions);
    await writeDb(db);
  }

  return db;
}

async function writeDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => Number(item.id))) + 1 : 1;
}

function gradeAttempt(questions, answers) {
  const details = questions.map((question) => {
    const selectedAnswer = answers[String(question.id)];
    const isCorrect = selectedAnswer === question.answer;

    return {
      questionId: question.id,
      selectedAnswer,
      correctAnswer: question.answer,
      isCorrect,
    };
  });
  const correctCount = details.filter((detail) => detail.isCorrect).length;

  return {
    correctCount,
    score: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
    details,
  };
}

function getStats(db, userId) {
  const attempts = db.attempts.filter((attempt) => attempt.userId === userId);
  const totalQuestions = attempts.reduce(
    (total, attempt) => total + attempt.totalCount,
    0,
  );
  const totalCorrect = attempts.reduce(
    (total, attempt) => total + attempt.correctCount,
    0,
  );

  return {
    attemptCount: attempts.length,
    averageScore: attempts.length
      ? Math.round(
          attempts.reduce((total, attempt) => total + attempt.score, 0) /
            attempts.length,
        )
      : 0,
    accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    recentAttempts: attempts.slice(-5).reverse(),
  };
}

function getCategories(questions) {
  const existingCategories = new Set(questions.map((question) => question.category));
  const orderedCategories = CATEGORY_ORDER.filter(
    (category) => category === "전체" || existingCategories.has(category),
  );
  const extraCategories = [...existingCategories].filter(
    (category) => !CATEGORY_ORDER.includes(category),
  );

  return [...orderedCategories, ...extraCategories];
}

function isAdmin(db, userId) {
  const user = db.users.find((item) => item.id === Number(userId));
  return user?.role === "admin";
}

function rejectUnlessAdmin(db, userId, response) {
  if (isAdmin(db, userId)) {
    return false;
  }

  sendJson(response, 403, { message: "관리자만 사용할 수 있습니다." });
  return true;
}

async function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    const db = await readDb();

    if (request.method === "POST" && pathname === "/api/login") {
      const body = await parseBody(request);
      const name = String(body.name || "").trim();

      if (!name) {
        sendJson(response, 400, { message: "이름을 입력하세요." });
        return;
      }

      let user = db.users.find((item) => item.name === name);
      const requestedRole = body.role === "admin" ? "admin" : "student";

      if (!user) {
        user = {
          id: nextId(db.users),
          name,
          role: requestedRole,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        await writeDb(db);
      } else if (user.role !== requestedRole) {
        user.role = requestedRole;
        await writeDb(db);
      }

      sendJson(response, 200, { user });
      return;
    }

    if (request.method === "GET" && pathname === "/api/categories") {
      sendJson(response, 200, {
        categories: getCategories(db.questions),
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/questions") {
      const category = url.searchParams.get("category") || "전체";
      const questions =
        category === "전체"
          ? db.questions
          : db.questions.filter((question) => question.category === category);

      sendJson(response, 200, { questions });
      return;
    }

    if (request.method === "POST" && pathname === "/api/questions") {
      const body = await parseBody(request);

      if (rejectUnlessAdmin(db, body.userId, response)) {
        return;
      }

      const question = {
        id: nextId(db.questions),
        category: String(body.category || "").trim(),
        question: String(body.question || "").trim(),
        choices: Array.isArray(body.choices) ? body.choices.map(String) : [],
        answer: Number(body.answer),
        explanation: String(body.explanation || "").trim(),
      };

      if (
        !question.category ||
        !question.question ||
        question.choices.length < 2 ||
        question.answer < 0 ||
        question.answer >= question.choices.length
      ) {
        sendJson(response, 400, { message: "문제, 선택지, 정답을 확인하세요." });
        return;
      }

      db.questions.push(question);
      await writeDb(db);
      sendJson(response, 201, { question });
      return;
    }

    const questionMatch = pathname.match(/^\/api\/questions\/(\d+)$/);

    if (questionMatch && request.method === "PUT") {
      const questionId = Number(questionMatch[1]);
      const body = await parseBody(request);

      if (rejectUnlessAdmin(db, body.userId, response)) {
        return;
      }

      const index = db.questions.findIndex((question) => question.id === questionId);

      if (index === -1) {
        sendJson(response, 404, { message: "문제를 찾을 수 없습니다." });
        return;
      }

      db.questions[index] = {
        ...db.questions[index],
        category: String(body.category || db.questions[index].category).trim(),
        question: String(body.question || db.questions[index].question).trim(),
        choices: Array.isArray(body.choices)
          ? body.choices.map(String)
          : db.questions[index].choices,
        answer:
          body.answer === undefined ? db.questions[index].answer : Number(body.answer),
        explanation: String(
          body.explanation || db.questions[index].explanation,
        ).trim(),
      };
      await writeDb(db);
      sendJson(response, 200, { question: db.questions[index] });
      return;
    }

    if (questionMatch && request.method === "DELETE") {
      const questionId = Number(questionMatch[1]);

      if (rejectUnlessAdmin(db, url.searchParams.get("userId"), response)) {
        return;
      }

      db.questions = db.questions.filter((question) => question.id !== questionId);
      await writeDb(db);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && pathname === "/api/attempts") {
      const body = await parseBody(request);
      const userId = Number(body.userId);
      const category = String(body.category || "전체");
      const sourceQuestions =
        category === "전체"
          ? db.questions
          : db.questions.filter((question) => question.category === category);
      const grading = gradeAttempt(sourceQuestions, body.answers || {});
      const attempt = {
        id: nextId(db.attempts),
        userId,
        category,
        examId: body.examId ? Number(body.examId) : null,
        totalCount: sourceQuestions.length,
        correctCount: grading.correctCount,
        score: grading.score,
        details: grading.details,
        createdAt: new Date().toISOString(),
      };

      db.attempts.push(attempt);

      grading.details
        .filter((detail) => !detail.isCorrect)
        .forEach((detail) => {
          const note = db.wrongNotes.find(
            (item) => item.userId === userId && item.questionId === detail.questionId,
          );

          if (note) {
            note.count += 1;
            note.lastWrongAt = attempt.createdAt;
          } else {
            db.wrongNotes.push({
              id: nextId(db.wrongNotes),
              userId,
              questionId: detail.questionId,
              count: 1,
              lastWrongAt: attempt.createdAt,
            });
          }
        });

      await writeDb(db);
      sendJson(response, 201, { attempt });
      return;
    }

    const statsMatch = pathname.match(/^\/api\/users\/(\d+)\/stats$/);
    if (statsMatch && request.method === "GET") {
      sendJson(response, 200, { stats: getStats(db, Number(statsMatch[1])) });
      return;
    }

    const attemptsMatch = pathname.match(/^\/api\/users\/(\d+)\/attempts$/);
    if (attemptsMatch && request.method === "GET") {
      const userId = Number(attemptsMatch[1]);
      sendJson(response, 200, {
        attempts: db.attempts
          .filter((attempt) => attempt.userId === userId)
          .slice()
          .reverse(),
      });
      return;
    }

    const wrongNotesMatch = pathname.match(/^\/api\/users\/(\d+)\/wrong-notes$/);
    if (wrongNotesMatch && request.method === "GET") {
      const userId = Number(wrongNotesMatch[1]);
      const notes = db.wrongNotes
        .filter((note) => note.userId === userId)
        .map((note) => ({
          ...note,
          question: db.questions.find((question) => question.id === note.questionId),
        }))
        .filter((note) => note.question);

      sendJson(response, 200, { notes });
      return;
    }

    const deleteNoteMatch = pathname.match(
      /^\/api\/users\/(\d+)\/wrong-notes\/(\d+)$/,
    );
    if (deleteNoteMatch && request.method === "DELETE") {
      const userId = Number(deleteNoteMatch[1]);
      const questionId = Number(deleteNoteMatch[2]);
      db.wrongNotes = db.wrongNotes.filter(
        (note) => note.userId !== userId || note.questionId !== questionId,
      );
      await writeDb(db);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && pathname === "/api/exams") {
      sendJson(response, 200, { exams: db.exams });
      return;
    }

    if (request.method === "POST" && pathname === "/api/exams") {
      const body = await parseBody(request);

      if (rejectUnlessAdmin(db, body.userId, response)) {
        return;
      }

      const exam = {
        id: nextId(db.exams),
        title: String(body.title || "").trim(),
        category: String(body.category || "전체"),
        questionIds: Array.isArray(body.questionIds)
          ? body.questionIds.map(Number)
          : db.questions.map((question) => question.id),
        createdAt: new Date().toISOString(),
      };

      if (!exam.title) {
        sendJson(response, 400, { message: "시험 회차명을 입력하세요." });
        return;
      }

      db.exams.push(exam);
      await writeDb(db);
      sendJson(response, 201, { exam });
      return;
    }

    sendJson(response, 404, { message: "API를 찾을 수 없습니다." });
  } catch (error) {
    sendJson(response, 500, { message: error.message });
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`NCS quiz API server running at http://localhost:${PORT}`);
});
