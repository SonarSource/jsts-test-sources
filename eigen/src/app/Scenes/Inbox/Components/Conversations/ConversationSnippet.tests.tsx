import { renderWithWrappers } from "app/tests/renderWithWrappers"
import moment from "moment"
import React from "react"
import "react-native"

import ConversationSnippet from "./ConversationSnippet"

it("renders with an artwork without throwing an error", () => {
  renderWithWrappers(
    <ConversationSnippet conversation={artworkConversation as any} onSelected={undefined} />
  )
})

it("renders with a show without throwing an error", () => {
  renderWithWrappers(
    <ConversationSnippet conversation={showConversation as any} onSelected={undefined} />
  )
})

const artwork = {
  __typename: "Artwork" as "Artwork",
  title: "Karl and Anna Face Off (Diptych)",
  date: "2016",
  artistNames: "Bradley Theodore",
  image: {
    url: "https://d32dm0rphc51dk.cloudfront.net/bJ9I_vJX9ksaKFJAkOAIKg/normalized.jpg",
  },
}

const show = {
  __typename: "Show" as "Show",
  fair: {
    name: "Catty Fair",
  },
  name: "Catty Show",
  coverImage: {
    url: "https://d32dm0rphc51dk.cloudfront.net/bJ9I_vJX9ksaKFJAkOAIKg/normalized.jpg",
  },
}

const artworkConversation = {
  __typename: "Conversation",
  id: "582",
  inquiry_id: "59302144275b244a81d0f9c6",
  from: { name: "Jean-Luc Collecteur", email: "luc+messaging@artsymail.com" },
  to: { name: "ACA Galleries" },
  lastMessage: "Karl and Anna... Fab!",
  lastMessageAt: moment().subtract(1, "year").toISOString(),
  unread: true,
  createdAt: "2017-06-01T14:14:35.538Z",
  items: [
    {
      item: artwork,
    },
  ],
}

const showConversation = {
  __typename: "Conversation",
  id: "582",
  inquiry_id: "59302144275b244a81d0f9c6",
  from: { name: "Jean-Luc Collecteur", email: "luc+messaging@artsymail.com" },
  to: { name: "ACA Galleries" },
  lastMessage: "Karl and Anna... Fab!",
  lastMessageAt: moment().subtract(1, "year").toISOString(),
  unread: true,
  createdAt: "2017-06-01T14:14:35.538Z",
  items: [
    {
      item: show,
    },
  ],
}
