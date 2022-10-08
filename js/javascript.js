//store game board as an array inside of a game board object
const lobby = (() => {
  const Players = [];

  const player = (id, type, weapon) => {
   return {id, type, weapon};
  }
  
  function pushPlayer (value) {
    Players.push(value);
  }
  
  const playerList = (() => {
    const typeList = document.querySelectorAll('.type > div');
    typeList.forEach(type => type.addEventListener('click', addPlayer));

    function addPlayer () {
      const value = this.parentElement.parentElement.getAttribute('data-id');
      const playerTList = document.querySelectorAll(`[data-id="${value}"] .type > div`);

      if (Players.find(player => (player.id === value)) === undefined) {
        const type = selectType(this);
        const playerName = player(value, type, 'X');
        pushPlayer(playerName);
        playerTList.forEach(type => type.addEventListener('click', toggleType.bind(type, value)));
      }

      gameReady();
    }

    function selectType (value) {
      value.classList.add('selected');
      const type = value.textContent;
      return type;
    }

    function toggleType (value) {
      const i = Players.findIndex(player => player.id === value);

      this.classList.toggle('selected');
      if (this.previousElementSibling) {
        this.previousElementSibling.classList.toggle('selected')
      }

      if (this.nextElementSibling) {
        this.nextElementSibling.classList.toggle('selected')
      }
    
      Players[i].type = this.textContent;
    }
  })();

  function gameReady () {
    const startButton = document.querySelector('.start');
    const game = document.querySelector('.game');
    const playerContainer = document.querySelector('.player-container');

    if (Players.length === 2) {
      startButton.classList.remove('hidden');
      startButton.addEventListener('click', startGame);
    }

    function startGame () {
      startButton.removeEventListener('click', startGame);
      const exitButton = document.querySelector('.return')
      exitButton.addEventListener('click', exitGame);
      toggleHidden(game);
      toggleHidden(playerContainer);
    }
  
    function exitGame () {
      const game = document.querySelector('.game');
      toggleHidden(game);
      startButton.addEventListener('click', startGame);
      toggleHidden(playerContainer);
    }
  }
  
  function toggleHidden (value) {
    value.classList.toggle('hidden');
  }
  
  return {Players};
})()

const gameBoard = (() => {
  const domElements = document.querySelector('.gameboard');
  const gameBoard = [];

  function tiles (index) {
    return {index};
  }

  for (let i = 0; i < 9; i++) {
    const obj = tiles(i);
    gameBoard.push(obj);
  }
  
  gameBoard.forEach(tiles => render.call(tiles, domElements, 'div'));
  document.querySelectorAll('.gameboard > div').forEach(tiles => tiles.addEventListener('click', () => {
    console.log(lobby.Players)
    tiles.value = lobby.Players[1].weapon;
    tiles.textContent = tiles.value;
    const index = Number(tiles.getAttribute('data-index'));
    gameBoard[index] = tiles.value;
    console.log(tiles.getAttribute('data-index'));
    console.log(gameBoard[index]);
  }))

  function render (container, type) {
    const item = document.createElement(type);
    item.setAttribute('data-index', `${this.index}`);
    container.appendChild(item)
  }

  return {gameBoard};
})();
//An array will contain 9 x 9 object that will act as a gameboard;
//a function inside gameboard will keep track of the value of the array;
//a player constructor will create a new player;
//we need to create two player playerOne and playerTwo;