'use strict'

/* Game control variable */
const game = {
    currentCell: 'None',
    pencil: false,
    undo: 0
};


/* Constants */
const num_ref = {
    'one': ['<p class="not-pencil">1</p>', '<p class="pencil">1</p>', 1],
    'two': ['<p class="not-pencil">2</p>', '<p class="pencil">2</p>', 2],
    'three': ['<p class="not-pencil">3</p>', '<p class="pencil">3</p>', 3],
    'four': ['<p class="not-pencil">4</p>', '<p class="pencil">4</p>', 4],
    'five': ['<p class="not-pencil">5</p>', '<p class="pencil">5</p>', 5],
    'six': ['<p class="not-pencil">6</p>', '<p class="pencil">6</p>', 6],
    'seven': ['<p class="not-pencil">7</p>', '<p class="pencil">7</p>', 7],
    'eight': ['<p class="not-pencil">8</p>', '<p class="pencil">8</p>', 8],
    'nine': ['<p class="not-pencil">9</p>', '<p class="pencil">9</p>', 9]
};

const ref = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine'
};

/* =============================================== */
/* Game core functions */
/* =============================================== */

/*
This function calls back-end to verify the state of
the board and commit corresponding actions to various states
*/
function verifyBoard() {
    // clear any error before assigning new ones
    clearError();

    // call back-end to see the state of the board
    $(() => {
        $.getJSON("/games/sudoku/verify", {}, (data) => {
            // get the data passed in from back-end
            const result = data['result'];
            const id_list = data['id_list'];

            // if result is true, meaning the game is won, call end game function
            if (result === true) {
                endGame()
            }
            // if result is false, meaning the board isn't complete, do nothing
            else if (result === false) {
            }
            // else, meaning there are errors on board, highlight the wrong number
            else {
                // loop through all the ids of the wrong number
                for (let i = 0; i < id_list.length; i++) {
                    const cell = $('p', '#' + id_list[i]);

                    // remove the base color
                    cell.removeClass('not-pencil');
                    try {
                        // if the move was made by the player, remove player move color too
                        if (cell.attr('class').includes('player')) {
                            cell.removeClass('player');
                        }
                    } catch (TypeError) { // silence type error
                    }

                    // add error color to the numbers
                    cell.addClass('error');
                }
            }
        });
    })
}

/*
This function resets entire board and game variables in preparation for new game
 */
function reset() {
    // remove color for current cell
    $('#' + game.currentCell).removeClass('selected');

    // set game variables to original state
    game.currentCell = 'None';
    game.pencil = false;
    game.undo = 0;

    // update information panel
    updateInfo();

    // loop through all cells and clear the content in it
    for (let i = 1; i <= 9; i++) {
        for (let j = 1; j <= 9; j++) {

            // get id and select the cell
            const id = ref[i] + '-' + ref[j];

            // clear board content and remove all associated classes
            $('#' + id).html('');
        }
    }
}

/*
This function commit a number of actions to get a game started
 */
function start() {
    // assign event handlers to side-bar number pad and game board cells
    $('.num').click(setNum);
    $('.game-field').click(selectCell);

    // calls back-end to setup sudoku board and render the puzzle
    $.getJSON("/games/sudoku/setup", {}, (data) => {
        renderBoard(data['board']);
    });
}

/*
This function clears any error previously assigned
 */
function clearError() {
    // loop through all cells to remove errors assigned to cells
    for (let i = 1; i <= 9; i++) {
        for (let j = 1; j <= 9; j++) {

            // select the cell
            const id = ref[i] + '-' + ref[j];
            const cell = $('p', '#' + id);

            // remove error color and add base non-pencil color
            cell.removeClass('error');
            cell.addClass('not-pencil');

            // add player move color is the move made by player
            try {
                if (cell.attr('class').includes('player-con')) {
                    cell.addClass('player')
                }
            } catch (TypeError) {   // silence TypeError
            }
        }
    }
}

/*
This function renders the given board onto the web page
 */
function renderBoard(board) {
    // loop through every element in the given 2D-array board
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {

            // get value from the given board on position (i, j)
            const id = ref[i + 1] + '-' + ref[j + 1];
            const val = board[i][j];

            // if value on board isn't 0, then draws the correct number onto the web page
            if (val !== 0) {
                const cell = $('#' + id);
                cell.html(num_ref[ref[val]][0]);

                // remove onclick attribute to prevent user from changing base puzzle
                cell.removeAttr('onclick');

                // call function to add number in back-end board
                // addMove(id, val)
            }
        }
    }
}

/* =============================================== */
/* Event handlers - button handlers */
/* =============================================== */

/*
This function is linked with all number pad numbers. It draws the
selected number into the cell that is currently selected by user
 */
function setNum(e) {
    const targetId = e.target.id;

    // run following only if a cell is selected
    if (game.currentCell !== 'None') {
        // select current cell with jquery
        const cell = $('#' + game.currentCell);

        // if pencil feature is toggled, draw penciled number into cell
        if (game.pencil) {

            // if the original element is null, then save move with a different way
            if ($('p', cell).html() == null) {
                saveMove(game.currentCell, false, false);
                cell.html(num_ref[targetId][1]);
            }
            // if the original element is penciled, then save move with the pencil way
            else {
                // draw
                cell.html(num_ref[targetId][1]);

                // calls function to save this move for undo feature
                const innerEle = $('p', cell);
                saveMove(game.currentCell, innerEle.html(), game.pencil);
            }
        }

        // if pencil feature isn't on, draw non-penciled number into cell with player move color
        else {
            // check whether the user is trying to enter in the same number
            // prevent includes() being called on undefined
            let innerClass = $('p', cell).attr('class');
            if (innerClass === undefined) {
                innerClass = "";
            }

            if ($('p', cell).html() !== num_ref[targetId][2] && !innerClass.includes('pencil')) {

                // calls function to save this move for undo feature
                saveMove(game.currentCell, false, game.pencil);

                // draw
                cell.html(num_ref[targetId][0]);

                // add player color to number
                const innerEle = $('p', cell);
                innerEle.addClass('player');
                innerEle.addClass('player-con');

                // call function to update back-end board
                addMove(game.currentCell, num_ref[targetId][2]);

                // call function to verify board
                verifyBoard();
            }
        }
    }
}

/*
This function links with all the cells on the game board.
It updates game variable and highlight currently selected cell.
 */
function selectCell(e) {
    if (e.target.id !== "") {
        // remove the highlighting on that current selected cell
        if (game.currentCell !== 'None') {
            $('#' + game.currentCell).removeClass('selected');
        }

        // highlight target cell and save it to game variable
        $('#' + e.target.id).addClass('selected');
        game.currentCell = e.target.id;
    }
}

/*
This function links with pencil toggle button. It turns pencil feature on or off
 */
$('#pencil-toggle').click(() => {
    game.pencil = !game.pencil;

    // update info pad
    updateInfo();
});

/*
This function links with new game button. It resets board and start a new game
 */
const newGame = function () {
    reset();
    start();
}

$('#new-game').click(newGame);
$('#restart').click(newGame);

/*
This function links with erase button. It erase number in currently selected cell
and update the back-end board, and verifies the new board.
 */
$('#erase').click(() => {
    // select current cell with jquery
    const currentCell = $('#' + game.currentCell);

    // if pencil is toggled, then
    try {
        // if the current cell is written with pencil, save the move for undo
        if (currentCell.attr('class').includes('pencil')) {
            const innerEle = $('p', '#' + game.currentCell);
            saveMove(game.currentCell, innerEle.html(), game.pencil);
        }
        // if the current cell isn't with pencil, save the move for undo, and update board
        else {
            saveMove(game.currentCell, false, game.pencil);
            addMove(game.currentCell, 0);
        }
    } catch (TypeError) {  // silence TypeError
    }

    // erase content in current cell
    currentCell.html('');

    // calls function to verify the board
    verifyBoard();
});

/*
This function links with undo button. It undoes player's last move
 */
function undo(id, num, pencil) {
    // if id passed in isn't empty
    if (id !== false) {

        // update info pad
        game.undo++;
        updateInfo();

        // if number passed in isn't 0
        if (num !== 0) {

            // if pencil passed in is true, then draw number in cell with pencil
            if (pencil) {
                $('#' + id).html(num_ref[ref[num]][1]);
            }
            // if pencil passed in is false, then draw number in cell without pencil
            else {
                $('#' + id).html(num_ref[ref[num]][0]);
                $('p', '#' + id).addClass('player');
            }
        }
        // if number passed in is 0, then empty the cell
        else {
            $('#' + id).html('');
        }

        // calls function to verify the board
        verifyBoard();
    }
}

/* =============================================== */
/* Util functions */
/* =============================================== */

/* End game function that toggles the end game modal */
function endGame() {
    reset();
    $('#win-modal').modal('show');
}

/* Update info function that re-draws the info pad with updated info */
function updateInfo() {
    $('#numUndo').text("Undo: " + game.undo);

    if (game.pencil) {
        $('#pencilOn').text("Pencil: On");
    } else {
        $('#pencilOn').text("Pencil: Off");
    }
}

/* Back-end link function that save move passed in for undo feature */
function saveMove(id, num, pencil) {
    $.get("/games/sudoku/save_move", {
        id: id,
        num: num,
        pencil: pencil
    });
}

/* Back-end link function that add move passed in to update back-end board */
function addMove(id, num) {
    $.get("/games/sudoku/add_move", {
        id: id,
        num: num
    });
}

/* Back-end link function that get the last move made by the player for undo feature */
$('#undo').click(() => {
    $.getJSON("/games/sudoku/get_move", {}, (data) => {
        undo(data['result'], data['num'], data['pencil']);
    });
});
