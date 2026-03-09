// src/utils/gitGraphHelper.js (새 파일 만들기)

// 💡 브랜치 라인별 색상 팔레트 (순서대로 배정됨)
const BRANCH_COLORS = [
    '#2979FF', // Line 0 (Main): 진한 파랑
    '#F48FB1', // Line 1: 분홍색 (레퍼런스색)
    '#FF9100', // Line 2: 주황색
    '#81C784', // Line 3: 연두색
    '#BA68C8', // Line 4: 보라색
];

// 이전에 계산해둔 커밋의 lane 값에 따라 색상을 반환하는 함수
export const getBranchColorByLane = (laneIndex) => {
    // laneIndex가 팔레트 크기를 넘어가면 순환하도록 처리
    const colorIndex = laneIndex % BRANCH_COLORS.length;
    return BRANCH_COLORS[colorIndex];
};