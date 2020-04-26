console.log(date_diff('2019-02-19', '2019-10-05'))
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
   diff += (month1 - month2) * day_per_month[month1-1]
   let day1 = parseInt(date1.substring(8))
   let day2 = parseInt(date2.substring(8))
   diff += day1 - day2
   return diff
}