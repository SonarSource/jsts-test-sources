import { MyCollectionArtwork_sharedProps$data } from "__generated__/MyCollectionArtwork_sharedProps.graphql"
import { AutosuggestResult } from "app/Scenes/Search/AutosuggestResults"
import { Metric } from "app/Scenes/Search/UserPrefsModel"
import { GlobalStoreModel } from "app/store/GlobalStoreModel"
import { getAttributionClassValueByName } from "app/utils/artworkRarityClassifications"
import { Action, action, thunk, Thunk } from "easy-peasy"
import { pick, uniqBy } from "lodash"

export interface Image {
  height?: number
  isDefault?: boolean
  imageURL?: string
  internalID?: string
  path?: string
  width?: number
  imageVersions?: string[]
}

export interface ArtworkFormValues {
  artist: string
  artistIds: string[]
  artistDisplayName?: string
  artistSearchResult: AutosuggestResult | null
  category: string // this refers to "materials" in UI
  pricePaidDollars: string
  pricePaidCurrency: string
  date: string
  depth: string
  editionSize: string
  editionNumber: string
  height: string
  isEdition: boolean
  medium: string
  metric: Metric | ""
  photos: Image[]
  provenance: string
  title: string
  width: string
  artworkLocation: string
  attributionClass: string
}

export const initialFormValues: ArtworkFormValues = {
  artist: "",
  artistIds: [],
  artistDisplayName: undefined,
  artistSearchResult: null,
  category: "",
  pricePaidDollars: "",
  pricePaidCurrency: "",
  date: "",
  depth: "",
  editionSize: "",
  editionNumber: "",
  height: "",
  isEdition: false,
  medium: "",
  metric: "",
  photos: [],
  provenance: "",
  title: "",
  width: "",
  artworkLocation: "",
  attributionClass: "",
}

export interface MyCollectionArtworkModel {
  sessionState: {
    artworkId: string
    dirtyFormCheckValues: ArtworkFormValues
    formValues: ArtworkFormValues
    artworkErrorOccurred: boolean
  }
  setFormValues: Action<MyCollectionArtworkModel, ArtworkFormValues>
  updateFormValues: Action<MyCollectionArtworkModel, Partial<ArtworkFormValues>>
  setDirtyFormCheckValues: Action<MyCollectionArtworkModel, ArtworkFormValues>
  resetForm: Action<MyCollectionArtworkModel>
  resetFormButKeepArtist: Action<MyCollectionArtworkModel>
  setArtistSearchResult: Action<MyCollectionArtworkModel, AutosuggestResult | null>
  setArtworkId: Action<MyCollectionArtworkModel, { artworkId: string }>
  setArtworkErrorOccurred: Action<MyCollectionArtworkModel, boolean>

  addPhotos: Action<MyCollectionArtworkModel, ArtworkFormValues["photos"]>
  removePhoto: Action<MyCollectionArtworkModel, ArtworkFormValues["photos"][0]>

  startEditingArtwork: Thunk<
    MyCollectionArtworkModel,
    Partial<MyCollectionArtwork_sharedProps$data> & {
      internalID: string
      id: string
      artist: { internalID: string }
      artistNames: string
      images: Image[]
    },
    {},
    GlobalStoreModel
  >
}

export const MyCollectionArtworkModel: MyCollectionArtworkModel = {
  sessionState: {
    // The internalID of the artwork
    artworkId: "",
    dirtyFormCheckValues: initialFormValues,
    formValues: initialFormValues,
    artworkErrorOccurred: false,
  },

  setFormValues: action((state, input) => {
    state.sessionState.formValues = input
  }),

  updateFormValues: action((state, input) => {
    state.sessionState.formValues = { ...state.sessionState.formValues, ...input }
  }),

  setDirtyFormCheckValues: action((state, values) => {
    state.sessionState.dirtyFormCheckValues = values
  }),

  resetForm: action((state) => {
    state.sessionState.formValues = initialFormValues
    state.sessionState.dirtyFormCheckValues = initialFormValues
  }),

  resetFormButKeepArtist: action((state) => {
    const artistValues = pick(state.sessionState.formValues, [
      "artist",
      "artistIds",
      "artistSearchResult",
    ])

    state.sessionState.formValues = { ...initialFormValues, ...artistValues }
    state.sessionState.dirtyFormCheckValues = { ...initialFormValues, ...artistValues }
  }),

  setArtworkId: action((state, { artworkId }) => {
    state.sessionState.artworkId = artworkId
  }),

  setArtistSearchResult: action((state, artistSearchResult) => {
    state.sessionState.formValues.artistSearchResult = artistSearchResult

    if (artistSearchResult == null) {
      state.sessionState.formValues.artist = "" // reset search input field
    }
  }),

  setArtworkErrorOccurred: action((state, errorOccurred) => {
    state.sessionState.artworkErrorOccurred = errorOccurred
  }),

  /**
   * Photos
   */

  addPhotos: action((state, photos) => {
    state.sessionState.formValues.photos = uniqBy(
      state.sessionState.formValues.photos.concat(photos),
      (photo) => photo.imageURL || photo.path
    )
  }),

  removePhoto: action((state, photoToRemove) => {
    state.sessionState.formValues.photos = state.sessionState.formValues.photos.filter(
      (photo) => photo.path !== photoToRemove.path || photo.imageURL !== photoToRemove.imageURL
    )
  }),

  /**
   * When user clicks the edit artwork button from detail view, we format
   * data the data from the detail into a form the edit form expects.
   */
  startEditingArtwork: thunk((actions, artwork) => {
    actions.setArtworkId({
      artworkId: artwork.internalID,
    })

    const pricePaidDollars = artwork.pricePaid ? artwork.pricePaid.minor / 100 : null

    const attributionClass = getAttributionClassValueByName(artwork?.attributionClass?.name)

    const editProps: any /* FIXME: any */ = {
      artistSearchResult: {
        internalID: artwork?.artist?.internalID,
        displayLabel: artwork?.artistNames,
        imageUrl: artwork?.images?.[0]?.imageURL?.replace(":version", "square"),
        formattedNationalityAndBirthday: artwork?.artist?.formattedNationalityAndBirthday,
      },
      attributionClass,
      category: artwork.category,
      date: artwork.date,
      depth: artwork.depth,
      pricePaidDollars: pricePaidDollars?.toString() ?? "",
      pricePaidCurrency: artwork.pricePaid?.currencyCode ?? "",
      editionSize: artwork.editionSize,
      editionNumber: artwork.editionNumber,
      height: artwork.height,
      isEdition: artwork.isEdition,
      medium: artwork.medium,
      metric: artwork.metric,
      photos: artwork.images,
      title: artwork.title,
      width: artwork.width,
      artworkLocation: artwork.artworkLocation,
      provenance: artwork.provenance,
    }

    actions.setFormValues(editProps)

    // Baseline to check if we can cancel edit without showing
    // iOS action sheet confirmation
    actions.setDirtyFormCheckValues(editProps)
  }),
}
