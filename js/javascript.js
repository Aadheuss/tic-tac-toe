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

//Show the game area
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
  events.on('returnToLobby', _resetBoardValue);
  events.on('roundEnded', _resetBoardValue);

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
    if(boardIsFull &&scoreBoard.win) {
      events.emit('itsATie')
    };
  }
  
  function _resetBoardValue() {
    board.forEach(obj => obj.value = '');
  }
  return {board};
})();

//Check and update the game 
const gameBoardDom = (function() {
  const gameBoardDom = document.querySelectorAll('.gameboard > div');
  gameBoardDom.forEach(tiles => tiles.addEventListener('click', _selectBoard));

  events.on('itsATie', _renderTie);
  events.on('returnToLobby', _resetBoard);
  events.on('aPlayerWon', _renderWin)
  events.on('roundEnded', _resetBoard);
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
    setTimeout(events.emit.bind(events, 'roundEnded'), 2000);
  }

  function _renderWin(board) {
    for (let i = 0; i < board.length; i++) {
     const selectedBoard = Array.from(gameBoardDom).find(item => Number(item.getAttribute(`data-index`)) === board[i]);
     selectedBoard.classList.add('win');
    }
    setTimeout(events.emit.bind(events, 'roundEnded'), 2000);
  }
  //reset the game board and remove all value
  function _resetBoard() {
    gameBoardDom.forEach(item => {
      item.textContent = '';
      item.classList.remove('win', 'tie');
      }
    );
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
    scoreBoard.changeCurrentPlayer((scoreBoard.getTurn() % 2 === 0)?player[0]:player[1]);
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

//show the winner
const showWin = (function() {
  const winContainer = document.querySelector('.winner > div');
  console.log(winContainer);
  const restartButton = document.querySelector('.restart');
  
  events.on('renderWinner', _announceWinner);

  function _announceWinner (winner) {
    winContainer.parentElement.classList.remove('hidden');
    if (winner !== null) {
      winContainer.textContent = `${winner.getName()} won!`
    } else {
      winContainer.textContent = 'It\'s a tie!'
    }
    restartButton.classList.remove('hidden');   
  }
})();

 //keep track of the players score
 const scoreBoard = (function () {
  let win = false;
  let roundCount = 0;
  let turnCount = 0;
  let _currentPlayer;
  let p1Score = 0;
  let p2Score = 0;
 
  const updateRound = () => roundCount++;
  const updateTurn = () => turnCount++;
  const getRound = () => roundCount;
  const getTurn = () => turnCount;
  const changeCurrentPlayer = (player) => _currentPlayer = player; 
  const getCurrentPlayer = () => _currentPlayer;
  const updatePlayerScore = () => {
    _currentPlayer.getId() === 'player1'?p1Score++:p2Score++;
    events.emit('scoreChanged', getPlayersScore());
  }
  const getPlayersScore = () => {
    return [p1Score, p2Score];
  };
  const _logWIn = () => {
    win = true;
  };
  const _resetWin = () => {
    win = false;
  };
  const getInfo = () => {
    return {win,roundCount,turnCount,_currentPlayer,p1Score,p2Score}
  }
  const _resetScoreBoard = () => {
    win = false;
    _currentPlayer = undefined;
    roundCount = 0;
    turnCount = 0;
    p1Score = 0;
    p2Score = 0;
  }
  const isGameOver = () => {
    if (roundCount > 3) {
      events.emit('gameOver');
    }
  }
  const _getWinner = () => {
    console.log({p1Score, p2Score});
    let winner;
    if (p1Score > p2Score) {
      winner = lobby.players.find(player => player.getId() === 'player1');
    } else if (p2Score > p1Score) {
      winner = lobby.players.find(player => player.getId() === 'player2');
    } else {
      winner = null;
    }
    events.emit('renderWinner', winner);
  }

  events.on('startGame', updateTurn);
  events.on('startGame', updateRound);
  events.on('updatePlayerTurn', updateTurn);
  events.on('aPlayerWon', _logWIn);
  events.on('aPlayerWon', updatePlayerScore);
  events.on('roundEnded', updateRound);
  events.on('roundEnded', _resetWin);
  events.on('returnToLobby', _resetScoreBoard);
  events.on('gameOver', _getWinner);
  events.on('roundEnded', isGameOver);

  return {win, getPlayersScore,getRound, changeCurrentPlayer, getCurrentPlayer, updatePlayerScore, getTurn, getInfo};
})();

//keep and update score
const scoreBoardDom = (function() {
  const _p1ScoreDom = document.querySelector('.scoreboard > div:first-child > span');
  const _p2ScoreDom = document.querySelector('.scoreboard > div:last-child > span');
  const _roundDom = document.querySelector('.round > span');

  events.on('scoreChanged', _updatePlayerScore);
  events.on('roundChanged', _updatePlayerScore);
  events.on('roundEnded', _updateRoundScore);
  events.on('returnToLobby', _updatePlayerScore);
  events.on('startGame', _updateRoundScore);

  //update score to the dom
  function _updatePlayerScore () {
    _p1ScoreDom.textContent = `${scoreBoard.getPlayersScore()[0]}`;
    _p2ScoreDom.textContent = `${scoreBoard.getPlayersScore()[1]}`;
  }

  //update round count to the dom
  function _updateRoundScore () {
      _roundDom.textContent = scoreBoard.getRound();
  }
})()

//check for three in a row 
const gameLogic = (function() {
  events.on('boardChanged', checkBoard);
  //Check for a three in a row
  function checkRow(array) {
    array.forEach(a => {
      const b = a + 1;
      const c = b + 1;
      checkValue(a, b, c);
    })
  }
  //Check for a three in a column
  function checkColumn(array) {
    array.forEach(a => {
      const b = a + 3;
      const c = b + 3;
      checkValue(a, b, c);
    })
  }
  
  //Check for a three in diagonal 
  function checkCross(array) {
    array.forEach(n => {
      const a = 4;
      const b = a + n;
      const c = a - n;
      checkValue(a, b, c);
    })
  }
  
  //check if all the value is the same
  function checkValue (a, b, c) {
    if (gameBoard.board[a].value !==  '' 
    && gameBoard.board[a].value === gameBoard.board[b].value 
    && gameBoard.board[b].value === gameBoard.board[c].value) {
        events.emit('aPlayerWon', [a, b, c]);
    }
  }

  function checkBoard() {
    checkRow ([0, 3, 6]);
    checkColumn([0, 1, 2]);
    checkCross([4, 2]);
  }
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
