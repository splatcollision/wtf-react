// Projectile.js

import React from 'react';
// import ReactDOM from 'react-dom';
import './Projectile.css';

import Boundable from './Boundable';

class Projectile extends Boundable {

	// TODO needs to inherit the BOUNDS wrapping behavior that ship does.
	constructor(props) {
		super(props);
		// console.log("Projectile props", props);
		// this.props.shotid = this.props.key;
		// this.location = {x: props.location.x, y: props.location.y };
		this.SPEED = 15;
		this.MAXAGE = 60;
		if (props.spread) {
			this.MAXAGE = 30;
		}
		// animate it a tick on construction
		var rad = (this.props.rotation.deg - 90) * (Math.PI / 180);
		var dx = Math.cos(rad);
		var dy = Math.sin(rad);
		var newloc = {x: this.props.vector.x + this.props.location.x + (dx * this.SPEED), y: this.props.vector.y + this.props.location.y + (dy * this.SPEED)};

		this.state = {
			location: {x: newloc.x, y: newloc.y },
			rotation: props.rotation,
			vector: props.vector,
			stylePos: {transform: "translate(" + props.location.x + "px, " + props.location.y + "px)"},
			styleRot: {transform: "rotate(" + props.rotation.deg + "deg)" },
			age: 0
		}
		
		
	}

	componentDidMount() {
		this.raf = requestAnimationFrame(this.animate.bind(this));

	}

	animate() {
		var rad = (this.state.rotation.deg - 90) * (Math.PI / 180);
		var dx = Math.cos(rad);
		var dy = Math.sin(rad);
		var newloc = {x: this.state.vector.x + this.state.location.x + (dx * this.SPEED), y: this.state.vector.y + this.state.location.y + (dy * this.SPEED)};
		newloc = this.boundCheck(newloc);
		this.props.reportPosition(this.props.shotid, newloc);
		// console.log("newloc", newloc);
		this.setState({
			location: newloc,
			age: this.state.age + 1,
			stylePos: {transform: "translate(" + newloc.x + "px, " + newloc.y + "px)"},
		})

		if (this.state.age < this.MAXAGE) {
			this.raf = requestAnimationFrame(this.animate.bind(this));	
		} else {
			// we are done self destroy
			// console.log("remove projectile:", this);
			this.props.projectileDone(this);
		}
		
	}

	componentWillUnmount() {
		this.raf && window.cancelAnimationFrame(this.raf);
	}
	render() {
		return(
			<div className="projectile-container" style={this.state.stylePos}>
				<div className="coord" />
				<div className="projectile" style={this.state.styleRot} />
			</div>
		)
	}
}

export default Projectile;