# `void` Discard Bindings for ECMAScript

This proposal seeks to introduce to ECMAScript the use of `void` as a "discard" binding when used in place of a
_BindingIdentifier_ or _Elision_ in numerous constructs.

## Status

**Stage:** 1  \
**Champion:** Ron Buckton (@rbuckton)  \
**Last Presented:** (none)

_For more information see the [TC39 proposal process](https://tc39.es/process-document/)._

## Authors

- Ron Buckton (@rbuckton)

# Overview and Motivations

Starting in 2018, the [Explicit Resource Management][] proposal had been proposed to include a
[bindingless form][using-void] that would allow you to enter a resource management scope for either a pre-existing
disposable resource instance or one that required no user-reachable reference, such as a lock on a mutex. Before the
feature was cut during Stage 2, it looked something like the following:

```js
{
  // lock is initialized and tracked for disposal, but no binding is declared
  using void = new UniqueLock(mutex);

  ...

} // lock is released
```

This idea for a bindingless form was not cut because it wasn't useful or needed, but because there are broader use cases
for a "discard" binding that weren't unique to `using` declarations and warranted a full proposal of its own.

There are a number of potential use cases for "discard" bindings that this proposal seeks to investigate:

- [Discards in variable bindings](#variable-declarations) (i.e., `using void = foo()`) to avoid declaring otherwise
  unused temporary variables.
- [Discards in object binding and assignment patterns](#object-binding-and-assignment-patterns) (i.e., 
  `const { x: void, y, ...rest } = obj`) to exclude properties from object-rest patterns.
- [Discards in array binding and assignment patterns](#array-binding-and-assignment-patterns) (i.e., 
  `const [void, a, void] = iter`) to explicitly mark elisions and avoid trailing `,` confusion (`[a, ,]`).
- [Discards in callback parameters](#parameters) (i.e., `const indices = ar.map((void, i) => i)`) 
- [Discards in class method parameters](#parameters) to avoid declaring otherwise unused parameter bindings.
- [Discards in Extractors](#extractors) (i.e., `const Message(void, body) = msg`) to indicate explicit elisions.
- [Discards in Pattern Matching]() (i.e., `obj is { x: void, y: void }`) to match the existence of a property/element
  when the actual value of that property/element is not relevant.

# Prior Art

- C#:
  - [Discards](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/discards)
  - [`using` Statement](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/statements#1314-the-using-statement)
- Python:
  - [Wildcards (`_`)](https://docs.python.org/3.12/reference/lexical_analysis.html#reserved-classes-of-identifiers)
- Rust:
  - [Wildcard (`_`)](https://doc.rust-lang.org/reference/patterns.html#wildcard-pattern)
- Go:
  - [Blank Identifier (`_`)](https://go.dev/doc/effective_go#blank)
- 🆕 Java:
  - [Unnamed variables & patterns](https://openjdk.org/jeps/456)

# Syntax

While most languages with the concept of discards use a single underscore (`_`) to denote the discard, the `_` character
is a valid _Identifier_ in ECMAScript. Past discussion has shown that there is significant reticence to repurposing
any valid existing _Identifier_, and such a change would more than likely be a web-incompatible breaking change to the
language.

Instead, this proposal hopes to adopt the `void` keyword for this purpose given that it has a roughly analogous semantic
meaning when used with expressions, where `void foo()` evaluates `foo()` and discards the return value. In the case of
assignment patterns, a bare `void` would likely require either a cover grammar or a Static Semantics rule to
disambiguate it from a normal `void` expression when it is not part of an assignment.

## Variable Declarations

### `using` Declarations

In its simplest form, a `void` discard binding can be used in place of a _BindingIdentifier_ in any variable
declaration. Generally, this is primarily useful with `using` and `await using` declarations:

```js
using void = new UniqueLock(mutex);
```

### `var`/`let`/`const` Declarations

Discard bindings would not be supported at the top level of `var`/`let`/`const` declarations.
```js
const void = bar(); // syntax error
```

## Object Binding and Assignment Patterns

For object binding patterns, a discard binding has the benefit of allowing developers to explicitly exclude properties
from rest bindings (`...`) without needing to introduce throw-away temporary variables for that purpose:

```js
const { z: void, ...obj1 } = { x: 1, y: 2, z: 3 };
obj1; // { x: 1, y: 2 }

let obj2;
({ z: void, ...obj2 } = { x: 1, y: 2, z: 3 });
obj2; // { x: 1, y: 2 }
```

## Array Binding and Assignment Patterns

Discard bindings in array patterns provide two useful capabilities as they can act as a more explicit indicator of
elision and they can help to avoid trailing `,` confusion:

```js
function* gen() {
  for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
    console.log(i);
    yield i;
  }
}

const iter = gen();
const [a, , ] = iter;
// prints:
//  0
//  1
```

Here, it is not clear to the reader whether the author intended to consume two or three elements from the generator, and
thus this could be a bug. Discard bindings help to make the intent far more apparent:

```js
const [a, void] = iter; // author intends to consume two elements
// vs.
const [a, void, void] = iter; // author intends to consume three elements
```

## Parameters

`void` discard bindings in parameter declarations help to avoid needing to give a name to parameters that might be
unused by a callback or an overridden method of a subclass:

```js
// project an array values into an array of indices
const indices = array.map((void, i) => i);

// passing a callback to `Map.prototype.forEach` that only cares about keys
map.forEach((void, key) => { });

// watching a specific known file for events
fs.watchFile(fileName, (void, kind) => { });

// ignoring unused parameters in an overridden method
class Logger {
  log(timestamp, message) {
    console.log(`${timestamp}: ${message}`);
  }
}

class CustomLogger extends Logger {
  log(void, message) {
    // this logger doesn't use the timestamp...
  }
}
```

While trivial cases could use an identifier like `_`, this becomes more cumbersome when dealing with multiple discarded
parameters:
```js
doWork((_, a, _1, _2, b) => {});
// vs.
doWork((void, a, void, void, b) => {
});
```

## Extractors

The [Extractors][] proposal does not currently include `void` discards and intends to rely on this proposal for their
introduction. In the context of extractors, a `void` discard binding would have similar syntax as what is proposed for
[Array Binding Patterns](#array-binding-and-assignment-patterns):

```js
const msg = new Message("subject", "body");
const Message(void, body) = msg;
```

Extractors would also leverage discards in nested [Object Binding Patterns](#object-binding-and-assignment-patterns) and
Array Binding Patterns:

```js
const IsoDate = /^(\d{4})-(\d{2})-(\d{2})$/;
const IsoDate([void, year, month, day]) = text;
```

## Pattern Matching

The [Pattern Matching][] proposal is interested in introducing "discard patterns" which are irrefutable patterns (e.g, 
they always match). Discard patterns are extremely useful for matching a specific properties on an object without
needing match specific values or depend on custom matchers:

```js
match (shape) {
  when { x: void, y: void }: drawPoint(shape);
  when { p1: void, p2: void }: drawLine(shape);
  when { p: void, r: void }: drawCircle(shape);
  when { p: void, r1: void, r2: void }: drawEllipse(shape);
  when { p: void, h: void, w: void }: drawRectangle(shape);
}
```

It should be noted that the Pattern Matching proposal champions are reticent to include discard patterns without a
consistent syntax for discards in destructuring, and thus this proposal serves to address the cross-cutting concerns for
discards within the language.

## Other Forms

### `catch` Clauses

This proposal is not actively pursuing discard bindings for `catch` clauses as bindingless `catch` already exists and
its adoption did not face the same complexities as other bindingless forms have, since `catch` could simply elide the
`()` portion of the clause.

### Imports and Exports

This proposal is not actively pursuing discard bindings for imports or exports as there does not appear to be any merit
in their inclusion. A bindingless form of `import` already exits (i.e., `import "module"`) and there is no concept of
"rest" (`...`) imports or re-exports that would warrant a discard binding to elide specific named imports or exports.

### Function and Class Names

This proposal is not actively prusuing discard bindings for function or class names, as those syntactic forms already
have a well-defined syntax for discarding the binding by simply eliding the identifier.

# Semantics

A `void` discard binding would not introduce a new binding in either the `var`-scoped names or lexicially declared names
of the current environment record. However, relevant initializers in those bindings would still be evaluated and, in the
case of `using` and `await using` declarations, tracked for future cleanup.

A `void` discard in an assignment pattern would perform the same algorithm steps that would be run for an
_IdentifierReference_ in the same position, except that no assignment would be made.

A `void` discard in pattern matching would always succeed.

# Grammar

Please refer to the [specification text](https://tc39.es/proposal-discard-binding) for the formal grammar for this
proposal.

The proposed grammar is intended to cover the following examples:
```js
var [void] = x;         // via: BindingPattern :: `void`
var {x:void};           // via: BindingPattern :: `void`

let [void] = x;         // via: BindingPattern :: `void`
let {x:void};           // via: BindingPattern :: `void`

const [void] = x;       // via: BindingPattern :: `void`
const {x:void} = x;     // via: BindingPattern :: `void`

function f(void) {}     // via: BindingPattern :: `void`
function f([void]) {}   // via: BindingPattern :: `void`
function f({x:void}) {} // via: BindingPattern :: `void`

((void) => {});         // via: BindingPattern :: `void`
(([void]) => {});       // via: BindingPattern :: `void`
(({x:void}) => {});     // via: BindingPattern :: `void`

using void = x;         // via: LexicalBinding : `void` Initializer
await using void = x;   // via: LexicalBinding : `void` Initializer

[void] = x;             // via: DestructuringAssignmentTarget : `void`
({x:void} = x);         // via: DestructuringAssignmentTarget : `void`
```

Note that
```js
void = x;
```
is disallowed because `void` is not part of the refinement of _LeftHandSideExpression_ to _AssignmentPattern_ in 
[13.15.5 Destructuring Assignment](https://tc39.es/ecma262/#sec-destructuring-assignment).

Also note that
```js
const x = void;
```
is disallowed because `void` is not part of the refinement of _CoverVoidExpressionAndVoidDiscard_.

> NOTE: The _LexicalBinding_ grammar is a diff from the proposed grammar for [Explicit Resource Management][], as found 
> in the proposal diff here: https://arai-a.github.io/ecma262-compare/?pr=3000&id=sec-let-const-and-using-declarations

<!--
# API

TBD
-->

# FAQ

> Q. Wouldn't `{}` be sufficient? For example, `using {} = x` instead of `using void = x`?

No, `{}` is not sufficient for multiple reasons. First, `using` declarations do not permit the use of binding patterns,
so `{}` is not legal in that context. Second, `{}` requires that the right-hand side be neither `null` nor `undefined`.
Not only do `using` declarations expressly allow the use of `null` and `undefined` as resources, but any value you might
want to discard from a binding could potentially be either `null` or `undefined`.

> Q. Why use the `void` keyword? Why not use another keyword or a new token?

The syntax space within ECMAScript is fairly limited. Many operator-like tokens already have a well defined semantic 
meaning that do not align with the concept of a "discard". We cannot introduce a new keyword as it could potentially
conflict with existing identifiers, and there is well-established guidance that proposals should not introduce such
conflicts. That leaves us with a limited set of established keywords that we could repurpose for this use without
conflicting with their other use. Since it is a good practice for a keyword to maintain a consistent semantic meaning in
all contexts, we chose `void` as it remains consistent with how `void` is already used in the language. A `void`
_expression_ evaluates its operand and discards the result. A `void` _binding_ would evaluate its _Initializer_, read
from its associated property, or read an element from an iterator, and then _also_ discards the result.

That said, we welcome additional suggestions that align with these principles.

> Q. Why does pattern matching need discards?

One of the main benefits of pattern matching is to be able to execute conditional logic based on the _shape_ of your
input. For example:

```
match (p) {
  when { x: number, y: Number }: print("p is a point");
}
```

In this example, the pattern matches against `p` when it has both `x` and `y` properties and when the values for
both properties are are `Number` values. But how would you test for property existance *without* caring about its type?
Without a "discard" pattern, you're left with a number of poor options.

You could match a property using both a condition and its complement:
```js
match (p) {
  when { x: null or not null, y: null or not null }: ...;
}
```
However, this is very wordy and not very discoverable.

You could match a property and introduce a temporary variable:
```js
match (p) {
  when { x: let _, y: let _ }: ...;
}
```
However, this introduces another unnecessary temporary variable and is again not very discoverable.

Finally, you could introduce a custom matcher:
```js
const Discard = {
  [Symbol.matcher](_value) {
    return true;
  }
};

match (p) {
  when { x: Discard, y: Discard }: ...;
}
```
However, this introduces additional overhead as you must evaluate user code.

Instead, `void` patterns are both discoverable, due to their consistent semantic menaing, and do not have runtime
overhead from evaluating user code:
```js
match (p) {
  when { x: void, y: void }: ...;
}
```

As pattern matching is still at Stage 1, its possible it could choose to implement `void` discards purely as bindings
using `let` patterns:
```js
match (p) {
  when { x: let void, y: let void }: ...;
}
```
In either case, the semantic meaning would remain consistent.

# Examples

### `using` Declarations

```js
{
  using void = new UniqueLock(mutex); // binding would otherwise be unused
  ...
} // lock is disposed
```

### Explicit Replacement for _Elision_ in Array Destructuring

```js
const [, a, , b] = ar; // skip using elision
const [void, a, void, b] = ar; // skip using `void`

const [a, b, , ] = iter; // exaust *three* elements from iterable
const [a, b, void] = iter; // same, but with `void`
```

### Elide Properties from Rest (`...`) Patterns in Object Destructuring

```js
const { z: void, ...obj } = { x: 1, y: 2, z: 3 };
obj; // { x: y, y: 2 }
```

### Explicit Elision in Extractors

```js
const Color(void, void, g) = c; // skip r and b components
```

### Discard Pattern for Pattern Matching

```js
match (obj) {
  when { x: void, y: void }: usePoint(obj);
}
```

# Related Proposals

- [Explicit Resource Management][] (Stage 3)
- [Pattern Matching][] (Stage 1)
- [Extractors][] (Stage 1)

# TODO

The following is a high-level list of tasks to progress through each stage of the [TC39 proposal process](https://tc39.github.io/process-document/):

### Stage 1 Entrance Criteria

* [x] Identified a "[champion][Champion]" who will advance the addition.
* [x] [Prose][Prose] outlining the problem or need and the general shape of a solution.
* [x] Illustrative [examples][Examples] of usage.
* [ ] ~~High-level [API][API].~~

### Stage 2 Entrance Criteria

* [x] [Initial specification text][Specification].
* [ ] [Transpiler support][Transpiler] (_Optional_).

### Stage 2.7 Entrance Criteria

* [ ] [Complete specification text][Specification].
* [ ] Designated reviewers have signed off on the current spec text:
  * [ ] [Reviewer #1][Stage3Reviewer1] has [signed off][Stage3Reviewer1SignOff]
  * [ ] [Reviewer #2][Stage3Reviewer2] has [signed off][Stage3Reviewer2SignOff]
* [ ] The [ECMAScript editor][Stage3Editor] has [signed off][Stage3EditorSignOff] on the current spec text.

### Stage 3 Entrance Criteria

* [ ] [Test262](https://github.com/tc39/test262) acceptance tests have  been written for mainline usage scenarios and [merged][Test262PullRequest].

### Stage 4 Entrance Criteria

* [ ] Two compatible implementations which pass the acceptance tests: [\[1\]][Implementation1], [\[2\]][Implementation2].
* [ ] A [pull request][Ecma262PullRequest] has been sent to tc39/ecma262 with the integrated spec text.
* [ ] The ECMAScript editor has signed off on the [pull request][Ecma262PullRequest].

<!-- # References -->

<!-- Links to other specifications, etc. -->

<!-- * [Title](url) -->

<!-- # Prior Discussion -->

<!-- Links to prior discussion topics on https://esdiscuss.org -->

<!-- * [Subject](https://esdiscuss.org) -->

<!-- The following are shared links used throughout the README: -->

[Champion]: #status
[Prose]: #overview-and-motivations
[Examples]: #examples
[API]: #api
[Specification]: #todo
[Transpiler]: #todo
[Stage3Reviewer1]: #todo
[Stage3Reviewer1SignOff]: #todo
[Stage3Reviewer2]: #todo
[Stage3Reviewer2SignOff]: #todo
[Stage3Editor]: #todo
[Stage3EditorSignOff]: #todo
[Test262PullRequest]: #todo
[Implementation1]: #todo
[Implementation2]: #todo
[Ecma262PullRequest]: #todo
[Explicit Resource Management]: https://github.com/tc39/proposal-explicit-resource-management
[using-void]: https://github.com/tc39/proposal-explicit-resource-management/blob/main/future/using-void-declaration.md
[Extractors]: https://github.com/tc39/proposal-extractors
[Pattern Matching]: https://github.com/tc39/proposal-pattern-matching