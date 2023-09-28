import { CollapsibleArtworkDetails_artwork$data } from "__generated__/CollapsibleArtworkDetails_artwork.graphql"
import OpaqueImageView from "app/Components/OpaqueImageView/OpaqueImageView"
import ChevronIcon from "app/Icons/ChevronIcon"
import { ArtworkDetailsRow } from "app/Scenes/Artwork/Components/ArtworkDetailsRow"
import { Box, Collapse, Flex, Join, Separator, Spacer, Text } from "palette"
import React, { useState } from "react"
import { LayoutAnimation, ScrollView, TouchableOpacity } from "react-native"

import { createFragmentContainer, graphql } from "react-relay"

export interface CollapsibleArtworkDetailsProps {
  artwork: CollapsibleArtworkDetails_artwork$data
  hasSeparator?: boolean
}

const artworkDetailItems = (artwork: CollapsibleArtworkDetails_artwork$data) => {
  const items = [
    { title: "Price", value: artwork.saleMessage },
    { title: "Medium", value: artwork.category },
    { title: "Manufacturer", value: artwork.manufacturer },
    { title: "Publisher", value: artwork.publisher },
    { title: "Materials", value: artwork.medium },
    { title: "Classification", value: artwork.attributionClass?.name },
    {
      title: "Dimensions",
      value: [artwork.dimensions?.in, artwork.dimensions?.cm].filter((d) => d).join("\n"),
    },
    { title: "Signature", value: artwork.signatureInfo?.details },
    { title: "Frame", value: artwork.framed?.details },
    { title: "Certificate of Authenticity", value: artwork.certificateOfAuthenticity?.details },
    { title: "Condition", value: artwork.conditionDescription?.details },
  ]

  return items.filter((i) => i.value != null && i.value !== "")
}

export const CollapsibleArtworkDetails: React.FC<CollapsibleArtworkDetailsProps> = ({
  artwork,
  hasSeparator = true,
}) => {
  const [isExpanded, setExpanded] = useState(false)
  const toggleExpanded = () => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.linear,
      duration: 200,
    })
    setExpanded(!isExpanded)
  }
  const detailItems = artworkDetailItems(artwork)

  return artwork ? (
    <>
      <TouchableOpacity onPress={() => toggleExpanded()} testID="toggle-artwork-details-button">
        <Flex flexDirection="row" padding={2} alignItems="center">
          {!!artwork.image && (
            <OpaqueImageView
              height={40}
              aspectRatio={(artwork.image.width || 1) / (artwork.image.height || 1)}
              imageURL={artwork.image.url}
              width={40}
              style={{ alignSelf: "center" }}
            />
          )}
          <Flex ml={2} flex={1}>
            <Text>{artwork.artistNames}</Text>
            <Text color="black60" variant="xs">
              {artwork.title}
              {artwork.date && artwork.date.trim() !== "" ? `, ${artwork.date}` : ""}
            </Text>
          </Flex>
          <ChevronIcon color="black100" expanded={isExpanded} initialDirection="down" />
        </Flex>
      </TouchableOpacity>
      <Collapse opened={isExpanded}>
        <Box height="230px">
          <ScrollView>
            <Flex mx={2} mb={1}>
              <Join separator={<Spacer my={1} />}>
                {detailItems.map(({ title, value }, index) => (
                  <ArtworkDetailsRow key={index.toString()} title={title} value={value} />
                ))}
              </Join>
            </Flex>
          </ScrollView>
        </Box>
      </Collapse>
      {hasSeparator && <Separator />}
    </>
  ) : null
}

export const CollapsibleArtworkDetailsFragmentContainer = createFragmentContainer(
  CollapsibleArtworkDetails,
  {
    artwork: graphql`
      fragment CollapsibleArtworkDetails_artwork on Artwork {
        image {
          url
          width
          height
        }
        internalID
        title
        date
        saleMessage
        attributionClass {
          name
        }
        category
        manufacturer
        publisher
        medium
        conditionDescription {
          details
        }
        certificateOfAuthenticity {
          details
        }
        framed {
          details
        }
        dimensions {
          in
          cm
        }
        signatureInfo {
          details
        }
        artistNames
      }
    `,
  }
)
