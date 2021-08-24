import React from 'react';
import * as PIXI from 'pixi.js';
import PropTypes from 'prop-types';
import anime from 'animejs/lib/anime.es.js';


// Sun's diameter in pixels
const AU_PIXELS = 100;
const STAR_ORIGIN_POINT = [100, 150];
const KM_AU = 149597870.7;
const SOLAR_RADIUS_KM = 695700;

const ZOOM_UPPER_BREAKPOINT = 960 * 0.8;
const ZOOM_LOWER_BREAKPOINT = STAR_ORIGIN_POINT[0] + 100;

const SOLAR_SYSTEM = {
    name: 'Sun',
    mass: 1.0,
    luminosity: 1.0,
    temperature: 5700,
    radius: 1.0,
    planets: [
        {name: 'Mercury', distance: 0.387098},
        {name: 'Venus', distance: 0.723332},
        {name: 'Earth', distance: 1.0},
        {name: 'Mars', distance: 1.523679},
        {name: 'Jupiter', distance: 5.2044},
        {name: 'Saturn', distance: 9.5826},
        {name: 'Uranus', distance: 19.2185},
        {name: 'Neptune', distance: 30.07},
        {name: 'Pluto', distance: 39.482},
    ]
}


export default class CSHZDiagram extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            showSolarSystemOrbits: true
        }

        this.cshzDiagram = React.createRef();
        this.timeoutID = React.createRef(null);
        this.prevPlanetDist = React.createRef(null);

        this.renderStarSystem = this.renderStarSystem.bind(this);
        this.renderStar = this.renderStar.bind(this);
        this.renderPlanet = this.renderPlanet.bind(this);
        this.auToPixels = this.auToPixels.bind(this);
        this.solarRadiusToPixels = this.solarRadiusToPixels.bind(this);
        this.handleShowSolarSystemOrbits = this.handleShowSolarSystemOrbits.bind(this);
        this.getPosPixelsPerAU = this.getPosPixelsPerAU.bind(this);
    }

    zoomLevels = [
        {value: 0.005, pixelsPerAU: AU_PIXELS * (1 / 0.005)},
        {value: 0.01, pixelsPerAU: AU_PIXELS * (1 / 0.01)},
        {value: 0.05, pixelsPerAU: AU_PIXELS * (1 / 0.05)},
        {value: 0.1, pixelsPerAU: AU_PIXELS * (1 / 0.1)},
        {value: 0.5, pixelsPerAU: AU_PIXELS * (1 / 0.5)},
        {value: 1, pixelsPerAU: AU_PIXELS},
        {value: 5, pixelsPerAU: AU_PIXELS * (1 / 5)},
        {value: 10, pixelsPerAU: AU_PIXELS * (1 / 10)},
        {value: 50, pixelsPerAU: AU_PIXELS * (1 / 50)},
        {value: 100, pixelsPerAU: AU_PIXELS * (1 / 100)},
    ]

    componentDidMount() {
        const app = new PIXI.Application({
            backgroundColor: 0x000000,
            width: this.cshzDiagram.current.clientWidth,
            height: 300,
            sharedLoader: true,
            sharedTicker: true,
            antiAliasing: true,
        });

        this.app = app;
        this.cshzDiagram.current.appendChild(app.view);

        const INITIAL_ZOOM_LEVEL = 4;
        const planetXPosition = STAR_ORIGIN_POINT[0] + this.auToPixels(this.props.planetDistance, this.zoomLevels[INITIAL_ZOOM_LEVEL].pixelsPerAU)
        this.renderStarSystem(this.zoomLevels[INITIAL_ZOOM_LEVEL].pixelsPerAU, planetXPosition, INITIAL_ZOOM_LEVEL);
    }

    componentDidUpdate(prevProps, prevState) {
        const [planetXPosition, pixelsPerAU, zoomLevel] = this.getPosPixelsPerAU(this.props.planetDistance);

        if (this.state.showSolarSystemOrbits !== prevState.showSolarSystemOrbits ||
           this.props.habitableZoneInner !== prevProps.habitableZoneInner) {
           // You don't need to rerender the whole star system, break this up
            this.renderStarSystem(pixelsPerAU, planetXPosition, zoomLevel);
        } else if (this.props.starRadius !== prevProps.starRadius) {
            this.renderStar(pixelsPerAU);
        } else if(this.props.planetDistance !== prevProps.planetDistance) {
            const me = this;

            if (this.timeoutID.current) {
                window.clearTimeout(this.timeoutID.current)
                //console.log(anime.running);
                //anime.running.map((el) => {el.pause()})
                this.timeoutID.current = null;
            }

            if (this.prevPlanetDist.current == null) {
                this.prevPlanetDist.current = prevProps.planetDistance;
            }

            this.timeoutID.current = window.setTimeout(() => {
                const obj = {planetDistance: me.prevPlanetDist.current}
                anime({
                    targets: obj,
                    planetDistance: me.props.planetDistance,
                    duration: 10000,
                    begin: function() {
                        console.log('BEGIN');
                        const [plntXPos, pixPerAU, zmLvl] = me.getPosPixelsPerAU(obj.planetDistance);
                        console.log(obj.planetDistance);
                        console.log(pixPerAU, plntXPos, zmLvl)
                    },
                    update: function() {
                        const [plntXPos, pixPerAU, zmLvl] = me.getPosPixelsPerAU(obj.planetDistance);
                        console.log(obj.planetDistance);
                        //console.log(pixPerAU, plntXPos, zoomLevel)
                        me.renderStarSystem(pixPerAU, plntXPos, zmLvl);
                    },
                    complete: function() {
                        console.log('FINISH');
                        const [plntXPos, pixPerAU, zmLvl] = me.getPosPixelsPerAU(obj.planetDistance);
                        console.log(obj.planetDistance);
                        console.log(pixPerAU, plntXPos, zmLvl)
                        me.timeoutID.current = null;
                        me.prevPlanetDist.current = null;
                    }
                })
            }, 1000)
            //this.renderStarSystem(pixelsPerAU, planetXPosition, zoomLevel);
        }
    }

    getPosPixelsPerAU(planetDistance) {
        // Returns the planet's position in pixels in the PIXI scene and the pixels
        // per AU to draw the scene

        // First determine a zoom level
        let zoomLevel = 0;
        let pixelsFromStar = this.auToPixels(planetDistance, this.zoomLevels[zoomLevel].pixelsPerAU);
        let planetXPosition = STAR_ORIGIN_POINT[0] + pixelsFromStar;
        while (planetXPosition > ZOOM_UPPER_BREAKPOINT) {
             zoomLevel++;
             pixelsFromStar = this.auToPixels(this.props.planetDistance, this.zoomLevels[zoomLevel].pixelsPerAU);
             planetXPosition = STAR_ORIGIN_POINT[0] + pixelsFromStar;
        }

        // Then calculate an offset based on a percentage of the
        // planet's distance between the two breakpoints. Relate this
        // offset in terms of the pct of the difference between
        // two adjacent zoom level's pixels per AU

        // If its the max zoom level, just return. No need to scale the value
        if (zoomLevel == this.zoomLevels.length - 1) {
            return [planetXPosition, this.zoomLevels[zoomLevel].pixelsPerAU, zoomLevel]
        }

        const pixBtnBreakpnts = ZOOM_UPPER_BREAKPOINT - ZOOM_LOWER_BREAKPOINT;
        const pctDistFromStar = pixelsFromStar / pixBtnBreakpnts;
        const pixPerAUInterval = this.zoomLevels[zoomLevel].pixelsPerAU - this.zoomLevels[zoomLevel + 1].pixelsPerAU
        const scaledPixPerAU = this.zoomLevels[zoomLevel].pixelsPerAU - (pctDistFromStar * pixPerAUInterval)

        return [planetXPosition, scaledPixPerAU, zoomLevel];

    }

    auToPixels(au, pixelsPerAU) {
        const val = au * pixelsPerAU;
        return val >= 1 ? val : 1;
    }

    solarRadiusToPixels(solarRadius, pixelsPerAU) {
        return this.auToPixels((solarRadius * SOLAR_RADIUS_KM) / KM_AU, pixelsPerAU);
    }

    renderPlanet(pixelsPerAU, planetXPosition) {
        if(this.planet) {
            this.planet.clear();
        } else {
            this.planet = new PIXI.Graphics();
            this.app.stage.addChild(this.planet);
        }

        this.planet.beginFill(0x0000FF);
        this.planet.drawCircle(
            planetXPosition,
            STAR_ORIGIN_POINT[1],
            15
        );
        this.planet.endFill();
    }

    renderStar(pixelsPerAU) {
        if(this.star) {
            this.star.clear();
        } else {
            this.star = new PIXI.Graphics();
            this.app.stage.addChild(this.star);
        }

        this.star.beginFill(0xFFFFFF);
        this.star.drawCircle(
            STAR_ORIGIN_POINT[0],
            STAR_ORIGIN_POINT[1],
            this.solarRadiusToPixels(this.props.starRadius, pixelsPerAU)
        );
        this.star.endFill();
    }

    renderStarSystem(pixelsPerAU, planetXPosition, zoomLevel) {
        //console.log(pixelsPerAU, planetXPosition, zoomLevel);
        //console.log('RENDER STAR SYSTEM');
        // Clear the stage
        for (const child of this.app.stage.children) {
            // TODO: note this also clears the star and planet
            // Figure out a better way of checking this
            if (typeof child.clear === 'function') {
                child.clear();
            } else {
                child.destroy();
            }
        }


        this.renderStar(pixelsPerAU);

        // Planets
        if (this.state.showSolarSystemOrbits) {
            for (const planet of SOLAR_SYSTEM.planets) {
                let p = new PIXI.Graphics();
                p.lineStyle(1, 0xFFFFFF);
                p.arc(
                    STAR_ORIGIN_POINT[0],
                    STAR_ORIGIN_POINT[1],
                    this.auToPixels(planet.distance, pixelsPerAU),
                    0,
                    Math.PI * 2
                )
                this.app.stage.addChild(p);
            }
        }

        // Habitable Zone
        const hZoneInner = this.auToPixels(this.props.habitableZoneInner, pixelsPerAU);
        const hZoneOuter = this.auToPixels(this.props.habitableZoneOuter, pixelsPerAU);
        const HZONE_ALPHA = 0.5;
        let hZone = new PIXI.Graphics();
        hZone.beginFill(0x0000FF, HZONE_ALPHA)
            .drawCircle(STAR_ORIGIN_POINT[0], STAR_ORIGIN_POINT[1], hZoneOuter)
            .beginHole()
            .drawCircle(STAR_ORIGIN_POINT[0], STAR_ORIGIN_POINT[1], hZoneInner)
            .endHole()
        this.app.stage.addChild(hZone);

        // Scale
        let scaleText = new PIXI.Text(
            this.zoomLevels[zoomLevel].value + ' AU',
            {fill: 0xFFFFFF, fontSize: 16}
        );
        scaleText.position.set(800, 20);
        let scaleRect = new PIXI.Graphics();
        scaleRect.beginFill(0xFFFFFF);
        scaleRect.lineStyle(1, 0xFFFFFF);
        scaleRect.drawRect(800, 50, pixelsPerAU * this.zoomLevels[zoomLevel].value, 10)
        this.app.stage.addChild(scaleText);
        this.app.stage.addChild(scaleRect);
        // Because this can initiate a rerender, place it last
        this.renderPlanet(pixelsPerAU, planetXPosition);

    }

    handleShowSolarSystemOrbits() {
        this.setState((prevState) => {
            return {showSolarSystemOrbits: !prevState.showSolarSystemOrbits}
        })
    }

    render() {
        return (<>
            <div className='col-12' ref={this.cshzDiagram} />
            <div className="col-12">
                <form>
                    <div className='form-check'>
                        <input
                            id='show-orbits'
                            type='checkbox'
                            checked={this.state.showSolarSystemOrbits}
                            onChange={this.handleShowSolarSystemOrbits}
                            className={'form-check-input'} />
                        <label
                            className='form-check-label'
                            htmlFor='show-orbits'>
                            Show Solar System Orbits
                        </label>
                    </div>
                </form>
            </div>
        </>)
    }
}

CSHZDiagram.propTypes = {
    starRadius: PropTypes.number.isRequired,
    planetDistance: PropTypes.number.isRequired,
    habitableZoneInner: PropTypes.number.isRequired,
    habitableZoneOuter: PropTypes.number.isRequired,
}
