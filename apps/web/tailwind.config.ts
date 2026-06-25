import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pradera: { DEFAULT: '#58CC02', light: '#7AE02A', dark: '#3FA002' },
        desierto: { DEFAULT: '#FF9600', light: '#FFB84D', dark: '#CC7800' },
        lagos: { DEFAULT: '#00A3FF', light: '#4DBFFF', dark: '#0082CC' },
        bosque: { DEFAULT: '#7B68EE', light: '#9E8FF3', dark: '#5F4FBF' },
        montana: { DEFAULT: '#FF6B6B', light: '#FF8E8E', dark: '#CC5555' },
        volcan: { DEFAULT: '#FF4444', light: '#FF6666', dark: '#CC3333' },
        valle: { DEFAULT: '#00D2D3', light: '#4DE0E1', dark: '#00A8A9' },
        castillo: { DEFAULT: '#F7D44A', light: '#F9DF75', dark: '#D4B43A' },
      },
      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
