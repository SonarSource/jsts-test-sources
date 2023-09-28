import { appleAuth } from "@invertase/react-native-apple-authentication"
import Cookies from "@react-native-cookies/cookies"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { LegacyNativeModules } from "app/NativeModules/LegacyNativeModules"
import { mockPostEventToProviders } from "app/tests/globallyMockedStuff"
import { AccessToken, GraphRequest, LoginManager } from "react-native-fbsdk-next"
import Keychain from "react-native-keychain"
import { AuthError } from "./AuthError"
import { __globalStoreTestUtils__, GlobalStore } from "./GlobalStore"

jest.unmock("app/NativeModules/LegacyNativeModules")

const mockFetch = jest.fn()
;(global as any).fetch = mockFetch

function mockFetchResponseOnce(response: Partial<Response>) {
  mockFetch.mockResolvedValueOnce(response)
}
function mockFetchJsonOnce(json: object, status: number = 200) {
  mockFetch.mockResolvedValueOnce({
    status,
    json: () => Promise.resolve(json),
  })
}

beforeEach(() => {
  mockFetch.mockClear()
})

describe("AuthModel", () => {
  describe("xapp_token for making onboarding requests", () => {
    it("can be fetched from gravity", async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      const token = await GlobalStore.actions.auth.getXAppToken()

      expect(token).toBe("my-special-token")
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchInlineSnapshot(
        `"https://stagingapi.artsy.net/api/v1/xapp_token?client_id=artsy_api_client_key&client_secret=artsy_api_client_secret"`
      )
    })

    it("are saved to the store", async () => {
      expect(__globalStoreTestUtils__?.getCurrentState().auth.xAppToken).toBe(null)

      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()

      expect(__globalStoreTestUtils__?.getCurrentState().auth.xAppToken).toBe("my-special-token")
      expect(__globalStoreTestUtils__?.getCurrentState().auth.xApptokenExpiresIn).toBe("never")
    })

    it("will not be fetched more than once", async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
      const token = await GlobalStore.actions.auth.getXAppToken()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(token).toBe("my-special-token")
    })
  })

  describe("userExists", () => {
    beforeEach(async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
    })

    it("makes a request to gravity's /user endpoint", async () => {
      mockFetchResponseOnce({ status: 200 })
      await GlobalStore.actions.auth.userExists({ email: "user@example.com" })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch.mock.calls[0][0]).toMatchInlineSnapshot(
        `"https://stagingapi.artsy.net/api/v1/user?email=user%40example.com"`
      )
    })

    it("returns true if response is 200", async () => {
      mockFetchResponseOnce({ status: 200 })
      const result = await GlobalStore.actions.auth.userExists({ email: "user@example.com" })

      expect(result).toBe(true)
    })

    it("returns false if response is 404", async () => {
      mockFetchResponseOnce({ status: 404 })
      const result = await GlobalStore.actions.auth.userExists({ email: "user@example.com" })

      expect(result).toBe(false)
    })

    it("throws an error if something else happened", async () => {
      mockFetchResponseOnce({ status: 500, json: () => Promise.resolve({ error: "bad times" }) })
      let error: Error | null = null
      try {
        await GlobalStore.actions.auth.userExists({ email: "user@example.com" })
      } catch (e) {
        error = e as Error
      }

      expect(error).not.toBe(null)
      expect(error).toMatchInlineSnapshot(`[Error: {"error":"bad times"}]`)
    })
  })

  describe("signIn", () => {
    beforeEach(async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
    })

    it("tries to get an access token from gravity", async () => {
      mockFetchJsonOnce(
        {
          access_token: "my-access-token",
          expires_in: "a billion years",
        },
        201
      )
      mockFetchJsonOnce({
        id: "my-user-id",
      })

      const result = await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })

      expect(result).toBe("success")

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[0][0]).toMatchInlineSnapshot(
        `"https://stagingapi.artsy.net/oauth2/access_token"`
      )
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toMatchInlineSnapshot(`
        Object {
          "client_id": "artsy_api_client_key",
          "client_secret": "artsy_api_client_secret",
          "email": "user@example.com",
          "grant_type": "credentials",
          "oauth_provider": "email",
          "password": "hunter2",
          "scope": "offline_access",
        }
      `)
    })

    it("fetches the user ID, then saves the token and expiry date in the store", async () => {
      mockFetchJsonOnce(
        {
          access_token: "my-access-token",
          expires_in: "a billion years",
        },
        201
      )
      mockFetchJsonOnce({
        id: "my-user-id",
      })
      await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })

      expect(__globalStoreTestUtils__?.getCurrentState().auth.userAccessToken).toBe(
        "my-access-token"
      )
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userAccessTokenExpiresIn).toBe(
        "a billion years"
      )
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userID).toBe("my-user-id")
    })

    it("tracks successful login event", async () => {
      mockFetchJsonOnce({ access_token: "my-access-token", expires_in: "a billion years" }, 201)
      mockFetchJsonOnce({ id: "my-user-id" })

      await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })

      expect(mockPostEventToProviders).toHaveBeenCalledTimes(1)
      expect(mockPostEventToProviders.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "successfullyLoggedIn",
            "service": "email",
          },
        ]
      `)
    })

    it("returns 'failure' if the token creation fails", async () => {
      mockFetchJsonOnce({ error: "bad times" }, 500)
      const result = await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })
      expect(result).toBe("failure")
    })

    it("does not clear recent searches if user id has not changed after the previous session", async () => {
      const clearRecentSearchesSpy = jest.spyOn(GlobalStore.actions.search, "clearRecentSearches")
      __globalStoreTestUtils__?.injectState({
        auth: {
          userID: null,
          previousSessionUserID: "my-user-id",
        },
      })
      mockFetchJsonOnce({ access_token: "my-access-token" }, 201)
      mockFetchJsonOnce({
        id: "my-user-id",
      })
      await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })
      expect(clearRecentSearchesSpy).not.toHaveBeenCalled()
    })

    it("clears recent searches if user id has changed after the previous session", async () => {
      const clearRecentSearchesSpy = jest.spyOn(GlobalStore.actions.search, "clearRecentSearches")
      __globalStoreTestUtils__?.injectState({
        auth: {
          userID: null,
          previousSessionUserID: "prev-user-id",
        },
      })
      mockFetchJsonOnce({ access_token: "my-access-token" }, 201)
      mockFetchJsonOnce({
        id: "my-user-id",
      })
      await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })
      expect(clearRecentSearchesSpy).toHaveBeenCalled()
    })

    it("saves credentials to keychain", async () => {
      mockFetchJsonOnce({ access_token: "my-access-token" }, 201)
      mockFetchJsonOnce({ id: "my-user-id" })
      await GlobalStore.actions.auth.signIn({
        oauthProvider: "email",
        email: "user@example.com",
        password: "hunter2",
      })
      expect(Keychain.setInternetCredentials).toHaveBeenCalled()
    })
  })

  describe("signUp", () => {
    beforeEach(async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
    })

    it("creates the user account, fetches the user ID, then saves the onboardingState, token and expiry date in the store", async () => {
      mockFetchResponseOnce({ status: 201 })
      mockFetchJsonOnce(
        {
          access_token: "my-access-token",
          expires_in: "a billion years",
        },
        201
      )
      mockFetchJsonOnce({
        id: "my-user-id",
      })
      const result = await GlobalStore.actions.auth.signUp({
        oauthProvider: "email",
        email: "user@example.com",
        password: "validpassword",
        name: "full name",
        agreedToReceiveEmails: false,
      })

      expect(result.success).toBe(true)
      expect(__globalStoreTestUtils__?.getCurrentState().auth.onboardingState).toBe("incomplete")
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userAccessToken).toBe(
        "my-access-token"
      )
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userAccessTokenExpiresIn).toBe(
        "a billion years"
      )
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userID).toBe("my-user-id")
    })

    it("returns false if the creating an account fails", async () => {
      mockFetchJsonOnce({ error: "bad times" }, 500)
      const result = await GlobalStore.actions.auth.signUp({
        oauthProvider: "email",
        email: "user@example.com",
        password: "validpassword",
        name: "full name",
        agreedToReceiveEmails: false,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("authFacebook", () => {
    beforeEach(async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
      ;(LoginManager.logInWithPermissions as jest.Mock).mockReturnValue({ isCancelled: false })
      ;(AccessToken.getCurrentAccessToken as jest.Mock).mockReturnValue({
        accessToken: "facebook-token",
      })
      ;(GraphRequest as jest.Mock).mockImplementation((_route, _config, callback) => {
        callback(undefined, { email: "emailFromFacebook@email.com", name: "name from facebook" })
      })
    })

    it("throws an error when email permission was denied", async () => {
      ;(LoginManager.logInWithPermissions as jest.Mock).mockReturnValue({
        declinedPermissions: ["email"],
      })

      const result = await GlobalStore.actions.auth
        .authFacebook({ signInOrUp: "signUp", agreedToReceiveEmails: true })
        .catch((e) => e)

      expect(LoginManager.logInWithPermissions).toHaveBeenCalledWith(["public_profile", "email"])
      const expectedError = new AuthError(
        "Please allow the use of email to continue.",
        "Email Permission Declined"
      )
      expect(result).toMatchObject(expectedError)
    })

    it("throws an error if user don't have an email", async () => {
      ;(GraphRequest as jest.Mock).mockImplementation((_route, _config, callback) => {
        callback(undefined, { name: "name from facebook" })
      })

      const result = await GlobalStore.actions.auth
        .authFacebook({ signInOrUp: "signUp", agreedToReceiveEmails: true })
        .catch((e) => e)
      const expectedError = new AuthError(
        "There is no email associated with your Facebook account. Please log in using your email and password instead."
      )
      expect(result).toMatchObject(expectedError)
    })

    it("fetches access token from facebook", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({ success: true })) as any

      await GlobalStore.actions.auth.authFacebook({
        signInOrUp: "signUp",
        agreedToReceiveEmails: true,
      })

      expect(AccessToken.getCurrentAccessToken).toHaveBeenCalled()
    })

    it("throws an error if fetching data from facebook fails", async () => {
      ;(GraphRequest as jest.Mock).mockImplementation((_route, _config, callback) => {
        callback({ message: "fetching fb data error" }, undefined)
      })

      const result = await GlobalStore.actions.auth
        .authFacebook({ signInOrUp: "signUp", agreedToReceiveEmails: true })
        .catch((e) => e)
      const expectedError = new AuthError("fetching fb data error", "Error fetching facebook data")
      expect(result).toMatchObject(expectedError)
    })

    it("fetches profile info from facebook and signs up", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({ success: true })) as any

      await GlobalStore.actions.auth.authFacebook({
        signInOrUp: "signUp",
        agreedToReceiveEmails: true,
      })

      expect(GlobalStore.actions.auth.signUp).toHaveBeenCalledWith({
        email: "emailFromFacebook@email.com",
        name: "name from facebook",
        accessToken: "facebook-token",
        oauthProvider: "facebook",
        agreedToReceiveEmails: true,
      })
    })

    it("throws an error if sign up fails", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({
        success: false,
        message: "Could not sign up",
      })) as any

      const result = await GlobalStore.actions.auth
        .authFacebook({ signInOrUp: "signUp", agreedToReceiveEmails: true })
        .catch((e) => e)
      const expectedError = new AuthError("Could not sign up")
      expect(result).toMatchObject(expectedError)
    })

    it("fetches profile info from facebook and signs in", async () => {
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ email: "emailFromArtsy@mail.com" })
      GlobalStore.actions.auth.signIn = jest.fn(() => true) as any

      await GlobalStore.actions.auth.authFacebook({ signInOrUp: "signIn" })

      expect(GlobalStore.actions.auth.signIn).toHaveBeenCalledWith({
        email: "emailFromArtsy@mail.com",
        accessToken: "facebook-token",
        oauthProvider: "facebook",
      })
    })

    it("tracks the login event for social auth", async () => {
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ email: "emailFromArtsy@mail.com" })
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ id: "my-user-id" })

      await GlobalStore.actions.auth.authFacebook({ signInOrUp: "signIn" })

      expect(mockPostEventToProviders).toHaveBeenCalledTimes(1)
      expect(mockPostEventToProviders.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "successfullyLoggedIn",
            "service": "facebook",
          },
        ]
      `)
    })

    it("throws an error if getting X-ACCESS-TOKEN fails", async () => {
      mockFetchJsonOnce({ error_description: "getting X-ACCESS-TOKEN error" })

      const result = await GlobalStore.actions.auth
        .authFacebook({ signInOrUp: "signIn" })
        .catch((e) => e)
      const expectedError = new AuthError("Login attempt failed")
      expect(result).toMatchObject(expectedError)
    })
  })

  describe("authGoogle", () => {
    beforeEach(async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
      ;(GoogleSignin.hasPlayServices as jest.Mock).mockReturnValue(true)
      ;(GoogleSignin.signIn as jest.Mock).mockReturnValue({
        user: { email: "googleEmail@gmail.com", name: "name from google" },
      })
      ;(GoogleSignin.getTokens as jest.Mock).mockReturnValue({ accessToken: "google-token" })
    })

    it("throws an error if google play services are not available", async () => {
      ;(GoogleSignin.hasPlayServices as jest.Mock).mockReturnValue(false)

      const result = await GlobalStore.actions.auth
        .authGoogle({ signInOrUp: "signUp", agreedToReceiveEmails: true })
        .catch((e) => e)
      const expectedError = new AuthError("Play services are not available.")
      expect(result).toMatchObject(expectedError)
    })

    it("fetches profile info from google and signs up", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({ success: true })) as any

      await GlobalStore.actions.auth.authGoogle({
        signInOrUp: "signUp",
        agreedToReceiveEmails: false,
      })

      expect(GlobalStore.actions.auth.signUp).toHaveBeenCalledWith({
        email: "googleEmail@gmail.com",
        name: "name from google",
        accessToken: "google-token",
        oauthProvider: "google",
        agreedToReceiveEmails: false,
      })
    })

    it("throws an error if sign up fails", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({
        success: false,
        message: "Could not sign up",
      })) as any

      const result = await GlobalStore.actions.auth
        .authGoogle({ signInOrUp: "signUp", agreedToReceiveEmails: true })
        .catch((e) => e)
      const expectedError = new AuthError("Could not sign up")
      expect(result).toMatchObject(expectedError)
    })

    it("fetches profile info from google and signs in", async () => {
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ email: "emailFromArtsy@mail.com" })
      GlobalStore.actions.auth.signIn = jest.fn(() => true) as any

      await GlobalStore.actions.auth.authGoogle({ signInOrUp: "signIn" })

      expect(GlobalStore.actions.auth.signIn).toHaveBeenCalledWith({
        email: "emailFromArtsy@mail.com",
        accessToken: "google-token",
        oauthProvider: "google",
      })
    })

    it("tracks the event", async () => {
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ email: "emailFromArtsy@mail.com" })
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ id: "my-user-id" })

      await GlobalStore.actions.auth.authGoogle({ signInOrUp: "signIn" })

      expect(mockPostEventToProviders).toHaveBeenCalledTimes(1)
      expect(mockPostEventToProviders.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "successfullyLoggedIn",
            "service": "google",
          },
        ]
      `)
    })

    it("throws an error if getting X-ACCESS-TOKEN fails", async () => {
      mockFetchJsonOnce({ error_description: "getting X-ACCESS-TOKEN error" })

      const result = await GlobalStore.actions.auth
        .authGoogle({ signInOrUp: "signIn" })
        .catch((e) => e)
      const expectedError = new AuthError("Login attempt failed")
      expect(result).toMatchObject(expectedError)
    })
  })

  describe("authApple", () => {
    beforeEach(async () => {
      mockFetchJsonOnce({
        xapp_token: "my-special-token",
        expires_in: "never",
      })
      await GlobalStore.actions.auth.getXAppToken()
      mockFetch.mockClear()
      ;(appleAuth.performRequest as jest.Mock).mockReturnValue({
        email: "appleEmail@mail.com",
        identityToken: "apple-id-token",
        user: "appleUID",
      })
    })

    it("fetches profile info from apple and signs up", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({ success: true })) as any
      ;(appleAuth.performRequest as jest.Mock).mockReturnValue({
        identityToken: "apple-id-token",
        user: "appleUID",
        email: "appleEmail@mail.com",
        fullName: {
          givenName: "firstName",
          familyName: "lastName",
        },
      })

      await GlobalStore.actions.auth.authApple({ agreedToReceiveEmails: true })

      expect(GlobalStore.actions.auth.signUp).toHaveBeenCalledWith({
        email: "appleEmail@mail.com",
        name: "firstName lastName",
        appleUid: "appleUID",
        idToken: "apple-id-token",
        oauthProvider: "apple",
        agreedToReceiveEmails: true,
      })
    })

    it("fetches profile info from apple and signs in", async () => {
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ email: "emailFromArtsy@mail.com" })

      GlobalStore.actions.auth.signUp = jest.fn(() => ({
        error: "Another Account Already Linked",
      })) as any

      GlobalStore.actions.auth.signIn = jest.fn(() => "success") as any

      await GlobalStore.actions.auth.authApple({})

      expect(GlobalStore.actions.auth.signIn).toHaveBeenCalledWith({
        email: "emailFromArtsy@mail.com",
        appleUid: "appleUID",
        idToken: "apple-id-token",
        oauthProvider: "apple",
        onSignIn: undefined,
      })
    })

    it("tracks the event", async () => {
      GlobalStore.actions.auth.signUp = jest.fn(() => ({
        error: "Another Account Already Linked",
      })) as any
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ email: "emailFromArtsy@mail.com" })
      mockFetchJsonOnce({ access_token: "x-access-token" }, 201)
      mockFetchJsonOnce({ id: "my-user-id" })

      await GlobalStore.actions.auth.authApple({})

      expect(mockPostEventToProviders).toHaveBeenCalledTimes(1)
      expect(mockPostEventToProviders.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "action": "successfullyLoggedIn",
            "service": "apple",
          },
        ]
      `)
    })

    it("throws an error if getting X-ACCESS-TOKEN fails", async () => {
      mockFetchJsonOnce({ error_description: "getting X-ACCESS-TOKEN error" })
      GlobalStore.actions.auth.signUp = jest.fn(() => ({
        error: "Another Account Already Linked",
      })) as any
      const result = await GlobalStore.actions.auth.authApple({}).catch((e) => e)
      const expectedError = new AuthError("Login attempt failed")
      expect(result).toMatchObject(expectedError)
    })
  })

  describe("signOut action", () => {
    beforeEach(() => {
      __globalStoreTestUtils__?.injectState({
        sessionState: { isHydrated: true },
        auth: {
          userAccessToken: "user-access-token",
          userID: "user-id",
          previousSessionUserID: null,
        },
        search: {
          recentSearches: [
            {
              type: "AUTOSUGGEST_RESULT_TAPPED",
              props: {
                href: "/amoako-boafo",
                displayLabel: "Amoako Boafo",
              },
            },
          ],
        },
      })
    })

    it("clears all cookies", async () => {
      expect(Cookies.clearAll).not.toHaveBeenCalled()
      await GlobalStore.actions.auth.signOut()
      expect(Cookies.clearAll).toHaveBeenCalledTimes(1)
    })

    it("clears user data", async () => {
      expect(LegacyNativeModules.ArtsyNativeModule.clearUserData).not.toHaveBeenCalled()
      await GlobalStore.actions.auth.signOut()
      expect(LegacyNativeModules.ArtsyNativeModule.clearUserData).toHaveBeenCalledTimes(1)
    })

    it("clears user access token", async () => {
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userAccessToken).toBe(
        "user-access-token"
      )
      await GlobalStore.actions.auth.signOut()
      expect(__globalStoreTestUtils__?.getCurrentState().auth.userAccessToken).toBe(null)
    })

    it("saves user id as previousSessionUserID", async () => {
      await GlobalStore.actions.auth.signOut()
      expect(__globalStoreTestUtils__?.getCurrentState().auth.previousSessionUserID).toBe("user-id")
    })

    it("saves recent searches", async () => {
      await GlobalStore.actions.auth.signOut()
      expect(__globalStoreTestUtils__?.getCurrentState().search.recentSearches).toHaveLength(1)
      expect(__globalStoreTestUtils__?.getCurrentState().search.recentSearches[0]).toEqual(
        expect.objectContaining({
          type: "AUTOSUGGEST_RESULT_TAPPED",
          props: {
            href: "/amoako-boafo",
            displayLabel: "Amoako Boafo",
          },
        })
      )
    })
  })
})
