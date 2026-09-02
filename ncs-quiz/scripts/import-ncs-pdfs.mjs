import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initialQuestions from "../src/data/questions.js";

const require = createRequire(import.meta.url);
const pdfPoppler = require("pdf-poppler");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "server", "data");
const dbPath = path.join(dataDir, "db.json");
const tempDir = path.join(rootDir, "tmp-ncs-text");
const imageRootDir = path.join(rootDir, "public", "ncs-pages");
const sourceName = "2024 NCS PDF";
const circledAnswers = new Map([
  ["①", 0],
  ["②", 1],
  ["③", 2],
  ["④", 3],
  ["⑤", 4],
]);

const categoryOrder = [
  "의사소통능력",
  "수리능력",
  "문제해결능력",
  "자원관리능력",
  "정보능력",
  "조직이해능력",
];

const categorySlugs = new Map([
  ["의사소통능력", "communication"],
  ["수리능력", "math"],
  ["문제해결능력", "problem-solving"],
  ["자원관리능력", "resource-management"],
  ["정보능력", "information"],
  ["조직이해능력", "organization"],
]);

function getCategoryFromFileName(fileName) {
  return categoryOrder.find((category) => fileName.includes(category));
}

function normalizeInline(value) {
  return value
    .replace(/\f/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\d+\s*(?=\n)/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compact(value) {
  return normalizeInline(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanExtractedText(value) {
  return compact(value).replace(
    /\s+(?:의사소통능력|수리능력|문제해결능력|자원관리능력|정보능력|조직이해능력)$/u,
    "",
  );
}

function findFirstMarker(text) {
  return ["정답 및 해설", "정답/해설", "정답 및"]
    .map((marker) => text.indexOf(marker))
    .filter((index) => index !== -1)
    .sort((left, right) => left - right)[0] ?? -1;
}

function getPdftotextPath() {
  const candidates = [
    process.env.PDFTOTEXT_PATH,
    path.join(pdfPoppler.path, "pdftotext.exe"),
    "pdftotext",
    "C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => {
    if (candidate === "pdftotext") {
      return true;
    }
    return existsSync(candidate);
  });
}

function getPdftocairoPath() {
  const candidate = path.join(pdfPoppler.path, "pdftocairo.exe");

  if (!existsSync(candidate)) {
    throw new Error("pdftocairo.exe를 찾을 수 없습니다.");
  }

  return candidate;
}

async function readDb() {
  if (!existsSync(dbPath)) {
    return {
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
  }

  return JSON.parse(await readFile(dbPath, "utf8"));
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => Number(item.id))) + 1 : 1;
}

function extractAnswerMap(text) {
  const markerIndex = findFirstMarker(text);

  if (markerIndex === -1) {
    return new Map();
  }

  const lines = text.slice(markerIndex).split(/\r?\n/);
  const answerMap = new Map();
  let currentNumber = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match =
      line.match(
        /^(?:[가-힣()]+능력\s*)?(\d{1,3})\s*(?:\(?[상중하]{1,2}\)?\s*)?([①②③④⑤])\s*(.*)$/,
      ) ||
      line.match(
        /^(?:[가-힣()]+능력\s*)?(\d{1,3})\s+\S*?([①②③④⑤])\s*(.*)$/,
      );

    if (match) {
      currentNumber = Number(match[1]);
      answerMap.set(currentNumber, {
        answer: circledAnswers.get(match[2]),
        explanation: match[3] || "",
      });
      continue;
    }

    if (currentNumber && line && answerMap.has(currentNumber)) {
      const item = answerMap.get(currentNumber);
      if (item.explanation.length < 900) {
        item.explanation = `${item.explanation} ${line}`.trim();
      }
    }
  }

  return answerMap;
}

async function renderPdfPages(pdfPath, category, pageCount) {
  const slug = categorySlugs.get(category);
  const outDir = path.join(imageRootDir, slug);
  const outPrefix = path.join(outDir, "page");

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  execFileSync(
    getPdftocairoPath(),
    [
      "-png",
      "-scale-to",
      "1600",
      "-f",
      "1",
      "-l",
      String(pageCount),
      pdfPath,
      outPrefix,
    ],
    { stdio: "inherit" },
  );
}

function getPageNumber(text, offset) {
  return text.slice(0, offset).split("\f").length;
}

function parseQuestions(text, category, fileName) {
  const markerIndex = findFirstMarker(text);
  const questionText = markerIndex === -1 ? text : text.slice(0, markerIndex);
  const answerMap = extractAnswerMap(text);
  const itemRegex = /(?:^|\n)\s*(\d{1,3})(?:~(\d{1,3}))?\.\s+/g;
  const matches = [...questionText.matchAll(itemRegex)];
  const parsed = [];
  const sharedContexts = [];

  for (let index = 0; index < matches.length; index += 1) {
    const number = Number(matches[index][1]);
    const rangeEnd = matches[index][2] ? Number(matches[index][2]) : null;
    const start = matches[index].index + matches[index][0].length;
    const end =
      index + 1 < matches.length ? matches[index + 1].index : questionText.length;
    const block = normalizeInline(questionText.slice(start, end));

    if (rangeEnd) {
      const context = cleanExtractedText(block);
      if (context) {
        sharedContexts.push({ start: number, end: rangeEnd, context });
      }
      continue;
    }

    const optionMatches = [...block.matchAll(/[①②③④⑤]/g)];
    const answerInfo = answerMap.get(number);
    const expectedChoiceCount = answerInfo?.answer >= 4 ? 5 : 4;
    const selectedOptionMatches = optionMatches.slice(-expectedChoiceCount);
    const firstChoice = selectedOptionMatches[0]?.index ?? -1;

    if (firstChoice === -1 || !answerInfo) {
      continue;
    }

    const stem = cleanExtractedText(block.slice(0, firstChoice));
    const sharedContext = sharedContexts
      .slice()
      .reverse()
      .find((context) => context.start <= number && number <= context.end)?.context;
    const fullStem = sharedContext ? `${sharedContext} ${stem}` : stem;
    const choices = selectedOptionMatches
      .map((match, choiceIndex) => {
        const optionStart = match.index + match[0].length;
        const optionEnd =
          choiceIndex + 1 < selectedOptionMatches.length
            ? selectedOptionMatches[choiceIndex + 1].index
            : block.length;
        return cleanExtractedText(block.slice(optionStart, optionEnd));
      })
      .filter(Boolean);

    if (
      fullStem.length < 8 ||
      choices.length < 2 ||
      answerInfo.answer === undefined ||
      answerInfo.answer >= choices.length
    ) {
      continue;
    }

    parsed.push({
      category,
      question: fullStem,
      choices,
      answer: answerInfo.answer,
      explanation:
        cleanExtractedText(answerInfo.explanation).slice(0, 700) ||
        `정답은 ${answerInfo.answer + 1}번입니다.`,
      source: sourceName,
      sourceNo: number,
      pageNumber: getPageNumber(questionText, matches[index].index),
      pageImage: `/ncs-pages/${categorySlugs.get(category)}/page-${getPageNumber(
        questionText,
        matches[index].index,
      )}.png`,
      pdfFile: fileName,
      renderAsImage: true,
    });
  }

  return parsed;
}

function upsertPdfExam(db, category, questionIds) {
  const title = `2024 NCS ${category}`;
  const existing = db.exams.find((exam) => exam.title === title);

  if (existing) {
    existing.category = category;
    existing.questionIds = questionIds;
    return;
  }

  db.exams.push({
    id: nextId(db.exams),
    title,
    category,
    questionIds,
    createdAt: new Date().toISOString(),
  });
}

async function main() {
  const pdfDir = process.argv[2];

  if (!pdfDir) {
    throw new Error("PDF 폴더 경로를 인자로 입력하세요.");
  }

  const pdftotextPath = getPdftotextPath();
  const files = (await readdir(pdfDir))
    .filter((fileName) => fileName.toLowerCase().endsWith(".pdf"))
    .map((fileName) => ({
      fileName,
      category: getCategoryFromFileName(fileName),
      slug: categorySlugs.get(getCategoryFromFileName(fileName)),
      pdfPath: path.join(pdfDir, fileName),
      textPath: path.join(tempDir, `${fileName}.txt`),
    }))
    .filter((file) => file.category);

  await mkdir(tempDir, { recursive: true });
  const imported = [];

  for (const file of files) {
    execFileSync(pdftotextPath, ["-layout", "-enc", "UTF-8", file.pdfPath, file.textPath], {
      stdio: "inherit",
    });

    const text = await readFile(file.textPath, "utf8");
    const markerIndex = findFirstMarker(text);
    const pageCount = (markerIndex === -1 ? text : text.slice(0, markerIndex)).split(
      "\f",
    ).length;
    await renderPdfPages(file.pdfPath, file.category, pageCount);

    const questions = parseQuestions(text, file.category, file.fileName);
    imported.push(...questions);
    console.log(`${file.category}: ${questions.length}문항 추출, ${pageCount}페이지 이미지 생성`);
  }

  const db = await readDb();
  db.questions = db.questions.filter((question) => question.source !== sourceName);

  let id = nextId(db.questions);
  const importedWithIds = imported.map((question) => ({
    id: id++,
    ...question,
  }));

  db.questions.push(...importedWithIds);

  const importedByCategory = new Map();
  for (const question of importedWithIds) {
    const ids = importedByCategory.get(question.category) || [];
    ids.push(question.id);
    importedByCategory.set(question.category, ids);
  }

  for (const [category, questionIds] of importedByCategory) {
    upsertPdfExam(db, category, questionIds);
  }

  const defaultExam = db.exams.find((exam) => exam.id === 1);
  if (defaultExam) {
    defaultExam.questionIds = db.questions.map((question) => question.id);
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");

  console.log(`총 ${importedWithIds.length}문항을 ${dbPath}에 등록했습니다.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
