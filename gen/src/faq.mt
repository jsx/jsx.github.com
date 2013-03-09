? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>Frequently Asked Questions - JSX</title>

?= $_mt->render_file("header.mt")

<div id="main">

<h2>Frequently Asked Questions</h2>

<h3>Q. Who are you?</h3>

<div>
JSX has been developed as a research project at <a href="http://dena.com/intl/" target="_blank">DeNA Co., Ltd.</a>, one of the leading social game providers in Japan and in the world.  The main developers are <a href="http://twitter.com/kazuho/" target="_blank">Kazuho Oku</a> and <a href="http://twitter.com/__gfx__/">Goro Fuji (a.k.a. gfx)</a>.
</div>

<h3>Q. What are the license terms?</h3>

<div>
JSX is provided under <a href="http://www.opensource.org/licenses/mit-license.php" target="_blank">The MIT License</a>.
</div>

<h3>Q. Can JSX be used together with the <a href="https://developers.google.com/closure/" target="_blank">Google Closure Compiler</a>?</h3>

<div>
Yes.
</div>
<div>
The current optimizer of JSX focuses on expanding short functions inline.  It often inline-expands functions that are not handled by the Google Closure Compiler.  On the other hand, Google Closure Compiler is very good at optimizing the expressions within a JavaScript statement.
</div>
<div>
JSX emits JavaScript fully-annotated by type hints understood by Google Closure Compiler, so that the code generated by the JSX compiler can be further optimized by the Google Closure Compiler.
</div>

<h3>Q. What are the future plans?</h3>

<div>
Some of the fetures we might add to the language are: generic programming, asynchronous error handling, default arguments, named arguments, node.js support.
</div>

<h3>Q. How can I contribute?</h3>

<div>
Your contribution is welcome in all areas, from contribution to the language development to tweeting about JSX :-)
</div>
<div>
We deseparately need more libraries, including a high-level interface for web programming (like jQuery).  Although it would not be included as part of the JSX distribution, such a library would help us and others using JSX a lot!
</div>
<div>
It would also be great if we could have syntax coloring support in editors other than vim (.vim file for syntax coloring of JSX code is included in the etc/ directory of the distribution).
</div>

</div>

? })
