/*EXPECTED
1
undefined
1
2
undefined
undefined
3
*/

class Test {
	static function run() : void {
		var m = { a: 1 };
		log m["a"];
		log m["b"];
		m["b"] = 2;
		log m["a"];
		log m["b"];
		(m = {} : Map.<number>)["c"] = 3;
		log m["a"];
		log m["b"];
		log m["c"];
	}
}
