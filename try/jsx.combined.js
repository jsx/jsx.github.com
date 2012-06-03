(function(){var global = this;function debug(){return debug};function require(p, parent){ var path = require.resolve(p) , mod = require.modules[path]; if (!mod) throw new Error('failed to require "' + p + '" from ' + parent); if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path), global); } return mod.exports;}require.modules = {};require.resolve = function(path){ var orig = path , reg = path + '.js' , index = path + '/index.js'; return require.modules[reg] && reg || require.modules[index] && index || orig;};require.register = function(path, fn){ require.modules[path] = fn;};require.relative = function(parent) { return function(p){ if ('debug' == p) return debug; if ('.' != p.charAt(0)) return require(p); var path = parent.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/'), parent); };};require.register("Class.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

"use strict";

var Class = module.exports = function () {
};

Class.extend = function (properties) {
	var ctor = properties.constructor;
	if (ctor === Object) {
		var superCtor = this.prototype.constructor;
		ctor = properties.constructor = function () {
			superCtor.call(this);
		};
	}
	function tmp() {};
	tmp.prototype = this.prototype;
	ctor.prototype = new tmp();
	ctor.extend = Class.extend;
	// assign properties
	for (var k in properties) {
		if (k.charAt(0) == '$') {
			ctor[k.substring(1)] = properties[k];
		} else {
			ctor.prototype[k] = properties[k];
		}
	}
	if (typeof ctor.constructor === "function") {
		ctor.constructor();
	}
	return ctor;
};

Class.prototype.constructor = function () {
};

Class.$import = function (name) {
	return "var __module = require(\"" + name + "\");\n"
		+ "for (var n in __module)\n"
		+ "	eval(\"var \" + n + \" = __module[n];\");\n";
};


});require.register("classdef.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
var Type = require("./type");
eval(Class.$import("./util"));

"use strict";

var BlockContext = exports.BlockContext = Class.extend({

	constructor: function (localVariableStatuses, statement) {
		this.localVariableStatuses = localVariableStatuses;
		this.statement = statement;
	}

});

var AnalysisContext = exports.AnalysisContext = Class.extend({

	constructor: function (errors, parser, instantiateTemplate) {
		this.errors = errors;
		this.parser = parser;
		this.instantiateTemplate = instantiateTemplate;
		this.funcDef = null;
		/*
			blockStack is a stack of blocks:

			function f() { // pushes [ localVariableStatutes, funcDef ]
				...
				for (...) { // pushes [ localVariableStatuses, forStatement ]
					...
				}
				try { // pushes [ localVariableStatuses, tryStatement ]
					...
				} catch (e : Error) { // pushes [ localVariableStatuses, catchStatement ]
					...
					function () { // pushes [ localVariableStatuses, funcDef ]
						...
					}
				}
			}
		*/
		this.blockStack = null;
		this.statement = null;
	},

	clone: function () {
		// NOTE: does not clone the blockStack (call setBlockStack)
		return new AnalysisContext(this.errors, this.parser, this.instantiateTemplate).setFuncDef(this.funcDef);
	},

	setFuncDef: function (funcDef) {
		this.funcDef = funcDef;
		return this;
	},

	setBlockStack: function (stack) {
		this.blockStack = stack;
		return this;
	},

	getTopBlock: function () {
		return this.blockStack[this.blockStack.length - 1];
	}

});

var ClassDefinition = exports.ClassDefinition = Class.extend({

	$IS_CONST: 1,
	$IS_ABSTRACT: 2,
	$IS_FINAL: 4,
	$IS_STATIC: 8,
	$IS_NATIVE: 16,
	$IS_OVERRIDE: 32,
	$IS_INTERFACE: 64,
	$IS_MIXIN: 128,
	$IS_FAKE: 256, // used for marking a JS non-class object that should be treated like a JSX class instance (e.g. window)
	$IS_READONLY: 512,

	constructor: function (token, className, flags, extendName, implementNames, members, objectTypesUsed) {
		this._token = token;
		this._className = className;
		this._outputClassName = null;
		this._flags = flags;
		this._extendName = extendName;
		this._extendClassDef = null;
		this._implementNames = implementNames;
		this._implementClassDefs = [];
		this._members = members;
		this._objectTypesUsed = objectTypesUsed;
		this._optimizerStash = {};
		for (var i = 0; i < this._members.length; ++i)
			this._members[i].setClassDef(this);
	},

	serialize: function () {
		// FIXME implement in a way that is compatible with JSX
		return {
			"token"      : this._token,
			"name"       : this._className,
			"flags"      : this._flags,
			"extends"    : Util.serializeNullable(this._extendClassDef),
			"implements" : Util.serializeArray(this._implementClassDefs),
			"members"    : Util.serializeArray(this._members)
		};
	},

	$serialize: function (classDefs) {
		var s = [];
		for (var i = 0; i < classDefs.length; ++i)
			s[i] = classDefs[i].serialize();
		return JSON.stringify(s, null, 2);
	},

	getToken: function () {
		return this._token;
	},

	className: function () {
		return this._className;
	},

	setOutputClassName: function (name) {
		this._outputClassName = name;
	},

	getOutputClassName: function () {
		return this._outputClassName;
	},

	flags: function () {
		return this._flags;
	},

	setFlags: function (flags) {
		this._flags = flags;
	},

	extendName: function () {
		return this._extendName;
	},

	extendClassDef: function () {
		return this._extendClassDef;
	},

	implementNames: function () {
		return this._implementNames;
	},

	implementClassDefs: function () {
		return this._implementClassDefs;
	},

	members: function () {
		return this._members;
	},

	forEachClassToBase: function (cb) {
		if (! cb(this))
			return false;
		for (var i = this._implementClassDefs.length - 1; i >= 0; --i) {
			if (! cb(this._implementClassDefs[i]))
				return false;
		}
		if (this._extendClassDef._className != "Object")
			if (! this._extendClassDef.forEachClassToBase(cb))
				return false;
		return true;
	},

	forEachClassFromBase: function (cb) {
		if (this._extendClassDef._className != "Object")
			if (! this._extendClassDef.forEachClassFromBase(cb))
				return false;
		for (var i = 0; i < this._implementClassDefs.length; ++i) {
			if (! cb(this._implementClassDefs[i]))
				return false;
		}
		if (! cb(this))
			return false;
		return true;
	},

	forEachMember: function (cb) {
		for (var i = 0; i < this._members.length; ++i) {
			if (! cb(this._members[i]))
				return false;
		}
		return true;
	},

	forEachMemberVariable: function (cb) {
		for (var i = 0; i < this._members.length; ++i) {
			if (this._members[i] instanceof MemberVariableDefinition) {
				if (! cb(this._members[i]))
					return false;
			}
		}
		return true;
	},

	forEachMemberFunction: function (cb) {
		for (var i = 0; i < this._members.length; ++i) {
			if (this._members[i] instanceof MemberFunctionDefinition) {
				if (! cb(this._members[i]))
					return false;
			}
		}
		return true;
	},

	$GET_MEMBER_MODE_ALL: 0, // looks for functions or variables from the class and all super classes
	$GET_MEMBER_MODE_CLASS_ONLY: 1, // looks for functions or variables within the class
	$GET_MEMBER_MODE_SUPER: 2, // looks for functions with body in super classes
	$GET_MEMBER_MODE_FUNCTION_WITH_BODY: 3, // looks for function with body
	
	getMemberTypeByName: function (name, isStatic, mode) {
		// returns an array to support function overloading
		var types = [];
		this._getMemberTypesByName(types, name, isStatic, mode);
		switch (types.length) {
		case 0:
			return null;
		case 1:
			return types[0];
		default:
			return new Type.FunctionChoiceType(types);
		}
	},

	_getMemberTypesByName: function (types, name, isStatic, mode) {
		if (mode != ClassDefinition.GET_MEMBER_MODE_SUPER) {
			for (var i = 0; i < this._members.length; ++i) {
				var member = this._members[i];
				if (isStatic == ((member.flags() & ClassDefinition.IS_STATIC) != 0)
					&& name == member.name()) {
					if (member instanceof MemberVariableDefinition) {
						if ((member.flags() & ClassDefinition.IS_OVERRIDE) == 0) {
							var type = member.getType();
							// ignore member variables that failed in type deduction (already reported as a compile error)
							// it is guranteed by _assertMemberVariableIsDefinable that there would not be a property with same name using different type, so we can use the first one (declarations might be found more than once using the "abstract" attribute)
							if (type != null && types.length == 0)
								types[0] = type;
						}
					} else if (member instanceof MemberFunctionDefinition) {
						// member function
						if (member.getStatements() != null || mode != ClassDefinition.GET_MEMBER_MODE_NOT_ABSTRACT) {
							for (var j = 0; j < types.length; ++j)
								if (Util.typesAreEqual(member.getArgumentTypes(), types[j].getArgumentTypes()))
									break;
							if (j == types.length)
								types.push(member.getType());
						}
					} else {
						throw new Error("logic flaw");
					}
				}
			}
		} else {
			// for searching super classes, change mode GET_MEMBER_MODE_SUPER to GET_MEMBER_MODE_NOT_ABSTRACT
			mode = ClassDefinition.GET_MEMBER_MODE_FUNCTION_WITH_BODY;
		}
		if (mode != ClassDefinition.GET_MEMBER_MODE_CLASS_ONLY) {
			if (this._extendClassDef != null)
				this._extendClassDef._getMemberTypesByName(types, name, isStatic, mode);
			for (var i = 0; i < this._implementClassDefs.length; ++i)
				this._implementClassDefs[i]._getMemberTypesByName(types, name, isStatic, mode);
		}
	},

	resolveTypes: function (context) {
		// resolve extends
		if (this._extendName != null) {
			var baseClass = this._extendName.getClass(context);
			if (baseClass == null)
				; // error reported by getClass
			else if ((baseClass.flags() & ClassDefinition.IS_FINAL) != 0)
				context.errors.push(new CompileError(this._extendName.getToken(), "cannot extend a final class"));
			else if ((baseClass.flags() & ClassDefinition.IS_INTERFACE) != 0)
				context.errors.push(new CompileError(this._extendName.getToken(), "cannot extend an interface, use the 'implements' keyword"));
			else if ((baseClass.flags() & ClassDefinition.IS_MIXIN) != 0)
				context.errors.push(new CompileError(this._extendName.getToken(), "cannot extend an mixin, use the 'implements' keyword"));
			else
				this._extendClassDef = baseClass;
		} else if (this._className != "Object") {
			var baseClass = context.parser.lookup(context.errors, this._token, "Object");
			this._extendClassDef = baseClass;
		}
		// resolve implements
		for (var i = 0; i < this._implementNames.length; ++i) {
			var baseClass = this._implementNames[i].getClass(context);
			var success = true;
			if (baseClass == null) {
				// error reported by getClass
				success = false;
			} else if ((baseClass.flags() & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) == 0) {
				context.errors.push(new CompileError(this._implementNames[i].getToken(), "cannot implement a class (only interfaces can be implemented)"));
				success = false;
			} else {
				for (var j = 0; j < this._implementClassDefs.length; ++j) {
					if (this._implementClassDefs[j] == baseClass) {
						context.errors.push(new CompileError(this._implementNames[i].getToken(), "cannot implement the same interface more than once"));
						success = false;
						break;
					}
				}
			}
			if (success)
				this._implementClassDefs.push(baseClass);
		}
		// resolve types used
		for (var i = 0; i < this._objectTypesUsed.length; ++i)
			this._objectTypesUsed[i].resolveType(context);
		// create default constructor if no constructors exist
		if (this.forEachMemberFunction(function (funcDef) { return funcDef.name() != "constructor"; })) {
			var Parser = require("./parser");
			var isNative = (this.flags() & ClassDefinition.IS_NATIVE) != 0;
			var func = new MemberFunctionDefinition(
				this._token,
				new Parser.Token("constructor", true),
				ClassDefinition.IS_FINAL | (this.flags() & ClassDefinition.IS_NATIVE),
				Type.Type.voidType,
				[],
				isNative ? null : [],
				isNative ? null : [],
				isNative ? null : [],
				this._token /* FIXME */);
			func.setClassDef(this);
			this._members.push(func);
		}
	},

	setAnalysisContextOfVariables: function (context) {
		for (var i = 0; i < this._members.length; ++i) {
			var member = this._members[i];
			if (member instanceof MemberVariableDefinition)
				member.setAnalysisContext(context);
		}
	},

	analyze: function (context) {
		// check that the class may be extended
		if (! this._assertInheritanceIsNotInLoop(context, null, this.getToken()))
			return false;
		// check that none of the implemented mixins are implemented by the base classes
		if ((this.flags() & ClassDefinition.IS_MIXIN) != 0)
			for (var i = 0; i < this._implementClassDefs.length; ++i)
				if (! this._implementClassDefs[i]._assertMixinIsImplementable(context, this, this.getToken()))
					break;
		for (var i = 0; i < this._implementClassDefs.length; ++i) {
			if ((this._implementClassDefs[i].flags() & ClassDefinition.IS_MIXIN) != 0) {
				if (this._extendClassDef != null && ! this._extendClassDef._assertMixinIsImplementable(context, this._implementClassDefs[i], this._implementNames[i].getToken())) {
					// error found and reported
				} else {
					for (var j = 0; j < i; ++j) {
						if (! this._implementClassDefs[j]._assertMixinIsImplementable(context, this._implementClassDefs[i], this._implementNames[i].getToken())) {
							// error found and reported
						}
					}
				}
			}
		}
		// check that the properties of the class does not conflict with those in base classes or implemented interfaces
		for (var i = 0; i < this._members.length; ++i) {
			this._assertMemberIsDefinable(context, this._members[i], this, this._members[i].getToken());
		}
		// check that the properties of the implemented interfaces does not conflict with those in base classes or other implement interfaces
		for (var i = 0; i < this._implementClassDefs.length; ++i) {
			var interfaceDef = this._implementClassDefs[i];
			for (var j = 0; j < interfaceDef._members.length; ++j)
				this._assertMemberIsDefinable(context, interfaceDef._members[j], interfaceDef, this._implementNames[i].getToken());
		}
		// check that the member functions with "override" attribute are in fact overridable
		if ((this._flags & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) == 0) {
			for (var i = 0; i < this._members.length; ++i)
				if (this._members[i] instanceof MemberFunctionDefinition && (this._members[i].flags() & ClassDefinition.IS_OVERRIDE) != 0)
					if (this._assertFunctionIsOverridableInBaseClasses(context, this._members[i]) === null)
						context.errors.push(new CompileError(this._members[i].getToken(), "could not find function definition in base classes / mixins to be overridden"));
			for (var i = 0; i < this._implementClassDefs.length; ++i) {
				if ((this._implementClassDefs[i].flags & ClassDefinition.IS_MIXIN) == 0)
					continue;
				var overrideFunctions = [];
				this._implementClassDefs[i]._getMembers(overrideFunctions, true, ClassDefinition.IS_OVERRIDE, ClassDefinition.IS_OVERRIDE);
				for (var j = 0; j < overrideFunctions.length; ++j) {
					var done = false;
					if (this._baseClassDef != null)
						if (this._baseClassDef._assertFunctionIsOverridable(context, overrideFunctions[j]) !== null)
							done = true;
					for (var k = 0; k < i; ++k) {
						if (this._implementClassDefs[k]._assertFunctionIsOverridable(context, overrideFunctions[j]) !== null) {
							done = true;
							break;
						}
					}
					if (! done)
						context.errors.push(new CompileError(this.getToken(), "could not find function definition to be overridden by '" + overrideFunctions[j].getClassDef().className() + "#" + overrideFunctions[j].name() + "'"));
				}
			}
		}
		// check that there are no "abstract" members for a concrete class
		if ((this._flags & (ClassDefinition.IS_ABSTRACT | ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) == 0) {
			var abstractMembers = [];
			this._getMembers(abstractMembers, false, ClassDefinition.IS_ABSTRACT, ClassDefinition.IS_ABSTRACT);
			this._filterAbstractMembers(abstractMembers);
			if (abstractMembers.length != 0) {
				var msg = "class should be declared as 'abstract' since the following members do not have concrete definition: ";
				for (var i = 0; i < abstractMembers.length; ++i) {
					if (i != 0)
						msg += ", ";
					msg += abstractMembers[i].getClassDef().className() + "#" + abstractMembers[i].name();
				}
				context.errors.push(new CompileError(this.getToken(), msg));
			}
		}
		// analyze the member functions, analysis of member variables is performed lazily (and those that where never analyzed will be removed by dead code elimination)
		for (var i = 0; i < this._members.length; ++i) {
			var member = this._members[i];
			if (member instanceof MemberFunctionDefinition)
				member.analyze(context, this);
		}
	},

	analyzeUnusedVariables: function () {
		for (var i = 0; i < this._members.length; ++i) {
			var member = this._members[i];
			if (member instanceof MemberVariableDefinition)
				member.getType();
		}
	},

	isConvertibleTo: function (classDef) {
		if (this == classDef)
			return true;
		if (this._extendClassDef != null && this._extendClassDef.isConvertibleTo(classDef))
			return true;
		for (var i = 0; i < this._implementClassDefs.length; ++i)
			if (this._implementClassDefs[i].isConvertibleTo(classDef))
				return true;
		return false;
	},

	_assertInheritanceIsNotInLoop: function (context, classDef, token) {
		if (classDef == this) {
			context.errors.push(new CompileError(token, "class inheritance is in a loop"));
			return false;
		}
		if (classDef == null)
			classDef = this;
		if (this._extendClassDef != null && ! this._extendClassDef._assertInheritanceIsNotInLoop(context, classDef, token))
			return false;
		for (var i = 0; i < this._implementClassDefs.length; ++i)
			if (! this._implementClassDefs[i]._assertInheritanceIsNotInLoop(context, classDef, token))
				return false;
		return true;
	},

	_assertMixinIsImplementable: function (context, classDef, token) {
		for (var i = 0; i < this._implementClassDefs.length; ++i) {
			if (this._implementClassDefs[i] == classDef) {
				context.errors.push(new CompileError(token, "cannot implement mixin '" + classDef.className() + "' already implemented by '" + this.className() + "'"));
				return false;
			}
		}
		return true;
	},

	_assertMemberIsDefinable: function (context, member, memberClassDef, token) {
		if ((member.flags() & ClassDefinition.IS_STATIC) != 0)
			return true;
		for (var numImplementsToCheck = 0; numImplementsToCheck < this._implementClassDefs.length; ++numImplementsToCheck)
			if (memberClassDef == this._implementClassDefs[numImplementsToCheck])
				break;
		var isCheckingSibling = numImplementsToCheck != this._implementClassDefs.length;
		if (member instanceof MemberVariableDefinition) {
			if (this._extendClassDef != null && ! this._extendClassDef._assertMemberVariableIsDefinable(context, member, memberClassDef, token))
				return false;
			for (var i = 0; i < numImplementsToCheck; ++i) {
				if (! this._implementClassDefs[i]._assertMemberVariableIsDefinable(context, member, memberClassDef, token))
					return false;
			}
		} else { // function
			if (this._extendClassDef != null && ! this._extendClassDef._assertMemberFunctionIsDefinable(context, member, memberClassDef, token, false))
				return false;
			for (var i = 0; i < numImplementsToCheck; ++i) {
				if (memberClassDef != this._implementClassDefs[i] && ! this._implementClassDefs[i]._assertMemberFunctionIsDefinable(context, member, memberClassDef, token, isCheckingSibling))
					return false;
			}
		}
		return true;
	},

	_assertMemberVariableIsDefinable: function (context, member, memberClassDef, token) {
		for (var i = 0; i < this._members.length; ++i) {
			if (this._members[i].name() == member.name()) {
				if ((this._members[i].flags() & ClassDefinition.IS_ABSTRACT) == 0) {
					context.errors.push(new CompileError(token, "cannot define property '" + memberClassDef.className() + "#" + member.name() + "', the name is already used in '" + this.className() + "'"));
					return false;
				}
				if (! this._members[i].getType().equals(member.getType())) {
					context.errors.push(new CompileError(token, "cannot override property '" + this.className() + "#" + member.name() + "' of type '" + this._members[i].getType().toString() + "' in class '" + memberClassDef.className() + "' with different type '" + member.getType().toString() + "'"));
					return false;
				}
			}
		}
		if (this._extendClassDef != null && ! this._extendClassDef._assertMemberVariableIsDefinable(context, member, memberClassDef, token))
			return false;
		for (var i = 0; i < this._implementClassDefs.length; ++i)
			if (! this._implementClassDefs[i]._assertMemberVariableIsDefinable(context, member, memberClassDef, token))
				return false;
		return true;
	},

	_assertMemberFunctionIsDefinable: function (context, member, memberClassDef, token, reportOverridesAsWell) {
		if (member.name() == "constructor")
			return true;
		for (var i = 0; i < this._members.length; ++i) {
			if (this._members[i].name() != member.name())
				continue;
			// property with the same name has been found, we can tell yes or no now
			if (this._members[i] instanceof MemberVariableDefinition) {
				context.errors.push(new CompileError(token, "cannot define property '" + memberClassDef.className() + "#" + member.name() + "', the name is already used in '" + this.className() + "'"));
				return false;
			}
			if (! Util.typesAreEqual(this._members[i].getArgumentTypes(), member.getArgumentTypes()))
				continue;
			if ((member.flags() & ClassDefinition.IS_OVERRIDE) == 0) {
				context.errors.push(new CompileError(member.getToken(), "overriding functions must have 'override' attribute set (defined in base class '" + this.className() + "')"));
				return false;
			}
			if (reportOverridesAsWell && (this._members[i].flags() & ClassDefinition.IS_OVERRIDE) != 0) {
				context.errors.push(new CompileError(member.getToken(), "definition of the function conflicts with sibling mix-in '" + this.className() + "'"));
				return false;
			}
			// assertion of function being overridden does not have 'final' attribute is done by assertFunctionIsOverridable
			return true;
		}
		// delegate to base classes
		if (this._extendClassDef != null && ! this._extendClassDef._assertMemberFunctionIsDefinable(context, member, memberClassDef, token, false))
			return false;
		for (var i = 0; i < this._implementClassDefs.length; ++i)
			if (! this._implementClassDefs[i]._assertMemberFunctionIsDefinable(context, member, memberClassDef, token, false))
				return false;
		return true;
	},

	_assertFunctionIsOverridable: function (context, member) {
		for (var i = 0; i < this._members.length; ++i) {
			if (this._members[i].name() == member.name()
				&& this._members[i] instanceof MemberFunctionDefinition
				&& (this._members[i] & ClassDefinition.IS_STATIC) == 0
				&& Util.typesAreEqual(this._members[i].getArgumentTypes(), member.getArgumentTypes())) {
				if ((this._members[i].flags() & ClassDefinition.IS_FINAL) != 0) {
					context.errors.push(new CompileError(member.getToken(), "cannot override final function defined in class '" + this.className() + "'"));
					return false;
				} else {
					return true;
				}
			}
		}
		return this._assertFunctionIsOverridableInBaseClasses(context, member);
	},

	_assertFunctionIsOverridableInBaseClasses: function (context, member) {
		if (this._extendClassDef != null) {
			var ret = this._extendClassDef._assertFunctionIsOverridable(context, member);
			if (ret !== null)
				return ret;
		}
		for (var i = 0; i < this._implementClassDefs.length; ++i) {
			var ret = this._implementClassDefs[i]._assertFunctionIsOverridable(context, member);
			if (ret !== null)
				return ret;
		}
		return null;
	},

	_getMembers: function (list, functionOnly, flagsMask, flagsMaskMatch) {
		// fill in the definitions of base classes
		if (this._baseClassDef != null)
			this._baseClassDef._getMembers(list, functionOnly, flagsMask, flagsMaskMatch);
		for (var i = 0; i < this._implementClassDefs.length; ++i)
			this._implementClassDefs[i]._getMembers(list, functionOnly, flagsMask, flagsMaskMatch);
		// fill in the definitions of members
		for (var i = 0; i < this._members.length; ++i) {
			if (functionOnly && ! (this._members[i] instanceof MemberFunctionDefinition))
				continue;
			if ((this._members[i].flags() & flagsMask) != flagsMaskMatch)
				continue;
			for (var j = 0; j < list.length; ++j)
				if (list[j].name() == this._members[i].name())
					if ((list[j] instanceof MemberVariableDefinition) || Util.typesAreEqual(list[j].getArgumentTypes(), this._members[j].getArgumentTypes()))
						break;
			if (j == list.length)
				list.push(this._members[i]);
		}
	},

	_filterAbstractMembers: function (list) {
		// filter the abstract members by using base classes
		if (list.length == 0)
			return;
		if (this._baseClassDef != null)
			this._baseClassDef._filterAbstractMembers(list);
		for (var i = 0; i < this._implementClassDefs.length; ++i)
			this._implementClassDefs[i]._filterAbstractMembers(list);
		for (var i = 0; i < this._members.length; ++i) {
			if ((this._members[i].flags() & ClassDefinition.IS_ABSTRACT) != 0)
				continue;
			for (var j = 0; j < list.length; ++j)
				if (list[j].name() == this._members[i].name())
					if ((list[j] instanceof MemberVariableDefinition) || Util.typesAreEqual(list[j].getArgumentTypes(), this._members[i].getArgumentTypes()))
						break;
			if (j != list.length) {
				list.splice(j, 1);
				if (list.length == 0)
					break;
			}
		}
	},

	hasDefaultConstructor: function () {
		var hasCtorWithArgs = false;
		for (var i = 0; i < this._members.length; ++i) {
			var member = this._members[i];
			if (member.name() == "constructor" && (member.flags() & ClassDefinition.IS_STATIC) == 0 && member instanceof MemberFunctionDefinition) {
				if (member.getArguments().length == 0)
					return true;
				hasCtorWithArgs = true;
			}
		}
		return ! hasCtorWithArgs;
	},

	getOptimizerStash: function () {
		return this._optimizerStash;
	}

});

// abstract class deriving Member(Function|Variable)Definition
var MemberDefinition = exports.MemberDefinition = Class.extend({

	constructor: function (token, nameToken, flags) {
		this._token = token;
		this._nameToken = nameToken; // may be null
		if(typeof(nameToken) === "string") throw new Error("nameToken must be a Token object or null!");
		this._flags = flags;
		this._classDef = null;
		this._optimizerStash = {};
	},

	// token of "function" or "var"
	getToken: function () {
		return this._token;
	},

	getNameToken: function () {
		return this._nameToken;
	},

	name: function () {
		return this._nameToken.getValue();
	},

	flags: function () {
		return this._flags;
	},

	setFlags: function (flags) {
		this._flags = flags;
	},

	getClassDef: function () {
		return this._classDef;
	},

	setClassDef: function (classDef) {
		this._classDef = classDef;
	},

	getOptimizerStash: function () {
		return this._optimizerStash;
	}

});

var MemberVariableDefinition = exports.MemberVariableDefinition = MemberDefinition.extend({

	$NOT_ANALYZED: 0,
	$IS_ANALYZING: 1,
	$ANALYZE_SUCEEDED: 2,
	$ANALYZE_FAILED: 3,

	constructor: function (token, name, flags, type, initialValue) {
		MemberDefinition.call(this, token, name, flags);
		this._type = type; // may be null
		this._initialValue = initialValue; // may be null
		this._analyzeState = MemberVariableDefinition.NOT_ANALYZED;
		this._analysisContext = null;
	},

	instantiate: function (instantiationContext) {
		var type = this._type.instantiate(instantiationContext);
		return new MemberVariableDefinition(this._token, this._nameToken, this._flags, type, this._initialValue);
	},

	serialize: function () {
		return {
			"name"         : this.name(),
			"flags"        : this.flags(),
			"type"         : Util.serializeNullable(this._type),
			"initialValue" : Util.serializeNullable(this._initialValue)
		};
	},

	setAnalysisContext: function (context) {
		this._analysisContext = context.clone();
	},

	getType: function () {
		switch (this._analyzeState) {
		case MemberVariableDefinition.NOT_ANALYZED:
			try {
				this._analyzeState = MemberVariableDefinition.IS_ANALYZING;
				if (this._initialValue != null) {
					if (! this._initialValue.analyze(this._analysisContext))
						return;
					var ivType = this._initialValue.getType();
					if (this._type == null) {
						this._type = ivType;
					} else if (! ivType.isConvertibleTo(this._type)) {
						this._analysisContext.errors.push(new CompileError(this._nameToken,
							"the variable is declared as '" + this._type.toString() + "' but initial value is '" + ivType.toString() + "'"));
					}
				}
				this._analyzeState = MemberVariableDefinition.ANALYZE_SUCEEDED;
			} finally {
				if (this._analyzeState != MemberVariableDefinition.ANALYZE_SUCEEDED)
					this._analyzeState = MemberVariableDefinition.ANALYZE_FAILED;
			}
			break;
		case MemberVariableDefinition.IS_ANALYZING:
			this._analysisContext.errors.push(new CompileError(this._token,
				"please declare type of variable '" + this.name() + "' (detected recursion while trying to reduce type)"));
			break;
		default:
			break;
		}
		return this._type;
	},

	getInitialValue: function () {
		return this._initialValue;
	},

	setInitialValue: function (initialValue) {
		this._initialValue = initialValue;
	}

});

var MemberFunctionDefinition = exports.MemberFunctionDefinition = MemberDefinition.extend({

	constructor: function (token, name, flags, returnType, args, locals, statements, closures, lastTokenOfBody) {
		MemberDefinition.call(this, token, name, flags);
		this._returnType = returnType;
		this._args = args;
		this._locals = locals;
		this._statements = statements;
		this._closures = closures;
		this._lastTokenOfBody = lastTokenOfBody;
		this._parent = null;
		this._classDef = null;
		if (this._closures != null) {
			for (var i = 0; i < this._closures.length; ++i)
				this._closures[i].setParent(this);
		}
	},

	instantiate: function (instantiationContext) {
		if (this._statements != null)
			throw new Error("template instantiation of function body is not supported (yet)");
		var returnType = this._returnType.instantiate(instantiationContext);
		if (returnType == null)
			return null;
		var args = [];
		for (var i = 0; i < this._args.length; ++i) {
			var arg = this._args[i].instantiate(instantiationContext);
			if (arg == null)
				return null;
			args[i] = arg;
		}
		return new MemberFunctionDefinition(this._token, this._nameToken, this._flags, returnType, args, null, null);
	},

	serialize: function () {
		return {
			"token"      : this._token.serialize(),
			"nameToken"  : Util.serializeNullable(this._nameToken),
			"flags"      : this.flags(),
			"returnType" : this._returnType.serialize(),
			"args"       : Util.serializeArray(this._args),
			"locals"     : Util.serializeArray(this._locals),
			"statements" : Util.serializeArray(this._statements)
		};
	},

	analyze: function (outerContext) {
		// return if is abtract (wo. function body) or is native
		if (this._statements == null)
			return;

		// setup context
		var context = outerContext.clone().setFuncDef(this);
		if (this._parent == null) {
			context.setBlockStack([ new BlockContext(new LocalVariableStatuses(this, null), this) ]);
		} else {
			context.setBlockStack(outerContext.blockStack);
			context.blockStack.push(new BlockContext(new LocalVariableStatuses(this, outerContext.getTopBlock().localVariableStatuses), this));
		}

		try {

			// do the checks
			for (var i = 0; i < this._statements.length; ++i)
				if (! this._statements[i].analyze(context))
					break;
			if (! this._returnType.equals(Type.Type.voidType) && context.getTopBlock().localVariableStatuses != null)
				context.errors.push(new CompileError(this._lastTokenOfBody, "missing return statement"));

			if (this.getNameToken() != null && this.name() == "constructor")
				this._fixupConstructor(context);

		} finally {
			context.blockStack.pop();
		}

	},

	_fixupConstructor: function (context) {
		var Parser = require("./parser");
		var Expression = require("./expression");
		var Statement = require("./statement");

		var success = true;

		// make implicit calls to default constructor explicit as well as checking the invocation order
		var stmtIndex = 0;
		for (var baseIndex = 0; baseIndex <= this._classDef.implementClassDefs().length; ++baseIndex) {
			var baseClassDef = baseIndex == 0 ? this._classDef.extendClassDef() : this._classDef.implementClassDefs()[baseIndex - 1];
			if (stmtIndex < this._statements.length
				&& this._statements[stmtIndex] instanceof Statement.ConstructorInvocationStatement
				&& baseClassDef == this._statements[stmtIndex].getConstructingClassDef()) {
				// explicit call to the base class, no need to complement
				if (baseClassName == "Object")
					this._statements.splice(stmtIndex, 1);
				else
					++stmtIndex;
			} else {
				// insert call to the default constructor
				var baseClassName = baseIndex == 0 ? this._classDef.extendName() : this._classDef.implementNames()[baseIndex - 1];
				if (baseClassName == null || baseClassName.getToken().getValue() == "Object") {
					// we can omit the call
				} else if (baseClassDef.hasDefaultConstructor()) {
					var ctorStmt = new Statement.ConstructorInvocationStatement(baseClassName, []);
					this._statements.splice(stmtIndex, 0, ctorStmt);
					if (! ctorStmt.analyze(context))
						throw new Error("logic flaw");
					++stmtIndex;
				} else {
					if (stmtIndex < this._statements.length) {
						context.errors.push(new CompileError(this._statements[stmtIndex].getToken(), "constructor of class '" + baseClassName.getToken().getValue() + "' should be called prior to the statement"));
					} else {
						context.errors.push(new CompileError(this._token, "super class '" + baseClassName.getToken().getValue() + "' should be initialized explicitely (no default constructor)"));
					}
					success = false;
				}
			}
		}
		for (; stmtIndex < this._statements.length; ++stmtIndex) {
			if (! (this._statements[stmtIndex] instanceof Statement.ConstructorInvocationStatement))
				break;
			context.errors.push(new CompileError(this._statements[stmtIndex].getToken(), "constructors should be invoked in the order they are implemented"));
			success = false;
		}
		// NOTE: it is asserted by the parser that ConstructorInvocationStatements precede other statements
		if (! success)
			return;
		var normalStatementFromIndex = stmtIndex;

		// find out the properties that need to be initialized (that are not initialized by the ctor explicitely before completion or being used)
		var initProperties = {};
		this._classDef.forEachMemberVariable(function (member) {
			if ((member.flags() & (ClassDefinition.IS_STATIC | ClassDefinition.IS_ABSTRACT)) == 0)
				initProperties[member.name()] = true;
			return true;
		}.bind(this));
		for (var i = normalStatementFromIndex; i < this._statements.length; ++i) {
			if (! (this._statements[i] instanceof Statement.ExpressionStatement))
				break;
			var canContinue = this._statements[i].forEachExpression(function onExpr(expr) {
				var lhsExpr;
				/*
					FIXME if the class is extending a native class and the expression is setting a property of the native class,
					then we should break, since it might have side effects (e.g. the property might be defined as a setter)
				*/
				if (expr instanceof Expression.AssignmentExpression
					&& expr.getToken().getValue() == "="
					&& (lhsExpr = expr.getFirstExpr()) instanceof Expression.PropertyExpression
					&& lhsExpr.getExpr() instanceof Expression.ThisExpression) {
					initProperties[lhsExpr.getIdentifierToken().getValue()] = false;
					return true;
				} else if (expr instanceof Expression.ThisExpression
					|| expr instanceof Expression.FunctionExpression) {
					return false;
				}
				return expr.forEachExpression(onExpr.bind(this));
			}.bind(this));
			if (! canContinue)
				break;
		}
		// insert the initializers
		var insertStmtAt = normalStatementFromIndex;
		this._classDef.forEachMemberVariable(function (member) {
			if ((member.flags() & (ClassDefinition.IS_STATIC | ClassDefinition.IS_ABSTRACT)) == 0) {
				if (initProperties[member.name()]) {
					var stmt = new Statement.ExpressionStatement(
						new Expression.AssignmentExpression(new Parser.Token("=", false),
							new Expression.PropertyExpression(new Parser.Token(".", false),
								new Expression.ThisExpression(new Parser.Token("this", false), new Type.ObjectType(this._classDef)),
								member.getNameToken(), member.getType()),
							member.getInitialValue()));
					this._statements.splice(insertStmtAt++, 0, stmt);
				}
			}
			return true;
		}.bind(this));
	},

	getReturnType: function () {
		return this._returnType;
	},

	getArguments: function () {
		return this._args;
	},

	getArgumentTypes: function () {
		var argTypes = [];
		for (var i = 0; i < this._args.length; ++i)
			argTypes[i] = this._args[i].getType();
		return argTypes;
	},

	getParent: function () {
		return this._parent;
	},

	setParent: function (parent) {
		this._parent = parent;
	},

	// return list of local variables (omitting arguments)
	getLocals: function () {
		return this._locals;
	},

	getStatements: function () {
		return this._statements;
	},

	getClosures: function () {
		return this._closures;
	},

	// return an argument or a local variable
	getLocal: function (context, name) {
		var Statement = require("./statement");
		// for the current function, check the caught variables
		for (var i = context.blockStack.length - 1; i >= 0; --i) {
			var block = context.blockStack[i].statement;
			if (block instanceof MemberFunctionDefinition) {
				// function scope
				for (var j = 0; j < block._locals.length; ++j) {
					var local = block._locals[j];
					if (local.getName().getValue() == name)
						return local;
				}
				for (var j = 0; j < block._args.length; ++j) {
					var arg = block._args[j];
					if (arg.getName().getValue() == name)
						return arg;
				}
			} else if (block instanceof Statement.CatchStatement) {
				// catch statement
				var local = block.getLocal();
				if (local.getName().getValue() == name)
					return local;
			}
		}
		return null;
	},

	getType: function () {
		return (this._flags & ClassDefinition.IS_STATIC) != 0
			? new Type.StaticFunctionType(this._returnType, this.getArgumentTypes(), false)
			: new Type.MemberFunctionType(new Type.ObjectType(this._classDef), this._returnType, this.getArgumentTypes(), false);
	},

	forEachStatement: function (cb) {
		return Util.forEachStatement(cb, this._statements);
	},

	forEachClosure: function (cb) {
		if (this._closures != null)
			for (var i = 0; i < this._closures.length; ++i)
				if (! cb(this._closures[i]))
					return false;
		return true;
	}

});

var LocalVariable = exports.LocalVariable = Class.extend({

	constructor: function (name, type) {
		this._name = name;
		this._type = type;
	},

	serialize: function () {
		return [
			this._name,
			Util.serializeNullable(this._type)
		];
	},

	getName: function () {
		return this._name;
	},

	getType: function () {
		return this._type;
	},

	setType: function (type) {
		if (this._type != null)
			throw Error("type is already set");
		// implicit declarations of "int" is not supported
		if (type.equals(Type.integerType))
			type = Type.numberType;
		this._type = type;
	},

	touchVariable: function (context, token, isAssignment) {
		if (isAssignment) {
			context.getTopBlock().localVariableStatuses.setStatus(this, LocalVariableStatuses.ISSET);
		} else {
			switch (context.getTopBlock().localVariableStatuses.getStatus(this)) {
			case LocalVariableStatuses.ISSET:
				// ok
				break;
			case LocalVariableStatuses.UNSET:
				context.errors.push(new CompileError(token, "variable is not initialized"));
				return false;
			case LocalVariableStatuses.MAYBESET:
				context.errors.push(new CompileError(token, "variable may not be initialized"));
				return false;
			default:
				throw new Error("logic flaw");
			}
		}
		return true;
	},

	toString: function () {
		return this._name + " : " + this._type;
	}
});

var CaughtVariable = exports.CaughtVariable = LocalVariable.extend({

	constructor: function (name, type) {
		LocalVariable.prototype.constructor.call(this, name, type);
	},

	touchVariable: function (context, token, isAssignment) {
		return true;
	}

});

var ArgumentDeclaration = exports.ArgumentDeclaration = LocalVariable.extend({

	constructor: function (name, type) {
		LocalVariable.prototype.constructor.call(this, name, type);
	},

	instantiate: function (instantiationContext) {
		var type = this._type.instantiate(instantiationContext);
		return new ArgumentDeclaration(this._name, type);
	}

});

var LocalVariableStatuses = exports.LocalVariableStatuses = Class.extend({

	$UNSET: 0,
	$ISSET: 1,
	$MAYBESET: 2,

	constructor: function () {
		this._statuses = {};

		switch (arguments.length) {

		case 2: // (funcDef : MemberFunctionDefinition, baseStatuses : LocalVariableStatuses)
			var funcDef = arguments[0];
			var base = arguments[1];
			if (base != null) {
				// FIXME the analysis of the closures should be delayed to either of: first being used, or return is called, to minimize the appearance of the "not initialized" error
				for (var k in base._statuses)
					this._statuses[k] = base._statuses[k] == LocalVariableStatuses.UNSET ? LocalVariableStatuses.MAYBESET : base._statuses[k];
			}
			var args = funcDef.getArguments();
			for (var i = 0; i < args.length; ++i)
				this._statuses[args[i].getName().getValue()] = LocalVariableStatuses.ISSET;
			var locals = funcDef.getLocals();
			for (var i = 0; i < locals.length; ++i)
				this._statuses[locals[i].getName().getValue()] = LocalVariableStatuses.UNSET;
			break;

		case 1: // (srcStatus : LocalVariableStatus)
			this._copyFrom(arguments[0]);
			break;

		default:
			throw new Error("logic flaw");
		}
	},

	clone: function () {
		return new LocalVariableStatuses(this);
	},

	merge: function (that) {
		var ret = this.clone();
		for (var k in ret._statuses) {
			if (ret._statuses[k] == LocalVariableStatuses.UNSET && that._statuses[k] == LocalVariableStatuses.UNSET) {
				// UNSET
			} else if (ret._statuses[k] == LocalVariableStatuses.ISSET && that._statuses[k] == LocalVariableStatuses.ISSET) {
				// ISSET
			} else {
				// MAYBESET
				ret._statuses[k] = LocalVariableStatuses.MAYBESET;
			}
		}
		return ret;
	},

	setStatus: function (local) {
		var name = local.getName().getValue();
		if (this._statuses[name] === undefined)
			throw new Error("logic flaw, could not find status for local variable: " + name);
		this._statuses[name] = LocalVariableStatuses.ISSET;
	},

	getStatus: function (local) {
		var name = local.getName().getValue();
		if (this._statuses[name] === undefined)
			throw new Error("logic flaw, could not find status for local variable: " + name);
		return this._statuses[name];
	},

	_copyFrom: function (that) {
		for (var k in that._statuses)
			this._statuses[k] = that._statuses[k];
	}

});

var TemplateClassDefinition = exports.TemplateClassDefinition = Class.extend({

	constructor: function (className, flags, typeArgs, extendName, implementNames, members, objectTypesUsed) {
		if (extendName != null || implementNames.length != 0)
			throw new Error("not supported");
		this._className = className;
		this._flags = flags;
		this._typeArgs = typeArgs;
		this._members = members;
		this._objectTypesUsed = objectTypesUsed;
		this._instantiatedDefs = [];
	},

	className: function () {
		return this._className;
	},

	instantiate: function (errors, request) {
		// check number of type arguments
		if (this._typeArgs.length != request.getTypeArguments().length) {
			errors.push(new CompileError(request.getToken(), "wrong number of template arguments (expected " + this._typeArgs.length + ", got " + request.getTypes().length));
			return null;
		}
		// return one, if already instantiated
		for (var i = 0; i < this._instantiatedDefs.length; ++i) {
			if (this._instantiatedDefs[i].typeArgumentsAreEqual(request.getTypeArguments())) {
				return this._instantiatedDefs[i];
			}
		}
		// build context
		var instantiationContext = {
			errors: errors,
			request: request,
			typemap: {}, // string => Type
			objectTypesUsed: []
		};
		for (var i = 0; i < this._typeArgs.length; ++i)
			instantiationContext.typemap[this._typeArgs[i].getValue()] = request.getTypeArguments()[i];
		// FIXME add support for extend and implements
		var succeeded = true;
		var members = [];
		for (var i = 0; i < this._members.length; ++i) {
			var member = this._members[i].instantiate(instantiationContext);
			if (member == null)
				succeeded = false;
			members[i] = member;
		}
		// done
		if (! succeeded)
			return null;
		var instantiatedDef = new InstantiatedClassDefinition(
			this._className,
			this._flags,
			request.getTypeArguments(),
			null,
			[],
			members,
			instantiationContext.objectTypesUsed);
		this._instantiatedDefs.push(instantiatedDef);
		return instantiatedDef;
	}

});

var InstantiatedClassDefinition = exports.InstantiatedClassDefinition = ClassDefinition.extend({

	constructor: function (templateClassName, flags, typeArguments, extendName, implementNames, members, objectTypesUsed) {
		ClassDefinition.prototype.constructor.call(
			this,
			null,
			Type.Type.templateTypeToString(templateClassName, typeArguments),
			flags,
			extendName,
			implementNames,
			members,
			objectTypesUsed);
		this._templateClassName = templateClassName;
		this._typeArguments = typeArguments;
	},

	getTemplateClassName: function () {
		return this._templateClassName;
	},

	getTypeArguments: function () {
		return this._typeArguments;
	},

	typeArgumentsAreEqual: function (typeArgs) {
		if (! this._typeArguments.length == typeArgs.length)
			return false;
		for (var i = 0; i < typeArgs.length; ++i) {
			if (! this._typeArguments[i].equals(typeArgs[i]))
				return false;
		}
		return true;
	}

});

});require.register("compiler.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./parser"));
eval(Class.$import("./classdef"));
eval(Class.$import("./type"));
eval(Class.$import("./emitter"));
eval(Class.$import("./platform"));
eval(Class.$import("./util"));

"use strict";

var Compiler = exports.Compiler = Class.extend({

	$MODE_COMPILE: 0,
	$MODE_PARSE: 1,

	constructor: function (platform) {
		this._platform = platform;
		this._mode = Compiler.MODE_COMPILE;
		this._optimizer = null;
		this._parsers = [];
		this._fileCache = {};
		this._searchPaths = [ this._platform.getRoot() + "/lib/common" ];
		// load the built-in classes
		this.addSourceFile(null, this._platform.getRoot() + "/lib/built-in.jsx");
		this._builtinParsers = this._parsers.concat([]); // shallow clone
	},

	addSearchPath: function(path) {
		this._searchPaths.unshift(path);
	},

	getPlatform: function () {
		return this._platform;
	},

	getMode: function () {
		return this._mode;
	},

	setMode: function (mode) {
		this._mode = mode;
		return this;
	},

	setEmitter: function (emitter) {
		this._emitter = emitter;
	},

	setOptimizer: function (optimizer) {
		this._optimizer = optimizer;
	},

	setEnableInlining: function (mode) {
		this._enableInlining = mode;
	},

	addSourceFile: function (token, path) {
		var parser;
		if ((parser = this.findParser(path)) == null) {
			parser = new Parser(token, path);
			this._parsers.push(parser);
		}
		return parser;
	},

	findParser: function (path) {
		for (var i = 0; i < this._parsers.length; ++i)
			if (this._parsers[i].getPath() == path)
				return this._parsers[i];
		return null;
	},

	compile: function () {
		var errors = []; // new CompileError[]()
		// parse all files
		for (var i = 0; i < this._parsers.length; ++i) {
			if (! this.parseFile(errors, this._parsers[i])) {
				this._printErrors(errors);
				return false;
			}
		}
		switch (this._mode) {
		case Compiler.MODE_PARSE:
			return true;
		}
		// resolve imports
		this._resolveImports(errors);
		if (errors.length != 0) {
			this._printErrors(errors);
			return false;
		}
		// register backing class for primitives
		var builtins = this.findParser(this._platform.getRoot() + "/lib/built-in.jsx");
		BooleanType._classDef = builtins.lookup(errors, null, "Boolean");
		NumberType._classDef = builtins.lookup(errors, null, "Number");
		StringType._classDef = builtins.lookup(errors, null, "String");
		FunctionType._classDef = builtins.lookup(errors, null, "Function");
		if (errors.length != 0) {
			this._printErrors(errors);
			return false;
		}
		// template instantiation
		this._instantiateTemplates(errors);
		if (errors.length != 0) {
			this._printErrors(errors);
			return false;
		}
		// semantic analysis
		this._resolveTypes(errors);
		if (errors.length != 0) {
			this._printErrors(errors);
			return false;
		}
		this._analyze(errors);
		if (errors.length != 0) {
			this._printErrors(errors);
			return false;
		}
		// optimization
		this._optimize();
		// TODO peep-hole and dead store optimizations, etc.
		this._generateCode();
		return true;
	},

	getAST: function() {
		var classDefs = [];
		for (var i = 0; i < this._parsers.length; ++i) {
			classDefs = classDefs.concat(this._parsers[i].getClassDefs());
		}
		return ClassDefinition.serialize(classDefs);
	},

	getFileContent: function (errors, sourceToken, path) {
		if(this._fileCache[path] == null) {
			try {
				this._fileCache[path] = this._platform.load(path);
			} catch (e) {
				errors.push(new CompileError(sourceToken, "could not open file: " + path + ", " + e.toString()));
				this._fileCache[path] = null;
			}
		}
		return this._fileCache[path];
	},

	parseFile: function (errors, parser) {
		// read file
		var content = this.getFileContent(errors, parser.getSourceToken(), parser.getPath());
		if (content == null)
			return false;
		// parse
		parser.parse(content, errors);
		if (errors.length != 0)
			return false;
		// register imported files
		if (this._mode != Compiler.MODE_PARSE) {
			var imports = parser.getImports();
			for (var i = 0; i < imports.length; ++i) {
				if (! this._handleImport(errors, parser, imports[i]))
					return false;
			}
		}
		return true;
	},

	_handleImport: function (errors, parser, imprt) {
		if (imprt instanceof WildcardImport) {
			// read the files from a directory
			var resolvedDir = this._resolvePath(imprt.getFilenameToken().getFilename(), imprt.getDirectory());
			try {
				var files = this._platform.getFilesInDirectory(resolvedDir);
			} catch (e) {
				errors.push(new CompileError(imprt.getFilenameToken(), "could not read files in directory: " + resolvedDir + ", " + e.toString()));
				return false;
			}
			var found = false;
			for (var i = 0; i < files.length; ++i) {
				if (files[i].length >= imprt.getSuffix().length
					&& files[i].charAt(0) != "."
					&& files[i].substring(files[i].length - imprt.getSuffix().length) == imprt.getSuffix()) {
					var path = resolvedDir + "/" + files[i];
					if (path != parser.getPath()) {
						var parser = this.addSourceFile(imprt.getFilenameToken(), resolvedDir + "/" + files[i]);
						imprt.addSource(parser);
						found = true;
					}
				}
			}
			if (! found) {
				errors.push(new CompileError(imprt.getFilenameToken(), "no matching files found in directory: " + resolvedDir));
				return false;
			}
		} else {
			// read one file
			var path = this._resolvePath(imprt.getFilenameToken().getFilename(), Util.decodeStringLiteral(imprt.getFilenameToken().getValue()));
			if (path == parser.getPath()) {
				errors.push(new CompileError(imprt.getFilenameToken(), "cannot import itself"));
				return false;
			}
			var parser = this.addSourceFile(imprt.getFilenameToken(), path);
			imprt.addSource(parser);
		}
		return true;
	},

	forEachClassDef: function (f) {
		for (var i = 0; i < this._parsers.length; ++i) {
			var parser = this._parsers[i];
			var classDefs = parser.getClassDefs();
			for (var j = 0; j < classDefs.length; ++j) {
				if (! f(parser, classDefs[j]))
					return false;
			}
		}
		return true;
	},

	_resolveImports: function (errors) {
		for (var i = 0; i < this._parsers.length; ++i) {
			// built-in classes become implicit imports
			this._parsers[i].registerBuiltinImports(this._builtinParsers);
			// set source of every import
			var imports = this._parsers[i].getImports();
			for (var j = 0; j < imports.length; ++j) {
				imports[j].assertExistenceOfNamedClasses(errors);
			}
		}
	},

	_instantiateTemplates: function (errors) {
		for (var i = 0; i < this._parsers.length; ++i) {
			var templateInstantiationRequests = this._parsers[i].getTemplateInstantiationRequests();
			for (var j = 0; j < templateInstantiationRequests.length; ++j)
				this._instantiateTemplate(errors, this._parsers[i], templateInstantiationRequests[j], false);
		}
	},

	_instantiateTemplate: function (errors, parser, request, resolveImmmediately) {
		var concreteClassName = Type.templateTypeToString(request.getClassName(), request.getTypeArguments());
		// return immediately if instantiated already
		var classDefs = parser.lookup(errors, request.getToken(), concreteClassName);
		if (classDefs != null)
			return classDefs;
		// instantiate
		var templateClass = parser.lookupTemplate(errors, request.getToken(), request.getClassName());
		if (templateClass == null) {
			errors.push(new CompileError(request.getToken(), "could not find template class definition for '" + request.getClassName() + "'"));
			return null;
		}
		var classDef = templateClass.instantiate(errors, request);
		if (classDef == null)
			return null;
		// register
		parser.registerInstantiatedClass(classDef);
		// resolve immediately if requested to
		if (resolveImmmediately) {
			classDef.resolveTypes(
				new AnalysisContext(
					errors,
					parser,
					(function (errors, request) {
						return this._instantiateTemplate(errors, request, true);
					}).bind(this)));
		}
		// return
		return classDef;
	},

	_resolveTypes: function (errors) {
		this.forEachClassDef(function (parser, classDef) {
			classDef.resolveTypes(
				new AnalysisContext(
					errors,
					parser,
					(function (errors, request) {
						return this._instantiateTemplate(errors, parser, request, false);
					}).bind(this)));
			return true;
		}.bind(this));
	},

	_analyze: function (errors) {
		var createContext = function (parser) {
			return new AnalysisContext(
				errors,
				parser,
				function (errors, request) {
					return this._instantiateTemplate(errors, parser, request, true);
				}.bind(this));
		}.bind(this);
		// set analyzation context of every variable
		this.forEachClassDef(function (parser, classDef) {
			classDef.setAnalysisContextOfVariables(createContext(parser));
			return true;
		}.bind(this));
		// analyze every classdef
		this.forEachClassDef(function (parser, classDef) {
			classDef.analyze(createContext(parser));
			return true;
		}.bind(this));
		// analyze unused variables in every classdef
		this.forEachClassDef(function (parser, classDef) {
			classDef.analyzeUnusedVariables();
			return true;
		}.bind(this));
	},

	_optimize: function () {
		if (this._optimizer != null)
			this._optimizer.setCompiler(this).performOptimization();
	},

	_generateCode: function () {
		// build list of all classDefs
		var classDefs = [];
		for (var i = 0; i < this._parsers.length; ++i)
			classDefs = classDefs.concat(this._parsers[i].getClassDefs());
		// reorder the classDefs so that base classes would come before their children
		var getMaxIndexOfClasses = function (deps) {
			deps = deps.concat([]); // clone the array
			if (deps.length == 0)
				return -1;
			for (var i = 0; i < classDefs.length; ++i) {
				for (var j = 0; j < deps.length; ++j) {
					if (classDefs[i] == deps[j]) {
						deps.splice(j, 1);
						if (deps.length == 0)
							return i;
					}
				}
			}
			throw new Error("logic error, could not find class definition of '" + deps[0].className() + "'");
		};
		for (var i = 0; i < classDefs.length;) {
			var deps = classDefs[i].implementClassDefs().concat([]);
			if (classDefs[i].extendClassDef() != null)
				deps.unshift(classDefs[i].extendClassDef());
			var maxIndexOfClasses = getMaxIndexOfClasses(deps);
			if (maxIndexOfClasses > i) {
				classDefs.splice(maxIndexOfClasses + 1, 0, classDefs[i]);
				classDefs.splice(i, 1);
			} else {
				++i;
			}
		}
		// rename the classes with conflicting names
		for (var i = 0; i < classDefs.length; ++i) {
			if (classDefs[i].getOutputClassName() == null) {
				var className = classDefs[i].className();
				var suffix = 0;
				for (var j = i + 1; j < classDefs.length; ++j)
					if (classDefs[j].className() == className)
						classDefs[j].setOutputClassName(className + "$" + suffix++);
				classDefs[i].setOutputClassName(className);
			}
		}
		// emit
		this._emitter.emit(classDefs);
		this._output = this._emitter.getOutput();
	},

	_printErrors: function (errors) {
		for (var i = 0; i < errors.length; ++i) {
			this._platform.error(errors[i].format(this));
		}
	},

	_resolvePath: function (srcPath, givenPath) {
		if (givenPath.match(/^\.{1,2}\//) == null) {
			var searchPaths = this._searchPaths.concat(this._emitter.getSearchPaths());
			for (var i = 0; i < searchPaths.length; ++i) {
				var path = Util.resolvePath(searchPaths[i] + "/" + givenPath);
				// check the existence of the file, at the same time filling the cache
				if (this._platform.fileExists(path))
					return path;
			}
		}
		var lastSlashAt = srcPath.lastIndexOf("/");
		path = Util.resolvePath((lastSlashAt != -1 ? srcPath.substring(0, lastSlashAt + 1) : "") + givenPath);
		return path;
	},

});

// vim: set noexpandtab:

});require.register("dump.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

"use strict;"
/*
# NAME

dump - Dump data structures

# SYNOPSIS

var dump = require('path/to/dump');

dump.p(data);			   # outputs to console
foo.innerHTML = dump(data); # as string

*/

var dump;
try {
	dump = function() {
		var u = require('util');

		return function(data) {
			return u.inspect(data, false, 255);
		};
	}();
}
catch(e) {
	dump = function(data) {
		return JSON.stringify(data, null, 2);
	};
}

module.exports = dump;
dump.p = function(__va_args__) {
	Array.prototype.map.call(arguments, dump);
};


});require.register("emitter.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");

"use strict";

var Emitter = exports.Emitter = Class.extend({

	getSearchPaths: null, // abstract function getSearchPaths():string[]

	setOutputFile: null, // abstract function setOutputFile(:string) :void

	setEnableRunTimeTypeCheck: null, // abstract function setEnableRunTimeTypeCheck(: boolean) : void

	emit: null, // abstract function emitClassDefinition(:ClassDefinition[]):void

	getOutput: null // abstract function getOutput() : String
});

});require.register("expression.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./classdef"));
eval(Class.$import("./type"));
eval(Class.$import("./util"));
var Statement = require("./statement");

"use strict";

var Expression = exports.Expression = Class.extend({

	constructor: function (token) {
		this._token = token;
		this._optimizerStash = {};
	},

	clone: null,

	getToken: function () {
		return this._token;
	},

	analyze: null, // bool analyze(context, parentExpr)

	getType: null, // string getType()

	getHolderType: function () {
		return null;
	},

	forEachExpression: null, // function forEachExpression(cb : function (expr, replaceCb: function (expr) : void) : boolean

	assertIsAssignable: function (context, token, type) {
		context.errors.push(new CompileError(token, "left-hand-side expression is not assignable"));
		return false;
	},

	getOptimizerStash: function () {
		return this._optimizerStash;
	},

	_cloneOptimizerStashHack: function (src) {
		/*
			FIXME this is a very dirty hack that clones the optimizer stack.
			We should define copy constructors and use them once we migrate to self-hosted
		*/
		for (var k in src._optimizerStash)
			this._optimizerStash[k] = src._optimizerStash[k];
	},

	$assertIsAssignable: function (context, token, lhsType, rhsType) {
		if (! lhsType.isAssignable()) {
			context.errors.push(new CompileError("left-hand-side expression is not assignable"));
			return false;
		}
		if (! rhsType.isConvertibleTo(lhsType)) {
			context.errors.push(new CompileError(token, "cannot assign a value of type '" + rhsType.toString() + "' to '" + lhsType.toString() + "'"));
			return false;
		}
		return true;
	},

	$getDefaultValueExpressionOf: function (type) {
		var Parser = require("./parser");

		if (type.equals(Type.booleanType))
			return new BooleanLiteralExpression(new Parser.Token("false", false));
		else if (type.equals(Type.integerType))
			return new IntegerLiteralExpression(new Parser.Token("0", false));
		else if (type.equals(Type.numberType))
			return new NumberLiteralExpression(new Parser.Token("0", false));
		else if (type.equals(Type.stringType))
			return new StringLiteralExpression(new Parser.Token("\"\"", false));
		else if (type instanceof MayBeUndefinedType)
			return new UndefinedExpression(new Parser.Token("undefined", false));
		else
			return new NullExpression(new Parser.Token("null", false), type);
	}

});

var LeafExpression = exports.LeafExpression = Expression.extend({

	constructor: function (token) {
		Expression.prototype.constructor.call(this, token);
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var OperatorExpression = exports.OperatorExpression = Expression.extend({

	constructor: function (token) {
		Expression.prototype.constructor.call(this, token);
	},

	assertIsConvertibleTo: function (context, expr, type, mayUnbox) {
		var exprType = expr.getType().resolveIfMayBeUndefined();
		if (mayUnbox && type instanceof PrimitiveType && exprType instanceof ObjectType && exprType.getClassDef() == type.getClassDef())
			return true;
		if (! exprType.isConvertibleTo(type)) {
			context.errors.push(new CompileError(this._token, "cannot apply operator '" + this._token.getValue() + "' to type '" + exprType.toString() + "'"));
			return false;
		}
		return true;
	}

});

// primary expressions

var IdentifierExpression = exports.IdentifierExpression = LeafExpression.extend({

	constructor: function (arg1) {
		var Parser = require("./parser");
		if (arg1 instanceof Parser.Token) {
			LeafExpression.prototype.constructor.call(this, arg1);
			this._local = null;
		} else {
			// local var
			LeafExpression.prototype.constructor.call(this, arg1.getName());
			this._local = arg1;
		}
		this._classDefType = null;
	},

	clone: function () {
		var ret = new IdentifierExpression(this._token);
		ret._local = this._local;
		ret._classDefType = this._classDefType;
		return ret;
	},

	getLocal: function () {
		return this._local;
	},

	serialize: function () {
		if (this._local != null)
			return [
				"IdentifierExpression",
				this._token.serialize(),
				"local",
				Util.serializeNullable(this._local)
			];
		else
			return [
				"IdentifierExpression",
				this._token.serialize(),
				"classDef"
			];
	},

	analyze: function (context, parentExpr) {
		// if it is an access to local variable, return ok
		if (context.funcDef != null && (this._local = context.funcDef.getLocal(context, this._token.getValue())) != null) {
			// check that the variable is readable
			if ((parentExpr instanceof AssignmentExpression && parentExpr.getFirstExpr() == this)
				|| (parentExpr == null && context.statement instanceof Statement.ForInStatement && context.statement.getLHSExpr() == this)) {
				// is LHS
			} else {
				this._local.touchVariable(context, this._token, false);
				if (this._local.getType() == null)
					return false;
			}
			return true;
		}
		// access to class
		var classDef = context.parser.lookup(context.errors, this._token, this._token.getValue());
		if (classDef == null) {
			if (context.funcDef != null)
				context.errors.push(new CompileError(this._token, "local variable '" + this._token.getValue() + "' is not declared"));
			else
				context.errors.push(new CompileError(this._token, "could not find definition of class '" + this._token.getValue() + "'"));
			return false;
		}
		this._classDefType = new ClassDefType(classDef);
		return true;
	},

	getType: function () {
		if (this._local != null)
			return this._local.getType();
		else
			return this._classDefType;
	},

	assertIsAssignable: function (context, token, type) {
		if (this._local != null) {
			if (this._local.getType() == null) {
				if (type.equals(Type.undefinedType)) {
					context.errors.push(new CompileError(token, "cannot assign an undefined type to a value of undetermined type"));
					return false;
				}
				this._local.setType(type.asAssignableType());
			} else if (! type.isConvertibleTo(this._local.getType())) {
				context.errors.push(new CompileError(token, "cannot assign a value of type '" + type.toString() + "' to '" + this._local.getType() + "'"));
				return false;
			}
			this._local.touchVariable(context, this._token, true);
		} else {
			errors.push(new CompileError(token, "cannot modify a class definition"));
			return false;
		}
		return true;
	}

});

var UndefinedExpression = exports.UndefinedExpression = LeafExpression.extend({

	constructor: function (token) {
		LeafExpression.prototype.constructor.call(this, token);
	},

	clone: function () {
		return new UndefinedExpression(this._token);
	},

	serialize: function () {
		return [
			"UndefinedExpression",
			this._token.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return true;
	},

	getType: function () {
		return Type.undefinedType;
	}

});

var NullExpression = exports.NullExpression = LeafExpression.extend({

	constructor: function (token, type) {
		LeafExpression.prototype.constructor.call(this, token);
		this._type = type;
	},

	clone: function () {
		return new NullExpression(this._token, this._type);
	},

	serialize: function () {
		return [
			"NullExpression",
			this._token.serialize(),
			this._type.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return true;
	},

	getType: function () {
		return this._type;
	}

});

var BooleanLiteralExpression = exports.BooleanLiteralExpression = LeafExpression.extend({

	constructor: function (token) {
		LeafExpression.prototype.constructor.call(this, token);
	},

	clone: function () {
		return new BooleanLiteralExpression(this._token);
	},

	serialize: function () {
		return [
			"BooleanLiteralExpression",
			this._token.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return true;
	},

	getType: function () {
		return Type.booleanType;
	}

});

var IntegerLiteralExpression = exports.IntegerLiteralExpression = LeafExpression.extend({

	constructor: function (token) {
		LeafExpression.prototype.constructor.call(this, token);
	},

	clone: function () {
		return new IntegerLiteralExpression(this._token);
	},

	serialize: function () {
		return [
			"IntegerLiteralExpression",
			this._token.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return true;
	},

	getType: function () {
		return Type.integerType;
	}

});


var NumberLiteralExpression = exports.NumberLiteralExpression = LeafExpression.extend({

	constructor: function (token) {
		LeafExpression.prototype.constructor.call(this, token);
	},

	clone: function () {
		return new NumberLiteralExpression(this._token);
	},

	serialize: function () {
		return [
			"NumberLiteralExpression",
			this._token.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return true;
	},

	getType: function () {
		return Type.numberType;
	}

});

var StringLiteralExpression = exports.StringLiteralExpression = LeafExpression.extend({

	constructor: function (token) {
		LeafExpression.prototype.constructor.call(this, token);
	},

	clone: function () {
		return new StringLiteralExpression(this._token);
	},

	serialize: function () {
		return [
			"StringLiteralExpression",
			this._token.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return true;
	},

	getType: function () {
		return Type.stringType;
	}

});

var RegExpLiteralExpression = exports.RegExpLiteralExpression = LeafExpression.extend({

	constructor: function (token) {
		LeafExpression.prototype.constructor.call(this, token);
		this._type = null;
	},

	clone: function () {
		return new RegExpLiteralExpression(this._token);
	},

	serialize: function () {
		return [
			"RegExpLiteralExpression",
			this._token.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		var classDef = context.parser.lookup(context.errors, this._token, "RegExp");
		if (classDef == null)
			throw new Error("could not find definition for RegExp");
		this._type = new ObjectType(classDef);
		return true;
	},

	getType: function () {
		return this._type;
	}

});

var ArrayLiteralExpression = exports.ArrayLiteralExpression = Expression.extend({

	constructor: function (token, exprs, type) {
		Expression.prototype.constructor.call(this, token);
		this._exprs = exprs;
		this._type = type; // optional at this moment
	},

	clone: function () {
		return new ArrayLiteralExpression(this._token, Util.cloneArray(this._exprs), this._type);
	},

	getExprs: function () {
		return this._exprs;
	},

	getType: function () {
		return this._type;
	},

	serialize: function () {
		return [
			"ArrayLiteralExpression",
			this._token.serialize(),
			Util.serializeArray(this._exprs),
			Util.serializeNullable(this._type)
		];
	},

	analyze: function (context, parentExpr) {
		// analyze all elements
		var succeeded = true;
		for (var i = 0; i < this._exprs.length; ++i) {
			if (! this._exprs[i].analyze(context, this)) {
				succeeded = false;
			} else if (this._exprs[i].getType().equals(Type.voidType)) {
				 // FIXME the location of the error would be strange; we deseparately need expr.getToken()
				context.errors.push(new CompileError(this._token, "cannot assign void to an array"));
				suceeded = false;
			}
		}
		if (! succeeded)
			return false;
		// determine the type from the array members if the type was not specified
		if (this._type != null) {
			var classDef = this._type.getClassDef();
			if (! (classDef instanceof InstantiatedClassDefinition && classDef.getTemplateClassName() == "Array")) {
				context.errors.push(new CompileError(this._token, "specified type is not an array type"));
				return false;
			}
		} else {
			for (var i = 0; i < this._exprs.length; ++i) {
				var elementType = this._exprs[i].getType();
				if (! elementType.equals(Type.nullType)) {
					if (elementType.equals(Type.integerType))
						elementType = Type.numberType;
					var instantiatedClass = context.instantiateTemplate(context.errors, new TemplateInstantiationRequest(this._token, "Array", [ elementType ]));
					if (instantiatedClass == null)
						return false;
					this._type = new ObjectType(instantiatedClass);
					break;
				}
			}
			if (this._type == null) {
				context.errors.push(new CompileError(this._token, "could not deduce array type, please specify"));
				return false;
			}
		}
		// check type of the elements
		var expectedType = this._type.getClassDef().getTypeArguments()[0];
		for (var i = 0; i < this._exprs.length; ++i) {
			var elementType = this._exprs[i].getType();
			if (! elementType.isConvertibleTo(expectedType)) {
				context.errors.push(new CompileError(this._token, "cannot assign '" + elementType.toString() + "' to an array of '" + expectedType.toString() + "'"));
				succeeded = false;
			}
		}
		return succeeded;
	},

	forEachExpression: function (cb) {
		if (! Util.forEachExpression(cb, this._exprs))
			return false;
		return true;
	}

});

var MapLiteralElement = exports.MapLiteralElement = Class.extend({

	constructor: function (key, expr) {
		this._key = key;
		this._expr = expr;
	},

	getKey: function () {
		return this._key;
	},

	getExpr: function () {
		return this._expr;
	},

	setExpr: function (expr) {
		this._expr = expr;
	},

	serialize: function () {
		return [
			this._key.serialize(),
			this._expr.serialize()
		];
	}

});

var MapLiteralExpression = exports.MapLiteralExpression = Expression.extend({

	constructor: function (token, elements, type) {
		Expression.prototype.constructor.call(this, token);
		this._elements = elements;
		this._type = type; // optional at this moment
	},

	clone: function () {
		var ret = new MapLiteralExpression(this._token, [], this._type);
		for (var i = 0; i < this._elements.length; ++i)
			ret._elements[i] = new MapLiteralElement(this._elements[i].getKey(), this._elements[i].getExpr().clone());
		return ret;
	},

	getElements: function () {
		return this._elements;
	},

	getType: function () {
		return this._type;
	},

	serialize: function () {
		return [
			"MapLiteralExpression",
			this._token.serialize(),
			Util.serializeArray(this._elements),
			Util.serializeNullable(this._type)
		];
	},

	analyze: function (context, parentExpr) {
		// analyze all elements
		var succeeded = true;
		for (var i = 0; i < this._elements.length; ++i) {
			if (! this._elements[i].getExpr().analyze(context, this)) {
				succeeded = false;
			} else if (this._elements[i].getExpr().getType().equals(Type.voidType)) {
				 // FIXME the location of the error would be strange; we deseparately need expr.getToken()
				context.errors.push(new CompileError(this._token, "cannot assign void to a hash"));
				suceeded = false;
			}
		}
		if (! succeeded)
			return false;
		// determine the type from the array members if the type was not specified
		if (this._type != null) {
			var classDef = this._type.getClassDef();
			if (! (classDef instanceof InstantiatedClassDefinition && classDef.getTemplateClassName() == "Map")) {
				context.errors.push(new CompileError(this._token, "specified type is not a hash type"));
				return false;
			}
		} else {
			for (var i = 0; i < this._elements.length; ++i) {
				var elementType = this._elements[i].getExpr().getType();
				if (! elementType.equals(Type.nullType)) {
					if (elementType.equals(Type.integerType))
						elementType = Type.numberType;
					var instantiatedClass = context.instantiateTemplate(context.errors, new TemplateInstantiationRequest(this._token, "Map", [ elementType ]));
					if (instantiatedClass == null)
						return false;
					this._type = new ObjectType(instantiatedClass);
					break;
				}
			}
			if (this._type == null) {
				context.errors.push(new CompileError(this._token, "could not deduce hash type, please specify"));
				return false;
			}
		}
		// check type of the elements
		var expectedType = this._type.getClassDef().getTypeArguments()[0];
		for (var i = 0; i < this._elements.length; ++i) {
			var elementType = this._elements[i].getExpr().getType();
			if (! elementType.isConvertibleTo(expectedType)) {
				context.errors.push(new CompileError(this._token, "cannot assign '" + elementType.toString() + "' to a hash of '" + expectedType.toString() + "'"));
				succeeded = false;
			}
		}
		return succeeded;
	},

	forEachExpression: function (cb) {
		for (var i = 0; i < this._elements.length; ++i) {
			if (! cb(this._elements[i].getExpr(), function (expr) { this._elements[i].setExpr(expr); }.bind(this)))
				return false;
		}
		return true;
	}

});

var ThisExpression = exports.ThisExpression = Expression.extend({

	constructor: function (token, classDef) {
		Expression.prototype.constructor.call(this, token);
		this._classDef = classDef;
	},

	clone: function () {
		return new ThisExpression(this._token, this._classDef);
		return ret;
	},

	serialize: function () {
		return [
			"ThisExpression",
			this._token.serialize(),
			Util.serializeNullable(this._classDef)
		];
	},

	analyze: function (context, parentExpr) {
		var rootFuncDef = context.funcDef;
		while (rootFuncDef.getParent() != null)
			rootFuncDef = rootFuncDef.getParent();
		if ((rootFuncDef.flags() & ClassDefinition.IS_STATIC) != 0) {
			context.errors.push(new CompileError(this._token, "cannot use 'this' within a static function"));
			return false;
		}
		this._classDef = rootFuncDef.getClassDef();
		return true;
	},

	getType: function () {
		return new ObjectType(this._classDef);
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var FunctionExpression = exports.FunctionExpression = Expression.extend({

	constructor: function (token, funcDef) {
		Expression.prototype.constructor.call(this, token);
		this._funcDef = funcDef;
	},

	clone: function () {
		throw new Error("not yet implemented");
	},

	getFuncDef: function () {
		return this._funcDef;
	},

	serialize: function () {
		return [
			"FunctionExpression",
			this._funcDef.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		var ret = this._funcDef.analyze(context);
		return true; // return true since everything is resolved correctly even if analysis of the function definition failed
	},

	getType: function () {
		return new StaticFunctionType(this._funcDef.getReturnType(), this._funcDef.getArgumentTypes(), false);
	},

	forEachExpression: function (cb) {
		return true;
	}

});

// unary expressions

var UnaryExpression = exports.UnaryExpression = OperatorExpression.extend({

	constructor: function (operatorToken, expr) {
		OperatorExpression.prototype.constructor.call(this, operatorToken);
		this._expr = expr;
	},

	getExpr: function () {
		return this._expr;
	},

	serialize: function () {
		return [
			"UnaryExpression",
			this._token.serialize(),
			this._expr.serialize()
		];
	},

	_analyze: function (context) {
		if (! this._expr.analyze(context, this))
			return false;
		if (this._expr.getType().equals(Type.voidType)) {
			context.errors.push(new CompileError(this._token, "cannot apply operator '" + this._token.getValue() + "' against void"));
			return false;
		}
		return true;
	},

	forEachExpression: function (cb) {
		return cb(this._expr, function (expr) { this._expr = expr; }.bind(this));
	}

});

var BitwiseNotExpression = exports.BitwiseNotExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	clone: function () {
		return new BitwiseNotExpression(this._token, this._expr.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr, Type.numberType, false))
			return false;
		return true;
	},

	getType: function () {
		return Type.integerType;
	}

});

var InstanceofExpression = exports.InstanceofExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr, expectedType) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
		this._expectedType = expectedType;
	},

	clone: function () {
		return new InstanceofExpression(this._token, this._expr.clone(), this._expectedType);
	},

	getExpectedType: function () {
		return this._expectedType;
	},

	serialize: function () {
		return [
			"InstanceofExpression",
			this._expr.serialize(),
			this._expectedType.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! (this._expr.getType() instanceof ObjectType)) {
			context.errors.push(new CompileError(this._token, "operator 'instanceof' is only applicable to an object"));
			return false;
		}
		return true;
	},

	getType: function () {
		return Type.booleanType;
	}

});

var AsExpression = exports.AsExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr, type) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
		this._type = type;
	},

	clone: function () {
		return new AsExpression(this._token, this._expr.clone(), this._type);
	},

	serialize: function () {
		return [
			"AsExpression",
			this._expr.serialize(),
			this._type.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (this._type instanceof MayBeUndefinedType) {
			context.errors.push(new CompileError(this._token, "right operand of 'as' expression cannot be a MayBeUndefined<T> type"));
			return false;
		}
		// nothing to care if the conversion is allowed by implicit conversion
		if (this._expr.getType().isConvertibleTo(this._type))
			return true;
		// possibly unsafe conversions
		var exprType = this._expr.getType().resolveIfMayBeUndefined();
		var success = false;
		if (exprType.equals(Type.undefinedType)) {
			if (this._type instanceof MayBeUndefinedType || this._type.equals(Type.variantType)) {
				// ok
				success = true;
			}
		} else if (exprType.equals(Type.nullType)) {
			if (this._type instanceof ObjectType || this._type instanceof FunctionType) {
				// ok
				success = true;
			}
		} else if (exprType instanceof PrimitiveType) {
			if (this._type instanceof PrimitiveType) {
				// ok: primitive => primitive
				success = true;
			}
		} else if (exprType.equals(Type.variantType)) {
			// ok, variant is convertible to all types of objects
			success = true;
		} else if (exprType instanceof ObjectType) {
			// FIXME? conversion from objects to primitives should be done by calling toString(), valueOf(), etc. (optimized by emitter)
			if (this._type instanceof ObjectType && this._type.isConvertibleTo(exprType)) {
				// is down-cast, maybe unsafe
				success = true;
			}
		} else if (exprType instanceof FunctionType && this._type instanceof StaticFunctionType) {
			var deducedType = this._expr.deduceByArgumentTypes(context, this._token, this._type.getArgumentTypes(), true);
			if (deducedType != null) {
				exprType = deducedType;
				if (deducedType.getReturnType().equals(this._type.getReturnType())) {
					success = true;
				}
			}
		}
		if (! success) {
			context.errors.push(new CompileError(this._token, "cannot convert a value of type '" + exprType.toString() + "' to '" + this._type.toString() + "'"));
			return false;
		}
		return true;
	},

	getType: function () {
		return this._type;
	}

});

var AsNoConvertExpression = exports.AsNoConvertExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr, type) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
		this._type = type;
	},

	clone: function () {
		return new AsNoConvertExpression(this._token, this._expr.clone(), this._type);
	},

	serialize: function () {
		return [
			"AsNoConvertExpression",
			this._expr.serialize(),
			this._type.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		var srcType = this._expr.getType();
		if ((srcType.equals(Type.undefinedType) && ! (this._type.equals(Type.variantType) || this._type instanceof MayBeUndefinedType))
			|| (srcType.equals(Type.nullType) && ! (this._type instanceof ObjectType || this._type instanceof FunctionType))) {
			context.errors.push(new CompileError(this._token, "'" + srcType.toString() + "' cannot be treated as a value of type '" + this._type.toString() + "'"));
			return false;
		}
		return true;
	},

	getType: function () {
		return this._type;
	}

});

var LogicalNotExpression = exports.LogicalNotExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	clone: function () {
		return new LogicalNotExpression(this._token, this._expr.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr, Type.booleanType, false))
			return false;
		return true;
	},

	getType: function () {
		return Type.booleanType;
	}

});

var IncrementExpression = exports.IncrementExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	serialize: function () {
		return [
			this._getClassName(),
			this._token.serialize(),
			this._expr.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		var exprType = this._expr.getType();
		if (exprType.resolveIfMayBeUndefined().equals(Type.integerType) || exprType.resolveIfMayBeUndefined().equals(Type.numberType)) {
			// ok
		} else {
			context.errors.push(new CompileError(this._token, "cannot apply operator '" + this._token.getValue() + "' to a non-number"));
			return false;
		}
		if (! this._expr.assertIsAssignable(context, this._token, exprType))
			return false;
		return true;
	},

	getType: function () {
		return this._expr.getType().resolveIfMayBeUndefined();
	}

});

var PostIncrementExpression = exports.PostIncrementExpression = IncrementExpression.extend({

	constructor: function (operatorToken, expr) {
		IncrementExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	clone: function () {
		return new PostIncrementExpression(this._token, this._expr.clone());
	},

	_getClassName: function() {
		return "PostIncrementExpression";
	}

});

var PreIncrementExpression = exports.PreIncrementExpression = IncrementExpression.extend({

	constructor: function (operatorToken, expr) {
		IncrementExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	clone: function () {
		return new PreIncrementExpression(this._token, this._expr.clone());
	},

	_getClassName: function() {
		return "PreIncrementExpression";
	}

});

var PropertyExpression = exports.PropertyExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr1, identifierToken, type) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr1);
		this._identifierToken = identifierToken;
		// fourth parameter is optional
		this._type = type !== undefined ? type : null;
	},

	clone: function () {
		return new PropertyExpression(this._token, this._expr.clone(), this._identifierToken, this._type);
	},

	getIdentifierToken: function () {
		return this._identifierToken;
	},

	serialize: function () {
		return [
			"PropertyExpression",
			this._expr.serialize(),
			this._identifierToken.serialize(),
			Util.serializeNullable(this._type)
		];
	},

	analyze: function (context, parentExpr) {
		// special handling for import ... as
		var imprt;
		if (this._expr instanceof IdentifierExpression
			&& (imprt = context.parser.lookupImportAlias(this._expr.getToken().getValue())) != null) {
			var classDefs = imprt.getClasses(this._identifierToken.getValue());
			switch (classDefs.length) {
			case 1:
				// ok
				break;
			case 0:
				context.errors.push(new CompileError(this._identifierToken, "could not resolve class '" + this._expr.getToken().getValue() + "'"));
				return null;
			default:
				context.errors.push(new CompileError(this._identifierToken, "multiple candidates"));
				return null;
			}
			this._type = new ClassDefType(classDefs[0]);
			return true;
		}
		// normal handling
		if (! this._analyze(context))
			return false;
		var exprType = this._expr.getType();
		if (exprType.equals(Type.voidType)) {
			context.errors.push(new CompileError(this._identifierToken, "cannot obtain a member of void"));
			return false;
		}
		if (exprType.equals(Type.nullType)) {
			context.errors.push(new CompileError(this._identifierToken, "cannot obtain a member of null"));
			return false;
		}
		if (exprType.resolveIfMayBeUndefined().equals(Type.variantType)) {
			context.errors.push(new CompileError(this._identifierToken, "cannot obtain a member of variant, use: (<<expr>> as Map.<type>)[<<name>>]"));
			return false;
		}
		var classDef = exprType.getClassDef();
		if (classDef == null) {
			context.errors.push(new CompileError(this._identifierToken, "cannot determine type due to preceding errors"));
			return false;
		}
		this._type = classDef.getMemberTypeByName(
			this._identifierToken.getValue(),
			exprType instanceof ClassDefType,
			(exprType instanceof ClassDefType) ? ClassDefinition.GET_MEMBER_MODE_CLASS_ONLY : ClassDefinition.GET_MEMBER_MODE_ALL);
		if (this._type == null) {
			context.errors.push(new CompileError(this._identifierToken, "'" + exprType.toString() + "' does not have a property named '" + this._identifierToken.getValue() + "'"));
			return false;
		}
		return true;
	},

	getType: function () {
		return this._type;
	},

	getHolderType: function () {
		if (this._type instanceof ClassDefType)
			return null;
		var type = this._expr.getType();
		if (type instanceof PrimitiveType)
			type = new ObjectType(type.getClassDef());
		return type;
	},

	assertIsAssignable: function (context, token, type) {
		if (! Expression.assertIsAssignable(context, token, this._type, type))
			return false;
		// check constness (note: a possibly assignable property is always a member variable)
		var holderType = this.getHolderType();
		var varFlags = 0;
		if (holderType.getClassDef().forEachClassToBase(function (classDef) {
			return classDef.forEachMemberVariable(function (varDef) {
				if (varDef.name() == this._identifierToken.getValue()) {
					// found
					varFlags = varDef.flags();
					return false;
				}
				return true;
			}.bind(this));
		}.bind(this))) {
			throw new Error("logic flaw, could not find definition for " + holderType.getClassDef().className() + "#" + this._identifierToken.getValue());
		}
		if ((varFlags & ClassDefinition.IS_CONST) != 0) {
			context.errors.push(new CompileError(token, "cannot modify a constant"));
			return false;
		} else if ((varFlags & ClassDefinition.IS_READONLY) != 0) {
			context.errors.push(new CompileError(token, "cannot modify a readonly variable"));
			return false;
		}
		return true;
	},

	deduceByArgumentTypes: function (context, operatorToken, argTypes, isStatic) {
		for (var i = 0; i < argTypes.length; ++i) {
			if (argTypes[i] instanceof FunctionChoiceType) {
				context.errors.push(new CompileError(operatorToken, "type deduction of overloaded function passed in as an argument is not supported; use 'as' to specify the function"));
				return null;
			}
		}
		var rhsType = this._type.deduceByArgumentTypes(context, operatorToken, argTypes, isStatic);
		if (rhsType == null)
			return null;
		this._type = rhsType;
		return rhsType;
	}

});

var TypeofExpression = exports.TypeofExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	clone: function () {
		return new TypeofExpression(this._token, this._expr.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this._expr.getType().equals(Type.variantType)) {
			context.errors.push(new CompileError(this._token, "cannot apply operator 'typeof' to '" + this._expr.getType().toString() + "'"));
			return false;
		}
		return true;
	},

	getType: function () {
		return Type.stringType;
	}

});

var SignExpression = exports.SignExpression = UnaryExpression.extend({

	constructor: function (operatorToken, expr) {
		UnaryExpression.prototype.constructor.call(this, operatorToken, expr);
	},

	clone: function () {
		return new SignExpression(this._token, this._expr.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr, Type.numberType, true))
			return false;
		return true;
	},

	getType: function () {
		var type = this._expr.getType();
		if (type.resolveIfMayBeUndefined().equals(Type.numberType))
			return Type.numberType;
		else
			return Type.integerType;
	}

});

// binary expressions

var BinaryExpression = exports.BinaryExpression = OperatorExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		OperatorExpression.prototype.constructor.call(this, operatorToken);
		this._expr1 = expr1;
		this._expr2 = expr2;
	},

	getFirstExpr: function() {
		return this._expr1;
	},

	getSecondExpr: function() {
		return this._expr2;
	},


	serialize: function () {
		return [
			"BinaryExpression",
			this._token.serialize(),
			this._expr1.serialize(),
			this._expr2.serialize()/*,
			Util.serializeNullable(this.getType())*/
		];
	},

	_analyze: function (context) {
		if (! this._expr1.analyze(context, this))
			return false;
		if (! this._expr2.analyze(context, this))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr1, function (expr) { this._expr1 = expr; }.bind(this)))
			return false;
		if (! cb(this._expr2, function (expr) { this._expr2 = expr; }.bind(this)))
			return false;
		return true;
	}

});

var AdditiveExpression = exports.AdditiveExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
		this._type = null;
	},

	clone: function () {
		var ret = new AdditiveExpression(this._token, this._expr1.clone(), this._expr2.clone());
		ret._type = this._type;
		return ret;
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		var expr1Type = this._expr1.getType().resolveIfMayBeUndefined();
		var expr2Type = this._expr2.getType().resolveIfMayBeUndefined();
		if ((expr1Type.isConvertibleTo(Type.numberType) || (expr1Type instanceof ObjectType && expr1Type.getClassDef() == Type.numberType.getClassDef()))
			&& (expr2Type.isConvertibleTo(Type.numberType) || (expr2Type instanceof ObjectType && expr2Type.getClassDef() == Type.numberType.getClassDef()))) {
			// ok
			this._type = (expr1Type instanceof NumberType) || (expr2Type instanceof NumberType)
				? Type.numberType : Type.integerType;
		} else if ((expr1Type.equals(Type.stringType) || (expr1Type instanceof ObjectType && expr1Type.getClassDef() == Type.stringType.getClassDef()))
			&& (expr2Type.equals(Type.stringType) || (expr2Type instanceof ObjectType && expr2Type.getClassDef() == Type.stringType.getClassDef()))) {
			// ok
			this._type = expr1Type;
		} else {
			context.errors.push(new CompileError(this._token, "cannot apply operator '+' to '" + expr1Type.toString() + "' and '" + expr2Type.toString() + "'"));
			return false;
		}
		return true;
	},

	getType: function () {
		return this._type;
	}
});

var ArrayExpression = exports.ArrayExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
		this._type = null;
	},

	clone: function () {
		var ret = new ArrayExpression(this._token, this._expr1.clone(), this._expr2.clone());
		ret._type = this._type;
		return ret;
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (this._expr1.getType() == null) {
			context.errors.push(new CompileError(this._token, "cannot determine type due to preceding errors"));
			return false;
		}
		// obtain classDef
		var expr1Type = this._expr1.getType().resolveIfMayBeUndefined();
		if (! (expr1Type instanceof ObjectType)) {
			context.errors.push(new CompileError(this._token, "cannot apply operator[] against a non-object"));
			return false;
		}
		var expr1ClassDef = expr1Type.getClassDef();;
		// obtain type of operator []
		var accessorType = expr1ClassDef.getMemberTypeByName("__native_index_operator__", false, ClassDefinition.GET_MEMBER_MODE_ALL);
		if (accessorType == null) {
			context.errors.push(new CompileError(this._token, "cannot apply operator[] on an instance of class '" + expr1ClassDef.className() + "'"));
			return false;
		}
		if (accessorType instanceof FunctionChoiceType) {
			context.errors.push(new CompileError(this._token, "override of '__native_index_operator__' is not supported"));
			return false;
		}
		if (accessorType.getArgumentTypes().length != 1) {
			context.errors.push(new CompileError(this._token, "unexpected number of arguments taken by '__native_index_operator__'"));
			return false;
		}
		// check type of expr2
		if (! this._expr2.getType().isConvertibleTo(accessorType.getArgumentTypes()[0])) {
			context.errors.push(new CompileError(this._token, "index type is incompatible (expected '" + accessorType.getArgumentTypes()[0].toString() + "', got '" + this._expr2.getType().toString() + "'"));
			return false;
		}
		// set type of the expression
		this._type = accessorType.getReturnType();
		return true;
	},

	getType: function () {
		return this._type;
	},

	assertIsAssignable: function (context, token, type) {
		return Expression.assertIsAssignable(context, token, this._type, type);
	}

});

var AssignmentExpression = exports.AssignmentExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
	},

	clone: function () {
		return new AssignmentExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	analyze: function (context, parentExpr) {
		// special handling for v = function () ...
		if (this._expr2 instanceof FunctionExpression)
			return this._analyzeFunctionExpressionAssignment(context, parentExpr);
		// normal handling
		if (! this._analyze(context))
			return false;
		var rhsType = this._expr2.getType();
		if (rhsType == null)
			return false;
		if (rhsType.equals(Type.voidType)) {
			context.errors.push(new CompileError(this._token, "cannot assign void"));
			return false;
		}
		if (rhsType instanceof ClassDefType) {
			context.errors.push(new CompileError(this._token, "cannot assign a class"));
			return false;
		}
		if (rhsType.resolveIfMayBeUndefined().equals(Type.nullType) && this._expr1.getType() == null) {
			context.errors.push(new CompileError(this._token, "cannot assign null to an unknown type"));
			return false;
		}
		if (rhsType instanceof FunctionChoiceType) {
			var lhsType = this._expr1.getType();
			if (lhsType != null) {
				if (! (lhsType instanceof ResolvedFunctionType)) {
					context.errors.push(new CompileError(this._token, "cannot assign a function reference to '" + this._expr1.getType().toString() + "'"));
					return false;
				}
				if ((rhsType = this._expr2.deduceByArgumentTypes(context, this._token, lhsType.getArgumentTypes(), lhsType instanceof StaticFunctionType)) == null)
					return false;
			} else {
				context.errors.push(new CompileError(this._token, "function reference is ambiguous"));
				return false;
			}
		}
		// assert that rhs type is not a member function, after resolving the function
		if (rhsType instanceof MemberFunctionType) {
			context.errors.push(new CompileError(this._token, "cannot assign a member function"));
			return false;
		}
		if (! this._expr1.assertIsAssignable(context, this._token, rhsType))
			return false;
		return true;
	},

	_analyzeFunctionExpressionAssignment: function (context, parentExpr) {
		// analyze from left to right to avoid "variable may not be defined" error in case the function calls itself
		if (! this._expr1.analyze(context, this))
			return false;
		if (! this._expr1.assertIsAssignable(context, this._token, this._expr2.getType()))
			return false;
		if (! this._expr2.analyze(context, this))
			return false;
		return true;
	},

	getType: function () {
		return this._expr1.getType();
	}

});

// + - * / % < <= > >= & | ^
var BinaryNumberExpression = exports.BinaryNumberExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
	},

	clone: function () {
		return new BinaryNumberExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		var expr1Type = this._expr1.getType().resolveIfMayBeUndefined();
		if (! this.assertIsConvertibleTo(context, this._expr1, Type.numberType, true))
			return false;
		var expr2Type = this._expr2.getType().resolveIfMayBeUndefined();
		if (! this.assertIsConvertibleTo(context, this._expr2, Type.numberType, true))
			return false;
		return true;
	},

	getType: function () {
		switch (this._token.getValue()) {
		case "+":
		case "-":
		case "*":
			if (this._expr1.getType().resolveIfMayBeUndefined().equals(Type.numberType) || this._expr2.getType().resolveIfMayBeUndefined().equals(Type.numberType))
				return Type.numberType;
			else
				return Type.integerType;
			break;
		case "/":
		case "%":
			return Type.numberType;
		case "<":
		case "<=":
		case ">":
		case ">=":
			return Type.booleanType;
		case "&":
		case "|":
		case "^":
			return Type.integerType;
		default:
			throw new Error("unexpected operator:" + this._token.getValue());
		}
	}

});

var EqualityExpression = exports.EqualityExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
	},

	clone: function () {
		return new EqualityExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		var expr1Type = this._expr1.getType();
		var expr2Type = this._expr2.getType();
		if (expr1Type.resolveIfMayBeUndefined().equals(expr2Type.resolveIfMayBeUndefined())) {
			// ok
		} else if (expr1Type.isConvertibleTo(expr2Type) || expr2Type.isConvertibleTo(expr1Type)) {
			// ok
		} else if ((expr1Type instanceof ObjectType) + (expr2Type instanceof ObjectType) == 1
			&& expr1Type.getClassDef() == expr2Type.getClassDef()) {
			// ok, either side is an object and the other is the primitive counterpart
		} else {
			context.errors.push(new CompileError(this._token, "either side of operator == should be convertible from the other"));
			return false;
		}
		return true;
	},

	getType: function () {
		return Type.booleanType;
	}

});

var InExpression = exports.InExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
	},

	clone: function () {
		return new InExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this._expr1.getType().resolveIfMayBeUndefined().equals(Type.stringType)) {
			context.errors.push(new CompileError(this._token, "left operand of 'in' expression should be a string"));
			return false;
		}
		var expr2Type;
		var expr2ClassDef;
		if ((expr2Type = this._expr2.getType().resolveIfMayBeUndefined()) instanceof ObjectType
			&& (expr2ClassDef = expr2Type.getClassDef()) instanceof InstantiatedClassDefinition
			&& expr2ClassDef.getTemplateClassName() == "Map") {
			// ok
		} else {
			context.errors.push(new CompileError(this._token, "right operand of 'in' expression should be a map"));
			return false;
		}
		return true;
	},

	getType: function () {
		return Type.booleanType;
	}

});

var LogicalExpression = exports.LogicalExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
	},

	clone: function () {
		return new LogicalExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr1, Type.booleanType, false))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr2, Type.booleanType, false))
			return false;
		return true;
	},

	getType: function () {
		return Type.booleanType;
	}

});

var ShiftExpression = exports.ShiftExpression = BinaryExpression.extend({

	constructor: function (operatorToken, expr1, expr2) {
		BinaryExpression.prototype.constructor.call(this, operatorToken, expr1, expr2);
	},

	clone: function () {
		return new ShiftExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	analyze: function (context, parentExpr) {
		if (! this._analyze(context))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr1, Type.integerType, true))
			return false;
		if (! this.assertIsConvertibleTo(context, this._expr2, Type.integerType, true))
			return false;
		return true;
	},

	getType: function () {
		return Type.integerType;
	}

});

// (the only) tertary expression

var ConditionalExpression = exports.ConditionalExpression = OperatorExpression.extend({

	constructor: function (operatorToken, condExpr, ifTrueExpr, ifFalseExpr) {
		OperatorExpression.prototype.constructor.call(this, operatorToken);
		this._condExpr = condExpr;
		this._ifTrueExpr = ifTrueExpr;
		this._ifFalseExpr = ifFalseExpr;
		this._type = null;
		if (this._ifFalseExpr == null)
			throw new Error("eee");
	},

	clone: function () {
		var ret = new ConditionalExpression(this._token, this._condExpr.clone(), this._ifTrueExpr != null ? this._ifTrueExpr.clone() : null, this._ifFalseExpr.clone());
		ret._type = this._type;
		return ret;
	},

	getCondExpr: function () {
		return this._condExpr;
	},

	getIfTrueExpr: function () {
		return this._ifTrueExpr;
	},

	getIfFalseExpr: function () {
		return this._ifFalseExpr;
	},

	serialize: function () {
		return [
			"ConditionalExpression",
			this._token.serialize(),
			this._condExpr.serialize(),
			Util.serializeNullable(this._ifTrueExpr),
			this._ifFalseExpr.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		// analyze the three expressions
		if (! this._condExpr.analyze(context, this))
			return false;
		if (this._ifTrueExpr != null && ! this._ifTrueExpr.analyze(context, this))
			return false;
		if (! this._ifFalseExpr.analyze(context, this))
			return false;
		// check the types
		if (this._ifTrueExpr != null) {
			if (! this._condExpr.getType().isConvertibleTo(Type.booleanType)) {
				context.errors.push(new CompileError(this._token, "condition should be convertible to bool"));
				return false;
			}
			var typeIfTrue = this._ifTrueExpr.getType();
		} else {
			typeIfTrue = this._condExpr.getType();
			if (typeIfTrue.equals(Type.voidType)) {
				context.errors.push(new CompileError(this._token, "condition cannot be void"));
				return false;
			}
		}
		var typeIfFalse = this._ifFalseExpr.getType();
		if (typeIfTrue.equals(typeIfFalse)) {
			// ok
			this._type = typeIfTrue;
		} else if (
			(typeIfTrue instanceof MayBeUndefinedType) == (typeIfFalse instanceof MayBeUndefinedType)
			&& Type.isIntegerOrNumber(typeIfTrue.resolveIfMayBeUndefined())
			&& Type.isIntegerOrNumber(typeIfFalse.resolveIfMayBeUndefined())) {
			// special case to handle number == integer
			this._type = typeIfTrue instanceof MayBeUndefinedType ? new MayBeUndefinedType(Type.numberType) : Type.numberType;
		} else if (this._ifTrueExpr == null
			&& (typeIfTrue.resolveIfMayBeUndefined().equals(typeIfFalse)
				|| (Type.isIntegerOrNumber(typeIfTrue.resolveIfMayBeUndefined()) && Type.isIntegerOrNumber(typeIfFalse)))) {
			// on ?: expr (wo. true expr), left hand can be maybeundefined.<right>
			this._type = typeIfFalse;
		} else {
			context.errors.push(new CompileError(this._token, "returned types should be the same for operator ?: but got '" + typeIfTrue.toString() + "' and '" + typeIfFalse.toString() + "'"));
			return false;
		}
		return true;
	},

	getType: function () {
		return this._type;
	},

	forEachExpression: function (cb) {
		if (! cb(this._condExpr, function (expr) { this._condExpr = expr; }.bind(this)))
			return false;
		if (this._ifTrueExpr != null && ! cb(this._ifTrueExpr, function (expr) { this._ifTrueExpr = expr; }.bind(this)))
			return false;
		if (! cb(this._ifFalseExpr, function (expr) { this._ifFalseExpr = expr; }.bind(this)))
			return false;
		return true;
	}

});

// invocation expressions

var CallExpression = exports.CallExpression = OperatorExpression.extend({

	constructor: function (operatorToken, expr, args) {
		OperatorExpression.prototype.constructor.call(this, operatorToken);
		this._expr = expr;
		this._args = args;
	},

	clone: function () {
		var ret = new CallExpression(this._token, this._expr.clone(), Util.cloneArray(this._args));
		ret._cloneOptimizerStashHack(this);
		return ret;
	},

	getExpr: function () {
		return this._expr;
	},

	getArguments: function () {
		return this._args;
	},

	serialize: function () {
		return [
			"CallExpression",
			this._token.serialize(),
			this._expr.serialize(),
			Util.serializeArray(this._args)
		];
	},

	analyze: function (context, parentExpr) {
		if (! this._expr.analyze(context, this))
			return false;
		var argTypes = Util.analyzeArgs(context, this._args, this);
		if (argTypes == null)
			return false;
		var exprType = this._expr.getType().resolveIfMayBeUndefined();
		if (! (exprType instanceof FunctionType)) {
			context.errors.push(new CompileError(this._token, "cannot call a non-function"));
			return false;
		}
		if (this._expr instanceof PropertyExpression
			&& ! exprType.isAssignable()
			&& this._expr.deduceByArgumentTypes(context, this._token, argTypes, (this._expr.getHolderType() instanceof ClassDefType)) == null)
			return false;
		return true;
	},

	getType: function () {
		return this._expr.getType().getReturnType();
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		if (! Util.forEachExpression(cb, this._args))
			return false;
		return true;
	}

});

var SuperExpression = exports.SuperExpression = OperatorExpression.extend({

	constructor: function (operatorToken, name, args) {
		OperatorExpression.prototype.constructor.call(this, operatorToken);
		this._name = name;
		this._args = args;
		this._funcType = null;
	},

	clone: function () {
		var ret = new SuperExpression(this._token, this._name, Util.cloneArray(this._args));
		ret._funcType = this._funcType;
		ret._cloneOptimizerStashHack(this);
		return ret;
	},

	getName: function () {
		return this._name;
	},

	getArguments: function () {
		return this._args;
	},

	getFunctionType: function () {
		return this._funcType;
	},
		
	serialize: function () {
		return [
			"SuperExpression",
			this._token.serialize(),
			this._name.serialize(),
			Util.serializeArray(this._args),
			Util.serializeNullable(this._classDef),
		];
	},

	analyze: function (context, parentExpr) {
		// obtain class definition
		if ((context.funcDef.flags() & ClassDefinition.IS_STATIC) != 0) {
			context.errors.push(new CompileError(this._token, "cannot use 'super' keyword in a static function"));
			return false;
		}
		var classDef = context.funcDef.getClassDef();
		// analyze args
		var argTypes = Util.analyzeArgs(context, this._args, this);
		if (argTypes == null)
			return false;
		// lookup function
		var funcType = null;
		if ((funcType = classDef.getMemberTypeByName(this._name.getValue(), false, ClassDefinition.GET_MEMBER_MODE_SUPER)) == null) {
			context.errors.push(new CompileError(this._token, "could not find a member function with given name in super classes of class '" + classDef.className() + "'"));
			return false;
		}
		if ((funcType = funcType.deduceByArgumentTypes(context, this._token, argTypes, false)) == null)
			return false;
		// success
		this._funcType = funcType;
		return true;
	},

	getType: function () {
		return this._funcType.getReturnType();
	},

	forEachExpression: function (cb) {
		if (! Util.forEachExpression(cb, this._args))
			return false;
		return true;
	}

});

var NewExpression = exports.NewExpression = OperatorExpression.extend({

	constructor: function (operatorToken, type, args) {
		OperatorExpression.prototype.constructor.call(this, operatorToken);
		this._type = type;
		this._args = args;
		this._constructor = null;
	},

	clone: function () {
		var ret = new NewExpression(this._token, this._type, Util.cloneArray(this._args));
		ret._constructor = this._constructor;
		return ret;
	},

	getQualifiedName: function () {
		throw new Error("will be removed");
	},

	getArguments: function () {
		return this._args;
	},

	serialize: function () {
		return [
			"NewExpression",
			this._token.serialize(),
			this._type.serialize(),
			Util.serializeArray(this._args)
		];
	},

	analyze: function (context, parentExpr) {
		var classDef = this._type.getClassDef();
		if (classDef == null)
			return false;
		if ((classDef.flags() & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) != 0) {
			context.errors.push(new CompileError(this._token, "cannot instantiate an interface or a mixin"));
			return false;
		}
		if ((classDef.flags() & ClassDefinition.IS_ABSTRACT) != 0) {
			context.errors.push(new CompileError(this._token, "cannot instantiate an abstract class"));
			return false;
		}
		var argTypes = Util.analyzeArgs(context, this._args);
		if (argTypes == null)
			return false;
		var ctors = classDef.getMemberTypeByName("constructor", false, ClassDefinition.GET_MEMBER_MODE_CLASS_ONLY);
		if ((this._constructor = ctors.deduceByArgumentTypes(context, this._token, argTypes, false)) == null) {
			context.errors.push(new CompileError(this._token, "cannot create an object of type '" + this._type.toString() + "', arguments mismatch"));
			return false;
		}
		return true;
	},

	getType: function () {
		return this._type;
	},

	getConstructor: function () {
		return this._constructor;
	},

	forEachExpression: function (cb) {
		if (! Util.forEachExpression(cb, this._args))
			return false;
		return true;
	}

});

// comma expression is not treated as a binary expression (why? it should be)

var CommaExpression = exports.CommaExpression = Expression.extend({

	constructor: function (token, expr1, expr2) {
		Expression.prototype.constructor.call(this, token);
		this._expr1 = expr1;
		this._expr2 = expr2;
	},

	clone: function () {
		return new CommaExpression(this._token, this._expr1.clone(), this._expr2.clone());
	},

	getFirstExpr: function () {
		return this._expr1;
	},

	getSecondExpr: function () {
		return this._expr2;
	},

	serialize: function () {
		return [
			"CommaExpression",
			this._expr1.serialize(),
			this._expr2.serialize()
		];
	},

	analyze: function (context, parentExpr) {
		return this._expr1.analyze(context, this)
			&& this._expr2.analyze(context, this);
	},

	getType: function () {
		return this._expr2.getType();
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr1, function (expr) { this._expr1 = expr; }.bind(this)))
			return false;
		if (! cb(this._expr2, function (expr) { this._expr2 = expr; }.bind(this)))
			return false;
		return true;
	}

});
// vim: set noexpandtab:

});require.register("jsemitter.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./classdef"));
eval(Class.$import("./type"));
eval(Class.$import("./expression"));
eval(Class.$import("./statement"));
eval(Class.$import("./emitter"));
eval(Class.$import("./jssourcemap"));
eval(Class.$import("./util"));

"use strict";

var _Util = exports._Util = Class.extend({

	$toClosureType: function (type) {
		if (type.equals(Type.booleanType)) {
			return "!boolean";
		} else if (type.equals(Type.integerType) || type.equals(Type.numberType)) {
			return "!number";
		} else if (type.equals(Type.stringType)) {
			return "!string";
		} else if (type instanceof MayBeUndefinedType) {
			return "undefined|" + this.toClosureType(type.getBaseType());
		} else if (type instanceof ObjectType) {
			var classDef = type.getClassDef();
			if (classDef instanceof InstantiatedClassDefinition && classDef.getTemplateClassName() == "Array") {
				return "Array.<undefined|" + this.toClosureType(classDef.getTypeArguments()[0]) + ">";
			} else if (classDef instanceof InstantiatedClassDefinition && classDef.getTemplateClassName() == "Map") {
				return "Object.<string, undefined|" + this.toClosureType(classDef.getTypeArguments()[0]) + ">";
			} else {
				return classDef.getOutputClassName();
			}
		} else if (type instanceof VariantType) {
			return "*";
		}
		return null;
	},

	$getInstanceofNameFromClassDef: function (classDef) {
		if (classDef instanceof InstantiatedClassDefinition) {
			var name = classDef.getTemplateClassName();
			if (name == "Map")
				name = "Object";
		} else {
			name = classDef.getOutputClassName();
		}
		return name;
	},

	$buildAnnotation: function (template, type) {
		var closureType = this.toClosureType(type);
		if (closureType == null)
			return "";
		return Util.format(template, [closureType]);
	},

	$emitLabelOfStatement: function (emitter, statement) {
		var label = statement.getLabel();
		if (label != null) {
			emitter._reduceIndent();
			emitter._emit(label.getValue() + ":\n", label);
			emitter._advanceIndent();
		}
	}

});

// statement emitter

var _StatementEmitter = exports._StatementEmitter = Class.extend({

	constructor: function (emitter) {
		this._emitter = emitter;
	}

});

var _ConstructorInvocationStatementEmitter = exports._ConstructorInvocationStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		var ctorType = this._statement.getConstructorType();
		var argTypes = ctorType != null ? ctorType.getArgumentTypes() : [];
		var ctorName = this._emitter._mangleConstructorName(this._statement.getConstructingClassDef(), argTypes);
		var token = this._statement.getQualifiedName().getToken();
		if (ctorName == "Error" && this._statement.getArguments().length == 1) {
			/*
				At least v8 does not support "Error.call(this, message)"; it not only does not setup the stacktrace but also does
				not set the message property.  So we set the message property.
				We continue to call "Error" hoping that it would have some positive effect on other platforms (like setting the
				stacktrace, etc.).

				FIXME check that doing  "Error.call(this);" does not have any negative effect on other platforms
			*/
			this._emitter._emit("Error.call(this);\n", token);
			this._emitter._emit("this.message = ", token);
			this._emitter._getExpressionEmitterFor(this._statement.getArguments()[0]).emit(_BinaryExpressionEmitter._operatorPrecedence["="]);
		} else {
			this._emitter._emitCallArguments(token, ctorName + ".call(this", this._statement.getArguments(), argTypes);
			this._emitter._emit(";\n", token);
		}
	}

});

var _ExpressionStatementEmitter = exports._ExpressionStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
		this._emitter._emit(";\n", null);
	}

});

var _ReturnStatementEmitter = exports._ReturnStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		var expr = this._statement.getExpr();
		if (expr != null) {
			this._emitter._emit("return ", null);
			this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
			this._emitter._emit(";\n", null);
		} else {
			this._emitter._emit("return;\n", this._statement.getToken());
		}
	}

});

var _DeleteStatementEmitter = exports._DeleteStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._emit("delete ", this._statement.getToken());
		this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
		this._emitter._emit(";\n", null);
	}

});

var _BreakStatementEmitter = exports._BreakStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		if (this._statement.getLabel() != null)
			this._emitter._emit("break " + this._statement.getLabel().getValue() + ";\n", this._statement.getToken());
		else
			this._emitter._emit("break;\n", this._statement.getToken());
	}

});

var _ContinueStatementEmitter = exports._ContinueStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		if (this._statement.getLabel() != null)
			this._emitter._emit("continue " + this._statement.getLabel().getValue() + ";\n", this._statement.getToken());
		else
			this._emitter._emit("continue;\n", this._statement.getToken());
	}

});

var _DoWhileStatementEmitter = exports._DoWhileStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		_Util.emitLabelOfStatement(this._emitter, this._statement);
		this._emitter._emit("do {\n", null);
		this._emitter._emitStatements(this._statement.getStatements());
		this._emitter._emit("} while (", null);
		this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
		this._emitter._emit(");\n", null);
	}

});

var _ForInStatementEmitter = exports._ForInStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		_Util.emitLabelOfStatement(this._emitter, this._statement);
		this._emitter._emit("for (", null);
		this._emitter._getExpressionEmitterFor(this._statement.getLHSExpr()).emit(0);
		this._emitter._emit(" in ", null);
		this._emitter._getExpressionEmitterFor(this._statement.getListExpr()).emit(0);
		this._emitter._emit(") {\n", null);
		this._emitter._emitStatements(this._statement.getStatements());
		this._emitter._emit("}\n", null);
	}

});

var _ForStatementEmitter = exports._ForStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		_Util.emitLabelOfStatement(this._emitter, this._statement);
		this._emitter._emit("for (", null);
		var initExpr = this._statement.getInitExpr();
		if (initExpr != null)
			this._emitter._getExpressionEmitterFor(initExpr).emit(0);
		this._emitter._emit("; ", null);
		var condExpr = this._statement.getCondExpr();
		if (condExpr != null)
			this._emitter._getExpressionEmitterFor(condExpr).emit(0);
		this._emitter._emit("; ", null);
		var postExpr = this._statement.getPostExpr();
		if (postExpr != null)
			this._emitter._getExpressionEmitterFor(postExpr).emit(0);
		this._emitter._emit(") {\n", null);
		this._emitter._emitStatements(this._statement.getStatements());
		this._emitter._emit("}\n", null);
	}

});

var _IfStatementEmitter = exports._IfStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._emit("if (", null);
		this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
		this._emitter._emit(") {\n", null);
		this._emitter._emitStatements(this._statement.getOnTrueStatements());
		var ifFalseStatements = this._statement.getOnFalseStatements();
		if (ifFalseStatements.length != 0) {
			this._emitter._emit("} else {\n", null);
			this._emitter._emitStatements(ifFalseStatements);
		}
		this._emitter._emit("}\n", null);
	}

});

var _SwitchStatementEmitter = exports._SwitchStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		_Util.emitLabelOfStatement(this._emitter, this._statement);
		this._emitter._emit("switch (", null);
		var expr = this._statement.getExpr();
		if (this._emitter._enableRunTimeTypeCheck && expr.getType() instanceof MayBeUndefinedType) {
			this._emitter._emitExpressionWithUndefinedAssertion(expr);
		} else {
			this._emitter._getExpressionEmitterFor(expr).emit(0);
		}
		this._emitter._emit(") {\n", null);
		this._emitter._emitStatements(this._statement.getStatements());
		this._emitter._emit("}\n", null);
	}

});

var _CaseStatementEmitter = exports._CaseStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._reduceIndent();
		this._emitter._emit("case ", null);
		var expr = this._statement.getExpr();
		if (this._emitter._enableRunTimeTypeCheck && expr.getType() instanceof MayBeUndefinedType) {
			this._emitter._emitExpressionWithUndefinedAssertion(expr);
		} else {
			this._emitter._getExpressionEmitterFor(expr).emit(0);
		}
		this._emitter._emit(":\n", null);
		this._emitter._advanceIndent();
	}

});

var _DefaultStatementEmitter = exports._DefaultStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._reduceIndent();
		this._emitter._emit("default:\n", null);
		this._emitter._advanceIndent();
	}

});

var _WhileStatementEmitter = exports._WhileStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		_Util.emitLabelOfStatement(this._emitter, this._statement);
		this._emitter._emit("while (", null);
		this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
		this._emitter._emit(") {\n", null);
		this._emitter._emitStatements(this._statement.getStatements());
		this._emitter._emit("}\n", null);
	}

});

var _TryStatementEmitter = exports._TryStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
		var outerCatchStatements = 0;
		for (var i = 0; i < this._emitter._emittingStatementStack.length; ++i) {
			if (this._emitter._emittingStatementStack[i] instanceof _TryStatementEmitter)
				++outerCatchStatements;
		}
		this._emittingLocalName = "$__jsx_catch_" + outerCatchStatements;
	},

	emit: function () {
		this._emitter._emit("try {\n", this._statement.getToken());
		this._emitter._emitStatements(this._statement.getTryStatements());
		this._emitter._emit("}", null);
		var catchStatements = this._statement.getCatchStatements();
		if (catchStatements.length != 0) {
			this._emitter._emit(" catch (" + this._emittingLocalName + ") {\n", null);
			this._emitter._emitStatements(catchStatements);
			if (! catchStatements[catchStatements.length - 1].getLocal().getType().equals(Type.variantType)) {
				this._emitter._advanceIndent();
				this._emitter._emit("{\n", null);
				this._emitter._advanceIndent();
				this._emitter._emit("throw " + this._emittingLocalName + ";\n", null);
				this._emitter._reduceIndent();
				this._emitter._emit("}\n", null);
				this._emitter._reduceIndent();
			}
			this._emitter._emit("}", null);
		}
		var finallyStatements = this._statement.getFinallyStatements();
		if (finallyStatements.length != 0) {
			this._emitter._emit(" finally {\n", null);
			this._emitter._emitStatements(finallyStatements);
			this._emitter._emit("}", null);
		}
		this._emitter._emit("\n", null);
	},

	getEmittingLocalName: function () {
		return this._emittingLocalName;
	}

});

var _CatchStatementEmitter = exports._CatchStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		var localType = this._statement.getLocal().getType();
		if (localType instanceof ObjectType) {
			var tryStatement = this._emitter._emittingStatementStack[this._emitter._emittingStatementStack.length - 2];
			var localName = tryStatement.getEmittingLocalName();
			this._emitter._emit("if (" + localName + " instanceof " + localType.getClassDef().getOutputClassName() + ") {\n", this._statement.getToken());
			this._emitter._emitStatements(this._statement.getStatements());
			this._emitter._emit("} else ", null);
		} else {
			this._emitter._emit("{\n", null);
			this._emitter._emitStatements(this._statement.getStatements());
			this._emitter._emit("}\n", null);
		}
	},

	$getLocalNameFor: function (emitter, name) {
		for (var i = emitter._emittingStatementStack.length - 1; i >= 0; --i) {
			if (! (emitter._emittingStatementStack[i] instanceof _CatchStatementEmitter))
				continue;
			var catchStatement = emitter._emittingStatementStack[i];
			if (catchStatement._statement.getLocal().getName().getValue() == name) {
				var tryEmitter = emitter._emittingStatementStack[i - 1];
				if (! (tryEmitter instanceof _TryStatementEmitter))
					throw new Error("logic flaw");
				return tryEmitter.getEmittingLocalName();
			}
		}
		throw new Error("logic flaw");
	}

});

var _ThrowStatementEmitter = exports._ThrowStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._emit("throw ", this._statement.getToken());
		this._emitter._getExpressionEmitterFor(this._statement.getExpr()).emit(0);
		this._emitter._emit(";\n", null);
	}

});

var _AssertStatementEmitter = exports._AssertStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		var condExpr = this._statement._expr;
		this._emitter._emitAssertion(function () {
			this._emitter._getExpressionEmitterFor(condExpr).emit(0);
		}.bind(this), this._statement.getToken(), "assertion failure");
	}

});

var _LogStatementEmitter = exports._LogStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._emit("console.log(", null);
		var exprs = this._statement.getExprs();
		for (var i = 0; i < exprs.length; ++i) {
			if (i != 0)
				this._emitter._emit(", ", null);
			this._emitter._getExpressionEmitterFor(exprs[i]).emit(0);
		}
		this._emitter._emit(");\n", null);
	}

});

var _DebuggerStatementEmitter = exports._DebuggerStatementEmitter = _StatementEmitter.extend({

	constructor: function (emitter, statement) {
		_StatementEmitter.prototype.constructor.call(this, emitter);
		this._statement = statement;
	},

	emit: function () {
		this._emitter._emit("debugger;\n", this._statement.getToken());
	}

});

// expression emitter

var _ExpressionEmitter = exports._ExpressionEmitter = Class.extend({

	constructor: function (emitter) {
		this._emitter = emitter;
	},

	emitWithPrecedence: function (outerOpPrecedence, precedence, callback) {
		if (precedence > outerOpPrecedence) {
			this._emitter._emit("(", null);
			callback();
			this._emitter._emit(")", null);
		} else {
			callback();
		}
	}

});

var _IdentifierExpressionEmitter = exports._IdentifierExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var type = this._expr.getType();
		if (type instanceof ClassDefType) {
			this._emitter._emit(type.getClassDef().getOutputClassName(), null);
		} else {
			var local = this._expr.getLocal();
			var localName = local.getName().getValue();
			if (local instanceof CaughtVariable) {
				localName = _CatchStatementEmitter.getLocalNameFor(this._emitter, localName);
			}
			this._emitter._emit(localName, this._expr.getToken());
		}
	}

});

var _UndefinedExpressionEmitter = exports._UndefinedExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		this._emitter._emit("undefined", token);
	}

});

var _NullExpressionEmitter = exports._NullExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		this._emitter._emit("null", token);
	}

});

var _BooleanLiteralExpressionEmitter = exports._BooleanLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		this._emitter._emit(token.getValue(), token);
	}

});

var _IntegerLiteralExpressionEmitter = exports._IntegerLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		this._emitter._emit("" + token.getValue(), token);
	}

});

var _NumberLiteralExpressionEmitter = exports._NumberLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		var str = token.getValue();
		if (outerOpPrecedence == _PropertyExpressionEmitter._operatorPrecedence && str.indexOf(".") == -1) {
			this._emitter._emit("(" + token.getValue() + ")", token);
		} else {
			this._emitter._emit("" + token.getValue(), token);
		}
	}

});

var _StringLiteralExpressionEmitter = exports._StringLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		// FIXME escape
		this._emitter._emit(token.getValue(), token);
	}

});

var _RegExpLiteralExpressionEmitter = exports._RegExpLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var token = this._expr.getToken();
		this._emitter._emit(token.getValue(), token);
	}

});

var _ArrayLiteralExpressionEmitter = exports._ArrayLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		this._emitter._emit("[ ", null);
		var exprs = this._expr.getExprs();
		for (var i = 0; i < exprs.length; ++i) {
			if (i != 0)
				this._emitter._emit(", ", null);
			this._emitter._getExpressionEmitterFor(exprs[i]).emit(0);
		}
		this._emitter._emit(" ]", null);
	}

});

var _MapLiteralExpressionEmitter = exports._MapLiteralExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		this._emitter._emit("{ ", null);
		var elements = this._expr.getElements();
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			if (i != 0)
				this._emitter._emit(", ", null);
			this._emitter._emit(element.getKey().getValue(), element.getKey());
			this._emitter._emit(": ", null);
			this._emitter._getExpressionEmitterFor(element.getExpr()).emit(0);
		}
		this._emitter._emit(" }", null);
	}

});

var _ThisExpressionEmitter = exports._ThisExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var emittingFunction = this._emitter._emittingFunction;
		if ((emittingFunction.flags() & ClassDefinition.IS_STATIC) != 0)
			this._emitter._emit("$this", this._expr.getToken());
		else
			this._emitter._emit("this", this._expr.getToken());
	}

});

var _AsExpressionEmitter = exports._AsExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var srcType = this._expr.getExpr().getType();
		var destType = this._expr.getType();
		if (srcType.resolveIfMayBeUndefined() instanceof ObjectType || srcType.equals(Type.variantType)) {
			if (srcType.resolveIfMayBeUndefined().isConvertibleTo(destType)) {
				if (srcType instanceof MayBeUndefinedType) {
					var prec = _BinaryExpressionEmitter._operatorPrecedence["||"];
					this._emitWithParens(outerOpPrecedence, prec, prec, null, "|| null");
				} else {
					this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(outerOpPrecedence);
				}
				return true;
			}
			if (destType instanceof ObjectType) {
				// unsafe cast
				if ((destType.getClassDef().flags() & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) == 0) {
					this.emitWithPrecedence(outerOpPrecedence, _CallExpressionEmitter._operatorPrecedence, (function () {
						this._emitter._emit("(function (o) { return o instanceof " + _Util.getInstanceofNameFromClassDef(destType.getClassDef()) + " ? o : null; })(", this._expr.getToken());
						this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(0);
						this._emitter._emit(")", this._expr.getToken());
					}).bind(this));
				} else {
					this.emitWithPrecedence(outerOpPrecedence, _CallExpressionEmitter._operatorPrecedence, (function () {
						this._emitter._emit("(function (o) { return o && o.$__jsx_implements_" + destType.getClassDef().getOutputClassName() + " ? o : null; })(", this._expr.getToken());
						this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(0);
						this._emitter._emit(")", this._expr.getToken());
					}).bind(this));
				}
				return true;
			}
			if (destType instanceof FunctionType) {
				// cast to function
				this._emitter._emit("(function (o) { return typeof(o) === \"function\" ? o : null; })(", this._expr.getToken());
				this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(0);
				this._emitter._emit(")", this._expr.getToken());
				return true;
			}
		}
		if (srcType.equals(Type.nullType)) {
			// from null
			if (destType.equals(Type.booleanType)) {
				this._emitter._emit("false", this._expr.getToken());
				return true;
			}
			if (destType.equals(Type.integerType) || destType.equals(Type.numberType)) {
				this._emitter._emit("0", this._expr.getToken());
				return true;
			}
			if (destType.equals(Type.stringType)) {
				this._emitter._emit("\"null\"", this._expr.getToken());
				return true;
			}
			if (destType instanceof ObjectType || destType instanceof FunctionType) {
				this._emitter._emit("null", this._expr.getToken());
				return true;
			}
		}
		if (srcType.equals(Type.booleanType)) {
			// from boolean
			if (destType.equals(Type.integerType) || destType.equals(Type.numberType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "+", null);
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType instanceof MayBeUndefinedType && srcType.getBaseType().equals(Type.booleanType)) {
			// from MayBeUndefined.<boolean>
			if (destType.equals(Type.booleanType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["||"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " || false");
				return true;
			}
			if (destType.equals(Type.integerType) || destType.equals(Type.numberType)) {
				this._emitWithParens(
					outerOpPrecedence,
					_BinaryExpressionEmitter._operatorPrecedence["-"],
					_UnaryExpressionEmitter._operatorPrecedence["!"],
					"1 - ! ",
					null);
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType.equals(Type.integerType)) {
			// from integer
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.numberType)) {
				this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(outerOpPrecedence);
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType instanceof MayBeUndefinedType && srcType.getBaseType().equals(Type.integerType)) {
			// from MayBeUndefined.<int>
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.integerType) || destType.equals(Type.numberType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["|"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " | 0");
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType.equals(Type.numberType)) {
			// from number
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.integerType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["|"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " | 0");
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType instanceof MayBeUndefinedType && srcType.getBaseType().equals(Type.numberType)) {
			// from MayBeUndefined.<number>
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.integerType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["|"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " | 0");
				return true;
			}
			if (destType.equals(Type.numberType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "+", null);
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType.equals(Type.stringType)) {
			// from String
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.integerType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["|"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " | 0");
				return true;
			}
			if (destType.equals(Type.numberType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "+", null);
				return true;
			}
		}
		if (srcType instanceof MayBeUndefinedType && srcType.getBaseType().equals(Type.stringType)) {
			// from MayBeUndefined.<String>
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.integerType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["|"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " | 0");
				return true;
			}
			if (destType.equals(Type.numberType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "+", null);
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType.equals(Type.variantType)) {
			// from variant
			if (destType.equals(Type.booleanType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["!"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "!! ", null);
				return true;
			}
			if (destType.equals(Type.integerType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["|"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " | 0");
				return true;
			}
			if (destType.equals(Type.numberType)) {
				var prec = _UnaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, "+", null);
				return true;
			}
			if (destType.equals(Type.stringType)) {
				var prec = _BinaryExpressionEmitter._operatorPrecedence["+"];
				this._emitWithParens(outerOpPrecedence, prec, prec, null, " + \"\"");
				return true;
			}
		}
		if (srcType.isConvertibleTo(destType)) {
			// can perform implicit conversion
			this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(outerOpPrecedence);
			return true;
		}
		throw new Error("explicit conversion logic unknown from " + srcType.toString() + " to " + destType.toString());
	},

	_emitWithParens: function (outerOpPrecedence, opPrecedence, innerOpPrecedence, prefix, postfix) {
		// in contrast to _ExpressionEmitter#emitWithPrecedence the comparison op. is >=, since the conversion should have higher precedence than the outer op. (see t/run/110)
		if (opPrecedence >= outerOpPrecedence)
			this._emitter._emit("(", null);
		if (prefix != null)
			this._emitter._emit(prefix, this._expr.getToken());
		this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(innerOpPrecedence);
		if (postfix != null)
			this._emitter._emit(postfix, this._expr.getToken());
		if (opPrecedence >= outerOpPrecedence)
			this._emitter._emit(")", null);
	}

});

var _AsNoConvertExpressionEmitter = exports._AsNoConvertExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		if (this._emitter._enableRunTimeTypeCheck) {
			var emitWithAssertion = function (emitCheckExpr, message) {
				var token = this._expr.getToken();
				this._emitter._emit("(function (v) {\n", token);
				this._emitter._advanceIndent();
				this._emitter._emitAssertion(emitCheckExpr, token, message);
				this._emitter._emit("return v;\n", token);
				this._emitter._reduceIndent();
				this._emitter._emit("}(", token);
				this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(0);
				this._emitter._emit("))", token);
			}.bind(this);
			var srcType = this._expr.getExpr().getType();
			var destType = this._expr.getType();
			if (srcType.equals(destType) || srcType.equals(destType.resolveIfMayBeUndefined)) {
				// skip
			} else if (destType instanceof VariantType) {
				// skip
			} else if (srcType instanceof ObjectType && srcType.isConvertibleTo(destType)) {
				// skip
			} else if (destType.equals(Type.booleanType)) {
				emitWithAssertion(function () {
					this._emitter._emit("typeof v === \"boolean\"", this._expr.getToken());
				}.bind(this), "detected invalid cast, value is not a boolean");
				return;
			} else if (destType.equals(Type.integerType) || destType.equals(Type.numberType)) {
				emitWithAssertion(function () {
					this._emitter._emit("typeof v === \"number\"", this._expr.getToken());
				}.bind(this), "detected invalid cast, value is not a number");
				return;
			} else if (destType.equals(Type.stringType)) {
				emitWithAssertion(function () {
					this._emitter._emit("typeof v === \"string\"", this._expr.getToken());
				}.bind(this), "detected invalid cast, value is not a string");
				return;
			} else if (destType instanceof FunctionType) {
				emitWithAssertion(function () {
					this._emitter._emit("v === null || typeof v === \"function\"", this._expr.getToken());
				}.bind(this), "detected invalid cast, value is not a function or null");
				return;
			} else if (destType instanceof ObjectType) {
				var destClassDef = destType.getClassDef();
				if ((destClassDef.flags() & ClassDefinition.IS_FAKE) != 0) {
					// skip
				} else if (destClassDef instanceof InstantiatedClassDefinition && destClassDef.getTemplateClassName() == "Array") {
					emitWithAssertion(function () {
						this._emitter._emit("v === null || v instanceof Array", this._expr.getToken());
					}.bind(this), "detected invalid cast, value is not an Array or null");
					return;
				} else if (destClassDef instanceof InstantiatedClassDefinition && destClassDef.getTemplateClassName() == "Map") {
					emitWithAssertion(function () {
						this._emitter._emit("v === null || typeof v === \"object\"", this._expr.getToken());
					}.bind(this), "detected invalid cast, value is not a Map or null");
					return;
				} else {
					emitWithAssertion(function () {
						this._emitter._emit("v === null || v instanceof " + destClassDef.getOutputClassName(), this._expr.getToken());
					}.bind(this), "detected invalid cast, value is not an instance of the designated type or null");
					return;
				}
			}
		}
		this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(outerOpPrecedence);
		return;
	}

});

var _OperatorExpressionEmitter = exports._OperatorExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
	},

	emit: function (outerOpPrecedence) {
		this.emitWithPrecedence(outerOpPrecedence, this._getPrecedence(), this._emit.bind(this));
	},

	_emit: null, // void emit()

	_getPrecedence: null // int _getPrecedence()

});

var _UnaryExpressionEmitter = exports._UnaryExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	_emit: function () {
		var opToken = this._expr.getToken();
		this._emitter._emit(opToken.getValue() + " ", opToken);
		this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(this._getPrecedence());
	},

	_getPrecedence: function () {
		return _UnaryExpressionEmitter._operatorPrecedence[this._expr.getToken().getValue()];
	},

	$_operatorPrecedence: {},

	$_setOperatorPrecedence: function (op, precedence) {
		_UnaryExpressionEmitter._operatorPrecedence[op] = precedence;
	}

});

var _PostfixExpressionEmitter = exports._PostfixExpressionEmitter = _UnaryExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_UnaryExpressionEmitter.prototype.constructor.call(this, emitter, expr);
	},

	_emit: function () {
		var opToken = this._expr.getToken();
		this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(this._getPrecedence());
		this._emitter._emit(opToken.getValue(), opToken);
	},

	_getPrecedence: function () {
		return _PostfixExpressionEmitter._operatorPrecedence[this._expr.getToken().getValue()];
	},

	$_operatorPrecedence: {},

	$_setOperatorPrecedence: function (op, precedence) {
		_PostfixExpressionEmitter._operatorPrecedence[op] = precedence;
	}

});

var _InstanceofExpressionEmitter = exports._InstanceofExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var expectedType = this._expr.getExpectedType();
		if ((expectedType.getClassDef().flags() & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) == 0) {
			this.emitWithPrecedence(outerOpPrecedence, _InstanceofExpressionEmitter._operatorPrecedence, (function () {
				this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(_InstanceofExpressionEmitter._operatorPrecedence);
				this._emitter._emit(" instanceof " + _Util.getInstanceofNameFromClassDef(expectedType.getClassDef()), null);
			}).bind(this));
		} else {
			this.emitWithPrecedence(outerOpPrecedence, _CallExpressionEmitter._operatorPrecedence, (function () {
				this._emitter._emit("(function (o) { return !! (o && o.$__jsx_implements_" + expectedType.getClassDef().getOutputClassName() + "); })(", this._expr.getToken());
				this._emitter._getExpressionEmitterFor(this._expr.getExpr()).emit(0);
				this._emitter._emit(")", this._expr.getToken());
			}).bind(this));
		}
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_InstanceofExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _PropertyExpressionEmitter = exports._PropertyExpressionEmitter = _UnaryExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_UnaryExpressionEmitter.prototype.constructor.call(this, emitter, expr);
	},

	_emit: function () {
		var expr = this._expr;
		var exprType = expr.getType();
		var identifierToken = this._expr.getIdentifierToken();
		// special handling for import ... as
		if (exprType instanceof ClassDefType) {
			this._emitter._emit(exprType.getClassDef().getOutputClassName(), identifierToken);
			return;
		}
		// replace methods to global function (e.g. Number.isNaN to isNaN)
		if (expr.getExpr()._classDefType instanceof ClassDefType
			&& expr.getExpr()._classDefType.getClassDef() === Type.numberType.getClassDef()) {
			switch (identifierToken.getValue()) {
			case "parseInt":
			case "parseFloat":
			case "isNaN":
			case "isFinite":
				this._emitter._emit('$__jsx_' + identifierToken.getValue(), identifierToken);
				return;
			}
		}
		this._emitter._getExpressionEmitterFor(expr.getExpr()).emit(this._getPrecedence());
		// mangle the name if necessary
		if (exprType instanceof FunctionType && ! exprType.isAssignable()
			&& (expr.getHolderType().getClassDef().flags() & ClassDefinition.IS_NATIVE) == 0) {
			if (expr.getExpr()._classDefType instanceof ClassDefType) {
				// do not use "." notation for static functions, but use class$name
				this._emitter._emit("$", identifierToken);
			} else {
				this._emitter._emit(".", identifierToken);
			}
			this._emitter._emit(this._emitter._mangleFunctionName(identifierToken.getValue(), exprType.getArgumentTypes()), identifierToken);
		} else {
			this._emitter._emit(".", identifierToken);
			this._emitter._emit(identifierToken.getValue(), identifierToken);
		}
	},

	_getPrecedence: function () {
		return _PropertyExpressionEmitter._operatorPrecedence;
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_PropertyExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _FunctionExpressionEmitter = exports._FunctionExpressionEmitter = _UnaryExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_UnaryExpressionEmitter.prototype.constructor.call(this, emitter, expr);
	},

	_emit: function () {
		var funcDef = this._expr.getFuncDef();
		this._emitter._emit("(function (", funcDef.getToken());
		var args = funcDef.getArguments();
		for (var i = 0; i < args.length; ++i) {
			if (i != 0)
				this._emitter._emit(", ", funcDef.getToken());
			this._emitter._emit(args[i].getName().getValue(), funcDef.getToken());
		}
		this._emitter._emit(") {\n", funcDef.getToken());
		this._emitter._advanceIndent();
		this._emitter._emitFunctionBody(funcDef);
		this._emitter._reduceIndent();
		this._emitter._emit("})", funcDef.getToken())
	},

	_getPrecedence: function () {
		return _FunctionExpressionEmitter._operatorPrecedence;
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_FunctionExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _BinaryExpressionEmitter = exports._BinaryExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
		this._precedence = _BinaryExpressionEmitter._operatorPrecedence[this._expr.getToken().getValue()];
	},

	_emit: function () {
		var opToken = this._expr.getToken();
		var firstExpr = this._expr.getFirstExpr();
		var firstExprType = firstExpr.getType();
		var secondExpr = this._expr.getSecondExpr();
		var secondExprType = secondExpr.getType();
		var op = opToken.getValue();
		switch (op) {
		case "+":
			// special handling: (undefined as MayBeUndefined<String>) + (undefined as MayBeUndefined<String>) should produce "undefinedundefined", not NaN
			if (firstExprType.equals(secondExprType) && firstExprType.equals(Type.stringType.toMayBeUndefinedType()))
				this._emitter._emit("\"\" + ", null);
			break;
		case "==":
		case "!=":
			// equality operators of JSX are strict equality ops in JS (expect if either operand is an object and the other is the primitive counterpart)
			if ((firstExprType instanceof ObjectType) + (secondExprType instanceof ObjectType) != 1)
				op += "=";
			break;
		}
		this._emitter._getExpressionEmitterFor(firstExpr).emit(this._precedence);
		this._emitter._emit(" " + op + " ", opToken);
		if (this._expr instanceof AssignmentExpression) {
			this._emitter._emitRHSOfAssignment(secondExpr, firstExprType);
		} else {
			// RHS should have higher precedence (consider: 1 - (1 + 1))
			this._emitter._getExpressionEmitterFor(secondExpr).emit(this._precedence - 1);
		}
	},

	_getPrecedence: function () {
		return this._precedence;
	},

	$_operatorPrecedence: {},

	$_setOperatorPrecedence: function (op, precedence) {
		_BinaryExpressionEmitter._operatorPrecedence[op] = precedence;
	}

});

var _ArrayExpressionEmitter = exports._ArrayExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	_emit: function () {
		this._emitter._getExpressionEmitterFor(this._expr.getFirstExpr()).emit(_ArrayExpressionEmitter._operatorPrecedence);
		this._emitter._emit("[", this._expr.getToken());
		this._emitter._getExpressionEmitterFor(this._expr.getSecondExpr()).emit(_ArrayExpressionEmitter._operatorPrecedence);
		this._emitter._emit("]", null);
	},

	_getPrecedence: function () {
		return _ArrayExpressionEmitter._operatorPrecedence;
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_ArrayExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _ConditionalExpressionEmitter = exports._ConditionalExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	_emit: function () {
		var precedence = this._getPrecedence();
		var ifTrueExpr = this._expr.getIfTrueExpr();
		if (ifTrueExpr != null) {
			this._emitter._getExpressionEmitterFor(this._expr.getCondExpr()).emit(precedence);
			this._emitter._emit(" ? ", null);
			this._emitter._getExpressionEmitterFor(ifTrueExpr).emit(precedence);
			this._emitter._emit(" : ", null);
			this._emitter._getExpressionEmitterFor(this._expr.getIfFalseExpr()).emit(precedence);
		} else {
			this._emitter._getExpressionEmitterFor(this._expr.getCondExpr()).emit(precedence);
			this._emitter._emit(" || ", null);
			this._emitter._getExpressionEmitterFor(this._expr.getIfFalseExpr()).emit(precedence);
		}
	},

	_getPrecedence: function () {
		return this._expr.getIfTrueExpr() != null ? _ConditionalExpressionEmitter._operatorPrecedence : _BinaryExpressionEmitter._operatorPrecedence["||"];
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_ConditionalExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _CallExpressionEmitter = exports._CallExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	_emit: function () {
		if (this._emitSpecial())
			return;
		// normal case
		var calleeExpr = this._expr.getExpr();
		if (this._emitter._enableRunTimeTypeCheck && calleeExpr.getType() instanceof MayBeUndefinedType)
			this._emitter._emitExpressionWithUndefinedAssertion(calleeExpr);
		else
			this._emitter._getExpressionEmitterFor(calleeExpr).emit(_CallExpressionEmitter._operatorPrecedence);
		this._emitter._emitCallArguments(this._expr.getToken(), "(", this._expr.getArguments(), this._expr.getExpr().getType().resolveIfMayBeUndefined().getArgumentTypes());
	},

	_getPrecedence: function () {
		return _CallExpressionEmitter._operatorPrecedence;
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_CallExpressionEmitter._operatorPrecedence = precedence;
	},

	_emitSpecial: function () {
		// return false if is not js.apply
		var calleeExpr = this._expr.getExpr();
		if (! (calleeExpr instanceof PropertyExpression))
			return false;
		if (this._emitIfJsInvoke(calleeExpr))
			return true;
		else if (this._emitCallsToMap(calleeExpr))
			return true;
		else if (this._emitIfMathAbs(calleeExpr))
			return true;
		return false;
	},

	_emitIfJsInvoke: function (calleeExpr) {
		if (! (calleeExpr.getType() instanceof StaticFunctionType))
			return false;
		if (calleeExpr.getIdentifierToken().getValue() != "invoke")
			return false;
		var classDef = calleeExpr.getExpr().getType().getClassDef();
		if (! (classDef.className() == "js" && classDef.getToken().getFilename() == this._emitter._platform.getRoot() + "/lib/js/js.jsx"))
			return false;
		// emit
		var args = this._expr.getArguments();
		if (args[2] instanceof ArrayLiteralExpression) {
			this._emitter._getExpressionEmitterFor(args[0]).emit(_PropertyExpressionEmitter._operatorPrecedence);
			// FIXME emit as property expression if possible
			this._emitter._emit("[", calleeExpr.getToken());
			this._emitter._getExpressionEmitterFor(args[1]).emit(0);
			this._emitter._emit("]", calleeExpr.getToken());
			this._emitter._emitCallArguments(this._expr.getToken(), "(", args[2].getExprs(), null);
		} else {
			this._emitter._emit("(function (o, p, a) { return o[p].apply(o, a); }(", calleeExpr.getToken());
			this._emitter._getExpressionEmitterFor(args[0]).emit(0);
			this._emitter._emit(", ", this._expr.getToken());
			this._emitter._getExpressionEmitterFor(args[1]).emit(0);
			this._emitter._emit(", ", this._expr.getToken());
			this._emitter._getExpressionEmitterFor(args[2]).emit(0);
			this._emitter._emit("))", this._expr.getToken());
		}
		return true;
	},

	_emitCallsToMap: function (calleeExpr) {
		// NOTE once we support member function references, we need to add special handling in _PropertyExpressionEmitter as well
		if (calleeExpr.getType() instanceof StaticFunctionType)
			return false;
		var classDef = calleeExpr.getExpr().getType().getClassDef();
		if (! (classDef instanceof InstantiatedClassDefinition))
			return false;
		if (classDef.getTemplateClassName() != "Map")
			return false;
		switch (calleeExpr.getIdentifierToken().getValue()) {
		case "toString":
			this._emitter._emitCallArguments(
				calleeExpr.getToken(), "$__jsx_ObjectToString.call(", [ calleeExpr.getExpr() ], [ new ObjectType(classDef) ]);
			return true;
		case "hasOwnProperty":
			this._emitter._emitCallArguments(
				calleeExpr.getToken(), "$__jsx_ObjectHasOwnProperty.call(",
				[ calleeExpr.getExpr(), this._expr.getArguments()[0] ],
				[ new ObjectType(classDef), Type.stringType ]);
			return true;
		default:
			return false;
		}
	},

	_emitIfMathAbs: function (calleeExpr) {
		if (! _CallExpressionEmitter._calleeIsMathAbs(calleeExpr))
			return false;
		var argExpr = this._expr.getArguments()[0];
		if (argExpr instanceof LeafExpression) {
			this._emitter._emit("(", this._expr.getToken());
			this._emitter._getExpressionEmitterFor(argExpr).emit(0);
			this._emitter._emit(" >= 0 ? ", this._expr.getToken());
			this._emitter._getExpressionEmitterFor(argExpr).emit(0);
			this._emitter._emit(" : - ", this._expr.getToken());
			this._emitter._getExpressionEmitterFor(argExpr).emit(0);
			this._emitter._emit(")", this._expr.getToken());
		} else {
			this._emitter._emit("(($math_abs_t = ", this._expr.getToken());
			this._emitter._getExpressionEmitterFor(argExpr).emit(_BinaryExpressionEmitter._operatorPrecedence["="]);
			this._emitter._emit(") >= 0 ? $math_abs_t : -$math_abs_t)", this._expr.getToken());
		}
		return true;
	},

	$_calleeIsMathAbs: function (calleeExpr) {
		if (! (calleeExpr.getType() instanceof StaticFunctionType))
			return false;
		if (calleeExpr.getIdentifierToken().getValue() != "abs")
			return false;
		if (calleeExpr.getExpr().getType().getClassDef().className() != "Math")
			return false;
		return true;
	},

	$mathAbsUsesTemporary: function (funcDef) {
		return ! funcDef.forEachStatement(function onStatement(statement) {
			if (! statement.forEachExpression(function onExpr(expr) {
				var calleeExpr;
				if (expr instanceof CallExpression
					&& (calleeExpr = expr.getExpr()) instanceof PropertyExpression
					&& _CallExpressionEmitter._calleeIsMathAbs(calleeExpr)
					&& ! (expr.getArguments()[0] instanceof LeafExpression))
					return false;
				return expr.forEachExpression(onExpr);
			})) {
				return false;
			}
			return statement.forEachStatement(onStatement);
		});
	}

});

var _SuperExpressionEmitter = exports._SuperExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	_emit: function () {
		var funcType = this._expr.getFunctionType();
		var className = funcType.getObjectType().getClassDef().getOutputClassName();
		var argTypes = funcType.getArgumentTypes();
		var mangledFuncName = this._emitter._mangleFunctionName(this._expr.getName().getValue(), argTypes);
		this._emitter._emitCallArguments(this._expr.getToken(), className + ".prototype." + mangledFuncName + ".call(this", this._expr.getArguments(), argTypes);
	},

	_getPrecedence: function () {
		return _CallExpressionEmitter._operatorPrecedence;
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_SuperExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _NewExpressionEmitter = exports._NewExpressionEmitter = _OperatorExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_OperatorExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		var classDef = this._expr.getType().getClassDef();
		var ctor = this._expr.getConstructor();
		var argTypes = ctor.getArgumentTypes();
		this._emitter._emitCallArguments(
			this._expr.getToken(),
			"new " + this._emitter._mangleConstructorName(classDef, argTypes) + "(",
			this._expr.getArguments(),
			argTypes);
	},

	_getPrecedence: function () {
		return _NewExpressionEmitter._operatorPrecedence;
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_NewExpressionEmitter._operatorPrecedence = precedence;
	}

});

var _CommaExpressionEmitter = exports._CommaExpressionEmitter = _ExpressionEmitter.extend({

	constructor: function (emitter, expr) {
		_ExpressionEmitter.prototype.constructor.call(this, emitter);
		this._expr = expr;
	},

	emit: function (outerOpPrecedence) {
		// comma operations should be surrounded by brackets unless within a comma expression, since "," might get considered as an argument separator (of function calls, etc.)
		var useBrackets = outerOpPrecedence != _CommaExpressionEmitter._operatorPrecedence;
		if (useBrackets)
			this._emitter._emit("(", null);
		this._emitter._getExpressionEmitterFor(this._expr.getFirstExpr()).emit(_CommaExpressionEmitter._operatorPrecedence);
		this._emitter._emit(", ", null);
		this._emitter._getExpressionEmitterFor(this._expr.getSecondExpr()).emit(_CommaExpressionEmitter._operatorPrecedence);
		if (useBrackets)
			this._emitter._emit(")", null);
	},

	$_operatorPrecedence: 0,

	$_setOperatorPrecedence: function (op, precedence) {
		_CommaExpressionEmitter._operatorPrecedence = precedence;
	}

});

// the global emitter

var JavaScriptEmitter = exports.JavaScriptEmitter = Class.extend({

	constructor: function (platform) {
		this._platform = platform;
		this._output = this._platform.load(this._platform.getRoot() + "/src/js/bootstrap.js");
		this._outputFile = null;
		this._indent = 0;
		this._emittingClass = null;
		this._emittingFunction = null;
		this._emittingStatementStack = [];
		this._enableRunTimeTypeCheck = true;
	},

	getSearchPaths: function () {
		return [ this._platform.getRoot() + "/lib/js" ];
	},

	setOutputFile: function (name) {
		this._outputFile = name;

		if(this._enableSourceMap) {
			// FIXME: set correct sourceRoot
			var sourceRoot = null;
			this._sourceMapGen = new SourceMapGenerator(name, sourceRoot);
		}
	},

	saveSourceMappingFile: function (platform) {
		var gen = this._sourceMapGen;
		if(gen != null) {
			platform.save(this._sourceMapGen.getSourceMappingFile(),
								this._sourceMapGen.generate());
		}
	},

	setSourceMapGenerator: function (gen) {
		this._sourceMapGen = gen;
	},

	setEnableRunTimeTypeCheck: function (enable) {
		this._enableRunTimeTypeCheck = enable;
	},
	setEnableSourceMap : function (enable) {
		this._enableSourceMap = enable;
	},

	emit: function (classDefs) {
		for (var i = 0; i < classDefs.length; ++i) {
			if ((classDefs[i].flags() & ClassDefinition.IS_NATIVE) == 0)
				this._emitClassDefinition(classDefs[i]);
		}
		for (var i = 0; i < classDefs.length; ++i)
			this._emitStaticInitializationCode(classDefs[i]);
		this._emitClassMap(classDefs);
	},

	_emitClassDefinition: function (classDef) {
		this._emittingClass = classDef;
		try {

			// emit class object
			this._emitClassObject(classDef);

			// emit constructors
			var ctors = this._findFunctions(classDef, "constructor", false);
			for (var i = 0; i < ctors.length; ++i)
				this._emitConstructor(ctors[i]);

			// emit functions
			var members = classDef.members();
			for (var i = 0; i < members.length; ++i) {
				var member = members[i];
				if (member instanceof MemberFunctionDefinition) {
					if (! (member.name() == "constructor" && (member.flags() & ClassDefinition.IS_STATIC) == 0) && member.getStatements() != null) {
						this._emitFunction(member);
					}
				}
			}

		} finally {
			this._emittingClass = null;
		}

	},

	_emitStaticInitializationCode: function (classDef) {
		if ((classDef.flags() & ClassDefinition.IS_NATIVE) != 0)
			return;
		// special handling for js.jsx
		if (classDef.getToken().getFilename() == this._platform.getRoot() + "/lib/js/js.jsx") {
			this._emit("js.global = (function () { return this; })();\n\n", null);
			return;
		}
		// normal handling
		var members = classDef.members();
		// FIXME can we (should we?) automatically resolve dependencies? isn't it impossible?
		for (var i = 0; i < members.length; ++i) {
			var member = members[i];
			if ((member instanceof MemberVariableDefinition)
				&& (member.flags() & (ClassDefinition.IS_STATIC | ClassDefinition.IS_NATIVE)) == ClassDefinition.IS_STATIC)
				this._emitStaticMemberVariable(classDef.getOutputClassName(), member);
		}
	},

	_emitClassMap: function (classDefs) {
		classDefs = classDefs.concat([]); // shallow clone
		// remove the classDefs wo. source token or native
		for (var i = 0; i < classDefs.length;) {
			if (classDefs[i].getToken() == null || (classDefs[i].flags() & ClassDefinition.IS_NATIVE) != 0)
				classDefs.splice(i, 1);
			else
				++i;
		}
		// start emitting
		this._emit("var $__jsx_classMap = {\n", null);
		this._advanceIndent();
		while (classDefs.length != 0) {
			// fetch the first classDef, and others that came from the same file
			var list = [];
			var pushClass = (function (classDef) {
				var push = function (suffix) {
					list.push([ classDef.className() + suffix, classDef.getOutputClassName() + suffix ]);
				};
				var ctors = this._findFunctions(classDef, "constructor", false);
				push("");
				if (ctors.length == 0) {
					push(this._mangleFunctionArguments([]));
				} else {
					for (var i = 0; i < ctors.length; ++i)
						push(this._mangleFunctionArguments(ctors[i].getArgumentTypes()));
				}
			}).bind(this);
			var filename = classDefs[0].getToken().getFilename();
			pushClass(classDefs.shift());
			for (var i = 0; i < classDefs.length;) {
				if (classDefs[i].getToken().getFilename() == filename) {
					pushClass(classDefs[i]);
					classDefs.splice(i, 1);
				} else {
					++i;
				}
			}
			// emit the map
			this._emit("\"" + this._encodeFilename(filename) + "\": ", null); // FIXME escape
			this._emit("{\n", null);
			this._advanceIndent();
			for (var i = 0; i < list.length; ++i) {
				this._emit(list[i][0] + ": " + list[i][1], null);
				if (i != list.length - 1)
					this._emit(",", null);
				this._emit("\n", null);
			}
			this._reduceIndent();
			this._emit("}", null);
			if (classDefs.length != 0)
				this._emit(",", null);
			this._emit("\n", null);
		}
		this._reduceIndent();
		this._emit("};\n\n", null);
	},

	_encodeFilename: function (filename) {
		if (filename.indexOf(this._platform.getRoot() + "/") == 0)
			filename = "system:" + filename.substring(this._platform.getRoot().length + 1);
		return filename;
	},

	getOutput: function (sourceFile, entryPoint) {
		var output = this._output + "\n" +
			"}());\n";
		if (entryPoint != null) {
			output = this._platform.addLauncher(this, this._encodeFilename(sourceFile), output, entryPoint);
		}
		if (this._sourceMapGen) {
			output += this._sourceMapGen.magicToken();
		}
		return output;
	},

	_emitClassObject: function (classDef) {
		this._emit(
			"/**\n" +
			" * class " + classDef.getOutputClassName() +
			" extends " + classDef.extendClassDef().getOutputClassName() + "\n" +
			" * @constructor\n" +
			" */\n" +
			"function ", null);
		this._emit(classDef.getOutputClassName() + "() {\n" +
			"}\n" +
			"\n",
			classDef.getToken());
		this._emit(classDef.getOutputClassName() + ".prototype = new " + classDef.extendClassDef().getOutputClassName() + ";\n", null);
		if (classDef.implementClassDefs().length != 0) {
			var interfaceDefs = classDef.implementClassDefs();
			for (var i = 0; i < interfaceDefs.length; ++i)
				this._emit("$__jsx_merge_interface(" + classDef.getOutputClassName() + ", " + interfaceDefs[i].getOutputClassName() + ");\n", null);
			this._emit("\n", null);
		}
		if ((classDef.flags() & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) != 0)
			this._emit(classDef.getOutputClassName() + ".prototype.$__jsx_implements_" + classDef.getOutputClassName() + " = true;\n\n", null);
	},

	_emitConstructor: function (funcDef) {
		var funcName = this._mangleConstructorName(funcDef.getClassDef(), funcDef.getArgumentTypes());

		// emit prologue
		this._emit("/**\n", null);
		this._emit(" * @constructor\n", null);
		this._emitFunctionArgumentAnnotations(funcDef);
		this._emit(" */\n", null);
		this._emit("function ", null);
		this._emit(funcName + "(", funcDef.getClassDef().getToken());
		this._emitFunctionArguments(funcDef);
		this._emit(") {\n", null);
		this._advanceIndent();
		// emit body
		this._emitFunctionBody(funcDef);
		// emit epilogue
		this._reduceIndent();
		this._emit("};\n\n", null);
		this._emit(funcName + ".prototype = new " + funcDef.getClassDef().getOutputClassName() + ";\n\n", null);
	},

	_emitFunction: function (funcDef) {
		var className = funcDef.getClassDef().getOutputClassName();
		var funcName = this._mangleFunctionName(funcDef.name(), funcDef.getArgumentTypes());
		// emit
		this._emit("/**\n", null);
		this._emitFunctionArgumentAnnotations(funcDef);
		this._emit(_Util.buildAnnotation(" * @return {%1}\n", funcDef.getReturnType()), null);
		this._emit(" */\n", null);
		this._emit(className + ".", null);
		if ((funcDef.flags() & ClassDefinition.IS_STATIC) == 0)
			this._emit("prototype.", null);
		this._emit(funcName + " = ", funcDef.getNameToken());
		this._emit("function (", funcDef.getToken());
		this._emitFunctionArguments(funcDef);
		this._emit(") {\n", null);
		this._advanceIndent();
		this._emitFunctionBody(funcDef);
		this._reduceIndent();
		this._emit("};\n\n", null);
		if ((funcDef.flags() & ClassDefinition.IS_STATIC) != 0)
			this._emit(className + "$" + funcName + " = " + className + "." + funcName + ";\n\n", null);
	},

	_emitFunctionArgumentAnnotations: function (funcDef) {
		var args = funcDef.getArguments();
		for (var i = 0; i < args.length; ++i)
			this._emit(_Util.buildAnnotation(" * @param {%1} " + args[i].getName().getValue() + "\n", args[i].getType()), null);
	},

	_emitFunctionArguments: function (funcDef) {
		var args = funcDef.getArguments();
		for (var i = 0; i < args.length; ++i) {
			if (i != 0)
				this._emit(", ");
			var name = args[i].getName();
			this._emit(name.getValue(), name);
		}
	},

	_emitFunctionBody: function (funcDef) {
		var prevEmittingFunction = this._emittingFunction;
		try {
			this._emittingFunction = funcDef;

			// emit reference to this for closures
			// if funDef is NOT in another closure
			if (funcDef.getClosures().length != 0 && (funcDef.flags() & ClassDefinition.IS_STATIC) == 0)
				this._emit("var $this = this;\n", null);
			// emit helper variable for Math.abs
			if (_CallExpressionEmitter.mathAbsUsesTemporary(funcDef)) {
				this._emit("var $math_abs_t;\n", null);
			}
			// emit local variable declarations
			var locals = funcDef.getLocals();
			for (var i = 0; i < locals.length; ++i) {
				// FIXME unused variables should never be emitted by the compiler
				var type = locals[i].getType();
				if (type == null)
					continue;
				this._emit(_Util.buildAnnotation("/** @type {%1} */\n", type), null);
				var name = locals[i].getName();
				this._emit("var " + name.getValue() + ";\n", name);
			}
			// emit code
			var statements = funcDef.getStatements();
			for (var i = 0; i < statements.length; ++i)
				this._emitStatement(statements[i]);

		} finally {
			this._emittingFunction = prevEmittingFunction;
		}
	},

	_emitStaticMemberVariable: function (holder, variable) {
		var initialValue = variable.getInitialValue();
		if (initialValue != null
			&& ! (initialValue instanceof UndefinedExpression
				|| initialValue instanceof NullExpression
				|| initialValue instanceof BooleanLiteralExpression
				|| initialValue instanceof IntegerLiteralExpression
				|| initialValue instanceof NumberLiteralExpression
				|| initialValue instanceof StringLiteralExpression
				|| initialValue instanceof RegExpLiteralExpression)) {
			// use deferred initialization
			this._emit("$__jsx_lazy_init(" + holder + ", \"" + variable.name() + "\", function () {\n", variable.getNameToken());
			this._advanceIndent();
			this._emit("return ", variable.getNameToken());
			this._emitRHSOfAssignment(initialValue, variable.getType());
			this._emit(";\n", variable.getNameToken());
			this._reduceIndent();
			this._emit("});\n", variable.getNameToken());
		} else {
			this._emit(holder + "." + variable.name() + " = ", variable.getNameToken());
			this._emitRHSOfAssignment(initialValue, variable.getType());
			this._emit(";\n", initialValue.getToken());
		}
	},

	_emitDefaultValueOf: function (type) {
		if (type.equals(Type.booleanType))
			this._emit("false", null);
		else if (type.equals(Type.integerType) || type.equals(Type.numberType))
			this._emit("0", null);
		else if (type.equals(Type.stringType))
			this._emit("\"\"", null);
		else if (type instanceof MayBeUndefinedType)
			this._emit("undefined", null);
		else
			this._emit("null", null);
	},

	_emitStatements: function (statements) {
		this._advanceIndent();
		for (var i = 0; i < statements.length; ++i)
			this._emitStatement(statements[i]);
		this._reduceIndent();
	},

	_emitStatement: function (statement) {
		var emitter = this._getStatementEmitterFor(statement);
		this._emittingStatementStack.push(emitter);
		try {
			emitter.emit();
		} finally {
			this._emittingStatementStack.pop();
		}
	},

	_emit: function (str, token) {
		if (str == "")
			return;
		if (this._output.match(/\n$/))
			this._output += this._getIndent();
		// optional source map
		if(this._sourceMapGen != null && token != null) {
			var outputLines = this._output.split(/^/m);
			var genPos = {
				line: outputLines.length,
				column: outputLines[outputLines.length-1].length - 1,
			};
			// XXX: 'line' of original pos seems zero-origin (gfx suspects it's a bug of mozilla/source-map)
			var origPos = {
				line: token.getLineNumber() - 1,
				column: token.getColumnNumber()
			};
			var tokenValue = token.isIdentifier()
				? token.getValue()
				: null;
			this._sourceMapGen.add(genPos, origPos,
								   token.getFilename(), tokenValue);
		}
		this._output += str.replace(/\n(.)/g, (function (a, m) { return "\n" + this._getIndent() + m; }).bind(this));
	},

	_advanceIndent: function () {
		++this._indent;
	},

	_reduceIndent: function () {
		if (--this._indent < 0)
			throw new Error("indent mistach");
	},

	_getIndent: function () {
		var s = "";
		for (var i = 0; i < this._indent; ++i)
			s += "\t";
		return s;
	},

	_getStatementEmitterFor: function (statement) {
		if (statement instanceof ConstructorInvocationStatement)
			return new _ConstructorInvocationStatementEmitter(this, statement);
		else if (statement instanceof ExpressionStatement)
			return new _ExpressionStatementEmitter(this, statement);
		else if (statement instanceof ReturnStatement)
			return new _ReturnStatementEmitter(this, statement);
		else if (statement instanceof DeleteStatement)
			return new _DeleteStatementEmitter(this, statement);
		else if (statement instanceof BreakStatement)
			return new _BreakStatementEmitter(this, statement);
		else if (statement instanceof ContinueStatement)
			return new _ContinueStatementEmitter(this, statement);
		else if (statement instanceof DoWhileStatement)
			return new _DoWhileStatementEmitter(this, statement);
		else if (statement instanceof ForInStatement)
			return new _ForInStatementEmitter(this, statement);
		else if (statement instanceof ForStatement)
			return new _ForStatementEmitter(this, statement);
		else if (statement instanceof IfStatement)
			return new _IfStatementEmitter(this, statement);
		else if (statement instanceof SwitchStatement)
			return new _SwitchStatementEmitter(this, statement);
		else if (statement instanceof CaseStatement)
			return new _CaseStatementEmitter(this, statement);
		else if (statement instanceof DefaultStatement)
			return new _DefaultStatementEmitter(this, statement);
		else if (statement instanceof WhileStatement)
			return new _WhileStatementEmitter(this, statement);
		else if (statement instanceof TryStatement)
			return new _TryStatementEmitter(this, statement);
		else if (statement instanceof CatchStatement)
			return new _CatchStatementEmitter(this, statement);
		else if (statement instanceof ThrowStatement)
			return new _ThrowStatementEmitter(this, statement);
		else if (statement instanceof AssertStatement)
			return new _AssertStatementEmitter(this, statement);
		else if (statement instanceof LogStatement)
			return new _LogStatementEmitter(this, statement);
		else if (statement instanceof DebuggerStatement)
			return new _DebuggerStatementEmitter(this, statement);
		throw new Error("got unexpected type of statement: " + JSON.stringify(statement.serialize()));
	},

	_getExpressionEmitterFor: function (expr) {
		if (expr instanceof IdentifierExpression)
			return new _IdentifierExpressionEmitter(this, expr);
		else if (expr instanceof UndefinedExpression)
			return new _UndefinedExpressionEmitter(this, expr);
		else if (expr instanceof NullExpression)
			return new _NullExpressionEmitter(this, expr);
		else if (expr instanceof BooleanLiteralExpression)
			return new _BooleanLiteralExpressionEmitter(this, expr);
		else if (expr instanceof IntegerLiteralExpression)
			return new _IntegerLiteralExpressionEmitter(this, expr);
		else if (expr instanceof NumberLiteralExpression)
			return new _NumberLiteralExpressionEmitter(this, expr);
		else if (expr instanceof StringLiteralExpression)
			return new _StringLiteralExpressionEmitter(this, expr);
		else if (expr instanceof RegExpLiteralExpression)
			return new _RegExpLiteralExpressionEmitter(this, expr);
		else if (expr instanceof ArrayLiteralExpression)
			return new _ArrayLiteralExpressionEmitter(this, expr);
		else if (expr instanceof MapLiteralExpression)
			return new _MapLiteralExpressionEmitter(this, expr);
		else if (expr instanceof ThisExpression)
			return new _ThisExpressionEmitter(this, expr);
		else if (expr instanceof BitwiseNotExpression)
			return new _UnaryExpressionEmitter(this, expr);
		else if (expr instanceof InstanceofExpression)
			return new _InstanceofExpressionEmitter(this, expr);
		else if (expr instanceof AsExpression)
			return new _AsExpressionEmitter(this, expr);
		else if (expr instanceof AsNoConvertExpression)
			return new _AsNoConvertExpressionEmitter(this, expr);
		else if (expr instanceof LogicalNotExpression)
			return new _UnaryExpressionEmitter(this, expr);
		else if (expr instanceof TypeofExpression)
			return new _UnaryExpressionEmitter(this, expr);
		else if (expr instanceof PostIncrementExpression)
			return new _PostfixExpressionEmitter(this, expr);
		else if (expr instanceof PreIncrementExpression)
			return new _UnaryExpressionEmitter(this, expr);
		else if (expr instanceof PropertyExpression)
			return new _PropertyExpressionEmitter(this, expr);
		else if (expr instanceof SignExpression)
			return new _UnaryExpressionEmitter(this, expr);
		else if (expr instanceof AdditiveExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof ArrayExpression)
			return new _ArrayExpressionEmitter(this, expr);
		else if (expr instanceof AssignmentExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof BinaryNumberExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof EqualityExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof InExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof LogicalExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof ShiftExpression)
			return new _BinaryExpressionEmitter(this, expr);
		else if (expr instanceof ConditionalExpression)
			return new _ConditionalExpressionEmitter(this, expr);
		else if (expr instanceof CallExpression)
			return new _CallExpressionEmitter(this, expr);
		else if (expr instanceof SuperExpression)
			return new _SuperExpressionEmitter(this, expr);
		else if (expr instanceof NewExpression)
			return new _NewExpressionEmitter(this, expr);
		else if (expr instanceof FunctionExpression)
			return new _FunctionExpressionEmitter(this, expr);
		else if (expr instanceof CommaExpression)
			return new _CommaExpressionEmitter(this, expr);
		throw new Error("got unexpected type of expression: " + (expr != null ? JSON.stringify(expr.serialize()) : expr));
	},

	_mangleConstructorName: function (classDef, argTypes) {
		if ((classDef.flags() & ClassDefinition.IS_NATIVE) != 0) {
			if (classDef instanceof InstantiatedClassDefinition) {
				if (classDef.getTemplateClassName() == "Map") {
					return "Object";
				} else {
					return classDef.getTemplateClassName();
				}
			} else {
				return classDef.className();
			}
		}
		return classDef.getOutputClassName() + this._mangleFunctionArguments(argTypes);
	},

	_mangleFunctionName: function (name, argTypes) {
		// NOTE: how mangling of "toString" is omitted is very hacky, but it seems like the easiest way, taking the fact into consideration that it is the only function in Object
		if (name != "toString")
			name += this._mangleFunctionArguments(argTypes);
		return name;
	},

	_mangleTypeName: function (type) {
		if (type.equals(Type.voidType))
			return "V";
		else if (type.equals(Type.booleanType))
			return "B";
		else if (type.equals(Type.integerType))
			return "I";
		else if (type.equals(Type.numberType))
			return "N";
		else if (type.equals(Type.stringType))
			return "S";
		else if (type instanceof ObjectType) {
			var classDef = type.getClassDef();
			if (classDef instanceof InstantiatedClassDefinition) {
				var typeArgs = classDef.getTypeArguments();
				switch (classDef.getTemplateClassName()) {
				case "Array":
					return "A" + this._mangleTypeName(typeArgs[0]);
				case "Map":
					return "H" + this._mangleTypeName(typeArgs[0]);
				default:
					throw new Error("unexpected template type: " + classDef.getTemplateClassName());
				}
			}
			return "L" + type.getClassDef().getOutputClassName() + "$";
		} else if (type instanceof StaticFunctionType)
			return "F" + this._mangleFunctionArguments(type.getArgumentTypes()) + this._mangleTypeName(type.getReturnType()) + "$";
		else if (type instanceof MemberFunctionType)
			return "M" + this._mangleTypeName(type.getObjectType()) + this._mangleFunctionArguments(type.getArgumentTypes()) + this._mangleTypeName(type.getReturnType()) + "$";
		else if (type instanceof MayBeUndefinedType)
			return "U" + this._mangleTypeName(type.getBaseType());
		else if (type.equals(Type.variantType))
			return "X";
		else
			throw new Error("FIXME " + type.toString());
	},

	_mangleFunctionArguments: function (argTypes) {
		var s = "$";
		for (var i = 0; i < argTypes.length; ++i)
			s += this._mangleTypeName(argTypes[i]);
		return s;
	},

	_mangleTypeString: function (s) {
		return s.length + s;
	},

	_findFunctions: function (classDef, name, isStatic) {
		var functions = [];
		var members = classDef.members();
		for (var i = 0; i < members.length; ++i) {
			var member = members[i];
			if ((member instanceof MemberFunctionDefinition) && member.name() == name
				&& (member.flags() & ClassDefinition.IS_STATIC) == (isStatic ? ClassDefinition.IS_STATIC : 0))
				functions.push(member);
		}
		return functions;
	},

	_emitCallArguments: function (token, prefix, args, argTypes) {
		this._emit(prefix, token);
		for (var i = 0; i < args.length; ++i) {
			if (i != 0 || prefix[prefix.length - 1] != '(')
				this._emit(", ", null);
			if (argTypes != null
				&& this._enableRunTimeTypeCheck
				&& args[i].getType() instanceof MayBeUndefinedType
				&& ! (argTypes[i] instanceof MayBeUndefinedType || argTypes[i] instanceof VariantType)) {
				this._emitExpressionWithUndefinedAssertion(args[i]);
			} else {
				this._getExpressionEmitterFor(args[i]).emit(0);
			}
		}
		this._emit(")", token);
	},

	_emitAssertion: function (emitTestExpr, token, message) {
		this._emit("if (! (", token);
		emitTestExpr();
		this._emit(")) {\n", null);
		this._advanceIndent();
		this._emit("debugger;\n", null);
		// FIXME make the expression source and throw a fit exception class
		var err = Util.format('throw new Error("[%1:%2] %3");\n',
							  [token.getFilename(), token.getLineNumber(), message]);
		this._emit(err, null);
		this._reduceIndent();
		this._emit("}\n", null);
	},

	_emitExpressionWithUndefinedAssertion: function (expr) {
		var token = expr.getToken();
		this._emit("(function (v) {\n", token);
		this._advanceIndent();
		this._emitAssertion(function () {
			this._emit("typeof v !== \"undefined\"", token);
		}.bind(this), token, "detected misuse of 'undefined' as type '" + expr.getType().resolveIfMayBeUndefined().toString() + "'");
		this._emit("return v;\n", token);
		this._reduceIndent();
		this._emit("}(", token);
		this._getExpressionEmitterFor(expr).emit(0);
		this._emit("))", token);
	},

	_emitRHSOfAssignment: function (expr, lhsType) {
		var exprType = expr.getType();
		// FIXME what happens if the op is /= or %= ?
		if (lhsType.resolveIfMayBeUndefined().equals(Type.integerType) && exprType.equals(Type.numberType)) {
			if (expr instanceof NumberLiteralExpression
				|| expr instanceof IntegerLiteralExpression) {
				this._emit((expr.getToken().getValue() | 0).toString(), expr.getToken());
			} else {
				this._emit("(", expr.getToken());
				this._getExpressionEmitterFor(expr).emit(_BinaryExpressionEmitter._operatorPrecedence["|"]);
				this._emit(" | 0)", expr.getToken());
			}
			return;
		}
		if (lhsType.equals(Type.integerType)
			&& (exprType instanceof MayBeUndefinedType && exprType.getBaseType().equals(Type.numberType))) {
			this._emit("(", expr.getToken());
			if (this._enableRunTimeTypeCheck) {
				this._emitExpressionWithUndefinedAssertion(expr);
			} else {
				this._getExpressionEmitterFor(expr).emit(_BinaryExpressionEmitter._operatorPrecedence["|"]);
			}
			this._emit(" | 0)", expr.getToken());
			return;
		}
		if ((lhsType instanceof MayBeUndefinedType && lhsType.getBaseType().equals(Type.integerType))
			&& (exprType instanceof MayBeUndefinedType && exprType.getBaseType().equals(Type.numberType))) {
			// NOTE this is very slow, but such an operation would practically not be found
			this._emit("(function (v) { return v !== undefined ? v | 0 : v; })(", expr.getToken());
			this._getExpressionEmitterFor(expr).emit(0);
			this._emit(")", expr.getToken());
			return;
		}
		// normal mode
		if (this._enableRunTimeTypeCheck
			&& ! (lhsType instanceof MayBeUndefinedType || lhsType.equals(Type.variantType))
			&& exprType instanceof MayBeUndefinedType) {
			this._emitExpressionWithUndefinedAssertion(expr);
		} else {
			this._getExpressionEmitterFor(expr).emit(_BinaryExpressionEmitter._operatorPrecedence["="]);
		}
	},

	$constructor: function () {
		var precedence = [
			[
				[ "new",        _NewExpressionEmitter._setOperatorPrecedence ],
				[ "[",          _ArrayExpressionEmitter._setOperatorPrecedence ],
				[ ".",          _PropertyExpressionEmitter._setOperatorPrecedence ],
				[ "(",          _CallExpressionEmitter._setOperatorPrecedence ],
				[ "super",      _SuperExpressionEmitter._setOperatorPrecedence ],
				[ "function",   _FunctionExpressionEmitter._setOperatorPrecedence ],
			], [
				[ "++",         _PostfixExpressionEmitter._setOperatorPrecedence ],
				[ "--",         _PostfixExpressionEmitter._setOperatorPrecedence ]
			], [
				// delete is not used by JSX
				[ "void",       _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "typeof",     _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "++",         _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "--",         _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "+",          _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "-",          _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "~",          _UnaryExpressionEmitter._setOperatorPrecedence ],
				[ "!",          _UnaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "*",          _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "/",          _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "%",          _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "+",          _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "-",          _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "<<",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ ">>",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ ">>>",        _BinaryExpressionEmitter._setOperatorPrecedence ],
			], [
				[ "<",          _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ ">",          _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "<=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ ">=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "instanceof", _InstanceofExpressionEmitter._setOperatorPrecedence ],
				[ "in",         _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "==",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "!=",         _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "&",          _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "^",          _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "|",          _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "&&",         _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "||",         _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "=",          _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "*=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "/=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "%=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "+=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "-=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "<<=",        _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ ">>=",        _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ ">>>=",       _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "&=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "^=",         _BinaryExpressionEmitter._setOperatorPrecedence ],
				[ "|=",         _BinaryExpressionEmitter._setOperatorPrecedence ]
			], [
				[ "?",          _ConditionalExpressionEmitter._setOperatorPrecedence ]
			], [
				[ ",",          _CommaExpressionEmitter._setOperatorPrecedence ]
			]
		];
		for (var i = 0; i < precedence.length; ++i) {
			var opTypeList = precedence[i];
			for (var j = 0; j < opTypeList.length; ++j)
				opTypeList[j][1](opTypeList[j][0], -(precedence.length - i));
		}
	}

});
// vim: set noexpandtab:

});require.register("jssourcemap.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");

"use strict";

var SourceMapGenerator = exports.SourceMapGenerator = Class.extend({

	constructor: function (outputFile, sourceRoot) {
		var sourceMap = require("source-map"); // lazy load for web
		// XXX: monkey-patch to avoid source-map (0.1.0)'s bug
		sourceMap.SourceMapGenerator.prototype._validateMapping = function () {};

		this._outputFile = outputFile;
		this._impl = new sourceMap.SourceMapGenerator({
			file: outputFile,
			sourceRoot: sourceRoot // optional
		});
	},

	add: function (generatedPos, originalPos, sourceFile, tokenName) {
		this._impl.addMapping({
			generated: generatedPos,
			original:  originalPos,
			source: sourceFile, // optional
			name: tokenName // optional
		});
	},

	getSourceMappingFile: function () {
		return this._outputFile + ".mapping";
	},

	generate: function () {
		return this._impl.toString();
	},

	magicToken: function () {
		return "\n" + "//@ sourceMappingURL=" +
			this.getSourceMappingFile() + "\n";
	}
});


});require.register("optimizer.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./classdef"));
eval(Class.$import("./parser"));
eval(Class.$import("./expression"));
eval(Class.$import("./statement"));
eval(Class.$import("./type"));
eval(Class.$import("./util"));

"use strict";

var _Util = exports._Util = Class.extend({

	$numberOfStatements: function (statements) {
		var n = 0;
		Util.forEachStatement(function onStatement(statement) {
			++n;
			return statement.forEachStatement(onStatement.bind(this));
		});
		return n;
	},

	$handleSubStatements: function (cb, statement) {
		var ret = false;
		if (statement instanceof ContinuableStatement) {
			if (cb(statement.getStatements()))
				ret = true;
		} else if (statement instanceof IfStatement) {
			if (cb(statement.getOnTrueStatements()))
				ret = true;
			if (cb(statement.getOnFalseStatements()))
				ret = true;
		} else if (statement instanceof SwitchStatement) {
			if (cb(statement.getStatements()))
				ret = true;
		} else if (statement instanceof TryStatement) {
			if (cb(statement.getTryStatements()))
				ret = true;
			if (cb(statement.getCatchStatements()))
				ret = true;
			if (cb(statement.getFinallyStatements()))
				ret = true;
		} else if (statement instanceof CatchStatement) {
			if (cb(statement.getStatements()))
				ret = true;
		}
		return ret;
	},

	$getFuncName : function (funcDef) {
		var classDef = funcDef.getClassDef();
		var s = (classDef != null ? classDef.className(): "<<unknown>>");
		s += (funcDef.flags() & ClassDefinition.IS_STATIC) != 0 ? "." : "#";
		s += funcDef.getNameToken() != null ? funcDef.name() : "<<unknown>>";
		s += "(";
		var argTypes = funcDef.getArgumentTypes();
		for (var i = 0; i < argTypes.length; ++i) {
			if (i != 0)
				s += ", ";
			s += ":" + argTypes[i].toString();
		}
		s += ")";
		return s;
	}

});

var Optimizer = exports.Optimizer = Class.extend({

	constructor: function () {
		this._compiler = null;
		this._commands = [];
		this._log = [];
		this._dumpLogs = false;
		this._enableRunTimeTypeCheck = true;
	},

	setup: function (cmds) {

		for (var i = 0; i < cmds.length; ++i) {
			var cmd = cmds[i];
			if (cmd == "lto") {
				this._commands.push(new _LinkTimeOptimizationCommand());
			} else if (cmd == "no-assert") {
				this._commands.push(new _NoAssertCommand());
			} else if (cmd == "no-log") {
				this._commands.push(new _NoLogCommand());
			} else if (cmd == "fold-const") {
				this._commands.push(new _FoldConstantCommand());
			} else if (cmd == "inline") {
				this._commands.push(new _DetermineCalleeCommand());
				this._commands.push(new _InlineOptimizeCommand());
			} else if (cmd == "return-if") {
				this._commands.push(new _ReturnIfOptimizeCommand());
			} else if (cmd == "dump-logs") {
				this._dumpLogs = true;
			} else {
				return "unknown optimization command: " + cmd;
			}
		}

		// move lto to top
		for (var i = 0; i < this._commands.length; ++i)
			if (this._commands[i] instanceof _LinkTimeOptimizationCommand)
				break;
		if (i != this._commands.length)
			this._commands.unshift(this._commands.splice(i, 1)[0]);

		return null;
	},

	enableRuntimeTypeCheck: function () {
		return this._enableRunTimeTypeCheck;
	},

	setEnableRunTimeTypeCheck: function (mode) {
		this._enableRunTimeTypeCheck = mode;
	},

	setCompiler: function (compiler) {
		this._compiler = compiler;
		return this;
	},

	getCompiler: function () {
		return this._compiler;
	},

	performOptimization: function () {
		for (var i = 0; i < this._commands.length; ++i) {
			try {
				this.log("starting optimizer: " + this._commands[i]._identifier);
				this._commands[i].setup(this).performOptimization();
				this.log("finished optimizer: " + this._commands[i]._identifier);
			} catch (e) {
				console.error("optimizer '" + this._identifier + "' died unexpectedly, dumping the logs");
				this.dumpLogs(this._log);
				throw e;
			}
		}
		if (this._dumpLogs)
			this.dumpLogs();
	},

	log: function (message) {
		this._log.push(message);
	},

	dumpLogs: function () {
		for (var i = 0; i < this._log.length; ++i) {
			console.error(this._log[i]);
		}
	}

});

var _OptimizeCommand = exports._OptimizeCommand = Class.extend({

	constructor: function (identifier) {
		this._identifier = identifier;
		this._optimizer = null;
	},

	setup: function (optimizer) {
		this._optimizer = optimizer;
		return this;
	},

	getCompiler: function () {
		return this._optimizer.getCompiler();
	},

	performOptimization: null, // function performOptimization() : void

	getStash: function (stashable) {
		var stash = stashable.getOptimizerStash();
		if (stash[this._identifier] == null) {
			stash[this._identifier] = this._createStash();
		}
		return stash[this._identifier];
	},

	_createStash: function () {
		throw new Error("if you are going to use the stash, you need to override this function");
	},

	log: function (message) {
		this._optimizer.log("[" + this._identifier + "] " + message);
	},

	setupCommand: function (command) {
		command.setup(this._optimizer);
		return command;
	}

});

var _FunctionOptimizeCommand = exports._FunctionOptimizeCommand = _OptimizeCommand.extend({

	constructor: function (identifier) {
		_OptimizeCommand.prototype.constructor.call(this, identifier);
	},

	performOptimization: function () {
		this.getCompiler().forEachClassDef(function (parser, classDef) {
			if ((classDef.flags() & ClassDefinition.IS_NATIVE) == 0) {
				classDef.forEachMemberFunction(function (funcDef) {
					if ((funcDef.flags() & (ClassDefinition.IS_NATIVE | ClassDefinition.IS_ABSTRACT)) == 0) {
						this.log("starting optimization of " + _Util.getFuncName(funcDef));
						this.optimizeFunction(funcDef);
						this.log("finished optimization of " + _Util.getFuncName(funcDef));
					}
					return true;
				}.bind(this));
			}
			return true;
		}.bind(this));
	},

	optimizeFunction: null // function (:MemberFunctionDefinition) : void

});

var _LinkTimeOptimizationCommand = exports._LinkTimeOptimizationCommand = _OptimizeCommand.extend({

	$IDENTIFIER: "lto",

	constructor: function () {
		_OptimizeCommand.prototype.constructor.call(this, _LinkTimeOptimizationCommand.IDENTIFIER);
	},

	_createStash: function () {
		return {
			extendedBy: []
		};
	},

	performOptimization: function () {
		// set extendedBy for every class
		this.getCompiler().forEachClassDef(function (parser, classDef) {
			if (classDef.extendClassDef() != null)
				this.getStash(classDef.extendClassDef()).extendedBy.push(classDef);
			for (var i = 0; i < classDef.implementClassDefs().length; ++i)
				this.getStash(classDef.implementClassDefs()[i]).extendedBy.push(classDef);
			return true;
		}.bind(this));
		// mark classes / functions that are not derived / overridden as final
		this.getCompiler().forEachClassDef(function (parser, classDef) {

			if ((classDef.flags() & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN | ClassDefinition.IS_NATIVE | ClassDefinition.IS_FINAL)) == 0
				&& this.getStash(classDef).extendedBy.length == 0) {

				// found a class that is not extended, mark it and its functions as final
				this.log("marking class as final: " + classDef.className());
				classDef.setFlags(classDef.flags() | ClassDefinition.IS_FINAL);
				classDef.forEachMemberFunction(function (funcDef) {
					if ((funcDef.flags() & (ClassDefinition.IS_STATIC | ClassDefinition.IS_FINAL)) == 0)
						funcDef.setFlags(funcDef.flags() | ClassDefinition.IS_FINAL);
					return true;
				}.bind(this));

			} else if ((classDef.flags() & (ClassDefinition.IS_NATIVE | ClassDefinition.IS_FINAL)) == 0) {

				// adjust flags of functions
				classDef.forEachMemberFunction(function (funcDef) {
					if ((funcDef.flags() & (ClassDefinition.IS_STATIC | ClassDefinition.IS_NATIVE | ClassDefinition.IS_FINAL)) != 0) {
						// ignore static, native, or final functions
					} else if ((funcDef.flags() & ClassDefinition.IS_ABSTRACT) == 0) {
						// mark functions that are not being overridden as final
						if (funcDef.getStatements() == null)
							throw new Error("a non-native, non-abstract function with out function body?");
						var overrides = this._getOverrides(this.getStash(classDef).extendedBy, funcDef.name(), funcDef.getArgumentTypes());
						if (overrides.length == 0) {
							this.log("marking function as final: " + classDef.className() + "#" + funcDef.name());
							funcDef.setFlags(funcDef.flags() | ClassDefinition.IS_FINAL);
						} else {
							this.log("function has overrides, not marking as final: " + classDef.className() + "#" + funcDef.name());
						}
					} else if ((funcDef.flags() & ClassDefinition.IS_ABSTRACT) != 0) {
						/*
							FIXME determine if there is only one implementation, and if so, inline the calls to the function.
							Note that  the implementation of the function may exist in the base classes of one of the classes that
							implement the interface, or in the mixins that are implemented by the extending class.
						*/
					}
					return true;
				}.bind(this));
			}

			return true;

		}.bind(this));
	},

	_getOverrides: function (classDefs, name, argTypes) {
		var overrides = [];
		for (var i = 0; i < classDefs.length; ++i)
			overrides = overrides.concat(this._getOverridesByClass(classDefs[i], name, argTypes));
		return overrides;
	},

	_getOverridesByClass: function (classDef, name, argTypes) {
		var overrides = this._getOverrides(this.getStash(classDef).extendedBy, name, argTypes);
		classDef.forEachMemberFunction(function (funcDef) {
			if (funcDef.name() == name
				&& (funcDef.flags() & ClassDefinition.IS_ABSTRACT) == 0
				&& Util.typesAreEqual(funcDef.getArgumentTypes(), argTypes)) {
				overrides.push(funcDef);
				return false; // finish looking into the class
			}
			return true;
		}.bind(this));
		return overrides;
	}

});

var _NoAssertCommand = exports._NoAssertCommand = _FunctionOptimizeCommand.extend({

	constructor: function () {
		_FunctionOptimizeCommand.prototype.constructor.call(this, "no-assert");
	},

	optimizeFunction: function (funcDef) {
		this._optimizeStatements(funcDef.getStatements());
	},

	_optimizeStatements: function (statements) {
		for (var i = 0; i < statements.length;) {
			if (statements[i] instanceof AssertStatement) {
				statements.splice(i, 1);
			} else {
				_Util.handleSubStatements(this._optimizeStatements.bind(this), statements[i]);
				++i;
			}
		}
	}

});

var _NoLogCommand = exports._NoAssertCommand = _FunctionOptimizeCommand.extend({

	constructor: function () {
		_FunctionOptimizeCommand.prototype.constructor.call(this, "no-log");
	},

	optimizeFunction: function (funcDef) {
		this._optimizeStatements(funcDef.getStatements());
	},

	_optimizeStatements: function (statements) {
		for (var i = 0; i < statements.length;) {
			if (statements[i] instanceof LogStatement) {
				statements.splice(i, 1);
			} else {
				_Util.handleSubStatements(this._optimizeStatements.bind(this), statements[i]);
				++i;
			}
		}
	}

});

var _DetermineCalleeCommand = exports._DetermineCalleeCommand = _FunctionOptimizeCommand.extend({

	$IDENTIFIER: "determine-callee",

	constructor: function () {
		_FunctionOptimizeCommand.prototype.constructor.call(this, _DetermineCalleeCommand.IDENTIFIER);
	},

	_createStash: function () {
		return {
			callingFuncDef: null
		};
	},

	optimizeFunction: function (funcDef) {
		funcDef.forEachClosure(function (funcDef) {
			this.optimizeFunction(funcDef);
		}.bind(this));

		funcDef.forEachStatement(function onStatement(statement) {

			if (statement instanceof ConstructorInvocationStatement) {
				// invocation of super-class ctor
				var callingFuncDef = _DetermineCalleeCommand.findCallingFunctionInClass(
					statement.getConstructingClassDef(),
					"constructor",
					statement.getConstructorType().getArgumentTypes(),
					false);
				if (callingFuncDef == null)
					throw new Error("could not determine the associated parent ctor");
				this._setCallingFuncDef(statement, callingFuncDef);
			}

			statement.forEachExpression(function onExpr(expr) {
				if (expr instanceof CallExpression) {
					// call expression
					var calleeExpr = expr.getExpr();
					if (calleeExpr instanceof PropertyExpression && ! calleeExpr.getType().isAssignable()) {
						// is referring to function (not a value of function type)
						var holderType = calleeExpr.getHolderType();
						var callingFuncDef = _DetermineCalleeCommand.findCallingFunction(
								holderType.getClassDef(),
								calleeExpr.getIdentifierToken().getValue(),
								calleeExpr.getType().getArgumentTypes(),
								holderType instanceof ClassDefType);
						this._setCallingFuncDef(expr, callingFuncDef);
					} else if (calleeExpr instanceof FunctionExpression) {
						this._setCallingFuncDef(expr, calleeExpr.getFuncDef());
					} else {
						this._setCallingFuncDef(expr, null);
					}
				} else if (expr instanceof NewExpression) {
					/*
						For now we do not do anything here, since all objects should be created by the JS new operator,
						or will fail in operations like obj.func().
					*/
				}
				return expr.forEachExpression(onExpr.bind(this));
			}.bind(this));

			return statement.forEachStatement(onStatement.bind(this));
		}.bind(this));
	},

	_setCallingFuncDef: function (stashable, funcDef) {
		this.getStash(stashable).callingFuncDef = funcDef;
	},

	$findCallingFunctionInClass: function (classDef, funcName, argTypes, isStatic) {
		var found = null;
		classDef.forEachMemberFunction(function (funcDef) {
			if (isStatic == ((funcDef.flags() & ClassDefinition.IS_STATIC) != 0)
				&& funcDef.name() == funcName
				&& Util.typesAreEqual(funcDef.getArgumentTypes(), argTypes)) {
				found = funcDef;
				return false;
			}
			return true;
		});
		// only return if the found function is final
		if (found != null) {
			if ((found.flags() & (ClassDefinition.IS_STATIC | ClassDefinition.IS_FINAL)) == 0)
				found = null;
		}
		return found;
	},

	$findCallingFunction: function (classDef, funcName, argTypes, isStatic) {
		var found = null;
		// find the first declaration
		classDef.forEachClassToBase(function (classDef) {
			if ((found = _DetermineCalleeCommand.findCallingFunctionInClass(classDef, funcName, argTypes, isStatic)) != null)
				return false;
			return true;
		});
		return found;
	},

	$getCallingFuncDef: function (stashable) {
		var stash = stashable.getOptimizerStash()[_DetermineCalleeCommand.IDENTIFIER];
		if (stash === undefined)
			throw new Error("callee not searched");
		return stash.callingFuncDef;
	}

});

// propagates constants
var _FoldConstantCommand = exports._FoldConstantCommand = _FunctionOptimizeCommand.extend({

	constructor: function () {
		_FunctionOptimizeCommand.prototype.constructor.call(this, "fold-const");
	},

	_createStash: function () {
		return {
			isOptimized: false // boolean
		};
	},

	optimizeFunction: function (funcDef) {
		funcDef.forEachStatement(function onStatement(statement) {
			statement.forEachStatement(onStatement.bind(this));
			statement.forEachExpression(this._optimizeExpression.bind(this));
			return true;
		}.bind(this));
		funcDef.forEachClosure(function (funcDef) {
			this.optimizeFunction(funcDef);
			return true;
		}.bind(this));
	},

	_optimizeExpression: function (expr, replaceCb) {

		// optimize subexprs
		expr.forEachExpression(this._optimizeExpression.bind(this));

		// propagate const

		if (expr instanceof PropertyExpression) {

			// property expression
			var holderType = expr.getHolderType();
			if (holderType instanceof ClassDefType) {
				var member = null;
				holderType.getClassDef().forEachMemberVariable(function (m) {
					if (m instanceof MemberVariableDefinition && m.name() == expr.getIdentifierToken().getValue())
						member = m;
					return member == null;
				});
				if (member != null && (member.flags() & ClassDefinition.IS_CONST) != 0) {
					this._foldStaticConst(member);
					var foldedExpr = this._toFoldedExpr(member.getInitialValue(), member.getType());
					if (foldedExpr != null) {
						foldedExpr = this._toFoldedExpr(foldedExpr, expr.getType());
						if (foldedExpr != null) {
							replaceCb(foldedExpr);
						}
					}
				}
			}

		} else if (expr instanceof SignExpression) {

			// sign expression
			var calculateCb;
			switch (expr.getToken().getValue()) {
			case "+": calculateCb = function (x) { return +x; }; break;
			case "-": calculateCb = function (x) { return -x; }; break;
			default:
				return;
			}
			this.log("folding operator '" + expr.getToken().getValue() + "' at '" + expr.getToken().getFilename() + ":" + expr.getToken().getLineNumber());
			var baseExpr = expr.getExpr();
			if (baseExpr instanceof IntegerLiteralExpression) {
				replaceCb(new IntegerLiteralExpression(new Token(calculateCb(+baseExpr.getToken().getValue()), null)));
			} else if (baseExpr instanceof NumberLiteralExpression) {
				replaceCb(new NumberLiteralExpression(new Token(calculateCb(+baseExpr.getToken().getValue()), null)));
			}

		} else if (expr instanceof AdditiveExpression) {

			// additive expression
			var firstExpr = expr.getFirstExpr();
			var secondExpr = expr.getSecondExpr();
			if (this._isIntegerOrNumberLiteralExpression(firstExpr)) {
				// type of second expr is checked by the callee
				this._foldNumericBinaryExpression(expr, replaceCb);
			} else if (firstExpr instanceof StringLiteralExpression && secondExpr instanceof StringLiteralExpression) {
				replaceCb(
					new StringLiteralExpression(
						new Token(
							Util.encodeStringLiteral(
								Util.decodeStringLiteral(firstExpr.getToken().getValue()) +
								Util.decodeStringLiteral(secondExpr.getToken().getValue())),
							null)));
			}

		} else if (expr instanceof EqualityExpression) {

			this._foldEqualityExpression(expr, replaceCb);

		} else if (expr instanceof BinaryNumberExpression || expr instanceof ShiftExpression) {

			// binary number (or shift) expression
			this._foldNumericBinaryExpression(expr, replaceCb);

		} else if (expr instanceof AsExpression) {

			// convert "literal as string"
			if (expr.getType().equals(Type.stringType)) {
				var baseExpr = expr.getExpr();
				if (baseExpr instanceof BooleanLiteralExpression || baseExpr instanceof NumberLiteralExpression || baseExpr instanceof IntegerLiteralExpression) {
					replaceCb(
						new StringLiteralExpression(
							new Token(Util.encodeStringLiteral(baseExpr.getToken().getValue()), null)));
				}
			}

		}

		return true;
	},

	_foldEqualityExpression: function (expr, replaceCb) {
		var firstExpr = expr.getFirstExpr();
		var secondExpr = expr.getSecondExpr();
		var isEqual = undefined; // tri-state
		if (firstExpr instanceof StringLiteralExpression && secondExpr instanceof StringLiteralExpression) {
			isEqual = Util.decodeStringLiteral(firstExpr.getToken().getValue()) == Util.decodeStringLiteral(secondExpr.getToken().getValue());
		} else if (this._isIntegerOrNumberLiteralExpression(firstExpr) && this._isIntegerOrNumberLiteralExpression(secondExpr)) {
			isEqual = +firstExpr.getToken().getValue() == +secondExpr.getToken().getValue();
		}
		if (isEqual !== undefined) {
			var result = expr.getToken().getValue() == "==" ? isEqual : ! isEqual;
			replaceCb(new BooleanLiteralExpression(new Token(result ? "true" : "false", false)));
		}
	},

	_foldNumericBinaryExpression: function (expr, replaceCb) {
		// handles BinaryNumberExpression _and_ AdditiveExpression of numbers or integers
		if (this._isIntegerOrNumberLiteralExpression(expr.getFirstExpr())
			&& this._isIntegerOrNumberLiteralExpression(expr.getSecondExpr())) {
			// ok
		} else {
			return;
		}

		switch (expr.getToken().getValue()) {

		// expressions that return number or integer depending on their types
		case "*": this._foldNumericBinaryExpressionAsNumeric(expr, replaceCb, function (x, y) { return x * y; }); break;
		case "+": this._foldNumericBinaryExpressionAsNumeric(expr, replaceCb, function (x, y) { return x + y; }); break;
		case "-": this._foldNumericBinaryExpressionAsNumeric(expr, replaceCb, function (x, y) { return x - y; }); break;

		// expressions that always return number
		case "/": this._foldNumericBinaryExpressionAsNumber(expr, replaceCb, function (x, y) { return x / y; }); break;
		case "%": this._foldNumericBinaryExpressionAsNumber(expr, replaceCb, function (x, y) { return x % y; }); break;

		// expressions that always return integer
		case ">>>": this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, function (x, y) { return x >>> y; }); break;
		case ">>": this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, function (x, y) { return x >> y; }); break;
		case "<<": this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, function (x, y) { return x << y; }); break;
		case "&": this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, function (x, y) { return x & y; }); break;
		case "|": this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, function (x, y) { return x | y; }); break;
		case "^": this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, function (x, y) { return x ^ y; }); break;

		}
	},

	_foldNumericBinaryExpressionAsNumeric: function (expr, replaceCb, calcCb) {
		if (expr.getFirstExpr() instanceof IntegerLiteralExpression && expr.getSecondExpr() instanceof IntegerLiteralExpression) {
			return this._foldNumericBinaryExpressionAsInteger(expr, replaceCb, calcCb);
		} else {
			return this._foldNumericBinaryExpressionAsNumber(expr, replaceCb, calcCb);
		}
	},

	_foldNumericBinaryExpressionAsInteger: function (expr, replaceCb, calcCb) {
		var value = calcCb(+expr.getFirstExpr().getToken().getValue(), +expr.getSecondExpr().getToken().getValue());
		this.log(
			"folding operator '" + expr.getToken().getValue() + "' at " + expr.getToken().getFilename() + ":" + expr.getToken().getLineNumber() +
			" to int: " + value);
		if (value % 1 != 0)
			throw new Error("value is not an integer");
		replaceCb(new IntegerLiteralExpression(new Token(value + "", null)));
	},

	_foldNumericBinaryExpressionAsNumber: function (expr, replaceCb, calcCb) {
		var value = calcCb(+expr.getFirstExpr().getToken().getValue(), +expr.getSecondExpr().getToken().getValue());
		this.log(
			"folding operator '" + expr.getToken().getValue() + "' at " + expr.getToken().getFilename() + ":" + expr.getToken().getLineNumber() +
			" to number: " + value);
		replaceCb(new NumberLiteralExpression(new Token(value + "", null)));
	},

	_isIntegerOrNumberLiteralExpression: function (expr) {
		return expr instanceof NumberLiteralExpression || expr instanceof IntegerLiteralExpression;
	},

	_foldStaticConst: function (member) {
		// optimize only once
		if (this.getStash(member).isOptimized)
			return;
		this.getStash(member).isOptimized = true;
		// optimize
		var initialValue = member.getInitialValue();
		if (initialValue != null)
			this._optimizeExpression(initialValue, function (expr) { member.setInitialValue(expr); });
	},

	_toFoldedExpr: function (expr, type) {
		if (expr instanceof UndefinedExpression) {
			return expr;
		} else if (expr instanceof NullExpression) {
			return expr;
		} else if (expr instanceof BooleanLiteralExpression) {
			return expr;
		} else if (expr instanceof IntegerLiteralExpression) {
			return expr;
		} else if (expr instanceof NumberLiteralExpression) {
			if (type.resolveIfMayBeUndefined().equals(Type.integerType)) {
				// cast to integer
				return new IntegerLiteralExpression(new Token((expr.getToken().getValue() | 0).toString(), null));
			}
			return expr;
		} else if (expr instanceof StringLiteralExpression) {
			return expr;
		}
		return null;
	}

});

var _InlineOptimizeCommand = exports._InlineOptimizeCommand = _FunctionOptimizeCommand.extend({

	constructor: function () {
		_FunctionOptimizeCommand.prototype.constructor.call(this, "inline");
	},

	_createStash: function () {
		return {
			isOptimized: false, // boolean
			isInlineable: undefined, // tri-state
		};
	},

	optimizeFunction: function (funcDef) {
		// use flag, since functions might recurse
		if (this.getStash(funcDef).isOptimized)
			return;
		this.getStash(funcDef).isOptimized = true;

		// we need to the check here since functions might recurse
		if ((funcDef.flags() & (ClassDefinition.IS_NATIVE | ClassDefinition.IS_ABSTRACT)) != 0)
			return;
		this.log("* starting optimization of " + _Util.getFuncName(funcDef));
		var altered = false;
		while (true) {
			if (! this._handleStatements(funcDef, funcDef.getStatements()))
				break;
			altered = true;
			if (! this.setupCommand(new _ReturnIfOptimizeCommand()).optimizeFunction(funcDef))
				break;
		}
		this.log("* finished optimization of " + _Util.getFuncName(funcDef));
	},

	_handleStatements: function (funcDef, statements) {
		var altered = false;
		for (var i = 0; i < statements.length; ++i) {
			var left = statements.length - i;
			if (this._handleStatement(funcDef, statements, i))
				altered = true;
			i = statements.length - left;
		}
		return altered;
	},

	_handleStatement: function (funcDef, statements, stmtIndex) {
		var altered = false;
		var statement = statements[stmtIndex];

		// expand single-statement functions that return a value
		statement.forEachExpression(function onExpr(expr, replaceCb) {
			expr.forEachExpression(onExpr.bind(this));
			if (expr instanceof CallExpression) {
				var args = this._getArgsAndThisIfCallExprIsInlineable(expr, true);
				if (args != null) {
					var callingFuncDef = _DetermineCalleeCommand.getCallingFuncDef(expr);
					this.log("expanding " + _Util.getFuncName(callingFuncDef) + " as expression");
					var clonedExpr = callingFuncDef.getStatements()[0].getExpr().clone();
					this._rewriteExpression(
						clonedExpr,
						function (expr) { clonedExpr = expr; },
						args,
						callingFuncDef.getArguments());
					replaceCb(clonedExpr);
				}
			}
			return true;
		}.bind(this));

		// expand more complicated functions
		if (statement instanceof ConstructorInvocationStatement) {

			var callingFuncDef = _DetermineCalleeCommand.getCallingFuncDef(statement);
			this.optimizeFunction(callingFuncDef);
			if (this._functionIsInlineable(callingFuncDef) && this._argsAreInlineable(callingFuncDef, statement.getArguments(), false)) {
				statements.splice(stmtIndex, 1);
				this._expandCallingFunction(funcDef, statements, stmtIndex, callingFuncDef, statement.getArguments().concat([ new ThisExpression(null, funcDef.getClassDef()) ]));
			}

		} else if (statement instanceof ExpressionStatement) {

			if (this._expandStatementExpression(funcDef, statements, stmtIndex, statement.getExpr(), function (stmtIndex) {
				statements.splice(stmtIndex, 1);
			}.bind(this))) {
				altered = true;
			}

		} else if (statement instanceof ReturnStatement) {

			if (this._expandStatementExpression(funcDef, statements, stmtIndex, statement.getExpr(), function (stmtIndex) {
				statements.splice(stmtIndex, 1);
				statements[stmtIndex - 1] = new ReturnStatement(statement.getToken(), statements[stmtIndex - 1].getExpr());
			}.bind(this))) {
				altered = true;
			}

		} else if (statement instanceof IfStatement) {

			if (this._expandStatementExpression(funcDef, statements, stmtIndex, statement.getExpr(), function (stmtIndex) {
				statement.setExpr(statements[stmtIndex - 1].getExpr());
				statements.splice(stmtIndex - 1, 1);
			}.bind(this))) {
				altered = true;
			}
			if (this._handleSubStatements(funcDef, statement)) {
				altered = true;
			}

		} else {

			if (this._handleSubStatements(funcDef, statement)) {
				altered = true;
			}

		}

		return altered;
	},

	_handleSubStatements: function (funcDef, statement) {
		return _Util.handleSubStatements(function (statements) {
			return this._handleStatements(funcDef, statements);
		}.bind(this), statement);
	},

	// expands an expression at given location, if possible
	_expandStatementExpression: function (funcDef, statements, stmtIndex, expr, cb) {

		if (expr instanceof CallExpression) {

			// inline if the entire statement is a single call expression
			var args = this._getArgsAndThisIfCallExprIsInlineable(expr, false);
			if (args != null) {
				stmtIndex = this._expandCallingFunction(funcDef, statements, stmtIndex, _DetermineCalleeCommand.getCallingFuncDef(expr), args);
				cb(stmtIndex);
				return true;
			}

		} else if (expr instanceof AssignmentExpression
			&& this._lhsHasNoSideEffects(expr.getFirstExpr())
			&& expr.getSecondExpr() instanceof CallExpression) {

			// inline if the statement is an assignment of a single call expression into a local variable
			var args = this._getArgsAndThisIfCallExprIsInlineable(expr.getSecondExpr(), false);
			if (args != null) {
				stmtIndex = this._expandCallingFunction(funcDef, statements, stmtIndex, _DetermineCalleeCommand.getCallingFuncDef(expr.getSecondExpr()), args);
				var lastExpr = new AssignmentExpression(
					expr.getToken(),
					expr.getFirstExpr(),
					statements[stmtIndex - 1].getExpr());
				statements[stmtIndex - 1] = new ExpressionStatement(lastExpr);
				cb(stmtIndex);
				return true;
			}

		}

		return false;
	},

	_lhsHasNoSideEffects: function (lhsExpr) {
		// FIXME may have side effects if is a native type (or extends a native type)
		if (lhsExpr instanceof IdentifierExpression)
			return true;
		if (lhsExpr instanceof PropertyExpression) {
			var holderExpr = lhsExpr.getExpr();
			if (holderExpr instanceof ThisExpression)
				return true;
			if (holderExpr instanceof IdentifierExpression)
				return true;
		}
		return false;
	},

	_getArgsAndThisIfCallExprIsInlineable: function (callExpr, asExpression) {
		// determine the function that will be called
		var callingFuncDef = _DetermineCalleeCommand.getCallingFuncDef(callExpr);
		if (callingFuncDef == null)
			return null;
		// optimize the calling function prior to testing the conditions
		this.optimizeFunction(callingFuncDef);
		// obtain receiver expression
		if ((callingFuncDef.flags() & ClassDefinition.IS_STATIC) == 0) {
			var calleeExpr = callExpr.getExpr();
			if (! (calleeExpr instanceof PropertyExpression))
				throw new Error("unexpected type of expression");
			var receiverExpr = calleeExpr.getExpr();
			if (asExpression) {
				// receiver should not have side effecets
				if (! (receiverExpr instanceof IdentifierExpression || receiverExpr instanceof ThisExpression)) {
					return null;
				}
			}
		}
		// check that the function may be inlined
		if (! this._functionIsInlineable(callingFuncDef))
			return null;
		// FIXME we could handle statements.length == 0 as well
		if (asExpression && callingFuncDef.getStatements().length != 1)
			return null;
		// and the args passed can be inlined (types should match exactly (or emitters may insert additional code))
		if (! this._argsAreInlineable(callingFuncDef, callExpr.getArguments(), asExpression))
			return null;
		// build list of arguments (and this)
		var argsAndThis = callExpr.getArguments().concat([]);
		if ((callingFuncDef.flags() & ClassDefinition.IS_STATIC) == 0)
			argsAndThis.push(receiverExpr);
		return argsAndThis;
	},

	_argsAreInlineable: function (callingFuncDef, actualArgs, asExpression) {
		var formalArgsTypes = callingFuncDef.getArgumentTypes();
		if (actualArgs.length != formalArgsTypes.length)
			throw new "number of arguments mismatch";
		for (var i = 0; i < actualArgs.length; ++i) {
			if (asExpression && ! (actualArgs[i] instanceof LeafExpression))
				return false;
			if (! this._argIsInlineable(actualArgs[i].getType(), formalArgsTypes[i]))
				return false;
		}
		return true;
	},

	_argIsInlineable: function (actualType, formalType) {
		if (this._optimizer.enableRuntimeTypeCheck()) {
			if (actualType instanceof MayBeUndefinedType && ! (formalType instanceof MayBeUndefinedType)) {
				return false;
			}
		}
		// strip the MayBeUndefined wrapper and continue the comparison, or return
		actualType = actualType.resolveIfMayBeUndefined();
		formalType = formalType.resolveIfMayBeUndefined();
		if (actualType instanceof ObjectType && formalType instanceof ObjectType) {
			// if both types are object types, allow upcast
			return actualType.isConvertibleTo(formalType);
		} else {
			// perform strict type comparison, since implicit cast change their meaning (while being substituted)
			return actualType.equals(formalType);
		}
	},

	_functionIsInlineable: function (funcDef) {
		if (typeof this.getStash(funcDef).isInlineable != "boolean") {
			this.getStash(funcDef).isInlineable = function () {
				// only inline function that are short, has no branches (last statement may be a return), has no local variables (excluding arguments)
				var statements = funcDef.getStatements();
				if (statements == null)
					return false;
				if (_Util.numberOfStatements(statements) >= 5)
					return false;
				if (funcDef.getLocals().length != 0)
					return false;
				for (var i = 0; i < statements.length; ++i) {
					if (! (statements[i] instanceof ExpressionStatement))
						break;
				}
				if (! (i == statements.length || (i == statements.length - 1 && statements[i] instanceof ReturnStatement)))
					return false;
				// no modification of arguments
				var modifiesArgs = ! Util.forEachStatement(function onStatement(statement) {
					var onExpr = function onExpr(expr) {
						if (expr instanceof AssignmentExpression && expr.getFirstExpr() instanceof IdentifierExpression)
							return false;
						return expr.forEachExpression(onExpr.bind(this));
					};
					return statement.forEachExpression(onExpr.bind(this));
				}, statements);
				if (modifiesArgs) {
					return false;
				}
				// no function nor super expression
				var hasNonInlineableExpr = ! Util.forEachStatement(function onStatement(statement) {
					var onExpr = function onExpr(expr) {
						if (expr instanceof FunctionExpression)
							return false;
						if (expr instanceof SuperExpression)
							return false;
						return expr.forEachExpression(onExpr.bind(this));
					};
					return statement.forEachExpression(onExpr.bind(this));
				}.bind(this), statements);
				if (hasNonInlineableExpr) {
					return false;
				}
				return true;
			}.call(this);
			this.log(_Util.getFuncName(funcDef) + (this.getStash(funcDef).isInlineable ? " is" : " is not") + " inlineable");
		}
		return this.getStash(funcDef).isInlineable;
	},

	_expandCallingFunction: function (callerFuncDef, statements, stmtIndex, calleeFuncDef, argsAndThis) {
		// clone statements of the calling function, while rewriting the identifiers with actual arguments
		this.log("expanding " + _Util.getFuncName(calleeFuncDef));
		stmtIndex = this._createVarsForArgsAndThis(callerFuncDef, statements, stmtIndex, calleeFuncDef, argsAndThis);
		var calleeStatements = calleeFuncDef.getStatements();
		for (var i = 0; i < calleeStatements.length; ++i) {
			// clone the statement
			var statement = new ExpressionStatement(calleeStatements[i].getExpr().clone());
			// replace the arguments with actual arguments
			statement.forEachExpression(function onExpr(expr, replaceCb) {
				return this._rewriteExpression(expr, replaceCb, argsAndThis, calleeFuncDef.getArguments());
			}.bind(this));
			// insert the statement
			statements.splice(stmtIndex++, 0, statement);
		}
		return stmtIndex;
	},

	_createVarsForArgsAndThis: function (callerFuncDef, statements, stmtIndex, calleeFuncDef, argsAndThis) {
		// handle "this" first
		if ((calleeFuncDef.flags() & ClassDefinition.IS_STATIC) == 0) {
			var tempVar = this._createVarForArgOrThis(callerFuncDef, statements, stmtIndex, argsAndThis[argsAndThis.length - 1], new ObjectType(calleeFuncDef.getClassDef()), "this");
			if (tempVar != null) {
				argsAndThis[argsAndThis.length - 1] = tempVar;
				++stmtIndex;
			}
		}
		var formalArgs = calleeFuncDef.getArguments();
		for (var i = 0; i < formalArgs.length; ++i) {
			var tempVar = this._createVarForArgOrThis(callerFuncDef, statements, stmtIndex, argsAndThis[i], formalArgs[i].getType(), formalArgs[i].getName().getValue());
			if (tempVar != null) {
				argsAndThis[i] = tempVar;
				++stmtIndex;
			}
		}
		return stmtIndex;
	},

	_createVarForArgOrThis: function (callerFuncDef, statements, stmtIndex, expr, type, baseName) {
		// just pass through the expressions that do not have side effects
		if (expr instanceof ThisExpression || expr instanceof LeafExpression) {
			return null;
		}
		// create a local variable based on the given name
		var locals = callerFuncDef.getLocals();
		var nameExists = function (n) {
			for (var i = 0; i < locals.length; ++i)
				if (locals[i].getName().getValue() == n)
					return true;
			return false;
		}
		for (var i = 0; nameExists(baseName + "$" + i); ++i)
			;
		var newLocal = new LocalVariable(new Token(baseName + "$" + i, true), type);
		locals.push(newLocal);
		this.log("rewriting " + baseName + " to " + newLocal.getName().getValue());
		// insert a statement that initializes the temporary
		statements.splice(stmtIndex, 0,
			new ExpressionStatement(
				new AssignmentExpression(
					new Token("=", false),
					new IdentifierExpression(newLocal),
					expr)));
		// return an expression referring the the local
		return new IdentifierExpression(newLocal);
	},

	_rewriteExpression: function (expr, replaceCb, argsAndThis, formalArgs) {
		if (expr instanceof IdentifierExpression && expr.getLocal() != null) {
			for (var j = 0; j < formalArgs.length; ++j) {
				if (formalArgs[j].getName().getValue() == expr.getToken().getValue())
					break;
			}
			if (j == formalArgs.length)
				throw new Error("logic flaw, could not find formal parameter named " + expr.getToken().getValue());
			replaceCb(argsAndThis[j].clone());
		} else if (expr instanceof ThisExpression) {
			replaceCb(argsAndThis[argsAndThis.length - 1].clone());
		}
		expr.forEachExpression(function (expr, replaceCb) {
			return this._rewriteExpression(expr, replaceCb, argsAndThis, formalArgs);
		}.bind(this));
		return true;
	}

});

/*
	for the reasoning of this optimization see http://jsperf.com/if-vs-condexpr
*/
var _ReturnIfOptimizeCommand = exports._ReturnIfOptimizeCommand = _FunctionOptimizeCommand.extend({

	constructor: function () {
		_FunctionOptimizeCommand.prototype.constructor.call(this, "return-if");
	},

	optimizeFunction: function (funcDef) {
		if (funcDef.getReturnType().equals(Type.voidType))
			return;

		this._altered = false;
		this._optimizeStatements(funcDef.getStatements());
		this.log(_Util.getFuncName(funcDef) + " " + (this._altered ? "Y" : "N"));
		return this._altered;
	},

	_statementsCanBeReturnExpr: function (statements) {
		if (statements.length == 1 && statements[0] instanceof ReturnStatement) {
			return true;
		}
		this._optimizeStatements(statements);
		if (statements.length == 1 && statements[0] instanceof ReturnStatement) {
			return true;
		}
		return false;
	},

	_optimizeStatements: function (statements) {
		if (statements.length >= 1
			&& statements[statements.length - 1] instanceof IfStatement) {
			// optimize: if (x) return y; else return z;
			var ifStatement = statements[statements.length - 1];
			if (this._statementsCanBeReturnExpr(ifStatement.getOnTrueStatements())
				&& this._statementsCanBeReturnExpr(ifStatement.getOnFalseStatements())) {
				statements[statements.length - 1] = this._createReturnStatement(
					ifStatement.getToken(),
					ifStatement.getExpr(),
					ifStatement.getOnTrueStatements()[0].getExpr(),
					ifStatement.getOnFalseStatements()[0].getExpr());
				this._altered = true;
				this._optimizeStatements(statements);
			}
		} else if (statements.length >= 2
			&& statements[statements.length - 1] instanceof ReturnStatement
			&& statements[statements.length - 2] instanceof IfStatement) {
			var ifStatement = statements[statements.length - 2];
			if (this._statementsCanBeReturnExpr(ifStatement.getOnTrueStatements())) {
				// optimize: if (x) return y; return z;
				var onFalseStatements = ifStatement.getOnFalseStatements();
				if (onFalseStatements.length == 0) {
					statements.splice(
						statements.length - 2,
						2,
						this._createReturnStatement(
							ifStatement.getToken(),
							ifStatement.getExpr(),
							ifStatement.getOnTrueStatements()[0].getExpr(),
							statements[statements.length - 1].getExpr()));
					this._altered = true;
					this._optimizeStatements(statements);
				} else if (onFalseStatements.length == 1
						&& onFalseStatements[0] instanceof IfStatement
						&& onFalseStatements[0].getOnFalseStatements().length == 0) {
					/*
						handles the case below, by moving the last return statement into the (unseen) else clause
							if (x) {
								return 0;
							} else if (y) {
								return 1;
							}
							return 2;
					*/
					onFalseStatements[0].getOnFalseStatements().push(statements[statements.length - 1]);
					statements.pop();
					this._altered = true;
					this._optimizeStatements(statements);
				}
			}
		}
	},

	_createReturnStatement: function (token, condExpr, trueExpr, falseExpr) {
		return new ReturnStatement(
			token,
			new ConditionalExpression(
				new Token("?", false),
				condExpr,
				trueExpr,
				falseExpr));
	}

});

});require.register("parser.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./type"));
eval(Class.$import("./classdef"));
eval(Class.$import("./statement"));
eval(Class.$import("./expression"));
eval(Class.$import("./util"));

"use strict";

var Token = exports.Token = Class.extend({

	constructor: function (value, isIdentifier, filename, lineNumber, columnNumber) {
		this._value = value;
		this._isIdentifier = isIdentifier;
		// two args or five args
		this._filename = filename || null;
		this._lineNumber = lineNumber || NaN;
		this._columnNumber = columnNumber || NaN;
	},

	getValue: function () {
		return this._value;
	},

	isIdentifier: function () {
		return this._isIdentifier;
	},

	getFilename: function () {
		return this._filename;
	},

	getLineNumber: function () {
		return this._lineNumber;
	},

	getColumnNumber: function () {
		return this._columnNumber;
	},

	serialize: function () {
		return [
			this._value,
			this._isIdentifier,
			this._filename,
			this._lineNumber,
			this._columnNumber
		];
	}

});
Token.prototype.__defineGetter__("filename", function () { throw new Error("Token#filename is removed. Use Token#getFilename() instead") });

var _Lexer = exports._TokenTable = Class.extend({

	$makeAlt: function (patterns) {
		return "(?: \n" + patterns.join("\n | \n") + "\n)\n";
	},

	$quoteMeta: function (pattern) {
		return pattern.replace(/([^0-9A-Za-z_])/g, '\\$1');
	},

	$asMap: function (array) {
		var hash = {};
		for (var i = 0; i < array.length; ++i)
			hash[array[i]] = true;
		return hash;
	},

	/// compile a regular expression
	$rx: function (pat, flags) {
		return RegExp(pat.replace(/[ \t\r\n]/g, ""), flags);
	},

	// static variables
	$constructor: function () {
		var ident         = " [a-zA-Z_] [a-zA-Z0-9_]* ";
		var doubleQuoted  = ' "  [^"\\\\]* (?: \\\\. [^"\\\\]* )* " ';
		var singleQuoted  = " '  [^'\\\\]* (?: \\\\. [^'\\\\]* )* ' ";
		var stringLiteral = this.makeAlt([singleQuoted, doubleQuoted]);
		var regexpLiteral = doubleQuoted.replace(/"/g, "/") + "[mgi]*";

		// ECMA 262 compatible,
		// see also ECMA 262 5th (7.8.3) Numeric Literals
		var decimalIntegerLiteral = "(?: 0 | [1-9][0-9]* )";
		var exponentPart = "(?: [eE] [+-]? [0-9]+ )";
		var numberLiteral = this.makeAlt([
				"(?: " + decimalIntegerLiteral + " \\. " +
				        "[0-9]* " + exponentPart + "? )",
				"(?: \\. [0-9]+ " + exponentPart + "? )",
				"(?: " + decimalIntegerLiteral + exponentPart + " )",
				"NaN",
				"Infinity"
			]) + "\\b";
		var integerLiteral = this.makeAlt([
				"(?: 0 [xX] [0-9a-fA-F]+ )", // hex
				decimalIntegerLiteral
			]) + "(?![\\.0-9eE])\\b";

		var multiLineComment  = "(?: /\\* (?: [^*] | (?: \\*+ [^*\\/]) )* \\*+/)";
		var singleLineComment = "(?: // [^\\r\\n]* )";
		var comment           = this.makeAlt([multiLineComment, singleLineComment]);
		var whiteSpace        = "[\\x20\\t\\r\\n]+";

		// regular expressions
		this.rxIdent          = this.rx("^" + ident);
		this.rxStringLiteral  = this.rx("^" + stringLiteral);
		this.rxNumberLiteral  = this.rx("^" + numberLiteral);
		this.rxIntegerLiteral = this.rx("^" + integerLiteral);
		this.rxRegExpLiteral  = this.rx("^" + regexpLiteral);
		this.rxSpace          = this.rx("^" + this.makeAlt([comment, whiteSpace]) + "+");
		this.rxNewline        = /(?:\r\n?|\n)/;

		// blacklists of identifiers
		this.keywords = this.asMap([
			// literals shared with ECMA 262
			"null",     "true",     "false",
			"NaN",      "Infinity",
			// keywords shared with ECMA 262
			"break",    "do",       "instanceof", "typeof",
			"case",     "else",     "new",        "var",
			"catch",    "finally",  "return",     "void",
			"continue", "for",      "switch",     "while",
			"function", "this",
			/* "default", */ // contextual keywords
			"if",       "throw",
			/* "assert",    "log", // contextual keywords */
			"delete",   "in",       "try",
			// keywords of JSX
			"class",	 "extends", "super",
			"import",    "implements",
			"interface", "static",
			"__FILE__",  "__LINE__",
			"undefined"
		]);
		this.reserved = this.asMap([
			// literals of ECMA 262 but not used by JSX
			"debugger", "with",
			// future reserved words of ECMA 262
			"const", "export",
			// future reserved words within strict mode of ECMA 262
			"let",   "private",   "public", "yield",
			"protected",

			// JSX specific reserved words
			"extern", "native", "as", "operator"
		]);
	}

});

var Import = exports.Import = Class.extend({

	constructor: function () {
		switch (arguments.length) {
		case 1:
			// for built-in classes
			this._filenameToken = null;
			this._aliasToken = null;
			this._classNames = null;
			this._sourceParsers = [ arguments[0] ];
			break;
		case 3:
			this._filenameToken = arguments[0];
			this._aliasToken = arguments[1];
			this._classNames = arguments[2];
			this._sourceParsers = [];
			break;
		default:
			throw new Error("logic flaw");
		}
	},

	getFilenameToken: function () {
		return this._filenameToken;
	},

	getAlias: function () {
		return this._aliasToken != null ? this._aliasToken.getValue() : null;
	},

	getClassNames: function () {
		var names = [];
		for (var i = 0; i < this._classNames.length; ++i)
			names[i] = this._classNames[i].getValue();
		return names;
	},

	serialize: function () {
		return [
			"Import",
			Util.serializeNullable(this._filenameToken),
			Util.serializeNullable(this._aliasToken),
			Util.serializeArray(this._classNames)
		];
	},

	checkNameConflict: function (errors, nameToken) {
		if (this._aliasToken != null) {
			if (this._aliasToken.getValue() == nameToken.getValue()) {
				errors.push(new CompileError(nameToken, "an alias with the same name is already declared"));
				return false;
			}
		} else {
			if (this._classNames != null) {
				for (var i = 0; i < this._classNames.length; ++i) {
					if (this._classNames[i].getValue() == nameToken.getValue()) {
						errors.push(new CompileError(nameToken, "a class with the same name has already been explicitely imported"));
						return false;
					}
				}
			}
		}
		return true;
	},

	addSource: function (parser) {
		this._sourceParsers.push(parser);
	},

	assertExistenceOfNamedClasses: function (errors) {
		if (this._classNames != null) {
			for (var i = 0; i < this._classNames.length; ++i) {
				switch (this.getClasses(this._classNames[i].getValue()).length) {
				case 0:
					errors.push(new CompileError(this._classNames[i], "no definition for class '" + this._classNames[i].getValue() + "'"));
					break;
				case 1:
					// ok
					break;
				default:
					errors.push(new CompileError(this._classNames[i], "multiple candidates for class '" + this._classNames[i].getValue() + "'"));
					break;
				}
			}
		}
	},

	getClasses: function (name) {
		// filter by classNames, if set
		if (this._classNames != null) {
			for (var i = 0; i < this._classNames.length; ++i)
				if (this._classNames[i].getValue() == name)
					break;
			if (i == this._classNames.length)
				return [];
		} else {
			if (name.charAt(0) == '_')
				return [];
		}
		// lookup
		var found = [];
		for (var i = 0; i < this._sourceParsers.length; ++i) {
			var classDefs = this._sourceParsers[i].getClassDefs();
			for (var j = 0; j < classDefs.length; ++j) {
				var className = classDefs[j].className();
				if (className == name) {
					found.push(classDefs[j]);
					break;
				}
			}
		}
		return found;
	},

	getTemplateClasses: function (name) {
		var found = [];
		for (var i = 0; i < this._sourceParsers.length; ++i) {
			var classDefs = this._sourceParsers[i].getTemplateClassDefs();
			for (var j = 0; j < classDefs.length; ++j) {
				var className = classDefs[j].className();
				if (className.charAt(0) != '_' && className == name) {
					found.push(classDefs[j]);
					break;
				}
			}
		}
		return found;
	},

	$create: function (errors, filenameToken, aliasToken, classNames) {
		var filename = Util.decodeStringLiteral(filenameToken.getValue());
		if (filename.indexOf("*") != -1) {
			// read the files from a directory
			var match = filename.match(/^([^\*]*)\/\*(\.[^\/\*]*)$/);
			if (match == null) {
				errors.push(new CompileError(filenameToken, "invalid use of wildcard"));
				return null;
			}
			return new WildcardImport(filenameToken, aliasToken, classNames, match[1], match[2]);
		}
		return new Import(filenameToken, aliasToken, classNames);
	}

});

var WildcardImport = exports.WildcardImport = Import.extend({

	constructor: function (filenameToken, aliasToken, classNames, directory, suffix) {
		Import.prototype.constructor.call(this, filenameToken, aliasToken, classNames);
		this._directory = directory;
		this._suffix = suffix;
	},

	getDirectory: function () {
		return this._directory;
	},

	getSuffix: function () {
		return this._suffix;
	}

});

var QualifiedName = exports.QualifiedName = Class.extend({

	constructor: function (token, imprt) {
		this._token = token;
		this._import = imprt;
	},

	getToken: function () {
		return this._token;
	},

	getImport: function () {
		return this._import;
	},

	serialize: function () {
		return [
			"QualifiedName",
			this._token.serialize(),
			Util.serializeNullable(this._import)
		];
	},

	equals: function (x) {
		if (x == null)
			return false;
		if (this._token.getValue() != x._token.getValue())
			return false;
		if (this._import != x._import)
			return false;
		return true;
	},

	getClass: function (context) {
		if (this._import != null) {
			var classDefs = this._import.getClasses(this._token.getValue());
			switch (classDefs.length) {
			case 1:
				var classDef = classDefs[0];
				break;
			case 0:
				context.errors.push(new CompileError(this._token, "no definition for class '" + this._token.getValue() + "' in file '" + this._import.getFilenameToken().getValue() + "'"));
				return null;
			default:
				context.errors.push(new CompileError(this._token, "multiple candidates"));
				return null;
			}
		} else if ((classDef = context.parser.lookup(context.errors, this._token, this._token.getValue())) == null) {
			context.errors.push(new CompileError(this._token, "no class definition for '" + this._token.getValue() + "'"));
			return null;
		}
		return classDef;
	}

});

var Parser = exports.Parser = Class.extend({

	constructor: function (sourceToken, filename) {
		this._sourceToken = sourceToken;
		this._filename = filename;
	},

	parse: function (input, errors) {
		// lexer properties
		this._input = input;
		this._initInput();
		this._tokenLength = 0;
		// for source map
		this._lineNumber = 1;
		// output
		this._errors = errors;
		this._templateClassDefs = [];
		this._classDefs = [];
		this._imports = [];
		// use for function parsing
		this._locals = [];
		this._statements = [];
		this._closures = [];
		this._extendName = null;
		this._implementNames = [];
		this._objectTypesUsed = [];
		this._templateInstantiationRequests = [];

		// doit
		while (! this._isEOF()) {
			var importToken = this._expectOpt("import");
			if (importToken == null)
				break;
			this._importStatement(importToken);
		}
		while (! this._isEOF()) {
			if (! this._classDefinition())
				return false;
		}

		if (this._errors.length != 0)
			return false;

		return true;
	},

	_initInput: function () {
		this._remainingInput = this._input;
	},
	_getPos: function () {
		return this._input.length - this._remainingInput.length;
	},
	_getInput: function () {
		return this._remainingInput;
	},
	_getInputByLength: function (length) {
		return this._remainingInput.substring(0, length);
	},
	_forwardPos: function (len) {
		this._remainingInput = this._remainingInput.substring(len);
	},

	getSourceToken: function () {
		return this._sourceToken;
	},

	getPath: function () {
		return this._filename;
	},

	getClassDefs: function () {
		return this._classDefs;
	},

	getTemplateClassDefs: function () {
		return this._templateClassDefs;
	},

	getTemplateInstantiationRequests: function () {
		return this._templateInstantiationRequests;
	},

	getImports: function () {
		return this._imports;
	},

	registerBuiltinImports: function (parsers) {
		for (var i = parsers.length - 1; i >= 0; --i)
			this._imports.unshift(new Import(parsers[i]));
	},

	lookupImportAlias: function (name) {
		for (var i = 0; i < this._imports.length; ++i) {
			var alias = this._imports[i].getAlias();
			if (alias != null && alias == name)
				return this._imports[i];
		}
		return null;
	},

	lookup: function (errors, contextToken, name) {
		// class within the file is preferred
		for (var i = 0; i < this._classDefs.length; ++i) {
			if (this._classDefs[i].className() == name)
				return this._classDefs[i];
		}
		// instantiated templates never get imported
		if (name.match(/\.</) != null)
			return null;
		// classnames within the imported files may conflict
		var found = [];
		for (var i = 0; i < this._imports.length; ++i) {
			if (this._imports[i].getAlias() == null)
				found = found.concat(this._imports[i].getClasses(name));
		}
		if (found.length == 1)
			return found[0];
		if (found.length >= 2)
			errors.push(new CompileError(contextToken, "multiple candidates exist for class name '" + name + "'"));
		return null;
	},

	lookupTemplate: function (errors, contextToken, name) {
		// class within the file is preferred
		for (var i = 0; i < this._templateClassDefs.length; ++i) {
			if (this._templateClassDefs[i].className() == name)
				return this._templateClassDefs[i];
		}
		// classnames within the imported files may conflict
		var found = [];
		for (var i = 0; i < this._imports.length; ++i) {
			found = found.concat(this._imports[i].getTemplateClasses(name));
		}
		if (found.length == 1)
			return found[0];
		if (found.length >= 2)
			errors.push(new CompileError(contextToken, "multiple candidates exist for template class name '" + name + "'"));
		return null;
	},

	registerInstantiatedClass: function (classDef) {
		this._classDefs.push(classDef);
	},

	_pushFunctionState: function () {
		// FIXME use class
		var state = {
			locals: this._locals,
			statements: this._statements,
			closures: this._closures,
		};
		this._locals = [];
		this._statements = [];
		this._closures = [];
		return state;
	},

	_restoreFunctionState: function (state) {
		this._locals = state.locals;
		this._statements = state.statements;
		this._closures = state.closures;
	},

	_registerLocal: function (identifierToken, type) {
		for (var i = 0; i < this._locals.length; i++) {
			if (this._locals[i].getName().getValue() == identifierToken.getValue()) {
				if (type != null && ! this._locals[i].getType().equals(type))
					this._newError("conflicting types for variable " + identifierToken.getValue());
				return;
			}
		}
		this._locals.push(new LocalVariable(identifierToken, type));
	},

	_preserveState: function () {
		// FIXME use class
		return {
			// lexer properties
			pos: this._getPos(),
			lineNumber: this._lineNumber,
			tokenLength: this._tokenLength,
			// errors
			numErrors: this._errors.length,
			// closures
			numClosures: this._closures.length,
		};
	},

	_restoreState: function (state) {
		this._initInput();
		this._forwardPos(state.pos);
		this._lineNumber = state.lineNumber;
		this._tokenLength = state.tokenLength;
		this._errors.length = state.numErrors;
		this._closures.splice(state.numClosures);
	},

	_getColumn: function () {
		var pos = this._getPos();
		var lastNewline = this._input.lastIndexOf("\n", pos);
		return pos - lastNewline - 1;
	},

	_newError: function (message) {
		this._errors.push(new CompileError(this._filename, this._lineNumber, this._getColumn(), message));
	},

	_advanceToken: function () {
		this._forwardPos(this._tokenLength);
		this._tokenLength = 0;

		// skip whitespaces
		var matched = this._getInput().match(_Lexer.rxSpace);
		if(matched != null) {
			this._forwardPos(matched[0].length);
			this._lineNumber += matched[0].split(_Lexer.rxNewline).length - 1;
		}
	},

	_isEOF: function () {
		this._advanceToken();
		return this._remainingInput.length === 0;
	},

	_expectIsNotEOF: function () {
		if (this._isEOF()) {
			this._newError("unexpected EOF");
			return false;
		}
		return true;
	},

	_expectOpt: function (expected, excludePattern) {
		if (! (expected instanceof Array))
			expected = [ expected ];

		this._advanceToken();
		for (var i = 0; i < expected.length; ++i) {
			if (this._getInputByLength(expected[i].length) == expected[i]) {
				if (expected[i].match(_Lexer.rxIdent) != null
					&& this._getInput().match(_Lexer.rxIdent)[0].length != expected[i].length) {
					// part of a longer token
				} else if (excludePattern != null && this._getInput().match(excludePattern) != null) {
					// skip if the token matches the exclude pattern
				} else {
					// found
					this._tokenLength = expected[i].length;
					return new Token(expected[i], false, this._filename, this._lineNumber, this._getColumn());
				}
			}
		}
		return null;
	},

	_expect: function (expected, excludePattern) {
		if (! (expected instanceof Array))
			expected = [ expected ];

		var token = this._expectOpt(expected, excludePattern);
		if (token == null) {
			this._newError("expected keyword: " + expected.join(" "));
			return null;
		}
		return token;
	},

	_expectIdentifierOpt: function () {
		this._advanceToken();
		var matched = this._getInput().match(_Lexer.rxIdent);
		if (matched == null)
			return null;
		if (_Lexer.keywords.hasOwnProperty(matched[0])) {
			this._newError("expected an identifier but found a keyword");
			return null;
		}
		if (_Lexer.reserved.hasOwnProperty(matched[0])) {
			this._newError("expected an identifier but found a reserved word");
			return null;
		}
		this._tokenLength = matched[0].length;
		return new Token(matched[0], true, this._filename, this._lineNumber, this._getColumn());
	},

	_expectIdentifier: function () {
		var token = this._expectIdentifierOpt();
		if (token != null)
			return token;
		this._newError("expected an identifier");
		return null;
	},

	_expectStringLiteralOpt: function () {
		this._advanceToken();
		var matched = this._getInput().match(_Lexer.rxStringLiteral);
		if (matched == null)
			return null;
		this._tokenLength = matched[0].length;
		return new Token(matched[0], false, this._filename, this._lineNumber, this._getColumn());
	},

	_expectStringLiteral: function () {
		var token = this._expectStringLiteralOpt();
		if (token != null)
			return token;
		this._newError("expected a string literal");
		return null;
	},

	_expectNumberLiteralOpt: function () {
		this._advanceToken();
		var matched = this._getInput().match(_Lexer.rxIntegerLiteral);
		if (matched == null)
			matched = this._getInput().match(_Lexer.rxNumberLiteral);
		if (matched == null)
			return null;
		this._tokenLength = matched[0].length;
		return new Token(matched[0], false, this._filename, this._lineNumber, this._getColumn());
	},

	_expectRegExpLiteralOpt: function () {
		this._advanceToken();
		var matched = this._getInput().match(_Lexer.rxRegExpLiteral);
		if (matched == null)
			return null;
		this._tokenLength = matched[0].length;
		return new Token(matched[0], false, this._filename, this._lineNumber, this._getColumn());
	},

	_skipLine: function () {
		var matched = this._getInput().match(/^.*(?:\r\n?|\n|$)/);
		this._forwardPos(matched[0].length);
		this._tokenLength = 0;

		// count newlines
		this._lineNumber += matched[0].split(_Lexer.rxNewline).length - 1;
	},

	_qualifiedName: function (allowSuper) {
		// returns a token that contains a qualified name
		if (allowSuper) {
			var token = this._expectOpt("super");
			if (token != null)
				return new QualifiedName(token, null);
		}
		if ((token = this._expectIdentifier()) == null)
			return null;
		var imprt = this.lookupImportAlias(token.getValue());
		if (imprt != null) {
			if (this._expect(".") == null)
				return null;
			token = this._expectIdentifier();
			if (token == null)
				return null;
		}
		return new QualifiedName(token, imprt);
	},

	_importStatement: function (importToken) {
		// parse
		var classes = null;
		var token = this._expectIdentifierOpt();
		if (token != null) {
			classes = [ token ];
			while (true) {
				if ((token = this._expect([ ",", "from" ])) == null)
					return false;
				if (token.getValue() == "from")
					break;
				if ((token = this._expectIdentifier()) == null)
					return false;
				classes.push(token);
			}
		}
		var filenameToken = this._expectStringLiteral();
		if (filenameToken == null)
			return false;
		var alias = null;
		if (this._expectOpt("into") != null) {
			if ((alias = this._expectIdentifier()) == null)
				return false;
		}
		if (this._expect(";") == null)
			return false;
		// check conflict
		if (alias != null && Parser._isReservedClassName(alias.getValue())) {
			this._errors.push(new CompileError(alias, "cannot use name of a built-in class as an alias"));
			return false;
		}
		if (classes != null) {
			var success = true;
			for (var i = 0; i < this._imports.length; ++i)
				for (var j = 0; j < classes.length; ++j)
					if (! this._imports[i].checkNameConflict(this._errors, classes[j]))
						success = false;
			if (! success)
				return false;
		} else {
			for (var i = 0; i < this._imports.length; ++i) {
				if (alias == null) {
					if (this._imports[i].getAlias() == null && this._imports[i].getFilenameToken().getValue() == filenameToken.getValue()) {
						this._errors.push(new CompileError(filenameToken, "cannot import the same file more than once (unless using an alias)"));
						return false;
					}
				} else {
					if (! this._imports[i].checkNameConflict(this._errors, alias))
						return false;
				}
			}
		}
		// push
		var imprt = Import.create(this._errors, filenameToken, alias, classes);
		if (imprt == null)
			return false;
		this._imports.push(imprt);
		return true;
	},

	_classDefinition: function () {
		this._extendName = null;
		this._implementNames = [];
		this._objectTypesUsed = [];
		// attributes* class
		var flags = 0;
		while (true) {
			var token = this._expect([ "class", "interface", "mixin", "abstract", "final", "native", "__fake__" ]);
			if (token == null)
				return false;
			if (token.getValue() == "class")
				break;
			if (token.getValue() == "interface") {
				if ((flags & (ClassDefinition.IS_FINAL | ClassDefinition.IS_NATIVE)) != 0) {
					this._newError("interface cannot have final or native attribute set");
					return false;
				}
				flags |= ClassDefinition.IS_INTERFACE;
				break;
			}
			if (token.getValue() == "mixin") {
				if ((flags & (ClassDefinition.IS_FINAL | ClassDefinition.IS_NATIVE)) != 0) {
					this._newError("mixin cannot have final or native attribute set");
					return false;
				}
				flags |= ClassDefinition.IS_MIXIN;
				break;
			}
			var newFlag = 0;
			switch (token.getValue()) {
			case "abstract":
				newFlag = ClassDefinition.IS_ABSTRACT;
				break;
			case "final":
				newFlag = ClassDefinition.IS_FINAL;
				break;
			case "native":
				newFlag = ClassDefinition.IS_NATIVE;
				break;
			case "__fake__":
				newFlag = ClassDefinition.IS_FAKE;
				break;
			default:
				throw new Error("logic flaw");
			}
			if ((flags & newFlag) != 0) {
				this._newError("same attribute cannot be specified more than once");
				return false;
			}
			flags |= newFlag;
		}
		var className = this._expectIdentifier();
		if (className == null)
			return false;
		// template
		var typeArgs = null;
		if (this._expectOpt(".") != null) {
			if (this._expect("<") == null)
				return false;
			typeArgs = [];
			do {
				var typeArg = this._expectIdentifier();
				if (typeArg == null)
					return false;
				typeArgs.push(typeArg);
				var token = this._expectOpt([ ",", ">" ]);
				if (token == null)
					return false;
			} while (token.getValue() == ",");
		}
		// extends
		if ((flags & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) == 0) {
			if (this._expectOpt("extends") != null)
				if ((this._extendName = this._qualifiedName(false)) == null)
					return false;
		} else {
			if ((flags & (ClassDefinition.IS_ABSTRACT | ClassDefinition.IS_FINAL | ClassDefinition.IS_NATIVE)) != 0) {
				this._newError("interface or mixin cannot have attributes: 'abstract', 'final', 'native");
				return false;
			}
		}
		// implements
		if (this._expectOpt("implements") != null) {
			do {
				var name = this._qualifiedName(false);
				if (name == null)
					return false;
				this._implementNames.push(name);
			} while (this._expectOpt(",") != null);
		}
		// body
		if (this._expect("{") == null)
			return false;
		var members = [];

		var success = true;
		while (this._expectOpt("}") == null) {
			if (! this._expectIsNotEOF())
				return false;
			var member = this._memberDefinition(flags);
			if (member != null) {
				for (var i = 0; i < members.length; ++i) {
					if (member.name() == members[i].name()
						&& (member.flags() & ClassDefinition.IS_STATIC) == (members[i].flags() & ClassDefinition.IS_STATIC)) {
						if (member instanceof MemberFunctionDefinition && members[i] instanceof MemberFunctionDefinition) {
							if (Util.typesAreEqual(member.getArgumentTypes(), members[i].getArgumentTypes())) {
								this._errors.push(new CompileError(
									member.getToken(),
									"a " + ((member.flags() & ClassDefinition.IS_STATIC) != 0 ? "static" : "member")
									+ " function with same name and arguments is already defined"));
								success = false;
								break;
							}
						} else {
							this._errors.push(new CompileError(member.getToken(), "a property with same name already exists; only functions may be overloaded"));
							success = false;
							break;
						}
					}
				}
				members.push(member);
			} else {
				this._skipLine();
			}
		}

		// check name conflicts
		if ((flags & ClassDefinition.IS_NATIVE) == 0 && Parser._isReservedClassName(className.getValue())) {
			// any better way to check that we are parsing a built-in file?
			this._errors.push(new CompileError(className, "cannot re-define a built-in class"));
			success = false;
		} else {
			for (var i = 0; i < this._imports.length; ++i)
				if (! this._imports[i].checkNameConflict(this._errors, className))
					success = false;
			if (typeArgs != null) {
				for (var i = 0; i < this._templateClassDefs.length; ++i) {
					if (this._classDefs[i].className() == className.getValue()) {
						this._errors.push(new CompileError(className, "template class with the name same has been already declared"));
						success = false;
						break;
					}
				}
			} else {
				for (var i = 0; i < this._classDefs.length; ++i) {
					if (this._classDefs[i].className() == className.getValue()) {
						this._errors.push(new CompileError(className, "class with the same name has been already declared"));
						success = false;
						break;
					}
				}
			}
		}

		if (! success)
			return false;

		// done
		if (typeArgs != null)
			this._templateClassDefs.push(new TemplateClassDefinition(className.getValue(), flags, typeArgs, this._extendName, this._implementNames, members, this._objectTypesUsed));
		else
			this._classDefs.push(new ClassDefinition(className, className.getValue(), flags, this._extendName, this._implementNames, members, this._objectTypesUsed));
		return true;
	},

	_memberDefinition: function (classFlags) {
		var flags = 0;
		while (true) {
			var token = this._expect([ "function", "var", "static", "abstract", "override", "final", "const", "native", "__readonly__" ]);
			if (token == null)
				return null;
			if (token.getValue() == "const") {
				if ((flags & ClassDefinition.IS_STATIC) == 0) {
					this._newError("constants must be static");
					return null;
				}
				flags |= ClassDefinition.IS_CONST;
				break;
			}
			else if (token.getValue() == "function" || token.getValue() == "var")
				break;
			var newFlag = 0;
			switch (token.getValue()) {
			case "static":
				if ((classFlags & (ClassDefinition.IS_INTERFACE | ClassDefinition.IS_MIXIN)) != 0) {
					this._newError("interfaces and mixins cannot have static members");
					return null;
				}
				newFlag = ClassDefinition.IS_STATIC;
				break;
			case "abstract":
				newFlag = ClassDefinition.IS_ABSTRACT;
				break;
			case "override":
				if ((classFlags & ClassDefinition.IS_INTERFACE) != 0) {
					this._newError("functions of an interface cannot have 'override' attribute set");
					return null;
				}
				newFlag = ClassDefinition.IS_OVERRIDE;
				break;
			case "final":
				if ((classFlags & ClassDefinition.IS_INTERFACE) != 0) {
					this._newError("functions of an interface cannot have 'final' attribute set");
					return null;
				}
				newFlag = ClassDefinition.IS_FINAL;
				break;
			case "native":
				newFlag = ClassDefinition.IS_NATIVE;
				break;
			case "__readonly__":
				newFlag = ClassDefinition.IS_READONLY;
				break;
			default:
				throw new Error("logic flaw");
			}
			if ((flags & newFlag) != 0) {
				this._newError("same attribute cannot be specified more than once");
				return null;
			}
			flags |= newFlag;
		}
		if ((classFlags & ClassDefinition.IS_INTERFACE) != 0)
			flags |= ClassDefinition.IS_ABSTRACT;
		if (token.getValue() == "function") {
			return this._functionDefinition(token, flags, classFlags);
		}
		// member variable decl.
		if ((flags & ~(ClassDefinition.IS_STATIC | ClassDefinition.IS_ABSTRACT | ClassDefinition.IS_CONST | ClassDefinition.IS_READONLY)) != 0) {
			this._newError("variables may only have attributes: static, abstract, const");
			return null;
		}
		if ((flags & ClassDefinition.IS_READONLY) != 0 && (classFlags & ClassDefinition.IS_NATIVE) == 0) {
			this._newError("only native classes may use the __readonly__ attribute");
			return null;
		}
		var name = this._expectIdentifier();
		if (name == null)
			return null;
		var type = null;
		if (this._expectOpt(":") != null)
			if ((type = this._typeDeclaration(false)) == null)
				return null;
		var initialValue = null;
		if (this._expectOpt("=") != null) {
			if ((flags & ClassDefinition.IS_ABSTRACT) != 0) {
				this._newError("abstract variable cannot have default value");
				return null;
			}
			if ((initialValue = this._assignExpr(false)) == null)
				return null;
		}
		if (type == null && initialValue == null) {
			this._newError("variable declaration should either have type declaration or initial value");
			return null;
		}
		if (! this._expect(";"))
			return null;
		// all non-native values have initial value
		if (initialValue == null && (classFlags & ClassDefinition.IS_NATIVE) == 0)
			initialValue = Expression.getDefaultValueExpressionOf(type);
		return new MemberVariableDefinition(token, name, flags, type, initialValue);
	},

	_functionDefinition: function (token, flags, classFlags) {
		// name
		var name = this._expectIdentifier();
		if (name == null)
			return null;
		if (name.getValue() == "constructor") {
			if ((classFlags & ClassDefinition.IS_INTERFACE) != 0) {
				this._newError("interface cannot have a constructor");
				return null;
			}
			if ((flags & (ClassDefinition.IS_ABSTRACT | ClassDefinition.IS_FINAL)) != 0) {
				this._newError("constructor cannot be declared as 'abstract' or 'final'");
				return null;
			}
			flags |= ClassDefinition.IS_FINAL;
		}
		flags |= classFlags & (ClassDefinition.IS_NATIVE | ClassDefinition.IS_FINAL);
		if (this._expect("(") == null)
			return null;
		// arguments
		var args = this._functionArgumentsExpr();
		if (args == null)
			return null;
		// return type
		var returnType;
		if (name.getValue() == "constructor") {
			// no return type
			returnType = Type.voidType;
		} else {
			if (this._expect(":", "return type declaration is mandatory") == null)
				return null;
			returnType = this._typeDeclaration(true);
			if (returnType == null)
				return null;
		}
		// take care of abstract function
		if ((flags & ClassDefinition.IS_NATIVE) != 0 || (classFlags & ClassDefinition.IS_INTERFACE) != 0) {
			if (this._expect(";") == null)
				return null;
			return new MemberFunctionDefinition(token, name, flags, returnType, args, null, null, null);
		} else if ((flags & ClassDefinition.IS_ABSTRACT) != 0) {
			var token = this._expect([ ";", "{" ]);
			if (token == null)
				return null;
			if (token.getValue() == ";")
				return new MemberFunctionDefinition(token, name, flags, returnType, args, null, null, null);
		} else {
			if (this._expect("{") == null)
				return null;
		}
		// body
		this._locals = [];
		this._statements = [];
		this._closures = [];
		if (name.getValue() == "constructor")
			var lastToken = this._initializeBlock();
		else
			lastToken = this._block();
		// done
		return new MemberFunctionDefinition(token, name, flags, returnType, args, this._locals, this._statements, this._closures, lastToken);
	},

	_typeDeclaration: function (allowVoid) {
		if (allowVoid) {
			var token = this._expectOpt("void");
			if (token != null)
				return Type.voidType;
		}
		var typeDecl;
		var token = this._expectOpt([ "MayBeUndefined", "variant" ]);
		if (token != null) {
			switch (token.getValue()) {
			case "MayBeUndefined":
				if (this._expect(".") == null
					|| this._expect("<") == null)
					return null;
				var baseType = this._primaryTypeDeclaration();
				if (baseType == null)
					return null;
				if (this._expect(">") == null)
					return null;
				typeDecl = baseType.toMayBeUndefinedType();
				break;
			case "variant":
				typeDecl = Type.variantType;
				break;
			default:
				throw new Error("logic flaw");
			}
		} else {
			typeDecl = this._primaryTypeDeclaration();
		}
		// []
		while (this._expectOpt("[") != null) {
			if ((token = this._expect("]")) == null)
				return false;
			this._templateInstantiationRequests.push(new TemplateInstantiationRequest(token, "Array", [ typeDecl ]));
			typeDecl = new ParsedObjectType(new QualifiedName(new Token("Array", true), null), [ typeDecl ], token);
			this._objectTypesUsed.push(typeDecl);
		}
		return typeDecl;
	},
	
	_primaryTypeDeclaration: function () {
		var token = this._expectOpt([ "function", "boolean", "int", "number", "string" ]);
		if (token != null) {
			switch (token.getValue()) {
			case "function":
				return this._functionTypeDeclaration(null);
			case "boolean":
				return Type.booleanType;
			case "int":
				return Type.integerType;
			case "number":
				return Type.numberType;
			case "string":
				return Type.stringType;
			default:
				throw new Error("logic flaw");
			}
		} else {
			return this._objectTypeDeclaration();
		}
	},

	_objectTypeDeclaration: function () {
		var qualifiedName = this._qualifiedName(false);
		if (qualifiedName == null)
			return null;
		if (this._expectOpt(".") != null) {
			if (this._expect("<") == null)
				return null; // nested types not yet supported
			return this._templateTypeDeclaration(qualifiedName);
		} else {
			// object
			var objectType = new ParsedObjectType(qualifiedName, []);
			this._objectTypesUsed.push(objectType);
			return objectType;
		}
	},

	_templateTypeDeclaration: function (qualifiedName) {
		if (qualifiedName.getImport() != null) {
			this._newError("template class with namespace not supported");
			return null;
		}
		// parse
		var types = [];
		do {
			var type = this._typeDeclaration(false);
			if (type == null)
				return null;
			types.push(type);
			var token = this._expect([ ">", "," ]);
			if (token == null)
				return null;
		} while (token.getValue() == ",");
		// request template instantiation (deferred)
		this._templateInstantiationRequests.push(new TemplateInstantiationRequest(token, qualifiedName.getToken().getValue(), types));
		// return object type
		var objectType = new ParsedObjectType(qualifiedName, types);
		this._objectTypesUsed.push(objectType);
		return objectType;
	},

	_functionTypeDeclaration: function (objectType) {
		// optional function name
		this._expectIdentifierOpt();
		// parse args
		if(this._expect("(") == null)
			return null;
		var argTypes = [];
		if (this._expectOpt(")") == null) {
			do {
				this._expectIdentifierOpt(); // may have identifiers
				if (this._expect(":") == null)
					return null;
				var argType = this._typeDeclaration(false);
				if (argType == null)
					return null;
				argTypes.push(argType);
				var token = this._expect([ ")", "," ]);
				if (token == null)
					return null;
			} while (token.getValue() == ",");
		}
		// parse return type
		if (this._expect(":") == null)
			return false;
		var returnType = this._typeDeclaration(true);
		if (returnType == null)
			return null;
		if (objectType != null)
			return new MemberFunctionType(objectType, returnType, argTypes, true);
		else
			return new StaticFunctionType(returnType, argTypes, true);
	},

	_initializeBlock: function () {
		var token;
		while ((token = this._expectOpt("}")) == null) {
			var state = this._preserveState();
			if (! this._constructorInvocationStatement()) {
				this._restoreState(state);
				return this._block();
			}
		}
		return token;
	},

	_block: function () {
		var token;
		while ((token = this._expectOpt("}")) == null) {
			if (! this._expectIsNotEOF())
				return false;
			if (! this._statement())
				this._skipLine();
		}
		return token;
	},

	_statement: function () {
		// has a label?
		var state = this._preserveState();
		var label = this._expectIdentifierOpt();
		if (label != null && this._expectOpt(":") != null) {
			// within a label
		} else {
			this._restoreState(state);
			label = null;
		}
		// parse the statement
		var token = this._expectOpt([
			"{", "var", ";", "if", "do", "while", "for", "continue", "break", "return", "switch", "throw", "try", "assert", "log", "delete", "debugger"
		]);
		if (label != null) {
			if (! (token != null && token.getValue().match(/^(?:do|while|for|switch)$/) != null)) {
				this._newError("only blocks, iteration statements, and switch statements are allowed after a label");
				return false;
			}
		}
		if (token != null) {
			switch (token.getValue()) {
			case "{":
				return this._block() != null;
			case "var":
				return this._variableStatement();
			case ";":
				return true;
			case "if":
				return this._ifStatement(token);
			case "do":
				return this._doWhileStatement(token, label);
			case "while":
				return this._whileStatement(token, label);
			case "for":
				return this._forStatement(token, label);
			case "continue":
				return this._continueStatement(token);
			case "break":
				return this._breakStatement(token);
			case "return":
				return this._returnStatement(token);
			case "switch":
				return this._switchStatement(token, label);
			case "throw":
				return this._throwStatement(token);
			case "try":
				return this._tryStatement(token);
			case "assert":
				return this._assertStatement(token);
			case "log":
				return this._logStatement(token);
			case "delete":
				return this._deleteStatement(token);
			case "debugger":
				return this._debuggerStatement(token);
			default:
				throw new "logic flaw, got " + token.getValue();
			}
		}
		// expression statement
		var expr = this._expr(false);
		if (expr == null)
			return false;
		if (this._expect(";") == null)
			return null;
		this._statements.push(new ExpressionStatement(expr));
		return true;
	},

	_constructorInvocationStatement: function () {
		// get className
		var className = this._qualifiedName(true);
		if (className == null)
			return false;
		if (! (className.getImport() == null && className.getToken().getValue() == "super")) {
			// check if the className token designates the base class or one of the mix-ins
			if (this._extendName != null ? this._extendName.equals(className) : className.getImport() == null && className.getToken().getValue() == "Object") {
				// ok, is calling base class
			} else {
				for (var i = 0; i < this._implementNames.length; ++i)
					if (this._implementNames[i].equals(className))
						break;
				if (i == this._implementNames.length) {
					// not found (and thus is not treated as a constructor invocation statement)
					return false;
				}
			}
		}
		// get args
		if (this._expect("(") == null)
			return false;
		var args = this._argsExpr();
		if (args == null)
			return false;
		if (this._expect(";") == null)
			return false;
		// success
		this._statements.push(new ConstructorInvocationStatement(className, args));
		return true;
	},

	_variableStatement: function () {
		var succeeded = [ false ];
		var expr = this._variableDeclarations(false, succeeded);
		if (! succeeded[0])
			return false;
		if (this._expect(";") == null)
			return false;
		if (expr != null)
			this._statements.push(new ExpressionStatement(expr));
		return true;
	},

	_ifStatement: function (token) {
		if (this._expect("(") == null)
			return false;
		var expr = this._expr(false);
		if (expr == null)
			return false;
		if (this._expect(")") == null)
			return false;
		var onTrueStatements = this._subStatements();
		var onFalseStatements = [];
		if (this._expectOpt("else") != null) {
			onFalseStatements = this._subStatements();
		}
		this._statements.push(new IfStatement(token, expr, onTrueStatements, onFalseStatements));
		return true;
	},

	_doWhileStatement: function (token, label) {
		var statements = this._subStatements();
		if (this._expect("while") == null)
			return false;
		if (this._expect("(") == null)
			return false;
		var expr = this._expr(false);
		if (expr == null)
			return false;
		if (this._expect(")") == null)
			return false;
		this._statements.push(new DoWhileStatement(token, label, expr, statements));
		return true;
	},

	_whileStatement: function (token, label) {
		if (this._expect("(") == null)
			return false;
		var expr = this._expr(false);
		if (expr == null)
			return false;
		if (this._expect(")") == null)
			return false;
		var statements = this._subStatements();
		this._statements.push(new WhileStatement(token, label, expr, statements));
		return true;
	},

	_forStatement: function (token, label) {
		var state = this._preserveState();
		// first try to parse as for .. in, and fallback to the other
		switch (this._forInStatement(token, label)) {
		case -1: // try for (;;)
			break;
		case 0: // error
			return false;
		case 1:
			return true;
		}
		this._restoreState(state);
		if (! this._expect("(") == null)
			return false;
		// parse initialization expression
		var initExpr = null;
		if (this._expectOpt(";") != null) {
			// empty expression
		} else if (this._expectOpt("var") != null) {
			var succeeded = [ false ];
			initExpr = this._variableDeclarations(true, succeeded);
			if (! succeeded[0])
				return false;
			if (this._expect(";") == null)
				return false;
		} else {
			if ((initExpr = this._expr(true)) == null)
				return false;
			if (this._expect(";") == null)
				return false;
		}
		// parse conditional expression
		var condExpr = null;
		if (this._expectOpt(";") != null) {
			// empty expression
		} else {
			if ((condExpr = this._expr(false)) == null)
				return false;
			if (this._expect(";") == null)
				return false;
		}
		// parse post expression
		var postExpr = null;
		if (this._expectOpt(")") != null) {
			// empty expression
		} else {
			if ((postExpr = this._expr(false)) == null)
				return false;
			if (this._expect(")") == null)
				return false;
		}
		// statements
		var statements = this._subStatements();
		this._statements.push(new ForStatement(token, label, initExpr, condExpr, postExpr, statements));
		return true;
	},

	_forInStatement: function (token, label) {
		if (! this._expect("(") == null)
			return 0; // failure
		var lhsExpr;
		if (this._expectOpt("var") != null) {
			if ((lhsExpr = this._variableDeclaration(true)) == null)
				return -1; // retry the other
		} else {
			if ((lhsExpr = this._lhsExpr()) == null)
				return -1; // retry the other
		}
		if (this._expect("in") == null)
			return -1; // retry the other
		var listExpr = this._expr(false);
		if (listExpr == null)
			return 0;
		if (this._expect(")") == null)
			return 0;
		var statements = this._subStatements();
		this._statements.push(new ForInStatement(token, label, lhsExpr, listExpr, statements));
		return 1;
	},

	_continueStatement: function (token) {
		var label = this._expectIdentifierOpt();
		if (this._expect(";") == null)
			return false;
		this._statements.push(new ContinueStatement(token, label));
		return true;
	},

	_breakStatement: function (token) {
		var label = this._expectIdentifierOpt();
		if (this._expect(";") == null)
			return false;
		this._statements.push(new BreakStatement(token, label));
		return true;
	},

	_returnStatement: function (token) {
		var expr = null;
		if (this._expectOpt(";") == null) {
			if ((expr = this._expr(false)) == null)
				return false;
			if (this._expect(";") == null)
				return false;
		}
		this._statements.push(new ReturnStatement(token, expr));
		return true;
	},

	_switchStatement: function (token, label) {
		if (this._expect("(") == null)
			return false;
		var expr = this._expr(false);
		if (expr == null)
			return false;
		if (this._expect(")") == null
			|| this._expect("{") == null)
			return null;
		var foundCaseLabel = false;
		var foundDefaultLabel = false;
		// caseblock
		var startStatementIndex = this._statements.length;
		while (this._expectOpt("}") == null) {
			if (! this._expectIsNotEOF())
				return false;
			var caseOrDefaultToken;
			if (! foundCaseLabel && ! foundDefaultLabel) {
				// first statement within the block should start with a label
				if ((caseOrDefaultToken = this._expect([ "case", "default" ])) == null)
					return false;
			} else {
				caseOrDefaultToken = this._expectOpt([ "case", "default" ]);
			}
			if (caseOrDefaultToken != null) {
				if (caseOrDefaultToken.getValue() == "case") {
					var labelExpr = this._expr();
					if (labelExpr == null)
						return false;
					if (this._expect(":") == null)
						return false;
					this._statements.push(new CaseStatement(caseOrDefaultToken, labelExpr));
					foundCaseLabel = true;
				} else { // "default"
					if (this._expect(":") == null)
						return false;
					if (foundDefaultLabel) {
						this._newError("cannot have more than one default statement within one switch block");
						return false;
					}
					this._statements.push(new DefaultStatement(caseOrDefaultToken));
					foundDefaultLabel = true;
				}
			} else {
				if (! this._statement())
					this._skipLine();
			}
		}
		// done
		this._statements.push(new SwitchStatement(token, label, expr, this._statements.splice(startStatementIndex)));
		return true;
	},

	_throwStatement: function (token) {
		var expr = this._expr();
		if (expr == null)
			return false;
		this._statements.push(new ThrowStatement(token, expr));
		return true;
	},

	_tryStatement: function (tryToken) {
		if (this._expect("{") == null)
			return false;
		var startIndex = this._statements.length;
		if (this._block() == null)
			return false;
		var tryStatements = this._statements.splice(startIndex);
		var catchStatements = [];
		var catchOrFinallyToken = this._expect([ "catch", "finally" ]);
		if (catchOrFinallyToken == null)
			return false;
		for (;
			catchOrFinallyToken != null && catchOrFinallyToken.getValue() == "catch";
			catchOrFinallyToken = this._expectOpt([ "catch", "finally" ])) {
			var catchIdentifier;
			var catchType;
			if (this._expect("(") == null
				|| (catchIdentifier = this._expectIdentifier()) == null
				|| this._expect(":") == null
				|| (catchType = this._typeDeclaration(false)) == null
				|| this._expect(")") == null
				|| this._expect("{") == null)
				return false;
			if (this._block() == null)
				return false;
			catchStatements.push(new CatchStatement(catchOrFinallyToken, new CaughtVariable(catchIdentifier, catchType), this._statements.splice(startIndex)));
		}
		if (catchOrFinallyToken != null) {
			// finally
			if (this._expect("{") == null)
				return false;
			if (this._block() == null)
				return false;
			var finallyStatements = this._statements.splice(startIndex);
		} else {
			finallyStatements = [];
		}
		this._statements.push(new TryStatement(tryToken, tryStatements, catchStatements, finallyStatements));
		return true;
	},

	_assertStatement: function (token) {
		var expr = this._expr();
		if (expr == null)
			return false;
		if (this._expect(";") == null)
			return false;
		this._statements.push(new AssertStatement(token, expr));
		return true;
	},

	_logStatement: function (token) {
		var exprs = [];
		do {
			var expr = this._assignExpr(false);
			if (expr == null)
				return false;
			exprs.push(expr);
		} while (this._expectOpt(",") != null);
		if (this._expect(";") == null)
			return false;
		if (exprs.length == 0) {
			this._newError("no arguments");
			return false;
		}
		this._statements.push(new LogStatement(token, exprs));
		return true;
	},

	_deleteStatement: function (token) {
		var expr = this._expr();
		if (expr == null)
			return false;
		if (this._expect(";") == null)
			return false;
		this._statements.push(new DeleteStatement(token, expr));
		return true;
	},

	_debuggerStatement: function (token) {
		this._statements.push(new DebuggerStatement(token));
		return true;
	},

	_subStatements: function () {
		var statementIndex = this._statements.length;
		if (! this._statement())
			this._skipLine();
		return this._statements.splice(statementIndex);
	},

	_variableDeclarations: function (noIn, isSuccess) {
		isSuccess[0] = false;
		var expr = null;
		var commaToken = null;
		do {
			var declExpr = this._variableDeclaration(noIn);
			if (declExpr == null)
				return null;
			// do not push variable declarations wo. assignment
			if (! (declExpr instanceof IdentifierExpression))
				expr = expr != null ? CommaExpression(commaToken, expr, declExpr) : declExpr;
		} while ((commaToken = this._expectOpt(",")) != null);
		isSuccess[0] = true;
		return expr;
	},

	_variableDeclaration: function (noIn) {
		var identifier = this._expectIdentifier();
		if (identifier == null)
			return null;
		var type = null;
		if (this._expectOpt(":"))
			if ((type = this._typeDeclaration(false)) == null)
				return null;
		var initialValue = null;
		var assignToken;
		if ((assignToken = this._expectOpt("=")) != null)
			if ((initialValue = this._assignExpr(noIn)) == null)
				return null;
		this._registerLocal(identifier, type);
		var expr = new IdentifierExpression(identifier);
		if (initialValue != null)
			expr = new AssignmentExpression(assignToken, expr, initialValue);
		return expr;
	},

	_expr: function (noIn) {
		var expr = this._assignExpr(noIn);
		if (expr == null)
			return null;
		var commaToken;
		while ((commaToken = this._expectOpt(",")) != null) {
			var assignExpr = this._assignExpr(noIn);
			if (assignExpr == null)
				return null;
			expr = new CommaExpression(commaToken, expr, assignExpr);
		}
		return expr;
	},

	_assignExpr: function (noIn) {
		var state = this._preserveState();
		// FIXME contrary to ECMA 262, we first try lhs op assignExpr, and then condExpr; does this have any problem?
		// lhs
		var lhsExpr = this._lhsExpr();
		if (lhsExpr != null) {
			var op = this._expect([ "=", "*=", "/=", "%=", "+=", "-=", "<<=", ">>=", ">>>=", "&=", "^=", "|=" ], /^==/);
			if (op != null) {
				var assignExpr = this._assignExpr(noIn);
				if (assignExpr == null)
					return null;
				return new AssignmentExpression(op, lhsExpr, assignExpr);
			}
		}
		// failed to parse as lhs op assignExpr, try condExpr
		this._restoreState(state);
		return this._condExpr(noIn);
	},

	_condExpr: function (noIn) {
		var lorExpr = this._lorExpr(noIn);
		if (lorExpr == null)
			return null;
		var operatorToken;
		if ((operatorToken = this._expectOpt("?")) == null)
			return lorExpr;
		var ifTrueExpr = null;
		var ifFalseExpr = null;
		if (this._expectOpt(":") == null) {
			ifTrueExpr = this._assignExpr(noIn);
			if (ifTrueExpr == null)
				return null;
			if (this._expect(":") == null)
				return null;
		}
		ifFalseExpr = this._assignExpr(noIn);
		if (ifFalseExpr == null)
			return null;
		return new ConditionalExpression(operatorToken, lorExpr, ifTrueExpr, ifFalseExpr);
	},

	_binaryOpExpr: function (ops, excludePattern, parseFunc, noIn, builderFunc) {
		var expr = parseFunc.call(this, noIn);
		if (expr == null)
			return null;
		while (true) {
			var op = this._expectOpt(ops, excludePattern);
			if (op == null)
				break;
			var rightExpr = parseFunc.call(this);
			if (rightExpr == null)
				return null;
			expr = builderFunc(op, expr, rightExpr);
		}
		return expr;
	},

	_lorExpr: function (noIn) {
		return this._binaryOpExpr([ "||" ], null, this._landExpr, noIn, function (op, e1, e2) {
			return new LogicalExpression(op, e1, e2);
		});
	},

	_landExpr: function (noIn) {
		return this._binaryOpExpr([ "&&" ], null, this._borExpr, noIn, function (op, e1, e2) {
			return new LogicalExpression(op, e1, e2);
		});
	},

	_borExpr: function (noIn) {
		return this._binaryOpExpr([ "|" ], /^\|\|/, this._bxorExpr, noIn, function (op, e1, e2) {
			return new BinaryNumberExpression(op, e1, e2);
		});
	},

	_bxorExpr: function (noIn) {
		return this._binaryOpExpr([ "^" ], null, this._bandExpr, noIn, function (op, e1, e2) {
			return new BinaryNumberExpression(op, e1, e2);
		});
	},

	_bandExpr: function (noIn) {
		return this._binaryOpExpr([ "&" ], /^&&/, this._eqExpr, noIn, function (op, e1, e2) {
			return new BinaryNumberExpression(op, e1, e2);
		});
	},

	_eqExpr: function (noIn) {
		return this._binaryOpExpr([ "==", "!=" ], null, this._relExpr, noIn, function (op, e1, e2) {
			return new EqualityExpression(op, e1, e2);
		});
	},

	_relExpr: function (noIn) {
		var ops = [ "<=", ">=", "<", ">" ];
		if (! noIn)
			ops.push("in");
		return this._binaryOpExpr(ops, null, this._shiftExpr, noIn, function (op, e1, e2) {
			if (op.getValue() == "in")
				return new InExpression(op, e1, e2);
			else
				return new BinaryNumberExpression(op, e1, e2);
		});
	},

	_shiftExpr: function () {
		var expr = this._binaryOpExpr([ ">>>", "<<", ">>" ], null, this._addExpr, false, function (op, e1, e2) {
			return new ShiftExpression(op, e1, e2);
		});
		return expr;
	},

	_addExpr: function () {
		return this._binaryOpExpr([ "+", "-" ], /^[+-]{2}/, this._mulExpr, false, function (op, e1, e2) {
			if (op.getValue() == "+")
				return new AdditiveExpression(op, e1, e2);
			else
				return new BinaryNumberExpression(op, e1, e2);
		});
	},

	_mulExpr: function () {
		return this._binaryOpExpr([ "*", "/", "%" ], null, this._unaryExpr, false, function (op, e1, e2) {
			return new BinaryNumberExpression(op, e1, e2);
		});
	},

	_unaryExpr: function () {
		// simply remove "void"
		this._expectOpt("void");
		// read other unary operators
		var op = this._expectOpt([ "++", "--", "+", "-", "~", "!", "typeof" ]);
		if (op == null)
			return this._asExpr();
		var expr = this._unaryExpr();
		if (expr == null)
			return null;
		switch (op.getValue()) {
		case "++":
		case "--":
			return new PreIncrementExpression(op, expr);
		case "+":
		case "-":
			return new SignExpression(op, expr);
		case "~":
			return new BitwiseNotExpression(op, expr);
		case "!":
			return new LogicalNotExpression(op, expr);
		case "typeof":
			return new TypeofExpression(op, expr);
		}
	},

	_asExpr: function () {
		var expr = this._postfixExpr();
		if (expr == null)
			return null;
		var token;
		while ((token = this._expectOpt("as")) != null) {
			var noConvert = this._expectOpt("__noconvert__");
			var type = this._typeDeclaration(false);
			if (type == null)
				return null;
			expr = noConvert ? new AsNoConvertExpression(token, expr, type) : new AsExpression(token, expr, type);
		}
		return expr;
	},

	_postfixExpr: function () {
		var expr = this._lhsExpr();
		var op = this._expectOpt([ "++", "--", "instanceof" ]);
		if (op == null)
			return expr;
		switch (op.getValue()) {
		case "instanceof":
			var type = this._typeDeclaration(false);
			if (type == null)
				return null;
			return new InstanceofExpression(op, expr, type);
		default:
			return new PostIncrementExpression(op, expr);
		}
	},

	_lhsExpr: function () {
		var expr;
		var token = this._expectOpt([ "new", "super", "function" ]);
		if (token != null) {
			switch (token.getValue()) {
			case "super":
				return this._superExpr();
			case "function":
				expr = this._functionExpr(token);
				break;
			case "new":
				// new pression
				var objectType = this._objectTypeDeclaration();
				if (objectType == null)
					return null;
				if (this._expectOpt("(") != null) {
					var args = this._argsExpr();
					if (args == null)
						return null;
				} else {
					args = [];
				}
				expr = new NewExpression(token, objectType, args);
				break;
			default:
				throw new Error("logic flaw");
			}
		} else {
			expr = this._primaryExpr();
		}
		if (expr == null)
			return null;
		while ((token = this._expectOpt([ "(", "[", "." ])) != null) {
			switch (token.getValue()) {
			case "(":
				if ((args = this._argsExpr()) == null)
					return null;
				expr = new CallExpression(token, expr, args);
				break;
			case "[":
				var index = this._expr(false);
				if (index == null)
					return null;
				if (this._expect("]") == null)
					return null;
				expr = new ArrayExpression(token, expr, index);
				break;
			case ".":
				var identifier = this._expectIdentifier();
				if (identifier == null)
					return null;
				expr = new PropertyExpression(token, expr, identifier);
				break;
			}
		}
		return expr;
	},

	_superExpr: function () {
		if (this._expect(".") == null)
			return null;
		var identifier = this._expectIdentifier();
		if (identifier == null)
			return null;
		// token of the super expression is set to "(" to mimize the differences bet.compile error messages generated by CallExpression
		var token = this._expect("(");
		if (token == null)
			return null;
		var args = this._argsExpr();
		if (args == null)
			return null;
		return new SuperExpression(token, identifier, args);
	},

	_functionExpr: function (token) {
		if (this._expect("(") == null)
			return null;
		var args = this._functionArgumentsExpr();
		if (args == null)
			return null;
		if (this._expect(":") == null)
			return null;
		var returnType = this._typeDeclaration(true);
		if (returnType == null)
			return null;
		if (this._expect("{") == null)
			return null;
		// parse function block
		var state = this._pushFunctionState();
		var lastToken = this._block();
		if (lastToken == null) {
			this._restoreFunctionState(state);
			return null;
		}
		var funcDef = new MemberFunctionDefinition(token, null, ClassDefinition.IS_STATIC, returnType, args, this._locals, this._statements, this._closures, lastToken);
		this._restoreFunctionState(state);
		this._closures.push(funcDef);
		return new FunctionExpression(token, funcDef);
	},

	_primaryExpr: function () {
		var token;
		if ((token = this._expectOpt([ "this", "undefined", "null", "false", "true", "[", "{", "(" ])) != null) {
			switch (token.getValue()) {
			case "this":
				return new ThisExpression(token, null);
			case "undefined":
				return new UndefinedExpression(token);
			case "null":
				return this._nullLiteral(token);
			case "false":
				return new BooleanLiteralExpression(token);
			case "true":
				return new BooleanLiteralExpression(token);
			case "[":
				return this._arrayLiteral(token);
			case "{":
				return this._hashLiteral(token);
			case "(":
				var expr = this._expr(false);
				if (this._expect(")") == null)
					return null;
				return expr;
			}
		} else if ((token = this._expectNumberLiteralOpt()) != null) {
			return new NumberLiteralExpression(token);
		} else if ((token = this._expectIdentifierOpt()) != null) {
			return new IdentifierExpression(token);
		} else if ((token = this._expectStringLiteralOpt()) != null) {
			return new StringLiteralExpression(token);
		} else if ((token = this._expectRegExpLiteralOpt()) != null) {
			return new RegExpLiteralExpression(token);
		} else {
			this._newError("expected primary expression");
		}
	},

	_nullLiteral: function (token) {
		var type = Type.nullType;
		if (this._expectOpt(":") != null) {
			if ((type = this._typeDeclaration(false)) == null)
				return null;
			if (type.equals(Type.variantType) || type instanceof ObjectType || type instanceof StaticFunctionType) {
				// ok
			} else {
				this._newError("type '" + type.toString() + "' is not nullable");
				return null;
			}
		}
		return new NullExpression(token, type);
	},

	_arrayLiteral: function (token) {
		var exprs = [];
		if (this._expectOpt("]") == null) {
			do {
				var expr = this._assignExpr();
				if (expr == null)
					return null;
				exprs.push(expr);
				var token = this._expect([ ",", "]" ]);
				if (token == null)
					return null;
			} while (token.getValue() == ",");
		}
		var type = null;
		if (this._expectOpt(":") != null)
			if ((type = this._typeDeclaration(false)) == null)
				return null;
		return new ArrayLiteralExpression(token, exprs, type);
	},

	_hashLiteral: function (token) {
		var elements = [];
		if (this._expectOpt("}") == null) {
			do {
				// obtain key
				var keyToken;
				if ((keyToken = this._expectIdentifierOpt()) != null
					|| (keyToken = this._expectNumberLiteralOpt()) != null
					|| (keyToken = this._expectStringLiteralOpt()) != null) {
					// ok
				} else {
					this._newError("expected identifier, number or string but got '" + token.toString() + "'");
				}
				// separator
				if (this._expect(":") == null)
					return null;
				// obtain value
				var expr = this._assignExpr();
				if (expr == null)
					return null;
				elements.push(new MapLiteralElement(keyToken, expr));
				// separator
				if ((token = this._expect([ ",", "}" ])) == null)
					return null;
			} while (token.getValue() == ",");
		}
		var type = null;
		if (this._expectOpt(":") != null)
			if ((type = this._typeDeclaration(false)) == null)
				return null;
		return new MapLiteralExpression(token, elements, type);
	},

	_functionArgumentsExpr: function () {
		var args = [];
		if (this._expectOpt(")") == null) {
			do {
				var argName = this._expectIdentifier();
				if (argName == null)
					return null;
				if (this._expect(":", "type declarations are mandatory for function arguments") == null)
					return null;
				var argType = this._typeDeclaration(false);
				if (argType == null)
					return null;
				for (var i = 0; i < args.length; ++i) {
					if (args[i].getName().getValue() == argName.getValue()) {
						this._errors.push(new CompileError(argName, "cannot declare an argument with the same name twice"));
						return null;
					}
				}
				// FIXME KAZUHO support default arguments
				args.push(new ArgumentDeclaration(argName, argType));
				var token = this._expect([ ")", "," ]);
				if (token == null)
					return null;
			} while (token.getValue() == ",");
		}
		return args;
	},

	_argsExpr: function () {
		var args = [];
		if (this._expectOpt(")") == null) {
			do {
				var arg = this._assignExpr(false);
				if (arg == null)
					return null;
				args.push(arg);
				var token = this._expect([ ")", "," ]);
				if (token == null)
					return null;
			} while (token.getValue() == ",");
		}
		return args;
	},

	$_isReservedClassName: function (name) {
		return name.match(/^(Array|Boolean|Date|Function|Map|Number|Object|RegExp|String|Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|JSX)$/) != null;
	}

});

});require.register("platform.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");

// interface
var Platform = exports.Platform = Class.extend({

	// returns root directory of JSX
	// getRoot() : string

	// fileExists(path : string) : bool

	// getFilesInDirectory(path: string) : string [] (throws an exception on error)

	// load a content by name (throws an exception on error)
	// e.g. node.js reads it from files
	//      browsers read it from DOM
	// load(name : string)

	log: function (s) {
		console.log(s);
	},

	warn: function (s) {
		console.warn(s);
	},

	error: function (s) {
		console.error(s);
	}

});
// vim: set noexpandtab

});require.register("statement.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./classdef"));
eval(Class.$import("./expression"));
eval(Class.$import("./type"));
eval(Class.$import("./util"));

"use strict";

var Statement = exports.Statement = Class.extend({

	constructor: function () {
		this._optimizerStash = {};
	},

	// returns whether or not to continue analysing the following statements
	analyze: function (context) {
		if (! (this instanceof CaseStatement || this instanceof DefaultStatement))
			if (! Statement.assertIsReachable(context, this.getToken()))
				return false;
		try {
			return this.doAnalyze(context);
		} catch (e) {
			var token = this.getToken();
			console.error("fatal error while compiling statement at file: " + token.getFilename() + ", line " + token.getLineNumber());
			throw e;
		}
	},

	forEachStatement: function (cb) {
		return true;
	},

	forEachExpression: null, // function forEachExpression(cb : function (expr, replaceCb) : boolean) : boolean

	getToken: null, // returns a token of the statement

	serialize: null,

	doAnalyze: null, // void doAnalyze(context), returns whether or not to continue analysing the following statements

	_analyzeExpr: function (context, expr) {
		if (context.statement != null)
			throw new Error("logic flaw");
		context.statement = this;
		try {
			return expr.analyze(context, null);
		} finally {
			context.statement = null;
		}
	},

	getOptimizerStash: function () {
		return this._optimizerStash;
	},

	$assertIsReachable: function (context, token) {
		if (context.getTopBlock().localVariableStatuses == null) {
			context.errors.push(new CompileError(token, "the code is unreachable"));
			return false;
		}
		return true;
	}

});

var ConstructorInvocationStatement = exports.ConstructorInvocationStatement = Statement.extend({

	constructor: function (qualifiedName, args) {
		Statement.prototype.constructor.call(this);
		this._qualifiedName = qualifiedName;
		this._args = args;
		this._ctorClassDef = null;
		this._ctorType = null;
	},

	getToken: function () {
		return this._qualifiedName.getToken();
	},

	getQualifiedName: function () {
		return this._qualifiedName;
	},

	getArguments: function () {
		return this._args;
	},

	getConstructingClassDef: function () {
		return this._ctorClassDef;
	},

	getConstructorType: function () {
		return this._ctorType;
	},

	serialize: function () {
		return [
			"ConstructorInvocationStatement",
			this._qualifiedName.serialize(),
			Util.serializeArray(this._args)
		];
	},

	doAnalyze: function (context) {
		if (this._qualifiedName.getImport() == null && this._qualifiedName.getToken().getValue() == "super") {
			this._ctorClassDef = context.funcDef.getClassDef().extendClassDef();
		} else {
			if ((this._ctorClassDef = this._qualifiedName.getClass(context)) == null) {
				// error should have been reported already
				return true;
			}
		}
		// analyze args
		var argTypes = Util.analyzeArgs(context, this._args, null);
		if (argTypes == null) {
			// error is reported by callee
			return true;
		}
		var ctorType = this._ctorClassDef.getMemberTypeByName("constructor", false, ClassDefinition.GET_MEMBER_MODE_CLASS_ONLY);
		if (ctorType == null) {
			if (this._args.length != 0) {
				context.errors.push(new CompileError(this._qualifiedName.getToken(), "no function with matching arguments"));
				return true;
			}
			ctorType = new ResolvedFunctionType(Type.voidType, [], false); // implicit constructor
		} else if ((ctorType = ctorType.deduceByArgumentTypes(context, this._qualifiedName.getToken(), argTypes, false)) == null) {
			// error is reported by callee
			return true;
		}
		this._ctorType = ctorType;
		return true;
	},

	forEachExpression: function (cb) {
		if (! Util.forEachExpression(cb, this._args))
			return false;
		return true;
	}

});

// statements that take one expression

var UnaryExpressionStatement = exports.UnaryExpressionStatement = Statement.extend({

	constructor: function (expr) {
		Statement.prototype.constructor.call(this);
		if (expr == null)
			throw new Error("logic flaw");
		this._expr = expr;
	},

	getToken: function () {
		return this._expr.getToken();
	},

	getExpr: function () {
		return this._expr;
	},

	doAnalyze: function (context) {
		this._analyzeExpr(context, this._expr);
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var ExpressionStatement = exports.ExpressionStatement = UnaryExpressionStatement.extend({

	constructor: function (expr) {
		UnaryExpressionStatement.prototype.constructor.call(this, expr);
	},

	serialize: function () {
		return [
			"ExpressionStatement",
			this._expr.serialize()
		];
	}

});

var ReturnStatement = exports.ReturnStatement = Statement.extend({

	constructor: function (token, expr) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._expr = expr; // nullable
	},

	getToken: function () {
		return this._token;
	},

	getExpr: function () {
		return this._expr;
	},

	serialize: function () {
		return [
			"ReturnStatement",
			Util.serializeNullable(this._expr)
		];
	},

	doAnalyze: function (context) {
		var returnType = context.funcDef.getReturnType();
		if (returnType.equals(Type.voidType)) {
			// handle return(void);
			if (this._expr != null) {
				context.errors.push(new CompileError(this._token, "cannot return a value from a void function"));
				return true;
			}
		} else {
			// handle return of values
			if (this._expr == null) {
				context.errors.push(new CompileError(this._token, "cannot return void, the function is declared to return a value of type '" + returnType.toString() + "'"));
				return true;
			}
			if (! this._analyzeExpr(context, this._expr))
				return true;
			var exprType = this._expr != null ? this._expr.getType() : Type.voidType;
			if (exprType == null)
				return true;
			if (! exprType.isConvertibleTo(returnType)) {
				context.errors.push(new CompileError(this._token, "cannot convert '" + exprType.toString() + "' to return type '" + returnType.toString() + "'"));
				return false;
			}
		}
		context.getTopBlock().localVariableStatuses = null;
		return true;
	},

	forEachExpression: function (cb) {
		if (this._expr != null && ! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var DeleteStatement = exports.DeleteStatement = UnaryExpressionStatement.extend({

	constructor: function (token, expr) {
		UnaryExpressionStatement.prototype.constructor.call(this, expr);
		this._token = token;
	},

	getToken: function () {
		return this._token;
	},

	serialize: function () {
		return [
			"DeleteStatement",
			this._expr.serialize()
		];
	},

	doAnalyze: function (context) {
		if (! this._analyzeExpr(context, this._expr))
			return true;
		if (! (this._expr instanceof ArrayExpression)) {
			context.errors.push(new CompileError(this._token, "only properties of a hash object can be deleted"));
			return true;
		}
		var secondExprType = this._expr.getSecondExpr().getType();
		if (secondExprType == null)
			return true; // error should have been already reported
		if (! secondExprType.resolveIfMayBeUndefined().equals(Type.stringType)) {
			context.errors.push(new CompileError(this._token, "only properties of a hash object can be deleted"));
			return true;
		}
		return true;
	}

});

// break and continue

var JumpStatement = exports.JumpStatement = Statement.extend({

	constructor: function (token, label) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._label = label;
	},

	getToken: function () {
		return this._token;
	},

	getLabel: function () {
		return this._label;
	},

	serialize: function () {
		return [
			this._getName(),
			this._token.serialize(),
			Util.serializeNullable(this._label)
		];
	},

	doAnalyze: function (context) {
		var targetBlock = this._determineDestination(context);
		if (targetBlock == null)
			return true;
		if (this instanceof BreakStatement)
			targetBlock.statement.registerVariableStatusesOnBreak(context.getTopBlock().localVariableStatuses);
		else
			targetBlock.statement.registerVariableStatusesOnContinue(context.getTopBlock().localVariableStatuses);
		context.getTopBlock().localVariableStatuses = null;
		return true;
	},

	_determineDestination: function (context) {
		for (var i = context.blockStack.length - 1; ! (context.blockStack[i].statement instanceof MemberFunctionDefinition); --i) {
			var statement = context.blockStack[i].statement;
			// continue unless we are at the destination level
			if (! (statement instanceof LabellableStatement))
				continue;
			if (this._label != null) {
				var statementLabel = statement.getLabel();
				if (statementLabel != null && statementLabel.getValue() == this._label.getValue()) {
					if (this._token.getValue() == "continue" && statement instanceof SwitchStatement) {
						context.errors.push(new CompileError(this._token, "cannot 'continue' to a switch statement"));
						return null;
					}
				} else {
					continue;
				}
			} else {
				if (this._token.getValue() == "continue" && statement instanceof SwitchStatement)
					continue;
			}
			// found the destination
			return context.blockStack[i];
		}
		if (this._label != null)
			context.errors.push(new CompileError(this._label, "label '" + this._label.getValue() + "' is either not defined or invalid as the destination"));
		else
			context.errors.push(new CompileError(this._token, "cannot '" + this._token.getValue() + "' at this point"));
		return null;
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var BreakStatement = exports.BreakStatement = JumpStatement.extend({

	constructor: function (token, label) {
		JumpStatement.prototype.constructor.call(this, token, label);
	},

	_getName: function () {
		return "BreakStatement";
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var ContinueStatement = exports.ContinueStatement = JumpStatement.extend({

	constructor: function (token, label) {
		JumpStatement.prototype.constructor.call(this, token, label);
	},

	_getName: function () {
		return "ContinueStatement";
	},

	forEachExpression: function (cb) {
		return true;
	}

});

// control flow statements

var LabellableStatement = exports.LabellableStatement = Statement.extend({

	constructor: function (token, label) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._label = label;
	},

	getToken: function () {
		return this._token;
	},

	getLabel: function () {
		return this._label;
	},

	_serialize: function () {
		return [
			Util.serializeNullable(this._label)
		];
	},

	_prepareBlockAnalysis: function (context) {
		context.blockStack.push(new BlockContext(context.getTopBlock().localVariableStatuses.clone(), this));
		this._lvStatusesOnBreak = null;
	},

	_abortBlockAnalysis: function (context) {
		context.blockStack.pop();
		this._lvStatusesOnBreak = null;
	},

	_finalizeBlockAnalysis: function (context) {
		context.blockStack.pop();
		context.getTopBlock().localVariableStatuses = this._lvStatusesOnBreak;
		this._lvStatusesOnBreak = null;
	},

	registerVariableStatusesOnBreak: function (statuses) {
		if (statuses != null) {
			if (this._lvStatusesOnBreak == null)
				this._lvStatusesOnBreak = statuses.clone();
			else
				this._lvStatusesOnBreak = this._lvStatusesOnBreak.merge(statuses);
		}
	}

});

var ContinuableStatement = exports.ContinuableStatement = LabellableStatement.extend({

	constructor: function (token, label, statements) {
		LabellableStatement.prototype.constructor.call(this, token, label);
		this._statements = statements;
	},

	getStatements: function () {
		return this._statements;
	},

	_prepareBlockAnalysis: function (context) {
		LabellableStatement.prototype._prepareBlockAnalysis.call(this, context);
		this._lvStatusesOnContinue = null;
	},

	_abortBlockAnalysis: function (context) {
		LabellableStatement.prototype._abortBlockAnalysis.call(this, context);
		this._lvStatusesOnContinue = null;
	},

	_finalizeBlockAnalysis: function (context) {
		LabellableStatement.prototype._finalizeBlockAnalysis.call(this, context);
		this._restoreContinueVariableStatuses(context);
	},

	_restoreContinueVariableStatuses: function (context) {
		if (this._lvStatusesOnContinue != null) {
			if (context.getTopBlock().localVariableStatuses != null)
				context.getTopBlock().localVariableStatuses = context.getTopBlock().localVariableStatuses.merge(this._lvStatusesOnContinue);
			else
				context.getTopBlock().localVariableStatuses = this._lvStatusesOnContinue;
			this._lvStatusesOnContinue = null;
		}
	},

	registerVariableStatusesOnContinue: function (statuses) {
		if (statuses != null) {
			if (this._lvStatusesOnContinue == null)
				this._lvStatusesOnContinue = statuses.clone();
			else
				this._lvStatusesOnContinue = this._lvStatusesOnContinue.merge(statuses);
		}
	}

});

var DoWhileStatement = exports.DoWhileStatement = ContinuableStatement.extend({

	constructor: function (token, label, expr, statements) {
		ContinuableStatement.prototype.constructor.call(this, token, label, statements);
		this._expr = expr;
	},

	getExpr: function () {
		return this._expr;
	},

	serialize: function () {
		return [
			"DoWhileStatement"
		].concat(this._serialize()).concat([
			this._expr.serialize(),
			Util.serializeArray(this._statements)
		]);
	},

	doAnalyze: function (context) {
		this._prepareBlockAnalysis(context);
		try {
			for (var i = 0; i < this._statements.length; ++i)
				if (! this._statements[i].analyze(context))
					return false;
			this._restoreContinueVariableStatuses(context);
			if (! Statement.assertIsReachable(context, this._expr.getToken()))
				return false;
			if (this._analyzeExpr(context, this._expr))
				if (! this._expr.getType().equals(Type.booleanType))
					context.errors.push(new CompileError(this._expr.getToken(), "expression of the while statement should return a boolean"));
			this.registerVariableStatusesOnBreak(context.getTopBlock().localVariableStatuses);
			this._finalizeBlockAnalysis(context);
		} catch (e) {
			this._abortBlockAnalysis(context);
			throw e;
		}
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._statements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var ForInStatement = exports.ForInStatement = ContinuableStatement.extend({

	constructor: function (token, label, lhsExpr, listExpr, statements) {
		ContinuableStatement.prototype.constructor.call(this, token, label, statements);
		this._lhsExpr = lhsExpr;
		this._listExpr = listExpr;
	},

	getLHSExpr: function () {
		return this._lhsExpr;
	},

	getListExpr: function () {
		return this._listExpr;
	},

	getStatements: function () {
		return this._statements;
	},

	serialize: function () {
		return [
			"ForInStatement",
		].concat(this._serialize()).concat([
			this._lhsExpr.serialize(),
			this._listExpr.serialize(),
			Util.serializeArray(this._statements)
		]);
	},

	doAnalyze: function (context) {
		if (! this._analyzeExpr(context, this._listExpr))
			return true;
		var listType = this._listExpr.getType().resolveIfMayBeUndefined();
		var listClassDef;
		var listTypeName;
		if (listType instanceof ObjectType
			&& (listClassDef = listType.getClassDef()) instanceof InstantiatedClassDefinition
			&& ((listTypeName = listClassDef.getTemplateClassName()) == "Array" || listTypeName == "Map")) {
			// ok
		} else {
			context.errors.push(new CompileError(this.getToken(), "list expression of the for..in statement should be an array or a map"));
			return true;
		}
		this._prepareBlockAnalysis(context);
		try {
			this._analyzeExpr(context, this._lhsExpr);
			if (! this._lhsExpr.assertIsAssignable(context, this._token, listTypeName == "Array" ? Type.numberType : Type.stringType))
				return false;
			for (var i = 0; i < this._statements.length; ++i)
				if (! this._statements[i].analyze(context))
					return false;
			this.registerVariableStatusesOnContinue(context.getTopBlock().localVariableStatuses);
			this._finalizeBlockAnalysis(context);
		} catch (e) {
			this._abortBlockAnalysis(context);
			throw e;
		}
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._statements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._lhsExpr, function (expr) { this._lhsExpr = expr; }.bind(this)))
			return false;
		if (! cb(this._listExpr, function (expr) { this._listExpr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var ForStatement = exports.ForStatement = ContinuableStatement.extend({

	constructor: function (token, label, initExpr, condExpr, postExpr, statements) {
		ContinuableStatement.prototype.constructor.call(this, token, label, statements);
		this._initExpr = initExpr;
		this._condExpr = condExpr;
		this._postExpr = postExpr;
	},

	getInitExpr: function () {
		return this._initExpr;
	},

	getCondExpr: function () {
		return this._condExpr;
	},

	getPostExpr: function () {
		return this._postExpr;
	},

	getStatements: function () {
		return this._statements;
	},

	serialize: function () {
		return [
			"ForStatement",
		].concat(this._serialize()).concat([
			Util.serializeNullable(this._initExpr),
			Util.serializeNullable(this._condExpr),
			Util.serializeNullable(this._postExpr),
			Util.serializeArray(this._statements)
		]);
	},

	doAnalyze: function (context) {
		if (this._initExpr != null)
			this._analyzeExpr(context, this._initExpr);
		if (this._condExpr != null)
			if (this._analyzeExpr(context, this._condExpr))
				if (! this._condExpr.getType().equals(Type.booleanType))
					context.errors.push(new CompileError(this._condExpr.getToken(), "condition expression of the for statement should return a boolean"));
		this._prepareBlockAnalysis(context);
		try {
			for (var i = 0; i < this._statements.length; ++i)
				if (! this._statements[i].analyze(context))
					return false;
			this._restoreContinueVariableStatuses(context);
			if (this._postExpr != null) {
				if (! Statement.assertIsReachable(context, this._postExpr.getToken()))
					return false;
				this._analyzeExpr(context, this._postExpr);
				this.registerVariableStatusesOnBreak(context.getTopBlock().localVariableStatuses);
			}
			this._finalizeBlockAnalysis(context);
		} catch (e) {
			this._abortBlockAnalysis(context);
			throw e;
		}
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._statements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (this._initExpr != null && ! cb(this._initExpr, function (expr) { this._initExpr = expr; }.bind(this)))
			return false;
		if (this._condExpr != null && ! cb(this._condExpr, function (expr) { this._condExpr = expr; }.bind(this)))
			return false;
		if (this._postExpr != null && ! cb(this._postExpr, function (expr) { this._postExpr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var IfStatement = exports.IfStatement = Statement.extend({

	constructor: function (token, expr, onTrueStatements, onFalseStatements) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._expr = expr;
		this._onTrueStatements = onTrueStatements;
		this._onFalseStatements = onFalseStatements;
	},

	getToken: function () {
		return this._token;
	},

	getExpr: function () {
		return this._expr;
	},

	setExpr: function (expr) {
		this._expr = expr;
	},

	getOnTrueStatements: function () {
		return this._onTrueStatements;
	},

	getOnFalseStatements: function () {
		return this._onFalseStatements;
	},

	serialize: function () {
		return [
			"IfStatement",
			this._expr.serialize(),
			Util.serializeArray(this._onTrueStatements),
			Util.serializeArray(this._onFalseStatements)
		];
	},

	doAnalyze: function (context) {
		if (this._analyzeExpr(context, this._expr))
			if (! this._expr.getType().equals(Type.booleanType))
				context.errors.push(new CompileError(this._expr.getToken(), "expression of the if statement should return a boolean"));
		// if the expr is true
		context.blockStack.push(new BlockContext(context.getTopBlock().localVariableStatuses.clone(), this));
		try {
			for (var i = 0; i < this._onTrueStatements.length; ++i)
				if (! this._onTrueStatements[i].analyze(context))
					return false;
			var lvStatusesOnTrueStmts = context.getTopBlock().localVariableStatuses;
		} finally {
			context.blockStack.pop();
		}
		// if the expr is false
		try {
			context.blockStack.push(new BlockContext(context.getTopBlock().localVariableStatuses.clone(), this));
			for (var i = 0; i < this._onFalseStatements.length; ++i)
				if (! this._onFalseStatements[i].analyze(context))
					return false;
			var lvStatusesOnFalseStmts = context.getTopBlock().localVariableStatuses;
		} finally {
			context.blockStack.pop();
		}
		// merge the variable statuses
		if (lvStatusesOnTrueStmts != null)
			if (lvStatusesOnFalseStmts != null)
				context.getTopBlock().localVariableStatuses = lvStatusesOnTrueStmts.merge(lvStatusesOnFalseStmts);
			else
				context.getTopBlock().localVariableStatuses = lvStatusesOnTrueStmts;
		else
			context.getTopBlock().localVariableStatuses = lvStatusesOnFalseStmts;
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._onTrueStatements))
			return false;
		if (! Util.forEachStatement(cb, this._onFalseStatements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var SwitchStatement = exports.SwitchStatement = LabellableStatement.extend({

	constructor: function (token, label, expr, statements) {
		LabellableStatement.prototype.constructor.call(this, token, label);
		this._expr = expr;
		this._statements = statements;
	},

	getExpr: function () {
		return this._expr;
	},

	getStatements: function () {
		return this._statements;
	},

	serialize: function () {
		return [
			"SwitchStatement",
		].concat(this._serialize()).concat([
			this._expr.serialize(),
			Util.serializeArray(this._statements)
		]);
	},

	doAnalyze: function (context) {
		if (! this._analyzeExpr(context, this._expr))
			return true;
		var exprType = this._expr.getType().resolveIfMayBeUndefined();
		if (! (exprType.equals(Type.booleanType) || exprType.equals(Type.integerType) || exprType.equals(Type.numberType) || exprType.equals(Type.stringType))) {
			context.errors.push(new CompileError(this._token, "switch statement only accepts boolean, number, or string expressions"));
			return true;
		}
		this._prepareBlockAnalysis(context);
		try {
			var hasDefaultLabel = false;
			for (var i = 0; i < this._statements.length; ++i) {
				var statement = this._statements[i];
				if (! statement.analyze(context))
					return false;
				if (statement instanceof DefaultStatement)
					hasDefaultLabel = true;
			}
			if (! hasDefaultLabel)
				this.registerVariableStatusesOnBreak(context.blockStack[context.blockStack.length - 2].localVariableStatuses);
			this._finalizeBlockAnalysis(context);
		} catch (e) {
			this._abortBlockAnalysis(context);
			throw e;
		}
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._statements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	},

	$resetLocalVariableStatuses: function (context) {
		context.getTopBlock().localVariableStatuses = context.blockStack[context.blockStack.length - 2].localVariableStatuses.clone();
	}

});

var CaseStatement = exports.CaseStatement = Statement.extend({

	constructor: function (token, expr) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._expr = expr;
	},

	getToken: function () {
		return this._token;
	},

	getExpr: function () {
		return this._expr;
	},

	serialize: function () {
		return [
			"CaseStatement",
			this._expr.serialize()
		];
	},

	doAnalyze: function (context) {
		if (! this._analyzeExpr(context, this._expr))
			return true;
		var statement = context.getTopBlock().statement;
		if (! (statement instanceof SwitchStatement))
			throw new Error("logic flaw");
		var expectedType = statement.getExpr().getType();
		if (expectedType == null)
			return true;
		expectedType = expectedType.resolveIfMayBeUndefined();
		var exprType = this._expr.getType();
		if (exprType == null)
			return true;
		exprType = exprType.resolveIfMayBeUndefined();
		if (exprType.equals(expectedType)) {
			// ok
		} else if (Type.isIntegerOrNumber(exprType) && Type.isIntegerOrNumber(expectedType)) {
			// ok
		} else if (expectedType.equals(Type.stringType) && exprType.equals(Type.nullType)) {
			// ok
		} else {
			context.errors.push(new CompileError(this._token, "type mismatch; expected type was '" + expectedType.toString() + "' but got '" + exprType + "'"));
		}
		// reset local variable statuses
		SwitchStatement.resetLocalVariableStatuses(context);
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var DefaultStatement = exports.DefaultStatement = Statement.extend({

	constructor: function (token) {
		Statement.prototype.constructor.call(this);
		this._token = token;
	},

	getToken: function () {
		return this._token;
	},

	serialize: function () {
		return [
			"DefaultStatement"
		];
	},

	doAnalyze: function (context) {
		SwitchStatement.resetLocalVariableStatuses(context);
		return true;
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var WhileStatement = exports.WhileStatement = ContinuableStatement.extend({

	constructor: function (token, label, expr, statements) {
		ContinuableStatement.prototype.constructor.call(this, token, label, statements);
		this._expr = expr;
	},

	getExpr: function () {
		return this._expr;
	},

	getStatements: function () {
		return this._statements;
	},

	serialize: function () {
		return [
			"WhileStatement",
		].concat(this._serialize()).concat([
			this._expr.serialize(),
			Util.serializeArray(this._statements)
		]);
	},

	doAnalyze: function (context) {
		if (this._analyzeExpr(context, this._expr))
			if (! this._expr.getType().equals(Type.booleanType))
				context.errors.push(new CompileError(this._expr.getToken(), "expression of the while statement should return a boolean"));
		this._prepareBlockAnalysis(context);
		try {
			for (var i = 0; i < this._statements.length; ++i)
				if (! this._statements[i].analyze(context))
					return false;
			this.registerVariableStatusesOnContinue(context.getTopBlock().localVariableStatuses);
			this._finalizeBlockAnalysis(context);
		} catch (e) {
			this._abortBlockAnalysis(context);
			throw e;
		}
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._statements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var TryStatement = exports.TryStatement = Statement.extend({

	constructor: function (token, tryStatements, catchStatements, finallyStatements) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._tryStatements = tryStatements;
		this._catchStatements = catchStatements;
		this._finallyStatements = finallyStatements;
	},

	getToken: function () {
		return this._token;
	},

	getTryStatements: function () {
		return this._tryStatements;
	},

	getCatchStatements: function () {
		return this._catchStatements;
	},

	getFinallyStatements: function () {
		return this._finallyStatements;
	},

	serialize: function () {
		return [
			"TryStatement",
			Util.serializeArray(this._tryStatements),
			Util.serializeNullable(this._catchIdentifier),
			Util.serializeArray(this._catchStatements),
			Util.serializeArray(this._finallyStatements)
		];
	},

	doAnalyze: function (context) {
		// try
		context.blockStack.push(new BlockContext(context.getTopBlock().localVariableStatuses.clone(), this));
		try {
			for (var i = 0; i < this._tryStatements.length; ++i)
				if (! this._tryStatements[i].analyze(context))
					return false;
			// change the statuses to may (since they might be left uninitialized due to an exception)
			var lvStatusesAfterTry = context.getTopBlock().localVariableStatuses;
		} finally {
			context.blockStack.pop();
		}
		context.getTopBlock().localVariableStatuses = context.getTopBlock().localVariableStatuses.merge(lvStatusesAfterTry);
		// catch
		for (var i = 0; i < this._catchStatements.length; ++i) {
			if (! this._catchStatements[i].analyze(context))
				return false;
		}
		// finally
		for (var i = 0; i < this._finallyStatements.length; ++i)
			if (! this._finallyStatements[i].analyze(context))
				return false;
		return true;
	},

	forEachStatement: function (cb) {
		if (! Util.forEachStatement(cb, this._tryStatements))
			return false;
		if (! Util.forEachStatement(cb, this._catchStatements))
			return false;
		if (! Util.forEachStatement(cb, this._finallyStatements))
			return false;
		return true;
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var CatchStatement = exports.CatchStatement = Statement.extend({

	constructor: function (token, local, statements) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._local = local;
		this._statements = statements;
	},

	getToken: function () {
		return this._token;
	},

	getLocal: function () {
		return this._local;
	},

	getStatements: function () {
		return this._statements;
	},

	serialize: function () {
		return [
			"CatchStatement",
			this._token.serialize(),
			this._local.serialize(),
			Util.serializeArray(this._statements)
		];
	},

	doAnalyze: function (context) {
		// check the catch type
		var catchType = this.getLocal().getType();
		if (catchType instanceof ObjectType || catchType.equals(Type.variantType)) {
			for (var j = 0; j < i; ++j) {
				var prevCatchType = this._catchStatements[j].getLocal().getType();
				if (catchType.isConvertibleTo(prevCatchType)) {
					context.errors.push(new CompileError(
						this._token,
						"code is unreachable, a broader catch statement for type '" + prevCatchType.toString() + "' already exists"));
					break;
				}
			}
		} else {
			context.errors.push(new CompileError(this._token, "only objects or a variant may be caught"));
		}
		// analyze the statements
		context.blockStack.push(new BlockContext(context.getTopBlock().localVariableStatuses.clone(), this));
		try {
			for (var i = 0; i < this._statements.length; ++i) {
				if (! this._statements[i].analyze(context))
					return false;
			}
			var lvStatusesAfterCatch = context.getTopBlock().localVariableStatuses;
		} finally {
			context.blockStack.pop();
		}
		context.getTopBlock().localVariableStatuses = context.getTopBlock().localVariableStatuses.merge(lvStatusesAfterCatch);
		return true;
	},

	forEachStatement: function (cb) {
		return Util.forEachStatement(cb, this._statements);
	},

	forEachExpression: function (cb) {
		return true;
	}

});

var ThrowStatement = exports.ThrowStatement = Statement.extend({

	constructor: function (token, expr) {
		Statement.prototype.constructor.call(this);
		this._token = token;
		this._expr = expr;
	},

	getToken: function () {
		return this._token;
	},

	getExpr: function () {
		return this._expr;
	},

	serialize: function () {
		return [
			"ThrowStatement",
			this._token.serialize(),
			this._expr.serialize()
		];
	},

	doAnalyze: function (context) {
		if (! this._analyzeExpr(context, this._expr))
			return true;
		var errorClassDef = context.parser.lookup(context.errors, this._token, "Error");
		if (errorClassDef == null)
			throw new Error("could not find definition for Error");
		if (this._expr.getType().equals(Type.voidType)) {
			context.errors.push(new CompileError(this._token, "cannot throw 'void'"));
			return true;
		}
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

// information statements

var InformationStatement = exports.InformationStatement = Statement.extend({

	constructor: function (token) {
		Statement.prototype.constructor.call(this);
		this._token = token;
	},

	getToken: function () {
		return this._token;
	},

});

var AssertStatement = exports.AssertStatement = InformationStatement.extend({

	constructor: function (token, expr) {
		InformationStatement.prototype.constructor.call(this, token);
		this._expr = expr;
	},

	getExpr: function () {
		return this._expr;
	},

	serialize: function () {
		return [
			"AssertStatement",
			this._token.serialize(),
			Util.serializeArray(this._expr)
		];
	},

	doAnalyze: function (context) {
		if (! this._analyzeExpr(context, this._expr))
			return true;
		var exprType = this._expr.getType();
		if (! exprType.equals(Type.booleanType))
			context.errors.push(new CompileError(this._exprs[0].getToken(), "cannot assert type " + exprType.serialize()));
		return true;
	},

	forEachExpression: function (cb) {
		if (! cb(this._expr, function (expr) { this._expr = expr; }.bind(this)))
			return false;
		return true;
	}

});

var LogStatement = exports.LogStatement = InformationStatement.extend({

	constructor: function (token, exprs) {
		InformationStatement.prototype.constructor.call(this, token);
		this._exprs = exprs;
	},

	getExprs: function () {
		return this._exprs;
	},

	serialize: function () {
		return [
			"LogStatement",
			this._token.serialize(),
			Util.serializeArray(this._exprs)
		];
	},

	doAnalyze: function (context) {
		for (var i = 0; i < this._exprs.length; ++i) {
			if (! this._analyzeExpr(context, this._exprs[i]))
				return true;
			var exprType = this._exprs[i].getType();
			if (exprType == null)
				return true;
			if (exprType.equals(Type.voidType)) {
				context.errors.push(new CompileError(this._token, "cannot log a void expression"));
				break;
			}
		}
		return true;
	},

	forEachExpression: function (cb) {
		return Util.forEachExpression(cb, this._exprs);
	}

});

var DebuggerStatement = exports.DebuggerStatement = InformationStatement.extend({

	constructor: function (token) {
		InformationStatement.prototype.constructor.call(this, token);
	},

	serialize: function () {
		return [
			"DebuggerStatement",
			this._token.serialize()
		];
	},

	doAnalyze: function (context) {
		return true;
	},

	forEachExpression: function (cb) {
		return true;
	}

});

});require.register("Test.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

"use strict";
/*
# NAME

Test - Nestable Testing libraries

# SYNOPSIS

	var Test = require('/path/to/Test');

	var test = new Test(__filename); // create a test case

	test.beforeEach(function() { ... });
	test.afterEach(function() { ... });

	test.describe('first test case', function(t) {
		var x = 42;

		t.expect(x).toBe(42);
		t.expect(x).notToBe(3.14);
		t.expect(x).toBeFalsy('message');

		return 'foo';
	}).next('second test case', function(t, value) {
		t.expect(vallue).toBe('foo');
	});

	test.done();
*/


var Class = require("./Class");
var dump  = require("./dump");

var Test = module.exports = Class.extend({
	constructor: function(filename, parent) {
		this._parent  = parent;
		this._name    = filename;
		this._count   = 0;
		this._pass    = 0;
		this._start   = Date.now();
		this._status  = 0; // exit code

		this.verbose = true;
		if(typeof(process) !== 'undefined' && !process.stdout.isTTY) {
			this.verbose = false;
		}

		this.note('Testing', this.toString());
	},

	toString: function() {
		return 'Test(' + dump(this._name) + ')';
	},

	describe: function(name, block) {
		this._doBlock(name, block);
		return this;
	},

	next: function(name, block) {
		if(this._nextArg == null) {
			this._ok(false, name);
		}
		else {
			this._doBlock(name, block, this._nextArg);
		}
		return this;
	},

	setNextArg: function(nextArg) {
		this._nextArg = nextArg;
	},

	_doBlock: function(name, block, nextArg) {
		var subtest = new Test.Subtest(name, this);
		this.note(name);
		try {
			if(nextArg != null) {
				block(subtest, nextArg);
			}
			else {
				block(subtest);
			}
		} catch(e) {
			this._status = 1;

			this.fail('subtest ' + name + "\n" + e.stack);

			subtest.done(null);
		}
	},

	expect: function(value, message) {
		return new Test.Matcher(this, ++this._count, value, message);
	},

	fail: function(message) {
		++this._count;
		this._ok(false, message);
	},

	_ok: function(result, message, diagnostics) {
		var args = [];

		if(result) {
			++this._pass;
			args.push('ok');
		}
		else {
			args.push('not ok');
		}

		args.push(this._count);

		args.push('-', message);
		this.log.apply(this, args);

		if(diagnostics != null) {
			this.diag((new Error(diagnostics)).stack);
		}
	},

	done: function() {
		this.log('1..' + this._count);

		if(this._count !== this._pass) {
			this.diag('Looks like you failed',
					  (this._count - this._pass),
					  'test of', this._count);
			this._status = 1;
		}
		this.note('elapsed', Date.now() - this._start, 'ms.');

		process.exit(this._status);
	},

	// format mes
	// sages
	_makeMessage: function(__va_args__) {
		var m = Array.prototype.join.call(arguments, ' ');
		var s = m.split(/\n/);
		var first = s.shift();

		if(s.length === 0) {
			return first;
		}
		else {
			return first + "\n" + s.join("\n").replace(/^/mg, '# ');
		}
	},

	explain: function(v) {
		return dump(v);
	},

	note: function(__va_args__) {
		if(!this.verbose) {
			return;
		}

		var m = Array.prototype.join.call(arguments, ' ');
		console.warn('# ' + this._makeMessage(m));
	},
	diag: function(__va_args__) {
		var m = Array.prototype.join.call(arguments, ' ');
		console.warn('# ' + this._makeMessage(m));
	},
	log: function(__va_args__) {
		var m = Array.prototype.join.call(arguments, ' ');
		console.log(m);
	}
});

Test.Subtest = Class.extend({
	constructor: function(name, parent) {
		this._name   = name;
		this._parent = parent;
	},
	toString: function() {
		return this._parent.toString() + '.' +
			'Subtest(' + dump(this._name) + ')';
	},

	done: function(nextArg) {
		this._parent.setNextArg(nextArg);
	},

	describe: function(_) {
		this._parent.describe.apply(this._parent, arguments);
	},
	next: function(_) {
		this._parent.next.apply(this._parent, arguments);
	},

	expect: function(_) {
		return this._parent.expect.apply(this._parent, arguments);
	},

	explain: function(_) {
		return this._parent.explain.apply(this._parent, arguments);
	},
	note: function(_) {
		this._parent.note.apply(this._parent, arguments);
	},
	diag: function(_) {
		this._parent.diag.apply(this._parent, arguments);
	},
	log: function(_) {
		this._parent.log.apply(this._parent, arguments);
	}
});

Test.Matcher = Class.extend({
	constructor: function(context, id, value, message) {
		this._context = context;
		this._id      = id;
		this._value   = value;
		this._message = message;
	},
	toString: function() {
		return 'Test.Matcher( #' + id + " "+ dump(this._value) +  ')';
	},

	// matchers
	toBe: function(expected) {
		if(this._value === expected) {
			this._context._ok(true, this._message);
		}
		else {
			this._context._ok(false, this._message,
				"Failed to test " + this._id + "\n" +
				"Expected: " + dump(expected) + "\n" +
				"Got:      " + dump(this._value)
			);
		}
	},
	toBeInstanceOf: function(expectedClass) {
		if(this._value instanceof expectedClass) {
			this._context._ok(true, this._message);
		}
		else {
			this._context._ok(false, this._message,
				"Failed to test " + this._id + "\n" +
				"Expected class: " + expectedClass + "\n" +
				"Got instance:   " + this._value
			);
		}
	},
	toBeTruthy: function() {
		if(this._value) {
			this._context._ok(true, this._message);
		}
		else {
			this._context._ok(false, this._message,
				"Failed to test " + this._id + " to be truthy\n" +
				"Got: " + dump(this._value)
			);
		}
	},
	toBeFalsy: function() {
		if(!this._value) {
			this._context._ok(true, this._message);
		}
		else {
			this._context._ok(false, this._message,
				"Failed to test " + this._id + " to be falsy\n" +
				"Got: " + dump(this._value)
			);
		}
	}
});

});require.register("type.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./classdef"));
eval(Class.$import("./util"));

"use strict";

var Type = exports.Type = Class.extend({

	$_initialize: function () {
		this.voidType = new VoidType();
		this.undefinedType = new UndefinedType();
		this.nullType = new NullType();
		this.booleanType = new BooleanType();
		this.integerType = new IntegerType();
		this.numberType = new NumberType();
		this.stringType = new StringType();
		this.variantType = new VariantType();
	},

	serialize: function () {
		return this.toString();
	},

	isAssignable: null, // bool isAssignable()
	isConvertibleTo: null, // bool isConvertibleTo(type)
	getClassDef: null, // ClassDefinition getClassDef()

	equals: function (x) {
		return this == x || ((x instanceof Type) && this.toString() == x.toString());
	},

	resolveIfMayBeUndefined: function () {
		if (this instanceof MayBeUndefinedType)
			return this.getBaseType();
		return this;
	},

	asAssignableType: function () {
		return this;
	},

	toMayBeUndefinedType: function () {
		if (this instanceof MayBeUndefinedType || this instanceof VariantType)
			return this;
		return new MayBeUndefinedType(this);
	},

	$templateTypeToString: function (parameterizedTypeName, typeArgs) {
		var s = parameterizedTypeName + ".<";
		for (var i = 0; i < typeArgs.length; ++i) {
			if (i != 0)
				s += ",";
			s += typeArgs[i].toString();
		}
		s += ">";
		return s;
	},

	$isIntegerOrNumber: function (type) {
		return type instanceof IntegerType || type instanceof NumberType;
	}

});

// void and null are special types

var VoidType = exports.VoidType = Type.extend({

	instantiate: function (instantiationContext) {
		return this;
	},

	isAssignable: function () {
		return false;
	},

	isConvertibleTo: function (type) {
		return false;
	},

	getClassDef: function () {
		throw new Error("not supported");
	},

	toString: function () {
		return "void";
	}

});

var NullType = exports.NullType = Type.extend({

	instantiate: function (instantiationContext) {
		return this;
	},

	isAssignable: function () {
		return false;
	},

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		return type instanceof ObjectType || type instanceof VariantType || type instanceof StaticFunctionType;
	},

	getClassDef: function () {
		throw new Error("not supported");
	},

	toString: function () {
		return "null";
	}

});

// primitive types

var PrimitiveType = exports.PrimitiveType = Type.extend({

	instantiate: function (instantiationContext) {
		return this;
	},

	isAssignable: function () {
		return true; // still does not support "const" qualifier
	}

});

var BooleanType = exports.BooleanType = PrimitiveType.extend({

	$_classDef: null,

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		return type instanceof BooleanType || type instanceof VariantType;
	},

	getClassDef: function () {
		return BooleanType._classDef;
	},

	toString: function () {
		return "boolean";
	}

});

var IntegerType = exports.IntegerType = PrimitiveType.extend({

	$_classDef: null,

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		return type instanceof IntegerType || type instanceof NumberType || type instanceof VariantType;
	},

	getClassDef: function () {
		return NumberType._classDef;
	},

	toString: function () {
		return "int";
	}

});

var NumberType = exports.NumberType = PrimitiveType.extend({

	$_classDef: null,

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		return type instanceof IntegerType || type instanceof NumberType || type instanceof VariantType;
	},

	getClassDef: function () {
		return NumberType._classDef;
	},

	toString: function () {
		return "number";
	}

});

var StringType = exports.StringType = PrimitiveType.extend({

	$_classDef: null,

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		return type instanceof StringType || type instanceof VariantType;
	},

	getClassDef: function () {
		return StringType._classDef;
	},

	toString: function () {
		return "string";
	}

});

// any type
var VariantType = exports.VariantType = Type.extend({

	instantiate: function (instantiationContext) {
		return this;
	},

	isAssignable: function () {
		return true;
	},

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		return type instanceof VariantType;
	},

	getClassDef: function () {
		throw new Error("not supported");
	},

	toString: function () {
		return "variant";
	}

});

// undefined and MayBeUndefined

var UndefinedType = exports.UndefinedType = Type.extend({

	instantiate: function (instantiationContext) {
		return this;
	},

	isAssignable: function () {
		return false;
	},

	isConvertibleTo: function (type) {
		return type instanceof MayBeUndefinedType || type instanceof VariantType;
	},

	getClassDef: function () {
		throw new Error("not supported");
	},

	toString: function () {
		return "undefined";
	}

});


var MayBeUndefinedType = exports.MayBeUndefinedType = Type.extend({

	constructor: function (type) {
		if (type.equals(Type.variantType))
			throw new Error("logic error, cannot create MayBeUndefined.<variant>");
		this._baseType = type instanceof MayBeUndefinedType ? type._baseType : type;
	},

	instantiate: function (instantiationContext) {
		var baseType = this._baseType.instantiate(instantiationContext);
		return baseType.toMayBeUndefinedType();
	},

	isConvertibleTo: function (type) {
		return this._baseType.isConvertibleTo(type instanceof MayBeUndefinedType ? type._baseType : type);
	},

	isAssignable: function () {
		return true;
	},

	getClassDef: function () {
		return this._baseType.getClassDef();
	},

	getBaseType: function () {
		return this._baseType;
	},

	toString: function () {
		return "MayBeUndefined.<" + this._baseType.toString() + ">";
	}

});

// class and object types

var ClassDefType = exports.ClassDefType = Type.extend({

	constructor: function (classDef) {
		this._classDef = classDef;
	},

	instantiate: function (instantiationContext) {
		throw new Error("logic flaw; ClassDefType is created during semantic analysis, after template instantiation");
	},

	isConvertibleTo: function (type) {
		return false;
	},

	isAssignable: function () {
		return false;
	},

	getClassDef: function () {
		return this._classDef;
	},

	toString: function () {
		return this._classDef.className();
	}

});

var ObjectType = exports.ObjectType = Type.extend({

	constructor: function (classDef) {
		this._classDef = classDef;
	},

	instantiate: function (instantiationContext) {
		throw new Error("logic flaw; ObjectType is created during semantic analysis, after template instantiation");
	},

	resolveType: function (context) {
		if (this._classDef == null)
			throw new Error("logic flaw");
	},

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		if (type instanceof VariantType)
			return true;
		// conversions from Number / String to number / string is handled in each operator (since the behavior differ bet. the operators)
		if (! (type instanceof ObjectType))
			return false;
		return this._classDef.isConvertibleTo(type._classDef);
	},

	isAssignable: function () {
		return true; // still does not support "const" qualifier
	},

	getClassDef: function () {
		return this._classDef;
	},

	toString: function () {
		return this._classDef.className();
	}

});

var ParsedObjectType = exports.ParsedObjectType = ObjectType.extend({

	constructor: function (qualifiedName, typeArgs) {
		ObjectType.prototype.constructor.call(this, null);
		this._qualifiedName = qualifiedName;
		this._typeArguments = typeArgs;
	},

	instantiate: function (instantiationContext) {
		if (this._typeArguments.length == 0) {
			var actualType = instantiationContext.typemap[this._qualifiedName.getToken().getValue()];
			if (actualType != undefined)
				return actualType;
		}
		var typeArgs = [];
		for (var i = 0; i < this._typeArguments.length; ++i) {
			var actualType = instantiationContext.typemap[this._typeArguments[i].toString()];
			typeArgs[i] = actualType != undefined ? actualType : this._typeArguments[i];
		}
		var objectType = new ParsedObjectType(this._qualifiedName, typeArgs);
		instantiationContext.objectTypesUsed.push(objectType);
		return objectType;
	},

	resolveType: function (context) {
		if (this._classDef == null) {
			if (this._typeArguments.length == 0) {
				this._classDef = this._qualifiedName.getClass(context);
			} else {
				// get the already-instantiated class (FIXME refactor, or should we move QualifiedName#getClass to somewhere else?)
				if ((this._classDef = context.parser.lookup(context.errors, this._qualifiedName.getToken(), this.toString())) == null)
					context.errors.push(new CompileError(this._token, "'" + this.toString() + "' is not defined"));
			}
		}
	},

	toString: function () {
		return this._typeArguments.length != 0 ? Type.templateTypeToString(this._qualifiedName.getToken().getValue(), this._typeArguments) : this._qualifiedName.getToken().getValue();
	}

});

// function types

var FunctionType = exports.FunctionType = Type.extend({

	$_classDef: null,

	getClassDef: function () {
		return FunctionType._classDef;
	}

});

var FunctionChoiceType = exports.FunctionChoiceType = FunctionType.extend({

	constructor: function (types) {
		this._types = types;
	},

	isAssignable: function () {
		return false;
	},

	asAssignableType: function () {
		throw new Error("logic flaw");
	},

	isConvertibleTo: function (type) {
		return false;
	},

	deduceByArgumentTypes: function (context, operatorToken, argTypes, isStatic) {
		// try an exact match
		for (var i = 0; i < this._types.length; ++i)
			if (this._types[i]._deduceByArgumentTypes(argTypes, isStatic, true))
				return this._types[i];
		// try loose match
		var matched = [];
		for (var i = 0; i < this._types.length; ++i)
			if (this._types[i]._deduceByArgumentTypes(argTypes, isStatic, false))
				matched.push(this._types[i]);
		switch (matched.length) {
		case 0:
			context.errors.push(new CompileError(operatorToken, "no function with matching arguments"));
			break;
		case 1:
			return matched[0];
		default:
			context.errors.push(new CompileError(operatorToken, "result of function resolution using the arguments is ambiguous"));
			break;
		}
		return null;
	},

	toString: function () {
		return this._types.length == 1 ? this._types[0].toString() : "<<multiple choices>>";
	}

});

var ResolvedFunctionType = exports.ResolvedFunctionType = FunctionType.extend({

	constructor: function (returnType, argTypes, isAssignable) {
		this._returnType = returnType;
		this._argTypes = argTypes;
		this._isAssignable = isAssignable;
	},

	setIsAssignable: function (isAssignable) {
		this._isAssignable = isAssignable;
		return this;
	},

	isAssignable: function () {
		return this._isAssignable;
	},

	asAssignableType: function () {
		return this._clone().setIsAssignable(true);
	},

	getReturnType: function () {
		return this._returnType;
	},

	getArgumentTypes: function () {
		return this._argTypes;
	},

	deduceByArgumentTypes: function (context, operatorToken, argTypes, isStatic) {
		if (! this._deduceByArgumentTypes(argTypes, isStatic, false)) {
			context.errors.push(new CompileError(operatorToken, "no function with matching arguments"));
			return null;
		}
		return this;
	},

	_deduceByArgumentTypes: function (argTypes, isStatic, exact) {
		if ((this instanceof StaticFunctionType) != isStatic)
			return false;
		if (this._argTypes.length != argTypes.length)
			return false;
		for (var i = 0; i < argTypes.length; i++) {
			if (this._argTypes[i].equals(argTypes[i])) {
				// ok
			} else {
				if (exact)
					return false;
				if (! argTypes[i].isConvertibleTo(this._argTypes[i]))
					return false;
			}
		}
		return true;
	},

	toString: function () {
		var args = [];
		for (var i = 0; i < this._argTypes.length; ++i)
			args[i] = " : " + this._argTypes[i].toString();
		return this._toStringPrefix() + "function (" + args.join(", ") + ") : " + this._returnType.toString();
	}

});

var StaticFunctionType = exports.StaticFunctionType = ResolvedFunctionType.extend({

	constructor: function (returnType, argTypes, isAssignable) {
		ResolvedFunctionType.prototype.constructor.call(this, returnType, argTypes, isAssignable);
	},

	instantiate: function (instantiationContext) {
		var returnType = this._returnType.instantiate(instantiationContext);
		if (returnType == null)
			return null;
		var argTypes = [];
		for (var i = 0; i < this._argTypes.length; ++i)
			if ((argTypes[i] = this._argTypes[i].instantiate(instantiationContext)) == null)
				return null;
		return new StaticFunctionType(returnType, argTypes, this._isAssignable);
	},

	_clone: function () {
		return new StaticFunctionType(this._returnType, this._argTypes, this._isAssignable);
	},

	isConvertibleTo: function (type) {
		type = type.resolveIfMayBeUndefined();
		if (type instanceof VariantType)
			return true;
		if (! (type instanceof StaticFunctionType))
			return false;
		if (! this._returnType.equals(type.getReturnType()))
			return false;
		return this._deduceByArgumentTypes(type.getArgumentTypes(), true, true);
	},

	_toStringPrefix: function () {
		return "";
	}

});

var MemberFunctionType = exports.MemberFunctionType = ResolvedFunctionType.extend({

	constructor: function (objectType, returnType, argTypes, isAssignable) {
		ResolvedFunctionType.prototype.constructor.call(this, returnType, argTypes, isAssignable);
		this._objectType = objectType;
	},

	_clone: function () {
		return new MemberFunctionType(this._objectType, this._returnType, this._argTypes, this._isAssignable);
	},

	_toStringPrefix: function () {
		return this._objectType.toString() + ".";
	},

	getObjectType: function () {
		return this._objectType;
	}

});

Type._initialize();

});require.register("util.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

"use strict";

var Class = require("./Class");

var Util = exports.Util = Class.extend({

	$cloneArray: function (a) {
		var r = [];
		for (var i = 0; i < a.length; ++i)
			r[i] = a[i].clone();
		return r;
	},

	$serializeArray: function (a) {
		if (a == null)
			return null;
		var ret = [];
		for (var i = 0; i < a.length; ++i)
			ret[i] = a[i].serialize();
		return ret;
	},

	$serializeNullable: function (v) {
		if (v == null)
			return null;
		return v.serialize();
	},

	$repeat: function(c, n) {
		var s = "";
		for(var i = 0; i < n; ++i) {
			s += c;
		}
		return s;
	},

	// Usage: format("%1 %% %2", ["foo", "bar"]) -> "foo % bar"
	$format: function(fmt, args) {
		if(!(args instanceof Array)) {
			throw new Error("args must be an Array");
		}

		var i = 0;
		return fmt.replace(/%(\d+|%)/g, function(s, f) {
			if (f === "%") {
				return "%";
			}
			else {
				return args[parseInt(f) - 1];
			}
		});
	},

	$analyzeArgs: function (context, args, parentExpr) {
		var argTypes = [];
		for (var i = 0; i < args.length; ++i) {
			if (! args[i].analyze(context, parentExpr))
				return null;
			argTypes[i] = args[i].getType();
		}
		return argTypes;
	},

	$typesAreEqual : function (x, y) {
		if (x.length != y.length)
			return false;
		for (var i = 0; i < x.length; ++i)
			if (! x[i].equals(y[i]))
				return false;
		return true;
	},

	$forEachStatement: function (cb, statements) {
		if (statements != null)
			for (var i = 0; i < statements.length; ++i)
				if (! cb(statements[i]))
					return false;
		return true;
	},

	$forEachExpression: function (cb, exprs) {
		if (exprs != null)
			for (var i = 0; i < exprs.length; ++i)
				if (! cb(exprs[i], function (expr) { exprs[i] = expr; }.bind(this)))
					return false;
		return true;
	},

	$encodeStringLiteral: function (str) {
		var escaped = str.replace(/[\0- '"\\\u007f-\uffff]/g, function (ch) {
			if (ch == "\0") {
				return "\\0";
			} else if (ch == "'" || ch == "\"" || ch == "\\") {
				return "\\" + ch;
			} else {
				var t = "000" + ch.charCodeAt(0).toString(16);
				t = t.substring(t.length - 4);
				return "\\u" + t;
			}
		});
		return "\"" + escaped + "\"";
	},

	$decodeStringLiteral: function (literal) {
		var matched = literal.match(/^([\'\"]).*([\'\"])$/);
		if (matched == null || matched[1] != matched[2])
			throw new Error("input string is not quoted properly: " + literal);
		var src = literal.substring(1, literal.length - 1);
		var decoded = "";
		var pos = 0, backslashAt;
		while ((backslashAt = src.indexOf("\\", pos)) != -1) {
			// copy the string before backslash
			decoded += src.substring(pos, backslashAt);
			pos = backslashAt + 1;
			// decode
			if (pos == src.length)
				throw new Error("last character within a string literal cannot be a backslash: " + literal);
			var escapeChar = src.charAt(pos++);
			switch (escapeChar) {
			case "'":
			case "\"":
			case "\\":
				decoded += escapeChar;
				break;
			case "b": decoded += "\b"; break;
			case "f": decoded += "\f"; break;
			case "n": decoded += "\n"; break;
			case "r": decoded += "\r"; break;
			case "t": decoded += "\t"; break;
			case "v": decoded += "\v"; break;
			case "u":
				var matched = src.substring(pos).match(/^([0-9A-Fa-f]{4})/);
				if (matched == null)
					throw new Error("expected four hexdigits after \\u: " + literal);
				decoded += String.fromCharCode(parseInt(matched[1], 16));
				pos += 4;
				break;
			case "0":
				if (pos == src.length || src.charAt(pos).match(/[0-9]/) == null)
					decoded += "\0";
				else
					throw new Error("found a digit after '\\0': " + literal);
				break;
			}
		}
		decoded += src.substring(pos);
		return decoded;
	},

	$resolvePath: function (path) {
		var tokens = path.split("/");
		for (var i = 0; i < tokens.length;) {
			if (tokens[i] == ".") {
				tokens.splice(i, 1);
			} else if (tokens[i] == ".." && i != 0 && tokens[i - 1] != "..") {
				if (i == 1 && tokens[0] == "") {
					tokens.splice(i, 1);
				} else {
					tokens.splice(i - 1, 2);
					i -= 1;
				}
			} else {
				i++;
			}
		}
		return tokens.join("/");
	}

});

var TemplateInstantiationRequest = exports.TemplateInstantiationRequest = Class.extend({

	constructor: function (token, className, typeArgs) {
		this._token = token;
		this._className = className;
		this._typeArgs = typeArgs;
	},

	getToken: function() {
		return this._token;
	},

	getClassName: function () {
		return this._className;
	},

	getTypeArguments: function () {
		return this._typeArgs;
	}

});

var CompileError = exports.CompileError = Class.extend({

	constructor: function () {
		switch (arguments.length) {
		case 2: // token, text
			var token = arguments[0];
			if(token != null) {
				this._filename = token.getFilename();
				this._lineNumber = token.getLineNumber();
				this._columnNumber = token.getColumnNumber();
				// FIXME: deal with visual width
				this._size = token.getValue().length;
				this._message = arguments[1];
			}
			else {
				CompileError.call(this, null, 0, -1, arguments[1]);
			}
			break;
		case 4: // filename, lineNumber, columnNumber, text
			this._filename = arguments[0];
			this._lineNumber = arguments[1];
			this._columnNumber = arguments[2];
			this._message = arguments[3];
			this._size = 1;
			break;
		default:
			throw new Error("Unrecognized arguments for CompileError: " + Array.prototype.join.call(arguments, ", ") );

		}
	},

	format: function (compiler) {
		if (this._filename == null) {
			return this._message + "\n";
		}

		var content = compiler.getFileContent([] /* ignore errors */, null, this._filename);
		var sourceLine = content.split(/\n/)[ this._lineNumber - 1 ] + "\n";

		// fix visual width
		var col = this._columnNumber;
		var TAB_WIDTH = 4;
		var tabs = sourceLine.slice(0, col).match(/\t/g);
		if(tabs != null) {
			col += (TAB_WIDTH-1) * tabs.length;
		}

		sourceLine  = sourceLine.replace(/\t/g, Util.repeat(" ", TAB_WIDTH));
		sourceLine += Util.repeat(" ", col);
		sourceLine += Util.repeat("^", this._size);

		return Util.format("[%1:%2] %3\n%4\n",
						   [this._filename, this._lineNumber, this._message, sourceLine]);
	}

});


// vim: set noexpandtab:

});require.register("validate.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

"use strict";

var inspect;
try {
    inspect = require("util").inspect; // on node
}
catch(e) {
    inspect = function(x) { return x };
}


function isa(expr, t) {
    if(expr == null) {
        throw new Error("Assertion failed: expected " +
                       t +
                       " but got " + inspect(expr));
    }
    if(typeof(t) === "string") {
        if(!(typeof(expr) === t)) {
            throw new Error("Assertion failed: " +
                            inspect(expr) +
                            " is not a type of " + t);
        }
    }
    else {
        if(!(expr instanceof t)) {
            throw new Error("Assertion failed: " +
                            inspect(expr) +
                            " is not an instance of " + t.name || t);
        }
    }
};

exports.isa = isa;


});require.register("web-interface.js", function(module, exports, require, global){
/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var Class = require("./Class");
eval(Class.$import("./compiler"));
eval(Class.$import("./platform"));
eval(Class.$import("./jsemitter"));
eval(Class.$import("./optimizer"));

"use strict";

exports.Compiler = Compiler;
exports.Platform = Platform;
exports.JavaScriptEmitter = JavaScriptEmitter;
exports.Optimizer = Optimizer;


});if ("undefined" != typeof module) { module.exports = require('web-interface'); } else { jsx = require('web-interface'); }
})();
