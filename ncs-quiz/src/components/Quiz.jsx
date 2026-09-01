import Question from "./Question.jsx";

function Quiz({ answers, answeredCount, isLoading, questions, onAnswer, onSubmit }) {
  const isComplete = questions.length > 0 && answeredCount === questions.length;

  return (
    <section className="quiz-panel" aria-label="문제 풀이">
      <div className="section-heading">
        <h2>문제</h2>
        <p>
          {questions.length}문항 중 {answeredCount}문항을 풀었습니다.
        </p>
      </div>

      <div className="progress-track" aria-hidden="true">
        <span
          style={{
            width: questions.length
              ? `${(answeredCount / questions.length) * 100}%`
              : "0%",
          }}
        />
      </div>

      {isLoading ? (
        <p className="empty-box">문제를 불러오는 중입니다.</p>
      ) : (
        <div className="question-list">
          {questions.map((question, index) => (
            <Question
              key={question.id}
              index={index}
              question={question}
              selectedAnswer={answers[question.id]}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      )}

      <div className="submit-bar">
        <span>
          {isComplete
            ? "모든 문항을 풀었습니다."
            : "아직 선택하지 않은 문항이 있습니다."}
        </span>
        <button type="button" disabled={!isComplete} onClick={onSubmit}>
          채점하고 저장
        </button>
      </div>
    </section>
  );
}

export default Quiz;
