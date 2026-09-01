function Result({ attempt, questions, onRetry }) {
  const detailsByQuestionId = new Map(
    attempt.details.map((detail) => [detail.questionId, detail]),
  );

  return (
    <section className="result-panel" aria-label="채점 결과">
      <div className="result-summary">
        <div>
          <p className="eyebrow">채점 결과</p>
          <h2>{attempt.score}점</h2>
        </div>
        <p>
          {attempt.totalCount}문항 중 <strong>{attempt.correctCount}</strong>문항을
          맞혔습니다.
        </p>
        <button type="button" onClick={onRetry}>
          다시 풀기
        </button>
      </div>

      <div className="review-list">
        {questions.map((question, index) => {
          const detail = detailsByQuestionId.get(question.id);
          const selectedAnswer = detail?.selectedAnswer;
          const isCorrect = detail?.isCorrect;

          return (
            <article
              key={question.id}
              className={`review-card ${isCorrect ? "correct" : "wrong"}`}
            >
              <div className="question-meta">
                <span>{question.category}</span>
                <strong>{index + 1}번</strong>
              </div>
              <h3>{question.question}</h3>
              <dl>
                <div>
                  <dt>내 답</dt>
                  <dd>{question.choices[selectedAnswer]}</dd>
                </div>
                <div>
                  <dt>정답</dt>
                  <dd>{question.choices[question.answer]}</dd>
                </div>
              </dl>
              <p className="explanation">{question.explanation}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Result;
