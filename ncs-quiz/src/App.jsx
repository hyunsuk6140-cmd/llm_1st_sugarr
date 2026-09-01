import { useState } from "react";
import questions from "./data/questions";
import "./App.css";

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = questions[currentQuestion];

  function handleSelectAnswer(index) {
    setSelectedAnswer(index);
  }

  function handleCheckAnswer() {
    if (selectedAnswer === null) {
      alert("답을 선택해주세요.");
      return;
    }

    if (selectedAnswer === question.answer) {
      setScore(score + 1);
    }

    setShowExplanation(true);
  }

  function handleNextQuestion() {
    if (currentQuestion === questions.length - 1) {
      setShowResult(true);
      return;
    }

    setCurrentQuestion(currentQuestion + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }

  function handleRestart() {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setShowExplanation(false);
  }

  if (showResult) {
    return (
      <div className="app">
        <h1>NCS 문제풀이 결과</h1>

        <h2>
          {questions.length}문제 중 {score}문제 정답
        </h2>

        <p>정답률: {Math.round((score / questions.length) * 100)}%</p>

        <button onClick={handleRestart}>다시 풀기</button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>NCS 문제풀이</h1>

      <p>
        {currentQuestion + 1} / {questions.length}
      </p>

      <h2>{question.category}</h2>

      <p className="question">{question.question}</p>

      <div className="choices">
        {question.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(index)}
            className={selectedAnswer === index ? "selected" : ""}
          >
            {index + 1}. {choice}
          </button>
        ))}
      </div>

      {!showExplanation && (
        <button onClick={handleCheckAnswer}>정답 확인</button>
      )}

      {showExplanation && (
        <div className="explanation">
          <h3>
            {selectedAnswer === question.answer
              ? "⭕ 정답입니다."
              : "❌ 오답입니다."}
          </h3>

          <p>정답: {question.answer + 1}번</p>
          <p>{question.explanation}</p>

          <button onClick={handleNextQuestion}>
            {currentQuestion === questions.length - 1
              ? "결과 보기"
              : "다음 문제"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
