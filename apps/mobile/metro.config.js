const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, '../../packages'),
]

config.unstable_enablePackageExports = true

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 })
