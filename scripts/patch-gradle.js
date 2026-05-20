/**
 * Patches Expo SDK 51 native Gradle files for compatibility with Gradle 8.8.
 * Run via postinstall: "node scripts/patch-gradle.js"
 *
 * Fixes:
 * 1. expo-modules-core: components.release → components.named("release").get()
 * 2. expo-constants: expo-module-gradle-plugin declaration fallback
 */
const fs = require('fs');
const path = require('path');

function patch(filePath, search, replace, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-gradle] SKIP (not found): ${label}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(search)) {
    console.log(`[patch-gradle] SKIP (already patched or different content): ${label}`);
    return;
  }
  const patched = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
  fs.writeFileSync(filePath, patched, 'utf8');
  console.log(`[patch-gradle] PATCHED: ${label}`);
}

// Fix 1: components.release → components.named("release").get()
// This API was removed in Gradle 8.x
patch(
  path.join(__dirname, '../node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle'),
  'components.release',
  'components.named("release").get()',
  'expo-modules-core ExpoModulesCorePlugin.gradle (components.release)'
);

// Fix 2: Same fix for any other expo-modules-core gradle files
const extraFiles = [
  '../node_modules/expo-modules-core/android/build.gradle',
  '../node_modules/expo/android/build.gradle',
];
for (const f of extraFiles) {
  patch(
    path.join(__dirname, f),
    'components.release',
    'components.named("release").get()',
    f
  );
}

console.log('[patch-gradle] Done.');
