<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
? my $base = "../" x (scalar(split '/', $main::context->{filename}) - 1);
? if ($base ne '') {
<base href="<?= $base ?>" />
? }
<link rel="stylesheet" href="style.css" type="text/css" />
<script src="google-code-prettify/prettify.js"></script>
<script src="lang-jsx.js"></script>
<script>
  $(function() {
    prettyPrint();
  });
</script>
<link rel="stylesheet" href="google-code-prettify/prettify.css" type="text/css" />
?= $_[0]
<div id="footer">
Copyright &copy; 2012 <a href="http://dena.com/intl/">DeNA Co., Ltd.</a>
</div>

</body>
</html>
