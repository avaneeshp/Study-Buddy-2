import React, { useState } from "react";
import "./feature.css";

function Figure() {
  const [files, setFiles] = useState([]);
  const [topicName, setTopicName] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [numQuestions, setNumQuestions] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false); // To show quiz creation
  const [quizPopulated, setQuizPopulated] = useState(false); // To show quiz output
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState([]);

  const handleFileSelect = (event) => {
    setFiles([...event.target.files]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));
    formData.append("topic", topicName);

    setIsLoading(true);
    setQuizStarted(false); // Reset quiz visibility during loading
    setQuizPopulated(false);

    try {
      const response = await fetch("/process_summary", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.Summaries) {
        const combinedSummaries = data.Summaries.map(
          (summary, index) => `File ${index + 1}: ${summary}`,
        ).join("\n\n");
        setResponseMessage(combinedSummaries);
        setQuizStarted(true); // Allow quiz creation after summary is generated
      } else {
        setResponseMessage("No summaries generated. Please check your input.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setResponseMessage("An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizStart = async () => {
    if (!numQuestions || numQuestions <= 0) {
      alert("Please enter a valid number of quiz questions.");
      return;
    }

    try {
      const response = await fetch("/generate_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numQuestions }),
      });
      const data = await response.json();

      console.log("Raw quiz response:", data); // Debugging

      if (data.Quiz && typeof data.Quiz === "string") {
        // Clean the response
        const cleanedResponse = data.Quiz.replace(/```json|```/g, "").trim();

        // Parse the JSON
        const parsedQuiz = JSON.parse(cleanedResponse);

        console.log("Parsed quiz response:", parsedQuiz); // Debugging

        setQuizQuestions(parsedQuiz);
        setQuizPopulated(true); // Show the quiz output section
      } else {
        alert("Failed to generate quiz questions.");
        setQuizQuestions([]);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuizQuestions([]);
      alert("An error occurred while generating the quiz.");
    }
  };

  return (
    <div className="figure-component">
      <div className="content-box">
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Send us your study material,{" "}
          <span className="suga">we'll help from here...</span>
        </h1>
        <div className="api-output">
          {isLoading ? (
            <p style={{ textAlign: "center", fontStyle: "italic" }}>
              Generating summaries, please wait...
            </p>
          ) : (
            responseMessage || "AI-generated summaries will appear here..."
          )}
        </div>

        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <label className="file-input-container">
              Choose Files
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
              />
            </label>
            <div className="file-display-bubble">
              {files.length === 0
                ? "No files selected"
                : `${files.length} files selected`}
            </div>

            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Topic Name"
            />
            <button
              className="file-input-container"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </form>
        </div>

        {/* Quiz Creation */}
        {quizStarted && (
          <div className="quiz-section-visible">
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Ready to <span className="suga2">practice</span>? Let's create a
              quiz!
            </h2>

            <div className="input-section">
              <label htmlFor="numQuestions">How many questions?</label>
              <input
                type="number"
                id="numQuestions"
                value={numQuestions}
                onChange={(e) =>
                  setNumQuestions(parseInt(e.target.value, 10) || 0)
                }
                placeholder="Enter number of questions"
              />
              <button
                className="file-input-container"
                onClick={handleQuizStart}
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {/* Quiz Questions Output */}
        {quizPopulated && (
          <div className="quiz-output-box">
            {quizQuestions.length > 0 ? (
              quizQuestions.map((questionData, index) => (
                <div key={index} className="quiz-question">
                  <div className="question">
                    <strong>
                      {index + 1}. {questionData.Question}
                    </strong>
                  </div>
                  <div className="answers">
                    {questionData.answers.map((answer, idx) => {
                      const cleanAnswer = answer.replace(/^[A-D][.)]\s*/, "");

                      return (
                        <div key={idx} className="answer">
                          {String.fromCharCode(65 + idx)}. {cleanAnswer}
                        </div>
                      );
                    })}
                  </div>
                  <div className="correct-answer">
                    {showAnswers[index] ? (
                      <em>Correct Answer: {questionData.correctAnswer}</em>
                    ) : (
                      <button
                        className="show-answer-button"
                        onClick={() => {
                          const updatedShowAnswers = [...showAnswers];
                          updatedShowAnswers[index] = true;
                          setShowAnswers(updatedShowAnswers);
                        }}
                      >
                        Show Correct Answer
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No quiz questions generated yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Figure;