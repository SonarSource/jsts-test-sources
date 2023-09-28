import { StackScreenProps } from "@react-navigation/stack"
import { useFormikContext } from "formik"
import { Flex, Input } from "palette"
import { useColor } from "palette/hooks"
import React, { useState } from "react"
import { Keyboard } from "react-native"
import { EmailSubscriptionCheckbox } from "./EmailSubscriptionCheckbox"
import {
  FormikSchema,
  OnboardingCreateAccountNavigationStack,
  OnboardingCreateAccountScreenWrapper,
} from "./OnboardingCreateAccount"
import { TermsOfServiceCheckbox } from "./TermsOfServiceCheckbox"

export interface OnboardingCreateAccountNameProps
  extends StackScreenProps<OnboardingCreateAccountNavigationStack, "OnboardingCreateAccountName"> {}

export const OnboardingCreateAccountName: React.FC<OnboardingCreateAccountNameProps> = ({
  navigation,
}) => {
  const color = useColor()
  const { values, handleSubmit, handleChange, errors, setErrors, setFieldValue } =
    useFormikContext<FormikSchema>()
  const [highlightTerms, setHighlightTerms] = useState<boolean>(false)

  return (
    <OnboardingCreateAccountScreenWrapper
      onBackButtonPress={navigation.goBack}
      title="What’s your full name?"
      caption="This is used to build your profile and collection on Artsy."
    >
      <Input
        autoCapitalize="words"
        autoComplete="name"
        autoCorrect={false}
        autoFocus
        onChangeText={(text) => {
          if (errors.name) {
            setErrors({
              name: undefined,
            })
          }
          handleChange("name")(text)
        }}
        onSubmitEditing={() => {
          Keyboard.dismiss()
          requestAnimationFrame(() => {
            if (values.acceptedTerms) {
              handleSubmit()
            } else {
              setHighlightTerms(true)
            }
          })
        }}
        blurOnSubmit={false}
        placeholder="First and last name"
        placeholderTextColor={color("black30")}
        returnKeyType="done"
        maxLength={128}
        value={values.name}
        error={errors.name}
        testID="nameInput"
      />

      <Flex my={2}>
        <TermsOfServiceCheckbox
          setChecked={() => setFieldValue("acceptedTerms", !values.acceptedTerms)}
          checked={values.acceptedTerms}
          error={highlightTerms}
          navigation={navigation}
        />
        <EmailSubscriptionCheckbox
          setChecked={() => setFieldValue("agreedToReceiveEmails", !values.agreedToReceiveEmails)}
          checked={values.agreedToReceiveEmails}
        />
      </Flex>
    </OnboardingCreateAccountScreenWrapper>
  )
}
