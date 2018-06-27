// Environment.js


import React, { Component } from 'react';
import Ship from './Ship';
import Target from './Target';
import Obstacle from './Obstacle';
import Projectile from './Projectile';

import {Howl} from 'howler';

var soundShot = new Howl({
	volume: 0.5,
  src: ['./audio/shoot.wav']
});
var soundSplode = new Howl({
	volume: 0.5,
  src: ['./audio/explode.wav']
});
var soundDmg = new Howl({
	volume: 0.5,
  src: ['./audio/damage.wav']
});

class Environment extends Component {

	constructor(props) {
		super(props);

		this.TARGETNUM = 5;
		this.FRAGNUM = 3;
		this.targets = [];
		this.obstacles = [];
		
		// try and optimize collision detection plz
		this.QUADSIZE = 6;
		this.QUADRANTS = {w: window.innerWidth / this.QUADSIZE, h: window.innerHeight / this.QUADSIZE};
		this.spawnTargets(1);

		// projectiles:
		this.shots = [];
		this.state = {
			round: 1,
			shipHealth: 100,
			score: 0,
			hits: 0,
			fired: 0,
			shotMode: 1, // 1 = regular, 2 = spread
			shots: this.shots,
			targets: this.targets,
		}
		this.FIRERATE = 150; // in millseconds how freq we allow firing
		this.SHOTSMAX = 8;


		this.SCORING = {
			large: 100,
			small: 50,
			round: 1000
		}
		this.lastFire = Date.now();

		this.handleProjectileDone = this.projectileDone.bind(this); // stupid

		this.collisionMap = {
			ship: {},
			shots: {},
			targets: {},
			refs: {} // ids to quadrants
		}

		// populate quadrant space in collisionMap
		for (var x = 0; x <= this.QUADSIZE; x++) {
			for (var y = 0; y <= this.QUADSIZE; y++) {
				var key = "x" + x + "y" + y;
				this.collisionMap.shots[key] = {};
				this.collisionMap.targets[key] = {};
			}
		}
		console.log("this.collisionMap", this.collisionMap);
		// this.handleCreateProjectile = this.createProjectile.bind(this);
	}

	spawnTargets(round) {

		var total = this.TARGETNUM * round;
		for (var i = 0; i < total; i++) {
			this.targets.push(<Target reportPosition={this.reportPositionTargets.bind(this)} id={i} key={i} isHit={false} gameRound={round}/>)
		}

		// obstacles
		// for (var j = 0; j < 3; j++) {
		// 	this.obstacles.push(<Obstacle reportPosition={this.reportPositionTargets.bind(this)} id={j} key={j} gameRound={round}/>)	
		// }

	}

	takeShot(data, isSpread) {

		var key = Math.floor(Date.now() * Math.random());
		// adjust data.location as per half the ship width - 40 but respect the rotation angle do the trig
		var rad = (data.rotation.deg) * (Math.PI / 180); // offset 90 for better something something
		var dx = Math.cos(rad);
		var dy = Math.sin(rad);
		var shotVec = {
			x: data.vector.x,
			y: data.vector.y
		}
		var shotRot = {
			deg: data.rotation.deg
		}

		if (this.state.round < 3) isSpread = false; // only reg shots until round 3
		// 5 degrees of randomness on data.rotation.deg 
		if (isSpread) {
			var rnd = ((Math.random() - 0.5) * 30);
			// console.log("rnd", rnd);
			shotRot.deg += rnd;
			var rad2 = (shotRot.deg - 90) * (Math.PI / 180);
			var dx2 = Math.cos(rad2);
			var dy2 = Math.sin(rad2);
			shotVec.x += dx2;
			shotVec.y += dy2;
		}

		// var dy = Math.sin(rad);
		// console.log("data.rotation.deg, rad, dx, dy", data.rotation.deg, rad, dx, dy);
		var offset = {
			x: data.location.x + (40 * Math.abs(dx)),
			y: data.location.y + (20 * Math.abs(dy))
		}
		this.setState({fired: this.state.fired + 1});
		return <Projectile spread={isSpread} reportPosition={this.reportPositionShots.bind(this)} key={key} shotid={key} projectileDone={this.projectileDone.bind(this)} rotation={shotRot} location={offset} vector={shotVec} />;
	}

	createProjectile(data) {
		if (this.state.shipHealth <= 20) return;
		var now = Date.now();
		// console.log("data.fireMode", data.fireMode);
		// ship health slows down the fire rate :)
		if (this.lastFire + (this.FIRERATE + (100 - this.state.shipHealth)) < now) {
			this.lastFire = now;
			
			// console.log('environment will create a projectile kthx', data);
			if (this.shots.length >= this.SHOTSMAX) return;

			if (data.fireMode === "spread3") {
				for (var i = 0; i < 3; i++) {
					this.shots.push(this.takeShot(data, true));
				}
			} else {
				this.shots.push(this.takeShot(data));
			}
			
			this.setState({
				shots: this.shots
			})
			soundShot.play();
		}
		// if (this.shots.length > 0 && !this.currentlyCheckingCollisions) {
		// 	window.requestAnimationFrame(this.checkCollisions.bind(this));
			
		// }
	}

	projectileDone(projectile) {
		// console.log(projectile.props, this.shots);
		this.shots = this.shots.filter(function(shot){
			if (shot.props.shotid === projectile.props.shotid) return false;
			return true;
		})
		// this.shots.shift();
		this.setState({
			shots: this.shots
		})
	}

	getQuadrant(position) {
		// this.QUADRANTS.w and .h
		// find the range in which this position falls into
		var qx = Math.floor(position.x / this.QUADRANTS.w);
		var qy = Math.floor(position.y / this.QUADRANTS.h);
		return "x" + qx + "y" + qy;
	}

	// trackers for collision data
	reportPositionShots(id, position) {
		var q = this.getQuadrant(position);
		var prevq = this.collisionMap.refs[id];
		if (prevq && prevq !== q) delete this.collisionMap.shots[prevq][id];
		// console.log("q", q);
		if (this.collisionMap.shots[q]) {
			this.collisionMap.shots[q][id] = position;
			this.collisionMap.refs[id] = q;	
		} else {
			console.warn('undefined shot quadrant:'. q, prevq, id, position);
		}
		
	}

	reportPositionTargets(id, position) {
		var q = this.getQuadrant(position);
		var prevq = this.collisionMap.refs[id];
		if (prevq && prevq !== q) delete this.collisionMap.targets[prevq][id];
		// console.log("q", q);
		if (this.collisionMap.targets[q]) {
			this.collisionMap.targets[q][id] = position;
			this.collisionMap.refs[id] = q;	
		} else {
			console.warn('undefined target quadrant:'. q, prevq, id, position);
		}
		
	}

	reportPositionShip(position) {
		this.collisionMap.ship = position;
	}
	checkIntersect(q, shot, target) {
		// console.log("// shot, target", shot, target);
		if (!shot || !target) return;
		var shotloc = this.collisionMap.shots[q][shot.props.shotid];
		shotloc
		if (!shotloc) return;

		var targetloc = this.collisionMap.targets[q][target.props.id];
		if (!targetloc) return;		
		// projectiles are 80px wide as a bounding box.
		// consider actual beam width and offset here

		if (shotloc.x > targetloc.x && shotloc.x < targetloc.x + targetloc.w) {
			if (shotloc.y > targetloc.y && shotloc.y < targetloc.y + targetloc.w) {
				return targetloc;
			}
		}
	}

	checkShipIntersect(q, target) {
		if (!target) return;
		var shiploc = this.collisionMap.ship;
		var targetloc = this.collisionMap.targets[q][target.props.id];
		if (!targetloc) return;		
		// projectiles are 80px wide as a bounding box.
		// consider actual beam width and offset here
		// var rect1 = {x: 5, y: 5, width: 50, height: 50}
		// var rect2 = {x: 20, y: 10, width: 10, height: 10}
		shiploc.w = 48;
		shiploc.h = 80;
		// shiploc.x -= 10;
		targetloc.h = targetloc.w;
		// console.log("shiploc, targetloc", shiploc, targetloc);
		if (shiploc.x < targetloc.x + targetloc.w &&
		   shiploc.x + shiploc.w > targetloc.x &&
		   shiploc.y < targetloc.y + targetloc.h &&
		   shiploc.h + shiploc.y > targetloc.y) {
		   	
			// what's the vector angle between shiploc and targetloc - influence ship vector and target action
		   	return {x: (targetloc.x - shiploc.x) / 5, y: (targetloc.y - shiploc.y) / 5};
		}
	}

	checkCollisions() {
		var collisionLoc, now, newt;
		var score = this.state.score;
		var hits = this.state.hits;
		// var fired = this.state.fired;
		// first - each shot, what quadrant is it in, just those targets please
		for (var s in this.shots) {
			var shotQ = this.collisionMap.refs[this.shots[s].props.shotid];
			// console.log("shotQ", shotQ);
			var targetIds = this.collisionMap.targets[shotQ];
			if (!targetIds) continue;
			// console.log("targetIds", targetIds);
			for (var t in this.targets) {
				// we still need the orig component but we can shortcut it easier
				if (!targetIds[this.targets[t].props.id]) continue;

				// this.targets[t]
				collisionLoc = this.checkIntersect(shotQ, this.shots[s], this.targets[t])
				if (collisionLoc) {
					// console.log("HIT", s, t);
					hits++;
					this.shots.splice(s, 1);
					
					// console.log("isHit", this.targets[t].props.isHit);
					if (!this.targets[t].props.isHit) {
						now = Date.now();
						for (var i = 0; i < this.FRAGNUM; i++) {
							newt = i + "_" + Math.floor(now * Math.random());
							this.targets.push(<Target reportPosition={this.reportPositionTargets.bind(this)} id={newt} key={newt} startPos={collisionLoc} isHit={true} gameRound={this.state.round}/>);
						}	
						score += this.SCORING.large;

					} else {
						score += this.SCORING.small;
					}
					this.targets.splice(t, 1);

					soundSplode.play();
					continue;
				}
			}
		}

		// later check for ship > target collisions - again just in a quadrant
		var shipQ = this.getQuadrant(this.collisionMap.ship);
		var shipTargetIds = this.collisionMap.targets[shipQ];
		for (var t in this.targets) {
			// we still need the orig component but we can shortcut it easier
			if (!shipTargetIds[this.targets[t].props.id]) continue;
			var shipCollide = this.checkShipIntersect(shipQ, this.targets[t]);
			if (shipCollide) {
				// destroy the target, spawn new ones with a startVec
				if (!this.targets[t].props.isHit) {
					collisionLoc = this.collisionMap.targets[shipQ][this.targets[t].props.id];
					now = Date.now();
					for (var k = 0; k < this.FRAGNUM; k++) {
						newt =  now + "_" + k;
						this.targets.push(<Target startVec={shipCollide} reportPosition={this.reportPositionTargets.bind(this)} id={newt} key={newt} startPos={collisionLoc} isHit={true} gameRound={this.state.round}/>);
					}	
				}
				this.targets.splice(t, 1);
				this.setState({
					shipHealth: this.state.shipHealth - 5
				})
				soundDmg.play();
			}
		}


		window.requestAnimationFrame(this.checkCollisions.bind(this));
		this.currentlyCheckingCollisions = true;

		var newround = this.state.round;
		var shipH = this.state.shipHealth;
		if (this.targets.length === 0) {
			newround++;
			shipH = 100;
			score += this.SCORING.round;
			this.spawnTargets(newround);
		}
		// 
		// console.log("this.collisionMap.shots", this.collisionMap.shots);
		// var debugs = this.collisionMap.shots.map(function(shot){
		// 	console.log("shot", shot);
		// 	// return (<Debug)
		// })
		this.setState({
			round: newround,
			score: score,
			hits: hits,
			shipHealth: shipH,
			shots: this.shots,
			targets: this.targets,
			obstacles: this.obstacles
		})
	}


	componentDidMount() {
		window.requestAnimationFrame(this.checkCollisions.bind(this));
	}

	render() {
		return (
			<div>
				<Ship createProjectile={this.createProjectile.bind(this)} reportPosition={this.reportPositionShip.bind(this)} health={this.state.shipHealth} gameRound={this.state.round} />
				<div id="shots">
					{this.state.shots}
				</div>
				<div id="targets">
	        		{this.state.targets}
	        	</div>
	        	<div id="obstacles">
	        		{this.state.obstacles}
	        	</div>
	        	<div className="displays">
		        	<h1>Round {this.state.round}</h1>
		        	<ShipDestroyed health={this.state.shipHealth} />
		        	<Stats targets={this.state.targets.length} />
		        </div>
		        <div className="footer">
			        <Controls round={this.state.round} />
		        </div>
		        <div className="healthscore">
		        	<HealthScore health={this.state.shipHealth} score={this.state.score} fired={this.state.fired} hits={this.state.hits}/>
		        </div>
      		</div>
	    );
	}
}

function DebugPosWidth(props) {

}

function ShipDestroyed(props) {
	if (props.health > 20) return <div />
  	return <h2>Destroyed!</h2>
}

function Stats(props) {
	return <p>{props.targets} left.</p>
}

function HealthScore(props) {
	var hitPercent = 0;
	if (props.fired > 0) {
		hitPercent =  Math.floor((props.hits / props.fired) * 100);
	}
	return (
		<div>
			<h3>{props.health} health</h3>
			<h3>{props.score} score</h3>
			<h3>{hitPercent} hit %</h3>
		</div>
	)
}

function Controls(props) {
	// props.round
	var regMode = <p><code>space</code> to fire.</p>;
	var spreadMode;
	if (props.round > 2) {
		spreadMode = <p><code>shift + space</code> to fire triple lasers. Shorter range and random spread. Faster rotation, slower rate of fire.</p>
		regMode = <p><code>space</code> to fire regular lasers. Long range and good accuracy. High rate of fire.</p>;
	}
	return (
		<div>
			<p><code>arrows</code> to vector your ship. You have forward and backward thursters.</p>
			{ regMode }
			{ spreadMode }
		</div>
	)
}


export default Environment;
