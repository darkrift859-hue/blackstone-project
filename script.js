//Disclaimer, I went through forums and documentation to find a decent chunk of the logic here, Stack Overflow is quite helpful
//Also, using var instead of let because funny
//So much of this had to be re-written to function correctly, only the god of JavaScript know how chaotic this got and how I even got this to function correctly. All I can say is Stack Overflow, Reddit, and YouTube are extremely valuable tools


// Link HTML elements within body to display game
const playerHand = document.getElementById("playerHand")
const computerHand = document.getElementById("computerHand")
const dealerScoreTracker = document.getElementById("dealerScoreTracker")
const playerScoreTracker = document.getElementById("playerScoreTracker")
const statusText = document.getElementById("statusText")

// Link buttons for deciding how to play
const stayBtn = document.getElementById("stayBtn")
const hitBtn = document.getElementById("hitBtn")
const startBtn = document.getElementById("startBtn")

// Bet input and tracking
const betInput = document.getElementById("betInput")
var currentBet = parseInt(betInput.value)

// Create gameplay variables
var playerScore = 0
var computerScore = 0
var playerChips = 10000
var dealerHidden = true
var playerCards = []
var dealerCards = []
var deckCards = []

// Card definitions
const suits = ["♠", "♥", "♦", "♣"]
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

// Update chips display
function updateChips() {
    var chipDisplay = document.getElementById("chipDisplay")
    if (chipDisplay) {
        chipDisplay.textContent = "Chips: " + playerChips
    }
}

betInput.addEventListener("input", function () {
    var val = parseInt(betInput.value)
    if (!isNaN(val) && val > 0) {
        currentBet = Math.min(val, playerChips) // Cannot bet more than you have
    } else {
        currentBet = 1
        betInput.value = "1"
    }
})

// Create deck of cards
function createDeck() {
    deckCards = []

    for (var i = 0; i < suits.length; i++) {
        for (var j = 0; j < values.length; j++) {
            deckCards.push({
                suit: suits[i],
                value: values[j]
            })
        }
    }
}

// Shuffle deck
function shuffleDeck() {
    for (var i = deckCards.length - 1; i > 0; i--) {
        var rand = Math.floor(Math.random() * (i + 1))
        var temp = deckCards[i]
        deckCards[i] = deckCards[rand]
        deckCards[rand] = temp
    }
}

// Draw a card from the deck
function drawCard() {
    return deckCards.pop()
}

// Calculate score for a hand
function calculateScore(cards) {
    var score = 0
    var aces = 0

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i]

        if (card.value === "A") {
            score += 11
            aces++
        }
        else if (["K", "Q", "J"].includes(card.value)) {
            score += 10
        }
        else {
            score += parseInt(card.value)
        }
    }

    while (score > 21 && aces > 0) {
        score -= 10
        aces--
    }

    return score
}

// Create a styled card element (supports flipping)
function createCardElement(card, hidden) {
    var cardEl = document.createElement("div")
    cardEl.classList.add("card")

    var inner = document.createElement("div")
    inner.classList.add("card-inner")

    var front = document.createElement("div")
    front.classList.add("card-front")

    // Red suits
    if (card.suit === "♥" || card.suit === "♦") {
        front.classList.add("red")
    }

    front.textContent = card.value + card.suit

    var back = document.createElement("div")
    back.classList.add("card-back")

    inner.appendChild(front)
    inner.appendChild(back)
    cardEl.appendChild(inner)

    if (!hidden) {
        setTimeout(function () {
            cardEl.classList.add("flipped")
        }, 50)
    }

    return cardEl
}

// Fan layout (curved hand)
function updateFan(container) {
    var cards = container.querySelectorAll(".card")

    var spread = 20        // controls rotation (angle)
    var spacing = 65       // controls horizontal spacing

    for (var i = 0; i < cards.length; i++) {
        var offset = i - (cards.length - 1) / 2

        var rotation = offset * (spread / cards.length)
        var xOffset = offset * spacing

        cards[i].style.position = "absolute"
        cards[i].style.left = "50%"
        cards[i].style.transform =
            "translateX(" + xOffset + "px) rotate(" + rotation + "deg)"
    }
}

// Render player and dealer hands
function renderHands() {
    playerHand.innerHTML = ""
    computerHand.innerHTML = ""

    // Player hand
    for (var i = 0; i < playerCards.length; i++) {
        playerHand.appendChild(createCardElement(playerCards[i], false))
    }

    // Dealer hand
    for (var i = 0; i < dealerCards.length; i++) {
        var hidden = dealerHidden
        computerHand.appendChild(createCardElement(dealerCards[i], hidden))
    }

    updateFan(playerHand)
    updateFan(computerHand)
}

// Update scores on UI
function updateScores() {
    playerScore = calculateScore(playerCards)
    computerScore = calculateScore(dealerCards)

    playerScoreTracker.textContent = "Player Score: " + playerScore

    // Show ??? if dealer's hand is hidden
    if (dealerHidden) {
        dealerScoreTracker.textContent = "Dealer Score: ???"
    } else {
        dealerScoreTracker.textContent = "Dealer Score: " + computerScore
    }

    determineWinner()
}

// Reveal dealer's hidden cards visually
function revealDealerHand() {
    var cards = computerHand.querySelectorAll(".card")
    cards.forEach(function (cardEl) {
        var inner = cardEl.querySelector(".card-inner")
        if (!cardEl.classList.contains("flipped")) {
            inner.classList.add("flipped")
        }
    })
}

// Dealer's turn logic
function dealerTurn() {
    dealerHidden = false
    computerScore = calculateScore(dealerCards)

    while (computerScore < 17) {
        dealerCards.push(drawCard())
        computerScore = calculateScore(dealerCards)
    }

    updateScores()
    renderHands()
    determineWinner()
}

// Determine winner and update chips
function determineWinner() {
    revealDealerHand()

    if (playerScore > 21) {
        statusText.textContent = "Bust! Dealer Wins!"
        playerChips -= currentBet
    }
    else if (computerScore > 21) {
        statusText.textContent = "Dealer Busts! You Win!"
        playerChips += currentBet * 2
    }
    else if (playerScore > computerScore) {
        statusText.textContent = "You Win!"
        playerChips += currentBet * 2
    }
    else if (playerScore < computerScore) {
        statusText.textContent = "Dealer Wins!"
        playerChips -= currentBet
    }
    else {
        statusText.textContent = "Push (Tie)"
        playerChips += currentBet // Return bet
    }

    updateChips()
    disableButtons()
}

// Disable buttons after game ends
function disableButtons() {
    hitBtn.disabled = true
    stayBtn.disabled = true
}

// Start a new game
function startGame() {
    if (playerChips <= 0) {
        statusText.textContent = "You're out of chips!"
        return
    }

    playerCards = []
    dealerCards = []
    dealerHidden = true

    createDeck()
    shuffleDeck()
    updateChips()

    // Deal initial cards
    playerCards.push(drawCard())
    playerCards.push(drawCard())
    dealerCards.push(drawCard())
    dealerCards.push(drawCard())

    updateScores()
    renderHands()

    statusText.textContent = "Your move!"
    hitBtn.disabled = false
    stayBtn.disabled = false

    updateChips()
}

// Hit button action
function hitAction() {
    playerCards.push(drawCard())
    updateScores()
    renderHands()
    checkGameOver()
}

// Stay button action
function stayAction() {
    dealerTurn()
}

// Update current bet display
function updateBetDisplay() {
    const display = document.getElementById("currentBetDisplay")
    display.textContent = "Current Bet: " + currentBet
}

betInput.addEventListener("input", updateBetDisplay)
updateBetDisplay()

// Attach button listeners
hitBtn.addEventListener("click", hitAction)
stayBtn.addEventListener("click", stayAction)
startBtn.addEventListener("click", startGame)

// Initialize game
updateChips()
startGame()