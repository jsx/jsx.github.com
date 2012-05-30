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
	angle = Math.random() * Spark.rad;
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
	this.posX += this.velX + Math.random() - 0.5;
	this.posY += this.velY + Math.random() - 0.5 + 2.0;
};

/**
 * @param {FireworkView} view
 */
Spark.prototype._render$LFireworkView$ = function (view) {
	view.cx.beginPath();
	view.cx.arc(this.posX, this.posY, this.size, 0, Spark.rad, true);
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
	this.posX += this.velX + Math.random() - 0.5;
	this.posY += this.velY + Math.random() - 0.5 + 2.0;
	view.cx.beginPath();
	view.cx.arc(this.posX, this.posY, this.size, 0, Spark.rad, true);
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
	return "rgb(" + (rgb[(0)] + "") + "," + (rgb[(1)] + "") + "," + (rgb[(2)] + "") + ")";
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
		me = (function (o) { return o instanceof MouseEvent ? o : null; })(e);
		if (! (me != null)) {
			debugger;
			throw new Error("[fireworks.jsx:136] assertion failure");
		}
		$this.explode$II(me.clientX, me.clientY);
	}));
	canvas.addEventListener("touchstart", (function (e) {
		/** @type {TouchEvent} */
		var te;
		te = (function (o) { return o instanceof TouchEvent ? o : null; })(e);
		if (! (te != null)) {
			debugger;
			throw new Error("[fireworks.jsx:141] assertion failure");
		}
		$this.explode$II(te.touches[(0)].pageX, te.touches[(0)].pageY);
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

Config.quantity = 360;
Config.size = 2.0;
Config.decay = 0.98;
Config.gravity = 2.0;
Config.speed = 6.0;
$__jsx_lazy_init(Spark, "rad", function () {
	return Math.PI * 2;
});
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
