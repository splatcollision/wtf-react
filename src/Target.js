// Target.js

// random position rotation vector, hittable by projectiles


import React from 'react';
import './Target.css';
import Boundable from './Boundable';

class Target extends Boundable {

	constructor(props) {
		super(props);
		this.START = {x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight};
		var vecMult = Math.min(this.props.gameRound, 5); // round 5 was fast enough
		this.STARTVEC = {
				x: (Math.random() - 0.5) * this.props.gameRound,
				y: (Math.random() - 0.5) * this.props.gameRound
			}
		if (props.startPos) {

			this.START = props.startPos;
		}
		if (props.startVec) {
			this.STARTVEC.x *= props.startVec.x;
			this.STARTVEC.y *= props.startVec.y;
		}
		// console.log("this.props.gameRound", this.props.gameRound, typeof this.props.gameRound);
		this.width = this.props.isHit ? 40 : 60;
		this.invulnTicks = 10;
		this.state = {
			location: {
				x: this.START.x,
				y: this.START.y
			},
			vector: this.STARTVEC,
			stylePos: {transform: "translate(" + this.START.x + "px, " + this.START.y + "px)"}
		}
		// console.log("this.state.vector", this.state.vector);
	}

	componentDidMount() {


		this.raf = window.requestAnimationFrame(this.animate.bind(this))
	}

	componentWillUnmount() {
		this.raf && window.cancelAnimationFrame(this.raf);
	}

	get loc() {
		return this.state.location;
	}
	componentWillReceiveProps(props) {
		console.log("target got props", props);
	}



	animate() {

		var newloc = {
					x: this.state.location.x + this.state.vector.x,
					y: this.state.location.y + this.state.vector.y,
					w: this.width
				}
		// bound check new loc
		newloc = this.boundCheck(newloc);
		this.invulnTicks--;
		if (this.invulnTicks <= 0) this.props.reportPosition(this.props.id, newloc);
		// newloc = this.boundCheck(newloc);
		// TODO keep track of target quadrant for faster collision detection...
		this.setState({
			location: newloc,
			cname: "target" + (this.props.isHit ? " hit" : ""),
			stylePos: {transform: "translate(" + newloc.x + "px, " + newloc.y + "px)"},
			// shipRot: {transform: "rotate(" + this.state.rotation.deg + "deg)" }
		})

		this.raf = window.requestAnimationFrame(this.animate.bind(this))
	}

	render() {
		return (
			<div className={this.state.cname} style={this.state.stylePos}>
				<div className="coord" />
			</div>
		);
	}
}

export default Target;

