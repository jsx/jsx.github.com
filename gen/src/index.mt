? $_mt->wrapper_file("wrapper.mt")->(sub {

<style type="text/css">
#charts {
    text-align: center;
}
#main #charts table {
    border: 0px;
    text-align: center;
    table-layout: fixed;
}
#main #charts table td {
    margin: 0;
    border: 0px;
    padding: 0.5em 1em;
}
#main #charts table .caption {
    font-weight: bold;
    font-size: 80%;
    text-align: center;
    margin: 0;
}
#main #charts table img {
    border: 1px solid #ccc;
}
#subview {
    margin: 2em 50px 20px 20px;
    width: 250px;
    float: right;
}
#start {
    padding: 15px 20px;
    margin-bottom: 1em;
    background: #ddf;
    border-radius: 10px;
}
#start h2 {
    font-size: 100%;
    margin: 0 0 0.5em 0;
}
</style>
<title>JSX - a faster, safer, easier JavaScript</title>

?= $_mt->render_file("header.mt")

<div id="subview">
<div id="start">
<h2>Getting Started</h2>
<div>
Try our <a href="try-on-web/" target="_blank">web-based interface</a> or follow the <a href="doc/tutorial.html">tutorial</a> to start using JSX.
</div>
</div>
<script charset="utf-8" src="http://widgets.twimg.com/j/2/widget.js"></script>
<script>
new TWTR.Widget({
  version: 2,
  type: 'search',
  search: '#JSX #update from:kazuho OR from:__gfx__ OR from:tkihira',
  interval: 30000,
  title: 'Updates from Twitter',
  subject: '',
  width: 250,
  height: 300,
  theme: {
    shell: {
      background: '#ddddff',
      color: '#000000'
    },
    tweets: {
      background: '#ddddff',
      color: '#000000',
      links: '#1985b5'
    }
  },
  features: {
    scrollbar: false,
    loop: true,
    live: true,
    behavior: 'default'
  }
}).render().start();
</script>
</div>

<div id="main">

<h2 id="intro">What is JSX?</h2>

<div>
JSX is a statically-typed, object-oriented programming language designed to run on modern web browsers.  Being developed at <a href="http://dena.jp/intl/" target="_blank">DeNA</a> as a research project, the language has following characteristics.
</div>
<dl>
<dt>faster</dt>
<dd>
JSX performs optimization while compiling the source code to JavaScript.  The generated code runs faster than an equivalent code written directly in JavaScript.  The gain may vary, but even the optimized JavaScript libraries like Box2D becomes faster when ported to JSX (<a href="http://www.slideshare.net/kazuho/jsx-optimizer" target="_blank">12% faster on iOS 5.1, 29% faster on Android 2.3</a>).
</dd>
<dt>safer</dt>
<dd>
In contrast to JavaScript, JSX is statically-typed and mostly type-safe.  The quality of applications becomes higher when being developed using JSX, since many errors will be caught during the compilation process.  It also offers debugging features at the compiler level as well.
</dd>
<dt>easier</dt>
<dd>
JSX offers a solid class system much like the Java programming language, freeing the developers from working with the too-primitive prototype-based inheritance system provided by JavaScript.  Expressions and Statements are mostly equal to JavaScript, so it is easy to for JavaScript programmers to start using JSX.
</dl>

<div id="charts">
<table align="center">
<tr>
<td>
<a href="images/benchmarks.png" target="_blank"><img src="images/benchmarks.png" width="225" height="150"></a>
<div class="caption">
Benchmarks
</div>
</td>
<td>
<a href="images/source-code-debugger.png" target="_blank"><img src="images/source-code-debugger.png" width="225" height="150"></a>
<div class="caption">
Source-code debugger
</div>
</td>
</table>
</div>

<h2 id="examples">Examples</h2>

<div id="charts">
<table align="center">
<tr>
<td>
<a href="examples/fireworks/fireworks.html" target="_blank"><img src="images/fireworks.png" width="150" height="225"></a>
<div class="caption">
<a href="examples/fireworks/fireworks.html" target="_blank">Fireworks</a> (<a href="examples/fireworks/fireworks.jsx" target="_blank">source</a>)
</div>
</td>
<td>
<a href="examples/shooting/shooting.html" target="_blank"><img src="images/shooting.png" width="150" height="225"></a>
<div class="caption">
<a href="examples/shooting/shooting.html" target="_blank">Shooting</a> (<a href="examples/shooting/shooting.jsx" target="_blank">source</a>)
</div>
</td>
<td>
<a href="examples/box2d/box2djsx.html" target="_blank"><img src="images/box2d.png" width="150" height="225"></a>
<div class="caption">
<a href="examples/box2d/box2djsx.html" target="_blank">Box2D.jsx</a> (<a href="https://github.com/tkihira/box2djsx/tree/kazuho/optimize" target="_blank">source</a>)
</div>
</td>
</tr>
</table>
</div>

<div>
The examples are best viewed on iPhone.
</div>

<h2 id="other">Other Resources</h2>

<div>
  <p>
  A slide describing the objectives of JSX can be found <a href="http://www.slideshare.net/kazuho/jsx">here</a>.
  </p>
  <p>
    There is <a href="https://github.com/jsx/JSX/wiki">JSX wiki</a> to gather JSX resources.
  </p>
</div>

</div>

? })
