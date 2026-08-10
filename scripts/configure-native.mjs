import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const appId = process.env.CAPACITOR_APP_ID || 'de.example.lernapp34d';
const scheme = process.env.CAPACITOR_URL_SCHEME || appId;

const androidManifest = 'android/app/src/main/AndroidManifest.xml';
if (existsSync(androidManifest)) {
  const source = readFileSync(androidManifest, 'utf8');
  if (!source.includes('android:pathPrefix="/password-reset"')) {
    const intent = `
            <intent-filter android:autoVerify="false">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${scheme}" android:host="auth" android:pathPrefix="/password-reset" />
            </intent-filter>`;
    writeFileSync(androidManifest, source.replace('</activity>', `${intent}\n        </activity>`));
  }
}

const iosPlist = 'ios/App/App/Info.plist';
if (existsSync(iosPlist)) {
  const source = readFileSync(iosPlist, 'utf8');
  if (!source.includes('<key>CFBundleURLTypes</key>')) {
    const urlType = `
\t<key>CFBundleURLTypes</key>
\t<array>
\t\t<dict>
\t\t\t<key>CFBundleURLName</key>
\t\t\t<string>${appId}.auth</string>
\t\t\t<key>CFBundleURLSchemes</key>
\t\t\t<array><string>${scheme}</string></array>
\t\t</dict>
\t</array>`;
    writeFileSync(iosPlist, source.replace('</dict>\n</plist>', `${urlType}\n</dict>\n</plist>`));
  }
}
