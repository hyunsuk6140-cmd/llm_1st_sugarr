function Question({ question, selectedAnswer, showExplanation, onSelectAnswer }) {
  const imageSrc = question.pageImage || question.image;
  const showImageQuestion = question.renderAsImage && imageSrc;

  return (
    <>
      <h2>{question.category}</h2>

      {showImageQuestion ? (
        <div className="question-image-panel">
          <div className="question-image-header">
            <strong>{question.sourceNo ? `${question.sourceNo}번` : "문제"}</strong>
            {question.pageNumber && <span>PDF {question.pageNumber}쪽</span>}
          </div>
          <img src={imageSrc} alt={`${question.category} ${question.sourceNo || ""}번 문제`} />
        </div>
      ) : (
        <p className="question">{question.question}</p>
      )}

      <div className="choices">
        {question.choices.map((choice, index) => (
          <button
            key={`${index}-${choice}`}
            type="button"
            className={selectedAnswer === index ? "selected" : ""}
            disabled={showExplanation}
            onClick={() => onSelectAnswer(index)}
          >
            {showImageQuestion ? `${index + 1}번` : `${index + 1}. ${choice}`}
          </button>
        ))}
      </div>
    </>
  );
}

export default Question;
