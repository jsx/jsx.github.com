/*EXPECTED
4
65535
-1
1
3
6
*/
/*JSX_OPTS
--optimize fold-const
*/
class Test {
	static function run() : void {
		log 1 << 2;
		log -1 >>> 16;
		log -1 >> 16;
		log 7 & 1;
		log 1 | 2;
		log 7 ^ 1;
	}
}
