/*global io $ */
'use strict'
$(() => {
  let curboard = 0
  const server = io()
  let indices = []
  let ids = []
  const consts = {
    zero: 0,
    one: 1,
    two: 2,
  }


  function getindex(w) {
    let res = ''
    for (let i = 1; i < w.length; i++) {
      res = res + w[i]
    }
    return res
  }

  function isNext(button) {
    if (button === indices[indices.length - consts.one]) {
      return false
    }
    return true
  }
  let interval = undefined
  const secondInterval = 1000
  function countdown(timeremaning) {
    let timer = timeremaning
    if (interval !== undefined) {
      clearInterval(interval)
    }
    interval = setInterval(() => {
      if (timer <= consts.zero) {
        clearInterval(interval)
        interval = undefined
      }
      $('#t').html(timer + ' Seconds Left!')
      timer--
    }, secondInterval)
  }


  $('#connect').on('click',
     () => {
       server.emit('username', $('#username').val())
       server.on('topthree', (a, b, c, d, e, f) => {
         $('#p1').html(a)
         $('#p2').html(b)
         $('#p3').html(c)
         $('#p4').html(d)
         $('#p5').html(e)
         $('#p6').html(f)
       })
       $('#private').on('click', () => {
         server.emit('startPrivate')
         clearInterval(interval)
         $('#htop, #p1, #p2, #p3, #p4, #p5, #p6').html('')
         $('#message').html('Waiting for Player 2!')
         server.on('go', () => {
           $('#message, #htop, #p1, #p2, #p3, #p4, #p5, #p6').html('')
         })
         const waitInterval = 5000
         server.on('gameOver', msg => {
           $('#status')
                 .html(msg + '<br/> Starting Public Game in 5 seconds!')
           setTimeout(() => {
             $('#message').html('')
             $('#htop').html('Top Three Players')
             $('#p1').html('Less than three players now')
             $('#status').html('')
           }, waitInterval)
         })
       })


       $('table').find('button').on('mousedown', function() {
         let listen = consts.one
         indices.push(getindex($(this).attr('id')))
         ids.push($(this).attr('id'))
         $(this).css('background-color', 'green')
         $('table').find('button').on('mouseenter', function() {
           if (listen === consts.one && isNext($(this).html())) {
             if (ids[ids.length - consts.two] === $(this).attr('id')) {
               $('#' + ids[ids.length - consts.one])
                        .css('background-color', 'buttonface')
               indices.pop()
               ids.pop()
             } else {
               ids.push($(this).attr('id'))
               indices.push(getindex($(this).attr('id')))
               $(this).css('background-color', 'green')
             }
           }
         })
         $('table').find('button').on('mouseup', () => {
           if (listen === consts.one) {
             server.emit('word', indices, curboard)
             indices = []
             ids = []
             $('table')
                     .find('button').css('background-color', 'buttonface')
             listen = consts.zero
           }
         })
       })
       server.on('lessPlayers', () => {
         $('#p1').html('Less than three players now')
         $('#p2, #p3, #p4, #p5, #p6').html('')
       })
       server.on('indices', (flag, msg, score, totscore) => {
         if (flag === consts.one) {
           $('#message').append('<br/>Word ' +
             msg + ' scored ' + score + ' points.')
           $('#score').html('Score = ' + totscore)
         } else {
           $('#message').append('<br/>' + msg)
         }
       })
       server.on('grid', (data, timeremaning, bid, winner) => {
         curboard = bid
         $('#message').html('')
         countdown(timeremaning)
         $('#score').html('Score =  0')
         if (winner !== undefined) {
           $('#winner').html('Last Round Winner :' + winner)
         }

         const gridSize = 16
         for (let i = 0; i < gridSize; i++) {
           $('#m' + i).html(data[i])
           $('#m' + i).attr('val', data[i])
         }
       })
     })
})