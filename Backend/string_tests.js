let a = "13:00:00"
let b = "12:04:00"
console.log(time_add(a, "00:04:00"))
function testTime(a,b){
    console.log(a.substring(0,2))
    return NaN
}

function getDate(dateTime){
    /*
    dateTime: in google API format a string "2020-02-19T09:30:00-05:00"
    */
   return(dateTime.substring(0,10))
}
function time_add(time, increment){
    /* 
    Params: 
    2 times without date
    return: the first time pushed a head
    */
   let finalTime = ""
   second1 = parseInt(time.substring(6))
   second2 = parseInt(increment.substring(6))
   let totalSecond = second1 + second2
   minute1 = parseInt(time.substring(3,5))
   minute2 = parseInt(increment.substring(3,5))
   let totalminute = minute1 + minute2
   if (totalSecond > 60){
       totalminute += totalSecond/60
       totalSecond = totalSecond%60
   }
   hour1 = parseInt(time.substring(0,2))
   hour2 = parseInt(increment.substring(0,2))
   let totalHours = hour1+hour2
   if (totalminute > 60){
    totalhour += totalminute / 60
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