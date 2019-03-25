# Telegram Contest Chart Application

The application was made for the 2019 March Coding Competition by [Telegram](https://telegram.org/).
The goal was to develop a software for showing simple charts based on the provided input.

See the [demo](http://dronkin.ru/telegram-contest-chart/).

![alt text](preview.png)

## About

The application written on pure JavaScript without usage of any 3th-party libraries.
The source code is ECMAScript 2018 which is transpiled to ECMAScript 2015, so the target browser must support it as well.
Also the source code is annotated for [Closure Compiler](https://developers.google.com/closure/compiler/) to produce a bundle with maximum possible size.

## Features

* Zooming and panning;
* Nice ticks formatting;
* Day and night themes;
* Legend and cursor;
* Touch devices support;
* Smooth transition for datasets changing and Y axis scaling;
* Special layout for mobile devices - chart height and ticks count are reduced;
* Responsive - every chart on the page will be redrawn on resize or orientation change;
