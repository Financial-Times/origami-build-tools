'use strict';

const TestComponent = require('o-test-component');
const component = new TestComponent(1);
component.add(1);
global.world = component.value;
