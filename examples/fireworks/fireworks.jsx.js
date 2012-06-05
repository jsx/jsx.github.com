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
 * class Spark extends Object
 * @constructor
 */
function Spark() {
}

Spark.prototype = new Object;
/**
 * @constructor
 * @param {!number} posX
 * @param {!number} posY
 * @param {!number} size
 * @param {!string} color
 */
function Spark$NNNS(posX, posY, size, color) {
	/** @type {!number} */
	var angle;
	/** @type {!number} */
	var velocity;
	this.state = 0;
	this.posX = posX;
	this.posY = posY;
	this.size = size;
	this.color = color;
	angle = Math.random() * 6.283185307179586;
	velocity = Math.random() * 6.0;
	this.velX = Math.cos(angle) * velocity;
	this.velY = Math.sin(angle) * velocity;
};

Spark$NNNS.prototype = new Spark;

/**
 */
Spark.prototype._decay$ = function () {
	this.velX *= 0.98;
	this.velY *= 0.98;
	this.size *= 0.98;
	if (this.size < 0.5 && this.state === 0) {
		this.color = Firework$randomColor$();
		this.size = 2.0;
		this.state++;
	}
};

/**
 */
Spark.prototype._move$ = function () {
	this.posX += this.velX + (Math.random() - 0.5);
	this.posY += this.velY + (Math.random() - 0.5) + 2.0;
};

/**
 * @param {FireworkView} view
 */
Spark.prototype._render$LFireworkView$ = function (view) {
	view.cx.beginPath();
	view.cx.arc(this.posX, this.posY, this.size, 0, 6.283185307179586, true);
	view.cx.fillStyle = (Math.random() > 0.2 ? this.color : "white");
	view.cx.fill();
};

/**
 * @param {FireworkView} view
 * @return {!boolean}
 */
Spark.prototype._isLiving$LFireworkView$ = function (view) {
	return this.size <= 0.01 ? false : this.posX <= 0 ? false : this.posX >= view.width || this.posY >= view.height ? false : true;
};

/**
 * @param {FireworkView} view
 * @return {!boolean}
 */
Spark.prototype.draw$LFireworkView$ = function (view) {
	this._decay$();
	this.posX += this.velX + (Math.random() - 0.5);
	this.posY += this.velY + (Math.random() - 0.5) + 2.0;
	view.cx.beginPath();
	view.cx.arc(this.posX, this.posY, this.size, 0, 6.283185307179586, true);
	view.cx.fillStyle = (Math.random() > 0.2 ? this.color : "white");
	view.cx.fill();
	return this.size <= 0.01 ? false : this.posX <= 0 ? false : this.posX >= view.width || this.posY >= view.height ? false : true;
};

/**
 * class Firework extends Object
 * @constructor
 */
function Firework() {
}

Firework.prototype = new Object;
/**
 * @constructor
 * @param {FireworkView} view
 * @param {!number} x
 * @param {!number} y
 */
function Firework$LFireworkView$II(view, x, y) {
	/** @type {!string} */
	var color;
	/** @type {!number} */
	var i;
	this.sparks = [  ];
	this.view = view;
	color = "lime";
	for (i = 0; i < Config.quantity; ++ i) {
		this.sparks.push(new Spark$NNNS(x, y, 2.0, color));
	}
};

Firework$LFireworkView$II.prototype = new Firework;

/**
 * @return {!string}
 */
Firework.randomColor$ = function () {
	/** @type {!number} */
	var blightness;
	/** @type {Array.<undefined|!number>} */
	var rgb;
	/** @type {!number} */
	var i;
	blightness = 60;
	rgb = [  ];
	for (i = 0; i < 3; ++ i) {
		rgb[i] = (Math.min(Math.random() * 0xFF + blightness | 0, 255) | 0);
	}
	return "rgb(" + (rgb[0] + "") + "," + (rgb[1] + "") + "," + (rgb[2] + "") + ")";
};

Firework$randomColor$ = Firework.randomColor$;

/**
 * @return {!boolean}
 */
Firework.prototype.update$ = function () {
	/** @type {!number} */
	var i;
	/** @type {undefined|Spark} */
	var s;
	for (i = 0; i < this.sparks.length; ++ i) {
		s = this.sparks[i];
		if (! s.draw$LFireworkView$(this.view)) {
			this.sparks.splice(i, 1);
		}
	}
	return this.sparks.length > 0;
};

/**
 * class FireworkView extends Object
 * @constructor
 */
function FireworkView() {
}

FireworkView.prototype = new Object;
/**
 * @constructor
 * @param {HTMLCanvasElement} canvas
 */
function FireworkView$LHTMLCanvasElement$(canvas) {
	var $this = this;
	/** @type {ClientRect} */
	var rect;
	this.fireworks = [  ];
	this.numSparks = 0;
	this.cx = (function (o) { return o instanceof CanvasRenderingContext2D ? o : null; })(canvas.getContext("2d"));
	this.width = canvas.width;
	this.height = canvas.height;
	rect = canvas.getBoundingClientRect();
	this.left = (rect.left | 0);
	this.top = (rect.top | 0);
	canvas.addEventListener("mousedown", (function (e) {
		/** @type {MouseEvent} */
		var me;
		/** @type {!number} */
		var x$0;
		/** @type {!number} */
		var y$0;
		me = (function (o) { return o instanceof MouseEvent ? o : null; })(e);
		x$0 = me.clientX;
		y$0 = me.clientY;
		$this.fireworks.push(new Firework$LFireworkView$II($this, x$0 - $this.left, y$0 - $this.top));
	}));
	canvas.addEventListener("touchstart", (function (e) {
		/** @type {TouchEvent} */
		var te;
		/** @type {!number} */
		var x$0;
		/** @type {!number} */
		var y$0;
		te = (function (o) { return o instanceof TouchEvent ? o : null; })(e);
		x$0 = te.touches[0].pageX;
		y$0 = te.touches[0].pageY;
		$this.fireworks.push(new Firework$LFireworkView$II($this, x$0 - $this.left, y$0 - $this.top));
	}));
};

FireworkView$LHTMLCanvasElement$.prototype = new FireworkView;

/**
 * @param {!number} x
 * @param {!number} y
 */
FireworkView.prototype.explode$II = function (x, y) {
	this.fireworks.push(new Firework$LFireworkView$II(this, x - this.left, y - this.top));
};

/**
 */
FireworkView.prototype.update$ = function () {
	/** @type {!number} */
	var i;
	/** @type {undefined|Firework} */
	var fw;
	if (this.fireworks.length === 0) {
		this.explode$II(this.width / 2 + this.left, this.height / 3);
	}
	this.numSparks = 0;
	for (i = 0; i < this.fireworks.length; ++ i) {
		fw = this.fireworks[i];
		if (fw.update$()) {
			this.numSparks += fw.sparks.length;
		} else {
			this.fireworks.splice(i, 1);
		}
	}
	this.cx.fillStyle = "rgba(0, 0, 0, 0.3)";
	this.cx.fillRect(0, 0, this.width, this.height);
};

/**
 * class FPSWatcher extends Object
 * @constructor
 */
function FPSWatcher() {
}

FPSWatcher.prototype = new Object;
/**
 * @constructor
 * @param {!string} elementId
 */
function FPSWatcher$S(elementId) {
	this.start = Date.now();
	this.frameCount = 0;
	this.elementId = elementId;
};

FPSWatcher$S.prototype = new FPSWatcher;

/**
 * @param {!number} numSparks
 */
FPSWatcher.prototype.update$I = function (numSparks) {
	/** @type {!string} */
	var message;
	++ this.frameCount;
	if (this.frameCount % 100 === 0) {
		message = "FPS: " + ((this.frameCount / (Date.now() - this.start) * 1000 | 0) + "") + " (sparks: " + (numSparks + "") + ")";
		dom$id$S(this.elementId).innerHTML = message;
	}
};

/**
 * class Application extends Object
 * @constructor
 */
function Application() {
}

Application.prototype = new Object;
/**
 * @constructor
 */
function Application$() {
};

Application$.prototype = new Application;

/**
 * @param {!string} canvasId
 * @param {!string} fpsId
 * @param {!number} quantity
 */
Application.main$SSI = function (canvasId, fpsId, quantity) {
	/** @type {HTMLCanvasElement} */
	var canvas;
	/** @type {FireworkView} */
	var view;
	/** @type {FPSWatcher} */
	var watcher;
	Config.quantity = quantity;
	canvas = (function (o) { return o instanceof HTMLCanvasElement ? o : null; })((function (o) { return o instanceof HTMLElement ? o : null; })(dom.window.document.getElementById(canvasId)));
	view = new FireworkView$LHTMLCanvasElement$(canvas);
	watcher = new FPSWatcher$S(fpsId);
	dom.window.setInterval((function () {
		view.update$();
		watcher.update$I(view.numSparks);
	}), 0);
};

Application$main$SSI = Application.main$SSI;

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
 * @param {!string} id
 * @return {HTMLElement}
 */
dom.getElementById$S = function (id) {
	return (function (o) { return o instanceof HTMLElement ? o : null; })(dom.window.document.getElementById(id));
};

dom$getElementById$S = dom.getElementById$S;

/**
 * @param {!string} tag
 * @return {HTMLElement}
 */
dom.createElement$S = function (tag) {
	return dom.window.document.createElement(tag);
};

dom$createElement$S = dom.createElement$S;

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

Config.quantity = 360;
Config.size = 2.0;
Config.decay = 0.98;
Config.gravity = 2.0;
Config.speed = 6.0;
Spark.rad = 6.283185307179586;
$__jsx_lazy_init(dom, "window", function () {
	return js.global["window"];
});
js.global = (function () { return this; })();

var $__jsx_classMap = {
	"fireworks.jsx": {
		Config: Config,
		Config$: Config$,
		Spark: Spark,
		Spark$NNNS: Spark$NNNS,
		Firework: Firework,
		Firework$LFireworkView$II: Firework$LFireworkView$II,
		FireworkView: FireworkView,
		FireworkView$LHTMLCanvasElement$: FireworkView$LHTMLCanvasElement$,
		FPSWatcher: FPSWatcher,
		FPSWatcher$S: FPSWatcher$S,
		Application: Application,
		Application$: Application$
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
