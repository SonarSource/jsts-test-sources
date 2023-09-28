import { renderWithLayout } from "app/tests/renderWithLayout"
import React from "react"
import "react-native"

import RelayGenericArtworksGrid, { GenericArtworksGrid } from "./GenericGrid"

it("renders without throwing an error", () => {
  const artworks = [artwork(), artwork(), artwork()]

  const layout = { width: 768 }

  renderWithLayout(<RelayGenericArtworksGrid artworks={artworks as any} />, layout)
})

it("handles showing an update when there are new artworks", () => {
  const artworks = [artwork(), artwork()] as any
  const newArtworks = [artwork(), artwork(), artwork()] as any

  const grid = new GenericArtworksGrid({ artworks })
  const shouldUpdate = grid.shouldComponentUpdate({ artworks: newArtworks }, {} as any)

  expect(shouldUpdate).toBeTruthy()
})

it("handles showing an update when data loading was stopped", () => {
  const artworks = [artwork(), artwork()] as any

  const grid = new GenericArtworksGrid({ artworks, isLoading: true })
  const shouldUpdate = grid.shouldComponentUpdate({ artworks, isLoading: false }, {} as any)

  expect(shouldUpdate).toBeTruthy()
})

const artwork = () => {
  return {
    id: "artwork-long-title",
    gravityID: "long-title",
    title: "DO WOMEN STILL HAVE TO BE NAKED TO GET INTO THE MET. MUSEUM",
    date: "2012",
    saleMessage: null,
    isInAuction: false,
    image: {
      url: "artsy.net/image-url",
      aspectRatio: 2.18,
    },
    artistsNames: "Guerrilla Girls",
    href: "/artwork/guerrilla-girls-do-women-still-have-to-be-naked-to-get-into-the-met-museum",
  }
}
