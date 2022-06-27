import { VisualClueName } from "app/store/config/visualClues"
import { setVisualClueAsSeen, useVisualClue } from "app/store/GlobalStore"
import { Box } from "palette"
import { Tab, TabsProps } from "palette/elements/Tabs"
import React, { useState } from "react"
import { LayoutRectangle } from "react-native"
import { useScreenDimensions } from "shared/hooks"
import { TabBarContainer } from "./TabBarContainer"

/**
 * Renders a list of tabs. Evenly-spaces them across the screen with
 * each tab label centered on the tab
 */
export const NavigationalTabs: React.FC<TabsProps> = ({ onTabPress, activeTab, tabs }) => {
  const [tabLayouts, setTabLayouts] = useState<Array<LayoutRectangle | null>>(tabs.map(() => null))

  const screenWidth = useScreenDimensions().width
  const tabWidth = screenWidth / tabs.length

  return (
    <TabBarContainer scrollEnabled activeTabIndex={activeTab} tabLayouts={tabLayouts}>
      {tabs.map(({ label, visualClues }, index) => {
        const { showVisualClue } = useVisualClue()

        const { jsx } =
          visualClues?.find(({ visualClueName: name }) => showVisualClue(name as VisualClueName)) ??
          {}

        return (
          <Box minWidth={tabWidth} key={label + index}>
            <Tab
              variant="xs"
              label={label}
              superscript={jsx}
              onPress={() => {
                if (visualClues) {
                  visualClues.forEach(({ visualClueName: name }) => {
                    setVisualClueAsSeen(name)
                  })
                }

                onTabPress(label, index)
              }}
              active={activeTab === index}
              onLayout={(e) => {
                const layout = e.nativeEvent.layout
                setTabLayouts((layouts) => {
                  const result = layouts.slice(0)
                  result[index] = layout
                  return result
                })
              }}
            />
          </Box>
        )
      })}
    </TabBarContainer>
  )
}
