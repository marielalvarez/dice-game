# Non-Transitive Dice Game

In this game, the user and the computer pick dice, roll them, and see whose number is higher.

### Basics
- **Pick a Die:**
  - The computer selects a die at random.
  - The user chooses one from the remaining dice.

- **Deciding Who Starts:**
  - A random number (0 or 1) decides who goes first.
  - Guess the number to take the first move.

- **Rolling Dice:**
  - Both the user and the computer pick numbers between 0 and 5.
  - The sum of these numbers, modulo 6, determines the rolled face.

- **Winning a Round:**
  - The higher roll wins.
  - Ties don’t count for points.

## Running the Game

1. Start the game with your custom dice setup:
   ```bash
   node game.js <die1> <die2> <die3>
   ```
   Example:
   ```bash
   node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3
   ```

2. Follow the on-screen prompts to:
   - Guess who goes first.
   - Choose your die.
   - Pick numbers for the throws.

## Example Gameplay

```plaintext
Welcome to the Non-Transitive Dice Game!
In this game, you and the computer pick dice, and the one with the higher roll wins.

Let's determine who makes the first move.
HMAC: a6f5bc7d76d319e56aa52458b47a8c952449c066dcebe79742315fe8170c2331
Guess my number (0 or 1): 1
Computer Number: 1
Key: 4db40d35b560b5c0e828b661b71c36132de67bf6b38a938e7851168100dd6ea0
You go first!

Choose your dice:
0 - 2,2,4,4,9,9
1 - 6,8,1,1,8,6
2 - 7,5,3,7,5,3
Your choice: 1
You chose the dice: 6,8,1,1,8,6
I chose my dice: 7,5,3,7,5,3

It's time for the throws.
Your turn to throw first.
HMAC: af73319647e559ae66377cdb24352288f3f7e70bf495ba0905436c6836568b72
Add your number modulo 6 (0-5): 3
Computer Number: 5
Key: e863ea3fd77dd2a6a5488bb584c71488891ed083acd722030256a230def1c13e
Your roll is: 6

My turn to throw.
HMAC: fb73b5991d842c412478aee02793022e86d87ddd7b7824ce04fbb200087c55c4
Add your number modulo 6 (0-5): 2
Computer chose number: 5
Computer Number: 1
Key: 1391295e3e6df4a2c98aa42573df4b3689dd8336a2ac4fb38b9df19b256d6db1
My roll is: 5
You win (6 > 5)!
```

## Features
- A fair randomization system with HMAC for complete transparency.
- Interactive gameplay where your choices really matter.
