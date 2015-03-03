path = require("path");
expect = require('chai').expect
Robot = require("hubot/src/robot")
TextMessage = require("hubot/src/message").TextMessage

robot = undefined

describe 'VTS Support', ->
  robot = undefined
  user = undefined
  adapter = undefined

  beforeEach (done) ->
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

  it 'tells me who is on support', (done) ->

    adapter.on 'send', (envelope, strings) ->
      expect(strings[0]).to.eq('@ShawnOMara is on support today')
      done()

    adapter.receive new TextMessage(user, '@Bot who is on support?')

  it 'can switch support days', ->


