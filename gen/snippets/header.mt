<?
my $context = $main::context;

$context->{filename} =~ m{^([^\./]*)};
my $cur_tab = $1;
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
<td><a href="https://github.com/jsx/JSX/" target="_blank">Download</a></td>
<td<?= $cur_tab eq "doc" ? $selected : '' ?>><a href="doc.html">Documents</a></td>
<td<?= $cur_tab eq "faq" ? $selected : '' ?>><a href="faq.html">FAQ</a></td>
</tr>
</table>
