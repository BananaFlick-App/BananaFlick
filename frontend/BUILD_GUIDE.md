# Android Build & Play Protect Guide

This guide explains how to properly build BananaFlick for Android to ensure all environment variables are included and the app is not blocked by Play Protect.

## 1. Set Up EAS Secrets

The app crashes because the Supabase URL and Key are missing from the build. You must add them as secrets in EAS.

1.  Run the following commands in your terminal (inside the `frontend` folder):
    ```bash
    eas secret:create --name SUPABASE_URL --value "your_supabase_url" --scope project
    eas secret:create --name SUPABASE_ANON_KEY --value "your_supabase_anon_key" --scope project
    ```
    *Replace "your_supabase_url" and "your_supabase_anon_key" with your actual values.*

2.  Verify the secrets are created:
    ```bash
    eas secret:list
    ```

## 2. Updated EAS Configuration

Ensure your `eas.json` is configured to use these secrets. Your current `eas.json` looks good, but for a production release that Play Protect likes, you should use the `production` profile.

## 3. Handling Play Protect Flagging

Play Protect often flags apps that:
- Are unsigned or use a debug key.
- Are distributed as raw APKs instead of via the Play Store or a trusted source.
- Exhibit "unstable" behavior (like crashing immediately).

### Recommended Steps:

1.  **Use a Signed Build**: When you run `eas build --platform android --profile production`, EAS will ask you to generate or upload a keystore. **Let EAS handle this for you** if you don't have one. This will sign the app correctly.
2.  **Submit to Play Store (Optional but Best)**: The most reliable way to avoid Play Protect warnings is to upload the app to the Google Play Console (even as an internal testing track).
3.  **"Send for Review"**: If you are installing the APK manually and see a Play Protect warning, there is usually a "More details" or "Install anyway" button. On the warning screen, there is also often a link to "Send app for review" to Google.

## 4. Building the App

Choose the build profile depending on how you intend to distribute the app:

### A. For Manual Installation (APK)
Use this if you want to send the file directly to your phone.
```bash
eas build --platform android --profile release
```

### B. For Google Play Store (AAB)
Use this for official distribution. This is the format Play Protect prefers.
```bash
eas build --platform android --profile production
```

## 5. Troubleshooting Startup

I have updated the app's startup logic. If the EAS secrets were not correctly included in the build, the app will now show a **"Configuration Error"** screen instead of closing immediately. 

If you see this screen:
1. Double-check your secrets with `eas secret:list`.
2. Ensure you are building from the `frontend` directory.
3. Reach out if the issue persists!
