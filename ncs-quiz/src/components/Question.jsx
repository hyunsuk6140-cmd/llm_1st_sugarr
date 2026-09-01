function Question({ index, question, selectedAnswer, onAnswer }) {
  return (
    <article className="question-card">
      <div className="question-meta">
        <span>{question.category}</span>
        <strong>{index + 1}번</strong>
      </div>

      <h3>{question.question}</h3>

      <div className="choice-list">
        {question.choices.map((choice, choiceIndex) => (
          <button
            key={choice}
            type="button"
            className={selectedAnswer === choiceIndex ? "selected" : ""}
            onClick={() => onAnswer(question.id, choiceIndex)}
          >
            <span>{choiceIndex + 1}</span>
            {choice}
          </button>
        ))}
      </div>
    </article>
  );
}

export default Question;
