module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-module-resolver',
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
};
