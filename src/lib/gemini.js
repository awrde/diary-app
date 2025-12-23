import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI를 사용하여 일기 내용을 분석합니다.
 * @param {string} content 일기 내용
 * @param {string} apiKey Gemini API 키
 * @param {string} personality AI 성격 (warm_companion, growth_coach, neutral_observer)
 * @param {string} modelName 사용할 모델 이름 (기본값: gemini-2.0-flash)
 */
export async function analyzeDiaryWithGemini(content, apiKey, personality = 'warm_companion', modelName = 'gemini-2.0-flash', extraData = {}) {
  if (!apiKey) throw new Error("API key is required");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const personalityPrompts = {
    warm_companion: "당신은 따뜻하고 공감 능력이 뛰어난 친구 같은 '따뜻한 공감형' AI입니다. 사용자의 감정을 깊이 이해하고 위로와 격려를 건네주세요.",
    growth_coach: "당신은 사용자의 발전을 돕는 '발전 코치형' AI입니다. 오늘 하루를 통해 배울 점을 찾고, 더 나은 내일을 위한 동기부여와 구체적인 조언을 제공하세요.",
    neutral_observer: "당신은 차분하고 객관적인 '객관적 관찰자형' AI입니다. 감정을 배제하고 사실과 데이터를 바탕으로 하루를 분석하여 논리적인 인사이트를 제공하세요."
  };

  const prompt = `
일기 분석 전문가로서 다음 일기를 분석하고 지정된 JSON 형식으로만 응답하세요.

[사용자 일기 시작]
${content}
[사용자 일기 끝]

[부가 데이터]
${extraData.weather ? `- 날씨: ${extraData.weather}` : ''}
${extraData.sleepHours ? `- 수면 시간: ${extraData.sleepHours}시간` : ''}

[분석 지침]
1. AI 성격: ${personalityPrompts[personality] || personalityPrompts.warm_companion}
2. 사용자 일기뿐만 아니라 제공된 '부가 데이터'(날씨, 수면 시간)가 사용자의 컨디션, 활동, 감정에 미친 영향을 추론하여 분석에 반영하고 피드백에 자연스럽게 언급하세요.
3. 응답은 반드시 JSON 형식이어야 하며, 다른 텍스트를 포함하지 마세요.
3. JSON 구조:
{
  "summary": "일기 내용을 한 문장으로 요약 (존댓말)",
  "emotionalScore": {
    "positive": 0-100 사이의 긍정 점수 (숫자),
    "negative": 0-100 사이의 부정 점수 (숫자),
    "neutral": 0-100 사이의 중립 점수 (숫자)
  },
  "metricScores": {
    "health": 1-5 점 (숫자),
    "money": 1-5 점 (숫자),
    "relationship": 1-5 점 (숫자),
    "growth": 1-5 점 (숫자),
    "rest": 1-5 점 (숫자),
    "hobby": 1-5 점 (숫자),
    "work": 1-5 점 (숫자)
  },
  "feedback": "AI 성격에 맞는 따뜻하고 상세한 피드백 (존댓말, 2-3문장)"
}

[주의사항]
- 모든 점수는 숫자로 제공하세요.
- 피드백은 반드시 설정된 AI 성격을 반영해야 합니다.
- 한국어로 작성하세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 추출 (마크다운 코드 블록 제거 등)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI Response Text:", text);
      throw new Error("AI로부터 올바른 응답 형식을 받지 못했습니다.");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // 디버그 정보를 함께 반환
    return {
      ...analysis,
      _debug: {
        prompt,
        rawResponse: text
      }
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);

    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도하거나, Google AI Studio에서 할당량을 확인해주세요. (현재 모델의 무료 티어 제한일 수 있습니다.)");
    }

    throw error;
  }
}

/**
 * Gemini API 연결을 테스트합니다.
 */
export async function testGeminiConnection(apiKey, modelName = 'gemini-2.0-flash') {
  if (!apiKey) throw new Error("API key is required");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = "안녕! 연결 확인용 메시지야. '연결 성공'이라고 한 문장으로 대답해줘.";

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      prompt,
      response: text
    };
  } catch (error) {
    console.error("Gemini Test Error:", error);

    const errorMsg = error.message || "";

    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      throw new Error("API 할당량 초과(429): 현재 모델에 대한 사용량이 한계에 도달했습니다. 다른 모델을 선택하거나 나중에 다시 시도하세요.");
    }

    if (errorMsg.includes("404") || errorMsg.includes("not found")) {
      throw new Error("모델을 찾을 수 없음(404): 선택하신 모델이 아직 출시되지 않았거나 현재 계정에서 접근할 수 없습니다. 다른 모델(예: 2.0 Flash)을 선택해주세요.");
    }

    throw error;
  }
}
