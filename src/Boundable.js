// Boundable.js



import { Component } from 'react';





class Boundable extends Component {

	constructor(props) {
		super(props);
		// var w = props.w || 40;
		// var h = props.h || 40;
		this.BOUNDS = {
			T: 0,
			L: 0,
			R: window.innerWidth,
			B: window.innerHeight
		}
	}

	boundCheck(loc) {
		if (loc.x > this.BOUNDS.R) {
			loc.x = this.BOUNDS.L;
		}
		if (loc.x < this.BOUNDS.L) {
			loc.x = this.BOUNDS.R;
		}
		if (loc.y > this.BOUNDS.B) {
			loc.y = this.BOUNDS.T;
		}
		if (loc.y < this.BOUNDS.T) {
			loc.y = this.BOUNDS.B;
		}
		return loc;
	}

}

export default Boundable;