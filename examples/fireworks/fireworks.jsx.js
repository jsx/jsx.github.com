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
	/** @type {!number} */
	var size$0;
	this.velX *= 0.98;
	this.velY *= 0.98;
	size$0 = this.size *= 0.98;
	if (size$0 < 0.5 && this.state === 0) {
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
	return (this.size <= 0.01 ? false : this.posX <= 0 ? false : this.posX >= view.width || this.posY >= view.height ? false : true);
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
	return (this.size <= 0.01 ? false : this.posX <= 0 ? false : this.posX >= view.width || this.posY >= view.height ? false : true);
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
	for (i = 0; i < 360; ++ i) {
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

var Firework$randomColor$ = Firework.randomColor$;

/**
 * @return {!boolean}
 */
Firework.prototype.update$ = function () {
	/** @type {!number} */
	var i;
	/** @type {Spark} */
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
	this.cx = canvas.getContext("2d");
	this.width = (canvas.width | 0);
	this.height = (canvas.height | 0);
	rect = canvas.getBoundingClientRect();
	this.left = (rect.left | 0);
	this.top = (rect.top | 0);
	canvas.addEventListener("mousedown", (function (e) {
		/** @type {MouseEvent} */
		var me;
		me = e;
		$this.explode$II(me.clientX, me.clientY);
	}));
	canvas.addEventListener("touchstart", (function (e) {
		/** @type {TouchEvent} */
		var te;
		te = e;
		$this.explode$II(te.touches[0].pageX, te.touches[0].pageY);
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
	/** @type {Firework} */
	var fw;
	/** @type {CanvasRenderingContext2D} */
	var cx$0;
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
	(cx$0 = this.cx).fillStyle = "rgba(0, 0, 0, 0.3)";
	cx$0.fillRect(0, 0, this.width, this.height);
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
	var canvas;
	/** @type {FireworkView} */
	var view;
	/** @type {FPSWatcher} */
	var watcher;
	/** @type {!number} */
	var value1$0;
	/** @type {!number} */
	var value2$0;
	/** @type {!number} */
	var value1$1;
	/** @type {!number} */
	var value2$1;
	canvas = dom.document.getElementById("night-sky");
	value1$0 = canvas.width;
	value2$0 = dom.window.innerWidth;
	canvas.width = (value1$0 <= value2$0 ? value1$0 : value2$0);
	value1$1 = canvas.height;
	value2$1 = dom.window.innerHeight;
	canvas.height = (value1$1 <= value2$1 ? value1$1 : value2$1);
	view = new FireworkView$LHTMLCanvasElement$(canvas);
	watcher = new FPSWatcher$S("fps");
	dom.window.setInterval((function () {
		view.update$();
		watcher.update$I(view.numSparks);
	}), 0);
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

Config.quantity = 360;
Config.size = 2.0;
Config.decay = 0.98;
Config.gravity = 2.0;
Config.speed = 6.0;
Config.canvasId = "night-sky";
Config.fpsElementId = "fps";
Spark.rad = 6.283185307179586;
$__jsx_lazy_init(dom, "window", function () {
	return js.global.window;
});
$__jsx_lazy_init(dom, "document", function () {
	return js.global.document;
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
	JSX.runMain("fireworks.jsx", [])
}

window.addEventListener("load", $__jsx_onload);
document.addEventListener("DOMContentLoaded", $__jsx_onload);

})(JSX);
