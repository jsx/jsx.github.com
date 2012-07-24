? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<link rel="stylesheet" href="google-code-prettify/prettify.css" type="text/css" />
<script src="google-code-prettify/prettify.js"></script>
<script src="lang-jsx.js"></script>
<script>
  window.addEventListener("load", function (e) {
    prettyPrint();
  });
</script>
<style>
  .headerlink {
    display: none;
  }
</style>
<title>Tutorial - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ qw(Tutorial) ])
<div id="main">

<h2 id="background">Background</h2>

<p>
JSX is a statically-typed, object-oriented programming language compiling to standalone JavaScript. The reason why JSX was developed is our need for a more robust programming language than JavaScript.  However, JSX is fairly close to JavaScript especially in its statements and expressions.
</p>
<p>
Statically-typed programming language is robust because certain sorts of problems, for example typos in variable names or missing function definitions, are detected at compile-time. This is important especially in middle- to large-scale software development in which a number of engineers may be engaged.
</p>
<p>
Therefore, JSX is designed as a statically-typed language. All the values and variables have a static type and you can only assign a correctly-typed value to a variable. In addition, all the functions including closures have types which are determined by the types of parameters and the return values, where you cannot call a function with incorrectly typed arguments.
</p>
<p>
Also, another important reason why JSX was developed is to boost JavaScript performance. JavaScript itself is not so slow but large-scale development tends to have many abstraction layers, e.g. proxy classes and accessor methods, which often have negative impact on performance.  JSX boosts performance by <em>inline expansion</em>: function bodies are expanded to where they are being called, if the functions being called could be determined at compile-time. This is the power of the statically-typed language in terms of performance.
</p>

<h2 id="run-hello-world">Run "Hello, World!"</h2>

<p>
Let's start by running our first JSX program: <code>hello.jsx</code>.  We use the <code>jsx</code> command, which is the JSX compiler in the JSX distribution, to compile JSX source code to JavaScript.
</p>
<p>
Type as follows in the JSX distribution and/or repository, and then you will see it saying <code>"Hello, world!"</code>.
</p>
?= $context->{prettify}->('bash', q{$ bin/jsx --run example/hello.jsx})
<p>
We will look into the <code>hello.jsx</code> source code in the next section.
</p>

<h2 id="program-structure">Program Structure</h2>

<p>
Here is <code>hello.jsx</code>, the source code of the "Hello world!" example. You can see several features of JSX in this program, namely, static types and class structure within the source code.
</p>
<?= $context->{prettify}->('jsx', <<'EOT')
class _Main {
    static function main(args : string[]) : void {
        log "Hello, world!";
    }
}
EOT
?>
<p>
Class <code>_Main</code> has a static member function (a.k.a. a class method) named <code>main</code>, that takes an array of strings and returns nothing. <code>_Main.main(:string[]):void</code> is the entry point of JSX applications that is called when a user invokes an application from command line.  JSX, like Java, does not allow top-level statements or functions.
</p>
<p>
The <code>log</code> statement is mapped to <code>console.log()</code> in JavaScript, which displays the arguments to stdout with a newline.
</p>
<p>
Next, we look into another typical library class, <code>Point</code>:</p>
<?= $context->{prettify}->('jsx', <<'EOT')
class Point {
    var x = 0;
    var y = 0;

    function constructor() {
    }

    function constructor(x : number, y : number) {
        this.set(x, y);
    }

    function constructor(other : Point) {
        this.set(other);
    }

    function set(x : number, y : number) : void {
        this.x = x;
        this.y = y;
    }

    function set(other : Point) : void {
        this.x = other.x;
        this.y = other.y;
    }
}
EOT
?>
<p>
As you can see, member variables of Point, <code>var x</code> and <code>var y</code>, are declared without types, but their types are deducted from their initial values to be <code>number</code>.
</p>
<p>
You might be surprised at multiple definition of member functions: one takes no parameters and the others take parameters.  They are overloaded by their types of parameters.  When you construct the class with <code>new Point()</code>, the first constructor, which takes no parameters, is called. The second with two parameters will be called on <code>new Point(2, 3)</code> and the third with one parameter will be called as a copy constructor. Other forms of construction, e.g. <code>new Point(42)</code> or <code>new Point("foo", "bar")</code> will cause compilation errors of mismatching signatures. The <code>Point#set()</code> functions are also overloaded and the compiler know how to call the correct one.
</p>

<h2 id="static-types">Static Types</h2>
<p>
Basic type concept will be described in this section.  Primitive types, object types, variant type, and Nullable types exist in JSX.
</p>
<p>
Primitive types, e.g. <code>string</code>, <code>boolean</code>, or <code>number</code> are non-nullable, immutable types.
</p>
<?= $context->{prettify}->('jsx', <<'EOT')
var s : string = "hello";
var n : number = 42;
var b : boolean = true;
EOT
?>
<p>
Object types, e.g. <code>string[]</code> (array of string), functions or <code>Date</code>, are nullable, mutable types.</p>
<?= $context->{prettify}->('jsx', <<'EOT')
var d : Date = new Date(); // Date
var f : function():void = function() : void { log "Hi!"; };
var a : string[] = ["foo"]; // the same as Array.<string>;
EOT
?>
<p>
Variant type, which means "no static type information," is used for interacting with existing JavaScript APIs.  Some JavaScript libraries may return a variant value, which type cannot be determined at compile time.  All you can do on variant values is to check equality of a variant value to another variant value. You have to cast it to another type before doing anything else on the value.
</p>
<p>
Nullable type is a meta type which indicates a value may be null.  For example, the return type of <code>Array.&lt;string&gt;#shift()</code> is <code>Nullable.&lt;string&gt;</code>. When you use a Nullable value, you have to make sure of the value is not null.  Only primitive types can be marked Nullable.  Object types and variants are nullable by default.</p>
<?= $context->{prettify}->('jsx', <<'EOT')
function shiftOrReturnEmptyString(args : string[]) : string {
    if (args.length &gt; 0)
        return args.shift();
    else
        return "";
}
EOT
?>
<div class="note">
When the source code is compiled in debug mode (which is the default), the compiler will insert run-time type-checking code.  An exception will be raised (or the debugger will be activated) when misuse of a null value as actual value is detected.  Run-time type checks can be omitted by compiling the source code with the <code>--release</code> option.
</div>

<h2 id="classes-and-interfaces">Classes and Interfaces</h3>
<p>
JSX is a class-based object-oriented language, and its class model is similar to Java.
</p>
<ul>
<li>a class may extend another class (single inheritance)</li>
<li>a class may implement multiple interfaces</li>
<li>all classes share a single root class: the <code>Object</code> class</li>
</ul>
<?= $context->{prettify}->('jsx', <<'EOT')
interface Flyable {
    abstract function fly() : void;
}

abstract class Animal {
    function eat() : void {
      log "An animal is eating!";
    }
}

class Bat extends Animal implements Flyable {
    override function fly() : void {
        log "A bat is flying!";
    }
}

abstract class Insect {
}

class Bee extends Insect implements Flyable {
    override function fly() : void {
        log "A bee is flying!";
    }
}

class _Main {

    static function main(args : string[]) : void {
        // fo bar
        var bat = new Bat();

        var animal : Animal = bat; // OK. A bat is an animal.
        animal.eat();

        var flyable : Flyable = bat; // OK. A bat can fly
        flyable.fly();

        // for Bee
        var bee = new Bee();

        flyable = bee; // A bee is also flyable
        flyable.fly();
    }
}
EOT
?>
<p>
In the example, the Bat class extends the Animal class, so it inherits the <code>Animal#eat()</code> member function, and it can be assigned to a variable typed to Animal.  The class also implements the <code>Flyable</code> interface overriding the <code>Flyable#fly()</code> member function, so it can be assigned to a variable typed <code>Flyable</code>. There's also another flyable class, <code>Bee</code>.  By using the <code>Flyable</code> interface, it is possible to deal with both classes as a flyable being, even if the organ of a bee is completely different from that of a bat.
</p>

<div class="note">
When overriding a member function, the use the <code>override</code> keyword is mandatory.  Otherwise the compiler will report an error.  In other words, you are saved from unexpected interface changes in the base classes which cause compilation errors in derived classes instead of undesirable runtime errors.
</div>

<h2 id="function-and-closures">Functions and Closures</h2>

<p>
In JSX, functions are first-class objects and they have static types.  You can declare a variable of a function type like <code>var f : function(arg : number) : number</code>, a function that takes a number as an argument and returns another number (or, just returns the same value as the argument; but it's not important here). The variable <code>f</code> can be called as <code>f(42)</code> from which you will get a number value.
</p>
It is possible to define closures (or anonymous functions).   They are typically used to implement event listeners, which are popular in GUI programming.  Closures are similar to JavaScript except for what <code>this</code> points at: when a closure is defined within a member function, it refers to the receiver of the member function.  See the following example.
</p>
<?= $context->{prettify}->('jsx', <<'EOT')
class _Main {
    var foo = 42;

    function constructor() {
        var f = function() : void {
            log this.foo;
        };

        f(); // says 42
    }

    static function main(args : string[]) : void {
        var o = new _Main();
    }
}
EOT
?>

<h2 id="modules">Modules</h2>

<p>
JSX has a module system. You can reuse JSX class libraries by the <code>import</code> statement. For example, the following program uses <code>timer.jsx</code> module, which exports the <code>Timer</code> class.
</p>
<?= $context->{prettify}->('jsx', <<'EOT')
import "timer.jsx";

class _Main {

    static function main(args : string[]) : void {
        Timer.setTimeout(function() : void {
            log "Hello, world!";
        }, 1000);
    }

}
EOT
?>
<p>
A module may export multiple classes, but you can specify what modules you import or name a namespace which the module is imported into.
</p>

<h2 id="on-web-browsers">Interface to Web Browsers</h2>

<p>
The <code>js/web.jsx</code> module provides the interface to web browser APIs, e.g. the <code>window</code> object and DOM APIs.  The example below shows how to insert a text node into an HTML.
</p>
<?= $context->{prettify}->('jsx', <<'EOT')
// hello.jsx
import "js/web.jsx";

class _Main {

    static function say() : void {
        var document = dom.window.document;

        var text = document.createTextNode("Hello, world!");
        document.getElementById("hello").appendChild(text);
    }

}
EOT
?>
<?= $context->{prettify}->('html', <<'EOT')
<!DOCTYPE html>
<html>
  <head>
    <title>Hello, world!</title>
    <script src="hello.jsx.js"></script>
  </head>
  <body>
  <p id="hello"></p>
  </body>
</html>
EOT
?>
<p>
Once you compile <code>hello.jsx</code> by the following command, then you can access the HTML and you will see it saying "Hello, world!."
</p>
<?= $context->{prettify}->('bash', <<'EOT')
$ bin/jsx --executable web --output hello.jsx.js hello.jsx
EOT
?>

<h2 id="further-learning">Further Learning</h2>

<div>
More documents can be found on the <a href="https://github.com/jsx/JSX/wiki">wiki</a>.
</div>

<div>
If you are looking for examples, please refer to the <a href="/#examples">examples</a> on this web site, the <code>example</code> directory of the distribution, or to the links on <a href="https://github.com/jsx/JSX/wiki/Resources">Resouces</a> page of the wiki.
</div>

</div>

? })
