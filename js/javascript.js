//store game board as an array inside of a game board object
const Lobby = (() => {
  const Players = [];
  const startButton = document.querySelector('.start');
  const game = document.querySelector('.game');
  const playerContainer = document.querySelector('.player-container');

  function checkState () { 
    if (Players.length === 2) {
      startButton.classList.remove('hidden');
      startButton.addEventListener('click', startGame);
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
    value.classList.toggle('hidden');
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
      console.log(weapon)
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


const gameBoard = (() => {
  const domElements = document.querySelector('.gameboard');
  const gameBoard = [];
  let turn = 0;

  function tiles (index) {
    return {index};
  }

  for (let i = 0; i < 9; i++) {
    const obj = tiles(i);
    gameBoard.push(obj);
  }
  
  gameBoard.forEach(tiles => render.call(tiles, domElements, 'div'));

  document.querySelectorAll('.gameboard > div').forEach(tiles => tiles.addEventListener('click', Round))

  function Round () {
      if (turn % 2 === 0) {
        playerTurn.call(this, 0);
      } else {
        playerTurn.call(this, 1);
      }
  }

  function playerTurn (i) {
    if (this.textContent === '') {
    this.value = Lobby.Players[i].weapon;
    this.textContent = this.value;
    const index = Number(this.getAttribute('data-index'));
    gameBoard[index] = this.value;
    turn++;
    }
  }

  function render (container, type) {
    const item = document.createElement(type);
    item.setAttribute('data-index', `${this.index}`);
    container.appendChild(item)
  }

  return {gameBoard};
})();

//a function inside gameboard will keep track of the value of the array;