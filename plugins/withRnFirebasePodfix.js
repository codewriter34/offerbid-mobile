const {withDangerousMod} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * RN Firebase + use_frameworks static cannot use SPM firebase-ios-sdk
 * (duplicate symbols). Force CocoaPods resolution instead.
 */
function withRnFirebasePodfix(config) {
  return withDangerousMod(config, [
    'ios',
    async cfg => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      const preamble = [
        '# Autolinked by plugins/withRnFirebasePodfix.js',
        '$RNFirebaseDisableSPM = true',
        '$RNFirebaseAsStaticFramework = true',
        '',
      ].join('\n');
      if (!contents.includes('$RNFirebaseDisableSPM')) {
        contents = `${preamble}${contents}`;
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
}

module.exports = withRnFirebasePodfix;
