all:	doc

doc:
	(cd gen && ./makedoc.pl `find src -type f -name '*.mt'`)

.PHONY: doc
