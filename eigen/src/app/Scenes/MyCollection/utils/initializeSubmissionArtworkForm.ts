import { MyCollectionWhySell_artwork$data } from "__generated__/MyCollectionWhySell_artwork.graphql"
import { GlobalStore } from "app/store/GlobalStore"
import { getAttributionClassValueByName } from "app/utils/artworkRarityClassifications"

export const initializeSubmissionArtworkForm = (artwork: MyCollectionWhySell_artwork$data) => {
  GlobalStore.actions.artworkSubmission.submission.resetSessionState()

  GlobalStore.actions.artworkSubmission.submission.initializeArtworkDetailsForm({
    artist: artwork.artist?.name ?? "",
    artistId: artwork.artist?.internalID ?? "",
    title: artwork.title ?? "",
    year: artwork.date ?? "",
    medium: artwork.medium ?? "",
    attributionClass: getAttributionClassValueByName(artwork.attributionClass?.name),
    editionNumber: artwork.editionNumber ?? "",
    editionSizeFormatted: artwork.editionSize ?? "",
    dimensionsMetric: artwork.metric ?? "",
    height: artwork.height ?? "",
    width: artwork.width ?? "",
    depth: artwork.depth ?? "",
    provenance: artwork.provenance ?? "",
    source: "MY_COLLECTION",
    myCollectionArtworkID: artwork.internalID,
  })

  const photos = artwork.images?.map((image) => ({
    path: image?.url?.replace(":version", "large") ?? "",
    automaticallyAdded: true,
  }))

  GlobalStore.actions.artworkSubmission.submission.initializePhotos(photos ?? [])
}
