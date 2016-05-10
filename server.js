'use strict'

const http = require('http')
const fs = require('fs')
const jade = require('jade')
const path = require('path')
function readFilePromisified(filename, options) { //Part12
  return new Promise(
        (resolve, reject) =>
        fs.readFile(filename, options, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        }))
}

const server = http.createServer((req, resp) => {
  if (req.url === '/') {
    readFilePromisified('client.jade', 'utf-8')
        .then(data => resp.end(jade.compile(data)()))
  } else {
    readFilePromisified(path.basename(req.url))
        .then(data => resp.end(data))
  }
})
let boards = []

const users = {}
let noOfusers = 0
const io = require('socket.io')(server)
let board = ''
let dict = []
let curboard = 0
const zero = 0
const one = 1
const two = 2
const three = 3
const four = 4
const five = 5
const six = 6
const seven = 7
const eight = 8
const gameTime = 120
let timeremaining = 120
const privateGames = {}
let noPrivate = 0
let noOfgames = 0
const gameInterval = 122000
const secondInterval = 1200
const secondInterval2 = 1000
const scores = {
  a: 2,
  b: 5,
  c: 3,
  d: 3,
  e: 1,
  f: 5,
  g: 4,
  h: 4,
  i: 2,
  j: 10,
  k: 6,
  l: 3,
  m: 4,
  n: 2,
  o: 2,
  p: 4,
  q: 8,
  r: 2,
  s: 2,
  t: 2,
  u: 4,
  v: 6,
  w: 6,
  x: 9,
  y: 5,
  z: 8,
}
readFilePromisified('dictionary.txt', 'utf-8')
.then(data => {
  dict = data.split('\n')
})
readFilePromisified('board.txt', 'utf-8')
.then(data => {
  boards = data.split('\n')
  board = boards[zero]
})
setInterval(() => {
  timeremaining--
}, secondInterval)

setInterval(() => { //Part10
  timeremaining = gameTime
  curboard++
  if (curboard === boards.length - one) {
    curboard = zero
  }
  board = boards[curboard]
  const winner = getTopPlayers(one)
  for (let i = one; i <= noOfusers; i++) {
    if (users['user' + i].isPrivate === zero) {
      users['user' + i].score = zero
      users['user' + i].sock
            .emit('grid', board, timeremaining, curboard, winner.name)
    }
  }
}, gameInterval)

io.sockets.on('connection', socket => { //Part9
  socket.on('username', msg => {
    noOfusers++
    users['user' + noOfusers] = {
      name: msg,
      sock: socket,
      score: zero,
      isPrivate: zero,
    }
    socket.emit('grid', board, timeremaining, curboard)
    setInterval(() => {
      if (noOfusers - noPrivate >= three &&
             getUser(socket).isPrivate === zero) {
        const topthree = getTopPlayers()
        socket.emit('topthree',
                topthree[zero].name,
                topthree[zero].score,
                topthree[one].name,
                topthree[one].score,
                topthree[two].name,
                topthree[two].score)
      } else if (getUser(socket).isPrivate === zero) {
        socket.emit('lessPlayers')
      }
    }, secondInterval2)
  })
  socket.on('startPrivate', () => {  //Part13andPart14
    noPrivate++
    getUser(socket).isPrivate = one
    if (noPrivate % two === one) {
      noOfgames++
      privateGames['game' + noOfgames] = {p1: getUser(socket)}
    } else {
      const p1 = privateGames['game' + noOfgames].p1
      privateGames['game' + noOfgames].p2 = getUser(socket)
      const p2 = privateGames['game' + noOfgames].p2
      goGame(socket, p1)
      setTimeout(() => {
        if (p1.score > p2.score) {
          p1.sock.emit('gameOver', 'Winner')
          socket.emit('gameOver', 'Loser')
        } else if (p2.score > p1.score) {
          p1.sock.emit('gameOver', 'Loser')
          socket.emit('gameOver', 'Winner')
        } else {
          p1.sock.emit('gameOver', 'Draw')
          socket.emit('gameOver', 'Draw')
        }
        const waitInterval = 5000
        setTimeout(() => {
          noPrivate = noPrivate - two
          p1.score = zero
          p2.score = zero
          p1.isPrivate = zero
          p2.isPrivate = zero
          p1.sock.emit('grid', board, timeremaining, curboard)
          socket.emit('grid', board, timeremaining, curboard)
        }, waitInterval)
      }, gameInterval)
    }
  })
  socket.on('ev', msg => {
    socket.emit('ev',
            'User ' + getUser(socket).name + ' clicked the letter ' + msg)
  })

  socket.on('word', (msg, bid) => {
    const str = getString(msg, bid)
    if (validateBoard(bid, socket)) {
      if (msg.length >= three && verifyWord(msg, board)) {
        if (!indict(str)) { //Part7
          socket.emit('indices',
                zero, 'Word ' + str + ' is not a dictionary word')
        } else {
          getUser(socket).score =
                      getUser(socket).score + calcScore(str)
          socket.emit('indices',
                one, str, calcScore(str), getUser(socket).score)
        }
      } else {
        socket.emit('indices',
                zero, 'Word ' + str + ' was not accepted by the server.')
      }
    }
  })
})
function goGame(socket, p1) {
  p1.sock.emit('go')
  socket.emit('go')
  p1.sock.emit('grid', board, gameTime, curboard)
  socket.emit('grid', board, gameTime, curboard)
}
function validateBoard(bid, sock) { //Part11
  if (bid === curboard || getUser(sock).isPrivate === one) {
    return true
  }
  return false
}

function calcScore(word) { //Part8
  let score = zero
  for (const i of word) {
    score = score + scores[i]
  }
  const onepfive = 1.5
  if (word.length === four || word.length === five) {
    score = score * onepfive
  } else if (word.length === six || word.length === seven) {
    score = score * two
  } else if (word.length > eight) {
    score = score * three
  }
  return score
}

function getString(inp, bid) {
  let res = ''
  const b = boards[bid]
  for (const i of inp) {
    res = res + b[parseInt(i)]
  }
  return res
}

function getTopPlayers(flag) {
  let topscores = []
  for (let i = one; i <= noOfusers; i++) {
    if (users['user' + i].isPrivate === zero) {
      topscores.push(users['user' + i].score)
    }
  }
  topscores = topscores.sort((a, b) => {
    return b - a
  })
  const topthree = topscores.slice(zero, three)
  return getTopThree(topthree, flag)
}

function getTopThree(topthree, flag) {
  const res = []
  for (let i = zero; i < three; i++) {
    let j = one
    while (users['user' + j].score !== topthree[i] ||
            inList(users['user' + j], res)) {
      j++
    }
    if (flag === one) {
      return users['user' + j]
    }
    res.push(users['user' + j])
  }
  return res
}

function inList(elem, list) {
  for (const i of list) {
    if (i === elem) {
      return true
    }
  }
  return false
}

function getUser(sock) {
  for (let i = 1; i <= noOfusers; i++) {
    if (users['user' + i].sock === sock) {
      return users['user' + i]
    }
  }
  return undefined
}

function verifyWord(word) {
  for (let i = zero; i < word.length; i++) {
    if (i + one !== word.length) {
      if (!validateConsec(word[i], word[i + one], board)) {
        return false
      }
    }
    for (let j = zero; j < word.length; j++) {
      if (i !== j) {
        if (word[i] === word[j]) {
          return false
        }
      }
    }
  }
  return true
}

function validateConsec(l1, l2) {
  const w1 = parseInt(l1)
  const w2 = parseInt(l2)
  if (w2 === w1 + one || w2 === w1 + four ||
        w2 === w1 + five || w2 === w1 + three ||
        w2 === w1 - one || w2 === w1 - four ||
        w2 === w1 - three || w2 === w1 - five) {
    return true
  }
  return false
}

function indict(word) {
  for (const i of dict) {
    if (i === word) {
      return true
    }
  }
  return false
}
const SERVER_PORT = 8000
server.listen(SERVER_PORT)