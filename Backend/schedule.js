const fs = require('fs');

// let scheduleFileList = ['Backend\\example-events2.json']
// let default_location_file = 'Supporting Documents\Meeting Locations'
/*
let scheduleFileList = ['example-events2.json']
let default_location_file = 'Supporting Documents\Meeting Locations'

let rawdata = fs.readFileSync('example-events2.json');
let student = JSON.parse(rawdata);

let month_days = [31,29,31,30,31,31,30,31,30,31] 

let master_schedules = parseScheduleFiles(scheduleFileList)

//console.log(naiveSchedule(master_schedules, '2020-02-19', '12:00:00', '14:00:00', '00:40:00', '00:05:00'))
example_range = [['00:40:00', '23:40:00'], ['01:40:00', '23:40:00'], ['02:40:00', '23:40:00']]
naiveScheduleWithLocationAndRange(master_schedules, '2020-02-19',  '2020-02-21', example_range, '00:40:00', '00:05:00')
*/
function parseScheduleFiles(scheduleFileList){
    let master_schedules = []
    for(let i = 0; i < scheduleFileList.length; i++){
        let filename = scheduleFileList[i];

        let rawdata = fs.readFileSync(filename);
        let single_schedule = JSON.parse(rawdata);
        master_schedules.push(single_schedule)
    }
    return(master_schedules)
}

function naiveScheduleWithLocationAndRange(schedules, start_date, end_date, daily_range, event_length, inteval, k){
    /*
        Params:
        Schedules: an array of parsed schedules 
        start_date:"2020-02-19"
        end_date: "2020-03-12"
        daily_range: a array size [days][2], [2][0] is the starting time on day 2,
        days = end_date - start_date + 1 
        Inteval: Search inteval for the for loop
        k: as in topk
        */
    
        /*
        configs
        */
    
       let time_eval_mode = 'squared'
       let best_start_time = "00:00:00"
       let best_date = ""
       let best_utility = -10000000000
       let current_date = start_date
       let trial_time_end = time_add(trial_time_start, event_length)
       let day_count = 0 
       let topk_time = []
       let topk_date = []
       let topk_util = []
       while(date_diff(end_date, current_date) >= 0){
            let trial_time_start = daily_range[day_count][0]
            while(time_add(trial_time_start, event_length) != false &&  time_diff(time_add(trial_time_start, event_length), daily_range[day_count][1]) < 0){
            let trial_time_end = time_add(trial_time_start, event_length)
            console.log("Considering: " + trial_time_start + " to " + trial_time_end)
            let closest_previous = "00:00:00"
            let closest_after = "23:59:59"
            let conflict_flag = false;
            for(var i = 0; i < schedules.length; i++){//bad SW practice TODO: fix
                // currently iterating every person's calander
                let current_schedule = schedules[i];
                for(var j = 0; j < current_schedule.length; j++){
                    //now iterating every event on that calander. 
                    let current_event = current_schedule[j]
                    let current_event_start = getStartTime(current_event)
                    let current_event_end = getEndTime(current_event)
                    if(getEventDate(current_event) != current_date){
                        continue
                    }
                    if(earlier(trial_time_start, current_event_start)){//our event starts earlier than scheduled event
                        if(!earlier(trial_time_end, current_event_start)){//our event also ends later than schduled event's start
                            /*console.log("conflict event info:")
                            console.log("Start time: "+ current_event_start)
                            console.log("End time: " + current_event_end)*/
                            conflict_flag = true;
                        }
                    }
                    if(!earlier(trial_time_start, current_event_start)){//out event starts later than schuduled event
                        if(earlier(trial_time_start, current_event_end)){//our event event starts later than scheduled end
                            /*console.log("conflict event info:")
                            console.log("Start time: "+ current_event_start)
                            console.log("End time: " + current_event_end)*/
                            conflict_flag = true;
                        }
                    }
                    if(conflict_flag){
                        break;
                    }
                    if(earlier(closest_previous, current_event_end) && earlier(current_event_end, trial_time_start)){
                        closest_previous = current_event_end
                    }
                    if(earlier(current_event_start, closest_after) && earlier(trial_time_end, current_event_start)){
                        closest_after = current_event_start
                    }
                }
                if(conflict_flag)
                    break;
            }
            if(conflict_flag){/*
                console.log("Conflict Exists :(")*/
            }else{//Right now we can consider location
                let slot_utility = 0
                if(time_eval_mode == 'squared'){
                    slot_utility += -1 * (time_diff(trial_time_start, closest_previous) * time_diff(trial_time_start, closest_previous));
                    slot_utility += -1 * (time_diff(closest_after, trial_time_end) * time_diff(closest_after, trial_time_end));
                }else{
                    slot_utility = -1 * (time_diff(trial_time_start, closest_previous) + time_diff(closest_after, trial_time_end))
                }
                //todo-change here
                if(topk_time.length < k ){//doing a bubble sort because k is small , currently no deleting is ness
                    let insertion_index = -1
                    for(i = 0; i < topk_util.length; i++){
                        if(slot_utility > topk_util[i]){
                            insertion_index = i 
                        }    
                    }
                    if(insertion_index>=0){
                        topk_time.splice(insertion_index,0,best_start_time)
                        topk_util.splice(insertion_index,0,slot_utility)
                        topl_date.splice(insertion_index,0,current_date)
                    }
                }else{
                    let insertion_index = -1
                    for(i = 0; i < topk_util.length; i++){
                        if(slot_utility > topk_util[i]){
                            insertion_index = i 
                        }    
                    }
                    if(insertion_index>=0){
                        topk_time.splice(insertion_index,0,best_start_time)
                        topk_util.splice(insertion_index,0,slot_utility)
                        topl_date.splice(insertion_index,0,current_date)
                        topk_time.pop
                        topk_util.pop
                        topk_date.pop
                    }
                }
                /*
                console.log("No conflict")
                console.log("closest previous event at : " + closest_previous )
                console.log("closest after evert at : " + closest_after )
                console.log("Slot utility: " + slot_utility)*/
                }
                trial_time_start = time_add(trial_time_start, inteval)
                }
            current_date = date_inc(current_date)
            day_count += 1
        }

        topk_return = []
        for(i = 0; i < k; i++){
            //now with the k best time slots, we go back and found the closest events 
            //[best_start_time, time_add(best_start_time, event_length), best_date]
            let best_date = topl_date[i]
            let best_start_time = topk_time[i]
            let best_end_time = time_add(best_start_time, event_length)
            let closest_prev_event_time = []
            let closest_after_event_time = []
            let closest_prev_event_loc = []
            let closest_after_event_loc = []
            for(var i = 0; i < schedules.length; i++){
                // currently iterating every person's calander
                let current_schedule = schedules[i];
                let cpel = null;
                let cael = null;
                let closest_previous = '00:00:00'
                let closest_after = '23:59:59'
                for(var j = 0; j < current_schedule.length; j++){
                    //now iterating every event on that calander. 
                    let current_event = current_schedule[j]
                    let current_event_start = getStartTime(current_event)
                    let current_event_end = getEndTime(current_event)
                    if(getEventDate(current_event) != best_date){
                        continue
                    }
                    if(earlier(best_start_time, current_event_start)){//our event starts earlier than scheduled event
                        if(!earlier(best_end_time, current_event_start)){//our event also ends later than schduled event's start
                            continue;
                        }
                    }
                    if(!earlier(best_start_time, current_event_start)){//out event starts later than schuduled event
                        if(earlier(best_start_time, current_event_end)){//our event event starts later than scheduled end
                            continue;
                        }
                    }
                    if(earlier(closest_previous, current_event_end) && earlier(current_event_end, trial_time_start)){
                        closest_previous  = current_event_end
                        cpel = getLocation(current_event)
                        if(cpel == undefined){
                            cpel = "undefined"
                        }
                    }
                    if(earlier(current_event_start, closest_after) && earlier(trial_time_end, current_event_start)){
                        closest_after  = current_event_end
                        cael = getLocation(current_event)
                        if(cael == undefined){
                            cael = "undefined"
                        }
                    }
                }
                closest_prev_event_time.push(closest_previous)
                closest_after_event_time.push(closest_after)
                closest_prev_event_loc.push(cpel)
                closest_after_event_loc.push(cael)
            }
            console.log(closest_prev_event_time)
            console.log(closest_after_event_time)
            console.log(closest_prev_event_loc)
            console.log(closest_after_event_loc)
            //TODO for tim: These should be lists of locations of events just before and after. 
            // array lenghs = number of schedulers considered
            // 'undefined' means that no event is before and after the scheduled event for this day
            topk_return.push({
                    times: [best_start_time, time_add(best_start_time, event_length), best_date],
                    prev_locations: closest_prev_event_loc,
                    after_locations: closest_after_event_loc,
                    utility:best_utility
                }
            )
        }
        return topk_return
    }



function naiveScheduleWithLocation(schedules, start, end, event_length, inteval){
    /*
        Params:
        Schedules: an array of parsed schedules 
        day: formated as "2020-02-19"
        Start: string formating such as "2020-02-19T09:30:00-05:00"
        End: Same
        Inteval: Search inteval for the for loop
        */
    
        /*
        configs
        */
    
       let time_eval_mode = 'squared'
       let best_start_time = "00:00:00"
       let best_date = ""
       let best_utility = -10000000000
       let trial_time_start = getTime(start)
       let current_date = getDate(start)
       let end_date = getDate(end)
       let trial_time_end = getTime(end)
       while(date_diff(end_date, current_date) >= 0){
            let last_day_flag = (date_diff(end_date, current_date) == 0)
            //saving a big if statement with the following. If we reach the last date in range, then stop at the sprcified end time
            while(time_add(trial_time_start, event_length) != false && (!last_day_flag || time_diff(time_add(trial_time_start, event_length), trial_time_end) < 0)){
            let trial_time_end = time_add(trial_time_start, event_length)
            //console.log("Considering: " + trial_time_start + " to " + trial_time_end)
            let closest_previous = "00:00:00"
            let closest_after = "23:59:59"
            let conflict_flag = false;
            for(var i = 0; i < schedules.length; i++){//bad SW practice TODO: fix
                // currently iterating every person's calander
                let current_schedule = schedules[i];
                for(var j = 0; j < current_schedule.length; j++){
                    //now iterating every event on that calander. 
                    let current_event = current_schedule[j]
                    let current_event_start = getStartTime(current_event)
                    let current_event_end = getEndTime(current_event)
                    if(getEventDate(current_event) != current_date){
                        continue
                    }
                    if(earlier(trial_time_start, current_event_start)){//our event starts earlier than scheduled event
                        if(!earlier(trial_time_end, current_event_start)){//our event also ends later than schduled event's start
                            /*console.log("conflict event info:")
                            console.log("Start time: "+ current_event_start)
                            console.log("End time: " + current_event_end)
                            conflict_flag = true;*/
                        }
                    }
                    if(!earlier(trial_time_start, current_event_start)){//out event starts later than schuduled event
                        if(earlier(trial_time_start, current_event_end)){//our event event starts later than scheduled end
                            /*console.log("conflict event info:")
                            console.log("Start time: "+ current_event_start)
                            console.log("End time: " + current_event_end)
                            conflict_flag = true;*/
                        }
                    }
                    if(conflict_flag){
                        break;
                    }
                    if(earlier(closest_previous, current_event_end) && earlier(current_event_end, trial_time_start)){
                        closest_previous = current_event_end
                    }
                    if(earlier(current_event_start, closest_after) && earlier(trial_time_end, current_event_start)){
                        closest_after = current_event_start
                    }
                }
                if(conflict_flag)
                    break;
            }
            if(conflict_flag){/*
                console.log("Conflict Exists :(")*/
            }else{//Right now we can consider location
                let slot_utility = 0
                if(time_eval_mode == 'squared'){
                    slot_utility += -1 * (time_diff(trial_time_start, closest_previous) * time_diff(trial_time_start, closest_previous));
                    slot_utility += -1 * (time_diff(closest_after, trial_time_end) * time_diff(closest_after, trial_time_end));
                }else{
                    slot_utility = -1 * (time_diff(trial_time_start, closest_previous) + time_diff(closest_after, trial_time_end))
                }
                if(slot_utility > best_utility){
                    best_utility = slot_utility
                    best_start_time = trial_time_start
                    best_date = current_date
                    //TODO-LOCATION find best location according closest previous location and closest after location
                }/*
                console.log("No conflict")
                console.log("closest previous event at : " + closest_previous )
                console.log("closest after evert at : " + closest_after )
                console.log("Slot utility: " + slot_utility)*/
                }
                trial_time_start = time_add(trial_time_start, inteval)
                }
            current_date = date_inc(current_date)
            console.log(current_date)
        }
        //now with the best time slot, we go back and found the closest events 
        //[best_start_time, time_add(best_start_time, event_length), best_date]
        let best_end_time = time_add(best_start_time, event_length)
        let closest_prev_event_time = []
        let closest_after_event_time = []
        let closest_prev_event_loc = []
        let closest_after_event_loc = []
        for(var i = 0; i < schedules.length; i++){
                // currently iterating every person's calander
                let current_schedule = schedules[i];
                let cpel = null;
                let cael = null;
                let closest_previous = '00:00:00'
                let closest_after = '23:59:59'
                for(var j = 0; j < current_schedule.length; j++){
                    //now iterating every event on that calander. 
                    let current_event = current_schedule[j]
                    let current_event_start = getStartTime(current_event)
                    let current_event_end = getEndTime(current_event)
                    if(getEventDate(current_event) != best_date){
                        continue
                    }
                    if(earlier(best_start_time, current_event_start)){//our event starts earlier than scheduled event
                        if(!earlier(best_end_time, current_event_start)){//our event also ends later than schduled event's start
                            continue;
                        }
                    }
                    if(!earlier(best_start_time, current_event_start)){//out event starts later than schuduled event
                        if(earlier(best_start_time, current_event_end)){//our event event starts later than scheduled end
                            continue;
                        }
                    }
                    if(earlier(closest_previous, current_event_end) && earlier(current_event_end, trial_time_start)){
                        closest_previous  = current_event_end
                        cpel = getLocation(current_event)
                        if(cpel == undefined){
                            cpel = "undefined"
                        }
                    }
                    if(earlier(current_event_start, closest_after) && earlier(trial_time_end, current_event_start)){
                        closest_after  = current_event_end
                        cael = getLocation(current_event)
                        if(cael == undefined){
                            cael = "undefined"
                        }
                    }
                }/*
                console.log(cpet)
                console.log(caet)
                console.log(cpel)
                console.log(cael)*/
                closest_prev_event_time.push(closest_previous)
                closest_after_event_time.push(closest_after)
                closest_prev_event_loc.push(cpel)
                closest_after_event_loc.push(cael)
            }
            console.log(closest_prev_event_time)
            console.log(closest_after_event_time)
            console.log(closest_prev_event_loc)
            console.log(closest_after_event_loc)
            //TODO for tim: These should be lists of locations of events just before and after. 
            // array lenghs = number of schedulers considered
            // 'undefined' means that no event is before and after the scheduled event for this day
       return {
           times: [best_start_time, time_add(best_start_time, event_length), best_date],
           prev_locations: closest_prev_event_loc,
           after_locations: closest_after_event_loc
       };
    }

function naiveSchedule(schedules, day, start, end, event_length, inteval) {
    /*
    Params:
    Schedules: an array of parsed schedules 
    day: formated as "2020-02-19"
    Start: string formating such as "2020-02-19T09:30:00-05:00"
    End: Same
    Inteval: Search inteval for the for loop
    TODO: currently not considering start and end, 
    */

    /*
    configs
    */
    let time_eval_mode = 'squared'



    let best_start_time = "00:00:00"
    let best_utility = -10000000000
    let trial_time_start = "00:00:00"
    while(time_add(trial_time_start, event_length) != false){
        let trial_time_end = time_add(trial_time_start, event_length)
        console.log("Considering: " + trial_time_start + " to " + trial_time_end)
        let closest_previous = "00:00:00"
        let closest_after = "23:59:59"
        let conflict_flag = false;
        for(var i = 0; i < schedules.length; i++){//bad SW practice TODO: fix
            let current_schedule = schedules[i];
            for(var j = 0; j < current_schedule.length; j++){
                let current_event = current_schedule[j]
                let current_event_start = getStartTime(current_event)
                let current_event_end = getEndTime(current_event)
                if(getEventDate(current_event) != day){
                    continue
                }
                /* if(time_diff(trial_time_start, current_event_start) < 0){//our event starts earlier than scheduled event
                    if(time_diff(trial_time_end, current_event_start) > 0){//our event also ends later than schduled event's start
                        console.log("conflict event info:")
                        console.log("Start time: "+ current_event_start)
                        console.log("End time: " + current_event_end)
                        conflict_flag = true;
                    }
                }
                if(time_diff(trial_time_start, current_event_start) > 0){//out event starts later than schuduled event
                    if(time_diff(trial_time_start, current_event_end) > 0){//our event event starts later than scheduled end
                        //console.log("end conflict: " + current_event_end)
                        //console.log(time_diff(trial_time_end, current_event_end))
                        console.log("conflict event info:")
                        console.log("Start time: "+ current_event_start)
                        console.log("End time: " + current_event_end)
                        conflict_flag = true;
                    }
                } */
                if(earlier(trial_time_start, current_event_start)){//our event starts earlier than scheduled event
                    if(!earlier(trial_time_end, current_event_start)){//our event also ends later than schduled event's start
                        console.log("conflict event info:")
                        console.log("Start time: "+ current_event_start)
                        console.log("End time: " + current_event_end)
                        conflict_flag = true;
                    }
                }
                if(!earlier(trial_time_start, current_event_start)){//out event starts later than schuduled event
                    if(earlier(trial_time_start, current_event_end)){//our event event starts later than scheduled end
                        //console.log("end conflict: " + current_event_end)
                        //console.log(time_diff(trial_time_end, current_event_end))
                        console.log("conflict event info:")
                        console.log("Start time: "+ current_event_start)
                        console.log("End time: " + current_event_end)
                        conflict_flag = true;
                    }
                }
                if(conflict_flag){
                    break;
                }
                if(earlier(closest_previous, current_event_end) && earlier(current_event_end, trial_time_start)){
                    closest_previous = current_event_start
                }
                if(earlier(current_event_start, closest_after) && earlier(trial_time_end, current_event_start)){
                    closest_after = current_event_end
                }
            }
            if(conflict_flag)
                break;
        }
        if(conflict_flag){
            console.log("Conflict Exists :(")
        }else{
            let slot_utility = 0
            if(time_eval_mode == 'squared'){
                slot_utility += -1 * (time_diff(trial_time_start, closest_previous) * time_diff(trial_time_start, closest_previous));
                slot_utility += -1 * (time_diff(closest_after, trial_time_end) * time_diff(closest_after, trial_time_end));
            }else{
                slot_utility = -1 * (time_diff(trial_time_start, closest_previous) + time_diff(closest_after, trial_time_end))
            }
            if(slot_utility > best_utility){
                best_utility = slot_utility
                best_start_time = trial_time_start
            }
            console.log("No conflict")
            console.log("closest previous event at : " + closest_previous)
            console.log("closest after evernt at : " + closest_after) 
            console.log("Slot utility: " + slot_utility)
        }
        trial_time_start = time_add(trial_time_start, inteval)
    }
    return([best_start_time, time_add(best_start_time, event_length)])
}


function getLocation(event){
    return(event.location)
}

function getStartTime(event){
    //input is jason event
    return(getTime(event.start.dateTime))
}
function getEndTime(event){
    return(getTime(event.end.dateTime))
}
function getEventDate(event){
    return(getDate(event.start.dateTime))
}

function getTime(dateTime){//TODO BAD NAMING!!!!
    /*
    Params:
    dateTime: in google API format a string "2020-02-19T09:30:00-05:00"
    */
   return(dateTime.substring(11,19))
}
function getDate(dateTime){
    /*
    dateTime: in google API format a string "2020-02-19T09:30:00-05:00"
    */
   return(dateTime.substring(0,10))
}
function time_diff(time1, time2){
    /*
    Params:
    time1: in google API format a string "09:30:00"
    returns time1 - time2 in seconds. Positive if time1 is later
    */
   let diff = 0
   let hour1 = parseInt(time1.substring(0,2))
   let hour2 = parseInt(time2.substring(0,2))
   diff += (hour1 - hour2) * 3600
   let minute1 = parseInt(time1.substring(3,5))
   let minute2 = parseInt(time2.substring(3,5))
   diff += (minute1 - minute2) * 60
   let second1 = parseInt(time1.substring(6))
   let second2 = parseInt(time2.substring(6))
   diff += second1 - second2
   return diff
}

function date_diff(date1, date2){
    /*
    input formats = '2020-02-19'
    return date1 - date2. positive if date1 is later
    */
   let day_per_month = ['31', '29', '31', '30', '31', '30', '31', '31','30', '31', '30', '31']
   let diff = 0
   let year1 = parseInt(date1.substring(0,4))
   let year2 = parseInt(date2.substring(0,4))
   diff += (year1 - year2) * 366
   let month1 = parseInt(date1.substring(5,7))
   let month2 = parseInt(date2.substring(5,7))
   if(month1-month2 > 0) {
       for (let i = 0; i < month1-month2; i ++) {
        diff += parseInt(day_per_month[(month2+i-1)]);
       }
   }
   if(month2-month1 > 0) {
    for (let i = 0; i < month2-month1; i ++){
    diff -= parseInt(day_per_month[(month1+i-1)]);
    }
    }
   let day1 = parseInt(date1.substring(8))
   let day2 = parseInt(date2.substring(8))
   diff += day1 - day2
   return diff
}

function date_inc(date){
     /*
    input formats = '2020-02-19'
    */
    let day_per_month = ['31', '29', '31', '30', '31', '30', '31', '31','30', '31', '30', '31']
    let day = parseInt(date.substring(8))
    let month = parseInt(date.substring(5,7))
    let year = parseInt(date.substring(0,4))
    if (day + 1 > day_per_month[month - 1]){
        if(month + 1 == 13){
            year += 1
            month = 1
            day = 1
        }else{
            month += 1
            day = 1
        }
    }else{
        day += 1
    }
    let output = ""
    output = output + year;
    output = output + "-";
    if(month < 10){
        output = output + "0" + month;
        output = output + "-";
    }else{
        output = output + month;
        output = output + "-";
    }  
    if(day < 10){
        output = output + "0" + day;
    }else{
        output = output + day;
    }
    return output
}

function earlier(time1, time2){
    if(time_diff(time1, time2) > 0){
        return false
    }
    return true
}

function time_add(time, increment){
    /* 
    Params: 
    2 times without date
    return: the first time pushed ahead by increment
    returns false if carries over 24 hours
    */
   let finalTime = ""
   let second1 = parseInt(time.substring(6))
   let second2 = parseInt(increment.substring(6))
   let totalSecond = second1 + second2
   let minute1 = parseInt(time.substring(3,5))
   let minute2 = parseInt(increment.substring(3,5))
   let totalminute = minute1 + minute2
   if (totalSecond >= 60){
       totalminute += Math.floor(totalSecond/60)
       totalSecond = totalSecond%60
   }
   let hour1 = parseInt(time.substring(0,2))
   let hour2 = parseInt(increment.substring(0,2))
   let totalHours = hour1+hour2
   if (totalminute >= 60){
    totalHours += Math.floor(totalminute / 60)
    totalminute = totalminute % 60
   }
   if(totalHours >= 24){
       return false
   }
   if(totalHours < 10)
    finalTime = "0" + totalHours + ":";
   else
    finalTime = totalHours + ":";

   if(totalminute < 10)
    finalTime = finalTime + "0" + totalminute + ":";
   else
    finalTime = finalTime + totalminute + ":";

   if(totalSecond < 10)
    finalTime = finalTime + "0" + totalSecond;
   else
    finalTime = finalTime + totalSecond;
   return finalTime
}

module.exports.naiveScheduleWithLocation = naiveScheduleWithLocation;
module.exports.getEndTimeTest = getEndTime;
module.exports.parseScheduleFilesTest = parseScheduleFiles;
module.exports.naiveScheduleTest = naiveSchedule;
module.exports.getStartTimeTest = getStartTime;
module.exports.getLocationTest = getLocation;
module.exports.getEventDateTest = getEventDate;
module.exports.getTimeTest = getTime;
module.exports.getDateTest = getDate;
module.exports.time_addTest = time_add;
module.exports.time_diffTest = time_diff;
module.exports.earlierTest = earlier;
module.exports.date_diffTest = date_diff;
module.exports.date_incTest = date_inc;