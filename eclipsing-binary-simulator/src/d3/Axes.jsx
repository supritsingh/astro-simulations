import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

export default class Axes extends Component {
    constructor(props) {
        super(props);
        this.xAxis = React.createRef();
        this.xAxis2 = React.createRef();
        this.yAxis = React.createRef();
    }

    componentDidMount() {
        this.renderAxes();
    }

    renderAxes() {
        const xAxis = d3.axisBottom(this.props.xScale || 1).ticks(10);
        const xAxis2 = d3.axisBottom(this.props.xScale || 1)
                         .tickValues([0.8, 0.0, 0.2, 0.4, 0.6])
                         .tickArguments([10, 's']);
        //.ticks(10);
        const yAxis = d3.axisLeft(this.props.yScale).ticks(4);

        const node1 = this.yAxis.current;
        d3.select(node1).call(yAxis);

        const node2 = this.xAxis.current;
        //d3.select(node2).call(xAxis);
        //d3.select(node2).select('text').remove();

        const node3 = this.xAxis2.current;
        d3.select(node3).call(xAxis2);
    }

    render() {
        return <React.Fragment>
            <g className="yAxis" ref={this.yAxis}
               transform={`translate(${this.props.paddingLeft}, 0)`}
            />
            <g className="xAxis" ref={this.xAxis}
               transform={
               `translate(${(this.props.offset - (this.props.graphWidth / 2)) % this.props.graphWidth},` +
                          `${this.props.height - this.props.padding})`
               }
            />
            <g className="xAxis" ref={this.xAxis2}
               transform={
               `translate(${(this.props.offset + (this.props.graphWidth / 2)) % this.props.graphWidth},` +
                          `${this.props.height - this.props.padding})`
               }
            />
            <text
                transform="rotate(-90)"
                x="-80"
                y="6"
                dy=".8em"
                fontSize=".9em"
                fontWeight="bold"
                textAnchor="end">Normalized Visual Flux</text>
        </React.Fragment>;
    }
}

Axes.propTypes = {
    yScale: PropTypes.func.isRequired,
    xScale: PropTypes.func,
    graphWidth: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    padding: PropTypes.number.isRequired,
    paddingLeft: PropTypes.number.isRequired
};
