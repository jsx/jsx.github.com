/*
 * Usage:
 * 
 * import "js.jsx";
 * var window = js.global["window"] as __noconvert__ Map.<variant>;
 */

final class js {

	static var global : Map.<variant>;

	static native function invoke(obj : variant, funcName : string, args : Array.<variant>) : variant;

}
