import _ from 'underscore';
import d3 from 'd3';
import moment from 'moment';
import React from 'react';

import { ResizeMixin } from '../../../components/mixins/resize-mixin';
import { TooltipsMixin } from '../../../components/mixins/tooltips-mixin';


export const Timeline = React.createClass({
  mixins: [ResizeMixin, TooltipsMixin],

  propTypes: {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    padding: React.PropTypes.arrayOf(React.PropTypes.number),
    height: React.PropTypes.number,
    interpolate: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      padding: [10, 10, 10, 10],
      interpolate: 'basis'
    };
  },

  getInitialState() {
    return { width: this.props.width, height: this.props.height };
  },

  getRatingScale(availableHeight) {
    return d3.scale.ordinal()
        .domain([5, 4, 3, 2, 1])
        .rangePoints([availableHeight, 0]);
  },

  getLevelScale(availableHeight) {
    return d3.scale.ordinal()
        .domain(['ERROR', 'WARN', 'OK'])
        .rangePoints([availableHeight, 0]);
  },

  getYScale(availableHeight) {
    if (this.props.metricType === 'RATING') {
      return this.getRatingScale(availableHeight);
    } else if (this.props.metricType === 'LEVEL') {
      return this.getLevelScale(availableHeight);
    } else {
      return d3.scale.linear()
          .range([availableHeight, 0])
          .domain([0, d3.max(this.props.data, d => d.y || 0)])
          .nice();
    }
  },

  renderHorizontalGrid (xScale, yScale) {
    let hasTicks = typeof yScale.ticks === 'function';
    let ticks = hasTicks ? yScale.ticks(4) : yScale.domain();
    if (!ticks.length) {
      ticks.push(yScale.domain()[1]);
    }
    let grid = ticks.map(tick => {
      let opts = {
        x: xScale.range()[0],
        y: yScale(tick)
      };
      return <g key={tick}>
        <text className="line-chart-tick line-chart-tick-x" dx="-1em" dy="0.3em"
              textAnchor="end" {...opts}>{this.props.formatYTick(tick)}</text>
        <line className="line-chart-grid"
              x1={xScale.range()[0]}
              x2={xScale.range()[1]}
              y1={yScale(tick)}
              y2={yScale(tick)}/>
      </g>;
    });
    return <g>{grid}</g>;
  },

  renderTicks (xScale, yScale) {
    let format = xScale.tickFormat(7);
    let ticks = xScale.ticks(7);
    ticks = _.initial(ticks).map((tick, index) => {
      let nextTick = index + 1 < ticks.length ? ticks[index + 1] : xScale.domain()[1];
      let x = (xScale(tick) + xScale(nextTick)) / 2;
      let y = yScale.range()[0];
      return <text key={index} className="line-chart-tick" x={x} y={y} dy="1.5em">{format(tick)}</text>;
    });
    return <g>{ticks}</g>;
  },

  renderLeak (xScale, yScale) {
    if (!this.props.leakPeriodDate) {
      return null;
    }
    let opts = {
      x: xScale(this.props.leakPeriodDate),
      y: _.last(yScale.range()),
      width: xScale.range()[1] - xScale(this.props.leakPeriodDate),
      height: _.first(yScale.range()) - _.last(yScale.range()),
      fill: '#fffae7'
    };
    return <rect {...opts}/>;
  },

  renderLine (xScale, yScale) {
    let path = d3.svg.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .interpolate(this.props.interpolate);
    return <path className="line-chart-path" d={path(this.props.data)}/>;
  },

  renderEvents(xScale, yScale) {
    let points = this.props.events
        .map(event => {
          let snapshot = this.props.data.find(d => d.x.getTime() === event.date.getTime());
          return _.extend(event, { snapshot });
        })
        .filter(event => event.snapshot)
        .map(event => {
          let key = `${event.date.getTime()}-${event.snapshot.y}`;
          let tooltip = [
            `<span class="nowrap">${event.version}</span>`,
            `<span class="nowrap">${moment(event.date).format('LL')}</span>`,
            `<span class="nowrap">${event.snapshot.y ? this.props.formatValue(event.snapshot.y) : '—'}</span>`
          ].join('<br>');
          return <circle key={key} className="line-chart-point"
                         r="4" cx={xScale(event.snapshot.x)} cy={yScale(event.snapshot.y)}
                         data-toggle="tooltip" data-title={tooltip}/>;
        });
    return <g>{points}</g>;
  },

  render () {
    if (!this.state.width || !this.state.height) {
      return <div/>;
    }

    let availableWidth = this.state.width - this.props.padding[1] - this.props.padding[3];
    let availableHeight = this.state.height - this.props.padding[0] - this.props.padding[2];

    let xScale = d3.time.scale()
        .domain(d3.extent(this.props.data, d => d.x || 0))
        .range([0, availableWidth])
        .clamp(true);
    let yScale = this.getYScale(availableHeight);

    return <svg className="line-chart" width={this.state.width} height={this.state.height}>
      <g transform={`translate(${this.props.padding[3]}, ${this.props.padding[0]})`}>
        {this.renderLeak(xScale, yScale)}
        {this.renderHorizontalGrid(xScale, yScale)}
        {this.renderTicks(xScale, yScale)}
        {this.renderLine(xScale, yScale)}
        {this.renderEvents(xScale, yScale)}
      </g>
    </svg>;
  }
});
