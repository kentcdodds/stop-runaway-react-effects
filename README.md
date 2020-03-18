<div align="center">
<h1>stop-runaway-react-effects 🏃</h1>

<p>Catches situations when a react use(Layout)Effect runs repeatedly in rapid
succession</p>

</div>

<hr />

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![version][version-badge]][package] [![downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]

[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome][prs-badge]][prs] [![Code of Conduct][coc-badge]][coc]

## The problem

React's [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect)
and
[`useLayoutEffect`](https://reactjs.org/docs/hooks-reference.html#uselayouteffect)
hooks accept a "dependencies array" argument which indicates to React that you
want the callback to be called when those values change between renders. This
prevents a LOT of bugs, but it presents a new problem.

If your `use(Layout)Effect` hook sets state (which it very often does), this
will trigger a re-render which could potentially cause the effect to be run
again, which can lead to an infinite loop. The end result here is that the
effect callback is called repeatedly and that can cause lots of issues depending
on what that effect callback does (for example, you could get rate-limited by an
API you're hitting).

> Yes, I'm aware that it's unfortunate that we have this problem at all with
> React. No, I don't think that hooks are worse than classes because of this.
> No, I'm afraid that this probably can't/shouldn't be built-into React because
> sometimes your effect just runs a lot and that's intentional. But most of the
> time it's not intentional so this tool is here to help you know when it's
> happening so you can fix it.

## This solution

This is a **development-time only** tool which will help you avoid running into
this issue. It wraps `React.useEffect` and `React.useLayoutEffect` to provide
tracking of the effect callback to determine whether it's called a certain
number of times in a certain amount of time. For example. If your effect
callback is called 60 times in one second, then it's possible that we have a
"runaway effect".

When a runaway effect is detected, `stop-runaway-react-effects` will log as much
info to the console as it knows about the effect callback and its dependencies
(as well as some recommendations of what to do about it) and then throw an error
to stop the infinite loop.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [API](#api)
- [Inspiration](#inspiration)
- [Other Solutions](#other-solutions)
- [Contributors](#contributors)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `dependencies`:

```
npm install --save stop-runaway-react-effects
```

## Usage

```javascript
// src/bootstrap.js
import {hijackEffects} from 'stop-runaway-react-effects'

if (process.env.NODE_ENV !== 'production') {
  hijackEffects()
}

// src/index.js
import './bootstrap'
import React, {useEffect} from 'react'
```

If you're using a modern bundler (like webpack, parcel, or rollup) with modern
production techniques, then that code will all get stripped away in production.

If you'd like to avoid the extra file, an even easier way to do this is to use
the `hijack` utility module:

```javascript
// src/index.js
import 'stop-runaway-react-effects/hijack'
//This is better because it will ensure that the effects are wrapped before you
//import them (like if you're doing named imports):
import React, {useEffect} from 'react'
```

### API

You can customize the `callCount` and `timeLimit` by passing them as options:

```javascript
// as of this writing, this is the default, but the default could change as
// we fine-tune what's more appropriate for this
hijackEffects({callCount: 60, timeLimit: 1000})
```

You can also wrap one but not the other React effect hook:

```javascript
import {hijackEffectHook} from 'stop-runaway-react-effects'

if (process.env.NODE_ENV !== 'production') {
  hijackEffectHook('useLayoutEffect', {callCount: 60, timeLimit: 1000})
}
```

Here are some examples of code and output:

```javascript
function RunawayNoDeps() {
  const [, forceUpdate] = React.useState()
  React.useEffect(() => {
    // hi, I'm just an innocent React effect callback
    // like the ones you write every day.
    // ... except I'm a runaway!!! 🏃
    setTimeout(() => {
      forceUpdate({})
    })
  })
  return null
}
```

That code will produce this:

![no deps](https://raw.githubusercontent.com/kentcdodds/stop-runaway-react-effects/master/other/no-deps.png)

[![Edit React Codesandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-codesandbox-jf2nk?fontsize=14)

---

```javascript
function RunawayChangingDeps() {
  const [, forceUpdate] = React.useState()
  const iNeverChange = 'I am primitive!'
  const iChangeAllTheTime = {
    iAmAn: 'object',
    andIAm: 'initialized in render',
    soI: 'need to be memoized',
  }
  React.useEffect(() => {
    // hi, I'm just an innocent React effect callback
    // like the ones you write every day.
    // ... except I'm a runaway!!! 🏃
    setTimeout(() => {
      forceUpdate({})
    })
  }, [iNeverChange, iChangeAllTheTime])
  return null
}
```

That code will produce this:

![changing-deps](https://raw.githubusercontent.com/kentcdodds/stop-runaway-react-effects/master/other/changing-deps.png)

[![Edit React Codesandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-codesandbox-xd8m9?fontsize=14)

## Inspiration

As an [instructor](https://kentcdodds.com) I give a lot of
[react workshop](https://kentcdodds.com/workshops) and I know that when people
are learning React hooks, this is a huge pitfall for them. I also bump into this
issue myself. So
[one day I decided to do something about it](https://twitter.com/kentcdodds/status/1125876615177629696)
and now it's packaged up here.

## Other Solutions

I'm not aware of any, if you are please [make a pull request][prs] and add it
here!

## Contributors

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://kentcdodds.com"><img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;" alt="Kent C. Dodds"/><br /><sub><b>Kent C. Dodds</b></sub></a><br /><a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=kentcdodds" title="Code">💻</a> <a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=kentcdodds" title="Documentation">📖</a> <a href="#infra-kentcdodds" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=kentcdodds" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/foray1010"><img src="https://avatars3.githubusercontent.com/u/3212221?v=4" width="100px;" alt="Alex Young"/><br /><sub><b>Alex Young</b></sub></a><br /><a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=foray1010" title="Documentation">📖</a> <a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=foray1010" title="Code">💻</a></td>
    <td align="center"><a href="https://www.davidosomething.com/"><img src="https://avatars3.githubusercontent.com/u/609213?v=4" width="100px;" alt="David O'Trakoun"/><br /><sub><b>David O'Trakoun</b></sub></a><br /><a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=davidosomething" title="Documentation">📖</a></td>
    <td align="center"><a href="https://stackshare.io/jdorfman/decisions"><img src="https://avatars1.githubusercontent.com/u/398230?v=4" width="100px;" alt="Justin Dorfman"/><br /><sub><b>Justin Dorfman</b></sub></a><br /><a href="#fundingFinding-jdorfman" title="Funding Finding">🔍</a></td>
    <td align="center"><a href="https://olliesports.com"><img src="https://avatars2.githubusercontent.com/u/2257337?v=4" width="100px;" alt="Scott Ashton"/><br /><sub><b>Scott Ashton</b></sub></a><br /><a href="https://github.com/kentcdodds/stop-runaway-react-effects/commits?author=scottmas" title="Code">💻</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## LICENSE

MIT

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]:
  https://img.shields.io/travis/kentcdodds/stop-runaway-react-effects.svg?style=flat-square
[build]: https://travis-ci.org/kentcdodds/stop-runaway-react-effects
[coverage-badge]:
  https://img.shields.io/codecov/c/github/kentcdodds/stop-runaway-react-effects.svg?style=flat-square
[coverage]: https://codecov.io/github/kentcdodds/stop-runaway-react-effects
[version-badge]:
  https://img.shields.io/npm/v/stop-runaway-react-effects.svg?style=flat-square
[package]: https://www.npmjs.com/package/stop-runaway-react-effects
[downloads-badge]:
  https://img.shields.io/npm/dm/stop-runaway-react-effects.svg?style=flat-square
[npmtrends]: http://www.npmtrends.com/stop-runaway-react-effects
[license-badge]:
  https://img.shields.io/npm/l/stop-runaway-react-effects.svg?style=flat-square
[license]:
  https://github.com/kentcdodds/stop-runaway-react-effects/blob/master/LICENSE
[prs-badge]:
  https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[donate-badge]:
  https://img.shields.io/badge/$-support-green.svg?style=flat-square
[coc-badge]:
  https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]:
  https://github.com/kentcdodds/stop-runaway-react-effects/blob/master/other/CODE_OF_CONDUCT.md
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
