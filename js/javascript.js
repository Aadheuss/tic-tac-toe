//Use pubSub to check for events
const events = {
  events: {},
  on: function (eventName, fn) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(fn);
  },
  off: function(eventName, fn) {
    if (this.events[eventName]) {
      for (var i = 0; i < this.events[eventName].length; i++) {
        if (this.events[eventName][i] === fn) {
          this.events[eventName].splice(i, 1);
          break;
        }
      };
    }
  },
  emit: function (eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(function(fn) {
        fn(data);
      });
    }
  }
};

//Check the current state of the game in the lobby
//lobby check all the necessary elements for players to initiate the game
const lobby = (function() {
  const players = [];
  const lobbyContainer = document.querySelector('.lobby');
  const _playersInfoContainer = document.querySelectorAll('.players-container>div:not(:nth-child(2))');
  const _playersTypeBtn = document.querySelectorAll('.type > div');
  const _startGameBtn = document.querySelector('.start');
  const _winnerExitBtn = document.querySelector('.winner > button');
  const _playerTypeList = document.querySelectorAll('.type > div');

  _playerTypeList.forEach(obj => obj.addEventListener('click', _selectPlayerType));
  _startGameBtn.addEventListener('click', _startGame);

  const _Player = (id, type, weapon, name) => {
    let _weapon = weapon;
    let _name = name;
    let _id = id;
    let _type = type;
    
    const getType = () => _type;
    const getId = () => _id;
    const getName = () => _name;
    const getWeapon = () => _weapon;

    const changeType = (type) => {
      _type = type;
    };
    
    const changeName = (name) => {
      _name = name;
    };

    const showInfo = () => {
      return {_id, _name, _weapon, _type}
    };

    return {changeType, changeName, getName, getType, getId, getWeapon, showInfo};
  }

  //create two players
  players.push(_Player('player1', null, 'O', 'player1'));
  players.push(_Player('player2', null, 'X', 'player2'));
  
  //Listen to the events
  events.on('playerIsChanged', _checkState);
  events.on('gameIsReady', _showElement);
  events.on('renderChange', _renderType);
  events.on('nameChanged', _updateName);
  events.on('startGame', _closeLobby);
  events.on('returnToLobby', _openLobby);
  events.on('returnToLobby', _resetPlayerType);
  events.on('returnToLobby', _resetPlayerDom);
  events.on('gameStopped', _hideElement);

  //if both players already have a type show the start game button
  function _checkState (players) { 
    let isReady = players.every(player => player.getType() !== null);
    if (isReady) {
      events.emit('gameIsReady', _startGameBtn);
    }
  }

  function _selectPlayerType(e) {
    const playerId = e.target.parentElement.getAttribute('data-id');
    const playerType = e.target.textContent.toLowerCase();
    const player = players.find(player => player.getId() === playerId);
    player.changeType(playerType);
    events.emit('playerIsChanged', players);
    events.emit('renderChange', e);
  }
  
  function _resetPlayerType() {
    players.forEach(player => {
      player.changeType(null);
    })
  }

  //update player name to the array players every time an event occurs
  function _updateName(info) {
    let playerId = info.id;
    let playerName = info.name;
    let player = players.find(player => player.getId() === playerId)
    player.changeName(playerName);
  }

  function _showElement(el) {
    el.classList.remove('hidden');
  }

  function _hideElement(el) {
    el.classList.add('hidden');
  }
  
  function _startGame() {
    events.emit('startGame', players);
  }
  
  function _closeLobby() {
    lobbyContainer.classList.add('hidden');
  }

  function _openLobby() {
    lobbyContainer.classList.remove('hidden');
  }

  //style the selected type container button and its container
  function _renderType(e) {
    const typeSelections = Array.from(e.target.parentElement.children);
    const selectedType = e.target;
    const selectedContainer = selectedType.parentElement.parentElement.parentElement;

    selectedContainer.classList.remove('human', 'ai');
    typeSelections.forEach(type => type.classList.remove('selected'));
    selectedType.classList.add('selected');
    selectedContainer.classList.add(`${selectedType.textContent.toLowerCase()}`)
  }

  //reset players style container and button
  function _resetPlayerDom() {
    _playersInfoContainer.forEach(container => container.classList.remove('human', 'ai'));
    _playersTypeBtn.forEach(btn => btn.classList.remove('selected'));
    events.emit('gameStopped', _startGameBtn);
  }

  return {players};
})();

//Update the players name on the DOM and update the events on pubSub
const playersNameDom = (function() {
  const inputDom = document.querySelectorAll('input');
  inputDom.forEach(dom => dom.addEventListener('input', inputName));

  events.on('startGame', _renderName);
  events.on('returnToLobby', _resetName);
  events.on('returnToLobby', _clearNameInput)

  function inputName (e) {
    const playerName = e.target.value;
    const playerId = this.parentElement.getAttribute('data-id').toLowerCase();
    events.emit('nameChanged', {id: playerId, name: playerName});
  }

  function _renderName(players) {
    players.forEach(player => {
      const name = player.getName();
      const playerScoreName = document.querySelector(`[data-score='${player.getId()}']>div`);
      playerScoreName.textContent = `${name}:`;
    })
  }
 
  function _resetName(players) {
    players.forEach(player => {
      let playerName = player.getId();
      player.changeName(playerName);
    });
  }

  function _clearNameInput() {
    inputDom.forEach(input => input.value = '');
  }
})();

//create game board for player to play on
const gameBoard = (function () {
  const domElements = document.querySelector('.gameboard');
  const board = [];

  events.on('boardChanged', _updateBoard);
  events.on('boardChanged', _checkFullBoard);

  function _tiles (index, value) {
    return {index, value};
  }

  //create game board with n number of tiles
  function _createBoard(n) {
    for (let i = 0; i < n; i++) {
      const obj = _tiles(i, '');
      board.push(obj);
    }
  }
  
  _createBoard(9);
  board.forEach(tiles => _render.call(tiles, domElements, 'div'));
 
  function _render (container, type) {
    const item = document.createElement(type);
    item.setAttribute('data-index', `${this.index}`);
    container.appendChild(item)
  }

  //Update the board object
  function _updateBoard(info) {
    const index = Number(info[0]);
    const value = info[1];
    const selectedBoard = board.find(obj => obj.index === index);
    selectedBoard.value= value;
  }
  
  function _checkFullBoard() {
    const boardIsFull = board.every(obj => obj.value !== '');

    if(boardIsFull) {
      events.emit('itsATie')
    };
  }

  return {board};
})();

const gameArea = (function() {
  const gameArea = document.querySelector('.game-area');
  const returnBtn = document.querySelector('.return');
  returnBtn.addEventListener('click', _hideDom);
  events.on('startGame', _showDom);

  function _showDom() {
    gameArea.classList.remove('hidden');
  }

  function _hideDom() {
    gameArea.classList.add('hidden');
    events.emit('returnToLobby', lobby.players);
  }

})();

//Check and update the game 
const gameBoardDom = (function() {
  const gameBoardDom = document.querySelectorAll('.gameboard > div');
  gameBoardDom.forEach(tiles => tiles.addEventListener('click', _selectBoard));

  events.on('itsATie', _renderTie);
  //select board if board is empty
  function _selectBoard(e) {
    const selectedBoard = e.target.getAttribute('data-index');
    const selectedBoardVal = scoreBoard.getCurrentPlayer().getWeapon()
    if (e.target.textContent === '') {
      e.target.textContent = `${scoreBoard.getCurrentPlayer().getWeapon()}`;
      events.emit('boardChanged', [selectedBoard, selectedBoardVal]);
      events.emit('updatePlayerTurn', scoreBoard.getRound());
    }
  }

  //change game board tiles when no players win
  function _renderTie() {
      gameBoardDom.forEach(item => item.classList.add('tie'));
  }

  function _renderWin() {

  }
  //reset the game board and remove all value
  function _resetBoard () {
  }
  return {};
})();

//highlight the current player
const players = (function() {
  //scoreboard to keep score on the dom
  const _scoreBoard = document.querySelector('.scoreboard');
  const _playersScoreBoard = document.querySelectorAll('.scoreboard>div');

  events.on('startGame', _currentPlayer);
  events.on('updatePlayerTurn', _currentPlayer);
  events.on('renderCurrentPlayer', _removePlayerHighlight)
  events.on('renderCurrentPlayer', _highlightPlayer);

  function _removePlayerHighlight(player) {
    const currentPlayerEl = Array.from(_playersScoreBoard).find(el => el.getAttribute('data-score') !== player.getId());
    currentPlayerEl.classList.remove('turn');
  }

  function _highlightPlayer(player) {
    const currentPlayerEl = Array.from(_playersScoreBoard).find(el => el.getAttribute('data-score') === player.getId());
    currentPlayerEl.classList.add('turn');
  }

  function _currentPlayer() {
    const player = lobby.players;
    scoreBoard.changeCurrentPlayer((scoreBoard.getRound() % 2 === 0)?player[0]:player[1]);
    events.emit('renderCurrentPlayer', scoreBoard.getCurrentPlayer());
  }

  function changeTilesStyle (a, b, c) {
    const winnerArray = [board[a].index, board[b].index, board[c].index];
    winnerArray.forEach(item => {
      const winnerItem = document.querySelector(`[data-index = '${item}']`)
      winnerItem.classList.add('win')
    })
  }
})();

//show the winner after three round
const showWin = (function() {
  const restartButton = document.querySelector('.restart');
  
  function announceWinner () {
    const winner = document.querySelector('.winner > div');
    winner.parentElement.classList.remove('hidden');

    const p1 = Lobby.players.find(player => player.id === 'player1');
    const p2 = Lobby.players.find(player => player.id === 'player2');

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

 //keep track of the players score
 const scoreBoard = (function () {
  let win = false;
  let round = 0;
  let _currentPlayer;
  let p1Score = 0;
  let p2Score = 0;
 
  const updateRound = () => round++;
  const getRound = () => round;
  const changeCurrentPlayer = (player) => _currentPlayer = player; 
  const getCurrentPlayer = () => _currentPlayer;
  const updatePlayerScore = (player) => player++;
  const getPlayersScore = () => {
    return [p1Score, p2Score];
  };
  
  events.on('startGame', updateRound);
  events.on('updatePlayerTurn', updateRound);

  return {win, getPlayersScore, updateRound, getRound, changeCurrentPlayer, getCurrentPlayer, updatePlayerScore};
})();

//keep and update score
const scoreBoardDom = (function() {
  const _p1ScoreDom = document.querySelector('.scoreboard > div:first-child > span');
  const _p2ScoreDom = document.querySelector('.scoreboard > div:last-child > span');
  const _roundDom = document.querySelector('.round > span');

  events.on('scoreChanged', _updatePlayerScore);

  //update score to the dom
  function _updatePlayerScore () {
    _p1ScoreDom.textContent = `${scoreBoard.getPlayersScore()[0]}`;
    _p2ScoreDom.textContent = scoreBoard.getPlayersScore()[1];
  }

  //update round count to the dom
  function _updateRound () {
      _roundDom.textContent = scoreBoard.getRound();
  }
})()

//check for three in a row 
const gameLogic = (function() {
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
        const result = lobby.players.find(item => item.weapon === board[a].value);
        console.log(result);
    }
  }

  function checkWinner (winner) {
    scoreBoardDom.updateRound()
    gameBoardDom.resetBoard()
  }

  function checkBoard () {
    checkRow ([0, 3, 6]);
    checkColumn([0, 1, 2]);
    checkCross([4, 2]);
  }

  return {checkValue};
})();

//typeofPlayer
const humanOrBot = (function() {
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
const replay = (function() {
  const boardDom = document.querySelectorAll('.gameboard > div');
  const restartButton = document.querySelector('.restart');
  restartButton.addEventListener('click', playAgain);

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
    if (Lobby.players.length === 2) {
      setTimeout(gameBoardDom.checkPlayerTurn.bind(this), 900);
    }
  }

  function reset () {
    boardDom.forEach(board => board.removeEventListener('click', gameBoardDom.checkPlayerTurn))
    boardDom.forEach(board => board.addEventListener('click', gameBoardDom.checkPlayerTurn))
    scoreBoard.turn = 1;
    playerStatus.player = undefined;
    playerStatus.nextPlayer = undefined;
    playAgain();
    gameBoard.board.forEach(board => board.value = '');
    boardDom.forEach(tiles => {
          tiles.textContent = '';
          tiles.classList.remove('win', 'tie');}
    );
  }

  return {reset, playAgain}
})();

//for label Name if the input is not empty
const labelDom = (function() {
  const nameInputDom = document.querySelectorAll('input');
  nameInputDom.forEach(el => el.addEventListener('input', _hideLabel));
  nameInputDom.forEach(el => el.addEventListener('focus', () => el.previousElementSibling.classList.add('black')));
  nameInputDom.forEach(el => el.addEventListener('blur', () => el.previousElementSibling.classList.remove('black')));

  events.on('returnToLobby', _resetLabel);

  function _hideLabel() {
    if (this.value.length > 0) {
      this.previousElementSibling.classList.add('hidden');
    } else {
      this.previousElementSibling.classList.remove('hidden');
    }
  }

  function _resetLabel() {
    nameInputDom.forEach(dom => dom.previousElementSibling.classList.remove('hidden'));
  }
})();
