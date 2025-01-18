const crypto = require('crypto');
const Table = require('cli-table3');

// generates secure random numbers and computes HMAC.
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

// represents a die and handles rolling.
class Dice {
    constructor(faces) {
        this.faces = faces.map(Number);
    }

    roll(index) {
        return this.faces[index];
    }
}

// validates and parses command-line arguments.
class InputParser {
    static parseDice(args) {
        if (args.length < 3) {
            throw new Error("At least 3 dice are required.");
        }

        return args.map(arg => {
            const faces = arg.split(',').map(Number);
            if (faces.length !== 6 || faces.some(isNaN)) {
                throw new Error(`Invalid dice: "${arg}". Each die must have 6 integers separated by commas.`);
            }
            return new Dice(faces);
        });
    }
}

// displays fairness (hmac & key)
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

// computes win probabilities for dice pairs.
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
            table.push([dice[i].faces.join(','), ...row.map((p, j) => (i === j ? `- (${p})` : p))]);
        });

        console.log("Probability of the win for the user:");
        console.log(table.toString());
    }
}

// game logic
class Game {
    constructor(dice) {
        this.dice = dice;
    }

    displayHelp() {
        console.log("\nWelcome to the Non-Transitive Dice Game!");
        console.log("In this game, you and the computer pick dice, and the one with the higher roll wins.");
        console.log("The probabilities of each die beating another are shown in the table below.\n");

        const probabilities = ProbabilityCalculator.calculate(this.dice);
        ProbabilityCalculator.renderTable(this.dice, probabilities);
    }

    playRound() {
        console.log("\nLet's determine who makes the first move.");
        const fairRandom = new FairRandom(2);
        fairRandom.displayHMAC();

        const userGuess = promptUser("Guess my number (0 or 1): ", [0, 1, 'X']);
        if (userGuess === 'X') {
            console.log("Exiting the game. Goodbye!");
            process.exit(0);
        }

        const computerChoice = fairRandom.calculateResult(Number(userGuess));
        fairRandom.revealKey();
        console.log(computerChoice === 0 ? "You go first!" : "I go first!");

        this.performThrows();
    }

    performThrows() {
        console.log("\nChoose your dice:");
        this.dice.forEach((die, index) => console.log(`${index} - ${die.faces.join(',')}`));
        const userDiceIndex = promptUser("Your choice: ", this.dice.map((_, i) => i));
        const userDice = this.dice[userDiceIndex];

        const fairRandom = new FairRandom(6);
        fairRandom.displayHMAC();

        const userRollIndex = promptUser("Add your number modulo 6: ", [0, 1, 2, 3, 4, 5]);
        const resultIndex = fairRandom.calculateResult(Number(userRollIndex));
        fairRandom.revealKey();

        const computerRoll = fairRandom.calculateResult(fairRandom.computerNumber);
        console.log(`Your roll: ${userDice.roll(resultIndex)}`);
        console.log(`Computer roll: ${this.dice[0].roll(computerRoll)}`);
    }
}



function promptUser(prompt, validInputs) {
    const readline = require('readline-sync');
    let input;
    do {
        input = readline.question(prompt).toUpperCase();
    } while (!validInputs.includes(input));
    return input;
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
