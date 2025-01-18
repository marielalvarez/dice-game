const crypto = require('crypto');
const Table = require('cli-table3');

class RandomGenerator {
    static generateSecureRandom(range) {
        let rand;
        do {
            rand = crypto.randomBytes(1)[0];
        } while (rand >= 256 - (256 % range));
        return rand % range;
    }

    static generateHMAC(key, message) {
        return crypto.createHmac('sha3-256', key).update(message.toString()).digest('hex');
    }
}

class Dice {
    constructor(faces) {
        this.faces = faces.map(Number);
    }

    roll(index) {
        return this.faces[index];
    }
}

class InputParser {
    static parseDice(args) {
        if (args.length < 3) {
            throw new Error("At least 3 dice are required.");
        }

        return args.map(arg => {
            const faces = arg.split(',').map(Number);
            if (faces.length !== 6 || faces.some(isNaN)) {
                throw new Error(`Invalid dice: \"${arg}\". Each die must have 6 integers separated by commas.`);
            }
            return new Dice(faces);
        });
    }
}

class FairRandom {
    constructor(range) {
        this.range = range;
        this.key = crypto.randomBytes(32);
        this.computerNumber = RandomGenerator.generateSecureRandom(range);
        this.hmac = RandomGenerator.generateHMAC(this.key, this.computerNumber);
    }

    displayHMAC() {
        console.log(`HMAC: ${this.hmac}`);
    }

    calculateResult(userNumber) {
        return (this.computerNumber + userNumber) % this.range;
    }

    revealKey() {
        console.log(`Computer Number: ${this.computerNumber}`);
        console.log(`Key: ${this.key.toString('hex')}`);
    }
}

class ProbabilityCalculator {
    static calculate(dice) {
        const numDice = dice.length;
        const probabilities = Array.from({ length: numDice }, () => Array(numDice).fill(0));

        for (let i = 0; i < numDice; i++) {
            for (let j = 0; j < numDice; j++) {
                if (i === j) continue;

                let winCount = 0;
                let totalCount = 0;

                for (let faceA of dice[i].faces) {
                    for (let faceB of dice[j].faces) {
                        if (faceA > faceB) winCount++;
                        totalCount++;
                    }
                }

                probabilities[i][j] = (winCount / totalCount).toFixed(4);
            }
        }

        return probabilities;
    }

    static renderTable(dice, probabilities) {
        const table = new Table({
            head: ['User Dice \\ Computer Dice', ...dice.map(d => d.faces.join(','))],
        });

        probabilities.forEach((row, i) => {
            table.push([dice[i].faces.join(','), ...row.map((p, j) => (i === j ? `-` : p))]);
        });

        console.log("Probability of the win for the user:");
        console.log(table.toString());
    }
}

class Game {
    constructor(dice) {
        this.dice = dice;
        this.compFirst = false;
    }

    displayHelp() {
        console.log("\nWelcome to the Non-Transitive Dice Game!");
        console.log("In this game, you and the computer pick dice, and the one with the higher roll wins.");
        console.log("The probabilities of each die beating another are shown in the table below.\n");

        const probabilities = ProbabilityCalculator.calculate(this.dice);
        ProbabilityCalculator.renderTable(this.dice, probabilities);
    }

    determineFirstMove() {
        console.log("\nLet's determine who makes the first move.");
        const fairRandom = new FairRandom(2);
        fairRandom.displayHMAC();

        const userGuess = this.promptUser("Guess my number (0 or 1): ", [0, 1]);
        const computerChoice = fairRandom.computerNumber;
        fairRandom.revealKey();

        if (computerChoice === userGuess) {
            this.compFirst = false;
            console.log("You go first!");
        } else {
            this.compFirst = true;
            console.log("I go first!");
        }
    }

    promptUser(prompt, validInputs) {
        const readline = require('readline-sync');
        let input;
        do {
            input = readline.question(prompt);
            if (input === 'X') {
                console.log("Exiting the game. Goodbye!");
                process.exit(0);
            } else if (input === '?') {
                this.displayHelp();
            } else {
                input = parseInt(input);
            }
        } while (!validInputs.includes(input));
        return input;
    }

    playRound() {
        this.determineFirstMove();
        const availableDice = [...this.dice];

        if (this.compFirst) {
            const computerDiceIndex = RandomGenerator.generateSecureRandom(availableDice.length);
            const computerDice = availableDice.splice(computerDiceIndex, 1)[0];
            console.log(`I chose my dice: ${computerDice.faces.join(',')}`);

            console.log("\nChoose your dice:");
            availableDice.forEach((die, index) => console.log(`${index} - ${die.faces.join(',')}`));
            const userDiceIndex = this.promptUser("Your choice: ", availableDice.map((_, i) => i));
            const userDice = availableDice.splice(userDiceIndex, 1)[0];
            console.log(`You chose the dice: ${userDice.faces.join(',')}`);

            this.performThrows(computerDice, userDice, true);
        } else {
            console.log("\nChoose your dice:");
            availableDice.forEach((die, index) => console.log(`${index} - ${die.faces.join(',')}`));
            const userDiceIndex = this.promptUser("Your choice: ", availableDice.map((_, i) => i));
            const userDice = availableDice.splice(userDiceIndex, 1)[0];
            console.log(`You chose the dice: ${userDice.faces.join(',')}`);

            const computerDiceIndex = RandomGenerator.generateSecureRandom(availableDice.length);
            const computerDice = availableDice.splice(computerDiceIndex, 1)[0];
            console.log(`I chose my dice: ${computerDice.faces.join(',')}`);

            this.performThrows(userDice, computerDice, false);
        }
    }

    performThrows(firstDice, secondDice, firstPlayerIsComputer) {
        console.log("\nIt's time for the throws.");

        if (firstPlayerIsComputer) {
            console.log("I throw first.");
            const computerRoll = this.getThrowResult(firstDice, true);
            console.log("\nYour turn to throw.");
            const userRoll = this.getThrowResult(secondDice, false);
            this.compareRolls(userRoll, computerRoll);
        } else {
            console.log("Your turn to throw first.");
            const userRoll = this.getThrowResult(firstDice, false);
            console.log("\nMy turn to throw.");
            const computerRoll = this.getThrowResult(secondDice, true);
            this.compareRolls(userRoll, computerRoll);
        }
    }
    getThrowResult(dice, isComputer) {
        const fairRandom = new FairRandom(6);
        fairRandom.displayHMAC();
        const randomNumber = RandomGenerator.generateSecureRandom(6);
        const userNumber = isComputer
            ? randomNumber
            : this.promptUser("Add your number modulo 6 (0-5): ", [0, 1, 2, 3, 4, 5]);
        const rollIndex = fairRandom.calculateResult(randomNumber + userNumber);
        fairRandom.revealKey();
        const roll = dice.roll(rollIndex);
        console.log(`${isComputer ? "My" : "Your"} roll is: ${roll}`);
        return roll;
    }
    compareRolls(userRoll, computerRoll) {
        if (userRoll > computerRoll) {
            console.log(`You win (${userRoll} > ${computerRoll})!`);
        } else if (userRoll < computerRoll) {
            console.log(`I win (${computerRoll} > ${userRoll})!`);
        } else {
            console.log("It's a tie!");
        }
    }


}


try {
    const dice = InputParser.parseDice(process.argv.slice(2));
    const game = new Game(dice);

    console.log("\nType '?' for help or 'X' to exit.");
    game.displayHelp();
    game.playRound();
} catch (error) {
    console.error("Error:", error.message);
}
