<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
? my $base = "../" x (scalar(split '/', $main::context->{filename}) - 1);
? if ($base ne '') {
<base href="<?= $base ?>" />
? }

<!-- oktavia -->
<link rel="stylesheet" href="searchstyle.css" type="text/css" />
<script src="search/jquery-1.9.1.min.js"></script>
<script src="search/oktavia-jquery-ui.js"></script>
<script src="search/oktavia-english-search.js"></script>

<!-- /oktavia -->
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
<p>
Copyright &copy; 2012, 2013 <a href="http://dena.com/intl/">DeNA Co., Ltd.</a> et al.
</p>
<p>
Copyright belongs to the authors or to the authors' employers of each contribution.  Please refer to <a href="https://github.com/jsx/JSX/commits/">https://github.com/jsx/JSX/commits/</a>.
</p>
</div>

</body>
</html>
