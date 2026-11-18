#!/usr/bin/env bash
# Builds an unsigned Release .ipa from the prebuilt ios/ folder (macOS only).
# AltStore / SideStore re-sign it with your Apple ID when you install it.
# Run after: npx expo prebuild --platform ios
set -euo pipefail

cd ios
workspace=$(ls -d ./*.xcworkspace | head -n 1)
scheme=$(basename "$workspace" .xcworkspace)

xcodebuild -quiet \
  -workspace "$workspace" \
  -scheme "$scheme" \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""

rm -rf build/Payload
mkdir build/Payload
cp -R build/Build/Products/Release-iphoneos/*.app build/Payload/
(cd build && zip -qry LockScreen-unsigned.ipa Payload)
echo "Built ios/build/LockScreen-unsigned.ipa"
