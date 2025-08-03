# StockPop

The easiest way to access tokenized stocks.

<div>
  <img src="./screenshots/home.png" alt="Home Screen" width="30%" />
  <img src="./screenshots/discovery.png" alt="Discovery Screen" width="30%" />
  <img src="./screenshots/swap.png" alt="Swap Screen" width="30%" />
</div>

## Demo Video

https://github.com/user-attachments/assets/ae840bcf-5568-4eaf-8ae3-96f6aacd220d

## Dev

This app is only developed and tested on Android. Also, expect some issues if [MWA](https://docs.solanamobile.com/developers/mobile-wallet-adapter) is not available on your device.

The app is developed using Expo. Simply install all the dependencies and run the app with `expo start`. Note that Expo Go does not work with the MWA so you must use a development build.

The API is under the `/api` dir. Is is just a simple [trpc](https://github.com/trpc/trpc) express app.

## Testing

You can download the latest APK for testing in [releases](https://github.com/SC4RECOIN/StockPop/releases). This is just a beta release so expect some bugs and future changes.
