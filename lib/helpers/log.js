"use strict";

require('colors');

module.exports = {

    primary: function(text) {
        console.log(String(text).bold);
    },

    primaryError: function(text) {
        console.log(String(text).bold.red);
    },

    secondary: function(text) {
        console.log(String(text).grey);
    },

    secondaryError: function(text) {
        console.log(String(text).red);
    }

};
