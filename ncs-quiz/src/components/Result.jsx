function Result({ attempt, questionCount, questions, score, onRestart }) {
  const scoreRate = Math.round((score / questionCount) * 100);
  const detailMap = new Map(
    attempt?.details?.map((detail) => [detail.questionId, detail]) || [],
  );

  return (
    <>
      <section className="result-card">
        <p>최종 결과</p>
        <h2>{scoreRate}점</h2>
        <strong>
          {questionCount}문제 중 {score}문제 정답
        </strong>
        <button type="button" onClick={onRestart}>
          다시 풀기
        </button>
      </section>

      {attempt && (
        <div className="review-list">
          {questions.map((question, index) => {
            const detail = detailMap.get(question.id);
            const selectedAnswer = detail?.selectedAnswer;

            return (
              <article
                key={question.id}
                className={`review-item ${detail?.isCorrect ? "correct" : "wrong"}`}
              >
                <span>
                  {index + 1}번 · {question.category}
                </span>
                <h3>{question.question}</h3>
                <p>내 답: {question.choices[selectedAnswer]}</p>
                <p>정답: {question.answer + 1}번. {question.choices[question.answer]}</p>
                <p>{question.explanation}</p>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Result;
