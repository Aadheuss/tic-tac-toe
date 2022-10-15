//Check the state of the current state of the lobby
const Lobby = (() => {
  const Players = [];
  
  const game = document.querySelector('.game');
  const startButton = document.querySelector('.start');
  const playerContainer = document.querySelector('.player-container');
  const winnerExitBtn = document.querySelector('.winner > button');
  
  winnerExitBtn.addEventListener('click', toggleHidden.bind(winnerExitBtn, winnerExitBtn.parentElement));

  function checkState () { 
    if (Players.length === 2) {
      startButton.classList.remove('hidden');
      startButton.addEventListener('click', startGame);
      winCon.startTurn();
    }
  }

  function startGame() {
    const exitButton = document.querySelector('.return')
    startButton.removeEventListener('click', startGame);
    exitButton.addEventListener('click', exitGame);
    toggleHidden(game);
    toggleHidden(playerContainer);
    playersReady.updateName();
  }
  
  function resetType () {
    const playerContainer = document.querySelectorAll('.player-container > div:not(:nth-child(2))')
    playerContainer.forEach(player => {
      player.classList.remove('human');
      player.classList.remove('ai');
      })
  }

  function exitGame () {
    toggleHidden(game);
    startButton.addEventListener('click', startGame);
    toggleHidden(playerContainer);
    
    for (let i = 0; i <= Players.length; i++) {
      Players.pop();
    }

    startButton.classList.add('hidden');
    const playerSelection = document.querySelectorAll('.selected')

    if (playerSelection !== null) {
      playerSelection.forEach(item => item.classList.remove('selected'));
    }

    winCon.reset();
    winnerExitBtn.parentElement.classList.add('hidden');
    domUpdate.clearInput();
    document.querySelectorAll('input').forEach(input => input.previousElementSibling.classList.remove('hidden'))
    Lobby.Players.forEach(player => player.name = '');
    resetType();
    playersReady.resetName();
  }
  
  function toggleHidden (value) {
    value.classList.toggle('hidden')
  }

  return {Players, checkState};
})()

//check, edit, and add players
const playersReady = (() => {
  let player1Name = '';
  let player2Name = '';

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
        name = player1Name
      } else {
        name = player2Name;
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

  const inputDom = document.querySelectorAll('input');
  inputDom.forEach(dom => dom.addEventListener('input', inputName));

  function inputName () {
    const playerId = this.parentElement.getAttribute('data-id');

    if (playerId === 'player1') {
      player1Name = this.value;
    } else {
      player2Name = this.value;
    }
  }

  function resetName () {
    player1Name = '';
    player2Name = '';
  }

  function updateName () {
    const p1 = Lobby.Players.find(player => player.id === 'player1');
    const p2 = Lobby.Players.find(player => player.id === 'player2');
    p1.name = player1Name;
    p2.name = player2Name;
    domUpdate.changePlayersName();
  }

  return {resetName, updateName}
})()


//make gameboard for players to play on
const Game = (() => {
  const domElements = document.querySelector('.gameboard');
  const gameBoard = [];

  function tiles (index, value) {
    return {index, value};
  }

  for (let i = 0; i < 9; i++) {
    const obj = tiles(i, '');
    gameBoard.push(obj);
  }
  
  gameBoard.forEach(tiles => render.call(tiles, domElements, 'div'));
 
  function render (container, type) {
    const item = document.createElement(type);
    item.setAttribute('data-index', `${this.index}`);
    container.appendChild(item)
  }

  return {gameBoard};
})();

//Check and update the game 
const winCon = (() => {
  const gameBoard = Game.gameBoard;
  const gameBoardDom = document.querySelectorAll('.gameboard > div');
  let turn = 1;
  let win = false;

  gameBoardDom.forEach(tiles => tiles.addEventListener('click', startRound));
 
  const scoreBoard = (() => {
    let round = 1;
    let p1Score = 0;
    let p2Score = 0;
    return {p1Score, p2Score, round};
  })();
  
  function startRound () {
    if (turn % 2 === 0) {
      playerTurn.call(this, 1);
    } else {
      playerTurn.call(this, 0);
    }
  }

  function playerTurn (i) {
    if (this.textContent === '') {
    this.value = Lobby.Players[i].weapon;
    this.textContent = this.value;
    const index = Number(this.getAttribute('data-index'));
    gameBoard[index].value = this.value;
    turn++;
    gameLogic();
    updateTurn();
    resetBoard();
    }
  }

  function updateTurn () {
    const p1ScoreDom = document.querySelector('.scoreboard > div:first-child');
    const p2ScoreDom = document.querySelector('.scoreboard > div:last-child');
    p1ScoreDom.classList.toggle('turn');
    p2ScoreDom.classList.toggle('turn');
  }

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

  function checkWinner (winner) {
    if (winner.id === 'player1') {
      scoreBoard.p1Score += 1;
      updateScore()
    } else if (winner.id === 'player2') {
      scoreBoard.p2Score += 1;
      updateScore()
    } else {
      updateScore();
    }

    updateRound();
    resetBoard();

    if (scoreBoard.round > 3) {
      announceWinner();
    }
  }

  function gameLogic () {
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
      if (gameBoard[a].value !==  '' && gameBoard[a].value === gameBoard[b].value && gameBoard[b].value === gameBoard[c].value) {
        processValue(a, b, c);
      } else {
        win = false;
      }
    }

    function processValue (a, b, c) {

      const winnerArray = [gameBoard[a].index, gameBoard[b].index, gameBoard[c].index];
      winnerArray.forEach(item => {
        const winnerItem = document.querySelector(`[data-index = '${item}']`)
        winnerItem.classList.add('win')
      })

      const result = Lobby.Players.find(item => item.weapon === gameBoard[a].value);
      win = true;
      checkWinner(result);
    }

    checkRow ([0, 3, 6]);
    checkColumn([0, 1, 2]);
    checkCross([4, 2]);
  }

  function updateScore () {
    const p1ScoreDom = document.querySelector('.scoreboard > div:first-child > span');
    const p2ScoreDom = document.querySelector('.scoreboard > div:last-child > span');
    p1ScoreDom.textContent = scoreBoard.p1Score;
    p2ScoreDom.textContent = scoreBoard.p2Score;
  }

  function updateRound () {
    const roundDom = document.querySelector('.round > span');
    scoreBoard.round += 1;
    if (scoreBoard.round <=3) {
      roundDom.textContent = scoreBoard.round;
    }
  }

  function resetBoard () {
    const full = gameBoard.every(tiles => tiles.value !== '');

    if (win === true || full === true) {
      gameBoardDom.forEach(tiles => tiles.removeEventListener('click', startRound));
      gameBoard.forEach(item => item.value = '');
      if (full === true && win !== true) {
        checkWinner('none');
        gameBoardDom.forEach(item => item.classList.add('tie'));
      }
      setTimeout(() => {
        gameBoardDom.forEach(tiles => {
          tiles.textContent = '';
          tiles.classList.remove('win', 'tie');
        });
        if (scoreBoard.round <= 3) {
          gameBoardDom.forEach(tiles => tiles.addEventListener('click', startRound));
        }
      }, 1500)
    }
  }

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
    
    const restartButton = document.querySelector('.restart');
    restartButton.classList.remove('hidden');
    restartButton.addEventListener('click', playAgain);
  }

  function playAgain () {
    const restartButton = document.querySelector('.restart');
    restartButton.classList.add('hidden');

    scoreBoard.round = 0;
    scoreBoard.p1Score = 0;
    scoreBoard.p2Score = 0;

    updateScore();
    updateRound();
    gameBoardDom.forEach(tiles => tiles.addEventListener('click', startRound));
  }

  function reset () {
    turn = 1;
    gameBoardDom.forEach(tiles => tiles.removeEventListener('click', startRound));
    playAgain();
    gameBoard.forEach(item => item.value = '');
    gameBoardDom.forEach(tiles => {
          tiles.textContent = '';
          tiles.classList.remove('win', 'tie');}
    );
  }

  return {startRound, startTurn, reset};
})()

const domUpdate = (() => {
  const p1ScoreDom = document.querySelector('.scoreboard > div:first-child > div');
  const p2ScoreDom = document.querySelector('.scoreboard > div:last-child > div');
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

  function changePlayersName () {
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
  
  function clearInput () {
    inputDom.forEach(input => input.value = '');
  }

  clearInput();

  return {changePlayersName, clearInput, hideLabel}
})()
