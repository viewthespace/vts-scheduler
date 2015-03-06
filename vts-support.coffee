_ = require('lodash')
moment = require('moment')
CronJob = require('cron').CronJob
restler = require('restler')

CRON_SCHEDULE = '0 13 * * 1-5' # Weekdays 8:00 AM

CRON_TIMEZONE = 'America/New_York'

NERDS_ROOM = '14579_nerds@conf.hipchat.com'

SUPPORT_ENGINEERS = [
  '@ShawnOMara'
  '@ErikPearson'
  '@IanForsyth'
  '@Paul'
  '@DanUbilla'
  '@CharlesMcMillan'
  '@KarlBaum'
  '@kenliu'
  '@AndrewLin'
  '@Basil'
]

START_DATE = moment('2015-03-01')

END_DATE = moment('2015-07-01')

createSchedule = (start, end)->
  m = moment(START_DATE)
  schedule = {}
  work_days = []

  while m.isBefore(END_DATE)
    if m.isoWeekday() != 6 and m.isoWeekday() != 7
      work_days.push 'vts:support:' + m.format('MMDDYYYY')
    m.add 'days', 1

  _.chunk(work_days, 2).forEach (chunk, i)->
    index = i % SUPPORT_ENGINEERS.length
    schedule[chunk[0]] = SUPPORT_ENGINEERS[index]
    schedule[chunk[1]] = SUPPORT_ENGINEERS[index]

  schedule

whosOnSupport = (schedule)->
  key = 'vts:support:' + moment().format('MMDDYYYY')
  "#{schedule[key]} is on support today"

unstartedStoryCnt = (cb)->
  endpoint = 'https://www.pivotaltracker.com/services/v5/projects/1062572/stories?with_state=unstarted&limit=100'
  restler.get(endpoint, { headers: {'X-TrackerToken': process.env.TRACKER_TOKEN} } ).on 'complete', (result)->
    cb(result.length)
  

module.exports = (robot) ->

  console.error 'Please set TRACKER_TOKEN env variable' unless process.env.TRACKER_TOKEN

  schedule = createSchedule()

  new CronJob CRON_SCHEDULE, ->
    unstartedStoryCnt (cnt)->
      robot.messageRoom(NERDS_ROOM,  "@all, #{whosOnSupport(schedule)} and there's #{cnt} unstarted support issues")
  , null, true, CRON_TIMEZONE

  robot.respond /who is on support\?/i, (msg)->
    msg.send(whosOnSupport(schedule))
