import { ActionType, ContextModule, OwnerType } from "@artsy/cohesion"
import {
  MyCollectionArtworkArticles_article$data,
  MyCollectionArtworkArticles_article$key,
} from "__generated__/MyCollectionArtworkArticles_article.graphql"
import { ArticleCardContainer } from "app/Components/ArticleCard"
import { navigate } from "app/navigation/navigate"
import { Schema } from "app/utils/track"
import { ArrowRightIcon, Flex, Spacer, Text } from "palette"
import React from "react"
import { FlatList, TouchableOpacity } from "react-native"
import { useFragment } from "react-relay"
import { useTracking } from "react-tracking"
import { graphql } from "relay-runtime"

interface MyCollectionArtworkArticlesProps {
  articles: MyCollectionArtworkArticles_article$key
  artistNames: string | null
  artistSlug: string | undefined
  totalCount: number | null | undefined
}

export const MyCollectionArtworkArticles: React.FC<MyCollectionArtworkArticlesProps> = (props) => {
  const { trackEvent } = useTracking()

  const articles = useFragment(articleFragment, props.articles)

  if (!articles.length) {
    return null
  }

  return (
    <Flex mb={3}>
      <TouchableOpacity
        onPress={() => {
          trackEvent(tracks.tappedArticleGroup())
          navigate(`/artist/${props.artistSlug}/articles`)
        }}
      >
        <Flex flexDirection="row" alignItems="flex-start" mb={2}>
          <Flex flex={1} flexDirection="row">
            <Text variant="md">{`Articles featuring ${props.artistNames || ""}`}</Text>
            {!!props?.totalCount && (
              <Text variant="xs" color="blue100" ml={0.5} mt={-0.5}>
                {props?.totalCount}
              </Text>
            )}
          </Flex>

          <Flex my="auto">
            <ArrowRightIcon width={12} fill="black60" ml={0.5} />
          </Flex>
        </Flex>
      </TouchableOpacity>

      <FlatList<MyCollectionArtworkArticles_article$data[number]>
        testID="test-articles-flatlist"
        horizontal
        ItemSeparatorComponent={() => <Spacer ml="2" />}
        scrollsToTop={false}
        style={{ overflow: "visible" }}
        initialNumToRender={2}
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ArticleCardContainer
            article={item}
            onPress={() => {
              trackEvent(tracksItem.tappedArticleGroup(index))
            }}
          />
        )}
      />
    </Flex>
  )
}

const articleFragment = graphql`
  fragment MyCollectionArtworkArticles_article on Article @relay(plural: true) {
    id
    ...ArticleCard_article
  }
`

const tracks = {
  tappedArticleGroup: () => ({
    action: ActionType.tappedArticleGroup,
    context_module: ContextModule.myCollectionArtworkAbout,
    context_screen: Schema.PageNames.MyCollectionArtworkAbout,
    context_screen_owner_type: OwnerType.myCollectionArtwork,
    destination_screen_owner_type: OwnerType.articles,
  }),
}

const tracksItem = {
  tappedArticleGroup: (index: number) => ({
    action: ActionType.tappedArticleGroup,
    context_module: ContextModule.myCollectionArtworkAbout,
    context_screen: Schema.PageNames.MyCollectionArtworkAbout,
    context_screen_owner_type: OwnerType.myCollectionArtwork,
    destination_screen_owner_type: OwnerType.article,
    horizontal_slide_position: index,
  }),
}
