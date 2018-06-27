// Ship.js
import React from 'react';
// import ReactDOM from 'react-dom';
import ship from './ship.svg';
import './Ship.css';

import Boundable from './Boundable';

import {Howl} from 'howler';

var soundThurst = new Howl({
  src: ['./audio/thrust.wav']
});

class Ship extends Boundable {

	constructor(props) {
		super(props);
		this.state = {
			location: {x: window.innerWidth / 2, y: window.innerHeight / 2},
			vector: {x: 0, y: 0},
			rotation: { deg: 0 },
			shipPos: {transform: "translate(" + (window.innerWidth / 2) + "px, " + (window.innerHeight / 2) + "px)"},
			shipRot: {transform: "rotate(0deg)"}
		};

		// constants for the ship motion
		
		this.MAXSPEED = 20;
		this.THRUST = 0.2; // multiplier on the dx dy vector
		// key codes as strings because we set them as object keys for multiple keydown support
		this.UP = "38";
		this.DOWN = "40";
		this.LEFT = "37";
		this.RIGHT = "39";
		this.FIRE = "32";
		this.SHIFT = "16";


		
		// // track active shots
		// this.shots = [];
		// track keys down
		this.activeKeys = {};
	}

	// lifecycle - create, destroy

	componentDidMount() {
		requestAnimationFrame(this.animate.bind(this));
		document.addEventListener('keydown', this.handleKeys.bind(this));
		document.addEventListener('keyup', this.handleKeysOff.bind(this));
	}

	componentWillUnmount() {
		clearInterval(this.frame);
	}

	handleKeysOff(evt) {
		// remove from the keydown list
		delete this.activeKeys[evt.keyCode];

	}

	
	
	handleKeys(evt) {
		// console.log("evt.keyCode", evt.keyCode, this);


		this.activeKeys[evt.keyCode] = true;
		// console.log("this.state.rotation.deg, dx, dy", this.state.rotation.deg, dx, dy);

		// console.log("this.state", this.state);
	}

	checkActiveKeys() {
		var rad = (this.state.rotation.deg - 90) * (Math.PI / 180);
		var dx = Math.cos(rad) * this.THRUST;
		var dy = Math.sin(rad) * this.THRUST;

		// 81 = shoot mode 1 {q}
		// 87 = shoot mode 2 {w}
		var rotSpeed = 1;
		var newstate = { fireMode: 'standard1'};
		// var fireMode = "standard1";
		// console.log("this.activeKeys", this.activeKeys);
		// iterate activekeys and pass through switch
		for (var keyCode in this.activeKeys) {
			// console.log("keyCode", keyCode, this);
			switch(keyCode) {
				case this.SHIFT:
					if (this.props.gameRound >= 3) {
						// shift key
						newstate.fireMode = "spread3";
						rotSpeed = 2.5;
					}
					
					break;

				// case 87:

				// 	break;
				case this.FIRE:
					// max fire rate let parent deal with it
					this.props.createProjectile(this.state);
					
					break;
				case this.UP: 
					// calculate vector diff based on current angle of rotation
					newstate.vector = {x: this.state.vector.x + dx, y: this.state.vector.y + dy};
					// soundThurst.play();
					break;
				case this.DOWN: 
					newstate.vector = {x: this.state.vector.x - dx, y: this.state.vector.y - dy};
					break;
				case this.LEFT: 
					newstate.rotation = {deg: this.state.rotation.deg - rotSpeed};
					break;
				case this.RIGHT: 
					newstate.rotation = {deg: this.state.rotation.deg + rotSpeed};
					break;
				default:
					break;
			}	
		}

		if (newstate.vector) {
			var speed = Math.sqrt((newstate.vector.x * newstate.vector.x) + (newstate.vector.y * newstate.vector.y));	
			// console.log("speed", speed);
			if (speed > this.MAXSPEED) {
				// limit plz - reset to last know vector state :)
				newstate.vector = this.state.vector;
			}
		}
		this.setState(newstate);
	}



	animate() {

		this.checkActiveKeys();
		// .. apply vector to location

		var newloc = {
					x: this.state.location.x + this.state.vector.x,
					y: this.state.location.y + this.state.vector.y
				}
		// bound check new loc
		newloc = this.boundCheck(newloc);
		this.props.reportPosition(newloc);
		this.setState({
			location: newloc,
			shipPos: {transform: "translate(" + newloc.x + "px, " + newloc.y + "px)"},
			shipRot: {transform: "rotate(" + this.state.rotation.deg + "deg)" },
			healthStyle: {opacity: (this.props.health / 100)}
		})
		
		requestAnimationFrame(this.animate.bind(this));
	}

	render() {

		return (
			<div>
				<div className="ship" style={this.state.shipPos}>
					<div className="ship" style={this.state.shipRot}>
						<div className="coord" />
						<img src={ship} className="App-logo" alt="your ship" style={this.state.healthStyle}/>

					</div>
				</div>
				
			</div>
		)
	}

}

export default Ship;