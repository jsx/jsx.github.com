all:	doc

doc:
	(cd gen && ./makedoc.pl `find src -type f -name '*.mt'`)
	./tool/oktavia-mkindex -i doc -i faq.html -r . -m html -u h2 -c 10 -t js -s english

.PHONY: doc
