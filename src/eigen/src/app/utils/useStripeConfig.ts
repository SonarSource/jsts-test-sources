import { useEnvironment } from "app/store/GlobalStore"
import { useEffect } from "react"
// @ts-expect-error no typings
import stripe from "tipsi-stripe"

export function useStripeConfig() {
  const publishableKey = useEnvironment().stripePublishableKey
  useEffect(() => {
    stripe.setOptions({ publishableKey })
  }, [publishableKey])
}
