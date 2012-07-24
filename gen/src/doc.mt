? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>JSX Documents</title>

?= $_mt->render_file("header.mt", "doc")

<div id="main">

<h2>Getting Started</h2>

<ul>
<li><a href="doc/tutorial.html">Tutorial</a></li>
<li>Editor support</li>
<li>Using the Source-code Debugger</li>
<li>Using the Profiler</li>
</ul>

<h2>Language Reference</h2>

<ul>
<li><a href="doc/typeref.html">Types</a></li>
<li><a href="doc/literalref.html">Literals</a></li>
<li><a href="doc/operatorref.html">Operators</a></li>
<li><a href="doc/conversionref.html">Type Conversion</a></li>
<li><a href="doc/statementref.html">Statements</a></li>
<li><a href="doc/classref.html">Class, Interface and Mixin</a></li>
<li><a href="doc/importref.html">Importing Files</a></li>
<li>Templates (experimental)</li>
</ul>

<h2>Links</h2>

<ul>
<li><a href="https://github.com/jsx/JSX/wiki/References">References (wiki)</a> - documents related to JSX</li>
<li><a href="https://github.com/jsx/JSX/wiki/Resources">Resources (wiki)</a> - articles, examples and other resources</li>
</ul>

</div>

? })
