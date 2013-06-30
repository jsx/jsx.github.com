all: doc index

doc:
	(cd gen && ./makedoc.pl `find src -type f -name '*.mt'`)

index:
	oktavia/bin/oktavia-mkindex -i doc -i faq.html -r . -m html -u h2 -c 10 -t js -s english

jsxdoc-core:
	(cd JSX && make)
	cp -r JSX/doc jsxdoc


.PHONY: all doc index
