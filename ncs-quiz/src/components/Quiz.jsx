import Question from "./Question.jsx";

function Quiz({
  currentQuestion,
  question,
  questionCount,
  selectedAnswer,
  showExplanation,
  onCheckAnswer,
  onNextQuestion,
  onSelectAnswer,
}) {
  const isLastQuestion = currentQuestion === questionCount - 1;
  const isCorrect = selectedAnswer === question.answer;

  return (
    <>
      <p>
        {currentQuestion + 1} / {questionCount}
      </p>

      <Question
        question={question}
        selectedAnswer={selectedAnswer}
        showExplanation={showExplanation}
        onSelectAnswer={onSelectAnswer}
      />

      {!showExplanation && (
        <button type="button" onClick={onCheckAnswer}>
          정답 확인
        </button>
      )}

      {showExplanation && (
        <div className="explanation">
          <h3>{isCorrect ? "정답입니다." : "오답입니다."}</h3>

          <p>정답: {question.answer + 1}번</p>
          <p>{question.explanation}</p>

          <button type="button" onClick={onNextQuestion}>
            {isLastQuestion ? "결과 보기" : "다음 문제"}
          </button>
        </div>
      )}
    </>
  );
}

export default Quiz;
