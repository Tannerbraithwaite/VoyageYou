/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#22d3ee'; // cyan-400
const tintColorDark = '#a78bfa'; // violet-400

export const Colors = {
  light: {
    text: '#0b1324',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#5b6270',
    tabIconDefault: '#5b6270',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E6E8EC',
    background: '#0a0a0a',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
