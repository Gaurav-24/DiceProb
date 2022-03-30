const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
let countPlayers, maxScore, playerData, turnOrder, totalScoreArray, exitPlayersCount;
let bonusSum = 8;
let bonusPoints = 4;

const setupPlayerCountAndMaxScore = () => {
    const args = process.argv.slice(2);
    countPlayers = parseInt(args[0]);
    maxScore = parseInt(args[1]);
}
const setup = () => {
    playerData = [];
    turnOrder = [];
    exitPlayersCount = 0;
    for (let index = 0; index < countPlayers; index++) {
        playerData[index] = {
            totalScore: 0,
            scores: [],
            turnAllowed: true,
            rank: -1,
            gameOver: false
        }
        turnOrder[index] = playerSelect(countPlayers, turnOrder);
        totalScoreArray = Array(countPlayers).fill(0);
    }
}

const rollDice = () => {
    return Math.floor((Math.random() * countPlayers) + 1);
};
//[0, 4, 3] ==> 3 1
const playerSelect = (countPlayers, turnOrder) => {
    let id = Math.floor(Math.random() * countPlayers);
    while (turnOrder.includes(id)) {
        id = (id + 1) % countPlayers;
    }
    return id;
};

const checkIfGameNotOver = (playerData, exitPlayersCount) => {
    return exitPlayersCount < playerData.length;
};

function checkRollDiceInput(question) {
    return new Promise((resolve) => {
        readline.question(`${question}:`, (input) => resolve(input));
    });
};

const deleteGameOverPlayersScore = (totalScoreArray) => {
    const res = totalScoreArray.reduce((currRes, currentVal) => {
        if (currentVal !== -1) {
            currRes.push(currentVal);
        }
        return currRes;
    }, []);
    return res;
};

const generateRank = (playerData, exitPlayersCount, currentPlayerIndex, totalScoreArray) => {
    let uniqScores = deleteGameOverPlayersScore(totalScoreArray);
    var sorted = uniqScores.sort(function (a, b) { return b - a });
    var uniqueSorted = new Map();
    let currIndex = 0;
    sorted.forEach((val) => {
        if (!uniqueSorted.has(val)) {
            uniqueSorted.set(val, currIndex++);
        }
    });
    playerData.forEach((el, index) => {
        if (!el.gameOver) {
            let r = uniqueSorted.get(el.totalScore) + 1 + exitPlayersCount;
            el.rank = r;
        } else {
            if (index == currentPlayerIndex) {
                el.rank = exitPlayersCount;
            }
        }
    });
};

const logResult = (playerData) => {
    var res = {};
    playerData.forEach((p, index) => {
        res[`Player ${index + 1}`] = {
            "Score": p.totalScore,
            "Rank": p.rank
        };
    });
    console.table(res);
};

const checkIfBonusApplicable = (currentPlayerData, totalScoreArray, currentPlayerIndex) => {
    let sum = currentPlayerData.scores.reduce((sum, curr) => {
        return sum + curr;
    }, 0);
    if (sum == bonusSum) {
        totalScoreArray[currentPlayerIndex] += bonusPoints;
        currentPlayerData.totalScore += bonusPoints;
    }
}

const startGame = async () => {
    setupPlayerCountAndMaxScore();
    while (!countPlayers) {
        console.log("Incorrect values for Player count");
        countPlayers = parseInt(await checkRollDiceInput("Enter player count"));
    }
    while (!maxScore) {
        console.log("Incorrect values for Max Score!!");
        maxScore = parseInt(await checkRollDiceInput("Enter Max Score"));
    }
    setup();
    while (checkIfGameNotOver(playerData, exitPlayersCount)) {
        let currentPlayerIndex = 0;
        while ((currentPlayerIndex < countPlayers) && checkIfGameNotOver(playerData, exitPlayersCount)) {
            const currentPlayerData = playerData[currentPlayerIndex];
            if (!currentPlayerData.gameOver) {
                console.log(`Player-${currentPlayerIndex + 1}'s Turn`);
                if (!currentPlayerData.turnAllowed) {
                    console.log(`Player-${currentPlayerIndex + 1} : Turn missed because of 2 consecutive 1s`);
                    currentPlayerData.turnAllowed = true;
                } else {
                    const checkForRollInstruction = await checkRollDiceInput("Enter r to roll Dice");
                    if (checkForRollInstruction != "r") {
                        continue;
                    }
                    const diceScore = rollDice();
                    console.log(`You got ${diceScore}`);
                    let prevScore = currentPlayerData.scores[currentPlayerData.scores.length - 1];
                    if (currentPlayerData.scores.length == 3) {
                        currentPlayerData.scores.shift();
                    }
                    currentPlayerData.scores.push(diceScore);
                    currentPlayerData.totalScore += diceScore;
                    totalScoreArray[currentPlayerIndex] += diceScore;

                    if (prevScore === 1 && diceScore === 1) {
                        currentPlayerData.turnAllowed = false;
                    }
                    checkIfBonusApplicable(currentPlayerData, totalScoreArray, currentPlayerIndex);
                    if (currentPlayerData.totalScore >= maxScore) {
                        currentPlayerData.turnAllowed = false;
                        currentPlayerData.gameOver = true;
                        exitPlayersCount++;
                        totalScoreArray[currentPlayerIndex] = -1;
                    }
                    generateRank(playerData, exitPlayersCount, currentPlayerIndex, totalScoreArray);
                    if (currentPlayerData.gameOver) {
                        console.log(`Game Over for Player-${currentPlayerIndex + 1} with Rank: ${currentPlayerData.rank}`);
                    } else {
                        if (diceScore === 6) {
                            console.log("Role Again");
                            continue;
                        }
                    }
                }
                logResult(playerData);
            }
            currentPlayerIndex++;
        }
    }
    console.log(`GAME OVER!!!`);
    process.exit(0);
};

setTimeout(() => {
    startGame();
}, 4000);
//6
//[0, 1, 2, [3], 4, 5] exit player = 5, total = 6
//0-> 1-> ,2-> , 3->, 4-> , 5->