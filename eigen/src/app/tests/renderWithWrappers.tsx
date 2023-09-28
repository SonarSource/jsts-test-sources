import { render } from "@testing-library/react-native"
import { PopoverMessageProvider } from "app/Components/PopoverMessage/PopoverMessageProvider"
import { ToastProvider } from "app/Components/Toast/toastHook"
import { GlobalStoreProvider } from "app/store/GlobalStore"
import { combineProviders } from "app/utils/combineProviders"
import { track } from "app/utils/track"
import { Theme } from "palette"
import { Component, Suspense } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Environment, RelayEnvironmentProvider } from "react-relay"
import ReactTestRenderer from "react-test-renderer"
import { ProvideScreenDimensions } from "shared/hooks"
import { ReactElement } from "simple-markdown"

const Wrappers: React.FC = ({ children }) =>
  combineProviders(
    [
      TrackingProvider,
      GlobalStoreProvider,
      SafeAreaProvider,
      ProvideScreenDimensions, // uses: SafeAreaProvider
      Theme, // uses: GlobalStoreProvider
      PopoverMessageProvider,
      ToastProvider, // uses: GlobalStoreProvider
    ],
    children
  )

/**
 * Returns given component wrapped with our page wrappers
 * @param component
 */
const componentWithWrappers = (component: ReactElement) => {
  return <Wrappers>{component}</Wrappers>
}

/**
 * @deprecated
 * Use `renderWithWrappersTL` instead.
 *
 * Renders a React Component with our page wrappers
 * @param component
 */
export const renderWithWrappers = (component: ReactElement) => {
  const wrappedComponent = componentWithWrappers(component)
  try {
    // tslint:disable-next-line:use-wrapped-components
    const renderedComponent = ReactTestRenderer.create(wrappedComponent)

    // monkey patch update method to wrap components
    const originalUpdate = renderedComponent.update
    renderedComponent.update = (nextElement: ReactElement) => {
      originalUpdate(componentWithWrappers(nextElement))
    }

    return renderedComponent
  } catch (error: any) {
    if (error.message.includes("Element type is invalid")) {
      throw new Error(
        'Error: Relay test component failed to render. This may happen if you forget to add `jest.unmock("react-relay")` at the top ' +
          "of your test? or if the module you are testing is getting mocked in setupJest.ts" +
          "\n\n" +
          error
      )
    } else {
      throw new Error(error.stack)
    }
  }
}

// react-track has no provider, we make one using the decorator and a class wrapper
export const TrackingProvider = (props: { children?: React.ReactNode }) => (
  <PureWrapper {...props} />
)

@track()
class PureWrapper extends Component {
  render() {
    return this.props.children
  }
}

/**
 * Renders a React Component with our page wrappers
 * by using @testing-library/react-native
 * @param component
 */
export const renderWithWrappersTL = (component: ReactElement) => {
  try {
    return render(component, { wrapper: Wrappers })
  } catch (error: any) {
    if (error.message.includes("Element type is invalid")) {
      throw new Error(
        'Error: Relay test component failed to render. This may happen if you forget to add `jest.unmock("react-relay")` at the top ' +
          "of your test? or if the module you are testing is getting mocked in setupJest.ts" +
          "\n\n" +
          error
      )
    } else {
      throw new Error(error.stack)
    }
  }
}

export const renderWithHookWrappersTL = (component: ReactElement, environment: Environment) => {
  const jsx = (
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback="Loading...">{component}</Suspense>
    </RelayEnvironmentProvider>
  )
  return renderWithWrappersTL(jsx)
}
