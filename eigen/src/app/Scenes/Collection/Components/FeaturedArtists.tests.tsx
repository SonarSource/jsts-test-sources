import { FeaturedArtistsTestsQuery } from "__generated__/FeaturedArtistsTestsQuery.graphql"
import { navigate } from "app/navigation/navigate"
import { GlobalStoreProvider } from "app/store/GlobalStore"
import { mockTracking } from "app/tests/mockTracking"
import { renderRelayTree } from "app/tests/renderRelayTree"
import { postEventToProviders } from "app/utils/track/providers"
import { Theme } from "palette"
import React from "react"
import { graphql } from "react-relay"
import { CollectionFeaturedArtistsContainer as FeaturedArtists, ViewAll } from "./FeaturedArtists"
jest.unmock("react-relay")
jest.unmock("react-tracking")

const FeaturedArtistCollectionFixture: FeaturedArtistsTestsQuery["rawResponse"]["marketingCollection"] =
  {
    id: "some-id",
    slug: "some-collection",
    artworksConnection: {
      id: "connection-id",
      merchandisableArtists: [
        {
          id: "2342-pablo-picassos-id",
          slug: "pablo-picasso",
          internalID: "2342-pablo-picassos-id",
          name: "Pablo Picasso",
          image: {
            url: "/some/resized/picasso/image/url",
          },
          birthday: "1877",
          nationality: "American",
          is_followed: true,
          initials: "PP",
          href: "/a/link/to/picasso",
          deathday: "1973",
        },
        {
          id: "34534-andy-warhols-id",
          slug: "andy-warhol",
          internalID: "34534-andy-warhols-id",
          name: "Andy Warhol",
          image: {
            url: "/some/resized/warhol/image/url",
          },
          birthday: "1947",
          nationality: "American",
          is_followed: true,
          initials: "AW",
          href: "/a/link/to/warhol",
          deathday: "1987",
        },
        {
          id: "3454",
          slug: "joan-miro",
          internalID: "3454",
          name: "Joan Miro",
          image: {
            url: "/some/resized/miro/image/url",
          },
          birthday: "1877",
          nationality: "Spanish",
          is_followed: true,
          initials: "JM",
          href: "/a/link/to/miro",
          deathday: "1983",
        },
        {
          id: "9807",
          slug: "jean-michel-basquiat",
          internalID: "9807",
          name: "Jean-Michel Basquiat",
          image: {
            url: "/some/resized/basquiat/image/url",
          },
          birthday: "1960",
          nationality: "American",
          is_followed: false,
          initials: "JMB",
          href: "/a/link/to/basquiat",
          deathday: "2001",
        },
        {
          id: "0120",
          slug: "kenny-scharf",
          internalID: "0120",
          name: "Kenny Scharf",
          image: {
            url: "/some/resized/scharf/image/url",
          },
          birthday: "1958",
          nationality: "American",
          is_followed: false,
          initials: "KS",
          href: "/a/link/to/scharf",
          deathday: null,
        },
      ],
    },
    featuredArtistExclusionIds: [],
    query: {
      id: "query-id",
      artistIDs: [],
    },
  }

describe("FeaturedArtists", () => {
  const render = (collection: FeaturedArtistsTestsQuery["rawResponse"]["marketingCollection"]) =>
    renderRelayTree({
      Component: mockTracking(({ marketingCollection }) => (
        <GlobalStoreProvider>
          <Theme>
            <FeaturedArtists collection={marketingCollection} />
          </Theme>
        </GlobalStoreProvider>
      )),
      query: graphql`
        query FeaturedArtistsTestsQuery @raw_response_type {
          marketingCollection(slug: "emerging-photographers") {
            ...FeaturedArtists_collection
          }
        }
      `,
      mockData: {
        marketingCollection: collection,
      },
    })

  it("renders without throwing an error", async () => {
    await render(FeaturedArtistCollectionFixture)
  })

  it("renders an EntityHeader for each featured artist", async () => {
    const tree = await render(FeaturedArtistCollectionFixture)

    const entityHeaders = tree.find("EntityHeader")
    expect(entityHeaders.length).toEqual(3)

    const output = tree.html()
    expect(output).toContain("Pablo Picasso")
    expect(output).toContain("Andy Warhol")
    expect(output).toContain("Joan Miro")
    expect(output).toContain("View all")
  })

  it("does not render an EntityHeader for excluded artists", async () => {
    const tree = await render({
      ...FeaturedArtistCollectionFixture,
      featuredArtistExclusionIds: ["34534-andy-warhols-id", "2342-pablo-picassos-id"],
    })

    const entityHeaders = tree.find("EntityHeader")
    expect(entityHeaders.length).toEqual(3)

    const output = tree.html()
    expect(output).toContain("Joan Miro")
    expect(output).not.toContain("Andy Warhol")
    expect(output).not.toContain("Pablo Picasso")
    expect(output).toContain("Jean-Michel Basquiat")
    expect(output).toContain("Kenny Scharf")
  })

  describe("when artist ids are explicitly requested", () => {
    it("does not render an EntityHeader for any non-requested artists", async () => {
      const tree = await render({
        ...FeaturedArtistCollectionFixture,
        query: { id: "some-id", artistIDs: ["34534-andy-warhols-id"] },
      })

      const entityHeaders = tree.find("EntityHeader")
      expect(entityHeaders.length).toEqual(1)

      const output = tree.html()
      expect(output).toContain("Andy Warhol")
      expect(output).not.toContain("Joan Miro")
      expect(output).not.toContain("Pablo Picasso")
    })
  })

  describe("View all", () => {
    it("shows more artists when 'View more' is tapped", async () => {
      const tree = await render(FeaturedArtistCollectionFixture)
      const output = tree.html()
      expect(output).toContain("View all")
      expect(output).not.toContain("Jean-Michel Basquiat")
      expect(output).not.toContain("Kenny Scharf")

      const viewAll = tree.find(ViewAll)
      viewAll.simulate("click")

      expect(navigate).toHaveBeenCalledWith("/collection/some-collection/artists")
    })

    it("tracks an event when 'View more' is tapped", async () => {
      const tree = await render(FeaturedArtistCollectionFixture)
      const viewAll = tree.find(ViewAll)

      viewAll.simulate("click")

      expect(postEventToProviders).toHaveBeenCalledWith({
        action_type: "tap",
        action_name: "viewMore",
        context_module: "FeaturedArtists",
        context_screen: "Collection",
        flow: "FeaturedArtists",
      })
    })
  })
})
