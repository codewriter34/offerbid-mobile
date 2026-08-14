module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@screens': './src/screens',
          '@components': './src/components',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@config': './src/config',
          '@theme': './src/theme',
          '@types': './src/types',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@navigation': './src/navigation',
        },
      },
    ],
  ],
};
