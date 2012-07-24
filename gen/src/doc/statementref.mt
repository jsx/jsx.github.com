? my $context = $main::context;
? $_mt->wrapper_file("wrapper.mt")->(sub {

<style type="text/css">
#main table td pre {
    margin: 0;
    padding: 0;
    border: 0;
    background-color: white;
}
</style>
<title>Statements - Documents - JSX</title>

?= $_mt->render_file("header.mt")
?= $_mt->render_file("breadcrumb.mt", [ qw(Documents doc.html) ], [ "Statements" ])

<div id="main">

<h2>Statements</h2>

<p>
Following types of statements are supported by JSX. The differences from JavaScript are:

<ul>
<li>a block cannot have a label</li>
<li>super(...) statement has been introduced</li>
<li>delete is a statement instead of an expression</li>
<li>argument of catch clause can be typed, and thus the clause is nestable</li>
</ul>

</p>

<table>
<caption>Table 1. Types of Statements</caption>
<tr>
<th>Statement</th>
<th>Description</th>
</tr>
<tr>
<td><?= $context->{prettify}->('jsx', <<'EOT')
;
EOT
?></td>
<td>empty statement</td>
</tr>
<tr>
<td><?= $context->{prettify}->('jsx', <<'EOT')
{
    statement*
}
EOT
?></td>
<td>block statement</td>
</tr>
<tr>
<td><?= $context->{prettify}->('jsx', <<'EOT')
expr;
EOT
?></td>    
<td>evaluates the expr</td>     
</tr>
<tr>
<td><?= $context->{prettify}->('jsx', <<'EOT')
return;
EOT
?></td>    
<td>returns void</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
return expr;
EOT
?></td>    
<td>returns the result of the expr</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
if (expr)
    statement
[else
    statement]
EOT
?></td>    
<td>if statement</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
var varname[ = expr][, varname2 = expr2, ...];
EOT
?></td>
<td>variable declaration</td>
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
break;
EOT
?></td>
<td>exits from the inner-most loop or switch statement</td>
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
break LABEL;
EOT
?></td>
<td>exits to the loop or switch statement with label LABEL</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
continue;
EOT
?></td>    
<td>skips to the end of the loop statement</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
continue LABEL;
EOT
?></td>
<td>skip to the end of the loop statement with label LABEL</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]
do
    statement
while (expr);
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]
for (expr in expr)
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]
for (var varname in expr)
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]
for (expr; expr; expr)
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]
for (var varname = expr; expr; expr)
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]
while (expr)
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
[LABEL:]switch (expr) {
    statement*
}
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
case expr:
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
default:
    statement
EOT
?></td>
<td></td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
delete expr;
EOT
?></td>
<td>deletes the property of a Map returned by the expr</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
super(...);
EOT
?></td>
<td>calls the constructor of the super class</td>     
</tr>
<tr>   
<td><?= $context->{prettify}->('jsx', <<'EOT')
try {
    statement*
} [catch (varname : type) {
    statement*
}]* [finally {
    statement*
}]
EOT
?></td>    
<td>catch statement can be nested</td>     
</tr>
</table>

</div>

? })
