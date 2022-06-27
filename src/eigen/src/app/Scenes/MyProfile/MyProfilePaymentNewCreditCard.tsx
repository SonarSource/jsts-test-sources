import { MyProfilePaymentNewCreditCardSaveCardMutation } from "__generated__/MyProfilePaymentNewCreditCardSaveCardMutation.graphql"
import { CountrySelect } from "app/Components/CountrySelect"
import { Stack } from "app/Components/Stack"
import { defaultEnvironment } from "app/relay/createEnvironment"
import { Action, action, computed, Computed, createComponentStore } from "easy-peasy"
import { Input, InputTitle } from "palette"
import { Select } from "palette/elements/Select/SelectV2"
import React, { useEffect, useRef } from "react"
import { commitMutation, graphql } from "react-relay"
// @ts-ignore
import stripe from "tipsi-stripe"
import { MyAccountFieldEditScreen } from "../MyAccount/Components/MyAccountFieldEditScreen"
import { __triggerRefresh } from "./MyProfilePayment"

import { LiteCreditCardInput } from "react-native-credit-card-input"

interface CreditCardInputParams {
  cvc: string
  expMonth: number
  expYear: number
  number: string
}

interface FormField<Type = string> {
  value: Type | null
  touched: boolean
  required: boolean
  isPresent: Computed<this, boolean>
  setValue: Action<this, Type>
}
const emptyFieldState: () => FormField<any> = () => ({
  value: null,
  touched: false,
  required: true,
  isPresent: computed((self) => {
    if (!self.required) {
      return true
    } else {
      return self.value !== null && (typeof self.value !== "string" || !!self.value)
    }
  }),
  setValue: action((state, payload) => {
    state.value = payload
  }),
})

interface FormFields {
  creditCard: FormField<{
    valid: boolean
    params: CreditCardInputParams
  }>
  fullName: FormField
  addressLine1: FormField
  addressLine2: FormField
  city: FormField
  postCode: FormField
  state: FormField
  country: FormField
}

interface Store {
  fields: FormFields
  allPresent: Computed<Store, boolean>
}

const useStore = createComponentStore<Store>({
  fields: {
    creditCard: emptyFieldState(),
    fullName: emptyFieldState(),
    addressLine1: emptyFieldState(),
    addressLine2: { ...emptyFieldState(), required: false },
    city: emptyFieldState(),
    postCode: emptyFieldState(),
    state: emptyFieldState(),
    country: emptyFieldState(),
  },
  allPresent: computed((store) => {
    return Boolean(
      Object.keys(store.fields).every((k) => store.fields[k as keyof FormFields].isPresent) &&
        store.fields.creditCard.value?.valid
    )
  }),
})

export const MyProfilePaymentNewCreditCard: React.FC<{}> = ({}) => {
  const [state, actions] = useStore()
  const paymentInfoRef = useRef<any>(null)

  const addressLine1Ref = useRef<Input>(null)
  const addressLine2Ref = useRef<Input>(null)
  const cityRef = useRef<Input>(null)
  const postalCodeRef = useRef<Input>(null)
  const stateRef = useRef<Input>(null)
  const countryRef = useRef<Select<any>>(null)

  // focus top field on mount
  useEffect(() => {
    paymentInfoRef.current?.focus()
  }, [])

  const screenRef = useRef<MyAccountFieldEditScreen>(null)

  return (
    <MyAccountFieldEditScreen
      ref={screenRef}
      canSave={state.allPresent}
      title="Add new card"
      onSave={async (dismiss, alert) => {
        try {
          const stripeResult = await stripe.createTokenWithCard({
            ...state.fields.creditCard.value?.params,
            name: state.fields.fullName.value,
            addressLine1: state.fields.addressLine1.value,
            addressLine2: state.fields.addressLine2.value,
            addressCity: state.fields.city.value,
            addressState: state.fields.state.value,
            addressCountry: state.fields.country.value,
            addressZip: state.fields.postCode.value,
          })
          if (!stripeResult?.tokenId) {
            throw new Error(
              `Unexpected stripe card tokenization result ${JSON.stringify(stripeResult)}`
            )
          }
          const gravityResult = await saveCreditCard(stripeResult.tokenId)
          if (gravityResult.createCreditCard?.creditCardOrError?.creditCard) {
            await __triggerRefresh?.()
          } else {
            // TODO: we can probably present these errors to the user?
            throw new Error(
              `Error trying to save card ${JSON.stringify(
                gravityResult.createCreditCard?.creditCardOrError?.mutationError
              )}`
            )
          }
          dismiss()
        } catch (e) {
          console.error(e)
          alert(
            "Something went wrong while attempting to save your credit card. Please try again or contact us."
          )
        }
      }}
    >
      <Stack spacing={2}>
        <>
          <InputTitle>Credit Card</InputTitle>
          <LiteCreditCardInput
            ref={paymentInfoRef}
            onChange={(e) => {
              actions.fields.creditCard.setValue({
                valid: e.valid,
                params: {
                  cvc: e.values.cvc,
                  expMonth: Number(e.values.expiry.split("/")[0]),
                  expYear: Number(e.values.expiry.split("/")[1]),
                  number: e.values.number,
                },
              })
            }}
          />
        </>

        <Input
          title="Name on card"
          placeholder="Full name"
          onChangeText={actions.fields.fullName.setValue}
          returnKeyType="next"
          onSubmitEditing={() => addressLine1Ref.current?.focus()}
        />
        <Input
          ref={addressLine1Ref}
          title="Address line 1"
          placeholder="Add street address"
          onChangeText={actions.fields.addressLine1.setValue}
          returnKeyType="next"
          onSubmitEditing={() => addressLine2Ref.current?.focus()}
        />
        <Input
          ref={addressLine2Ref}
          title="Address line 2"
          optional
          placeholder="Add apt, floor, suite, etc."
          onChangeText={actions.fields.addressLine2.setValue}
          returnKeyType="next"
          onSubmitEditing={() => cityRef.current?.focus()}
        />
        <Input
          ref={cityRef}
          title="City"
          placeholder="Add city"
          onChangeText={actions.fields.city.setValue}
          returnKeyType="next"
          onSubmitEditing={() => postalCodeRef.current?.focus()}
        />
        <Input
          ref={postalCodeRef}
          title="Postal Code"
          placeholder="Add postal code"
          onChangeText={actions.fields.postCode.setValue}
          returnKeyType="next"
          onSubmitEditing={() => stateRef.current?.focus()}
        />
        <Input
          ref={stateRef}
          title="State, province, or region"
          placeholder="Add state, province, or region"
          onChangeText={actions.fields.state.setValue}
          onSubmitEditing={() => {
            stateRef.current?.blur()
            screenRef.current?.scrollToEnd()
            setTimeout(() => {
              countryRef.current?.open()
            }, 100)
          }}
          returnKeyType="next"
        />
        <CountrySelect
          ref={countryRef}
          onSelectValue={actions.fields.country.setValue}
          value={state.fields.country.value}
        />
      </Stack>
    </MyAccountFieldEditScreen>
  )
}

const saveCreditCard = (token: string) => {
  return new Promise<MyProfilePaymentNewCreditCardSaveCardMutation["response"]>(
    (resolve, reject) => {
      commitMutation<MyProfilePaymentNewCreditCardSaveCardMutation>(defaultEnvironment, {
        mutation: graphql`
          mutation MyProfilePaymentNewCreditCardSaveCardMutation($input: CreditCardInput!) {
            createCreditCard(input: $input) {
              creditCardOrError {
                ... on CreditCardMutationSuccess {
                  creditCard {
                    internalID
                  }
                }
                ... on CreditCardMutationFailure {
                  mutationError {
                    detail
                    error
                    message
                  }
                }
              }
            }
          }
        `,
        onCompleted: resolve,
        onError: reject,
        variables: {
          input: {
            oneTimeUse: false,
            token,
          },
        },
      })
    }
  )
}
