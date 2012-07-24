<?
my $cur_page = $_[0];
my $selected = Text::MicroTemplate::encoded_string(q{ class="selected"});
?>
</head>
<body>
<center>
<div id="body">
<div id="top">
<h1><a href="./">JSX</a></h1>
a faster, safer, easier alternative to JavaScript
</div>
<table id="menu">
<tr>
<td><a href="try-on-web/" target="_blank">Try</a></td>
<td<?= $cur_page eq "tutorial" ? $selected : '' ?>><a href="tutorial.html">Tutorial</a></td>
<td><a href="https://github.com/jsx/JSX/" target="_blank">Download</a></td>
<td><a href="https://github.com/jsx/JSX/wiki" target="_blank">Wiki</a></td>
<td<?= $cur_page eq "faq" ? $selected : '' ?>><a href="faq.html">FAQ</a></td>
</tr>
</table>
