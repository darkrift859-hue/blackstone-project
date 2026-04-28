document.addEventListener("DOMContentLoaded", () => {
    const playerHand = document.getElementById("playerHand")
    const computerHand = document.getElementById("computerHand")
    const cpuTable = document.getElementById("cpuTable")
    const dealerScoreTracker = document.getElementById("dealerScoreTracker")
    const playerScoreTracker = document.getElementById("playerScoreTracker")
    const statusText = document.getElementById("statusText")
    const chipDisplay = document.getElementById("chipDisplay")
    const currentBetDisplay = document.getElementById("currentBetDisplay")
    const shoeDisplay = document.getElementById("shoeDisplay")

    const stayBtn = document.getElementById("stayBtn")
    const hitBtn = document.getElementById("hitBtn")
    const foldBtn = document.getElementById("foldBtn")
    const callBtn = document.getElementById("callBtn")
    const startBtn = document.getElementById("startBtn")
    const cpuCountSelect = document.getElementById("cpuCountSelect")

    const betUp25Btn = document.getElementById("betUp25Btn")
    const betUp100Btn = document.getElementById("betUp100Btn")
    const betMaxBtn = document.getElementById("betMaxBtn")

    const suits = ["\u2660", "\u2665", "\u2666", "\u2663"]
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

    const BET_STEP = 25
    const BIG_BET_STEP = 100
    const DEFAULT_BET = 100
    const MIN_BET = 25

    let shoeCards = []
    let discardPile = []

    let playerScore = 0
    let computerScore = 0
    let playerChips = 10000
    let currentBet = DEFAULT_BET
    let tablePot = 0
    let roundActive = false
    let dealerHidden = true

    let playerCards = []
    let dealerCards = []
    let cpuSeats = []
    let revealCpuHands = false
    let playerFolded = false

    function updateChips() {
        chipDisplay.textContent = "Chips: " + playerChips
    }

    function updateBetDisplay() {
        currentBetDisplay.textContent = "Current Bet: " + currentBet
    }

    function updateShoeDisplay() {
        shoeDisplay.textContent =
            "Cards left: " + shoeCards.length + " | Discard pile: " + discardPile.length
    }

    function clampStartingBet(value) {
        if (playerChips <= 0) {
            return 0
        }

        if (playerChips < MIN_BET) {
            return playerChips
        }

        return Math.max(MIN_BET, Math.min(value, playerChips))
    }

    function adjustBet(amount) {
        if (!roundActive || amount <= 0 || playerChips <= 0) {
            return
        }

        const delta = Math.min(amount, playerChips)
        if (delta <= 0) {
            return
        }

        currentBet += delta
        playerChips -= delta
        tablePot += delta
        reactToPlayerBetIncrease(delta)
        updateBetDisplay()
        updateChips()
        renderCpuHands()
        updateScores()
    }

    function setBetToMax() {
        if (!roundActive || playerChips <= 0) {
            return
        }

        const delta = playerChips

        if (delta <= 0) {
            return
        }

        currentBet += delta
        playerChips -= delta
        tablePot += delta
        reactToPlayerBetIncrease(delta)
        updateBetDisplay()
        updateChips()
        renderCpuHands()
        updateScores()
    }

    function buildShoe(deckCount) {
        shoeCards = []

        for (let d = 0; d < deckCount; d++) {
            for (let i = 0; i < suits.length; i++) {
                for (let j = 0; j < values.length; j++) {
                    shoeCards.push({ suit: suits[i], value: values[j] })
                }
            }
        }
    }

    function shuffle(cards) {
        for (let i = cards.length - 1; i > 0; i--) {
            const rand = Math.floor(Math.random() * (i + 1))
            const temp = cards[i]
            cards[i] = cards[rand]
            cards[rand] = temp
        }
    }

    function refreshShoeIfNeeded() {
        if (shoeCards.length > 0) {
            return
        }

        if (discardPile.length > 0) {
            shoeCards = discardPile.splice(0)
            shuffle(shoeCards)
            statusText.textContent = "Shuffling the discard pile back into the shoe."
        } else {
            buildShoe(1)
            shuffle(shoeCards)
        }

        updateShoeDisplay()
    }

    function drawCard() {
        refreshShoeIfNeeded()
        return shoeCards.pop()
    }

    function cardValue(card) {
        if (card.value === "A") return 11
        if (card.value === "K" || card.value === "Q" || card.value === "J") return 10
        return parseInt(card.value, 10)
    }

    function countValue(card) {
        const value = card.value

        if (value === "A" || value === "10" || value === "J" || value === "Q" || value === "K") {
            return -1
        }

        const numeric = parseInt(value, 10)

        if (numeric >= 2 && numeric <= 6) {
            return 1
        }

        return 0
    }

    function estimateShoeCount() {
        const actualCount = shoeCards.reduce((sum, card) => sum + countValue(card), 0)
        const decksRemaining = Math.max(shoeCards.length / 52, 0.25)
        let estimate = actualCount / decksRemaining

        estimate += (Math.random() - 0.5) * 3

        if (Math.random() < 0.28) {
            estimate += (Math.random() - 0.5) * 6
        }

        return estimate
    }

    function handInfo(cards) {
        let score = 0
        let aces = 0

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i]

            if (card.value === "A") {
                score += 11
                aces++
            } else if (card.value === "K" || card.value === "Q" || card.value === "J") {
                score += 10
            } else {
                score += parseInt(card.value, 10)
            }
        }

        while (score > 21 && aces > 0) {
            score -= 10
            aces--
        }

        return {
            score,
            soft: aces > 0,
            blackjack: cards.length === 2 && score === 21
        }
    }

    function createCardElement(card, hidden) {
        const cardEl = document.createElement("div")
        cardEl.classList.add("card")

        const inner = document.createElement("div")
        inner.classList.add("card-inner")

        const front = document.createElement("div")
        front.classList.add("card-front")

        if (card.suit === "\u2665" || card.suit === "\u2666") {
            front.classList.add("red")
        }

        front.textContent = card.value + card.suit

        const back = document.createElement("div")
        back.classList.add("card-back")

        inner.appendChild(front)
        inner.appendChild(back)
        cardEl.appendChild(inner)

        if (!hidden) {
            setTimeout(() => {
                cardEl.classList.add("flipped")
            }, 80)
        }

        return cardEl
    }

    function updateFan(container) {
        const cards = container.querySelectorAll(".card")
        const spread = 20
        const spacing = 65

        for (let i = 0; i < cards.length; i++) {
            const offset = i - (cards.length - 1) / 2
            const rotation = offset * (spread / Math.max(cards.length, 1))
            const xOffset = offset * spacing

            cards[i].style.position = "absolute"
            cards[i].style.left = "50%"
            cards[i].style.transform =
                "translateX(" + xOffset + "px) rotate(" + rotation + "deg)"
        }
    }

    function renderHands() {
        playerHand.innerHTML = ""
        computerHand.innerHTML = ""

        for (let i = 0; i < playerCards.length; i++) {
            playerHand.appendChild(createCardElement(playerCards[i], false))
        }

        for (let i = 0; i < dealerCards.length; i++) {
            const hidden = dealerHidden && i > 0
            computerHand.appendChild(createCardElement(dealerCards[i], hidden))
        }

        updateFan(playerHand)
        updateFan(computerHand)
        updateShoeDisplay()
    }

    function updateScores() {
        const playerInfo = handInfo(playerCards)
        const dealerInfo = handInfo(dealerCards)

        playerScore = playerInfo.score
        computerScore = dealerInfo.score

        playerScoreTracker.textContent = "Player Score: " + playerScore
        dealerScoreTracker.textContent = dealerHidden ? "Dealer Score: ???" : "Dealer Score: " + computerScore

        for (let i = 0; i < cpuSeats.length; i++) {
            const seat = cpuSeats[i]
            const info = handInfo(seat.cards)
            seat.score = info.score

            const tracker = document.getElementById(seat.trackerId)
            if (tracker) {
                if (revealCpuHands) {
                    tracker.textContent =
                        seat.name +
                        " | Score: " +
                        info.score +
                        (seat.folded ? " | Folded" : "") +
                        " | Bet: " +
                        seat.bet +
                        " | Chips: " +
                        seat.chips
                } else {
                    tracker.textContent =
                        seat.name +
                        " | Bet: " +
                        seat.bet +
                        " | Chips: " +
                        seat.chips
                }
            }
        }
    }

    function renderCpuSeats() {
        cpuTable.innerHTML = ""

        cpuSeats.forEach((seat) => {
            const section = document.createElement("section")
            section.className = "cpu-seat"

            const title = document.createElement("h3")
            title.textContent = seat.name

            const tracker = document.createElement("div")
            tracker.id = seat.trackerId
            tracker.className = "cpu-tracker"
            tracker.textContent = seat.name + " | Bet: 0 | Chips: " + seat.chips

            const hand = document.createElement("div")
            hand.className = "hand cpu-hand"
            hand.id = seat.handId

            section.appendChild(title)
            section.appendChild(tracker)
            section.appendChild(hand)
            cpuTable.appendChild(section)
        })
    }

    function syncCpuSeats() {
        const count = parseInt(cpuCountSelect.value, 10) || 0
        const nextSeats = []

        for (let i = 0; i < count; i++) {
            const existing = cpuSeats[i]
            if (existing) {
                existing.folded = !!existing.folded
            }

            nextSeats.push(
                existing || {
                    name: "CPU " + (i + 1),
                    chips: 10000,
                    bet: 0,
                    cards: [],
                    score: 0,
                    folded: false,
                    handId: "cpuHand" + i,
                    trackerId: "cpuTracker" + i
                }
            )
        }

        cpuSeats = nextSeats
        renderCpuSeats()
    }

    function renderCpuHands() {
        cpuSeats.forEach((seat) => {
            const hand = document.getElementById(seat.handId)
            if (!hand) {
                return
            }

            hand.innerHTML = ""
            if (revealCpuHands) {
                seat.cards.forEach((card) => {
                    hand.appendChild(createCardElement(card, false))
                })
            } else {
                seat.cards.forEach(() => {
                    hand.appendChild(createCardElement({ suit: "", value: "?" }, true))
                })
            }

            updateFan(hand)
        })
    }

    function archiveRoundCards() {
        if (!playerCards.length && !dealerCards.length && cpuSeats.every((seat) => !seat.cards.length)) {
            return
        }

        discardPile.push(...playerCards)
        discardPile.push(...dealerCards)

        cpuSeats.forEach((seat) => {
            discardPile.push(...seat.cards)
        })

        playerCards = []
        dealerCards = []
        revealCpuHands = false
        playerFolded = false

        cpuSeats.forEach((seat) => {
            seat.cards = []
            seat.bet = 0
            seat.score = 0
            seat.folded = false
        })

        updateShoeDisplay()
    }

    function chooseCpuBet(seat) {
        const bankroll = seat.chips
        if (bankroll <= 0) {
            return 0
        }

        if (bankroll < MIN_BET) {
            return bankroll
        }

        const info = handInfo(seat.cards)
        const countEstimate = estimateShoeCount()
        const visiblePressure = Math.log10(getVisibleTableAmbition(seat) + 1)
        const handBias =
            info.blackjack ? 3.2 :
            info.score >= 20 ? 2.2 :
            info.score === 19 ? 1.8 :
            info.soft ? 0.8 :
            info.score <= 11 ? -0.8 :
            info.score <= 15 ? -0.25 : 0.15

        const edge = countEstimate * 0.4 + handBias + visiblePressure * 0.12
        const betPool = [25, 50, 75, 100, 150, 200, 250, 350, 500, 750, 1000]
        const cap = Math.max(MIN_BET, Math.min(bankroll, Math.round(bankroll * (0.12 + visiblePressure * 0.01))))
        const candidateBets = betPool.filter((bet) => bet <= cap)
        const lowBets = candidateBets.slice(0, Math.max(1, Math.floor(candidateBets.length / 3)))
        const midBets = candidateBets.slice(
            Math.max(0, Math.floor(candidateBets.length / 3) - 1),
            Math.max(1, Math.floor((candidateBets.length * 2) / 3))
        )
        const highBets = candidateBets.slice(Math.max(0, candidateBets.length - 3))
        const extremes = candidateBets.slice()

        let pool = lowBets

        if (edge > 1.75) {
            pool = Math.random() < 0.65 ? highBets : midBets
        } else if (edge > 0.5) {
            pool = Math.random() < 0.55 ? midBets : highBets
        } else if (edge > -0.5) {
            pool = Math.random() < 0.7 ? midBets : lowBets
        } else if (edge > -1.5) {
            pool = Math.random() < 0.8 ? lowBets : midBets
        }

        if (Math.random() < 0.18) {
            pool = extremes
        }

        if (!pool.length) {
            return bankroll
        }

        let pick = pool[Math.floor(Math.random() * pool.length)]

        if (Math.random() < 0.22) {
            const direction = Math.random() < 0.5 ? -1 : 1
            const shifted = pick + direction * 25
            pick = candidateBets.find((bet) => bet >= shifted) || pick
        }

        return Math.min(bankroll, Math.max(MIN_BET, pick))
    }

    function getVisibleTableAmbition(exceptSeat) {
        let total = currentBet

        cpuSeats.forEach((seat) => {
            if (seat !== exceptSeat && !seat.folded) {
                total += seat.bet
            }
        })

        return total
    }

    function getHighestCpuBet() {
        let highest = 0

        cpuSeats.forEach((seat) => {
            if (!seat.folded && seat.bet > highest) {
                highest = seat.bet
            }
        })

        return highest
    }

    function getPlayerCallAmount() {
        return Math.max(0, getHighestCpuBet() - currentBet)
    }

    function getCpuCallAmount(seat) {
        let highestOtherBet = currentBet

        cpuSeats.forEach((otherSeat) => {
            if (otherSeat !== seat && !otherSeat.folded && otherSeat.bet > highestOtherBet) {
                highestOtherBet = otherSeat.bet
            }
        })

        return Math.max(0, highestOtherBet - seat.bet)
    }

    function callPlayerBet() {
        if (!roundActive || playerChips <= 0) {
            return false
        }

        const delta = getPlayerCallAmount()
        if (delta <= 0) {
            return false
        }

        const amount = Math.min(delta, playerChips)
        currentBet += amount
        playerChips -= amount
        tablePot += amount

        updateBetDisplay()
        updateChips()
        renderCpuHands()
        updateScores()

        statusText.textContent = amount < delta
            ? "You call all-in."
            : "You call the pressure."

        return true
    }

    function estimateCpuFoldChance(seat, dealerUpcard) {
        const info = handInfo(seat.cards)
        if (info.score <= 11) {
            return 0
        }

        const shoePressure = estimateShoeCount()
        const tableAmbition = getVisibleTableAmbition(seat)
        const dealerHint = cardValue(dealerUpcard)

        let scoreBias = 0
        if (info.score <= 15) scoreBias = 0.55
        else if (info.score <= 17) scoreBias = 0.35
        else if (info.score <= 19) scoreBias = 0.05
        else scoreBias = -0.55

        if (info.soft) {
            scoreBias -= 0.15
        }

        let pressureBias = Math.log10(tableAmbition + 1) * 0.35
        let countBias = shoePressure < 0 ? Math.abs(shoePressure) * 0.18 : -shoePressure * 0.08
        let dealerBias = dealerHint >= 7 || dealerHint === 11 ? 0.12 : -0.06
        let noise = (Math.random() - 0.5) * 0.55

        const risk = scoreBias + pressureBias + countBias + dealerBias + noise
        return Math.min(0.9, Math.max(0.05, risk))
    }

    function foldCpuSeat(seat, reason, refundHalf) {
        if (seat.folded || seat.bet <= 0) {
            return false
        }

        const refund = refundHalf ? Math.floor(seat.bet / 2) : 0
        if (refund > 0) {
            seat.chips += refund
            tablePot -= refund
            seat.bet -= refund
        }
        seat.folded = true

        if (reason) {
            seat.foldReason = reason
        }

        updateChips()
        updateBetDisplay()
        return true
    }

    function bumpCpuBet(seat, info) {
        if (seat.chips <= 0) {
            return
        }

        const countEstimate = estimateShoeCount()
        const tablePressure = Math.log10(getVisibleTableAmbition(seat) + 1)
        const handBoost =
            info.blackjack ? 4 :
            info.score >= 20 ? 3 :
            info.score >= 18 ? 2 :
            info.soft ? 1.2 :
            info.score <= 11 ? -0.8 :
            info.score <= 15 ? -0.25 : 0.4

        const aggression = countEstimate * 0.3 + handBoost + tablePressure * 0.2
        let bump = 25

        if (aggression > 2.5) {
            bump = 250
        } else if (aggression > 1.5) {
            bump = 150
        } else if (aggression > 0.5) {
            bump = 100
        } else if (aggression > -0.5) {
            bump = 50
        } else if (aggression > -1.25) {
            bump = 25
        } else {
            bump = Math.random() < 0.6 ? 25 : 50
        }

        if (Math.random() < 0.22) {
            bump += 25
        }

        bump = Math.min(bump, seat.chips)
        seat.bet += bump
        seat.chips -= bump
        tablePot += bump
    }

    function callCpuSeat(seat) {
        if (seat.folded || seat.chips <= 0) {
            return 0
        }

        const needed = getCpuCallAmount(seat)
        if (needed <= 0) {
            return 0
        }

        const amount = Math.min(needed, seat.chips)
        seat.bet += amount
        seat.chips -= amount
        tablePot += amount
        return amount
    }

    function reactToPlayerBetIncrease(delta) {
        const dealerUpcard = dealerCards[0]

        cpuSeats.forEach((seat) => {
            reactCpuToRaise(seat, dealerUpcard, delta)
        })
    }

    function shouldCpuAggressivelyBet(seat, info, dealerUpcard) {
        const countEstimate = estimateShoeCount()
        const pressure = Math.log10(getVisibleTableAmbition(seat) + 1)
        const dealerValue = cardValue(dealerUpcard)
        let scoreBias = 0

        if (info.blackjack) scoreBias = 2.2
        else if (info.score >= 20) scoreBias = 1.8
        else if (info.score >= 18) scoreBias = 1.2
        else if (info.score >= 16) scoreBias = 0.8
        else if (info.score >= 13) scoreBias = 0.3
        else scoreBias = -0.9

        const dealerBias = dealerValue >= 7 || dealerValue === 11 ? 0.15 : -0.1
        const edge = countEstimate * 0.35 + scoreBias + pressure * 0.2 + dealerBias
        return {
            edge,
            raise: edge > 1.6,
            bigRaise: edge > 2.4,
            reckless: edge < -0.8
        }
    }

    function shouldCpuCall(seat, info, dealerUpcard) {
        const needed = getCpuCallAmount(seat)
        if (needed <= 0) {
            return false
        }

        const countEstimate = estimateShoeCount()
        const pressure = Math.log10(needed + getVisibleTableAmbition(seat) + 1)
        const dealerValue = cardValue(dealerUpcard)

        let scoreBias = 0
        if (info.blackjack) scoreBias = 2.5
        else if (info.score >= 20) scoreBias = 1.8
        else if (info.score >= 18) scoreBias = 1.15
        else if (info.score >= 16) scoreBias = 0.6
        else if (info.score >= 13) scoreBias = 0.15
        else scoreBias = -1.25

        if (info.soft) {
            scoreBias += 0.15
        }

        const dealerBias = dealerValue >= 7 || dealerValue === 11 ? -0.1 : 0.08
        const edge = countEstimate * 0.25 + scoreBias - pressure * 0.45 + dealerBias + (Math.random() - 0.5) * 0.6

        return edge > -0.15
    }

    function getCpuPressureContext(seat, dealerUpcard, delta) {
        const info = handInfo(seat.cards)
        const needed = getCpuCallAmount(seat)
        const visiblePressure = getVisibleTableAmbition(seat)
        const countEstimate = estimateShoeCount()
        const dealerValue = cardValue(dealerUpcard)

        const strength =
            info.blackjack ? 3.5 :
            info.score >= 20 ? 2.5 :
            info.score >= 18 ? 1.8 :
            info.score >= 16 ? 1.0 :
            info.score >= 13 ? 0.4 :
            info.score >= 10 ? -0.3 : -1.2

        const tableHeat = Math.log10(visiblePressure + delta + 1)
        const countEdge = countEstimate * 0.32
        const dealerTilt = dealerValue >= 7 || dealerValue === 11 ? -0.2 : 0.12
        const confidence = strength + countEdge + dealerTilt - tableHeat * 0.35 + (info.soft ? 0.12 : 0)
        const panic = tableHeat + Math.max(0, needed / 150) - countEdge

        return {
            info,
            needed,
            confidence,
            panic,
            countEstimate,
            dealerValue
        }
    }

    function reactCpuToRaise(seat, dealerUpcard, delta) {
        const context = getCpuPressureContext(seat, dealerUpcard, delta)
        const { info, needed, confidence, panic } = context

        if (seat.folded || seat.cards.length === 0 || seat.chips <= 0) {
            return
        }

        if (needed > 0) {
            if (panic > 1.6 && confidence < 0.1) {
                foldCpuSeat(seat, "pressure", false)
                return
            }

            callCpuSeat(seat)

            if (confidence > 1.35 && seat.chips > 0) {
                bumpCpuBet(seat, info)
            }

            if (confidence > 1.9 && seat.chips > 0 && Math.random() < 0.4) {
                bumpCpuBet(seat, info)
            }

            if (confidence > 0.35 && info.score <= 17 && Math.random() < 0.7) {
                seat.cards.push(drawCard())
            } else if (confidence > 1.45) {
                // strong hands often just stand after matching pressure
            } else if (info.score <= 12 && Math.random() < 0.85) {
                seat.cards.push(drawCard())
            } else if (confidence < -0.15 && panic > 1.2) {
                foldCpuSeat(seat, "pressure", false)
            }

            return
        }

        if (confidence < -0.35 && info.score <= 15) {
            if (Math.random() < 0.6) {
                foldCpuSeat(seat, "pressure", false)
                return
            }
        }

            if (confidence > 1.4) {
                bumpCpuBet(seat, info)
                if (confidence > 2.1 && seat.chips > 0) {
                    bumpCpuBet(seat, info)
                }
                if (info.score <= 17 && Math.random() < 0.75) {
                    seat.cards.push(drawCard())
                }
                return
            }

        if (info.score <= 11 || (info.score <= 16 && Math.random() < 0.8)) {
            seat.cards.push(drawCard())
            return
        }

        if (confidence > 0.45) {
            return
        }

        if (Math.random() < 0.45) {
            foldCpuSeat(seat, "hesitation", false)
            return
        }

        seat.cards.push(drawCard())
    }

    function reservePlayerBet() {
        currentBet = clampStartingBet(currentBet)
        playerChips -= currentBet
        tablePot += currentBet
    }

    function commitCpuBets() {
        cpuSeats.forEach((seat) => {
            seat.bet = chooseCpuBet(seat)
            seat.chips -= seat.bet
            tablePot += seat.bet
        })
    }

    function dealInitialHands() {
        playerCards.push(drawCard(), drawCard())
        dealerCards.push(drawCard(), drawCard())

        cpuSeats.forEach((seat) => {
            seat.cards.push(drawCard(), drawCard())
        })
    }

    function shouldDealerHit(info) {
        return info.score < 17 || (info.score === 17 && info.soft)
    }

    function shouldCpuHit(seat, dealerUpcard) {
        const info = handInfo(seat.cards)

        if (info.blackjack) {
            return false
        }

        if (info.score <= 11) {
            return true
        }

        if (info.soft && info.score <= 17) {
            return info.score < 18
        }

        const dealerValue = cardValue(dealerUpcard)

        if (info.score >= 17) {
            return false
        }

        if (info.score >= 13 && info.score <= 16) {
            return dealerValue >= 7 || dealerValue === 11
        }

        if (info.score === 12) {
            return !(dealerValue >= 4 && dealerValue <= 6)
        }

        return false
    }

    function playCpuHands() {
        const dealerUpcard = dealerCards[0]

        cpuSeats.forEach((seat) => {
            if (seat.folded) {
                return
            }

            let info = handInfo(seat.cards)

            while (!seat.folded && info.score < 22) {
                if (info.score <= 11) {
                    if (getCpuCallAmount(seat) > 0 && shouldCpuCall(seat, info, dealerUpcard)) {
                        callCpuSeat(seat)
                    }
                    seat.cards.push(drawCard())
                    info = handInfo(seat.cards)
                    continue
                }

                const foldChance = estimateCpuFoldChance(seat, dealerUpcard)
                const aggression = shouldCpuAggressivelyBet(seat, info, dealerUpcard)
                const needsCall = getCpuCallAmount(seat) > 0

                if (aggression.reckless && Math.random() < foldChance * 1.1) {
                    foldCpuSeat(seat, "pressure", false)
                    return
                }

                if (needsCall && shouldCpuCall(seat, info, dealerUpcard)) {
                    callCpuSeat(seat)
                }

                if (aggression.raise && seat.chips > 0) {
                    if (needsCall) {
                        callCpuSeat(seat)
                    }

                    bumpCpuBet(seat, info)
                    info = handInfo(seat.cards)
                    if (aggression.bigRaise && seat.chips > 0 && Math.random() < 0.35) {
                        bumpCpuBet(seat, info)
                    }
                }

                if (shouldCpuHit(seat, dealerUpcard)) {
                    seat.cards.push(drawCard())
                    info = handInfo(seat.cards)
                    continue
                }

                if (info.score <= 12) {
                    seat.cards.push(drawCard())
                    info = handInfo(seat.cards)
                    continue
                }

                if (info.score <= 16 && Math.random() < foldChance * 0.45) {
                    foldCpuSeat(seat, "mid-hand", false)
                }

                break
            }
        })
    }

    function playDealerHand() {
        dealerHidden = false
        let info = handInfo(dealerCards)

        while (shouldDealerHit(info)) {
            dealerCards.push(drawCard())
            info = handInfo(dealerCards)
        }
    }

    function payoutWin(bet, blackjack) {
        return blackjack ? Math.floor(bet * 2.5) : bet * 2
    }

    function seatBeatsDealer(info, dealerInfo) {
        if (info.score > 21) {
            return false
        }

        if (dealerInfo.score > 21) {
            return true
        }

        if (info.blackjack && !dealerInfo.blackjack) {
            return true
        }

        if (!info.blackjack && dealerInfo.blackjack) {
            return false
        }

        return info.score > dealerInfo.score
    }

    function handRank(info) {
        return (info.blackjack ? 100 : 0) + info.score
    }

    function payoutTablePot(winners) {
        if (!winners.length || tablePot <= 0) {
            return
        }

        const share = Math.floor(tablePot / winners.length)
        let remainder = tablePot - share * winners.length

        winners.forEach((seat) => {
            if (typeof seat.addChips === "function") {
                seat.addChips(share)
            } else {
                seat.chips += share
            }

            if (remainder > 0) {
                if (typeof seat.addChips === "function") {
                    seat.addChips(1)
                } else {
                    seat.chips += 1
                }
                remainder--
            }
        })
    }

    function resolveWinnerTexts(winners, dealerInfo) {
        if (!winners.length) {
            return ["Dealer takes the pot."]
        }

        const winnerNames = winners.map((seat) => seat.name)
        const baseText =
            winners.length === 1
                ? winnerNames[0] + " wins the pot of " + tablePot + "."
                : winnerNames.join(", ") + " split the pot of " + tablePot + "."

        const dealerText = dealerInfo.score > 21 ? "Dealer busts." : "Dealer stands on " + dealerInfo.score + "."
        return [baseText, dealerText]
    }

    function syncBetButtons() {
        const buttonsDisabled = !roundActive || playerChips <= 0
        betUp25Btn.disabled = buttonsDisabled
        betUp100Btn.disabled = buttonsDisabled
        betMaxBtn.disabled = buttonsDisabled
        foldBtn.disabled = buttonsDisabled || playerFolded
        callBtn.disabled = buttonsDisabled || getPlayerCallAmount() <= 0
    }

    function resolveRound() {
        if (!roundActive) {
            return
        }

        playCpuHands()
        playDealerHand()
        revealCpuHands = true

        const dealerInfo = handInfo(dealerCards)
        const contenders = [{
            name: "Player",
            cards: playerCards,
            folded: playerFolded,
            addChips(amount) {
                playerChips += amount
            }
        }].concat(
            cpuSeats.map((seat) => ({
                name: seat.name,
                cards: seat.cards,
                folded: seat.folded,
                addChips(amount) {
                    seat.chips += amount
                }
            }))
        )

        const rankedWinners = contenders
            .map((entry) => ({
                entry,
                info: handInfo(entry.cards)
            }))
            .filter(({ entry }) => !entry.folded)
            .filter(({ info }) => seatBeatsDealer(info, dealerInfo))
            .sort((a, b) => handRank(b.info) - handRank(a.info))

        const topRank = rankedWinners.length ? handRank(rankedWinners[0].info) : null
        const finalWinners = rankedWinners
            .filter(({ info }) => handRank(info) === topRank)
            .map(({ entry }) => entry)

        if (finalWinners.length) {
            payoutTablePot(finalWinners)
        }

        const messages = resolveWinnerTexts(finalWinners, dealerInfo)

        dealerHidden = false
        renderHands()
        renderCpuHands()
        updateScores()
        updateChips()
        updateBetDisplay()

        statusText.textContent = messages.join(" ")
        tablePot = 0
        roundActive = false
        hitBtn.disabled = true
        stayBtn.disabled = true
        startBtn.disabled = false
        syncBetButtons()
    }

    function startRound() {
        if (roundActive) {
            return
        }

        archiveRoundCards()

        if (playerChips <= 0) {
            statusText.textContent = "You're out of chips."
            return
        }

        syncCpuSeats()

        currentBet = clampStartingBet(DEFAULT_BET)
        dealerHidden = true
        revealCpuHands = false
        playerFolded = false
        roundActive = true
        tablePot = 0

        reservePlayerBet()
        dealInitialHands()
        commitCpuBets()

        renderHands()
        renderCpuHands()
        updateScores()
        updateChips()
        updateBetDisplay()
        updateShoeDisplay()

        statusText.textContent =
            "Your move. The dealer is showing " + dealerCards[0].value + dealerCards[0].suit + "."
        hitBtn.disabled = false
        stayBtn.disabled = false
        startBtn.disabled = true
        syncBetButtons()
    }

    function foldAction() {
        if (!roundActive || playerFolded || currentBet <= 0) {
            return
        }

        const refund = Math.floor(currentBet / 2)
        if (refund > 0) {
            playerChips += refund
            tablePot -= refund
            currentBet -= refund
        }

        playerFolded = true
        statusText.textContent = "You folded and recovered half your bet."
        updateChips()
        updateBetDisplay()
        syncBetButtons()
        resolveRound()
    }

    function callAction() {
        if (callPlayerBet()) {
            syncBetButtons()
        }
    }

    function hitAction() {
        if (!roundActive) {
            return
        }

        playerCards.push(drawCard())
        updateScores()
        renderHands()

        if (handInfo(playerCards).score > 21) {
            statusText.textContent = "Bust. The table finishes the hand."
            resolveRound()
        }
    }

    function stayAction() {
        if (!roundActive) {
            return
        }

        resolveRound()
    }

    betUp25Btn.addEventListener("click", () => {
        adjustBet(BET_STEP)
        syncBetButtons()
    })

    betUp100Btn.addEventListener("click", () => {
        adjustBet(BIG_BET_STEP)
        syncBetButtons()
    })

    betMaxBtn.addEventListener("click", () => {
        setBetToMax()
        syncBetButtons()
    })

    cpuCountSelect.addEventListener("change", () => {
        if (!roundActive) {
            syncCpuSeats()
        }
    })

    hitBtn.addEventListener("click", hitAction)
    callBtn.addEventListener("click", callAction)
    foldBtn.addEventListener("click", foldAction)
    stayBtn.addEventListener("click", stayAction)
    startBtn.addEventListener("click", startRound)

    buildShoe(1)
    shuffle(shoeCards)
    syncCpuSeats()
    updateChips()
    updateBetDisplay()
    updateShoeDisplay()
    syncBetButtons()
    hitBtn.disabled = true
    callBtn.disabled = true
    stayBtn.disabled = true
    foldBtn.disabled = true
    startBtn.disabled = false
    statusText.textContent = "Set your bet, then deal the hand. You can raise, call, or fold while playing."
})
