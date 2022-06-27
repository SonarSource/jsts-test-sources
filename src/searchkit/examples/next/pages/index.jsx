import dynamic from 'next/dynamic'
import { withSearchkit, withSearchkitRouting } from '@searchkit/client'
 
const Search = dynamic(() => import('../components/sdk-example'), { ssr: false })

export default withSearchkit(withSearchkitRouting(Search, {
  createURL: ({ qsModule, location, routeState }) => {
    let filters
    let typeCategoryURL = "all"
    if (routeState.filters) {
      filters = (routeState.filters).reduce((sum, filter) => {
        if (filter.identifier === "type") {
          sum.type.push(filter)
        } else {
          sum.all.push(filter)
        }
        return sum
      }, {
        type: [],
        all: []
      })
      if (filters.type.length > 0) {
        typeCategoryURL = filters.type.map((filter) => filter.value).join("_")
      }
    }

    let newRouteState = {
      ...routeState,
      ...( filters ? { filters: filters.all } : {} )
    }

    const queryString = qsModule.stringify(newRouteState, {
      addQueryPrefix: true
    })

    return `/type/${typeCategoryURL}${queryString}`
  },
  parseURL: ({ qsModule, location }) => {
    const matches = location.pathname.match(/type\/(\w+)/)
    const routeState = qsModule.parse(location.search.slice(1), { arrayLimit: 99 })

    if (matches && matches[1] && matches[1] !== "all") {
      const typeFilters = matches[1].split("_").map((value) => ({ identifier: 'type', value }))
      if (!routeState.filters) routeState.filters = []
      routeState.filters = [...routeState.filters, ...typeFilters]
    }
    return routeState

  }
}))