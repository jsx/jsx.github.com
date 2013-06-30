all: jsxdoc-core doc index

doc:
	(cd gen && ./makedoc.pl `find src -type f -name '*.mt'`)

index:
	oktavia/bin/oktavia-mkindex -i jsxdoc -i doc -i faq.html -i doc.html -i index.html -m html -u h2 -c 10 -t js -s english

jsxdoc-core:
	(cd JSX && git pull && make)
	rm -rf jsxdoc
	cp -r JSX/doc jsxdoc


.PHONY: all doc index
