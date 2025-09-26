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
  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(false);

  useEffect(() => {
    // 尝试从localStorage加载保存的进度
    const savedProgress = localStorage.getItem("calmscope_progress");
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentQuestion(progress.currentQuestion || 0);
        setAnswers(progress.answers || []);
        setAdditionalText(progress.additionalText || "");
        setSelectedQuestions(progress.selectedQuestions || []);
        setHasSavedProgress(true);
      } catch (error) {
        console.error("Failed to load saved progress:", error);
      }
    }

    // 如果没有保存的进度，初始化新题目
    if (!savedProgress) {
      const allQuestions = Array.from(
        { length: data.questions.length },
        (_, i) => i,
      );
      const shuffled = shuffle(allQuestions);
      setSelectedQuestions(shuffled.slice(0, 20));
    }
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
  ): {
    primaryEmotion: string;
    emotionScores: { [key: string]: number };
    totalQuestions: number;
  } => {
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
    return {
      primaryEmotion: maxEmotion || "平静",
      emotionScores: emotionCounts,
      totalQuestions: answers.length,
    };
  };

  const handleSubmit = () => {
    const emotionAnalysis = detectEmotionFromAnswers(answers, additionalText);

    // 根据情绪选择消息
    const emotionMessages =
      data.messages[
        emotionAnalysis.primaryEmotion as keyof typeof data.messages
      ];
    const randomMessage =
      emotionMessages[Math.floor(Math.random() * emotionMessages.length)];

    setMessage(randomMessage);
    setCurrentView("result");
  };

  const handleAnswerChange = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
    saveProgress(
      newAnswers,
      additionalText,
      currentQuestion,
      selectedQuestions,
    );
  };

  const handleDoubleClick = (optionIndex: number) => {
    handleAnswerChange(optionIndex);
    // 自动跳转到下一题
    if (currentQuestion < selectedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setAdditionalText("");
    setHasSavedProgress(false);
    localStorage.removeItem("calmscope_progress");
    const allQuestions = Array.from(
      { length: data.questions.length },
      (_, i) => i,
    );
    const shuffled = shuffle(allQuestions);
    setSelectedQuestions(shuffled.slice(0, 20));
  };

  const saveProgress = (
    answers: number[],
    additionalText: string,
    currentQuestion: number,
    selectedQuestions: number[],
  ) => {
    const progress = {
      answers,
      additionalText,
      currentQuestion,
      selectedQuestions,
    };
    localStorage.setItem("calmscope_progress", JSON.stringify(progress));
  };

  if (selectedQuestions.length === 0 && !hasSavedProgress) {
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
            {hasSavedProgress && (
              <span className="block text-sm text-gray-400 mt-1">
                (已恢复上次进度)
              </span>
            )}
          </p>
          {hasSavedProgress && (
            <div className="text-center mb-4">
              <button
                onClick={handleReset}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-500 transition-colors text-sm"
              >
                重置进度，重新开始
              </button>
            </div>
          )}
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
                      onDoubleClick={() => handleDoubleClick(index)}
                      className={`w-full border-sky-400 text-white p-3 rounded-md transition-all ${
                        answers[currentQuestion] === index
                          ? "border-4"
                          : "border-0"
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
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-4xl w-full result-content">
          {(() => {
            const analysis = detectEmotionFromAnswers(answers, additionalText);
            const primaryEmotion = analysis.primaryEmotion;
            const emotionScores = analysis.emotionScores;
            const totalQuestions = analysis.totalQuestions;

            // 计算百分比
            const emotionPercentages: { [key: string]: number } = {};
            for (const emotion of data.emotions) {
              emotionPercentages[emotion] = Math.round(
                ((emotionScores[emotion] || 0) / totalQuestions) * 100,
              );
            }

            return (
              <div className="space-y-6">
                {/* 主要情绪 */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {primaryEmotion}
                    </div>
                    <p className="text-gray-300">
                      {data.results[primaryEmotion as never]}
                    </p>
                  </div>
                </div>

                {/* 情绪得分分布 */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    情绪得分分布
                  </h3>
                  <div className="space-y-3">
                    {data.emotions.map((emotion) => {
                      const percentage = emotionPercentages[emotion];
                      const score = emotionScores[emotion] || 0;
                      return (
                        <div
                          key={emotion}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-16 text-sm text-gray-300">
                            {emotion}
                          </div>
                          <div className="flex-1 bg-gray-700 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-12 text-sm text-gray-300 text-right">
                            {percentage}%
                          </div>
                          <div className="w-8 text-xs text-gray-400">
                            ({score})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 详细分析 */}
                {/*<div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    详细分析
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-200 mb-3">
                        情绪强度分析
                      </h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>
                          • 主要情绪得分: {emotionScores[primaryEmotion] || 0} /{" "}
                          {totalQuestions}
                        </li>
                        <li>
                          • 情绪多样性: {Object.keys(emotionScores).length}{" "}
                          种情绪类型
                        </li>
                        <li>
                          • 最高得分占比: {emotionPercentages[primaryEmotion]}%
                        </li>
                        <li>• 问题总数: {totalQuestions} 题</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-200 mb-3">
                        相关关键词
                      </h4>
                      <div className="text-gray-300">
                        {data.emotionKeywords[
                          primaryEmotion as keyof typeof data.emotionKeywords
                        ]
                          ?.slice(0, 10)
                          .join(", ")}
                        ...
                      </div>
                    </div>
                  </div>
                </div>*/}

                {/* 个性化建议 */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    建议
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-blue-300 mb-2">
                        立即行动
                      </h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• 深呼吸5分钟，放松身心</li>
                        <li>• 与朋友分享你的感受</li>
                        <li>• 做一件让你开心的小事</li>
                      </ul>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-green-300 mb-2">
                        长期策略
                      </h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• 建立规律的作息时间</li>
                        <li>• 培养健康的兴趣爱好</li>
                        <li>• 学习压力管理技巧</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 鼓励消息 */}
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 text-center">
                  <p className="text-gray-200 italic text-lg">{message}</p>
                  <p className="text-gray-400 mt-2">
                    记住，每个人都会经历情绪的起伏，这是正常的。你很坚强！
                  </p>
                </div>

                {/* 重新测试 */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setCurrentView("questionnaire");
                      setCurrentQuestion(0);
                      setAnswers([]);
                      setAdditionalText("");
                      setHasSavedProgress(false);
                      localStorage.removeItem("calmscope_progress");
                      const allQuestions = Array.from(
                        { length: data.questions.length },
                        (_, i) => i,
                      );
                      const shuffled = shuffle(allQuestions);
                      setSelectedQuestions(shuffled.slice(0, 20));
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-medium"
                  >
                    重新测试
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default App;
