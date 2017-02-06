# pulljs
this is a pure javascript library to provide a lightweight and awesome pull to load

[online demo use mobile ua](https://stephenkingsley.github.io/pulljs.html)

## Install & Use

```shell
npm save --save pulljs
```

### how to use

```js
import Pull from 'pulljs';

Pull.init({
  // mainElement: '',
  instructionsPullToRefresh: 'Pull to Refresh',
  instructionsReleaseToRefresh: 'Release to Refresh',
  instructionsRefreshing: 'Refreshing',
  onRefresh: () => alert('hello pulljs')
});
```

## Options

```js
Pull.init({
  distThreshold: 60,
  distMax: 80,
  distReload: 50,
  mainElement: 'body',
  triggerElement: 'body',
  instructionsPullToRefresh: 'Pull down to refresh',
  instructionsReleaseToRefresh: 'Release to refresh',
  instructionsRefreshing: 'Refreshing',
  refreshTimeout: 500,
  onRefresh: () => location.reload(),
  resistanceFunction: t => Math.min(1, t / 2.5),
});
```

| options | introduce | default value |
|:--------|:----------|--------------:|
|distThreshold|minimum trigger the refresh|60|
|distMax|maximum distance for the component|80|
|distReload|after the `distThreshold` is reached and released, the component will have this height|50|
|mainElement|before which `dom component` the pull to refresh elements will be|body(css selector)|
|triggerElement|which element should trigger the pull to refresh?|body(css selector)|
|instructionsPullToRefresh|the initial instructions string|Pull down to refresh|
|instructionsReleaseToRefresh|the instructions string when the `distThreshold` has been reached|Release to refresh|
|instructionsRefreshing|the refreshing text(can be dom component string)|Refreshing|
|refreshTimeout|the delay, in milliseconds before the onRefresh is triggered|500|
|onRefresh|what will the pull to refresh trigger? you can return a promise. Defaults to window.location.reload()|null|
|resistanceFunction|the resistance function, accepts one parameter, must return a number, capping at 1. Defaults to t => Math.min(1, t / 2.5)|null|
