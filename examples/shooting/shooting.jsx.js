// generatedy by JSX compiler 0.9.4 (2013-02-05 02:15:22 +0900; 3a61f2b9fc031f140b52ae22d5e4c1416dcb0195)
var JSX = {};
(function (JSX) {

/**
 * copies the implementations from source interface to target
 */
function $__jsx_merge_interface(target, source) {
	for (var k in source.prototype)
		if (source.prototype.hasOwnProperty(k))
			target.prototype[k] = source.prototype[k];
}

/**
 * defers the initialization of the property
 */
function $__jsx_lazy_init(obj, prop, func) {
	function reset(obj, prop, value) {
		delete obj[prop];
		obj[prop] = value;
		return value;
	}

	Object.defineProperty(obj, prop, {
		get: function () {
			return reset(obj, prop, func());
		},
		set: function (v) {
			reset(obj, prop, v);
		},
		enumerable: true,
		configurable: true
	});
}

/**
 * sideeffect().a /= b
 */
function $__jsx_div_assign(obj, prop, divisor) {
	return obj[prop] = (obj[prop] / divisor) | 0;
}

/*
 * global functions called by JSX
 * (enamed so that they do not conflict with local variable names)
 */
var $__jsx_parseInt = parseInt;
var $__jsx_parseFloat = parseFloat;
var $__jsx_isNaN = isNaN;
var $__jsx_isFinite = isFinite;

var $__jsx_encodeURIComponent = encodeURIComponent;
var $__jsx_decodeURIComponent = decodeURIComponent;
var $__jsx_encodeURI = encodeURI;
var $__jsx_decodeURI = decodeURI;

var $__jsx_ObjectToString = Object.prototype.toString;
var $__jsx_ObjectHasOwnProperty = Object.prototype.hasOwnProperty;

/*
 * profiler object, initialized afterwards
 */
function $__jsx_profiler() {
}

/*
 * public interface to JSX code
 */
JSX.require = function (path) {
	var m = $__jsx_classMap[path];
	return m !== undefined ? m : null;
};

JSX.profilerIsRunning = function () {
	return $__jsx_profiler.getResults != null;
};

JSX.getProfileResults = function () {
	return ($__jsx_profiler.getResults || function () { return {}; })();
};

JSX.postProfileResults = function (url) {
	if ($__jsx_profiler.postResults == null)
		throw new Error("profiler has not been turned on");
	return $__jsx_profiler.postResults(url);
};

JSX.resetProfileResults = function () {
	if ($__jsx_profiler.resetResults == null)
		throw new Error("profiler has not been turned on");
	return $__jsx_profiler.resetResults();
};
JSX.DEBUG = false;
/**
 * class Config extends Object
 * @constructor
 */
function Config() {
}

Config.prototype = new Object;
/**
 * @constructor
 */
function Config$() {
};

Config$.prototype = new Config;

/**
 * class Sprite
 * @constructor
 */
function Sprite() {
}

Sprite.prototype.$__jsx_implements_Sprite = true;

/**
 * @constructor
 */
function Sprite$() {
};

Sprite$.prototype = new Sprite;

/**
 * @param {Sprite} other
 * @return {!boolean}
 */
Sprite.prototype.detectCollision$LSprite$ = function (other) {
	var $math_abs_t;
	return (($math_abs_t = this.x - other.x) >= 0 ? $math_abs_t : -$math_abs_t) < 16 && (($math_abs_t = this.y - other.y) >= 0 ? $math_abs_t : -$math_abs_t) < 16;
};

/**
 * @param {CanvasRenderingContext2D} context
 */
Sprite.prototype.draw$LCanvasRenderingContext2D$ = function (context) {
	context.drawImage(this.image, this.x - (this.width >> 1), this.y - (this.height >> 1));
};

/**
 * class MovingObject extends Object
 * @constructor
 */
function MovingObject() {
}

MovingObject.prototype = new Object;
$__jsx_merge_interface(MovingObject, Sprite);

/**
 * @constructor
 * @param {!number} x
 * @param {!number} y
 * @param {!number} dx
 * @param {!number} dy
 * @param {HTMLCanvasElement} image
 */
function MovingObject$NNNNLHTMLCanvasElement$(x, y, dx, dy, image) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.image = image;
};

MovingObject$NNNNLHTMLCanvasElement$.prototype = new MovingObject;

/**
 * @return {!boolean}
 */
MovingObject.prototype.update$ = function () {
	/** @type {!number} */
	var x$0;
	/** @type {!number} */
	var y$0;
	x$0 = this.x += this.dx;
	y$0 = this.y += this.dy;
	return ! (x$0 <= 0 || x$0 >= 320 || y$0 <= 0 || y$0 >= 480);
};

/**
 * @return {!boolean}
 */
MovingObject.prototype._inDisplay$ = function () {
	/** @type {!number} */
	var x$0;
	/** @type {!number} */
	var y$0;
	return ! ((x$0 = this.x) <= 0 || x$0 >= 320 || (y$0 = this.y) <= 0 || y$0 >= 480);
};

/**
 * class Bullet extends MovingObject
 * @constructor
 */
function Bullet() {
}

Bullet.prototype = new MovingObject;
/**
 * @constructor
 * @param {!number} x
 * @param {!number} y
 * @param {!number} dx
 * @param {!number} dy
 * @param {HTMLCanvasElement} image
 */
function Bullet$NNNNLHTMLCanvasElement$(x, y, dx, dy, image) {
	MovingObject$NNNNLHTMLCanvasElement$.call(this, x, y, dx, dy, image);
	this.width = 4;
	this.height = 4;
};

Bullet$NNNNLHTMLCanvasElement$.prototype = new Bullet;

/**
 * @param {Stage} st
 * @return {!boolean}
 */
Bullet.prototype.update$LStage$ = function (st) {
	var $math_abs_t;
	/** @type {!boolean} */
	var inDisplay;
	/** @type {!string} */
	var rockKey;
	/** @type {Rock} */
	var rock;
	/** @type {!string} */
	var newState;
	/** @type {CanvasRenderingContext2D} */
	var context$0;
	/** @type {!number} */
	var value1$0;
	/** @type {!string} */
	var scoreStr$0;
	/** @type {!string} */
	var fillz$0;
	/** @type {!number} */
	var score$0;
	inDisplay = MovingObject.prototype.update$.call(this);
	context$0 = st.ctx;
	context$0.drawImage(this.image, this.x - (this.width >> 1), this.y - (this.height >> 1));
	for (rockKey in st.rocks) {
		rock = st.rocks[rockKey];
		if ((($math_abs_t = this.x - rock.x) >= 0 ? $math_abs_t : -$math_abs_t) < 16 && (($math_abs_t = this.y - rock.y) >= 0 ? $math_abs_t : -$math_abs_t) < 16) {
			if (rock.hp === 0) {
				return false;
			}
			inDisplay = false;
			if (-- rock.hp === 0) {
				value1$0 = st.score + rock.score;
				score$0 = st.score = (value1$0 <= 999999999 ? value1$0 : 999999999);
				scoreStr$0 = score$0 + "";
				fillz$0 = "000000000".substring(0, 9 - scoreStr$0.length);
				st.scoreElement.innerHTML = fillz$0 + scoreStr$0 + "<br/>\n" + (st.fps + "") + " FPS";
				rock.dx = rock.dy = 0;
				rock.state = "bomb1";
				rock.image = st.images.bomb1;
			} else {
				newState = (rock.state + "w").substring(0, 6);
				rock.state = newState;
				rock.image = st.images[newState];
			}
		}
	}
	return inDisplay;
};

/**
 * class Rock extends MovingObject
 * @constructor
 */
function Rock() {
}

Rock.prototype = new MovingObject;
/**
 * @constructor
 * @param {!number} x
 * @param {!number} y
 * @param {!number} dx
 * @param {!number} dy
 * @param {!number} hp
 * @param {!number} score
 * @param {!string} state
 * @param {HTMLCanvasElement} image
 */
function Rock$NNNNNNSLHTMLCanvasElement$(x, y, dx, dy, hp, score, state, image) {
	MovingObject$NNNNLHTMLCanvasElement$.call(this, x, y, dx, dy, image);
	this.width = 32;
	this.height = 32;
	this.hp = hp;
	this.score = score;
	this.state = state;
};

Rock$NNNNNNSLHTMLCanvasElement$.prototype = new Rock;

/**
 * @param {Stage} st
 * @return {!boolean}
 */
Rock.prototype.update$LStage$ = function (st) {
	/** @type {!boolean} */
	var inDisplay;
	/** @type {!number} */
	var next;
	/** @type {CanvasRenderingContext2D} */
	var context$0;
	/** @type {!string} */
	var state$0;
	/** @type {!string} */
	var state$1;
	inDisplay = MovingObject.prototype.update$.call(this);
	context$0 = st.ctx;
	context$0.drawImage(this.image, this.x - (this.width >> 1), this.y - (this.height >> 1));
	if (this.hp === 0) {
		next = (this.state.substring(4) | 0) + 1;
		if (next > 10) {
			return false;
		} else {
			state$0 = "bomb" + (next + "");
			this.state = state$0;
			this.image = st.images[state$0];
		}
	} else {
		state$1 = this.state.substring(0, 5);
		this.state = state$1;
		this.image = st.images[state$1];
		if (st.state === "gaming" && this.detectCollision$LSprite$(st.ship)) {
			st.state = "dying";
			st.dying = 1;
		}
	}
	return inDisplay;
};

/**
 * @param {Stage} stage
 * @param {!string} state
 */
Rock.prototype.setState$LStage$S = function (stage, state) {
	this.state = state;
	this.image = stage.images[state];
};

/**
 * class SpaceShip extends Object
 * @constructor
 */
function SpaceShip() {
}

SpaceShip.prototype = new Object;
$__jsx_merge_interface(SpaceShip, Sprite);

/**
 * @constructor
 * @param {!number} x
 * @param {!number} y
 * @param {HTMLCanvasElement} image
 */
function SpaceShip$NNLHTMLCanvasElement$(x, y, image) {
	this.width = 32;
	this.height = 32;
	this.x = x;
	this.y = y;
	this.image = image;
};

SpaceShip$NNLHTMLCanvasElement$.prototype = new SpaceShip;

/**
 * class Stage extends Object
 * @constructor
 */
function Stage() {
}

Stage.prototype = new Object;
/**
 * @constructor
 * @param {HTMLCanvasElement} stageCanvas
 * @param {HTMLElement} scoreboard
 */
function Stage$LHTMLCanvasElement$LHTMLElement$(stageCanvas, scoreboard) {
	var $this = this;
	/** @type {HTMLCanvasElement} */
	var bg;
	/** @type {!number} */
	var i;
	/** @type {!number} */
	var loadedCount;
	/** @type {*} */
	var checkLoad;
	/** @type {undefined|!string} */
	var name;
	/** @type {HTMLImageElement} */
	var image;
	/** @type {*} */
	var touchStart;
	/** @type {HTMLElement} */
	var body;
	/** @type {*} */
	var touchMove;
	this.imageName = null;
	this.images = null;
	this.state = "loading";
	this.ship = null;
	this.dying = 0;
	this.lastX = -1;
	this.lastY = -1;
	this.frameCount = 0;
	this.currentTop = 0;
	this.ctx = null;
	this.bgCtx = null;
	this.bullets = null;
	this.rocks = null;
	this.numRocks = 0;
	this.score = 0;
	this.scoreElement = null;
	this.start = Date.now();
	this.fps = 0;
	this.state = "loading";
	this.imageName = [ "my", "bullet", "rock1", "rock2", "rock3" ];
	this.images = ({  });
	scoreboard.style.width = "320px";
	this.scoreElement = scoreboard;
	stageCanvas.width = 320;
	stageCanvas.height = 480;
	this.ctx = stageCanvas.getContext("2d");
	bg = dom.document.createElement("canvas");
	bg.width = 320;
	bg.height = 512;
	this.bgCtx = bg.getContext("2d");
	for (i = 0; i < 10; ++ i) {
		this.imageName.push("space" + (i + 1 + ""));
		this.imageName.push("bomb" + (i + 1 + ""));
	}
	loadedCount = 0;
	checkLoad = (function (e) {
		/** @type {HTMLImageElement} */
		var image;
		/** @type {HTMLCanvasElement} */
		var canvas;
		/** @type {CanvasRenderingContext2D} */
		var cx;
		image = e.target;
		canvas = dom.document.createElement("canvas");
		cx = canvas.getContext("2d");
		cx.drawImage(image, 0, 0);
		$this.images[image.name] = canvas;
		if (++ loadedCount === $this.imageName.length) {
			$this.initialize$();
		}
	});
	for (i = 0; i < this.imageName.length; ++ i) {
		name = this.imageName[i];
		image = dom.document.createElement("img");
		image.addEventListener("load", checkLoad);
		image.src = "img/" + name + ".png";
		image.name = name;
	}
	touchStart = (function (e) {
		/** @type {Array.<undefined|!number>} */
		var p;
		e.preventDefault();
		p = $this.getPoint$LEvent$(e);
		$this.lastX = p[0];
		$this.lastY = p[1];
		if ($this.state === "gameover") {
			$this.initialize$();
		}
	});
	body = dom.window.document.body;
	body.addEventListener("mousedown", touchStart);
	body.addEventListener("touchstart", touchStart);
	touchMove = (function (e) {
		/** @type {Array.<undefined|!number>} */
		var p;
		/** @type {SpaceShip} */
		var ship;
		/** @type {!number} */
		var value1$2;
		/** @type {!number} */
		var x$0;
		/** @type {!number} */
		var x$1;
		/** @type {!number} */
		var y$0;
		e.preventDefault();
		p = $this.getPoint$LEvent$(e);
		if ($this.state === "gaming" && $this.lastX !== -1) {
			ship = $this.ship;
			x$0 = ship.x += (p[0] - $this.lastX) * 2.5 | 0;
			ship.y += (p[1] - $this.lastY) * 3.0 | 0;
			x$1 = ship.x = (x$0 >= 0 ? x$0 : 0);
			ship.x = (x$1 <= 320 ? x$1 : 320);
			value1$2 = ship.y;
			y$0 = ship.y = (value1$2 >= 0 ? value1$2 : 0);
			ship.y = (y$0 <= 480 ? y$0 : 480);
		}
		$this.lastX = p[0];
		$this.lastY = p[1];
	});
	body.addEventListener("mousemove", touchMove);
	body.addEventListener("touchmove", touchMove);
};

Stage$LHTMLCanvasElement$LHTMLElement$.prototype = new Stage;

/**
 */
Stage.prototype.changeStateToBeLoading$ = function () {
	this.state = "loading";
};

/**
 * @return {!boolean}
 */
Stage.prototype.isLoading$ = function () {
	return this.state === "loading";
};

/**
 */
Stage.prototype.changeStateToBeGaming$ = function () {
	this.state = "gaming";
};

/**
 * @return {!boolean}
 */
Stage.prototype.isGaming$ = function () {
	return this.state === "gaming";
};

/**
 */
Stage.prototype.changeStateToBeDying$ = function () {
	this.state = "dying";
};

/**
 * @return {!boolean}
 */
Stage.prototype.isDying$ = function () {
	return this.state === "dying";
};

/**
 */
Stage.prototype.changeStateToBeGameOver$ = function () {
	this.state = "gameover";
};

/**
 * @return {!boolean}
 */
Stage.prototype.isGameOver$ = function () {
	return this.state === "gameover";
};

/**
 * @return {!number}
 */
Stage.prototype.level$ = function () {
	return (this.frameCount / 500 | 0);
};

/**
 */
Stage.prototype.drawBackground$ = function () {
	var $math_abs_t;
	/** @type {!number} */
	var bottom;
	bottom = 512 - this.currentTop;
	if (bottom > 0) {
		this.ctx.drawImage(this.bgCtx.canvas, 0, this.currentTop, 320, bottom, 0, 0, 320, bottom);
	}
	if ((($math_abs_t = 480 - bottom) >= 0 ? $math_abs_t : -$math_abs_t) > 0) {
		this.ctx.drawImage(this.bgCtx.canvas, 0, bottom);
	}
};

/**
 */
Stage.prototype.draw$ = function () {
	/** @type {SpaceShip} */
	var ship;
	/** @type {CanvasRenderingContext2D} */
	var context$0;
	/** @type {CanvasRenderingContext2D} */
	var context$1;
	/** @type {HTMLCanvasElement} */
	var image$0;
	this.drawBackground$();
	ship = this.ship;
	if (this.state === "gaming") {
		context$0 = this.ctx;
		context$0.drawImage(ship.image, ship.x - (ship.width >> 1), ship.y - (ship.height >> 1));
	} else {
		if (this.state === "dying") {
			image$0 = ship.image = this.images["bomb" + (this.dying + "")];
			context$1 = this.ctx;
			context$1.drawImage(image$0, ship.x - (ship.width >> 1), ship.y - (ship.height >> 1));
			if (++ this.dying > 10) {
				this.initialize$();
			}
		}
	}
};

/**
 * @param {!number} px
 * @param {!number} py
 */
Stage.prototype.drawSpace$NN = function (px, py) {
	/** @type {!string} */
	var spaceType;
	/** @type {HTMLCanvasElement} */
	var image;
	spaceType = (Math.random() * 10 + 1 | 0) + "";
	image = this.images["space" + spaceType];
	this.bgCtx.drawImage(image, px * 32, py * 32);
};

/**
 * @param {!number} dx
 * @param {!number} dy
 * @return {Bullet}
 */
Stage.prototype.createBullet$NN = function (dx, dy) {
	/** @type {SpaceShip} */
	var ship$0;
	return new Bullet$NNNNLHTMLCanvasElement$((ship$0 = this.ship).x, ship$0.y, dx * 20, dy * 20, this.images.bullet);
};

/**
 * @return {Rock}
 */
Stage.prototype.createRock$ = function () {
	/** @type {!number} */
	var level;
	/** @type {!number} */
	var px;
	/** @type {!number} */
	var py;
	/** @type {!number} */
	var fx;
	/** @type {!number} */
	var fy;
	/** @type {!number} */
	var r;
	/** @type {!number} */
	var d;
	/** @type {!number} */
	var hp;
	/** @type {!string} */
	var rockId;
	/** @type {!number} */
	var value1$0;
	level = this.frameCount / 500;
	px = this.ship.x + Math.random() * 100 - 50;
	py = this.ship.y + Math.random() * 100 - 50;
	fx = Math.random() * 320;
	fy = (level >= 4 ? Math.random() * 2 * 480 : 0);
	r = Math.atan2(py - fy, px - fx);
	value1$0 = Math.random() * (5.5 + level) + 1.5;
	d = (value1$0 >= 10 ? value1$0 : 10);
	hp = Math.random() * Math.random() * (5 + level / 4 | 0) | 1;
	rockId = (Math.random() * 3 + 1 | 0) + "";
	return new Rock$NNNNNNSLHTMLCanvasElement$(fx, fy, Math.cos(r) * d, Math.sin(r) * d, hp, hp * hp * 100, "rock" + rockId, this.images["rock" + rockId]);
};

/**
 */
Stage.prototype.tick$ = function () {
	var $this = this;
	/** @type {!number} */
	var line;
	/** @type {!number} */
	var px;
	/** @type {!string} */
	var fc;
	/** @type {!string} */
	var bulletKey;
	/** @type {!string} */
	var rockKey;
	/** @type {!string} */
	var spaceType$0;
	/** @type {HTMLCanvasElement} */
	var image$0;
	/** @type {!number} */
	var frameCount$0;
	++ this.frameCount;
	dom.window.setTimeout((function () {
		$this.tick$();
	}), 33);
	this.watchFPS$();
	if (this.state === "loading") {
		return;
	}
	if (-- this.currentTop === 0) {
		this.currentTop = 512;
	}
	if (this.currentTop % 32 === 0) {
		line = this.currentTop / 32 - 1;
		for (px = 0; px < 10; ++ px) {
			spaceType$0 = (Math.random() * 10 + 1 | 0) + "";
			image$0 = this.images["space" + spaceType$0];
			this.bgCtx.drawImage(image$0, px * 32, line * 32);
		}
	}
	this.draw$();
	fc = (frameCount$0 = this.frameCount) + "";
	if (this.state === "gaming" && frameCount$0 % 3 === 0) {
		this.bullets[fc + "a"] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, -20, -20, this.images.bullet);
		this.bullets[fc + "b"] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, 0, -20, this.images.bullet);
		this.bullets[fc + "c"] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, 20, -20, this.images.bullet);
		this.bullets[fc + "d"] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, -20, 20, this.images.bullet);
		this.bullets[fc + "e"] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, 20, 20, this.images.bullet);
	}
	if (this.numRocks < 5 + this.frameCount / 500) {
		this.rocks[fc + "r"] = this.createRock$();
		++ this.numRocks;
	}
	for (bulletKey in this.bullets) {
		if (! this.bullets[bulletKey].update$LStage$(this)) {
			delete this.bullets[bulletKey];
		}
	}
	for (rockKey in this.rocks) {
		if (! this.rocks[rockKey].update$LStage$(this)) {
			delete this.rocks[rockKey];
			-- this.numRocks;
		}
	}
};

/**
 */
Stage.prototype.initialize$ = function () {
	var $this = this;
	/** @type {!number} */
	var px;
	/** @type {!number} */
	var py;
	/** @type {!number} */
	var i;
	/** @type {HTMLCanvasElement} */
	var canvas;
	/** @type {CanvasRenderingContext2D} */
	var rctx;
	/** @type {!string} */
	var k;
	/** @type {!string} */
	var spaceType$0;
	/** @type {HTMLCanvasElement} */
	var image$0;
	for (px = 0; px < 10; ++ px) {
		for (py = 0; py < 16; ++ py) {
			spaceType$0 = (Math.random() * 10 + 1 | 0) + "";
			image$0 = this.images["space" + spaceType$0];
			this.bgCtx.drawImage(image$0, px * 32, py * 32);
		}
	}
	for (i = 0; i < 3; ++ i) {
		canvas = dom.document.createElement("canvas");
		canvas.width = 32;
		canvas.height = 32;
		rctx = canvas.getContext("2d");
		k = "rock" + (i + 1 + "");
		rctx.drawImage(this.images[k], 0, 0);
		rctx.globalCompositeOperation = "source-in";
		rctx.fillStyle = "#fff";
		rctx.fillRect(0, 0, canvas.width, canvas.height);
		this.images[k + "w"] = canvas;
	}
	this.currentTop = 512;
	this.ship = new SpaceShip$NNLHTMLCanvasElement$(80, 360 | 0, this.images.my);
	this.score = 0;
	this.bullets = ({  });
	this.rocks = ({  });
	this.numRocks = 0;
	this.state = "gaming";
	dom.window.setTimeout((function () {
		dom.window.scrollTo(0, 0);
	}), 250);
};

/**
 * @param {Event} e
 * @return {Array.<undefined|!number>}
 */
Stage.prototype.getPoint$LEvent$ = function (e) {
	/** @type {!number} */
	var px;
	/** @type {!number} */
	var py;
	/** @type {MouseEvent} */
	var me;
	/** @type {TouchEvent} */
	var te;
	px = 0;
	py = 0;
	if (e instanceof MouseEvent) {
		me = e;
		px = me.clientX;
		py = me.clientY;
	} else {
		if (e instanceof TouchEvent) {
			te = e;
			px = te.touches[0].pageX;
			py = te.touches[0].pageY;
		}
	}
	return [ px, py ];
};

/**
 */
Stage.prototype.watchFPS$ = function () {
	/** @type {!string} */
	var scoreStr$0;
	/** @type {!string} */
	var fillz$0;
	if (this.frameCount % 30 === 0) {
		this.fps = this.frameCount / (Date.now() - this.start) * 1000 | 0;
		scoreStr$0 = this.score + "";
		fillz$0 = "000000000".substring(0, 9 - scoreStr$0.length);
		this.scoreElement.innerHTML = fillz$0 + scoreStr$0 + "<br/>\n" + (this.fps + "") + " FPS";
	}
};

/**
 */
Stage.prototype.updateScore$ = function () {
	/** @type {!string} */
	var scoreStr;
	/** @type {!string} */
	var fillz;
	scoreStr = this.score + "";
	fillz = "000000000".substring(0, 9 - scoreStr.length);
	this.scoreElement.innerHTML = fillz + scoreStr + "<br/>\n" + (this.fps + "") + " FPS";
};

/**
 * class _Main extends Object
 * @constructor
 */
function _Main() {
}

_Main.prototype = new Object;
/**
 * @constructor
 */
function _Main$() {
};

_Main$.prototype = new _Main;

/**
 * @param {Array.<undefined|!string>} args
 */
_Main.main$AS = function (args) {
	/** @type {HTMLCanvasElement} */
	var stageCanvas;
	/** @type {HTMLElement} */
	var scoreboard;
	/** @type {Stage} */
	var stage;
	stageCanvas = dom.document.getElementById("stage");
	scoreboard = dom.document.getElementById("scoreboard");
	stage = new Stage$LHTMLCanvasElement$LHTMLElement$(stageCanvas, scoreboard);
	stage.tick$();
};

var _Main$main$AS = _Main.main$AS;

/**
 * class dom extends Object
 * @constructor
 */
function dom() {
}

dom.prototype = new Object;
/**
 * @constructor
 */
function dom$() {
};

dom$.prototype = new dom;

/**
 * @param {!string} id
 * @return {HTMLElement}
 */
dom.id$S = function (id) {
	return dom.document.getElementById(id);
};

var dom$id$S = dom.id$S;

/**
 * @param {!string} id
 * @return {HTMLElement}
 */
dom.getElementById$S = function (id) {
	return dom.document.getElementById(id);
};

var dom$getElementById$S = dom.getElementById$S;

/**
 * @param {!string} tag
 * @return {HTMLElement}
 */
dom.createElement$S = function (tag) {
	return dom.document.createElement(tag);
};

var dom$createElement$S = dom.createElement$S;

/**
 * class EventInit extends Object
 * @constructor
 */
function EventInit() {
}

EventInit.prototype = new Object;
/**
 * @constructor
 */
function EventInit$() {
	this.bubbles = false;
	this.cancelable = false;
};

EventInit$.prototype = new EventInit;

/**
 * class CustomEventInit extends EventInit
 * @constructor
 */
function CustomEventInit() {
}

CustomEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function CustomEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.detail = null;
};

CustomEventInit$.prototype = new CustomEventInit;

/**
 * class MutationObserverInit extends Object
 * @constructor
 */
function MutationObserverInit() {
}

MutationObserverInit.prototype = new Object;
/**
 * @constructor
 */
function MutationObserverInit$() {
	this.childList = false;
	this.attributes = false;
	this.characterData = false;
	this.subtree = false;
	this.attributeOldValue = false;
	this.characterDataOldValue = false;
	this.attributeFilter = null;
};

MutationObserverInit$.prototype = new MutationObserverInit;

/**
 * class UIEventInit extends EventInit
 * @constructor
 */
function UIEventInit() {
}

UIEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function UIEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
};

UIEventInit$.prototype = new UIEventInit;

/**
 * class FocusEventInit extends Object
 * @constructor
 */
function FocusEventInit() {
}

FocusEventInit.prototype = new Object;
/**
 * @constructor
 */
function FocusEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
	this.relatedTarget = null;
};

FocusEventInit$.prototype = new FocusEventInit;

/**
 * class MouseEventInit extends UIEventInit
 * @constructor
 */
function MouseEventInit() {
}

MouseEventInit.prototype = new UIEventInit;
/**
 * @constructor
 */
function MouseEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
	this.screenX = 0;
	this.screenY = 0;
	this.clientX = 0;
	this.clientY = 0;
	this.ctrlKey = false;
	this.shiftKey = false;
	this.altKey = false;
	this.metaKey = false;
	this.button = 0;
	this.buttons = 0;
	this.relatedTarget = null;
	this.region = null;
};

MouseEventInit$.prototype = new MouseEventInit;

/**
 * class WheelEventInit extends Object
 * @constructor
 */
function WheelEventInit() {
}

WheelEventInit.prototype = new Object;
/**
 * @constructor
 */
function WheelEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
	this.screenX = 0;
	this.screenY = 0;
	this.clientX = 0;
	this.clientY = 0;
	this.ctrlKey = false;
	this.shiftKey = false;
	this.altKey = false;
	this.metaKey = false;
	this.button = 0;
	this.buttons = 0;
	this.relatedTarget = null;
	this.deltaX = 0;
	this.deltaY = 0;
	this.deltaZ = 0;
	this.deltaMode = 0;
};

WheelEventInit$.prototype = new WheelEventInit;

/**
 * class KeyboardEventInit extends Object
 * @constructor
 */
function KeyboardEventInit() {
}

KeyboardEventInit.prototype = new Object;
/**
 * @constructor
 */
function KeyboardEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
	this.char = "";
	this.key = "";
	this.location = 0;
	this.ctrlKey = false;
	this.shiftKey = false;
	this.altKey = false;
	this.metaKey = false;
	this.repeat = false;
	this.locale = "";
	this.charCode = 0;
	this.keyCode = 0;
	this.which = 0;
};

KeyboardEventInit$.prototype = new KeyboardEventInit;

/**
 * class CompositionEventInit extends Object
 * @constructor
 */
function CompositionEventInit() {
}

CompositionEventInit.prototype = new Object;
/**
 * @constructor
 */
function CompositionEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
	this.data = null;
	this.locale = "";
};

CompositionEventInit$.prototype = new CompositionEventInit;

/**
 * class ProgressEventInit extends EventInit
 * @constructor
 */
function ProgressEventInit() {
}

ProgressEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function ProgressEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.lengthComputable = false;
	this.loaded = 0;
	this.total = 0;
};

ProgressEventInit$.prototype = new ProgressEventInit;

/**
 * class XMLHttpRequestOptions extends Object
 * @constructor
 */
function XMLHttpRequestOptions() {
}

XMLHttpRequestOptions.prototype = new Object;
/**
 * @constructor
 */
function XMLHttpRequestOptions$() {
	this.anon = false;
};

XMLHttpRequestOptions$.prototype = new XMLHttpRequestOptions;

/**
 * class TrackEventInit extends EventInit
 * @constructor
 */
function TrackEventInit() {
}

TrackEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function TrackEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.track = null;
};

TrackEventInit$.prototype = new TrackEventInit;

/**
 * class PopStateEventInit extends EventInit
 * @constructor
 */
function PopStateEventInit() {
}

PopStateEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function PopStateEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.state = null;
};

PopStateEventInit$.prototype = new PopStateEventInit;

/**
 * class HashChangeEventInit extends EventInit
 * @constructor
 */
function HashChangeEventInit() {
}

HashChangeEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function HashChangeEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.oldURL = "";
	this.newURL = "";
};

HashChangeEventInit$.prototype = new HashChangeEventInit;

/**
 * class PageTransitionEventInit extends EventInit
 * @constructor
 */
function PageTransitionEventInit() {
}

PageTransitionEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function PageTransitionEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.persisted = false;
};

PageTransitionEventInit$.prototype = new PageTransitionEventInit;

/**
 * class DragEventInit extends EventInit
 * @constructor
 */
function DragEventInit() {
}

DragEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function DragEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.view = null;
	this.detail = 0;
	this.screenX = 0;
	this.screenY = 0;
	this.clientX = 0;
	this.clientY = 0;
	this.ctrlKey = false;
	this.shiftKey = false;
	this.altKey = false;
	this.metaKey = false;
	this.button = 0;
	this.buttons = 0;
	this.relatedTarget = null;
	this.dataTransfer = null;
};

DragEventInit$.prototype = new DragEventInit;

/**
 * class CloseEventInit extends EventInit
 * @constructor
 */
function CloseEventInit() {
}

CloseEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function CloseEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.wasClean = false;
	this.code = 0;
	this.reason = "";
};

CloseEventInit$.prototype = new CloseEventInit;

/**
 * class StorageEventInit extends EventInit
 * @constructor
 */
function StorageEventInit() {
}

StorageEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function StorageEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.key = null;
	this.oldValue = null;
	this.newValue = null;
	this.url = "";
	this.storageArea = null;
};

StorageEventInit$.prototype = new StorageEventInit;

/**
 * class MessageEventInit extends EventInit
 * @constructor
 */
function MessageEventInit() {
}

MessageEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function MessageEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.data = null;
	this.origin = "";
	this.lastEventId = "";
	this.source = null;
	this.ports = null;
};

MessageEventInit$.prototype = new MessageEventInit;

/**
 * class ErrorEventInit extends EventInit
 * @constructor
 */
function ErrorEventInit() {
}

ErrorEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function ErrorEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.message = "";
	this.filename = "";
	this.lineno = 0;
};

ErrorEventInit$.prototype = new ErrorEventInit;

/**
 * class EventSourceInit extends Object
 * @constructor
 */
function EventSourceInit() {
}

EventSourceInit.prototype = new Object;
/**
 * @constructor
 */
function EventSourceInit$() {
	this.withCredentials = false;
};

EventSourceInit$.prototype = new EventSourceInit;

/**
 * class IDBObjectStoreParameters extends Object
 * @constructor
 */
function IDBObjectStoreParameters() {
}

IDBObjectStoreParameters.prototype = new Object;
/**
 * @constructor
 */
function IDBObjectStoreParameters$() {
	this.keyPath = null;
	this.autoIncrement = false;
};

IDBObjectStoreParameters$.prototype = new IDBObjectStoreParameters;

/**
 * class IDBIndexParameters extends Object
 * @constructor
 */
function IDBIndexParameters() {
}

IDBIndexParameters.prototype = new Object;
/**
 * @constructor
 */
function IDBIndexParameters$() {
	this.unique = false;
	this.multiEntry = false;
};

IDBIndexParameters$.prototype = new IDBIndexParameters;

/**
 * class IDBVersionChangeEventInit extends EventInit
 * @constructor
 */
function IDBVersionChangeEventInit() {
}

IDBVersionChangeEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function IDBVersionChangeEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.oldVersion = 0;
	this.newVersion = null;
};

IDBVersionChangeEventInit$.prototype = new IDBVersionChangeEventInit;

/**
 * class NotificationOptions extends Object
 * @constructor
 */
function NotificationOptions() {
}

NotificationOptions.prototype = new Object;
/**
 * @constructor
 */
function NotificationOptions$() {
	this.titleDir = "";
	this.body = "";
	this.bodyDir = "";
	this.tag = "";
	this.iconUrl = "";
};

NotificationOptions$.prototype = new NotificationOptions;

/**
 * class RTCSessionDescriptionInit extends Object
 * @constructor
 */
function RTCSessionDescriptionInit() {
}

RTCSessionDescriptionInit.prototype = new Object;
/**
 * @constructor
 */
function RTCSessionDescriptionInit$() {
	this.type = "";
	this.sdp = "";
};

RTCSessionDescriptionInit$.prototype = new RTCSessionDescriptionInit;

/**
 * class RTCIceCandidateInit extends Object
 * @constructor
 */
function RTCIceCandidateInit() {
}

RTCIceCandidateInit.prototype = new Object;
/**
 * @constructor
 */
function RTCIceCandidateInit$() {
	this.candidate = "";
	this.sdpMid = "";
	this.sdpMLineIndex = 0;
};

RTCIceCandidateInit$.prototype = new RTCIceCandidateInit;

/**
 * class RTCIceServer extends Object
 * @constructor
 */
function RTCIceServer() {
}

RTCIceServer.prototype = new Object;
/**
 * @constructor
 */
function RTCIceServer$() {
	this.url = "";
	this.credential = null;
};

RTCIceServer$.prototype = new RTCIceServer;

/**
 * class RTCConfiguration extends Object
 * @constructor
 */
function RTCConfiguration() {
}

RTCConfiguration.prototype = new Object;
/**
 * @constructor
 */
function RTCConfiguration$() {
	this.iceServers = null;
};

RTCConfiguration$.prototype = new RTCConfiguration;

/**
 * class DataChannelInit extends Object
 * @constructor
 */
function DataChannelInit() {
}

DataChannelInit.prototype = new Object;
/**
 * @constructor
 */
function DataChannelInit$() {
	this.reliable = false;
};

DataChannelInit$.prototype = new DataChannelInit;

/**
 * class RTCPeerConnectionIceEventInit extends EventInit
 * @constructor
 */
function RTCPeerConnectionIceEventInit() {
}

RTCPeerConnectionIceEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function RTCPeerConnectionIceEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.candidate = null;
};

RTCPeerConnectionIceEventInit$.prototype = new RTCPeerConnectionIceEventInit;

/**
 * class MediaStreamEventInit extends EventInit
 * @constructor
 */
function MediaStreamEventInit() {
}

MediaStreamEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function MediaStreamEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.stream = null;
};

MediaStreamEventInit$.prototype = new MediaStreamEventInit;

/**
 * class DataChannelEventInit extends EventInit
 * @constructor
 */
function DataChannelEventInit() {
}

DataChannelEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function DataChannelEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.channel = null;
};

DataChannelEventInit$.prototype = new DataChannelEventInit;

/**
 * class MediaStreamConstraints extends Object
 * @constructor
 */
function MediaStreamConstraints() {
}

MediaStreamConstraints.prototype = new Object;
/**
 * @constructor
 */
function MediaStreamConstraints$() {
	this.video = null;
	this.audio = null;
};

MediaStreamConstraints$.prototype = new MediaStreamConstraints;

/**
 * class MediaTrackConstraints extends Object
 * @constructor
 */
function MediaTrackConstraints() {
}

MediaTrackConstraints.prototype = new Object;
/**
 * @constructor
 */
function MediaTrackConstraints$() {
	this.mandatory = null;
	this.optional = null;
};

MediaTrackConstraints$.prototype = new MediaTrackConstraints;

/**
 * class HitRegionOptions extends Object
 * @constructor
 */
function HitRegionOptions() {
}

HitRegionOptions.prototype = new Object;
/**
 * @constructor
 */
function HitRegionOptions$() {
	this.path = null;
	this.id = "";
	this.parentID = null;
	this.cursor = "";
	this.control = null;
	this.label = null;
	this.role = null;
};

HitRegionOptions$.prototype = new HitRegionOptions;

/**
 * class WebGLContextAttributes extends Object
 * @constructor
 */
function WebGLContextAttributes() {
}

WebGLContextAttributes.prototype = new Object;
/**
 * @constructor
 */
function WebGLContextAttributes$() {
	this.alpha = false;
	this.depth = false;
	this.stencil = false;
	this.antialias = false;
	this.premultipliedAlpha = false;
	this.preserveDrawingBuffer = false;
};

WebGLContextAttributes$.prototype = new WebGLContextAttributes;

/**
 * class WebGLContextEventInit extends EventInit
 * @constructor
 */
function WebGLContextEventInit() {
}

WebGLContextEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function WebGLContextEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.statusMessage = "";
};

WebGLContextEventInit$.prototype = new WebGLContextEventInit;

/**
 * class DeviceOrientationEventInit extends EventInit
 * @constructor
 */
function DeviceOrientationEventInit() {
}

DeviceOrientationEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function DeviceOrientationEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.alpha = null;
	this.beta = null;
	this.gamma = null;
	this.absolute = false;
};

DeviceOrientationEventInit$.prototype = new DeviceOrientationEventInit;

/**
 * class DeviceMotionEventInit extends EventInit
 * @constructor
 */
function DeviceMotionEventInit() {
}

DeviceMotionEventInit.prototype = new EventInit;
/**
 * @constructor
 */
function DeviceMotionEventInit$() {
	this.bubbles = false;
	this.cancelable = false;
	this.acceleration = null;
	this.accelerationIncludingGravity = null;
	this.rotationRate = null;
	this.interval = null;
};

DeviceMotionEventInit$.prototype = new DeviceMotionEventInit;

/**
 * class js extends Object
 * @constructor
 */
function js() {
}

js.prototype = new Object;
/**
 * @constructor
 */
function js$() {
};

js$.prototype = new js;

Config.cols = 10;
Config.rows = 15;
Config.cellWidth = 32;
Config.cellHeight = 32;
Config.bulletWidth = 4;
Config.bulletHeight = 4;
Config.bulletSpeed = 20;
Config.reloadCount = 3;
Config.initialNumRocks = 5;
Config.FPS = 30;
Config.width = 320;
Config.height = 480;
Config.imagePath = "img";
Config.canvasId = "stage";
Config.scoreboardId = "scoreboard";
$__jsx_lazy_init(dom, "window", function () {
	return js.global.window;
});
$__jsx_lazy_init(dom, "document", function () {
	return js.global.document;
});
js.global = (function () { return this; })();
var $__jsx_classMap = {
	"shooting.jsx": {
		Config: Config,
		Config$: Config$,
		Sprite: Sprite,
		Sprite$: Sprite$,
		MovingObject: MovingObject,
		MovingObject$NNNNLHTMLCanvasElement$: MovingObject$NNNNLHTMLCanvasElement$,
		Bullet: Bullet,
		Bullet$NNNNLHTMLCanvasElement$: Bullet$NNNNLHTMLCanvasElement$,
		Rock: Rock,
		Rock$NNNNNNSLHTMLCanvasElement$: Rock$NNNNNNSLHTMLCanvasElement$,
		SpaceShip: SpaceShip,
		SpaceShip$NNLHTMLCanvasElement$: SpaceShip$NNLHTMLCanvasElement$,
		Stage: Stage,
		Stage$LHTMLCanvasElement$LHTMLElement$: Stage$LHTMLCanvasElement$LHTMLElement$,
		_Main: _Main,
		_Main$: _Main$
	},
	"system:lib/js/js/web.jsx": {
		dom: dom,
		dom$: dom$,
		EventInit: EventInit,
		EventInit$: EventInit$,
		CustomEventInit: CustomEventInit,
		CustomEventInit$: CustomEventInit$,
		MutationObserverInit: MutationObserverInit,
		MutationObserverInit$: MutationObserverInit$,
		UIEventInit: UIEventInit,
		UIEventInit$: UIEventInit$,
		FocusEventInit: FocusEventInit,
		FocusEventInit$: FocusEventInit$,
		MouseEventInit: MouseEventInit,
		MouseEventInit$: MouseEventInit$,
		WheelEventInit: WheelEventInit,
		WheelEventInit$: WheelEventInit$,
		KeyboardEventInit: KeyboardEventInit,
		KeyboardEventInit$: KeyboardEventInit$,
		CompositionEventInit: CompositionEventInit,
		CompositionEventInit$: CompositionEventInit$,
		ProgressEventInit: ProgressEventInit,
		ProgressEventInit$: ProgressEventInit$,
		XMLHttpRequestOptions: XMLHttpRequestOptions,
		XMLHttpRequestOptions$: XMLHttpRequestOptions$,
		TrackEventInit: TrackEventInit,
		TrackEventInit$: TrackEventInit$,
		PopStateEventInit: PopStateEventInit,
		PopStateEventInit$: PopStateEventInit$,
		HashChangeEventInit: HashChangeEventInit,
		HashChangeEventInit$: HashChangeEventInit$,
		PageTransitionEventInit: PageTransitionEventInit,
		PageTransitionEventInit$: PageTransitionEventInit$,
		DragEventInit: DragEventInit,
		DragEventInit$: DragEventInit$,
		CloseEventInit: CloseEventInit,
		CloseEventInit$: CloseEventInit$,
		StorageEventInit: StorageEventInit,
		StorageEventInit$: StorageEventInit$,
		MessageEventInit: MessageEventInit,
		MessageEventInit$: MessageEventInit$,
		ErrorEventInit: ErrorEventInit,
		ErrorEventInit$: ErrorEventInit$,
		EventSourceInit: EventSourceInit,
		EventSourceInit$: EventSourceInit$,
		IDBObjectStoreParameters: IDBObjectStoreParameters,
		IDBObjectStoreParameters$: IDBObjectStoreParameters$,
		IDBIndexParameters: IDBIndexParameters,
		IDBIndexParameters$: IDBIndexParameters$,
		IDBVersionChangeEventInit: IDBVersionChangeEventInit,
		IDBVersionChangeEventInit$: IDBVersionChangeEventInit$,
		NotificationOptions: NotificationOptions,
		NotificationOptions$: NotificationOptions$,
		RTCSessionDescriptionInit: RTCSessionDescriptionInit,
		RTCSessionDescriptionInit$: RTCSessionDescriptionInit$,
		RTCIceCandidateInit: RTCIceCandidateInit,
		RTCIceCandidateInit$: RTCIceCandidateInit$,
		RTCIceServer: RTCIceServer,
		RTCIceServer$: RTCIceServer$,
		RTCConfiguration: RTCConfiguration,
		RTCConfiguration$: RTCConfiguration$,
		DataChannelInit: DataChannelInit,
		DataChannelInit$: DataChannelInit$,
		RTCPeerConnectionIceEventInit: RTCPeerConnectionIceEventInit,
		RTCPeerConnectionIceEventInit$: RTCPeerConnectionIceEventInit$,
		MediaStreamEventInit: MediaStreamEventInit,
		MediaStreamEventInit$: MediaStreamEventInit$,
		DataChannelEventInit: DataChannelEventInit,
		DataChannelEventInit$: DataChannelEventInit$,
		MediaStreamConstraints: MediaStreamConstraints,
		MediaStreamConstraints$: MediaStreamConstraints$,
		MediaTrackConstraints: MediaTrackConstraints,
		MediaTrackConstraints$: MediaTrackConstraints$,
		HitRegionOptions: HitRegionOptions,
		HitRegionOptions$: HitRegionOptions$,
		WebGLContextAttributes: WebGLContextAttributes,
		WebGLContextAttributes$: WebGLContextAttributes$,
		WebGLContextEventInit: WebGLContextEventInit,
		WebGLContextEventInit$: WebGLContextEventInit$,
		DeviceOrientationEventInit: DeviceOrientationEventInit,
		DeviceOrientationEventInit$: DeviceOrientationEventInit$,
		DeviceMotionEventInit: DeviceMotionEventInit,
		DeviceMotionEventInit$: DeviceMotionEventInit$
	},
	"system:lib/js/js.jsx": {
		js: js,
		js$: js$
	}
};


/**
 * launches _Main.main(:string[]):void invoked by jsx --run|--executable
 */
JSX.runMain = function (sourceFile, args) {
	var module = JSX.require(sourceFile);
	if (! module) {
		throw new Error("entry point module not found in " + sourceFile);
	}

	if (! module._Main) {
		throw new Error("entry point _Main not found in " + sourceFile);
	}
	if (! module._Main.main$AS) {
		throw new Error("entry point _Main.main(:string[]):void not found in " + sourceFile);
	}
	module._Main.main$AS(args);
};

/**
 * launches _Test#test*():void invoked by jsx --test
 */
JSX.runTests = function (sourceFile, tests) {
	var module = JSX.require(sourceFile);
	var testClass = module._Test$;

	if (!testClass) return; // skip if there's no test class

	if(tests.length === 0) {
		var p = testClass.prototype;
		for (var m in p) {
			if (p[m] instanceof Function
				&& /^test.*[$]$/.test(m)) {
				tests.push(m);
			}
		}
	}
	else { // set as process arguments
		tests = tests.map(function (name) {
			return name + "$"; // mangle for function test*():void
		});
	}

	var testCase = new testClass();

	if (testCase.beforeClass$AS != null)
		testCase.beforeClass$AS(tests);

	for (var i = 0; i < tests.length; ++i) {
		(function (method) {
			if (method in testCase) {
				testCase.run$SF$V$(method, function() { testCase[method](); });
			}
			else {
				throw new ReferenceError("No such test method: " + method);
			}
		}(tests[i]));
	}

	if (testCase.afterClass$ != null)
		testCase.afterClass$();
};
/**
 * call a function on load/DOMContentLoaded
 */
function $__jsx_onload (event) {
	window.removeEventListener("load", $__jsx_onload);
	document.removeEventListener("DOMContentLoaded", $__jsx_onload);
	JSX.runMain("shooting.jsx", [])
}

window.addEventListener("load", $__jsx_onload);
document.addEventListener("DOMContentLoaded", $__jsx_onload);

})(JSX);
