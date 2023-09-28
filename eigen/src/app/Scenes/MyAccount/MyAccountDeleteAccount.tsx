import { useNavigation } from "@react-navigation/native"
import { DeleteAccountInput } from "__generated__/deleteUserAccountMutation.graphql"
import { MyAccountDeleteAccount_me$data } from "__generated__/MyAccountDeleteAccount_me.graphql"
import { MyAccountDeleteAccountQuery } from "__generated__/MyAccountDeleteAccountQuery.graphql"
import { defaultEnvironment } from "app/relay/createEnvironment"
import { GlobalStore } from "app/store/GlobalStore"
import renderWithLoadProgress from "app/utils/renderWithLoadProgress"
import { AuctionIcon, Box, Button, Flex, GenomeIcon, Input, Spacer, Text } from "palette"
import React, { useState } from "react"
import { Alert, InteractionManager } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { createFragmentContainer, graphql, QueryRenderer } from "react-relay"
import { ArtsyKeyboardAvoidingView } from "shared/utils"
import { color } from "styled-system"
import { deleteUserAccount } from "./deleteUserAccount"

const ICON_SIZE = 16

interface MyAccountDeleteAccountProps {
  me: MyAccountDeleteAccount_me$data
}

const MyAccountDeleteAccount: React.FC<MyAccountDeleteAccountProps> = ({ me: { hasPassword } }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [explanation, setExplanation] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const navigation = useNavigation()

  const enableDelete = hasPassword
    ? password.length > 0 && explanation.length > 0
    : explanation.length > 0

  return (
    <ArtsyKeyboardAvoidingView>
      <ScrollView>
        <Box pr="2" pl="2">
          <Text variant="lg" mt="6">
            Delete My Account
          </Text>
          <Spacer mt="3" />
          <Text>Are you sure you want to delete your account?</Text>
          <Spacer mt="2" />
          <Text>If you delete your account:</Text>
          <Spacer mt="2" />
          <Flex flexDirection="row" alignItems="center" pr="1">
            <Flex pb={1}>
              <GenomeIcon width={ICON_SIZE} height={ICON_SIZE} />
            </Flex>
            <Text variant="xs" color={color("black100")} px="1" pb="1px">
              {
                "You will lose all data on Artsy including all existing offers, inquiries and mesages with Galleries"
              }
            </Text>
          </Flex>
          <Spacer mt="2" />
          <Flex flexDirection="row" alignItems="center" pr="1">
            <Flex pb={1}>
              <AuctionIcon width={ICON_SIZE} height={ICON_SIZE} />
            </Flex>
            <Text variant="xs" color={color("black100")} px="1" pb="1px">
              {
                "You won’t have access to any exclusive Artsy benefits, such as Artsy Curated Auctions, Private Sales, etc"
              }
            </Text>
          </Flex>
          <Spacer mt="3" />
          <Input
            multiline
            placeholder="Please share with us why you are leaving"
            onChangeText={setExplanation}
            error={!hasPassword ? error : undefined}
          />
          <Spacer mt="3" />
          <Text variant="xs" color={color("black100")} pb="1px">
            {
              "After you submit your request, we will disable your account. It may take up to 7 days to fully delete and remove all of your data."
            }
          </Text>
          <Spacer mt="2" />
          {!!hasPassword && (
            <>
              <Input
                secureTextEntry
                placeholder="Enter your password to continue"
                onChangeText={setPassword}
                error={error}
              />
              <Spacer mt="2" />
            </>
          )}
          <Button
            block
            disabled={!enableDelete}
            loading={loading}
            onPress={async () => {
              try {
                setLoading(true)
                setError("")
                const input: DeleteAccountInput = {
                  explanation,
                  password,
                }
                const result = await deleteUserAccount(input)
                const mutationError =
                  result.deleteMyAccountMutation?.userAccountOrError?.mutationError

                //  Failed to request account deletion
                if (mutationError?.message) {
                  setError(mutationError?.message)
                  return
                }
                //  Account deleted request submitted successfully
                Alert.alert(
                  "Account deletion request submitted!",
                  "It may take up to 7 days to fully delete and remove all of your data."
                )
                InteractionManager.runAfterInteractions(() => {
                  GlobalStore.actions.auth.signOut()
                })
              } catch (e: any) {
                setError("Something went wrong")
              } finally {
                setLoading(false)
              }
            }}
          >
            Delete My Account
          </Button>
          <Spacer mt="1" />
          <Button block variant="outline" onPress={() => navigation.goBack()}>
            Cancel
          </Button>
        </Box>
      </ScrollView>
    </ArtsyKeyboardAvoidingView>
  )
}

export const MyAccountDeleteAccountFragmentContainer = createFragmentContainer(
  MyAccountDeleteAccount,
  {
    me: graphql`
      fragment MyAccountDeleteAccount_me on Me {
        hasPassword
      }
    `,
  }
)

export const MyAccountDeleteAccountQueryRenderer: React.FC = () => {
  return (
    <QueryRenderer<MyAccountDeleteAccountQuery>
      environment={defaultEnvironment}
      query={graphql`
        query MyAccountDeleteAccountQuery {
          me {
            ...MyAccountDeleteAccount_me
          }
        }
      `}
      variables={{}}
      render={renderWithLoadProgress(MyAccountDeleteAccountFragmentContainer)}
    />
  )
}
