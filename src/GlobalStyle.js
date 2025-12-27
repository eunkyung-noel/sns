import { createGlobalStyle, keyframes } from 'styled-components';

// 비눗방울이 아래에서 위로 무작위로 떠오르는 애니메이션
const float = keyframes`
    0% {
        transform: translateY(110vh) scale(0.5);
        opacity: 0;
    }
    20% {
        opacity: 0.3;
    }
    80% {
        opacity: 0.3;
    }
    100% {
        transform: translateY(-20vh) scale(1.5);
        opacity: 0;
    }
`;

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        padding: 0;
        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(180deg, #eef9ff 0%, #d2e9ff 100%);
        min-height: 100vh;
        overflow-x: hidden;
        color: #1a2a6c;
    }

    /* 배경 비눗방울 레이어 */
    .background-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
    }

    .bubble {
        position: absolute;
        bottom: -100px;
        background: rgba(255, 255, 255, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        box-shadow: inset 0 5px 15px rgba(255, 255, 255, 0.5);
        animation: ${float} var(--duration) infinite linear;
        left: var(--left);
        width: var(--size);
        height: var(--size);
        animation-delay: var(--delay);
    }
`;

export default GlobalStyle;