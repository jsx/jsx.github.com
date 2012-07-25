? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<title>Using the Profiler - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ "Using the Profiler" ])

<div id="main">

<h2>Using the Profiler</h2>

<p>
JSX has a built-in profiler that helps the developers track down the bottlenecks and tune their web applications.  The profiler is able to display the results in three modes: Call Tree, Interted Call Tree, Functions.  For each function, call count, inclusive and exclusive times spent are displayed.
</p>

<a href="images/profiler.png"><img class="doc-image" src="images/profiler.png" width="400" height="300" /></a>

<h3>Profiling the Application</h3>

<p>
Follow the steps to profile your application.
</p>

<p>
<em>Step 1.</em> Add code that uploads the profile.  The code snippet below will post the profile information to the profile server running at <code>localhost:5000</code> after running the application for 10 seconds (10,000 milliseconds).
</p>

<?= $context->{prettify}->('jsx', <<'EOT')
if (JSX.profilerIsRunning()) {
    dom.window.setTimeout(function () : void {
        JSX.postProfileResults("http://localhost:5000/post-profile");
    }, 10000);
}
EOT
?>

<p>
<em>Step 2.</em> Compile the application with <code>--profile</code>.
</p>

<?= $context->{prettify}->('bash', <<'EOT')
$ jsx --profile --release mywebapp.jsx
EOT
?>

<p>
<em>Step 3.</em> Run the profile server.  The server will bind to TCP port 5000.
</p>

<?= $context->{prettify}->('bash', <<'EOT')
$ make server
EOT
?>

<p>
<em>Step 4.</em> Run the application.  When JSX.postProfileRelust() succeeds, you wil find a line like below in the console.
</p>

<?= $context->{prettify}->('bash', <<'EOT')
Open http://localhost:5000/web/profiler.html?20120626010422
EOT
?>

<p>
<em>Step 5.</em> Open the URL specified in the console, and you will find the profile results.
</p>

</div>

? })
