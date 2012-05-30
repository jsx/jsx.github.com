/*EXPECTED
3
1
4
a
b
true
a
b
true
true
*/
class Test {
	static function run() : void {
		var a = {
			x: 3,
			y: 1,
			z: 4
		};
		log a["x"];
		log a["y"];
		log a["z"];
		var b = {
			x: "a",
			y: "b"
		};
		log b["x"];
		log b["y"];
		log b["A"] == undefined;
		var c = {
			x: new String("a"),
			y: new String("b"),
			z: null
		} : Map.<String>;
		log c["x"].toString();
		log c["y"].toString();
		log c["z"] == null;
		log c["A"] == undefined;
	}
}
