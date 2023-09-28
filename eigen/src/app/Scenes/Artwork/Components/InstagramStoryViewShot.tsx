import { useDevToggle } from "app/store/GlobalStore"
import { useSizeToFitScreen } from "app/utils/useSizeToFit"
import { ArtsyLogoBlackIcon, Flex, Text } from "palette"
import React, { RefObject } from "react"
import { Image } from "react-native"
import ViewShot from "react-native-view-shot"
import { useOffscreenStyle } from "shared/hooks"

/**
 * This component is used to generate an image to share in Instagram Stories.
 * The way we do this is we render what we want the image to have (artist name, arsty logo, etc)
 * completely off-screen, and we use viewshot to snap a png of the rendered component.
 */

const InstagramStoryBackgroundDimensions = {
  width: 1080, // in pixels, before we scale it
  height: 1920, // in pixels, before we scale it
}
const BottomLabelHeight = 350 // in pixels, before we scale it

export interface InstagramStoryViewShotProps {
  shotRef: RefObject<ViewShot>
  href: string
  artist: string
  title?: string
}

export const InstagramStoryViewShot: React.FC<InstagramStoryViewShotProps> = ({
  shotRef,
  href,
  artist,
  title,
}) => {
  const debugInstagramShot = useDevToggle("DTShowInstagramShot")
  const { width, height } = useSizeToFitScreen({
    width: InstagramStoryBackgroundDimensions.width,
    height: InstagramStoryBackgroundDimensions.height - BottomLabelHeight,
  })
  const offscreenStyle = useOffscreenStyle(debugInstagramShot)

  const scale = width / InstagramStoryBackgroundDimensions.width

  return (
    <Flex {...offscreenStyle} alignItems="center">
      <ViewShot
        ref={shotRef}
        options={{ format: "png", result: "base64" }}
        style={{ backgroundColor: "white" }}
      >
        <Image source={{ uri: href }} style={{ width, height }} resizeMode="contain" />

        <Flex
          mt={40 * scale}
          mb={180 * scale}
          px={50 * scale}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Flex flex={1}>
            <Text variant="md" weight="medium">
              {artist}
            </Text>
            {title ? (
              <Text variant="md" italic opacity={0.6} mt={10 * scale} ellipsizeMode="middle">
                {title}
              </Text>
            ) : null}
          </Flex>
          <ArtsyLogoBlackIcon scale={0.8} />
        </Flex>
      </ViewShot>
    </Flex>
  )
}
