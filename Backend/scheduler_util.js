function read_event_file(file_path) {
    'use strict';
    const fs = require('fs');
    let rawdata = fs.readFileSync(file_path);
    let event_array = JSON.parse(rawdata);
    return(event_array);
}//this should output an event number sized object array

function get_start_time(event){
    var start_string = event.start.dateTime;
    var t_loc = start_string.indexOf('T')
    return (start_string.substring(t_loc+1, t_loc+9))
}
function get_end_time(event){
    var end_string = event.end.dateTime;
    var t_loc = end_string.indexOf('T')
    return (end_string.substring(t_loc+1, t_loc+9))
}

let events = read_event_file('example-events2.json');
console.log(get_end_time(events[0]));
