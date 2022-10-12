//store game board as an array inside of a game board object
const Lobby = (() => {
  const Players = [];
  const startButton = document.querySelector('.start');
  const game = document.querySelector('.game');
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
  }
  
  function exitGame () {
    toggleHidden(game);
    startButton.addEventListener('click', startGame);
    toggleHidden(playerContainer);
  }
  
  function toggleHidden (value) {
    value.classList.toggle('hidden')
  }
  
  return {Players, checkState};
})()
 

const Players = (() => {
  const player = (id, type, weapon) => {
    return {id, type, weapon};
  }

  const typeList = document.querySelectorAll('.type > div');
  typeList.forEach(type => type.addEventListener('click', addPlayer));

  function addPlayer () {
    const value = this.parentElement.parentElement.getAttribute('data-id');
    const playerTList = document.querySelectorAll(`[data-id="${value}"] .type > div`);

    if (Lobby.Players.find(player => (player.id === value)) === undefined) {
      const type = selectType(this);
      const weapon = selectWeapon();
      const playerName = player(value, type, weapon);
      pushPlayer(playerName);
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
    this.classList.toggle('selected');

    if (this.previousElementSibling) {
      this.previousElementSibling.classList.toggle('selected')
    }

    if (this.nextElementSibling) {
      this.nextElementSibling.classList.toggle('selected')
    }

    Lobby.Players[i].type = this.textContent;
  }
 })();


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
      if (full === true) {
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
    winner.parentElement.classList.toggle('hidden');
    
    if (scoreBoard.p1Score > scoreBoard.p2Score) {
      winner.textContent = 'Player1 wins!'
    } else if (scoreBoard.p1Score < scoreBoard.p2Score) {
      winner.textContent = 'Player2 wins!';
    } else {
      winner.textContent = `It's a tie!`;
    }
    
    document.querySelector('.restart').classList.toggle('hidden');
    
    function playAgain () {
    scoreBoard.round = 0;
    scoreBoard.p1Score = 0;
    scoreBoard.p2Score = 0;
    updateScore();
    updateRound();
    }
  }
  return {startRound, startTurn};
})()
//a function inside gameboard will keep track of the value of the array;