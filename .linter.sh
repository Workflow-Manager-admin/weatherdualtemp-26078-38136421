#!/bin/bash
cd /home/kavia/workspace/code-generation/weatherdualtemp-26078-38136421/weather_dual_temp
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

