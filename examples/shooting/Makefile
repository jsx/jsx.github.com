JSX := jsx

shooting.jsx.js: shooting.jsx shooting.html
	$(JSX) --release --executable web --output $@ $<

clean:
	rm -rf *.jsx.js
