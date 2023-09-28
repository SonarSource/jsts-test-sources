import { StackScreenProps } from "@react-navigation/stack"
import { ArtworkFilterNavigationStack } from "app/Components/ArtworkFilter"
import {
  FilterData,
  FilterDisplayName,
  FilterParamName,
} from "app/Components/ArtworkFilter/ArtworkFilterHelpers"
import { ArtworkFilterBackHeader } from "app/Components/ArtworkFilter/components/ArtworkFilterBackHeader"
import { useArtworkFiltersAggregation } from "app/Components/ArtworkFilter/useArtworkFilters"
import { useLayout } from "app/utils/useLayout"
import { compact, sortBy } from "lodash"
import { Flex, useSpace } from "palette"
import React from "react"
import { ColorsSwatch } from "./ColorsSwatch"
import { useMultiSelect } from "./useMultiSelect"

export const COLORS = [
  { value: "red", name: "Red", backgroundColor: "#BB392D", foregroundColor: "#fff" },
  { value: "orange", name: "Orange", backgroundColor: "#EA6B1F", foregroundColor: "#000" },
  { value: "yellow", name: "Yellow", backgroundColor: "#E2B929", foregroundColor: "#000" },
  { value: "green", name: "Green", backgroundColor: "#00674A", foregroundColor: "#fff" },
  { value: "blue", name: "Blue", backgroundColor: "#0A1AB4", foregroundColor: "#fff" },
  { value: "purple", name: "Purple", backgroundColor: "#7B3D91", foregroundColor: "#fff" },
  {
    value: "black-and-white",
    name: "Black and White",
    backgroundColor: "#000",
    foregroundColor: "#f00",
  },
  { value: "brown", name: "Brown", backgroundColor: "#7B5927", foregroundColor: "#fff" },
  { value: "gray", name: "Gray", backgroundColor: "#C2C2C2", foregroundColor: "#000" },
  { value: "pink", name: "Pink", backgroundColor: "#E1ADCD", foregroundColor: "#000" },
] as const

type Color = typeof COLORS[number]

export const COLORS_INDEXED_BY_VALUE = COLORS.reduce(
  (acc: Record<string, Color>, color) => ({ ...acc, [color.value]: color }),
  {}
)

const SWATCHES_PER_ROW = 4

interface ColorsOptionsScreenProps
  extends StackScreenProps<ArtworkFilterNavigationStack, "ColorsOptionsScreen"> {}

export const ColorsOptionsScreen: React.FC<ColorsOptionsScreenProps> = ({ navigation }) => {
  const space = useSpace()
  const { layout, handleLayout } = useLayout()

  const { aggregation } = useArtworkFiltersAggregation({
    paramName: FilterParamName.colors,
  })

  // Convert aggregations to filter options
  const options: FilterData[] = compact(
    (aggregation?.counts ?? []).map(({ value }) => {
      if (COLORS_INDEXED_BY_VALUE[value]?.name) {
        return {
          // names returned by Metaphysics are actually the slugs
          displayText: COLORS_INDEXED_BY_VALUE[value].name,
          paramValue: value,
          paramName: FilterParamName.colors,
        }
      }
    })
  )

  // Sort according to order of COLORS constant
  const sortedOptions = sortBy(options, (option) => {
    return COLORS.findIndex(({ value }) => value === option.paramValue)
  })

  const { handleSelect, isSelected, handleClear, isActive } = useMultiSelect({
    options,
    paramName: FilterParamName.colors,
  })

  return (
    <Flex onLayout={handleLayout} flexGrow={1}>
      <ArtworkFilterBackHeader
        title={FilterDisplayName.colors}
        onLeftButtonPress={() => navigation.goBack()}
        {...(isActive ? { rightButtonText: "Clear", onRightButtonPress: handleClear } : {})}
      />

      <Flex p={1} flexWrap="wrap" flexDirection="row" justifyContent="flex-start">
        {sortedOptions.map((option, i) => {
          const color = COLORS_INDEXED_BY_VALUE[String(option.paramValue)]
          const selected = isSelected(option)

          return (
            <ColorsSwatch
              key={i}
              width={(layout.width - space(1) * 2) / SWATCHES_PER_ROW}
              selected={selected}
              name={color.name}
              backgroundColor={color.backgroundColor}
              foregroundColor={color.foregroundColor}
              onPress={() => {
                handleSelect(option, !selected)
              }}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
