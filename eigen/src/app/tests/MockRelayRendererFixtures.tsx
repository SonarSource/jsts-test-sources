import { MockRelayRendererFixtures_artist$data } from "__generated__/MockRelayRendererFixtures_artist.graphql"
import { MockRelayRendererFixtures_artwork$data } from "__generated__/MockRelayRendererFixtures_artwork.graphql"
import { MockRelayRendererFixturesArtistQuery } from "__generated__/MockRelayRendererFixturesArtistQuery.graphql"
import { ContextConsumer } from "app/utils/Context"
import renderWithLoadProgress from "app/utils/renderWithLoadProgress"
import cheerio from "cheerio"
// @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
import { render } from "enzyme"
import * as React from "react"
import { Image, Text, View } from "react-native"
import { createFragmentContainer, graphql, QueryRenderer } from "react-relay"

const Metadata = createFragmentContainer(
  (props: { artworkMetadata: any }) => <Text>{props.artworkMetadata.title}</Text>,
  {
    artworkMetadata: graphql`
      fragment MockRelayRendererFixtures_artworkMetadata on Artwork {
        title
      }
    `,
  }
)

export const Artwork = createFragmentContainer(
  (props: { artwork: MockRelayRendererFixtures_artwork$data }) => (
    <View>
      <Image
        // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
        source={{ uri: props.artwork && props.artwork.image && props.artwork.image.url }}
      />
      <Metadata artworkMetadata={props.artwork} />
      {/* FIXME: Should this be a slug? */}
      {!!props.artwork.artist && <ArtistQueryRenderer id={props.artwork.artist.slug} />}
    </View>
  ),
  {
    artwork: graphql`
      fragment MockRelayRendererFixtures_artwork on Artwork {
        image {
          url
        }
        artist {
          slug
        }
        ...MockRelayRendererFixtures_artworkMetadata
      }
    `,
  }
)

const Artist = createFragmentContainer(
  (props: { artist: MockRelayRendererFixtures_artist$data }) => <Text>{props.artist.name}</Text>,
  {
    artist: graphql`
      fragment MockRelayRendererFixtures_artist on Artist {
        name
      }
    `,
  }
)

const ArtistQueryRenderer = (props: { id: string }) => (
  <ContextConsumer>
    {({ relayEnvironment }) => {
      return (
        <QueryRenderer<MockRelayRendererFixturesArtistQuery>
          // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
          environment={relayEnvironment}
          variables={props}
          query={graphql`
            query MockRelayRendererFixturesArtistQuery($id: String!) {
              artist(id: $id) {
                ...MockRelayRendererFixtures_artist
              }
            }
          `}
          render={renderWithLoadProgress(Artist)}
        />
      )
    }}
  </ContextConsumer>
)

export const query = graphql`
  query MockRelayRendererFixturesQuery {
    artwork(id: "mona-lisa") {
      ...MockRelayRendererFixtures_artwork
    }
  }
`

// Bad query has a misnamed top-level property.
export const badQuery = graphql`
  query MockRelayRendererFixturesBadQuery {
    something_that_is_not_expected: artwork(id: "mona-lisa") {
      ...MockRelayRendererFixtures_artwork
    }
  }
`

export function renderToString(element: JSX.Element) {
  return cheerio.html(render(element))
}
