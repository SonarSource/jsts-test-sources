import { useActionSheet } from "@expo/react-native-action-sheet"
import { GlobalStore } from "app/store/GlobalStore"
import { Flex, Text, Touchable, useColor } from "palette"
import { useEffect, useState } from "react"
import { Animated } from "react-native"
import useTimeoutFn from "react-use/lib/useTimeoutFn"
import { useScreenDimensions } from "shared/hooks"
import { ToastDetails, ToastDuration } from "./types"

const AnimatedFlex = Animated.createAnimatedComponent(Flex)

const MIDDLE_TOAST_SIZE = 120
const EDGE_TOAST_HEIGHT = 60
const EDGE_TOAST_PADDING = 10
const NAVBAR_HEIGHT = 44
const TABBAR_HEIGHT = 50

export const TOAST_DURATION_MAP: Record<ToastDuration, number> = {
  short: 2500,
  long: 5000,
}

export const ToastComponent: React.FC<ToastDetails> = ({
  id,
  positionIndex,
  placement,
  message,
  onPress,
  Icon,
  backgroundColor = "black100",
  duration = "short",
}) => {
  const toastDuration = TOAST_DURATION_MAP[duration]
  const color = useColor()
  const { width, height } = useScreenDimensions()
  const { top: topSafeAreaInset, bottom: bottomSafeAreaInset } =
    useScreenDimensions().safeAreaInsets
  const [opacityAnim] = useState(new Animated.Value(0))

  const { showActionSheetWithOptions } = useActionSheet()

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      useNativeDriver: true,
      duration: 150,
    }).start()
  }, [])

  useTimeoutFn(() => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      useNativeDriver: true,
      duration: 450,
    }).start(() => GlobalStore.actions.toast.remove(id))
  }, toastDuration)

  if (placement === "middle") {
    const innerMiddle = (
      <Flex flex={1} alignItems="center" justifyContent="center">
        {Icon !== undefined ? <Icon fill="white100" width={45} height={45} /> : null}
        <Text variant="xs" color="white100" textAlign="center" px={0.5}>
          {message}
        </Text>
      </Flex>
    )

    return (
      <AnimatedFlex
        width={MIDDLE_TOAST_SIZE}
        height={MIDDLE_TOAST_SIZE}
        position="absolute"
        top={(height - MIDDLE_TOAST_SIZE) / 2}
        left={(width - MIDDLE_TOAST_SIZE) / 2}
        backgroundColor={color(backgroundColor)}
        opacity={opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] })}
        overflow="hidden"
        paddingRight={2}
        zIndex={999}
      >
        {onPress !== undefined ? (
          <Touchable
            style={{ flex: 1 }}
            onPress={() => onPress({ id, showActionSheetWithOptions })}
            underlayColor={color("black60")}
          >
            {innerMiddle}
          </Touchable>
        ) : (
          innerMiddle
        )}
      </AnimatedFlex>
    )
  }

  const innerTopBottom = (
    <Flex flex={1} flexDirection="row" alignItems="center" mx="2">
      {Icon !== undefined ? <Icon fill="white100" width={25} height={25} mr="1" /> : null}
      <Text variant="xs" color="white100">
        {message}
      </Text>
    </Flex>
  )

  return (
    <AnimatedFlex
      position="absolute"
      left="1"
      right="1"
      height={EDGE_TOAST_HEIGHT}
      bottom={
        placement === "bottom"
          ? bottomSafeAreaInset +
            TABBAR_HEIGHT +
            EDGE_TOAST_PADDING +
            positionIndex * (EDGE_TOAST_HEIGHT + EDGE_TOAST_PADDING)
          : undefined
      }
      top={
        placement === "top"
          ? topSafeAreaInset +
            NAVBAR_HEIGHT +
            EDGE_TOAST_PADDING +
            positionIndex * (EDGE_TOAST_HEIGHT + EDGE_TOAST_PADDING)
          : undefined
      }
      backgroundColor={color(backgroundColor)}
      opacity={opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })}
      overflow="hidden"
      paddingRight={2}
      zIndex={999}
    >
      {onPress !== undefined ? (
        <Touchable
          style={{ flex: 1 }}
          onPress={() => onPress({ id, showActionSheetWithOptions })}
          underlayColor={color("black60")}
        >
          {innerTopBottom}
        </Touchable>
      ) : (
        innerTopBottom
      )}
    </AnimatedFlex>
  )
}
