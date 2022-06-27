import { captureMessage } from "@sentry/react-native"
import { LegacyNativeModules } from "app/NativeModules/LegacyNativeModules"
import { getCurrentEmissionState, unsafe__getEnvironment } from "app/store/GlobalStore"
import { logRoute } from "app/utils/loggers"
import _ from "lodash"
import { Middleware, urlMiddleware } from "react-relay-network-modern/node8"

/**
 * This takes the extra extension metadata that staging and dev metaphysics
 * sends about API requests it makes for you, and logs it out during dev
 * time into your console at the same places as the relay queries.
 */
export function metaphysicsExtensionsLoggerMiddleware() {
  // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
  return (next) => (req) => {
    // @ts-expect-error STRICTNESS_MIGRATION --- 🚨 Unsafe legacy code 🚨 Please delete this and fix any type errors if you have time 🙏
    return next(req).then((res) => {
      const requests = res.json.extensions?.requests

      if (requests && console.groupCollapsed) {
        // See: https://github.com/artsy/metaphysics/blob/main/src/app/loaders/api/extensionsLogger.ts

        // Pull out the stitching logs, e.g. what graphql requests
        // did stitching do for you under the hood
        const stitching = requests.stitching
        const stitchCount = stitching && Object.keys(stitching)
        const stitchSummary = stitchCount ? `${stitchCount} stitched` : ""

        // Grab the rest API requests (only ones that use DataLoader)
        // so this is kinda a sub-set but it's more or less everything
        const apis = _.omit(requests, ["stitching"])
        const requestCount = Object.keys(apis)
          .map((k) => Object.keys(requests[k].requests).length) // API requests
          .reduce((a, c) => a + c, 0) // Add them all up

        // Not telling anyone off, but over 15 is probably a point
        // where you want that highlighted.
        const colorForRequests = requestCount >= 15 ? "color: #F1AF1B;" : "color: #6E1EFF;"

        // The way the console coloring works is you use %c as an inline span
        // sentinal to correlate style to the next set of characters
        //
        // So we'll need some styles to work with
        const noBold = "font-weight: normal;"
        const noColor = "color: black; font-weight: normal;"
        const requestSummary = requestCount
          ? `%c ${requestCount} %ccalls` // These need consistent amounts of %c
          : "%c%c"

        const title = `%cMetaphysics API -${requestSummary}${stitchSummary}`

        // Make sure we have something to show
        if (logRoute && (requestCount || stitchCount)) {
          // The main title for the metaphysics section
          console.groupCollapsed(title, noBold, colorForRequests, noColor)

          // Loop through all of the hosts, make a subsection for those
          // and show the raw request obj in-case we add new things to it
          if (requestCount) {
            Object.keys(apis).forEach((host) => {
              console.group(host)
              Object.keys(apis[host].requests).forEach((route) => {
                console.log(route, apis[host].requests[route])
              })
              console.groupEnd()
            })
          }

          // Show stitched queries inline. This will probably need work in
          // the future, because I bet it's ugly.
          if (stitchCount) {
            console.group("Stitched")
            // FIXME: This is erroring on staging
            // stitching.requests.forEach(element => {
            //   console.log(element.requests)
            // })
            console.groupEnd()
          }

          // Wrap up the metaphysics section
          console.groupEnd()
        }
      }
      return res
    })
  }
}

export function metaphysicsURLMiddleware() {
  return urlMiddleware({
    url: () => unsafe__getEnvironment().metaphysicsURL,
    headers: () => {
      const { userAgent, userID, authenticationToken } = getCurrentEmissionState()
      return {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-USER-ID": userID,
        "X-ACCESS-TOKEN": authenticationToken,
        "X-TIMEZONE": LegacyNativeModules.ARCocoaConstantsModule.LocalTimeZone,
      }
    },
  })
}

export function persistedQueryMiddleware(): Middleware {
  return (next) => async (req) => {
    // Get query body either from local queryMap or
    // send queryID to metaphysics
    let body: { variables?: object; query?: string; documentID?: string } = {}
    const queryID = req.getID()
    const variables = req.getVariables()
    if (__DEV__) {
      body = { query: require("../../../../data/complete.queryMap.json")[queryID], variables }
      ;(req as any).operation.text = body.query ?? null
    } else {
      body = { documentID: queryID, variables }
    }

    if (body && (body.query || body.documentID)) {
      req.fetchOpts.body = JSON.stringify(body)
    }

    try {
      return await next(req)
    } catch (e: any) {
      if (!__DEV__ && e.toString().includes("Unable to serve persisted query with ID")) {
        // this should not happen normally, but let's try again with full query text to avoid ruining the user's day?
        captureMessage(e.stack)
        body = { query: require("../../../../data/complete.queryMap.json")[queryID], variables }
        req.fetchOpts.body = JSON.stringify(body)
        return await next(req)
      } else {
        throw e
      }
    }
  }
}
