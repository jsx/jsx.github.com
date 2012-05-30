var JSX = {};
(function () {

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
		Object.defineProperty(obj, prop, {
			value: value, 
			enumerable: true,
			writable: true,
			configurable: true
		});
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

/*
 * global functions called by JSX as Number.* (renamed so that they do not conflict with local variable names)
 */
var $__jsx_parseInt = parseInt;
var $__jsx_parseFloat = parseFloat;
var $__jsx_isNaN = isNaN;
var $__jsx_isFinite = isFinite;

var $__jsx_ObjectToString = Object.prototype.toString;
var $__jsx_ObjectHasOwnProperty = Object.prototype.hasOwnProperty;

/*
 * public interface to JSX code
 */
JSX.require = function (path) {
	var m = $__jsx_classMap[path];
	return m !== undefined ? m : null;
}
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
 * class Sprite extends Object
 * @constructor
 */
function Sprite() {
}

Sprite.prototype = new Object;
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
	this.x += this.dx;
	this.y += this.dy;
	return ! (this.x <= 0 || this.x >= 320 || this.y <= 0 || this.y >= 480);
};

/**
 * @return {!boolean}
 */
MovingObject.prototype._inDisplay$ = function () {
	return ! (this.x <= 0 || this.x >= 320 || this.y <= 0 || this.y >= 480);
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
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.image = image;
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
	/** @type {undefined|Rock} */
	var rock;
	/** @type {!string} */
	var newState;
	/** @type {CanvasRenderingContext2D} */
	var context$0;
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
				st.score = Math.min(st.score + rock.score, 999999999);
				st.updateScore$();
				rock.dx = rock.dy = 0;
				rock.state = "bomb1";
				rock.image = st.images["bomb1"];
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
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.image = image;
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
	var checkLoad;
	/** @type {undefined|!string} */
	var name;
	/** @type {HTMLImageElement} */
	var image;
	var touchStart;
	/** @type {HTMLElement} */
	var body;
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
	this.images = {  };
	scoreboard.style.width = "320px";
	this.scoreElement = scoreboard;
	stageCanvas.width = 320;
	stageCanvas.height = 480;
	this.ctx = (function (o) { return o instanceof CanvasRenderingContext2D ? o : null; })(stageCanvas.getContext("2d"));
	bg = (function (o) { return o instanceof HTMLCanvasElement ? o : null; })(dom.window.document.createElement("canvas"));
	bg.width = 320;
	bg.height = 512;
	this.bgCtx = (function (o) { return o instanceof CanvasRenderingContext2D ? o : null; })(bg.getContext("2d"));
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
		image = (function (o) { return o instanceof HTMLImageElement ? o : null; })(e.target);
		if (! (image != null)) {
			debugger;
			throw new Error("[shooting.jsx:453] assertion failure");
		}
		canvas = (function (o) { return o instanceof HTMLCanvasElement ? o : null; })(dom$createElement$S("canvas"));
		cx = (function (o) { return o instanceof CanvasRenderingContext2D ? o : null; })(canvas.getContext("2d"));
		if (! (cx != null)) {
			debugger;
			throw new Error("[shooting.jsx:457] assertion failure");
		}
		cx.drawImage(image, 0, 0);
		$this.images[image.dataset["name"]] = canvas;
		if (++ loadedCount === $this.imageName.length) {
			$this.initialize$();
		}
	});
	for (i = 0; i < this.imageName.length; ++ i) {
		name = this.imageName[i];
		image = (function (o) { return o instanceof HTMLImageElement ? o : null; })(dom.window.document.createElement("img"));
		image.addEventListener("load", checkLoad);
		image.src = "img/" + name + ".png";
		image.dataset["name"] = name;
	}
	touchStart = (function (e) {
		/** @type {Array.<undefined|!number>} */
		var p;
		e.preventDefault();
		p = $this.getPoint$LEvent$(e);
		$this.lastX = p[(0)];
		$this.lastY = p[(1)];
		if ($this.isGameOver$()) {
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
		e.preventDefault();
		p = $this.getPoint$LEvent$(e);
		if ($this.isGaming$() && $this.lastX !== -1) {
			ship = $this.ship;
			ship.x += (p[(0)] - $this.lastX) * 2.5 | 0;
			ship.y += (p[(1)] - $this.lastY) * 3.0 | 0;
			ship.x = Math.max(ship.x, 0);
			ship.x = Math.min(ship.x, 320);
			ship.y = Math.max(ship.y, 0);
			ship.y = Math.min(ship.y, 480);
		}
		$this.lastX = p[(0)];
		$this.lastY = p[(1)];
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
	return this.frameCount / 500;
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
	this.drawBackground$();
	ship = this.ship;
	if (this.state === "gaming") {
		context$0 = this.ctx;
		context$0.drawImage(ship.image, ship.x - (ship.width >> 1), ship.y - (ship.height >> 1));
	} else {
		if (this.state === "dying") {
			ship.image = this.images[("bomb" + (this.dying + ""))];
			context$1 = this.ctx;
			context$1.drawImage(ship.image, ship.x - (ship.width >> 1), ship.y - (ship.height >> 1));
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
	/** @type {undefined|HTMLCanvasElement} */
	var image;
	spaceType = (Math.random() * 10 + 1 | 0) + "";
	image = this.images[("space" + spaceType)];
	this.bgCtx.drawImage(image, px * 32, py * 32);
};

/**
 * @param {!number} dx
 * @param {!number} dy
 * @return {Bullet}
 */
Stage.prototype.createBullet$NN = function (dx, dy) {
	return new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, dx * 20, dy * 20, this.images["bullet"]);
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
	level = (this.frameCount / 500 | 0);
	px = this.ship.x + Math.random() * 100 - 50;
	py = this.ship.y + Math.random() * 100 - 50;
	fx = Math.random() * 320;
	fy = (level >= 4 ? Math.random() * 2 * 480 : 0);
	r = Math.atan2(py - fy, px - fx);
	d = Math.max(Math.random() * (5.5 + level) + 1.5, 10);
	hp = Math.random() * Math.random() * (5 + level / 4 | 0) | 1;
	rockId = (Math.random() * 3 + 1 | 0) + "";
	return new Rock$NNNNNNSLHTMLCanvasElement$(fx, fy, Math.cos(r) * d, Math.sin(r) * d, hp, hp * hp * 100, "rock" + rockId, this.images[("rock" + rockId)]);
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
			this.drawSpace$NN(px, line);
		}
	}
	this.draw$();
	fc = this.frameCount + "";
	if (this.state === "gaming" && this.frameCount % 3 === 0) {
		this.bullets[(fc + "a")] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, -20, -20, this.images["bullet"]);
		this.bullets[(fc + "b")] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, 0, -20, this.images["bullet"]);
		this.bullets[(fc + "c")] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, 20, -20, this.images["bullet"]);
		this.bullets[(fc + "d")] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, -20, 20, this.images["bullet"]);
		this.bullets[(fc + "e")] = new Bullet$NNNNLHTMLCanvasElement$(this.ship.x, this.ship.y, 20, 20, this.images["bullet"]);
	}
	if (this.numRocks < 5 + this.frameCount / 500) {
		this.rocks[(fc + "r")] = this.createRock$();
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
	for (px = 0; px < 10; ++ px) {
		for (py = 0; py < 16; ++ py) {
			this.drawSpace$NN(px, py);
		}
	}
	for (i = 0; i < 3; ++ i) {
		canvas = (function (o) { return o instanceof HTMLCanvasElement ? o : null; })(dom.window.document.createElement("canvas"));
		canvas.width = 32;
		canvas.height = 32;
		rctx = (function (o) { return o instanceof CanvasRenderingContext2D ? o : null; })(canvas.getContext("2d"));
		k = "rock" + (i + 1 + "");
		rctx.drawImage(this.images[k], 0, 0);
		rctx.globalCompositeOperation = "source-in";
		rctx.fillStyle = "#fff";
		rctx.fillRect(0, 0, canvas.width, canvas.height);
		this.images[(k + "w")] = canvas;
	}
	this.currentTop = 512;
	this.ship = new SpaceShip$NNLHTMLCanvasElement$(80, 360 | 0, this.images["my"]);
	this.score = 0;
	this.bullets = {  };
	this.rocks = {  };
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
		me = (function (o) { return o instanceof MouseEvent ? o : null; })(e);
		px = me.clientX;
		py = me.clientY;
	} else {
		if (e instanceof TouchEvent) {
			te = (function (o) { return o instanceof TouchEvent ? o : null; })(e);
			px = te.touches[(0)].pageX;
			py = te.touches[(0)].pageY;
		}
	}
	return [ px, py ];
};

/**
 */
Stage.prototype.watchFPS$ = function () {
	if (this.frameCount % 30 === 0) {
		this.fps = this.frameCount / (Date.now() - this.start) * 1000 | 0;
		this.updateScore$();
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
	/** @type {!string} */
	var id$0;
	stageCanvas = (function (o) { return o instanceof HTMLCanvasElement ? o : null; })(dom$id$S(args[(0)]));
	id$0 = args[(1)];
	scoreboard = (function (o) { return o instanceof HTMLElement ? o : null; })(dom.window.document.getElementById(id$0));
	stage = new Stage$LHTMLCanvasElement$LHTMLElement$(stageCanvas, scoreboard);
	stage.tick$();
};

_Main$main$AS = _Main.main$AS;

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
	return (function (o) { return o instanceof HTMLElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$id$S = dom.id$S;

/**
 * @param {!string} tag
 * @return {HTMLElement}
 */
dom.createElement$S = function (tag) {
	return dom.window.document.createElement(tag);
};

dom$createElement$S = dom.createElement$S;

/**
 * @param {!string} id
 * @return {HTMLUnknownElement}
 */
dom.getUnknownElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLUnknownElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getUnknownElementById$S = dom.getUnknownElementById$S;

/**
 * @param {!string} id
 * @return {HTMLHtmlElement}
 */
dom.getHtmlElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLHtmlElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getHtmlElementById$S = dom.getHtmlElementById$S;

/**
 * @param {!string} id
 * @return {HTMLHeadElement}
 */
dom.getHeadElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLHeadElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getHeadElementById$S = dom.getHeadElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTitleElement}
 */
dom.getTitleElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTitleElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTitleElementById$S = dom.getTitleElementById$S;

/**
 * @param {!string} id
 * @return {HTMLBaseElement}
 */
dom.getBaseElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLBaseElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getBaseElementById$S = dom.getBaseElementById$S;

/**
 * @param {!string} id
 * @return {HTMLLinkElement}
 */
dom.getLinkElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLLinkElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getLinkElementById$S = dom.getLinkElementById$S;

/**
 * @param {!string} id
 * @return {HTMLMetaElement}
 */
dom.getMetaElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLMetaElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getMetaElementById$S = dom.getMetaElementById$S;

/**
 * @param {!string} id
 * @return {HTMLStyleElement}
 */
dom.getStyleElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLStyleElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getStyleElementById$S = dom.getStyleElementById$S;

/**
 * @param {!string} id
 * @return {HTMLScriptElement}
 */
dom.getScriptElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLScriptElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getScriptElementById$S = dom.getScriptElementById$S;

/**
 * @param {!string} id
 * @return {HTMLBodyElement}
 */
dom.getBodyElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLBodyElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getBodyElementById$S = dom.getBodyElementById$S;

/**
 * @param {!string} id
 * @return {HTMLHeadingElement}
 */
dom.getHeadingElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLHeadingElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getHeadingElementById$S = dom.getHeadingElementById$S;

/**
 * @param {!string} id
 * @return {HTMLParagraphElement}
 */
dom.getParagraphElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLParagraphElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getParagraphElementById$S = dom.getParagraphElementById$S;

/**
 * @param {!string} id
 * @return {HTMLHRElement}
 */
dom.getHRElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLHRElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getHRElementById$S = dom.getHRElementById$S;

/**
 * @param {!string} id
 * @return {HTMLPreElement}
 */
dom.getPreElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLPreElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getPreElementById$S = dom.getPreElementById$S;

/**
 * @param {!string} id
 * @return {HTMLQuoteElement}
 */
dom.getQuoteElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLQuoteElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getQuoteElementById$S = dom.getQuoteElementById$S;

/**
 * @param {!string} id
 * @return {HTMLOListElement}
 */
dom.getOListElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLOListElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getOListElementById$S = dom.getOListElementById$S;

/**
 * @param {!string} id
 * @return {HTMLUListElement}
 */
dom.getUListElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLUListElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getUListElementById$S = dom.getUListElementById$S;

/**
 * @param {!string} id
 * @return {HTMLLIElement}
 */
dom.getLIElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLLIElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getLIElementById$S = dom.getLIElementById$S;

/**
 * @param {!string} id
 * @return {HTMLDListElement}
 */
dom.getDListElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLDListElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getDListElementById$S = dom.getDListElementById$S;

/**
 * @param {!string} id
 * @return {HTMLDivElement}
 */
dom.getDivElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLDivElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getDivElementById$S = dom.getDivElementById$S;

/**
 * @param {!string} id
 * @return {HTMLAnchorElement}
 */
dom.getAnchorElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLAnchorElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getAnchorElementById$S = dom.getAnchorElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTimeElement}
 */
dom.getTimeElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTimeElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTimeElementById$S = dom.getTimeElementById$S;

/**
 * @param {!string} id
 * @return {HTMLSpanElement}
 */
dom.getSpanElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLSpanElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getSpanElementById$S = dom.getSpanElementById$S;

/**
 * @param {!string} id
 * @return {HTMLBRElement}
 */
dom.getBRElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLBRElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getBRElementById$S = dom.getBRElementById$S;

/**
 * @param {!string} id
 * @return {HTMLModElement}
 */
dom.getModElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLModElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getModElementById$S = dom.getModElementById$S;

/**
 * @param {!string} id
 * @return {HTMLImageElement}
 */
dom.getImageElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLImageElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getImageElementById$S = dom.getImageElementById$S;

/**
 * @param {!string} id
 * @return {HTMLIFrameElement}
 */
dom.getIFrameElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLIFrameElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getIFrameElementById$S = dom.getIFrameElementById$S;

/**
 * @param {!string} id
 * @return {HTMLEmbedElement}
 */
dom.getEmbedElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLEmbedElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getEmbedElementById$S = dom.getEmbedElementById$S;

/**
 * @param {!string} id
 * @return {HTMLObjectElement}
 */
dom.getObjectElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLObjectElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getObjectElementById$S = dom.getObjectElementById$S;

/**
 * @param {!string} id
 * @return {HTMLParamElement}
 */
dom.getParamElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLParamElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getParamElementById$S = dom.getParamElementById$S;

/**
 * @param {!string} id
 * @return {HTMLSourceElement}
 */
dom.getSourceElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLSourceElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getSourceElementById$S = dom.getSourceElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTrackElement}
 */
dom.getTrackElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTrackElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTrackElementById$S = dom.getTrackElementById$S;

/**
 * @param {!string} id
 * @return {HTMLMediaElement}
 */
dom.getMediaElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLMediaElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getMediaElementById$S = dom.getMediaElementById$S;

/**
 * @param {!string} id
 * @return {HTMLCanvasElement}
 */
dom.getCanvasElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLCanvasElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getCanvasElementById$S = dom.getCanvasElementById$S;

/**
 * @param {!string} id
 * @return {HTMLMapElement}
 */
dom.getMapElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLMapElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getMapElementById$S = dom.getMapElementById$S;

/**
 * @param {!string} id
 * @return {HTMLAreaElement}
 */
dom.getAreaElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLAreaElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getAreaElementById$S = dom.getAreaElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTableElement}
 */
dom.getTableElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTableElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTableElementById$S = dom.getTableElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTableCaptionElement}
 */
dom.getTableCaptionElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTableCaptionElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTableCaptionElementById$S = dom.getTableCaptionElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTableColElement}
 */
dom.getTableColElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTableColElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTableColElementById$S = dom.getTableColElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTableSectionElement}
 */
dom.getTableSectionElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTableSectionElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTableSectionElementById$S = dom.getTableSectionElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTableRowElement}
 */
dom.getTableRowElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTableRowElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTableRowElementById$S = dom.getTableRowElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTableCellElement}
 */
dom.getTableCellElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTableCellElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTableCellElementById$S = dom.getTableCellElementById$S;

/**
 * @param {!string} id
 * @return {HTMLFormElement}
 */
dom.getFormElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLFormElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getFormElementById$S = dom.getFormElementById$S;

/**
 * @param {!string} id
 * @return {HTMLFieldSetElement}
 */
dom.getFieldSetElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLFieldSetElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getFieldSetElementById$S = dom.getFieldSetElementById$S;

/**
 * @param {!string} id
 * @return {HTMLLegendElement}
 */
dom.getLegendElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLLegendElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getLegendElementById$S = dom.getLegendElementById$S;

/**
 * @param {!string} id
 * @return {HTMLLabelElement}
 */
dom.getLabelElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLLabelElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getLabelElementById$S = dom.getLabelElementById$S;

/**
 * @param {!string} id
 * @return {HTMLInputElement}
 */
dom.getInputElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLInputElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getInputElementById$S = dom.getInputElementById$S;

/**
 * @param {!string} id
 * @return {HTMLButtonElement}
 */
dom.getButtonElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLButtonElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getButtonElementById$S = dom.getButtonElementById$S;

/**
 * @param {!string} id
 * @return {HTMLSelectElement}
 */
dom.getSelectElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLSelectElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getSelectElementById$S = dom.getSelectElementById$S;

/**
 * @param {!string} id
 * @return {HTMLDataListElement}
 */
dom.getDataListElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLDataListElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getDataListElementById$S = dom.getDataListElementById$S;

/**
 * @param {!string} id
 * @return {HTMLOptGroupElement}
 */
dom.getOptGroupElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLOptGroupElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getOptGroupElementById$S = dom.getOptGroupElementById$S;

/**
 * @param {!string} id
 * @return {HTMLOptionElement}
 */
dom.getOptionElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLOptionElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getOptionElementById$S = dom.getOptionElementById$S;

/**
 * @param {!string} id
 * @return {HTMLTextAreaElement}
 */
dom.getTextAreaElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLTextAreaElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getTextAreaElementById$S = dom.getTextAreaElementById$S;

/**
 * @param {!string} id
 * @return {HTMLKeygenElement}
 */
dom.getKeygenElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLKeygenElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getKeygenElementById$S = dom.getKeygenElementById$S;

/**
 * @param {!string} id
 * @return {HTMLOutputElement}
 */
dom.getOutputElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLOutputElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getOutputElementById$S = dom.getOutputElementById$S;

/**
 * @param {!string} id
 * @return {HTMLProgressElement}
 */
dom.getProgressElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLProgressElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getProgressElementById$S = dom.getProgressElementById$S;

/**
 * @param {!string} id
 * @return {HTMLMeterElement}
 */
dom.getMeterElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLMeterElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getMeterElementById$S = dom.getMeterElementById$S;

/**
 * @param {!string} id
 * @return {HTMLDetailsElement}
 */
dom.getDetailsElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLDetailsElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getDetailsElementById$S = dom.getDetailsElementById$S;

/**
 * @param {!string} id
 * @return {HTMLCommandElement}
 */
dom.getCommandElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLCommandElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getCommandElementById$S = dom.getCommandElementById$S;

/**
 * @param {!string} id
 * @return {HTMLMenuElement}
 */
dom.getMenuElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLMenuElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getMenuElementById$S = dom.getMenuElementById$S;

/**
 * @param {!string} id
 * @return {HTMLAppletElement}
 */
dom.getAppletElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLAppletElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getAppletElementById$S = dom.getAppletElementById$S;

/**
 * @param {!string} id
 * @return {HTMLMarqueeElement}
 */
dom.getMarqueeElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLMarqueeElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getMarqueeElementById$S = dom.getMarqueeElementById$S;

/**
 * @param {!string} id
 * @return {HTMLFrameSetElement}
 */
dom.getFrameSetElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLFrameSetElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getFrameSetElementById$S = dom.getFrameSetElementById$S;

/**
 * @param {!string} id
 * @return {HTMLFrameElement}
 */
dom.getFrameElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLFrameElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getFrameElementById$S = dom.getFrameElementById$S;

/**
 * @param {!string} id
 * @return {HTMLBaseFontElement}
 */
dom.getBaseFontElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLBaseFontElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getBaseFontElementById$S = dom.getBaseFontElementById$S;

/**
 * @param {!string} id
 * @return {HTMLDirectoryElement}
 */
dom.getDirectoryElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLDirectoryElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getDirectoryElementById$S = dom.getDirectoryElementById$S;

/**
 * @param {!string} id
 * @return {HTMLFontElement}
 */
dom.getFontElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLFontElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getFontElementById$S = dom.getFontElementById$S;

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
$__jsx_lazy_init(dom, "window", function () {
	return js.global["window"];
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
		dom$: dom$
	},
	"system:lib/js/js.jsx": {
		js: js,
		js$: js$
	}
};


}());
