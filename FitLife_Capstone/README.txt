# FitLife Capstone - Offline Front-End Prototype

## Folder structure
- `index.html` - app structure
- `css/style.css` - responsive design and visual styles
- `js/app.js` - navigation, features, Fitbot replies, and local data storage

## How to run
1. Extract the ZIP file.
2. Open the `FitLife_Capstone` folder in VS Code.
3. Open `index.html` in a browser, or use the VS Code Live Server extension.
4. Start with the Welcome screen and enter a display name.

## Features in this prototype
- Welcome / splash screen
- Home dashboard with calories, steps, water and sleep
- Diet category, meal plan, food log, and simple recipes
- Fitness category, exercise list, workout timer, and completed workout history
- Progress page with a simple weight chart and editable goals
- Offline Fitbot with prepared keyword-based answers
- Profile and settings
- Responsive mobile-first layout
- Browser localStorage saves records on the current browser/device

## Important limitations
- This is a front-end prototype. It does not automatically read real steps, heart rate, sleep, or calories from phone sensors.
- Records are local to the browser/device. They are not synced to another phone and are not protected by a user account or database.
- Fitbot is a simple offline keyword-matching chatbot, not an AI model.
- Meal calories and sample weight history are illustrative estimates. Replace them with content approved by your capstone adviser.
- For an installable Android app, the website can later be packaged with a tool such as Capacitor, but test it thoroughly first.
- The Google font import is optional; if offline, the app uses the device's fallback fonts.

## Suggested capstone testing
1. Test every button on each screen.
2. Test on different screen widths using browser developer tools.
3. Refresh the page and check whether saved values remain.
4. Test with airplane mode enabled. Google Fonts may not load, but core functionality should work.
5. Ask your adviser what data privacy, consent, and documentation are required for your school project.
