# 📱 피드백 주는 일기장 (AI Diary App)

사용자의 하루를 기록하면 AI가 내용을 분석하여 **감정 상태, 주요 관심사, 맞춤형 피드백**을 제공하는 **Android 기반 하이브리드 앱**입니다.

---

## ✨ 핵심 기능

### 📝 지능형 일기 작성
- **자유로운 기록**: 텍스트와 사진(최대 3장)을 활용한 일상 기록.
- **AI 성격 선택**: 사용자의 취향에 맞는 AI 피드백 스타일 선택 가능.
  - 🌸 **따뜻한 공감형**: 다정한 위로와 공감을 전합니다.
  - 🔥 **발전 코치형**: 성장을 위한 동기부여와 조언을 제공합니다.
  - ⚖️ **객관적 관찰자형**: 차분하고 이성적인 시각으로 하루를 분석합니다.
- **실시간 수정/분석**: 작성된 일기를 수정하면 AI가 즉시 재분석을 수행합니다.

### 🧠 정밀 분석 시스템
- **감정 분석 (Sentiment Analysis)**: 긍정/부정 단어 사전을 기반으로 한 감정 밸런스 측정.
- **주제 감지 (Topic Detection)**: 경제, 건강, 관계, 업무, 취미 등 5개 카테고리로 관심사 분류.
- **맞춤형 피드백**: 감정 상태와 주제에 따른 6단계의 세분화된 피드백 생성.

### 📊 대시보드 및 통계
- **종합 점수**: 오늘의 감정과 성과를 수치화하여 표시.
- **감정 분포 시각화**: 최근 감정 변화를 직관적인 아이콘과 그래프로 확인.
- **데이터 저장**: `IndexedDB`를 사용하여 오프라인에서도 안전하게 데이터를 저장하고 관리합니다.

---

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router)
- **Mobile Integration**: Capacitor 6 (Android)
- **Styling**: Pure CSS Modules (Glassmorphism & Modern UI)
- **Database**: Dexie.js (IndexedDB)
- **Icons**: Lucide React

---

## 🚀 시작하기

### 개발 서버 실행

```bash
cd diary-app
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 안드로이드 앱 빌드 및 실행

1. **정적 파일 생성**:
   ```bash
   npm run build
   ```
2. **Capacitor 동기화**:
   ```bash
   npx cap sync
   ```
3. **안드로이드 스튜디오 실행**:
   ```bash
   npx cap open android
   ```
4. 안드로이드 스튜디오에서 **Build > Generate Signed Bundle / APK**를 통해 앱을 배포하거나, 에뮬레이터/기기에서 바로 실행 가능합니다.

---

## 📂 프로젝트 구조

- `src/app`: Next.js 페이지 및 라우팅 로직
- `src/components`: 재사용 가능한 UI 컴포넌트 (Sidebar, Dashboard 등)
- `src/lib`: AI 분석 알고리즘 및 유틸리티 함수
- `public`: 로고, 이미지 등 정적 자산
- `android`: Capacitor 안드로이드 네이티브 프로젝트 설정

---

## 🚦 프로젝트 현황

자세한 개발 로그 및 앞으로의 계획은 [PROJECT_STATUS.md](./PROJECT_STATUS.md)를 참고하세요.
빌드 및 출시 가이드는 [HOW_TO_BUILD_APP.md](./HOW_TO_BUILD_APP.md)에 상세히 기록되어 있습니다.
