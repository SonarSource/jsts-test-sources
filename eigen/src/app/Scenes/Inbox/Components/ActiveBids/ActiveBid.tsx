import { themeGet } from "@styled-system/theme-get"
import OpaqueImageView from "app/Components/OpaqueImageView/OpaqueImageView"
import { navigate } from "app/navigation/navigate"
import React from "react"
import { Dimensions, TouchableWithoutFeedback } from "react-native"
import { createFragmentContainer, graphql } from "react-relay"
import styled from "styled-components/native"
import { BodyText, MetadataText } from "../Typography"

import { ActiveBid_bid$data } from "__generated__/ActiveBid_bid.graphql"

const isPad = Dimensions.get("window").width > 700

const Container = styled.View`
  height: 120px;
  margin-left: 20px;
  margin-right: 20px;
  ${isPad ? "align-self: center; width: 708;" : ""};
`

const Content = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
`

const ImageView = styled(OpaqueImageView)`
  width: 80px;
  height: 80px;
  border-radius: 4;
`

const MetadataContainer = styled.View`
  margin: 0 10px;
  flex: 1;
  flex-direction: column;
  justify-content: center;
`

const Separator = styled.View`
  height: 1;
  width: 100%;
  background-color: ${themeGet("colors.black10")};
`

const StatusLabel = styled(MetadataText)`
  margin-bottom: 3px;
  color: ${(props: { status: BidStatus }) => {
    switch (props.status) {
      case "winning":
        return themeGet("colors.green100")
      case "reserve":
        return themeGet("colors.yellow100")
      case "losing":
        return themeGet("colors.red100")
      case "live_auction":
        return themeGet("colors.blue100")
    }
  }};
`

type BidStatus = "winning" | "reserve" | "losing" | "live_auction"

interface Props {
  bid: ActiveBid_bid$data
}

interface State {
  status: BidStatus
}

class ActiveBid extends React.Component<Props, State> {
  state = {
    status: "losing" as BidStatus,
  }

  componentDidMount() {
    this.updateStatus()
  }

  updateStatus() {
    const bid = this.props.bid
    const isInLiveOpenAuction = bid.sale && bid.sale.is_live_open

    let status: BidStatus = "losing"
    if (isInLiveOpenAuction) {
      status = "live_auction"
    } else {
      const leadingBidder = bid.is_leading_bidder
      // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
      const reserveNotMet = bid.most_recent_bid.sale_artwork.reserve_status === "reserve_not_met"

      if (leadingBidder) {
        status = reserveNotMet ? "reserve" : "winning"
      }
    }

    this.setState({ status })
  }

  get statusLabel(): string {
    switch (this.state.status) {
      case "live_auction":
        return "Join Live"
      case "winning":
      case "reserve":
        return "Highest Bid"
      case "losing":
        return "Outbid"
    }
  }

  handleTap = () => {
    const bid = this.props.bid
    // push user into live auction if it's open; otherwise go to artwork
    const href =
      this.state.status === "live_auction"
        ? // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
          bid.sale.href
        : // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
          bid.most_recent_bid.sale_artwork.artwork.href
    // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
    navigate(href)
  }

  render() {
    const bid = this.props.bid.most_recent_bid
    const imageURL =
      // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
      bid.sale_artwork.artwork &&
      // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
      bid.sale_artwork.artwork.image &&
      // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
      bid.sale_artwork.artwork.image.url
    // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
    const lotNumber = bid.sale_artwork.lot_label
    // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
    const artistName = bid.sale_artwork.artwork.artist_names

    const headline = `Lot ${lotNumber} · ${artistName} `

    const isInOpenLiveAuction = this.props.bid.sale && this.props.bid.sale.is_live_open
    // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
    const bidderPositions = bid.sale_artwork.counts.bidder_positions
    const bidderPositionsLabel = bidderPositions + " " + (bidderPositions === 1 ? "Bid" : "Bids")

    const subtitle = isInOpenLiveAuction
      ? "Live bidding now open"
      : `${
          // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
          bid.sale_artwork.highest_bid.display
        } (${bidderPositionsLabel})`

    return (
      <TouchableWithoutFeedback onPress={this.handleTap}>
        <Container>
          <Content>
            <ImageView imageURL={imageURL} />
            <MetadataContainer>
              <StatusLabel status={this.state.status}>{this.statusLabel}</StatusLabel>
              <BodyText>{headline}</BodyText>
              <BodyText>{subtitle}</BodyText>
            </MetadataContainer>
          </Content>
          <Separator />
        </Container>
      </TouchableWithoutFeedback>
    )
  }
}

export default createFragmentContainer(ActiveBid, {
  bid: graphql`
    fragment ActiveBid_bid on LotStanding {
      is_leading_bidder: isLeadingBidder
      sale {
        href
        is_live_open: isLiveOpen
      }
      most_recent_bid: mostRecentBid {
        id
        sale_artwork: saleArtwork {
          artwork {
            href
            image {
              url
            }
            artist_names: artistNames
          }
          counts {
            bidder_positions: bidderPositions
          }
          highest_bid: highestBid {
            display
          }
          lot_label: lotLabel
          reserve_status: reserveStatus
        }
      }
    }
  `,
})
