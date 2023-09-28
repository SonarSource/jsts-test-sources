import { ArtworkFormValues } from "app/Scenes/MyCollection/State/MyCollectionArtworkModel"
import { GlobalStore } from "app/store/GlobalStore"
import { FormikProps, useFormikContext } from "formik"
import { useEffect } from "react"

export function useArtworkForm(): { formik: FormikProps<ArtworkFormValues> } {
  const formik = useFormikContext<ArtworkFormValues>()

  useEffect(() => {
    GlobalStore.actions.myCollection.artwork.setFormValues(formik.values)
  }, [formik.values])

  return {
    formik,
  }
}
