const cells = document.querySelectorAll("[cell]");
const inner__text__wrapper = document.querySelector("[inner__text__wrapper]");
const inner__start__text = document.querySelector("[inner__start__text]");
const inner__text = document.querySelector("[inner__text]");
const btn__restart = document.querySelector("[btn__restart]");
const btn__reset = document.querySelector("[btn__reset]");
const X__Score__inner = document.querySelector("[X__Score]");
const O__Score__inner = document.querySelector("[O__Score]");

let board = ["", "", "", "", "", "", "", "", ""];
let player = "X";
let draw = "draw 🤝";
let X__Score = 0;
let O__Score = 0;

const Winning__combination = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

inner__start__text.innerText = `Start with: ${player}`;

function wining(index) {
  Winning__combination.forEach(combination => {
    let check__won = combination.every(i => cells[i].innerText == player);
    board[index] = player;

    if (check__won) {
      masseges(combination);
      X__Score__inner.innerText = `X Score: ${X__Score}`;
      O__Score__inner.innerText = `O Score: ${O__Score}`;
    }
  });
}

function masseges(combination) {
  combination.forEach(index => {
    cells[index].classList.add('win');
    inner__text__wrapper.classList.add('active');
    inner__text.innerText = `won player: ${player}`;
  });
  if (player == "X") {
    X__Score++;
  } else {
    O__Score++;
  }
}

function restart__game() {
  board = ["", "", "", "", "", "", "", "", ""];
  cells.forEach(cell => {
    cell.classList.remove('win', 'clicked');
    cell.innerText = "";
  })
  inner__start__text.innerText = `Start with: ${player}`;
  inner__text__wrapper.classList.remove('active');
}

function reset__game() {
  X__Score = 0;
  O__Score = 0;
  restart__game()
}

cells.forEach((cell, index) => {
  cell.addEventListener('click', () => {
    if (cell.textContent.trim() != "") return
    cell.classList.add('clicked');
    cell.innerText = player;

    wining(index);

    if (player == "X") {
      player = "O";
      inner__start__text.innerText = `Now: ${player}`;
    } else {
      player = "X";
      inner__start__text.innerText = `Now: ${player}`;
    }

    if (!board.includes("") && !cell.classList.contains("win")) {
      inner__text__wrapper.classList.add('active');
      inner__text.innerText = draw;
    }
  });
});

btn__restart.addEventListener('click', restart__game);
btn__reset.addEventListener('click', reset__game);