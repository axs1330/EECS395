parseLocationFile('.\Supporting Documents\Meeting Locations')
function parseLocationFile(filename){
  const fs = require('fs')

  fs.readFile(filename, (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    console.log(data)
  })
}