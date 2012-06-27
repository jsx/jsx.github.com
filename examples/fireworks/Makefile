JSX := jsx

fireworks.jsx.js: fireworks.jsx fireworks.html
	$(JSX) --release --executable web --output $@ $<

clean:
	rm -rf *.jsx.js
