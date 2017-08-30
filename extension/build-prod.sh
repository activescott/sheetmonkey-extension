#!/bin/bash
# This will pack everything and get it ready for chrome.
clear
rm -rfd ./build/prod/*
echo Go to chrome://extensions and use 'Load unpacked extension...' to load it from ./build/prod
npm run build
