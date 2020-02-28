/*"use strict";
const fetch = require("node-fetch");

fetch("C:\Users\gy\Documents\JS\credentials.json")
    .then(function(resp){
        return resp.json();
    })
    .then(function(data){
        console.log(data)
    })
    */

'use strict';

const fs = require('fs');
   
let rawdata = fs.readFileSync('example-events2.json');
let student = JSON.parse(rawdata);
console.log(student[0].start);