module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: [
      '@testing-library/jest-native/extend-expect'
    ],
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@expo|expo(nent)?|@expo/vector-icons|react-clone-referenced-element|@react-native-community|@react-native-async-storage|@react-native-picker|@react-native-masked-view|@react-native-segmented-control|@react-native-firebase|@react-native-google-signin|firebase|@firebase)'
    ]
};