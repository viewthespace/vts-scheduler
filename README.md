


```Coffee
Schedule = require('vts-scheduler')


schedule = new Schedule
  name: 'schedule'
  people: [ 'Bob', 'Peter', 'Romulus' ]
  startDate: new Date()
  taskSize: 1
  taskLength: 2

schedule.sync ->
  
  schedule.order
  # [ 'Bob', 'Peter', 'Romulus' ]
  
  schedule.people
  # [ 'Bob', 'Peter', 'Romulus' ]
  
  schedule.whoIsOn()
  # ['Bob']
  
  schedule.switch 'Bob', 'Peter', ->
  # Order is persisted
  
    schedule.whoIsOn()
    # ['Peter']
    
  schedule.on '0 8 * * *', ->
    # fires daily 8:00AM New York Time
    
  
```
