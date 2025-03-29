# Audio-Visual Liveset Tool

A browser-based tool for creating audio-visual livesets. Mix multiple audio loops and control visuals in real-time.

## Features

- Play and blend unlimited audio loops.
- Scene-based visuals, blended according to active audio loops.
- Animated slider values, blended with scenes.
- Control via Launchpad, computer keyboard, or mouse.
- All settings saved in local storage (cleared when browser data is deleted).

## Controls

- Press **M** to open visual settings.
- Assign visuals per scene.
- Animate sliders to enhance performance visuals.

## Setup

1. Place `.wav` files in the `sounds/` folder. Use subfolders to define separate scenes (displayed as boxes).
2. Run the PHP script:
   ```bash
   php getAndconvertSoundFiles.php
   ```
   This converts .wav to .mp3 and generates a JSON file with metadata. 
3. Start a local web server and open index.html in a browser. 
4. Done — enjoy your liveset.
