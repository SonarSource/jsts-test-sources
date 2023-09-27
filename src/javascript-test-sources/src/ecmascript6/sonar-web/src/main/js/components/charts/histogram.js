import d3 from 'd3';
import React from 'react';

import { ResizeMixin } from './../mixins/resize-mixin';
import { TooltipsMixin } from './../mixins/tooltips-mixin';

export const Histogram = React.createClass({
  mixins: [ResizeMixin, TooltipsMixin],

  propTypes: {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    yTicks: React.PropTypes.arrayOf(React.PropTypes.any),
    yValues: React.PropTypes.arrayOf(React.PropTypes.any),
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    padding: React.PropTypes.arrayOf(React.PropTypes.number),
    barsHeight: React.PropTypes.number
  },

  getDefaultProps() {
    return {
      xTicks: [],
      xValues: [],
      padding: [10, 10, 10, 10],
      barsHeight: 10
    };
  },

  getInitialState () {
    return { width: this.props.width, height: this.props.height };
  },

  renderTicks (xScale, yScale) {
    if (!this.props.yTicks.length) {
      return null;
    }
    let ticks = this.props.yTicks.map((tick, index) => {
      let point = this.props.data[index];
      let x = xScale.range()[0];
      let y = Math.round(yScale(point.y) + yScale.rangeBand() / 2 + this.props.barsHeight / 2);
      return <text key={index} className="bar-chart-tick histogram-tick" x={x} y={y} dx="-1em" dy="0.3em">{tick}</text>;
    });
    return <g>{ticks}</g>;
  },

  renderValues (xScale, yScale) {
    if (!this.props.yValues.length) {
      return null;
    }
    let ticks = this.props.yValues.map((value, index) => {
      let point = this.props.data[index];
      let x = xScale(point.x);
      let y = Math.round(yScale(point.y) + yScale.rangeBand() / 2 + this.props.barsHeight / 2);
      return <text key={index} className="bar-chart-tick histogram-value" x={x} y={y} dx="1em" dy="0.3em">{value}</text>;
    });
    return <g>{ticks}</g>;
  },

  renderBars (xScale, yScale) {
    let bars = this.props.data.map((d, index) => {
      let x = Math.round(xScale(d.x)) + /* minimum bar width */ 1;
      let y = Math.round(yScale(d.y) + yScale.rangeBand() / 2);
      return <rect key={index} className="bar-chart-bar"
                   x={0} y={y} width={x} height={this.props.barsHeight}/>;
    });
    return <g>{bars}</g>;
  },

  render () {
    if (!this.state.width || !this.state.height) {
      return <div/>;
    }

    let availableWidth = this.state.width - this.props.padding[1] - this.props.padding[3];
    let availableHeight = this.state.height - this.props.padding[0] - this.props.padding[2];

    let maxX = d3.max(this.props.data, d => d.x);
    let xScale = d3.scale.linear()
        .domain([0, maxX])
        .range([0, availableWidth]);
    let yScale = d3.scale.ordinal()
        .domain(this.props.data.map(d => d.y))
        .rangeRoundBands([0, availableHeight]);

    return <svg className="bar-chart" width={this.state.width} height={this.state.height}>
      <g transform={`translate(${this.props.padding[3]}, ${this.props.padding[0]})`}>
        {this.renderTicks(xScale, yScale)}
        {this.renderValues(xScale, yScale)}
        {this.renderBars(xScale, yScale)}
      </g>
    </svg>;
  }
});
