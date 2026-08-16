module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {jsxImportSource: 'nativewind'}],
      'nativewind/babel',
    ],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          root: ['./src'],
          alias: {
            '@api': './src/api',
            '@app': './src/app',
            '@features': './src/features',
            '@shared': './src/shared',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
