// Mock data for the AI Diary application
// 2025년 4월 ~ 11월 데이터 (3일 주기)

const diaryTemplates = [
    { content: '오늘 아침에 일찍 일어나서 조깅을 했다. 공기가 상쾌해서 기분이 좋았다. 오후에는 카페에서 독서를 했다.', summary: '건강한 아침 루틴과 여유로운 오후를 보낸 하루.', emotion: { positive: 80, negative: 5, neutral: 15 }, scores: { health: 5, money: 3, relationship: 3, growth: 4, rest: 4, hobby: 4, work: 3 }, feedback: '건강한 생활 패턴을 유지하고 계시네요! 이런 루틴이 정말 좋아요.' },
    { content: '회사에서 중요한 프레젠테이션이 있었다. 긴장했지만 잘 마무리했다. 동료들에게 좋은 피드백을 받아서 뿌듯했다.', summary: '업무 성과와 동료들의 인정으로 성취감을 느낀 하루.', emotion: { positive: 85, negative: 5, neutral: 10 }, scores: { health: 3, money: 4, relationship: 5, growth: 5, rest: 3, hobby: 2, work: 5 }, feedback: '프레젠테이션 성공 축하드려요! 준비한 만큼 좋은 결과를 얻으셨네요.' },
    { content: '친구들과 오랜만에 저녁 약속이 있었다. 맛있는 음식을 먹으며 그동안의 이야기를 나눴다. 웃음이 끊이지 않았다.', summary: '소중한 친구들과 함께한 즐거운 시간.', emotion: { positive: 95, negative: 0, neutral: 5 }, scores: { health: 4, money: 3, relationship: 5, growth: 3, rest: 4, hobby: 4, work: 3 }, feedback: '친구들과의 시간은 정말 소중하죠! 이런 관계를 계속 유지해가세요.' },
    { content: '오늘은 하루 종일 집에서 쉬었다. 밀린 드라마를 보고, 낮잠도 잤다. 아무것도 안 하니 오히려 피곤한 느낌이다.', summary: '완전한 휴식의 날. 약간의 무기력함도 느낌.', emotion: { positive: 50, negative: 20, neutral: 30 }, scores: { health: 3, money: 3, relationship: 2, growth: 2, rest: 5, hobby: 4, work: 1 }, feedback: '가끔은 완전한 휴식도 필요해요. 하지만 내일은 가벼운 활동을 추가해보는 건 어떨까요?' },
    { content: '새로운 온라인 강의를 시작했다. 어려운 내용이지만 배우는 재미가 있다. 저녁에는 정리 노트를 작성했다.', summary: '자기계발에 집중한 생산적인 하루.', emotion: { positive: 75, negative: 5, neutral: 20 }, scores: { health: 3, money: 3, relationship: 2, growth: 5, rest: 3, hobby: 4, work: 4 }, feedback: '배움에 대한 열정이 대단해요! 꾸준히 하시면 분명 좋은 결과가 있을 거예요.' },
    { content: '업무가 너무 많아서 야근을 했다. 피곤하고 지친다. 집에 와서 바로 잠들었다.', summary: '과도한 업무로 지친 하루. 휴식이 필요함.', emotion: { positive: 20, negative: 50, neutral: 30 }, scores: { health: 2, money: 4, relationship: 2, growth: 3, rest: 1, hobby: 1, work: 4 }, feedback: '너무 무리하지 마세요. 건강이 가장 중요해요. 내일은 조금 여유를 가져보세요.' },
    { content: '주말에 등산을 갔다. 정상에서 보는 풍경이 정말 아름다웠다. 운동도 되고 스트레스도 풀렸다.', summary: '자연 속에서 건강과 마음의 평화를 찾은 하루.', emotion: { positive: 90, negative: 0, neutral: 10 }, scores: { health: 5, money: 3, relationship: 4, growth: 4, rest: 4, hobby: 5, work: 2 }, feedback: '등산은 정말 좋은 취미예요! 몸과 마음 모두 건강해지셨네요.' },
    { content: '오늘 월급을 받았다. 이번 달 지출을 점검하고 저축 계획을 세웠다. 소비를 줄이고 싶다.', summary: '재정 관리에 집중한 하루.', emotion: { positive: 60, negative: 10, neutral: 30 }, scores: { health: 3, money: 5, relationship: 3, growth: 4, rest: 3, hobby: 2, work: 4 }, feedback: '재정 계획을 세우는 것은 정말 현명한 행동이에요! 목표를 향해 꾸준히 가세요.' },
    { content: '가족과 함께 저녁을 먹고 이야기를 나눴다. 부모님의 건강이 걱정되기도 하지만, 함께하는 시간이 행복했다.', summary: '가족과의 소중한 시간. 약간의 걱정도 있음.', emotion: { positive: 70, negative: 15, neutral: 15 }, scores: { health: 4, money: 3, relationship: 5, growth: 3, rest: 4, hobby: 3, work: 2 }, feedback: '가족과의 시간은 무엇보다 소중해요. 부모님 건강도 함께 챙겨드리세요.' },
    { content: '새로운 취미인 요리를 시작했다. 처음이라 서툴렀지만, 맛있게 만들어서 뿌듯했다.', summary: '새로운 도전과 성취감을 느낀 하루.', emotion: { positive: 85, negative: 5, neutral: 10 }, scores: { health: 4, money: 3, relationship: 3, growth: 4, rest: 4, hobby: 5, work: 3 }, feedback: '새로운 취미를 시작하신 것 정말 멋져요! 요리 실력이 점점 늘 거예요.' },
    { content: '오늘은 기분이 우울했다. 특별한 이유는 없는데 그냥 의욕이 없었다. 일찍 잠자리에 들었다.', summary: '원인 불명의 우울감. 휴식으로 회복 시도.', emotion: { positive: 20, negative: 50, neutral: 30 }, scores: { health: 3, money: 3, relationship: 2, growth: 2, rest: 4, hobby: 2, work: 2 }, feedback: '누구나 그런 날이 있어요. 충분히 쉬고 내일 다시 시작해보세요.' },
    { content: '도서관에서 하루 종일 공부했다. 집중이 잘 돼서 생산적인 하루였다. 저녁에는 친구와 통화했다.', summary: '학습에 집중하고 친구와 연락도 유지한 하루.', emotion: { positive: 75, negative: 5, neutral: 20 }, scores: { health: 3, money: 3, relationship: 4, growth: 5, rest: 3, hobby: 3, work: 4 }, feedback: '집중력이 대단하세요! 꾸준한 노력이 분명 좋은 결과로 이어질 거예요.' },
    { content: '오늘 건강검진을 받았다. 결과가 조금 걱정되지만, 건강관리를 더 열심히 해야겠다고 다짐했다.', summary: '건강에 대한 경각심과 다짐을 한 하루.', emotion: { positive: 40, negative: 30, neutral: 30 }, scores: { health: 3, money: 3, relationship: 3, growth: 4, rest: 3, hobby: 2, work: 3 }, feedback: '건강검진을 받으신 것 잘하셨어요! 건강관리의 첫걸음이에요.' },
    { content: '회사에서 승진 발표가 있었다. 아쉽게도 내 이름은 없었다. 실망했지만 다음 기회를 노려야겠다.', summary: '승진 실패로 인한 실망감. 하지만 의지를 다짐.', emotion: { positive: 30, negative: 45, neutral: 25 }, scores: { health: 3, money: 3, relationship: 3, growth: 3, rest: 3, hobby: 2, work: 3 }, feedback: '실망스러운 결과지만, 포기하지 마세요. 다음 기회는 분명 올 거예요.' },
    { content: '오랜만에 영화관에 갔다. 재미있는 영화를 보고 팝콘도 먹었다. 소소하지만 확실한 행복이었다.', summary: '문화생활로 작은 행복을 느낀 하루.', emotion: { positive: 85, negative: 0, neutral: 15 }, scores: { health: 3, money: 3, relationship: 3, growth: 3, rest: 5, hobby: 5, work: 2 }, feedback: '소소한 행복도 정말 중요해요! 이런 시간을 자주 가지세요.' },
    { content: '오늘 아침 러닝을 하다가 발목을 삐었다. 병원에 다녀왔고, 며칠 쉬어야 한다고 한다. 운동을 못 해서 속상하다.', summary: '부상으로 인한 불편함과 아쉬움.', emotion: { positive: 15, negative: 55, neutral: 30 }, scores: { health: 1, money: 3, relationship: 3, growth: 2, rest: 4, hobby: 2, work: 3 }, feedback: '빨리 낫기를 바랍니다. 쉬는 동안 다른 활동을 해보는 것도 좋아요.' },
    { content: '친한 동료가 회사를 떠난다는 소식을 들었다. 아쉽지만 새로운 도전을 응원한다. 저녁에 송별회를 했다.', summary: '이별의 아쉬움과 응원의 하루.', emotion: { positive: 50, negative: 30, neutral: 20 }, scores: { health: 3, money: 3, relationship: 5, growth: 3, rest: 3, hobby: 3, work: 3 }, feedback: '좋은 동료와의 이별은 아쉽지만, 새로운 인연도 분명 생길 거예요.' },
    { content: '주말에 집 청소를 했다. 깨끗해진 집을 보니 기분이 상쾌했다. 오후에는 빨래도 하고 정리 정돈을 했다.', summary: '생활 정리로 쾌적한 환경을 만든 하루.', emotion: { positive: 70, negative: 5, neutral: 25 }, scores: { health: 4, money: 3, relationship: 2, growth: 3, rest: 4, hobby: 3, work: 3 }, feedback: '정리된 환경은 마음의 평화도 가져다줘요. 잘하셨어요!' },
    { content: '오늘 새로운 프로젝트를 시작했다. 도전적인 내용이지만 배울 것이 많을 것 같다.', summary: '새로운 도전의 시작. 기대와 긴장이 공존.', emotion: { positive: 65, negative: 15, neutral: 20 }, scores: { health: 3, money: 4, relationship: 4, growth: 5, rest: 3, hobby: 2, work: 5 }, feedback: '새로운 도전을 시작하신 것 축하드려요! 많이 성장하실 거예요.' },
    { content: '비가 와서 하루 종일 집에 있었다. 창밖 비 소리를 들으며 음악을 듣고 차를 마셨다.', summary: '비오는 날의 여유로운 실내 생활.', emotion: { positive: 60, negative: 10, neutral: 30 }, scores: { health: 3, money: 3, relationship: 2, growth: 2, rest: 5, hobby: 4, work: 2 }, feedback: '비오는 날의 여유도 좋죠. 가끔은 이런 시간이 필요해요.' },
    { content: '오늘 봉사활동을 다녀왔다. 어르신들께 식사를 대접하고 이야기를 나눴다. 뿌듯하고 감사한 하루였다.', summary: '봉사를 통해 보람과 감사함을 느낀 하루.', emotion: { positive: 90, negative: 0, neutral: 10 }, scores: { health: 4, money: 2, relationship: 5, growth: 5, rest: 3, hobby: 4, work: 3 }, feedback: '봉사활동을 하신 것 정말 멋져요! 다른 이를 돕는 것은 자신에게도 큰 선물이에요.' },
    { content: '갑자기 배가 아파서 병원에 갔다. 큰 문제는 아니라고 하는데 몸 관리를 더 잘해야겠다.', summary: '건강 이상으로 경각심을 느낀 하루.', emotion: { positive: 30, negative: 40, neutral: 30 }, scores: { health: 2, money: 3, relationship: 3, growth: 3, rest: 4, hobby: 2, work: 2 }, feedback: '몸이 보내는 신호에 귀 기울이세요. 건강이 최우선이에요.' },
    { content: '오늘 연봉 협상을 했다. 원하는 만큼은 아니지만 어느 정도 인상됐다. 더 열심히 해야겠다.', summary: '연봉 협상 결과에 대한 복잡한 감정.', emotion: { positive: 55, negative: 20, neutral: 25 }, scores: { health: 3, money: 4, relationship: 3, growth: 4, rest: 3, hobby: 2, work: 4 }, feedback: '연봉 인상 축하드려요! 앞으로도 좋은 성과 기대할게요.' },
    { content: '퇴근 후 헬스장에 갔다. 오랜만에 운동하니 힘들었지만 개운했다. 꾸준히 다녀야겠다.', summary: '운동 재개로 건강 관리를 시작한 하루.', emotion: { positive: 70, negative: 10, neutral: 20 }, scores: { health: 5, money: 3, relationship: 3, growth: 4, rest: 3, hobby: 4, work: 4 }, feedback: '운동을 다시 시작하신 것 정말 좋아요! 꾸준히 하시면 분명 변화가 있을 거예요.' },
    { content: '오늘 카페에서 책을 읽으며 혼자만의 시간을 보냈다. 조용히 생각을 정리하는 좋은 시간이었다.', summary: '혼자만의 시간으로 마음을 정리한 하루.', emotion: { positive: 65, negative: 5, neutral: 30 }, scores: { health: 4, money: 3, relationship: 2, growth: 4, rest: 5, hobby: 5, work: 2 }, feedback: '자신과의 시간도 정말 중요해요. 이런 여유 자주 가지세요.' },
    { content: '동창회가 있었다. 오랜만에 옛 친구들을 만나니 반가웠다. 추억 이야기로 웃음이 끊이지 않았다.', summary: '옛 친구들과의 즐거운 재회.', emotion: { positive: 90, negative: 0, neutral: 10 }, scores: { health: 3, money: 3, relationship: 5, growth: 3, rest: 4, hobby: 4, work: 2 }, feedback: '오랜 친구들과의 만남은 정말 소중하죠! 좋은 시간 보내셨네요.' },
    { content: '오늘 실수로 중요한 파일을 삭제했다. 복구하느라 야근을 했다. 정말 스트레스받는 하루였다.', summary: '업무 실수로 인한 스트레스와 야근.', emotion: { positive: 10, negative: 60, neutral: 30 }, scores: { health: 2, money: 3, relationship: 2, growth: 2, rest: 1, hobby: 1, work: 2 }, feedback: '누구나 실수할 수 있어요. 다음에는 백업을 자주 해두세요.' },
    { content: '새로 나온 맛집에 갔다. 음식이 정말 맛있었다. 사진도 찍고 행복한 저녁이었다.', summary: '맛있는 음식으로 행복한 저녁을 보낸 하루.', emotion: { positive: 85, negative: 0, neutral: 15 }, scores: { health: 4, money: 3, relationship: 4, growth: 2, rest: 4, hobby: 5, work: 3 }, feedback: '맛있는 음식은 기분을 좋게 해주죠! 다음 맛집 탐방도 기대돼요.' },
    { content: '오늘 아무 계획 없이 하루를 보냈다. 뭔가 허무한 느낌이 들었다. 내일은 더 알차게 보내야겠다.', summary: '무계획적인 하루에 대한 반성.', emotion: { positive: 30, negative: 35, neutral: 35 }, scores: { health: 3, money: 3, relationship: 2, growth: 2, rest: 4, hobby: 3, work: 2 }, feedback: '가끔은 그런 날도 필요해요. 내일 새로운 마음으로 시작하세요.' },
    { content: '아침에 요가를 하고, 건강한 아침 식사를 했다. 하루가 상쾌하게 시작됐다.', summary: '건강한 아침 루틴으로 시작한 하루.', emotion: { positive: 80, negative: 0, neutral: 20 }, scores: { health: 5, money: 3, relationship: 3, growth: 4, rest: 4, hobby: 4, work: 3 }, feedback: '건강한 아침 루틴이 정말 좋아요! 이 습관을 유지하세요.' },
];

// 4월부터 11월까지 3일 주기로 일기 생성
function generateMockDiaries() {
    const diaries = [];
    let id = 1;
    const startDate = new Date('2025-04-01');
    const endDate = new Date('2025-11-30');

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 3)) {
        const template = diaryTemplates[(id - 1) % diaryTemplates.length];
        const dateStr = date.toISOString().split('T')[0];

        // 약간의 변화를 주기 위한 랜덤 조정
        const variation = Math.floor(Math.random() * 10) - 5;

        diaries.push({
            id: id,
            date: dateStr,
            content: template.content,
            images: [],
            analysis: {
                summary: template.summary,
                emotionalScore: {
                    positive: Math.min(100, Math.max(0, template.emotion.positive + variation)),
                    negative: Math.min(100, Math.max(0, template.emotion.negative - Math.floor(variation / 2))),
                    neutral: Math.min(100, Math.max(0, template.emotion.neutral))
                },
                metricScores: {
                    health: Math.min(5, Math.max(1, template.scores.health + Math.floor(Math.random() * 2) - 1)),
                    money: Math.min(5, Math.max(1, template.scores.money + Math.floor(Math.random() * 2) - 1)),
                    relationship: Math.min(5, Math.max(1, template.scores.relationship + Math.floor(Math.random() * 2) - 1)),
                    growth: Math.min(5, Math.max(1, template.scores.growth + Math.floor(Math.random() * 2) - 1)),
                    rest: Math.min(5, Math.max(1, template.scores.rest + Math.floor(Math.random() * 2) - 1)),
                    hobby: Math.min(5, Math.max(1, template.scores.hobby + Math.floor(Math.random() * 2) - 1)),
                    work: Math.min(5, Math.max(1, template.scores.work + Math.floor(Math.random() * 2) - 1))
                },
                feedback: template.feedback
            }
        });
        id++;
    }

    // 최신순으로 정렬
    return diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const mockDiaries = generateMockDiaries();

// 최근 7일간의 지표 데이터 동적 생성
export function getWeeklyMetrics() {
    const recent7 = mockDiaries.slice(0, 7).reverse();
    return recent7.map(diary => ({
        date: diary.date.slice(5).replace('-', '/'),
        ...diary.analysis.metricScores
    }));
}

export const weeklyMetrics = getWeeklyMetrics();

// 월별 평균 계산
export function calculateMonthlyAverage() {
    const scores = { health: 0, money: 0, relationship: 0, growth: 0, rest: 0, hobby: 0, work: 0 };
    const count = mockDiaries.length;

    mockDiaries.forEach(diary => {
        Object.keys(scores).forEach(key => {
            scores[key] += diary.analysis.metricScores[key];
        });
    });

    Object.keys(scores).forEach(key => {
        scores[key] = (scores[key] / count).toFixed(1);
    });

    return scores;
}

export const monthlyAverage = calculateMonthlyAverage();

export const aiPersonalities = [
    { id: 'warm_companion', name: '따뜻한 공감형', description: '친구처럼 따뜻하게 공감하며 응원해주는 스타일', example: '오늘 정말 힘든 하루였겠어요. 그래도 꿋꿋하게 버틴 당신이 정말 멋져요. 내일은 더 좋은 일이 생길 거예요!' },
    { id: 'growth_coach', name: '발전 코치형', description: '성장을 위한 구체적인 조언과 목표를 제시하는 스타일', example: '실수는 성장의 기회입니다. 오늘 경험을 통해 무엇을 배웠는지 생각해보세요. 다음에는 이렇게 해보는 건 어떨까요?' },
    { id: 'neutral_observer', name: '객관적 관찰자형', description: '감정 없이 객관적으로 분석하고 인사이트를 제공하는 스타일', example: '데이터를 분석해보면, 최근 수면 시간이 줄어들면서 효율이 15% 감소했습니다. 규칙적인 생활 패턴 개선이 필요해 보입니다.' }
];

export const metrics = [
    { id: 'health', name: '건강', color: '#22c55e', icon: '💪' },
    { id: 'money', name: '재정', color: '#eab308', icon: '💰' },
    { id: 'relationship', name: '인간관계', color: '#ec4899', icon: '❤️' },
    { id: 'growth', name: '성장', color: '#6366f1', icon: '📈' },
    { id: 'rest', name: '휴식', color: '#06b6d4', icon: '😴' },
    { id: 'hobby', name: '취미', color: '#f97316', icon: '🎨' },
    { id: 'work', name: '업무', color: '#8b5cf6', icon: '💼' }
];

export const defaultWeights = {
    health: 20,
    money: 10,
    relationship: 20,
    growth: 15,
    rest: 15,
    hobby: 10,
    work: 10
};
