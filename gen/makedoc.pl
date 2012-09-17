#! /usr/bin/env perl

use strict;
use warnings;
no warnings qw(once);

use File::Basename qw(dirname);
use File::Path qw(mkpath);
use File::Slurp qw(write_file);
use Scalar::Util qw(looks_like_number);
use Text::MicroTemplate qw(build_mt render_mt);
use Text::MicroTemplate::File;

my $mt = Text::MicroTemplate::File->new(
    include_path => [ qw(snippets .) ],
);

die "no files"
    if @ARGV == 0;

for my $src_file (@ARGV) {
    (my $dst_file = $src_file) =~ s|^src/(.*)\.mt$|../$1\.html|
        or die "file name should be \"src/**.mt\", but got: $src_file";
    my @notes;
    $main::context = {
        filename => substr($src_file, 4),
        prettify => build_mt(
            '<pre class="prettyprint"><code class="language-<?= $_[0] ?>"><?= $_[1] ?></code></pre>',
        ),
        note     => sub {
            my ($note, $index);
            if (looks_like_number($_[0])) {
                $index = $_[0] < 0 ? scalar(@notes) + $_[0] : $_[0];
            } else {
                $index = scalar @notes;
                push @notes, $_[0];
            }
            return render_mt(
                '<sup><a href="#note_<?= $_[0] ?>" title="<?= $_[1] ?>">[<?= $_[0] ?>]</sup></a></sup>',
                $index + 1,
                $notes[$index],
            );
        },
        citations => sub {
            my $output = '';
            if (@notes) {
                $output = $mt->render_file("citations.mt", @notes);
                @notes = ();
            }
            return $output;
        },
    };
    my $output = $mt->render_file($src_file);
    mkpath(dirname($dst_file));
    write_file($dst_file, $output);
}
