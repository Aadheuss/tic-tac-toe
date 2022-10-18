//Check the current state of the lobby
const Lobby = (() => {
  const Players = [];
  const game = document.querySelector('.game');
  const playerContainer = document.querySelector('.player-container');
  const winnerExitBtn = document.querySelector('.winner > button');
  const startButton = document.querySelector('.start');
  
  winnerExitBtn.addEventListener('click', toggleHidden.bind(winnerExitBtn, winnerExitBtn.parentElement));

  function checkState () { 
    if (Players.length === 2) {
      startButton.classList.remove('hidden');
      currentPlayer.startTurn();
      startButton.addEventListener('click', startGame);
    }
  }

  function startGame() {
    exitButton.addEventListener('click', exitGame);
    startButton.removeEventListener('click', startGame);
    toggleHidden(game);
    toggleHidden(playerContainer);
    pNameDom.updateName();
    gameBoardDom.checkPlayerTurn();
  }
  

  const exitButton = document.querySelector('.return');
  function exitGame () {
    exitButton.removeEventListener('click', exitGame);
    startButton.addEventListener('click', startGame);
    toggleHidden(game);
    toggleHidden(playerContainer);
    //delete players
    for (let i = 0; i <= Players.length; i++) {
      Players.pop();
    }

    toggleHidden(startButton);
    const playerSelection = document.querySelectorAll('.selected')
    if (playerSelection !== null) {
      playerSelection.forEach(item => item.classList.remove('selected'));
    }

    winnerExitBtn.parentElement.classList.add('hidden');
    pNameDom.clearInput();
    document.querySelectorAll('input').forEach(input => input.previousElementSibling.classList.remove('hidden'))
    Lobby.Players.forEach(player => player.name = '');
    resetType();
    pNameDom.resetName();
    replay.reset();
  }
  
  function toggleHidden (value) {
    value.classList.toggle('hidden')
  }
  
  function resetType () {
    const playerContainer = document.querySelectorAll('.player-container > div:not(:nth-child(2))')
    playerContainer.forEach(player => {
      player.classList.remove('human');
      player.classList.remove('ai');
      })
  }

  return {Players, checkState};
})();

//check, edit, and add players
const playersReady = (() => {
  const player = (id, type, weapon, name) => {
    return {id, type, weapon, name};
  }

  const typeList = document.querySelectorAll('.type > div');
  typeList.forEach(type => type.addEventListener('click', addPlayer));

  function addPlayer () {
    const value = this.parentElement.parentElement.getAttribute('data-id');
    const playerTList = document.querySelectorAll(`[data-id="${value}"] .type > div`);

    if (Lobby.Players.find(player => (player.id === value)) === undefined) {
      let name;
      if (value === 'player1') {
        name = pNameDom.p1Name
      } else {
        name = pNameDom.p2Name;
      }

      const type = selectType(this);
      const weapon = selectWeapon();
      const playerName = player(value, type, weapon, name);
      pushPlayer(playerName);
      toggleType.call(this, value);
      playerTList.forEach(type => type.addEventListener('click', toggleType.bind(type, value)));
    }
    Lobby.checkState()
  }

  function selectWeapon () {
    let weapon;
    if (Lobby.Players.length === 0) {
      weapon = 'O';
    } else {
      weapon = 'X';
    }
    return weapon;
  }

  function selectType (value) {
    value.classList.add('selected');
    const type = value.textContent;
    return type;
  }

  function pushPlayer (value) {
    Lobby.Players.push(value);
  }

  function toggleType (value) {
    const i = Lobby.Players.findIndex(player => player.id === value);
    this.classList.add('selected');

    if (this.textContent === 'Human') {
      Lobby.Players[i].type = 'human';
      this.nextElementSibling.classList.remove('selected');
      this.parentElement.parentElement.parentElement.classList.remove('ai');
      this.parentElement.parentElement.parentElement.classList.add('human');
    } else {
      Lobby.Players[i].type = 'ai';
      this.previousElementSibling.classList.remove('selected');
      this.parentElement.parentElement.parentElement.classList.remove('human');
      this.parentElement.parentElement.parentElement.classList.add('ai');
    }
  }
})();

//make gameboard for players to play on
const gameBoard = (() => {
  const domElements = document.querySelector('.gameboard');
  const board = [];

  function tiles (index, value) {
    return {index, value};
  }

  for (let i = 0; i < 9; i++) {
    const obj = tiles(i, '');
    board.push(obj);
  }
  
  board.forEach(tiles => render.call(tiles, domElements, 'div'));
 
  function render (container, type) {
    const item = document.createElement(type);
    item.setAttribute('data-index', `${this.index}`);
    container.appendChild(item)
  }

  return {board};
})();

//highlight the current player
const currentPlayer = (() => {
  const board = gameBoard.board;
  
  function startTurn () {
    const p1ScoreDom = document.querySelector('.scoreboard > div:first-child');
    const p2ScoreDom = document.querySelector('.scoreboard > div:last-child');

    if (Lobby.Players[0].id === 'player1') {
    p1ScoreDom.classList.add('turn');
    p2ScoreDom.classList.remove('turn')
    } else {
    p2ScoreDom.classList.add('turn');
    p1ScoreDom.classList.remove('turn');
    }
  }

  function updateTurn () {
    const p1ScoreDom = document.querySelector('.scoreboard > div:first-child');
    const p2ScoreDom = document.querySelector('.scoreboard > div:last-child');
    p1ScoreDom.classList.toggle('turn');
    p2ScoreDom.classList.toggle('turn');
  }
  
  function changeTilesStyle (a, b, c) {
    const winnerArray = [board[a].index, board[b].index, board[c].index];
    winnerArray.forEach(item => {
      const winnerItem = document.querySelector(`[data-index = '${item}']`)
      winnerItem.classList.add('win')
    })
  }

  return {updateTurn, startTurn, changeTilesStyle}
})();

//keep track of the players score
const scoreBoard = (() => {
  let win = false;
  let turn = 1;
  let round = 1;
  let p1Score = 0;
  let p2Score = 0;
  return {p1Score, p2Score, round, turn, win};
})();

const playerStatus = (() => {
  let player;
  let nextPlayer;

  return {player, nextPlayer}
})();

//Check and update the game 
const gameBoardDom = (() => {
  const gameBoardDom = document.querySelectorAll('.gameboard > div');
  gameBoardDom.forEach(tiles => tiles.addEventListener('click', checkPlayerTurn));
  
  function checkPlayerTurn () {
    if (Lobby.Players.length === 2) {
      playerStatus.player = currentPlayer();
      playerStatus.nextPlayer = checkNextPlayer()
      console.log(playerStatus)
      if (scoreBoard.round <= 3) {
        if (playerStatus.player.type === 'human') {
          humanOrBot.humanTurn.call(this, playerStatus.player)
        } else {
          gameBoardDom.forEach(tiles => tiles.removeEventListener('click', checkPlayerTurn));
          humanOrBot.robotTurn(playerStatus.player);
        }
      }
    }
  }
  
  function currentPlayer () {
    if (scoreBoard.turn % 2 === 0) {
      return Lobby.Players[1]
    } else {
      return Lobby.Players[0]
    }
  }

  function checkNextPlayer () {
    if (scoreBoard.turn % 2 === 0) {
      return Lobby.Players[0]
    } else {
      return Lobby.Players[1]
    }
  }

  function resetBoard () {
    gameBoardDom.forEach(tiles => tiles.removeEventListener('click', checkPlayerTurn));
    setTimeout(() => {
      gameBoard.board.forEach(item => item.value = '');
      scoreBoard.win = false;
      gameBoardDom.forEach(tiles => {
        tiles.textContent = '';
        tiles.classList.remove('win', 'tie');
        tiles.addEventListener('click', checkPlayerTurn);
      });
      setTimeout(checkPlayerTurn.bind(this), 900);
    }, 1500)
  }

  return {checkPlayerTurn, resetBoard, currentPlayer};
})();

//show the winner after three round
const showWin = (() => {
  const restartButton = document.querySelector('.restart');
  restartButton.addEventListener('click', replay.playAgain);
  function announceWinner () {
    const winner = document.querySelector('.winner > div');
    winner.parentElement.classList.remove('hidden');

    const p1 = Lobby.Players.find(player => player.id === 'player1');
    const p2 = Lobby.Players.find(player => player.id === 'player2');

    if (scoreBoard.p1Score > scoreBoard.p2Score) {
      if (p1.name !== '') {
        winner.textContent = `${p1.name} wins!`;
      } else {
        winner.textContent = 'Player1 wins!'
      } 
      winner.parentElement.classList.remove('no-win');

    } else if (scoreBoard.p1Score < scoreBoard.p2Score) {
      if (p2.name !== '') {
        winner.textContent = `${p2.name} wins!`;
      } else {
        winner.textContent = 'Player2 wins!';
      }
      winner.parentElement.classList.remove('no-win');

    } else {
      winner.textContent = `It's a tie!`;
      winner.parentElement.classList.add('no-win');
    }
    restartButton.classList.remove('hidden');   
  }

  return {announceWinner}
})();

//keep and update score
const scoreBoardDom = (() => {
  function updateScore () {
    const p1ScoreDom = document.querySelector('.scoreboard > div:first-child > span');
    const p2ScoreDom = document.querySelector('.scoreboard > div:last-child > span');
    p1ScoreDom.textContent = scoreBoard.p1Score;
    p2ScoreDom.textContent = scoreBoard.p2Score;
  }

  function updateRound () {
    const roundDom = document.querySelector('.round > span');
    if (scoreBoard.round <=3) {
      roundDom.textContent = scoreBoard.round;
    }
  }

  return {updateScore, updateRound}
})()

//check for three in a row 
const gameLogic = (() => {
  const boardDom = document.querySelectorAll('.gameboard > div');
  const board = gameBoard.board;

  function checkFullBoard () {
    const full = board.every(tiles => tiles.value !== '');
    console.log(full)
    if (full === true && scoreBoard.win !== true) {
      boardDom.forEach(item => item.classList.add('tie'));
      checkWinner('none');
    }
  }

  function checkRow (array) {
    array.forEach(a => {
      const b = a + 1;
      const c = b + 1;
      checkValue(a, b, c);
    })
  }

  function checkColumn (array) {
    array.forEach(a => {
      const b = a + 3;
      const c = b + 3;
      checkValue(a, b, c);
    })
  }
  
  function checkCross (array) {
    array.forEach(n => {
      const a = 4;
      const b = a + n;
      const c = a - n;
      checkValue(a, b, c);
    })
  }
  
  function checkValue (a, b, c) {
    if (board[a].value !==  '' && board[a].value === board[b].value && board[b].value === board[c].value) {
      if (scoreBoard.win !== true) {
        currentPlayer.changeTilesStyle(a, b, c);
        const result = Lobby.Players.find(item => item.weapon === board[a].value);
        scoreBoard.win = true;
        checkWinner(result);
      }
    }
  }
  
  function checkWinner (winner) {
    if (winner.id === 'player1') {
      scoreBoard.p1Score += 1;
    }
    
    if (winner.id === 'player2') {
      scoreBoard.p2Score += 1;
    }
    
    scoreBoardDom.updateScore()
    if (scoreBoard.round <= 4) {
      scoreBoard.round = scoreBoard.round + 1;
    }
    scoreBoardDom.updateRound()
    gameBoardDom.resetBoard()
    
    console.log(scoreBoard)
    if (scoreBoard.round > 3) {
      setTimeout(showWin.announceWinner, 1600);
    }
  }

  function checkBoard () {
    checkRow ([0, 3, 6]);
    checkColumn([0, 1, 2]);
    checkCross([4, 2]);
  }

  return {checkBoard, checkWinner, checkFullBoard};
})();

//typeofPlayer
const humanOrBot = (() => {
  const boardDom = document.querySelectorAll('.gameboard > div');
  const board = gameBoard.board;

  function humanTurn (player) {
    if (this.textContent === '') {
      this.value = player.weapon;
      this.textContent = this.value;
      const index = Number(this.getAttribute('data-index'));
      board[index].value = this.value;
      scoreBoard.turn++;
      gameLogic.checkBoard();
      currentPlayer.updateTurn();
      if (playerStatus.nextPlayer.type === 'ai') {
        setTimeout(gameBoardDom.checkPlayerTurn.bind(this), 900);
      }
      gameLogic.checkFullBoard()
    }
  }

  function robotTurn (player) {
    if (scoreBoard.win !== true && board.forEach(tiles => tiles.value !== '') !== true) {
      const emptyBoard = board.filter(board => board.value === '');
      if (emptyBoard.length > 0) {
        const item = emptyBoard[Math.floor((Math.random()*emptyBoard.length))];
        const index = item.index;
        board[index].value =  player.weapon;
        const selectedBoard = document.querySelector(`[data-index='${index}']`)
        selectedBoard.textContent = player.weapon;
        scoreBoard.turn++;
        gameLogic.checkBoard();
        currentPlayer.updateTurn();
        if (playerStatus.nextPlayer.type === 'ai') {
          setTimeout(gameBoardDom.checkPlayerTurn.bind(this), 900);
        } else {
          boardDom.forEach(tiles => tiles.addEventListener('click', gameBoardDom.checkPlayerTurn));
        }
        gameLogic.checkFullBoard()
      }
    }
  }

  return {robotTurn, humanTurn};
})();

//replay or reset the game
const replay = (() => {
  const boardDom = document.querySelectorAll('.gameboard > div')

  function playAgain () {
    const winner = document.querySelector('.winner > div');
    winner.parentElement.classList.add('hidden');
    const restartButton = document.querySelector('.restart');
    restartButton.classList.add('hidden');

    scoreBoard.round = 1;
    scoreBoard.p1Score = 0;
    scoreBoard.p2Score = 0;
    scoreBoardDom.updateScore();
    scoreBoardDom.updateRound();
    if (Lobby.Players.length === 2) {
      setTimeout(gameBoardDom.checkPlayerTurn.bind(this), 900);
    }
  }

  function reset () {
    boardDom.forEach(board => board.removeEventListener('click', gameBoardDom.checkPlayerTurn))
    boardDom.forEach(board => board.addEventListener('click', gameBoardDom.checkPlayerTurn))
    scoreBoard.turn = 1;
    playerStatus.player = undefined;
    playerStatus.nextPlayer = undefined;
    console.log(playerStatus)
    playAgain();
    gameBoard.board.forEach(board => board.value = '');
    boardDom.forEach(tiles => {
          tiles.textContent = '';
          tiles.classList.remove('win', 'tie');}
    );
  }

  return {reset, playAgain}
})();

//for label related output
const labelDom = (() => {
  const inputDom = document.querySelectorAll('input');

  inputDom.forEach(dom => dom.addEventListener('input', hideLabel));
  inputDom.forEach(dom => dom.addEventListener('focus', () => dom.previousElementSibling.classList.add('black')));
  inputDom.forEach(dom => dom.addEventListener('blur', () => dom.previousElementSibling.classList.remove('black')));

  function hideLabel () {
    if (this.value.length > 0) {
      this.previousElementSibling.classList.add('hidden');
    } else {
      this.previousElementSibling.classList.remove('hidden');
    }
  }
  
  return  {hideLabel}
})();

//Update the players name Dom
const pNameDom = (() => {
  let p1Name = '';
  let p2Name = '';
  const inputDom = document.querySelectorAll('input');
  inputDom.forEach(dom => dom.addEventListener('input', inputName));

  function inputName () {
    const playerId = this.parentElement.getAttribute('data-id');

    if (playerId === 'player1') {
      p1Name = this.value;
    } else {
      p2Name = this.value;
    }
  }

  function updateName () {
    const p1 = Lobby.Players.find(player => player.id === 'player1');
    const p2 = Lobby.Players.find(player => player.id === 'player2');
    p1.name = p1Name;
    p2.name = p2Name;
    changePlayersName();
  }

  function changePlayersName () {
    const p1ScoreDom = document.querySelector('.scoreboard > div:first-child > div');
    const p2ScoreDom = document.querySelector('.scoreboard > div:last-child > div');
    const p1 = Lobby.Players.find(player => player.id === 'player1');
    const p2 = Lobby.Players.find(player => player.id === 'player2');

    if (p1 !== undefined) {
      if (p1.name === '') {
        p1ScoreDom.textContent = 'player1:'
      } else {
        p1ScoreDom.textContent = `${p1.name}:`;
      }
    }
    
    if (p2 !== undefined) {
      if (p2.name === '') {
        p2ScoreDom.textContent = 'player2:'
      } else {
        p2ScoreDom.textContent = `${p2.name}:`;
      }
    }
  }
 
  function resetName () {
    p1Name = '';
    p12Name = '';
  }

  function clearInput () {
    inputDom.forEach(input => input.value = '');
  }

  clearInput();
  return {changePlayersName, clearInput, resetName, updateName, p1Name, p2Name}
})();
