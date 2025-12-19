/**
 * 일기 데이터를 마크다운 형식으로 변환합니다.
 */
export function convertToMarkdown(diary, metrics) {
    const { date, content, analysis } = diary;
    const { summary, emotionalScore, metricScores, feedback } = analysis;

    let markdown = `# Diary: ${date}\n\n`;

    markdown += `## 📝 내용\n${content}\n\n`;

    markdown += `## 🤖 AI 분석\n`;
    markdown += `### 💡 오늘의 요약\n${summary}\n\n`;

    markdown += `### 📊 감정 지수\n`;
    markdown += `- 긍정: ${emotionalScore.positive}%\n`;
    markdown += `- 부정: ${emotionalScore.negative}%\n\n`;

    markdown += `### 📌 지표별 점수\n`;
    metrics.forEach(m => {
        const score = metricScores[m.id] || 0;
        markdown += `- ${m.icon} ${m.name}: ${score}/5\n`;
    });
    markdown += `\n`;

    markdown += `### 💬 AI 피드백\n${feedback}\n`;

    return markdown;
}

/**
 * 텍스트를 클립보드에 복사합니다.
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

/**
 * 마크다운 파일을 다운로드합니다.
 */
export function downloadMarkdown(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Obsidian URI를 생성하여 앱을 실행합니다.
 * 참고: Obsidian Advanced URI 플러그인이 설치되어 있으면 더 다양한 기능을 쓸 수 있지만, 
 * 기본적으로 'new' 액션은 지원됩니다.
 */
export function openInObsidian(filename, content) {
    const encodedContent = encodeURIComponent(content);
    const encodedFile = encodeURIComponent(filename.replace('.md', ''));
    // Obsidian URI format: obsidian://new?file=PATH&content=CONTENT
    const uri = `obsidian://new?file=${encodedFile}&content=${encodedContent}`;
    window.location.href = uri;
}

/**
 * 모든 일기를 하나의 마크다운 파일로 변환합니다.
 */
export function exportAllToMarkdown(diaries, metrics) {
    let combinedMarkdown = `# AI 일기장 전체 백업 (${new Date().toLocaleDateString()})\n\n`;
    combinedMarkdown += `총 ${diaries.length}개의 기록이 포함되어 있습니다.\n\n---\n\n`;

    diaries.forEach((diary, index) => {
        combinedMarkdown += convertToMarkdown(diary, metrics);
        if (index < diaries.length - 1) {
            combinedMarkdown += `\n---\n\n`;
        }
    });

    return combinedMarkdown;
}

/**
 * JSON 데이터를 파일로 다운로드합니다.
 */
export function downloadJSON(filename, data) {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
