? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>Operators - Documents - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ "Operators" ])

<div id="main">

<h2>Operators</h2>

<p>
The operators of JSX are the same to those in JavaScript (ECMA-262 3rd edition) except for the following changes.
</p>

<ul>
<li>types of the operands accepted by the operators are more restrictive</li>
<li>logical operators (&& ||) return boolean</li>
<li>binary ?: operator has been introduced (to cover the use of || in JavaScript to return non-boolean values)</li>
<li>introduction of the as operator</li>
<li>delete is a statement instead of an operator</li>
<li>a wrapper object (Boolean, Number, String) cannot become a left-hand-side expression</li>
</ul>

<p>The table below lists the operators supported by JSX.</p>

<table>
<caption>Table 1. List of Operators by Precedence</caption>
<tr><th>Operator</th><th>Returned Type</th><th>Operand Type(s)</th></tr>
<tr>
<td>(x)<?= $context->{note}->("grouping operator") ?></td>
<td>typeof x</td>
<td></td>
</tr>
<tr>
<td>func(...)</td>
<td>return type of the function</td>
<td></td>
</tr>
<tr>
<td>obj.prop</td>
<td>typeof obj.prop</td>
<td>obj: Object</td>
</tr>
<tr>
<td>array[index]</td>
<td>Nullable.&lt;T></td>
<td>array: Array.&lt;T&gt;<br />index: number</td>
</tr>
<tr>
<td>map[key]</td>
<td>Nullable.&lt;T></td>
<td>map: Map.&lt;T&gt;<br />key: string</td>
</tr>
<tr>
<td>x++</td>
<td>typeof x</td>
<td>number or int</td>
</tr>
<tr>
<td>x--</td>
<td>typeof x</td>
<td>number or int</td>
</tr>
<tr>
<td>x instanceof y</td>
<td>boolean</td>
<td>x: Object<br />y: Class, Interface, Mixin</td>
</tr>
<tr>
<td>x as type<?= $context->{note}->("cast operator") ?></td>
<td>type</td>
<td></td>
</tr>
<tr><td nowrap>x as &#95;&#95;noconvert&#95;&#95; type<?= $context->{note}->("cast operator (without run-time type check)") ?></td>
<td>type</td>
<td></td>
</tr>
<tr>
<td>++x</td>
<td>typeof x</td>
<td>number or int</td>
</tr>
<tr>
<td>--x</td>
<td>typeof x</td>
<td>number or int</td>
</tr>
<tr>
<td>+x</td>
<td>typeof x</td>
<td>number or int</td>
</tr>
<tr>
<td>-x</td>
<td>typeof x</td>
<td>number or int</td>
</tr>
<tr>
<td>~x</td>
<td>int</td>
<td>number or int</td>
</tr>
<tr>
<td>! x</td>
<td>boolean</td>
<td>any</td>
</tr>
<tr>
<td>typeof x</td>
<td>boolean</td>
<td>variant</td>
</tr>
<tr>
<td>x * y</td>
<td>number or int<?= $context->{note}->("int is returned if both operands are int") ?></td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x / y</td>
<td>number or int<?= $context->{note}->(-1) ?></td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x % y</td>
<td>number</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x + y</td>
<td>string</td>
<td>string or String</td>
</tr>
<tr>
<td>x + y</td>
<td>number or int<?= $context->{note}->(-1) ?></td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x - y</td>
<td>number or int<?= $context->{note}->(-1) ?></td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x &lt;&lt; y</td>
<td>int</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x >> y</td>
<td>int</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x >>> y</td>
<td>int</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x &lt; y</td>
<td>boolean</td>
<td>number, int, string, Number, String</td>
</tr>
<tr>
<td>x &lt;= y</td>
<td>boolean</td>
<td>number, int, string, Number, String</td>
</tr>
<tr>
<td>x > y</td>
<td>boolean</td>
<td>number, int, string, Number, String</td>
</tr>
<tr>
<td>x >= y</td>
<td>boolean</td>
<td>number, int, string, Number, String</td>
</tr>
<tr>
<td>x in y</td>
<td>boolean</td>
<td>x: string<br />y: Map.&lt;T></td>
</tr>
<tr>
<td>x == y</td>
<td>boolean</td>
<td>boolean, number, int, string, Object</td>
</tr>
<tr>
<td>x != y</td>
<td>boolean</td>
<td>boolean, number, int, string, Object</td>
</tr>
<tr>
<td>x & y</td>
<td>int</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x ^ y</td>
<td>int</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x &#124; y</td>
<td>int</td>
<td>number, int, Number</td>
</tr>
<tr>
<td>x && y</td>
<td>boolean</td>
<td>any</td>
</tr>
<tr>
<td>x &#124;&#124; y</td>
<td>boolean</td>
<td>any</td>
</tr>
<tr>
<td>x ? y : z</td>
<td>typeof y</td>
<td>any<?= $context->{note}->("types of y and z should be equal") ?></td>
</tr>
<tr>
<td>x ?: y</td>
<td>typeof x</td>
<td>any<?= $context->{note}->("types of x and y should be equal") ?></td>
</tr>
<tr>
<td>x = y</td>
<td>typeof x</td>
<td>any<?= $context->{note}->("type of y should be convertible to type of x") ?></td>
</tr>
<tr>
<td>x op<?= $context->{note}->("any of: * / % + - << >> >>> & ^ |") ?>= y</td>
<td>typeof x</td>
<td>same as op<?= $context->{note}->("Exception: x cannot be a wrapper object") ?></td>
</tr>
<tr>
<td>x, y</td>
<td>typeof y</td>
<td>any</td>
</tr>
</table>

?= $context->{citations}->()

</div>

? })
