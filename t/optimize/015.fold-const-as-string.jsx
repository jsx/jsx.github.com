/*EXPECTED
true
false
1
1.2
*/
/*JSX_OPTS
--optimize fold-const
*/
class Test {
	static function run() : void {
		log true as string;
		log false as string;
		log 1 as string;
		log 1.2 as string;
	}
}
