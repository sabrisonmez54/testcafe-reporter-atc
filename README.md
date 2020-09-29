# testcafe-reporter-atc
[![Build Status](https://travis-ci.org/alexschwantes/testcafe-reporter-junit.svg)](https://travis-ci.org/alexschwantes/testcafe-reporter-junit)

> This is the fork of the [**xUnit**](https://github.com/DevExpress/testcafe-reporter-xunit) reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

This reporter also builds on Alex Schwantes implementation: [AlexSchwantes](https://github.com/alexschwantes/testcafe-reporter-atc#readme).

TestCafe reporter plugin that is specifically designed to be compatible for uploading test results on BMW's own ATC Jira platform. This reporter plugin for TestCafe outputs a junit xml report that is compatible with continuous integration servers like Jenkins. The main difference between this plugin and the default xunit plugin is that in this plugin, the testcase name attribute will only contain the testcase name and any additional information such as screenshots and (unstable) flags are output to `<system-out/>` tag. This allows for better reporting and analysis or repeated test runs.

<p align="center">
    <img src="https://raw.github.com/alexschwantes/testcafe-reporter-junit/master/media/preview.png" alt="preview" />
</p>

## Install

To install this reporter, you can use the following command:

```
npm install testcafe-reporter-atc
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter atc
```


When you use API, pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('atc') // <-
    .run();
```
