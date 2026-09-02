import { useMemo, useState } from "react";
import {
  createExam,
  createQuestion,
  deleteQuestion,
  deleteWrongNote,
  getAttempts,
  getCategories,
  getExams,
  getQuestions,
  getStats,
  getWrongNotes,
  login,
  submitAttempt,
  updateQuestion,
} from "./api";
import CategorySelect from "./components/CategorySelect";
import Quiz from "./components/Quiz";
import Result from "./components/Result";
import "./App.css";

const initialQuestionForm = {
  id: null,
  category: "의사소통능력",
  question: "",
  choicesText: "",
  answer: "1",
  explanation: "",
};

function App() {
  const [page, setPage] = useState("login");
  const [loginName, setLoginName] = useState("");
  const [loginRole, setLoginRole] = useState("student");
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState(["전체"]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [quizMode, setQuizMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [wrongNotes, setWrongNotes] = useState([]);
  const [exams, setExams] = useState([]);
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [examTitle, setExamTitle] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const question = questions[currentQuestion];
  const canUseAdmin = user?.role === "admin";
  const filteredAdminCategories = useMemo(
    () => categories.filter((category) => category !== "전체"),
    [categories],
  );

  async function loadPublicData(category = "전체") {
    setIsLoading(true);
    setError("");

    try {
      const [categoryData, questionData, examData] = await Promise.all([
        getCategories(),
        getQuestions(category),
        getExams(),
      ]);

      setCategories(categoryData.categories);
      setQuestions(questionData.questions);
      setExams(examData.exams);
    } catch {
      setError("백엔드 서버를 먼저 실행해주세요. npm.cmd run server");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserData(userId) {
    try {
      const [statsData, attemptsData, wrongNotesData] = await Promise.all([
        getStats(userId),
        getAttempts(userId),
        getWrongNotes(userId),
      ]);

      setStats(statsData.stats);
      setAttempts(attemptsData.attempts);
      setWrongNotes(wrongNotesData.notes);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (!loginName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    try {
      const data = await login({ name: loginName, role: loginRole });
      setUser(data.user);
      await loadPublicData("전체");
      await loadUserData(data.user.id);
      setPage("home");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function resetQuizState() {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowExplanation(false);
    setAttempt(null);
  }

  async function startCategoryMode() {
    setQuizMode("category");
    setSelectedCategory("");
    setQuestions([]);
    resetQuizState();
    setPage("category");
  }

  async function startMockMode() {
    setQuizMode("mock");
    setSelectedCategory("전체");
    resetQuizState();
    await loadPublicData("전체");
    setPage("quiz");
  }

  async function handleCategoryChange(category) {
    setSelectedCategory(category);
    resetQuizState();
    await loadPublicData(category);
    setPage("quiz");
  }

  function handleSelectAnswer(index) {
    setSelectedAnswer(index);
  }

  function handleCheckAnswer() {
    if (selectedAnswer === null) {
      setError("답을 선택해주세요.");
      return;
    }

    setError("");
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: selectedAnswer,
    }));

    setShowExplanation(true);
  }

  async function handleNextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((index) => index + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      return;
    }

    await finishQuiz();
  }

  async function finishQuiz() {
    try {
      const finalAnswers = {
        ...answers,
        [question.id]: selectedAnswer,
      };
      const data = await submitAttempt({
        userId: user.id,
        category: selectedCategory || "전체",
        answers: finalAnswers,
      });

      setAttempt(data.attempt);
      await loadUserData(user.id);
      setPage("result");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleRestart() {
    resetQuizState();
    await loadPublicData(selectedCategory || "전체");
    setPage(quizMode === "category" ? "category" : "mode");
  }

  async function openStatsPage() {
    await loadUserData(user.id);
    setPage("stats");
  }

  async function openWrongNotesPage() {
    await loadUserData(user.id);
    setPage("wrongNotes");
  }

  async function openAdminPage() {
    await loadPublicData(selectedCategory || "전체");
    setPage("admin");
  }

  async function handleSaveQuestion(event) {
    event.preventDefault();
    setError("");

    const payload = {
      userId: user.id,
      category: questionForm.category,
      question: questionForm.question,
      choices: questionForm.choicesText
        .split("\n")
        .map((choice) => choice.trim())
        .filter(Boolean),
      answer: Number(questionForm.answer) - 1,
      explanation: questionForm.explanation,
    };

    try {
      if (questionForm.id) {
        await updateQuestion(questionForm.id, payload);
      } else {
        await createQuestion(payload);
      }

      setQuestionForm(initialQuestionForm);
      await loadPublicData(selectedCategory || "전체");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleEditQuestion(editQuestion) {
    setQuestionForm({
      id: editQuestion.id,
      category: editQuestion.category,
      question: editQuestion.question,
      choicesText: editQuestion.choices.join("\n"),
      answer: String(editQuestion.answer + 1),
      explanation: editQuestion.explanation,
    });
  }

  async function handleDeleteQuestion(questionId) {
    try {
      await deleteQuestion(questionId, user.id);
      await loadPublicData(selectedCategory || "전체");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateExam(event) {
    event.preventDefault();
    setError("");

    try {
      await createExam({
        userId: user.id,
        title: examTitle,
        category: selectedCategory || "전체",
        questionIds: questions.map((item) => item.id),
      });
      setExamTitle("");
      await loadPublicData(selectedCategory || "전체");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeleteWrongNote(questionId) {
    try {
      await deleteWrongNote(user.id, questionId);
      await loadUserData(user.id);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="app">
      {error && <p className="error-message">{error}</p>}

      {page === "login" && (
        <LoginPage
          loginName={loginName}
          loginRole={loginRole}
          onLogin={handleLogin}
          onNameChange={setLoginName}
          onRoleChange={setLoginRole}
        />
      )}

      {page === "home" && (
        <HomePage
          canUseAdmin={canUseAdmin}
          user={user}
          onAdmin={openAdminPage}
          onLogout={() => setPage("login")}
          onMode={() => setPage("mode")}
          onStats={openStatsPage}
          onWrongNotes={openWrongNotesPage}
        />
      )}

      {page === "mode" && (
        <ModePage
          onBack={() => setPage("home")}
          onCategoryMode={startCategoryMode}
          onMockMode={startMockMode}
        />
      )}

      {page === "category" && (
        <PageFrame title="유형별 문제풀이" onBack={() => setPage("mode")}>
          <CategorySelect
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </PageFrame>
      )}

      {page === "quiz" && (
        <PageFrame
          title={quizMode === "mock" ? "실전 모의고사" : selectedCategory}
          onBack={() => setPage(quizMode === "mock" ? "mode" : "category")}
        >
          {isLoading && <p className="empty-message">문제를 불러오는 중입니다.</p>}
          {!isLoading && question && (
            <Quiz
              currentQuestion={currentQuestion}
              question={question}
              questionCount={questions.length}
              selectedAnswer={selectedAnswer}
              showExplanation={showExplanation}
              onCheckAnswer={handleCheckAnswer}
              onNextQuestion={handleNextQuestion}
              onSelectAnswer={handleSelectAnswer}
            />
          )}
        </PageFrame>
      )}

      {page === "result" && attempt && (
        <PageFrame title="결과" onBack={() => setPage("home")}>
          <Result
            attempt={attempt}
            questions={questions}
            questionCount={attempt.totalCount}
            score={attempt.correctCount}
            onRestart={handleRestart}
          />
        </PageFrame>
      )}

      {page === "stats" && (
        <PageFrame title="학습 통계" onBack={() => setPage("home")}>
          <StatsPage attempts={attempts} stats={stats} />
        </PageFrame>
      )}

      {page === "wrongNotes" && (
        <PageFrame title="오답노트" onBack={() => setPage("home")}>
          <WrongNotesPage notes={wrongNotes} onDelete={handleDeleteWrongNote} />
        </PageFrame>
      )}

      {page === "admin" && canUseAdmin && (
        <PageFrame title="관리자" onBack={() => setPage("home")}>
          <AdminPage
            categories={filteredAdminCategories}
            examTitle={examTitle}
            exams={exams}
            questionForm={questionForm}
            questions={questions}
            onCreateExam={handleCreateExam}
            onDeleteQuestion={handleDeleteQuestion}
            onEditQuestion={handleEditQuestion}
            onExamTitleChange={setExamTitle}
            onFormChange={setQuestionForm}
            onSaveQuestion={handleSaveQuestion}
          />
        </PageFrame>
      )}
    </main>
  );
}

function PageFrame({ title, children, onBack }) {
  return (
    <>
      <header className="page-header">
        <button type="button" className="ghost-button" onClick={onBack}>
          이전
        </button>
        <h1>{title}</h1>
      </header>
      {children}
    </>
  );
}

function LoginPage({
  loginName,
  loginRole,
  onLogin,
  onNameChange,
  onRoleChange,
}) {
  return (
    <section className="login-page">
      <p className="eyebrow">NCS 학습 관리</p>
      <h1>NCS 실전 문제풀이</h1>
      <p className="lead">로그인하면 풀이 기록, 통계, 오답노트가 저장됩니다.</p>

      <form className="login-form" onSubmit={onLogin}>
        <label>
          이름
          <input
            value={loginName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="이름을 입력하세요"
          />
        </label>
        <label>
          역할
          <select
            value={loginRole}
            onChange={(event) => onRoleChange(event.target.value)}
          >
            <option value="student">학습자</option>
            <option value="admin">관리자</option>
          </select>
        </label>
        <button type="submit">로그인</button>
      </form>
    </section>
  );
}

function HomePage({
  canUseAdmin,
  user,
  onAdmin,
  onLogout,
  onMode,
  onStats,
  onWrongNotes,
}) {
  return (
    <section>
      <header className="home-header">
        <div>
          <p className="eyebrow">NCS 실전 문제풀이</p>
          <h1>{user.name}님</h1>
        </div>
        <button type="button" className="ghost-button" onClick={onLogout}>
          로그아웃
        </button>
      </header>

      <div className="menu-grid">
        <button type="button" onClick={onMode}>
          <strong>문제풀기</strong>
          <span>유형별 또는 실전 모의고사로 학습합니다.</span>
        </button>
        <button type="button" onClick={onStats}>
          <strong>학습 통계</strong>
          <span>풀이 횟수, 평균 점수, 정답률을 확인합니다.</span>
        </button>
        <button type="button" onClick={onWrongNotes}>
          <strong>오답노트</strong>
          <span>틀린 문제를 다시 확인합니다.</span>
        </button>
        {canUseAdmin && (
          <button type="button" onClick={onAdmin}>
            <strong>관리자</strong>
            <span>문제와 실전 모의고사 회차를 관리합니다.</span>
          </button>
        )}
      </div>
    </section>
  );
}

function ModePage({ onBack, onCategoryMode, onMockMode }) {
  return (
    <PageFrame title="문제풀이 선택" onBack={onBack}>
      <div className="menu-grid">
        <button type="button" onClick={onCategoryMode}>
          <strong>유형별</strong>
          <span>원하는 영역을 선택한 뒤 문제를 풉니다.</span>
        </button>
        <button type="button" onClick={onMockMode}>
          <strong>실전 모의고사</strong>
          <span>전체 영역 문제를 한 번에 풀고 결과를 저장합니다.</span>
        </button>
      </div>
    </PageFrame>
  );
}

function StatsPage({ attempts, stats }) {
  return (
    <>
      <div className="metric-grid">
        <Metric label="풀이 횟수" value={`${stats?.attemptCount || 0}회`} />
        <Metric label="평균 점수" value={`${stats?.averageScore || 0}점`} />
        <Metric label="정답률" value={`${stats?.accuracy || 0}%`} />
      </div>
      <div className="list-panel">
        {attempts.length === 0 && (
          <p className="empty-message">아직 저장된 풀이 기록이 없습니다.</p>
        )}
        {attempts.map((item) => (
          <article key={item.id} className="history-row">
            <div>
              <strong>{item.category}</strong>
              <span>{new Date(item.createdAt).toLocaleString("ko-KR")}</span>
            </div>
            <b>{item.score}점</b>
          </article>
        ))}
      </div>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WrongNotesPage({ notes, onDelete }) {
  return (
    <div className="list-panel">
      {notes.length === 0 && (
        <p className="empty-message">오답노트에 저장된 문제가 없습니다.</p>
      )}
      {notes.map((note) => (
        <article key={note.id} className="wrong-note">
          <span>{note.question.category}</span>
          <h2>{note.question.question}</h2>
          <p>{note.question.explanation}</p>
          <button type="button" onClick={() => onDelete(note.questionId)}>
            오답노트에서 제거
          </button>
        </article>
      ))}
    </div>
  );
}

function AdminPage({
  categories,
  examTitle,
  exams,
  questionForm,
  questions,
  onCreateExam,
  onDeleteQuestion,
  onEditQuestion,
  onExamTitleChange,
  onFormChange,
  onSaveQuestion,
}) {
  return (
    <div className="admin-layout">
      <section className="panel">
        <h2>{questionForm.id ? "문제 수정" : "문제 등록"}</h2>
        <form className="admin-form" onSubmit={onSaveQuestion}>
          <label>
            영역
            <select
              value={questionForm.category}
              onChange={(event) =>
                onFormChange({ ...questionForm, category: event.target.value })
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            문제
            <textarea
              value={questionForm.question}
              onChange={(event) =>
                onFormChange({ ...questionForm, question: event.target.value })
              }
            />
          </label>
          <label>
            선택지
            <textarea
              value={questionForm.choicesText}
              placeholder="한 줄에 하나씩 입력"
              onChange={(event) =>
                onFormChange({ ...questionForm, choicesText: event.target.value })
              }
            />
          </label>
          <label>
            정답 번호
            <input
              type="number"
              min="1"
              value={questionForm.answer}
              onChange={(event) =>
                onFormChange({ ...questionForm, answer: event.target.value })
              }
            />
          </label>
          <label>
            해설
            <textarea
              value={questionForm.explanation}
              onChange={(event) =>
                onFormChange({ ...questionForm, explanation: event.target.value })
              }
            />
          </label>
          <button type="submit">{questionForm.id ? "수정 저장" : "문제 저장"}</button>
        </form>
      </section>

      <section className="panel">
        <h2>실전 모의고사 회차</h2>
        <form className="exam-form" onSubmit={onCreateExam}>
          <input
            value={examTitle}
            placeholder="예: 1회 실전 모의고사"
            onChange={(event) => onExamTitleChange(event.target.value)}
          />
          <button type="submit">회차 만들기</button>
        </form>
        <div className="compact-list">
          {exams.map((exam) => (
            <p key={exam.id}>
              <strong>{exam.title}</strong> · {exam.questionIds.length}문항
            </p>
          ))}
        </div>
      </section>

      <section className="panel admin-full">
        <h2>문제 관리</h2>
        <div className="compact-list">
          {questions.map((item) => (
            <article key={item.id} className="admin-question-row">
              <div>
                <span>{item.category}</span>
                <strong>{item.question}</strong>
              </div>
              <div>
                <button type="button" onClick={() => onEditQuestion(item)}>
                  수정
                </button>
                <button type="button" onClick={() => onDeleteQuestion(item.id)}>
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
