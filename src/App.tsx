import { useEffect, useState } from "react";
import data from "./data.json";

function App() {
  const [currentView, setCurrentView] = useState<"questionnaire" | "result">(
    "questionnaire",
  );
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [additionalText, setAdditionalText] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  useEffect(() => {
    const allQuestions = Array.from(
      { length: data.questions.length },
      (_, i) => i,
    );
    const shuffled = shuffle(allQuestions);
    setSelectedQuestions(shuffled.slice(0, 20));
  }, []);

  const shuffle = (array: number[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const detectEmotionFromAnswers = (
    answers: number[],
    text: string,
  ): string => {
    const emotionCounts: { [key: string]: number } = {};
    // 从问卷答案
    answers.forEach((answerIndex, qIndex) => {
      const questionIndex = selectedQuestions[qIndex];
      const emotion =
        data.questions[questionIndex].options[answerIndex].emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    // 从补充文本关键词检测
    const lowerText = text.toLowerCase();
    for (const [emotion, keywords] of Object.entries(data.emotionKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        }
      }
    }
    let maxEmotion = "";
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxEmotion = emotion;
      }
    }
    return maxEmotion || "平静"; // 默认
  };

  const handleSubmit = () => {
    const emotion = detectEmotionFromAnswers(answers, additionalText);

    // 根据情绪选择消息
    const emotionMessages =
      data.messages[emotion as keyof typeof data.messages];
    const randomMessage =
      emotionMessages[Math.floor(Math.random() * emotionMessages.length)];

    setMessage(randomMessage);
    setCurrentView("result");
  };

  const handleAnswerChange = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  if (selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
          <p className="text-gray-200">正在加载题目...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 flex items-center justify-center p-4">
      {currentView === "questionnaire" ? (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-white">
            情绪港湾
          </h1>
          <p className="text-center mb-6 text-gray-300">
            问题 {currentQuestion + 1} / {selectedQuestions.length}
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-gray-200 mb-4">
                {data.questions[selectedQuestions[currentQuestion]].text}
              </p>
              <div className="space-y-2">
                {data.questions[selectedQuestions[currentQuestion]].options.map(
                  (option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerChange(index)}
                      className={`w-full p-3 border rounded-md transition-colors ${
                        answers[currentQuestion] === index
                          ? "bg-gray-700 text-white border-gray-700"
                          : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {option.text}
                    </button>
                  ),
                )}
              </div>
              {currentQuestion === selectedQuestions.length - 1 && (
                <div className="mt-4">
                  <label className="block text-gray-200 mb-2">
                    补充描述（可选）
                  </label>
                  <textarea
                    value={additionalText}
                    onChange={(e) => setAdditionalText(e.target.value)}
                    placeholder="如果你想补充一些感受或描述，请在这里输入..."
                    className="w-full p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none bg-gray-800 text-white"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-6">
            {currentQuestion > 0 && (
              <button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-500 transition-colors"
              >
                上一题
              </button>
            )}
            {currentQuestion < selectedQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={answers[currentQuestion] === undefined}
                className="bg-gray-700 text-white py-3 px-6 rounded-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                下一题
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answers[currentQuestion] === undefined}
                className="bg-gray-700 text-white py-3 px-6 rounded-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                提交
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-lg w-full result-content">
          <h2 className="text-xl font-bold mb-4 text-center text-white">
            你的情绪分析结果
          </h2>
          <div className="text-gray-200 mb-4 leading-relaxed">
            {(() => {
              const emotion = detectEmotionFromAnswers(answers, additionalText);
              return data.results[emotion as never];
            })()}
          </div>
          <p className="text-gray-400 italic text-center">{message}</p>
          <button
            onClick={() => {
              setCurrentView("questionnaire");
              setCurrentQuestion(0);
              setAnswers([]);
              setAdditionalText("");
              const allQuestions = Array.from(
                { length: data.questions.length },
                (_, i) => i,
              );
              const shuffled = shuffle(allQuestions);
              setSelectedQuestions(shuffled.slice(0, 20));
            }}
            className="mt-6 bg-gray-700 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors block mx-auto"
          >
            返回
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
