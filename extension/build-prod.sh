#!/bin/bash
# This will pack everything and get it ready for chrome.
clear
ZIP_FILE=sheetmonkey-package-prod.zip
rm -rfd ./build/prod/*
rm ./build/$ZIP_FILE


npm run build

# zip it:
pushd .
cd ./build/prod
zip -r ../$ZIP_FILE .
echo 
echo 
echo To test locally, go to chrome://extensions and use 'Load unpacked extension...' to load it from ./build/prod
echo To deploy to chrome web store, go to https://chrome.google.com/webstore/developer/dashboard and upload the file: $ZIP_FILE
