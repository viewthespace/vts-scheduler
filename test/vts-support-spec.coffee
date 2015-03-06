path = require("path");
expect = require('chai').expect
Robot = require("hubot/src/robot")
sinon = require('sinon')
moment = require('moment')
TextMessage = require("hubot/src/message").TextMessage

robot = clock = undefined

describe 'VTS Support', ->
  robot = undefined
  user = undefined
  adapter = undefined

  beforeEach (done) ->
    clock = sinon.useFakeTimers(new Date(2015,2,2).getTime())
    robot = new Robot(null, 'mock-adapter', false, 'Bot')
    robot.adapter.on 'connected', ->
      process.env.HUBOT_AUTH_ADMIN = '1'
      robot.loadFile path.resolve(path.join('.')), 'vts-support.coffee'
      user = robot.brain.userForId('1', name: 'support', room: '#support')
      adapter = robot.adapter
      done()
    robot.run()

  afterEach ->
    robot.shutdown()
    clock.restore()

  it 'tells me who is on support', (done) ->

    adapter.on 'send', (envelope, strings) ->
      console.log strings
      expect(strings[0]).to.eq '@ShawnOMara is on support today'
      done()

    adapter.receive new TextMessage(user, '@Bot who is on support?')

  it 'broadcasts who\'s on support each morning at 8 am EST', (done)->

    adapter.on 'send', (envelope, strings) ->
      expect(strings[0]).to.match /@all, @ShawnOMara is on support today and there's \d+ unstarted support issues/
      done()

    clock.tick(1000 * 60 * 60 * 8)
