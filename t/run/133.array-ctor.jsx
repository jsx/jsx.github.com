/*EXPECTED
3
undefined
123
0
*/

class Test {
	static function run() : void {
		var a = new Array.<number>(3);
		log a.length;
		log a[0];
		a[0] = 123;
		log a[0];
		log new Array.<string>().length;
	}
}
