<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
? my $base = "../" x (scalar(split '/', $main::context->{filename}) - 1);
? if ($base ne '') {
<base href="<?= $base ?>" />
? }
<link rel="stylesheet" href="style.css" type="text/css" />
<link rel="stylesheet" href="searchstyle.css" type="text/css" />
<script src="search/jquery-1.9.1.min.js"></script>
<script src="search/oktavia-jquery-ui.js"></script>
<script src="search/oktavia-english-search.js"></script>
?= $_[0]
<div id="footer">
Copyright &copy; 2012 <a href="http://dena.jp/intl/">DeNA Co., Ltd.</a>
</div>

</body>
</html>
