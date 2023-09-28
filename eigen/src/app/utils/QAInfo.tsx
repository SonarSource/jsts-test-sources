import Clipboard from "@react-native-community/clipboard"
import { useToast } from "app/Components/Toast/toastHook"
import { useDevToggle } from "app/store/GlobalStore"
import { Flex, FlexProps, Text, Touchable, useColor } from "palette"
import React from "react"

export const QAInfoPanel: React.FC<
  Omit<FlexProps, "children"> & { info: Array<[string, string]> }
> = (props) => (
  <QAInfoManualPanel {...props}>
    {props.info.map(([key, value]) => (
      <QAInfoRow key={key} name={key} value={value} />
    ))}
  </QAInfoManualPanel>
)

export const QAInfoManualPanel: React.FC<FlexProps> = (props) => {
  const enabled = useDevToggle("DTShowQuickAccessInfo")
  if (!enabled) {
    return null
  }

  return <Flex borderColor="devpurple" borderWidth={1} {...props} />
}

export const QAInfoRow: React.FC<{ name: string; value: string }> = ({ name, value }) => {
  const color = useColor()
  const toast = useToast()

  return (
    <Flex flexDirection="row">
      <Text>{name}: </Text>
      <Touchable
        underlayColor={color("black5")}
        haptic
        onPress={() => {
          Clipboard.setString(value)
          toast.show("Copied", "middle")
        }}
      >
        <Text fontWeight="bold">{value}</Text>
      </Touchable>
    </Flex>
  )
}
