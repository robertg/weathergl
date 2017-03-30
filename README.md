# WeatherGL

Currently hosted on github.io: http://gawdzik.net/weathergl/

WeatherGL is a WebGL React project which requires a Javascript development environment.
 - There are two interaction modes:
   - **Shadow Mode**: Demonstrates a floating cube to showcase shadowmaps
   - **House Mode**: A bonus mode which enables you to walk around a house in first person.
 - To access the UI, click the burger menu on the top left.

### Requirements
 - https://nodejs.org/en/download/
   - Node.js 6.10 or higher.
   - npm 3.10.10 or higher.

### To run weathergl on localhost

```
npm install
npm run start
```

WeatherGL will appear on localhost:3000 (or it will give you the option to select another port)

### Screenshots

In `screenshots/`
 - `screenshot1.png`: Shadow Demo Mode: Demonstration of dynamic shadow maps
 - `screenshot2.png`: Demonstration of UI
 - `screenshot3.png`: Demonstration of bumpmapping on terrain
 - `screenshot4.png`: Demonstration of House Mode (Bonus) and lens flare effect
 - `screenshot5.png`: Demonstration of Rainy Weather being enabled.
 - `screenshot6.png`: Demonstration of Snowy Weather being enabled.

### Objectives

1. The WeatherGL scene is correctly modeled with no visual artifacts or distortion.
2. Models rendered in the WeatherGL scene are texture mapped.
3. Rough surfaces in the scene (e.g. dirt) are bump mapped.
4. An easy to use User Interface to change between the various weather options, and to interact with the environment.
5. Synced sound effects which provide immersion into WeatherGLs landscape.
6. A skybox with no visual artifacts or distortion.
7. Lens flare for weather parameters which contain the sun. The lens flare should have no artifacts or distortion.
8. Shadows using shadow mapping for weather parameters that contain the sun.
9. Static Collision Detection to enable an immersive environment (e.g. bumping into things when walking around).
10. Visual snow and rain effects using particle systems and/or other graphic techniques.

### Conventions:
 - 1 unit == 1 meter

### Attributions:
 - See ATTRIBUTIONS.md for assets
 - See inline attributions in `src/`

### Various Technical Sources
 - See READING.md
