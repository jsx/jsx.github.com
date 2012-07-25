? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>Types - Documents - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ "Types" ])

<div id="main">

<h2>Primitive Types</h2>

<p>JSX provides the following four primitive types.  Primitive types are non-nullable. <code>Int</code> exists as a type, but would be equal to or slower than using <code>number</code> in some cases (the definition of <code>int</code> is: an integral number between -2<sup>31</sup> to 2<sup>31</sup>-1, or <code>NaN</code>, or <code>+-Infinity</code>).</p>

<ul>
<li><code>boolean</code></li>
<li><code>number</code></li>
<li><code>string</code></li>
<li><code>(int)</code></li>
</ul>

<h2>Nullable Primitive Types</h2>

<p>A nullable counterpart exists for each primitive type.  Values of the types are returned by [] operators of <code>Array.&lt;primitive_type&gt;</code> and <code>Map.&lt;primitive_type&gt;</code>.</p>

<ul>
<li><code>Nullable.&lt;boolean&gt;</code></li>
<li><code>Nullable.&lt;number&gt;</code></li>
<li><code>Nullable.&lt;string&gt;</code></li>
<li><code>(Nullable.&lt;int&gt;)</code></li>
</ul>

<h2>Built-in Object Types</h2>

<p>The types below are the built-in object types of JSX.  Object types are nullable.</p>

<ul>
<li><code>Object</code></li>
<li><code>Array.&lt;T&gt;</code></li>
<li><code>Map.&lt;T&gt;</code></li>
<li><code>Boolean</code></li>
<li><code>Number</code></li>
<li><code>String</code></li>
<li><code>Function</code></li>
<li><code>JSX</code></li>
</ul>

<h2>Variant Type</h2>

<p>
A <code>variant</code> can hold any type of data (including <code>null</code>). To use the data, explicit cast to other data types is necessary.
</p>

<h2>User-defined Types</h2>

<p>
Users may define a new class by extending the <code>Object</code> class, or by declaring an interface or a mixin. See <a href="doc/class.html">Class, Interface and Mixin</a>.
</p>

</div>

? })
