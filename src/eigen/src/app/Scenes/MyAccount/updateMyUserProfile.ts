import {
  UpdateMyProfileInput,
  updateMyUserProfileMutation,
} from "__generated__/updateMyUserProfileMutation.graphql"
import { defaultEnvironment } from "app/relay/createEnvironment"
import { commitMutation, Environment, graphql } from "react-relay"

export const updateMyUserProfile = async (
  input: UpdateMyProfileInput = {},
  environment: Environment = defaultEnvironment
) => {
  await new Promise((resolve, reject) =>
    commitMutation<updateMyUserProfileMutation>(environment, {
      onCompleted: resolve,
      mutation: graphql`
        mutation updateMyUserProfileMutation($input: UpdateMyProfileInput!) {
          updateMyUserProfile(input: $input) {
            me {
              email
              name
              phone
              profession
              otherRelevantPositions
              bio
              icon {
                internalID
                imageURL
              }
              location {
                display
                city
                state
                country
              }
              lengthUnitPreference
              currencyPreference
              receiveLotOpeningSoonNotification
              receiveNewSalesNotification
              receiveNewWorksNotification
              receiveOutbidNotification
              receivePromotionNotification
              receivePurchaseNotification
              receiveSaleOpeningClosingNotification
            }
          }
        }
      `,
      variables: { input },
      onError: (e) => {
        // try to get a user-facing error message
        try {
          const message = JSON.parse(JSON.stringify(e))?.res?.json?.errors?.[0]?.message ?? ""
          // should be like "https://api.artsy.net/api/v1/me?email=david@artsymail.com - {"error": "User-facing error message"}"
          if (typeof message === "string") {
            const jsonString = message.match(/http.* (\{.*)$/)?.[1]
            if (jsonString) {
              const json = JSON.parse(jsonString)
              if (typeof json?.error === "string") {
                reject(json.error)
                return
              }
              if (typeof json?.message === "string") {
                reject(json.message)
                return
              }
            }
          }
        } catch (e) {
          // fall through
        }
        reject("Something went wrong")
      },
    })
  )
}
