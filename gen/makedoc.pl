#! /usr/bin/perl

use strict;
use warnings;

use File::Basename qw(dirname);
use File::Path qw(mkpath);
use File::Slurp qw(write_file);
use Text::MicroTemplate qw(build_mt);
use Text::MicroTemplate::File;

my $mt = Text::MicroTemplate::File->new(
    include_path => [ qw(snippets .) ],
);

die "no files"
    if @ARGV == 0;

for my $src_file (@ARGV) {
    (my $dst_file = $src_file) =~ s|^src/(.*)\.mt$|../$1\.html|
        or die "file name should be \"src/**.mt\", but got: $src_file";
    my $output = $mt->render_file($src_file, {
        print_code => build_mt(
            '<pre><code><?= $_[0] ?></code></pre>',
        ),
        print_jsx_code => build_mt(
            '<pre class="prettyprint"><code class="lang-jsx"><?= $_[0] ?></code></pre>',
        ),
    });
    mkpath(dirname($dst_file));
    write_file($dst_file, $output);
}
