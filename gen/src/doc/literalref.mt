? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>Literals - Documents - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ "Literals" ])

<div id="main">

<h2>Literals</h2>

<h3>Keywords</h3>

<p>
The table lists the keyword literals of JSX.  In contrary to JavaScript, there is no distinction between undefined and null.
</p>

<table>
<caption>Table 1. List of Keyword Literals</caption>
<tr>
<th>Keyword</th>
<th>Description</th>
</tr>
<tr>
<td>null [: type]</td>
<td>declares null, may have the type attributed</td>
</tr>
<tr>
<td>false</td>
<td>a boolean constant</td>
</tr>
<tr>
<td>true</td>
<td>a boolean constant</td>
</tr>
</table>

<h3>Number Literal</h3>

<p>
Identical to JavaScript.
</p>

<h3>String Literal</h3>

<p>
Identical to JavaScript.
</p>

<h3>RegExp Literal</h3>

<p>
Identical to JavaScript.
</p>

<h3>Function Literal</h3>

<p>
Type annotations against arguments and return types are required for function declaration, unless the type can be deducted by the surrounding expression.
</p>

<?= $context->{prettify}->('jsx', <<'EOT')
// a function that takes no arguments, and returns void
function () : void {}

// a function that takes one argument (of number),
// and returns a number that in incremented by one
function (n : number) : number {
    return n + 1;
}

// the argument types and return types may be omitted
// (if it is deductable from the outer expression)
var sum = 0;
[ 1, 2, 3 ].forEach(function (e) {
    sum += e;
});
log sum; // 6

// short-handed
var sum = 0;
[ 1, 2, 3 ].forEach((e) -> { sum += e; });
log sum; // 6

// short-handed, single-statement function expression
var s = "a0b1c".replace(/[a-z]/g, (ch) -> ch.toUpperCase());
log s; // A0B1C
EOT
?>

<p>
A statement starting with <code>function</code> is parsed as inner function declaration, as is by JavaScript. Surround the function declaration with () if your intention is to create an anonymous function and call it immediately.
</p>

<?= $context->{prettify}->('jsx', <<'EOT')
// inner function declaration (when used within a function declaration)
function innerFunc() : void {
    ...;
}

// create an anonymous function and execute immediately
(function () : void {
    ...;
})();
EOT
?>

<p>
See also: <i>Member Function</i> in <a href="doc/class.html">Class, Interface, and Mixin</a>.
</p>

</div>

? })
