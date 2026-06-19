import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

/**
 * EcoLink 톤 — legacy GAS 화면 계승(docs/LEGACY_DESIGN.md).
 * 브랜드 블루 #1c95d4 축(brand) + 쿨 그레이 통합(ink). 다크모드는 보류.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 블루 — legacy --primary-color #1c95d4 축
        brand: {
          50: '#eef7fd',
          100: '#d4ebf8',
          200: '#a9d7f1',
          300: '#71bde8',
          400: '#3ba3dd',
          500: '#1c95d4', // --primary-color (브랜드 기준)
          600: '#1a88c3', // --primary-color-dark (패턴 B hover)
          700: '#1678a9', // 패턴 A hover (홈/견적서)
          800: '#005a8c', // deep accent (섹션 타이틀)
          900: '#073f5e',
        },
        // 쿨 그레이 — Apple + Bootstrap 그레이 통합
        ink: {
          50: '#f8f9fa', // canvas / 본문 bg / thead
          100: '#f2f2f7', // panel / results-wrapper
          200: '#e5e5ea', // 기본 border
          300: '#dee2e6', // 강한 border (테이블/입력)
          400: '#aeaeb2', // disabled / placeholder
          500: '#8e8e93', // 보조(회색) 버튼
          600: '#636366', // text secondary
          700: '#495057', // 테이블 헤더 텍스트
          800: '#333333', // 패턴 A 본문 텍스트
          900: '#1c1c1e', // text primary
        },
        // 드롭존 dragover 등 옅은 블루 틴트
        tint: '#f0f8ff',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 4px 15px rgba(0,0,0,0.06)', // 패턴 B 카드
        panel: '0 8px 25px rgba(0,0,0,0.10)', // 패턴 A 컨테이너
      },
    },
  },
  plugins: [typography],
} satisfies Config
