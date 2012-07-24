? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>Types - Documents - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ "Types" ])

<div id="main">

<h2>Primitive Types</h2>

<p>JSX provides the following four primitive types.  Primitive types are non-nullable. 'Int' exists as a type, but would be equal to or slower than using 'number' in some cases (the definition of 'int' is: a number with fraction part == 0 (if it is not NaN nor Infinity), guaranteed to hold a 'number' without fractional part between -2<sup>31</sup> to 2<sup>31</sup>-1).</p>

<ul>
<li>boolean</li>
<li>number</li>
<li>string</li>
<li>(int)</li>
</ul>

<h2>Nullable Primitive Types</h2>

<p>A nullable counterpart exists for each primitive type.  Values of the types are returned by [] operators of Array.<primitive_type> and Map.<primitive_type>.</p>

<ul>
<li>Nullable.&lt;boolean&gt;</li>
<li>Nullable.&lt;number&gt;</li>
<li>Nullable.&lt;string&gt;</li>
<li>(Nullable.&lt;int&gt;)</li>
</ul>

<h2>Built-in Object Types</h2>

<p>The types belwo are the built-in object types of JSX.  Object types are nullable.</p>

<ul>
<li>Object</li>
<li>Array.&lt;T&gt;</li>
<li>Map.&lt;T&gt;</li>
<li>Boolean</li>
<li>Number</li>
<li>String</li>
<li>Function</li>
<li>JSX</li>
</ul>

<h2>Variant Type</h2>

<p>
A variant can hold any type of data (including null). To use the data, explicit cast to other data types is necessary.
</p>

<h2>User-defined Types</h2>

<p>
Users may define a new class by extending the Object class, or by declaring an interface or a mixin. See <a href="doc/class.html">Class, Interface and Mixin</a>.
</p>

</div>

? })
