import * as React from 'react'
import * as classNames from 'classnames'

interface ITextAreaProps {
  /** The label for the textarea field. */
  readonly label?: string

  /** The class name for the label. */
  readonly labelClassName?: string

  /** The class name for the textarea field. */
  readonly textareaClassName?: string

  /** The placeholder for the textarea field. */
  readonly placeholder?: string

  readonly rows?: number

  /** The current value of the textarea field. */
  readonly value?: string

  /** Whether the textarea field should auto focus when mounted. */
  readonly autoFocus?: boolean

  /** Whether the textarea field is disabled. */
  readonly disabled?: boolean

  /** Called when the user changes the value in the textarea field. */
  readonly onChange?: (event: React.FormEvent<HTMLTextAreaElement>) => void

  /** Called on key down. */
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void

  /** A callback to receive the underlying `textarea` instance. */
  readonly onTextAreaRef?: (instance: HTMLTextAreaElement) => void
}

/** A textarea element with app-standard styles. */
export class TextArea extends React.Component<ITextAreaProps, void> {
  public render() {
    const className = classNames('text-area-component', this.props.labelClassName)
    return (
      <label className={className}>
        {this.props.label}

        <textarea
          autoFocus={this.props.autoFocus}
          className={this.props.textareaClassName}
          disabled={this.props.disabled}
          rows={this.props.rows || 3}
          placeholder={this.props.placeholder}
          value={this.props.value}
          onChange={this.props.onChange}
          onKeyDown={this.props.onKeyDown}
          ref={this.props.onTextAreaRef}/>
      </label>
    )
  }
}
