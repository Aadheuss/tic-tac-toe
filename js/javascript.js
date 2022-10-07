//store game board as an array inside of a game board object
const lobby = (() => {
  const Players = [];

  const player = (name, type, weapon) => {
   return {name, type, weapon};
  }
  
  const selected = document.querySelector('.one .type .selected').textContent;
  const playerOne = player('playerOne', selected, 'O');
  Players.push(playerOne);

  function pushPlayer (value) {
    Players.push(value);
  }
  
  const playerTwo = (() => {
    const typeList = document.querySelectorAll('.two .type > div');
    typeList.forEach(type => type.addEventListener('click', addPlayer));

    function addPlayer () {
      selectType(this);
      const playerOne = player('playerTwo', selectType(this), 'X');
      pushPlayer(playerOne);
      typeList.forEach(type => type.addEventListener('click', toggleType));
      gameReady();
    }

    function selectType (value) {
      value.classList.add('selected');
      const type = this.textContent;
      typeList.forEach(type => type.removeEventListener('click', addPlayer))
      return{type};
    }

    function toggleType () {
      const i = 1;
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

    if (Players.length === 2) {
      startButton.classList.remove('hidden');
      startButton.addEventListener('click', startGame);
    }

    function startGame () {
      const exitButton = document.querySelector('.return')
      startButton.removeEventListener('click', startGame);
      exitButton.addEventListener('click', exitGame);
      toggleHidden(game);
    }
  
    function exitGame () {
      const game = document.querySelector('.game');
      toggleHidden(game);
      startButton.addEventListener('click', startGame);
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

  function tiles (value) {
    return {value};
  }

  for (let i = 0; i < 9; i++) {
    const obj = tiles(' ');
    gameBoard.push(obj);
  }
  
  gameBoard.forEach(tiles => render(domElements, 'div', tiles.value));

  function render (container, type, value) {
    const item = document.createElement(type);
    item.textContent = value;
    container.appendChild(item)
  }

  return {gameBoard};
})();
//An array will contain 9 x 9 object that will act as a gameboard;
//a function inside gameboard will keep track of the value of the array;
//a player constructor will create a new player;
//we need to create two player playerOne and playerTwo;