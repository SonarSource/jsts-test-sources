import * as React from 'react'
import { createUniqueId, releaseUniqueId } from './id-pool'

interface ISelectProps {
  /** The label for the select control. */
  readonly label?: string

  /** The value of the select control. */
  readonly value?: string

  /** The default value of the select control. */
  readonly defaultValue?: string

  /** Called when the user changes the selected valued. */
  readonly onChange?: (event: React.FormEvent<HTMLSelectElement>) => void

  /** The <option>'s for the select control. */
  readonly children?: ReadonlyArray<JSX.Element>
}

interface ISelectState {
  /**
   * An automatically generated id for the input element used to reference
   * it from the label element. This is generated once via the id pool when the
   * component is mounted and then released once the component unmounts.
   */
  readonly inputId?: string
}

/** A select element with app-standard styles. */
export class Select extends React.Component<ISelectProps, ISelectState> {

  public componentWillMount() {
    const friendlyName = this.props.label || 'unknown'
    const inputId = createUniqueId(`Select_${friendlyName}`)

    this.setState({ inputId })
  }

  public componentWillUnmount() {
    if (this.state.inputId) {
      releaseUniqueId(this.state.inputId)
    }
  }

  private renderLabel() {
    const label = this.props.label
    const inputId = this.state.inputId

    return !!label
      ? <label htmlFor={inputId}>{label}</label>
      : null
  }

  public render() {
    return (
      <div className='select-component'>
        {this.renderLabel()}
        <select
          id={this.state.inputId}
          onChange={this.props.onChange}
          value={this.props.value}
          defaultValue={this.props.defaultValue}
        >
          {this.props.children}
        </select>
      </div>
    )
  }
}
