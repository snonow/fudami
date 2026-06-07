module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-document-picker$': '<rootDir>/__mocks__/expo-document-picker.js',
    '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system.js',
    '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system.js',
    '^../assets/jmdict/vocab_n5.json$': '<rootDir>/__mocks__/vocab_n5.json',
    '^../../assets/jmdict/vocab_n5.json$': '<rootDir>/__mocks__/vocab_n5.json',
  },
};
