import { ActionType, ContextModule, OwnerType } from "@artsy/cohesion"
import { FairExhibitorRail_show$data } from "__generated__/FairExhibitorRail_show.graphql"
import { SmallArtworkRail } from "app/Components/ArtworkRail/SmallArtworkRail"
import { SectionTitle } from "app/Components/SectionTitle"
import { navigate } from "app/navigation/navigate"
import { extractNodes } from "app/utils/extractNodes"
import { Flex } from "palette"
import React from "react"
import { createFragmentContainer, graphql } from "react-relay"
import { useTracking } from "react-tracking"

interface FairExhibitorRailProps {
  show: FairExhibitorRail_show$data
}

const FairExhibitorRail: React.FC<FairExhibitorRailProps> = ({ show }) => {
  const { trackEvent } = useTracking()

  const artworks = extractNodes(show?.artworksConnection)

  const count = show?.counts?.artworks ?? 0
  const partnerName = show?.partner?.name ?? ""
  const viewAllUrl = show?.href

  if (count === 0) {
    return null
  }

  return (
    <>
      <Flex px={2}>
        <SectionTitle
          title={partnerName}
          subtitle={`${count} works`}
          onPress={() => {
            if (!viewAllUrl) {
              return
            }

            trackEvent(tracks.tappedShow(show))
            navigate(viewAllUrl)
          }}
        />
      </Flex>
      <SmallArtworkRail
        artworks={artworks}
        onPress={(artwork, position) => {
          trackEvent(
            tracks.tappedArtwork(show, artwork?.internalID ?? "", artwork?.slug ?? "", position)
          )
          navigate(artwork?.href!)
        }}
      />
    </>
  )
}

export const FairExhibitorRailFragmentContainer = createFragmentContainer(FairExhibitorRail, {
  show: graphql`
    fragment FairExhibitorRail_show on Show {
      internalID
      slug
      href
      partner {
        ... on Partner {
          name
        }
        ... on ExternalPartner {
          name
        }
      }
      counts {
        artworks
      }
      fair {
        internalID
        slug
      }
      artworksConnection(first: 20) {
        edges {
          node {
            ...SmallArtworkRail_artworks
          }
        }
      }
    }
  `,
})

const tracks = {
  tappedArtwork: (
    show: FairExhibitorRail_show$data,
    artworkID: string,
    artworkSlug: string,
    position: number
  ) => ({
    action: ActionType.tappedArtworkGroup,
    context_module: ContextModule.galleryBoothRail,
    context_screen_owner_type: OwnerType.fair,
    context_screen_owner_id: show.fair?.internalID ?? "",
    context_screen_owner_slug: show.fair?.slug ?? "",
    destination_screen_owner_type: OwnerType.artwork,
    destination_screen_owner_id: artworkID,
    destination_screen_owner_slug: artworkSlug,
    horizontal_slide_position: position,
    type: "thumbnail",
  }),
  tappedShow: (show: FairExhibitorRail_show$data) => ({
    action: ActionType.tappedArtworkGroup,
    context_module: ContextModule.galleryBoothRail,
    context_screen_owner_type: OwnerType.fair,
    context_screen_owner_id: show.fair?.internalID ?? "",
    context_screen_owner_slug: show.fair?.slug ?? "",
    destination_screen_owner_type: OwnerType.show,
    destination_screen_owner_id: show.internalID,
    destination_screen_owner_slug: show.slug,
    type: "viewAll",
  }),
}
