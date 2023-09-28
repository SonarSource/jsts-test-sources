# Feature flags

Artsy releases the app on a [2-week cadence 🔐](https://www.notion.so/artsy/2-week-Release-Cadence-f3427549d9cb4d8b809ad16c57338c2d), submitting the Monday after a sprint starts.

For very small features (like adding a single new label to a view) we simply open a pull request.

For bigger features that will take longer than a sprint, we put development behind a **feature flags** in order to be able to test our work without making our progress work visible to our users. This way we can the flag off and on and thoroughly test it before releasing it.

## Contents

- [Echo](#echo)
- How to Develop a Feature in Eigen [link](#how-to-develop-a-feature-in-eigen)
- Add a feature flag [link](#add-a-feature-flag)
  - **Step 1**: Configure the feature flag on features.ts and echo [link](#step-1-configure-the-feature-flag-on-featurests)
  - **Step 2**: Place the feature flag in the part of code where it will be used [link](#step-2-place-the-feature-flag-in-the-part-of-code-where-it-will-be-used)
  - **Step 3**: Enable the feature flag [link](#step-3-enable-the-feature-flag)
- Test a feature flag [link](#test-a-feature-flag)
- QA [link](#qa)
- Release a feature [link](#release-a-feature)
- Remove a Feature Flag [link](#remove-a-feature-flag)

## Echo

We want the ability to turn a feature off remotely if something goes wrong.

We do that by adding flag in our remote feature configuration service, [Echo](https://github.com/artsy/echo)

This way we can independently of eigen turn features on and off, which can come in handy in case of bad case scenarios for example.

## How to Develop a Feature in Eigen

A feature flag in eigen is a boolean value that decides whether a particular feature should be available in the app.

Whether this value is 'true' or 'false' depends on two things:

- Is the feature ready for release
- Has the feature been added to [echo](https://github.com/artsy/echo).

To illustrate how these two work together, let's go through an example together.

## Add a feature flag

Let's say you want to add a new feature, called "Marketing Banners".

We'll add a new feature flag called `ARShowMarketingBanner` (this naming is a convention we borrow from Objective-C).

### Step 1: Configure the feature flag on features.ts

First you need to add the new feature block in `src/app/store/config/features.ts`

```diff
   AROptionsNewFirstInquiry: {
     readyForRelease: true,
     echoFlagKey: "AROptionsNewFirstInquiry",
   },
+  ARShowMarketingBanner: {
+    readyForRelease: false,
+    description: "Show new marketing banners",
+    showInAdminMenu: true,
+  },
   AROptionsInquiryCheckout: {
     readyForRelease: false,
     description: "Enable inquiry checkout",
     showInAdminMenu: true,
   }
```

The `description` property is what makes it possible to override the feature flag from the [admin menu](/admin_menu.md).

We also need to add a flag in Echo, our remote feature flags configuration service.
[Here](https://github.com/artsy/echo/commit/978a103e2c67a8010fabb2184f84aaef31d16f93) is an example PR for how to do that.

After adding the echo key, and the PR is merged, update you local copy of echo by running `./scripts/update-echo`.

With this setup, the echo flag will be the source of truth for whether or not to enable the feature.

### Step 2: Place the feature flag in the part of code where it will be used

you can to call it by using the `useFeatureFlag` hook.

```diff

+ const showBanner = useFeatureFlag("ARShowMarketingBanner")

  return (
    <>
      <TitleView />
      <SummaryView />
+     { showBanner && <MarketingBanner /> }
    <>
  )
```

#### If you use a feature flag outside of a functional react component

We also have `unsafe_getFeatureFlag("ARShowMarketingBanner")` which is not recommended, for feature flags outside of functional react components.

This is marked as unsafe because it will not cause react components to re-render, but it safe to use in non-reactive contexts, like an `onPress` handler.

### Step 3: Enable the feature flag

To enable your feature on a physical or virtual device

- Open the admin menu by pressing `command + control + z` on a mac. If this doesn't work:

  - Log in to the app with an admin account (eg your artsy email)
  - Enable Developer mode by going to Profile > About and tapping "Version" 7 times.
  - See a notification "Developer mode enabled"
  - Now if you press `command + control + z` you should see the Admin Menu

- Toggle the feature flag to "Yes".

![Screenshot 2022-03-10 at 15 43 52](https://user-images.githubusercontent.com/36475005/157685742-51e8b58d-9a87-441c-a2d7-184bfa0adc45.png)

## Test a feature flag

There is a utility method that can be used by tests that need to override a feature flag.

```ts
__globalStoreTestUtils__?.injectFeatureFlags({ ARShowMarketingBanner: true })
```

## QA

You can find documentation about how to do QA on the new shiny feature [here](https://www.notion.so/artsy/Setting-up-a-QA-script-for-a-New-Feature-from-a-non-MX-Team-5569acfd38f84c4b80e9af5c1d5389e8).

There is also the general QA page [here](https://www.notion.so/artsy/QA-decba0c3a57a4508b726f3a8624ceca3).

## Release a feature

Your feature is ready for release 🎉

Let's go to `src/app/store/config/features.ts` find our feature and set `readyForRelease` to `true`.

Consider also removing the entry from the admin menu if developers will no longer need to override the flag, by setting showInAdminMenu to false.

```diff
   ARShowMarketingBanner: {
-    readyForRelease: false,
+    readyForRelease: true,
     description: "Show new marketing banners",
-    showInAdminMenu: true,
+    showInAdminMenu: false,
   },
```

Alternatively, or at some point in the future, you can simply delete the feature flag and all the conditional branches associated with it.

Then when you mark the feature as being ready for release you can link the feature to the echo flag by specifying the key.

```diff
   ARShowMarketingBanner: {
-    readyForRelease: false,
+    readyForRelease: true,
     echoFlagKey: "ARShowMarketingBanner"
     description: "Show new marketing banners",
   },
```

[Here](https://github.com/artsy/echo/pull/70/files) is an example PR for how to do that.

## Remove a Feature Flag

Once the feature flag is no longer needed:

- Removed it from the `src/app/store/config/features.ts` file

```diff
   AROptionsNewFirstInquiry: {
     readyForRelease: true,
     echoFlagKey: "AROptionsNewFirstInquiry",
   },
-  ARShowMarketingBanner: {
-    readyForRelease: false,
-    description: "Show new marketing banners",
-   showInAdminMenu: true,
-  },
   AROptionsInquiryCheckout: {
     readyForRelease: false,
     description: "Enable inquiry checkout",
     showInAdminMenu: true,
   }
```

- Remove the `echoFlagKey` from echo: [example](https://github.com/artsy/echo/pull/86).
  It is adviced to give it a few months buffer before doing that, so that all users can get the new version of the app with the flag removed.

## Need some Help?

Just ask in #practice-mobile slack channel, we are happy to assist!
