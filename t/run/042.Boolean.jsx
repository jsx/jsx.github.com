/*EXPECTED
false
true
false
false
true
null
*/
class Test {
	static function run() : void {
		var bV : boolean = false.valueOf();
		log bV;
		bV = true.valueOf();
		log bV.valueOf();
		var b = new Boolean();
		var bV : boolean = b.valueOf();
		log bV;
		b = new Boolean(false);
		bV = b.valueOf();
		log bV;
		b = new Boolean(true);
		bV = b.valueOf();
		log bV;
		b = null;
		log b;
	}
}
