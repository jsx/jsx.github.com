<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
? my $base = "../" x (scalar(split '/', $main::context->{filename}) - 1);
? if ($base ne '') {
<base href="<?= $base ?>" />
? }
<link rel="stylesheet" href="style.css" type="text/css" />
?= $_[0]
<div id="footer">
Copyright &copy; 2012 <a href="http://dena.jp/intl/">DeNA Co., Ltd.</a>
</div>

</center>
</body>
</html>
