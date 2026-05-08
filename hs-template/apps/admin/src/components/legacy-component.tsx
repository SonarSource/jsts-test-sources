// Importing PropTypes from "react" is considered deprecated starting at React version 15.5.
import React, { PropTypes } from "react";
// `render`, `hydrate` and `unmountComponentAtNode` from "react-dom" are considered deprecated starting at React version 18.0.
import ReactDOM, { render, hydrate, unmountComponentAtNode } from "react-dom";
// `renderToNodeStream` from "react-dom/server" is considered deprecated starting at React version 18.0.
import ReactDOMServer, { renderToNodeStream } from "react-dom/server";

interface LegacyComponentProps {
	userId: string;
	label: string;
}

interface LegacyComponentState {
	count: number;
	data: string | null;
}

export class LegacyComponent extends React.Component<
	LegacyComponentProps,
	LegacyComponentState
> {
	// Using `PropTypes` from the "react" package is considered deprecated starting at React version 15.5.
	static propTypes = {
		userId: PropTypes.string,
		label: PropTypes.string,
	};

	constructor(props: LegacyComponentProps) {
		super(props);
		this.state = { count: 0, data: null };
	}

	// `componentWillMount` is considered deprecated starting at React version 16.9.
	componentWillMount() {
		this.setState({ data: `loading-${this.props.userId}` });
	}

	// `componentWillReceiveProps` is considered deprecated starting at React version 16.9.
	componentWillReceiveProps(nextProps: LegacyComponentProps) {
		if (nextProps.userId !== this.props.userId) {
			this.setState({ count: 0 });
		}
	}

	// `componentWillUpdate` is considered deprecated starting at React version 16.9.
	componentWillUpdate(
		nextProps: LegacyComponentProps,
		nextState: LegacyComponentState,
	) {
		console.log("about to update", nextProps.userId, nextState.count);
	}

	render() {
		return (
			<div>
				<span>{this.props.label}</span>
				<span>{this.state.count}</span>
			</div>
		);
	}
}

export function mountLegacy(container: HTMLElement) {
	// `ReactDOM.render` / `render` is considered deprecated starting at React version 18.0.
	ReactDOM.render(<LegacyComponent userId="1" label="hello" />, container);
	render(<LegacyComponent userId="2" label="world" />, container);

	// `ReactDOM.hydrate` / `hydrate` is considered deprecated starting at React version 18.0.
	ReactDOM.hydrate(<LegacyComponent userId="3" label="ssr" />, container);
	hydrate(<LegacyComponent userId="4" label="ssr" />, container);

	// `ReactDOM.unmountComponentAtNode` / `unmountComponentAtNode` is considered deprecated starting at React version 18.0.
	ReactDOM.unmountComponentAtNode(container);
	unmountComponentAtNode(container);
}

export function streamLegacy() {
	const element = <LegacyComponent userId="5" label="stream" />;
	// `ReactDOMServer.renderToNodeStream` / `renderToNodeStream` is considered deprecated starting at React version 18.0.
	ReactDOMServer.renderToNodeStream(element);
	renderToNodeStream(element);
}
