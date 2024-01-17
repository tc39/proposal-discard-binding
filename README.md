# `void` Discard Bindings for ECMAScript

This proposal seeks to introduce to ECMAScript the use of `void` as a "discard" binding when used in place of a
_BindingIdentifier_ or _Elision_ in numerous constructs.

## Status

**Stage:** 0  \
**Champion:** Ron Buckton (@rbuckton)  \
**Last Presented:** (none)

_For more information see the [TC39 proposal process](https://tc39.es/process-document/)._

## Authors

- Ron Buckton (@rbuckton)

# Overview and Motivations

TBD

NOTE: `void` bindings were previously part of the
[Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) proposal, and have been
since moved here.

# Prior Art

- TBD

# Syntax

TBD

# Semantics

TBD

# Grammar

TBD

<!--
# API

TBD
-->

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

### Trigger Side-effects in Object Destructuring

```js
const { x: void, y } = obj; // reads 'x' before reading 'y'
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

- TBD

# TODO

The following is a high-level list of tasks to progress through each stage of the [TC39 proposal process](https://tc39.github.io/process-document/):

### Stage 1 Entrance Criteria

* [x] Identified a "[champion][Champion]" who will advance the addition.
* [ ] [Prose][Prose] outlining the problem or need and the general shape of a solution.
* [ ] Illustrative [examples][Examples] of usage.
* [ ] High-level [API][API].

### Stage 2 Entrance Criteria

* [ ] [Initial specification text][Specification].
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
