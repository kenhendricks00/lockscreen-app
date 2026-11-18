# Lock Screen

A recreation of my iPhone lock screen as an Expo (React Native + TypeScript) app:

- the wallpaper photo
- the date and next calendar event
- a big live glassy clock
- live weather and a Bible verse widget
- flashlight and camera buttons
- Pushover notifications, which can sit at the bottom, along the side or in a corner

![Reference next to the app](screenshots/reference-vs-app.png)

| Bottom | Side | Corner |
| --- | --- | --- |
| ![](screenshots/notifications-bottom.png) | ![](screenshots/notifications-side.png) | ![](screenshots/notifications-corner.png) |

You don't need a Mac for any of this.

---

## 1. Run it on your iPhone with Expo Go

This is the fastest way to try the app. Nothing gets installed on the phone except Expo Go.

1. On your PC, install **Node.js LTS** from <https://nodejs.org>.
2. On your iPhone, install **Expo Go** from the App Store.
3. Open a terminal in this folder and run:

   ```sh
   npm install
   npx expo start
   ```

4. A QR code appears in the terminal. Open the iPhone's **Camera** app, point it at the QR code and tap the banner. The app opens in Expo Go.

The PC and the phone must be on the **same Wi-Fi network**. On school or work Wi-Fi, or if the phone can't connect, use a tunnel instead:

```sh
npx expo start --tunnel
```

Save any file and the app on the phone reloads by itself.

### Make it yours

Everything personal is in **`src/config.ts`**:

- the calendar event (`nextEvent`)
- the verse (`verse`)
- the weather location (`location`)
- the offline weather fallback (`fallbackWeather`)
- the notification settings (`notifications`)

---

## 2. Pushover notifications (optional)

The app can show your [Pushover](https://pushover.net) notifications on the lock screen. It is an **unofficial Pushover Open Client**: it registers itself as an extra Pushover "device" and receives messages live over Pushover's WebSocket.

**Pick a look.** In `src/config.ts`, set `notifications.placement` to one of these:

| `placement` | Look |
| --- | --- |
| `'bottom'` | Full-width cards above the flashlight and camera buttons, like iOS |
| `'side'` | A slim column down the right edge, under the widgets |
| `'corner'` | Small one-line pills tucked above the camera button |

To preview a placement before setting up Pushover, set `demo: true`. That shows three sample notifications.

**Connect your account** (one time):

```sh
node scripts/pushover-setup.mjs
```

The script does three things:

1. It asks for your Pushover email, password and, if you use one, your 2FA code.
2. It registers a device called `lockscreen`.
3. It writes the device's secret to `.env.local`.

Your password isn't stored anywhere. Restart Expo afterwards with `npx expo start --clear`.

Things to know:

- **Tap a notification to dismiss it.** Notifications are kept on the phone until you dismiss them, because the app deletes them from Pushover's servers after downloading them, as the Open Client API asks.
- **Pushover licensing:** Pushover counts an Open Client device as a *desktop* device. After 30 days you need the one-time Pushover for Desktop license.
- **Keep `.env.local` private.** It's git-ignored. Its values end up inside the built app, so don't share your .ipa or publish a web build that was made with them.

---

## 3. Get an .ipa without a Mac

An .ipa is the installable iPhone app file. Both routes below build an **unsigned** .ipa on Apple hardware in the cloud. AltStore or SideStore then signs it with your free Apple ID when you install it.

The build logic for both routes lives in `scripts/build-unsigned-ipa.sh`.

### Option A: EAS Build (Expo's cloud, free tier)

1. Create a free account at <https://expo.dev/signup>.
2. Log in and link this project. The second command adds a project ID to `app.json`, so commit that change afterwards.

   ```sh
   npx eas-cli login
   npx eas-cli init
   ```

3. *(Pushover only)* Store your secret with EAS. Copy the values from `.env.local`:

   ```sh
   npx eas-cli env:create --environment production --visibility sensitive --name EXPO_PUBLIC_PUSHOVER_SECRET --value <secret>
   npx eas-cli env:create --environment production --visibility sensitive --name EXPO_PUBLIC_PUSHOVER_DEVICE_ID --value <device id>
   ```

4. Start the build:

   ```sh
   npx eas-cli build --platform ios --profile sideload
   ```

   The `sideload` profile in `eas.json` skips Apple credentials. It runs the custom steps in `.eas/build/unsigned-ios.yml`.

5. Free builds wait in a queue, which can take a while. When the build finishes, open its page on expo.dev and download **LockScreen-unsigned.ipa**. The free plan includes a limited number of iOS builds per month; see <https://expo.dev/pricing>.

### Option B: GitHub Actions (GitHub's macOS machines)

1. Create a repository on GitHub and push this project to it. Make it **private** if you'll add Pushover secrets: anyone who can see the repo can download the built app.
2. *(Pushover only)* In the repo, go to **Settings → Secrets and variables → Actions**. Add two secrets: `PUSHOVER_SECRET` and `PUSHOVER_DEVICE_ID`.
3. Open the **Actions** tab, choose **Unsigned iOS build** and click **Run workflow**. It takes about 15–30 minutes.
4. Open the finished run and download **LockScreen-unsigned-ipa** under *Artifacts*. Unzip it to get the .ipa.

Public repos get macOS build minutes for free. Private repos use your free monthly Actions minutes, and macOS minutes count 10× there.

---

## 4. Install it with AltStore or SideStore (free Apple ID)

### AltStore (Windows PC + USB cable)

1. On the PC, install **iTunes** and **iCloud**. Use the versions from Apple's website, not the Microsoft Store.
2. Install **AltServer** from <https://altstore.io>. Plug in the iPhone and trust the computer.
3. Click the AltServer tray icon, choose **Install AltStore**, pick your phone and sign in with your Apple ID.
4. On the iPhone, trust your Apple ID in **Settings → General → VPN & Device Management**. Then turn on **Settings → Privacy & Security → Developer Mode** and restart when asked.
5. Copy the .ipa to the phone. AirDrop doesn't work from Windows, so use iCloud Drive or email it to yourself and save it to Files.
6. In AltStore, open **My Apps**, tap **+** and pick the .ipa.

### SideStore (no PC after setup)

SideStore is a fork of AltStore that refreshes apps on the phone itself, using a pairing file and a VPN app. Follow the setup guide at <https://sidestore.io>. Then install the .ipa from **My Apps → +**, the same way as in AltStore.

### Free Apple ID limits

- **Apps expire after 7 days.** Before then, open AltStore or SideStore and tap **Refresh All**. AltStore needs AltServer running on your PC on the same Wi-Fi. SideStore refreshes on the phone.
- If an app expires, it won't open until you refresh it. Your data is kept.
- **You can have at most 3 sideloaded apps at once**, and AltStore or SideStore itself counts as one. That leaves room for this app plus one more.
- Apple also allows only 10 new app IDs per 7 days.

---

## How it's built

```
App.tsx                      loads fonts, hides the status bar
src/LockScreen.tsx           layout, positioned from the safe area insets
src/config.ts                everything you'd want to edit
src/time.ts                  live clock (re-renders exactly on the minute)
src/weather.ts               Open-Meteo forecast with an offline fallback
src/pushover.ts              tiny Pushover Open Client (WebSocket + REST)
src/components/              clock, date line, widgets, buttons, notifications
scripts/make_wallpaper.py    how assets/wallpaper.jpg was made
scripts/pushover-setup.mjs   one-time Pushover login + device registration
scripts/build-unsigned-ipa.sh  unsigned .ipa build used by EAS and GitHub Actions
```

**Wallpaper.** `assets/wallpaper.jpg` comes from the original 1284×2778 screenshot.

- **Top half:** the status bar, date line, clock and widgets sit on soft, out-of-focus background. They were removed by inpainting a downscaled copy, blurring it, and adding film grain back so the patches blend in.
- **Bottom buttons and home bar:** these sit on detailed texture, so they were inpainted at full size. The patches aren't perfect, but the app's own buttons cover them.

To redo it, put the screenshot at `reference/lockscreen.png` and run `python scripts/make_wallpaper.py reference/lockscreen.png assets/wallpaper.jpg`. This needs `opencv-python` and `numpy`.

**Clock.** The clock is drawn with SVG. It uses Fraunces Medium, the closest free match to the iOS rounded serif, with a white-to-periwinkle gradient, a light top rim and a soft bottom edge.

**Fonts.** On iPhone, the text uses San Francisco, the system font. On web and Android it uses Inter, a lookalike.

**Flashlight.** On a real iPhone, the flashlight button turns on the actual torch. This uses expo-camera and asks for camera permission the first time. On web it only animates. The camera button only animates.

**Home indicator.** iOS draws the real home indicator on top of every app, so the app draws its own bar only on web and Android.

## Checks

```sh
npx tsc --noEmit
npm run lint
npx expo export --platform web
```
