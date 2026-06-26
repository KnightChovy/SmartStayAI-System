module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo'], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '^@/components/(.+)$': './components/\\1',
            '^@/assets/(.+)$': './assets/\\1',
            '^@/(.+)$': './src/\\1',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
