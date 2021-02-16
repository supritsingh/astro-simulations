import React from 'react';
import PropTypes from 'prop-types';
//import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {Demo} from 'cannon-es/examples/js/Demo.js';
import WEBGL from './utils/WebGL';


export default class Chamber extends React.Component {
    constructor(props) {
        super(props);

        this.id = 'ChamberView';
        this.el = React.createRef();

        this.particles = null;

        this.animate = this.animate.bind(this);
    }

    render() {
        return (
            <div id={this.id} ref={this.el}>
                <canvas
                    id={this.id + 'Canvas'}
                    width={1000} height={800} />
            </div>
        );
    }

    drawParticles(scene) {

    }

    /*drawParticles(scene, activeGases=[]) {
        const container = new PIXI.Container();

        const me = this;
        activeGases.forEach(function(gas) {
            for (let i = 0; i < 50; i++) {

                let p = new PIXI.Graphics();
                p.lineStyle(0);
                p.beginFill(gas.color, 1);
                p.drawCircle(
                    Math.random() * me.size,
                    Math.random() * me.size,
                    gas.particleSize);
                p.endFill();

                p.direction = Math.random() * Math.PI * 2;

                container.addChild(p);
            }
        });

        return container;
    }*/

    refreshScene() {
        //this.app.stage.removeChild(this.particles);
        this.particles = this.drawParticles(this.props.activeGases);
        //this.app.stage.addChild(this.particles);
    }

    componentDidMount() {
        /*this.app = new PIXI.Application({
          width: this.size,
          height: this.size,

          backgroundColor: 0xffffff,
          backgroundAlpha: 0,

          antialias: true
          });

          if (this.el && this.el.current) {
          this.el.current.appendChild(this.app.view);
          }*/

        /*if (!WEBGL.isWebGLAvailable()) {
          document.body.appendChild(WEBGL.getWebGLErrorMessage());
          }

          const width = this.el.current.clientWidth;
          const height = this.el.current.clientHeight;

          const aspect = width / height;
          const frustumSize = 10;

          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0xffffff);
          this.scene = scene;

          const camera = new THREE.OrthographicCamera(
          frustumSize * aspect / -2, frustumSize * aspect / 2,
          frustumSize / 2, frustumSize / -2,
          0.1, 1000
          );
          this.camera = camera;

          camera.position.z = 5;

          const canvas = document.getElementById(this.id + 'Canvas');
          const renderer = new THREE.WebGLRenderer({
          antialias: true,
          canvas: canvas
          });
          renderer.setPixelRatio(window.devicePixelRatio);
          this.renderer = renderer;

          const geometry = new THREE.BoxGeometry();
          const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
          const cube = new THREE.Mesh( geometry, material );
          scene.add( cube );
          this.cube = cube;
          this.drawParticles(scene, this.props.activeGases);

          if (this.el && this.el.current) {
          this.el.current.appendChild(this.renderer.domElement);
          this.start();
          }*/

        //const demo = new Demo();

        const nx = 4
        const ny = 15
        const nz = 4

        demo.addScene(`${nx * ny * nz} particles`, () => {
            const world = this.setupWorld(demo)

            const width = 10
            const height = 5
            const mass = 0.01

            const sph = new CANNON.SPHSystem()
            sph.density = 1
            sph.viscosity = 0.03
            sph.smoothingRadius = 1.0
            world.subsystems.push(sph)

            // Same material for everything
            const material = new CANNON.Material()
            const material_material = new CANNON.ContactMaterial(material, material, {
                friction: 0.06,
                restitution: 0.0,
            })
            world.addContactMaterial(material_material)

            // Ground plane
            const groundShape = new CANNON.Plane()
            const groundBody = new CANNON.Body({ mass: 0, material })
            groundBody.addShape(groundShape)
            groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
            world.addBody(groundBody)
            demo.addVisual(groundBody)

            // Plane -x
            const planeShapeXmin = new CANNON.Plane()
            const planeXmin = new CANNON.Body({ mass: 0, material })
            planeXmin.addShape(planeShapeXmin)
            planeXmin.quaternion.setFromEuler(0, Math.PI / 2, 0)
            planeXmin.position.set(-width * 0.5, 0, 0)
            world.addBody(planeXmin)

            // Plane +x
            const planeShapeXmax = new CANNON.Plane()
            const planeXmax = new CANNON.Body({ mass: 0, material })
            planeXmax.addShape(planeShapeXmax)
            planeXmax.quaternion.setFromEuler(0, -Math.PI / 2, 0)
            planeXmax.position.set(width * 0.5, 0, 0)
            world.addBody(planeXmax)

            // Plane -z
            const planeShapeZmin = new CANNON.Plane()
            const planeZmin = new CANNON.Body({ mass: 0, material })
            planeZmin.addShape(planeShapeZmin)
            planeZmin.quaternion.setFromEuler(0, 0, 0)
            planeZmin.position.set(0, 0, -height * 0.5)
            world.addBody(planeZmin)

            // Plane +z
            const planeShapeZmax = new CANNON.Plane()
            const planeZmax = new CANNON.Body({ mass: 0, material })
            planeZmax.addShape(planeShapeZmax)
            planeZmax.quaternion.setFromEuler(0, Math.PI, 0)
            planeZmax.position.set(0, 0, height * 0.5)
            world.addBody(planeZmax)

            // Create particles
            const randRange = 0.1
            for (let i = 0; i < nx; i++) {
                for (let j = 0; j < nz; j++) {
                    for (let k = 0; k < ny; k++) {
                        const particle = new CANNON.Body({ mass, material })
                        particle.addShape(new CANNON.Particle())
                        particle.position.set(
                            ((i + (Math.random() - 0.5) * randRange + 0.5) * width) / nx - width * 0.5,
                            (k * height) / nz,
                            ((j + (Math.random() - 0.5) * randRange + 0.5) * height) / nz - height * 0.5
                        )
                        world.addBody(particle)
                        sph.add(particle)
                        demo.addVisual(particle)
                    }
                }
            }
        })

        demo.start()
    }

    setupWorld(demo) {
        const world = demo.getWorld()
        world.gravity.set(0, -10, 0)

        // Tweak contact properties.
        // Contact stiffness - use to make softer/harder contacts
        world.defaultContactMaterial.contactEquationStiffness = 1e11

        // Stabilization time in number of timesteps
        world.defaultContactMaterial.contactEquationRelaxation = 2

        // Max solver iterations: Use more for better force propagation, but keep in mind that it's not very computationally cheap!
        world.solver.iterations = 10

        return world;
    }

    componentWillUnmount() {
        this.stop();
        this.el.current.removeChild(this.renderer.domElement);
    }

    start() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    }

    stop() {
        cancelAnimationFrame(this.frameId);
    }

    /**
     * Pass this function to the pixi ticker to animate the particles.
     */
    animate() {
        this.frameId = window.requestAnimationFrame(this.animate);

        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);

        /*const me = this;
        this.particles.children.forEach(function(p) {
            // Collision with wall
            // TODO
            if (p.x < 0 || p.x > me.size) {
                p.direction += Math.PI;
                p.direction %= (2 * Math.PI);
            }

            if (p.y < 0 || p.y < me.size) {
                p.direction += Math.PI;
                p.direction %= (2 * Math.PI);
            }

            p.position.x += Math.sin(p.direction) * delta;
            p.position.y += Math.cos(p.direction) * delta;
        });*/
    }

    componentDidUpdate(prevProps) {
        if (prevProps.activeGases !== this.props.activeGases) {
            this.refreshScene();
        }

        if (prevProps.isPlaying !== this.props.isPlaying) {
            if (this.props.isPlaying) {
                this.app.ticker.add(this.animate);
            } else {
                this.app.ticker.remove(this.animate);
            }
        }
    }
}

Chamber.propTypes = {
    activeGases: PropTypes.array.isRequired,
    isPlaying: PropTypes.bool.isRequired
};
