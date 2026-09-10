import { Player, PlayerImpl } from "./player";
import { Card, Color, Deck, hasColor } from "./deck";
import { Shuffler } from "../utils/random_utils";
import { DeckImpl } from "./deck.impl";
import { Round } from "./round";
import { PlayerHand } from "./playerHand";
import { RoundMemento } from "./round.memento";

export class RoundImpl implements Round {
    private readonly _players: Player[] = []
    private readonly _dealer: Player

    private _drawPileDeck: Deck
    private _discardPileDeck: Deck
    private readonly _shuffler: Shuffler<Card>

    private _activeCardColor: Color
    private _activePlayer: Player

    private _playPassDirection: 'counterclockwise' | 'clockwise' = 'clockwise'
    private _noOfCardsPlayerMustDraw: number = 1        // Determines how many cards a player must draw, if they can not legally play any of their cards on their turn
    private _skipNextPlayer: boolean = false            // Determines whether to skip next player, or not.

    private _endCallbacks: ((event: { winner: number}) => void)[] = []

    /**
     * Constructs a new Round object, prepared with the initial round game logic setup. Ready to start the Round.
     * @param playerNames A list of player names
     * @param dealer Which of the playerNames should be the _dealer. Provide the index position of the _dealer based on the list of provided playerNames.
     * @param shuffler The shuffler to use, when shuffling cards
     * @param cardsPerPlayer How many cards each player should start the game with.
     * @param initializeFreshRound Set this to TRUE, to automatically set up the new round ready to play from turn 1. Set FALSE to skip setup, in which case manual round setup must be performed.
     */
    constructor(playerNames: string[], dealer: number, shuffler: Shuffler<Card>, cardsPerPlayer: number, initializeFreshRound: boolean = true) {
        // Game Rule: Rounds in UNO must be played by between 2 and 10 players.
        if(playerNames.length > 10 || playerNames.length < 2)
            throw new Error(`A round must be played by between 2 to 10 players. Round was attempted to be played with ${playerNames.length} players`)

        this.initializePlayers(playerNames)
        this._dealer = this._players[dealer]
        this._activePlayer = this._dealer
        this._shuffler = shuffler

        if (!initializeFreshRound) {
            // Round state must be supplied externally, so here we just instantiate internal state parameters.
            this._drawPileDeck = new DeckImpl([])
            this._discardPileDeck = new DeckImpl([])
            this._activeCardColor = 'BLUE'
            return
        }

        // Game Rule: Shuffle the deck before dealing:
        const newDeck: Deck = new DeckImpl()
        newDeck.shuffle(shuffler)

        // Game Rule: Give the players their cards. Leftover cards go to the Draw Pile:
        this._drawPileDeck = this.initializePlayerHands(newDeck, cardsPerPlayer)

        // Game Rule: If the top card of the Discard Pile is a Wild or Wild Draw 4, return it to the Draw Pile and pick another card.
        let card: Card | undefined = this._drawPileDeck.deal()
        let attempts: number = 0
        while (card !== undefined && (card.type === 'WILD' || card.type === 'WILD DRAW')){
            if(++attempts > 500)
                throw new Error("Initializing Round failed. Could not find a non-wild card for the discard pile")
            this._drawPileDeck.push(card)
            this._drawPileDeck.shuffle(shuffler)

            // Game Rule: Move the top card to the discard pile to finish setting up the game:
            card = this._drawPileDeck.deal()
        }

        if (card !== undefined && 'color' in card) {
            this._discardPileDeck = new DeckImpl([card])
            this._activeCardColor = card.color
        } else {
            throw new Error("Unable to deal card from draw pile. Round can not begin")
        }

        // Apply any effects of the initial discard card:
        switch (card.type) {
            case 'REVERSE':
                this.togglePlayDirection()
                break

            case 'SKIP':
                this._skipNextPlayer = true
                break

            case 'DRAW':
                this._noOfCardsPlayerMustDraw = 2
                this._skipNextPlayer = true
                break
        }
        this.nextPlayer()
    }

    get playerCount(): number {
        return this._players.length
    }

    player(playerId: number): string | undefined {
        if(playerId < 0 || playerId >= this.playerCount)
            throw new Error("Provided PlayerId is outside of index bounds.")

        const player : Player | undefined  = this._players.find(p => p.playerId === playerId)

        if (player !== undefined)
            return player.playerName

        return undefined
    }

    playerHand(playerId: number): Card[] {
        const player : Player | undefined  = this._players.find(p => p.playerId === playerId)
        return player ? player.hand.cards : []
    }

    discardPile(): Deck {
        return this._discardPileDeck
    }

    drawPile(): Deck {
        return this._drawPileDeck
    }

    play(cardIndex: number, namedColor?: Color): Card {
        // Game Rule: Cannot play if round has already ended
        if(this.hasEnded())
            throw new Error(`Cannot play. Round has already ended. Winner is: ${this._players.at(this.winner()!)?.playerName}`)

        const playedCard: Card = this._activePlayer.hand.cards[cardIndex]

        if('color' in playedCard) {
            // Game Rule: Player cannot name a color, when playing a colored card
            if(namedColor !== undefined)
                throw new Error(`Can't play. It is illegal to name color on a colored card.`)
        }

        if(this.playCard(playedCard, true, namedColor)) {
            // Game Rule: Place card on top of Discard pile
            this._discardPileDeck.push(playedCard)

            // Game Rule: Remove card from hand
            this._activePlayer.hand.removeCard(playedCard)

            // Game Rule: Turn moves to the next player
            this.nextPlayer()

            // Game Logic: Evaluate if round ended here, with a winner:
            const winner = this.winner()
            if( winner !== undefined) {
                this.endRound(winner)
            }

            return playedCard

        } else {
            throw new Error("Can't play card")
        }
    }

    playerInTurn(): number | undefined {
        if (this.hasEnded())
            return undefined

        return this._activePlayer.playerId;
    }

    canPlay(cardIndex: number): boolean {
        if(cardIndex > this._activePlayer.hand.cards.length-1 || cardIndex < 0)
            return false

        // Game Rule: Cannot play if the round has ended.
        if(this.hasEnded())
            return false

        const card: Card = this._activePlayer.hand.cards[cardIndex]
        return this.playCard(card, false)
    }

    canPlayAny(): boolean {
        for (let i = 0; i < this._activePlayer.hand.cards.length; i++) {
            if(this.canPlay(i))
                return true
        }
        return false;
    }

    draw(): void {
        // Game Rule: Cannot draw if round has already ended
        if(this.hasEnded())
            throw new Error(`Cannot draw. Round has already ended. Winner is: ${this._players.at(this.winner()!)?.playerName}`)

        // Game Rule: Cannot draw cards, if player already drew cards in this turn:
        if(this._activePlayer.hasDrawnCardInTurn)
            throw new Error(`Cannot draw. Player has already drawn cards in this turn. Current payer is is: ${this._activePlayer.playerName}`)

        // Game Rule: Players must play any playable cards. Draws can only be made if no playable card is on hand, or a special card forced the draw.
        if(this._noOfCardsPlayerMustDraw === 1 && this.canPlayAny()) {
            throw new Error("Cannot draw while holding a playable card")
        }

        this.drawCards()
    }

    private drawCards(): void {
        let cardsDrawn: number = 0;
        let lastDrawnCard: Card | undefined
        while(this._noOfCardsPlayerMustDraw > 0) {
            // Game Rule: If draw pile is empty, reshuffle discard pile, leaving the top card on the table, putting the rest into the draw pile.
            if(this._drawPileDeck.size === 0)
                this.redistributeDiscardPile()

            lastDrawnCard = this._drawPileDeck.deal()!
            this._activePlayer.hand.addCard(lastDrawnCard)
            this._noOfCardsPlayerMustDraw--
            cardsDrawn++
        }
        this._noOfCardsPlayerMustDraw = 1
        this._activePlayer.hasSaidUno = false // Resets 'UNO' declaration for this player, whenever new cards are drawn.

        // Game Rule: Replenish draw pile, if the last card we removed above, was the last card in the draw pile.
        if(this._drawPileDeck.size === 0)
            this.redistributeDiscardPile()

        //Game Rule: Player must immediately play a drawn card, if that card can legally be played:
        if(cardsDrawn === 1 && !this.playCard(lastDrawnCard!, false))
            this.nextPlayer()
        else
            this._activePlayer.hasDrawnCardInTurn = true
    }

    sayUno(playerId: number): void {
        // Game Rule: Cannot say 'UNO' if round has already ended
        if(this.hasEnded())
            throw new Error(`Cannot say UNO. Round has already ended. Winner is: ${this._players.at(this.winner()!)?.playerName}`)

        if(playerId < 0 || playerId >= this.playerCount)
            throw new Error("Invalid playerId.")

        // Game Rule: Cannot say 'UNO' if player has more than 2 cards on hand:
        if(this._players[playerId].hand.cards.length > 2)
            throw new Error(`Cannot say UNO when you have more than 2 cards on hand.`)

        console.log(`Whose turn is it? ${this._activePlayer.playerName}`)

        // Game Rule: Cannot say 'UNO' if next player has drawn cards, or has played his/her card:
        const step = this._playPassDirection === 'counterclockwise' ? -1 : 1
        const nextAfterPlayer: number = (playerId + step + this.playerCount) % this.playerCount
        const isOwnTurn: boolean = this._activePlayer.playerId === playerId
        const isNextInTurn: boolean = this._activePlayer.playerId === nextAfterPlayer

        if(!isOwnTurn && !isNextInTurn)
            throw new Error(`Cannot say UNO. It is not your turn`)

        if(isNextInTurn && this._activePlayer.hasDrawnCardInTurn)
            throw new Error(`Cannot say UNO. Next player has already drawn or played a card`)

        this._players[playerId].hasSaidUno = true
    }

    catchUnoFailure(players: { accuser: number; accused: number }): boolean {
        if(players.accuser < 0 || players.accuser >= this.playerCount)
            throw new Error("Invalid playerId for accuser.")

        if(players.accused < 0 || players.accused >= this.playerCount)
            throw new Error("Invalid playerId for accused.")

        // Game Rule: If next player has already played, a player cannot be caught for forgetting to say 'UNO'.
        const step = this._playPassDirection === 'counterclockwise' ? -1 : 1
        const nextAfterPlayer: number = (players.accused + step + this.playerCount) % this.playerCount
        const isNextInTurn: boolean = this._activePlayer.playerId === nextAfterPlayer

        if(!isNextInTurn)
            return false

        // Game Rule : If next player has already drawn, the previous player can no longer be caught.
        if(this._activePlayer.hasDrawnCardInTurn)
            return false

        const accusedPlayer: Player = this._players[players.accused]
        const accusingPlayer: Player = this._players[players.accuser]

        // Game Rule: If a player fails to announce 'UNO' while only having 1 card on hand (in their turn), they can be caught by the next player:
        if(!accusedPlayer.hasSaidUno && accusedPlayer.hand.cards.length === 1){
            // Game Rule: Accused player must draw 4 cards as punishment.
            this._activePlayer = accusedPlayer
            this._noOfCardsPlayerMustDraw = 4
            this.draw()
            this._activePlayer = accusingPlayer
            return true
        }

        return false;
    }

    hasEnded(): boolean {
        return this.winner() !== undefined;
    }

    onEnd(callback: (event: { winner: number }) => void): void {
        this._endCallbacks.push(callback)
    }

    private endRound(winner: number): void {
        for (const callback of this._endCallbacks)
            callback({ winner})
    }

    score(): number | undefined {
        // Game Logic: There can be no score before there is a winner and the round has ended
        if(!this.hasEnded())
            return undefined

        let score: number = 0

        for (const player of this._players) {
            for (const card of player.hand.cards) {
                switch(card.type){
                    case 'NUMBERED':
                        score += card.number
                        break
                    case 'REVERSE':
                    case "SKIP":
                    case 'DRAW':
                        score += 20
                        break
                    case 'WILD':
                    case 'WILD DRAW':
                        score += 50
                        break
                    default:
                        break
                }
            }
        }

        return score;
    }

    /**
     * The winner is the only player without any cards on hand.
     * @returns The playerId/index of the winning player in this Round.
     */
    winner(): number | undefined {
        const winner: Player[] = []

        for (const player of this._players) {
            if(player.hand.cards.length === 0) {
                winner.push(player)
            }
        }

        if(winner.length > 1) {
            throw new Error(`Illegal Round state. ${winner.length} winners found. There can only ever be 1 winner each Round`)
        } else if (winner.length === 0) {
            return undefined
        }

        return winner[0].playerId;
    }

    toMemento(): RoundMemento {
        return {
            players: this._players.map(p => p.playerName),
            hands: this._players.map(p => p.hand.cards.map(c => ({ ...c }))),
            drawPile: this._drawPileDeck.toMemento(),
            discardPile: [...this._discardPileDeck.toMemento()].reverse(), // Reversal here to satisfy memento to type conversion specifications as defined in the related unit tests...
            currentColor: this._activeCardColor,
            currentDirection: this._playPassDirection,
            dealer: this._dealer.playerId,
            playerInTurn: this._activePlayer.playerId
        }
    }

    get dealer(): number {
        return this._dealer.playerId;
    }

    modifyRoundState(playerHands?: PlayerHand[], drawPile?: Deck, discardPile?: Deck, currentColor?: Color, currentDirection?: 'clockwise' | 'counterclockwise', playerInTurn?: number): void {
        // Backup current round state before changes.
        const oldPlayers: Player[] = this._players
        const oldDrawPileDeck: Deck = this._drawPileDeck
        const oldDiscardPileDeck: Deck = this._discardPileDeck
        const oldActiveColor: Color = this._activeCardColor
        const oldPlayPassDirection: 'clockwise' | 'counterclockwise' = this._playPassDirection
        const oldActivePlayer: Player = this._activePlayer

        if(playerHands !== undefined) {
            // Game Rule: There can not be multiple empty hands. A Round can only have 1 winner, and winner is determined by the player with an empty hand.
            if(playerHands.filter(hand => hand.cards.length === 0).length > 1) {
                this.rollbackModifications(oldPlayers)
                throw new Error("Multiple empty hands found. Only 1 hand may be empty!")
            }

            for (let i = 0; i < this.playerCount; i++) {
                const playerName: string = this._players[i].playerName;
                const playerId: number = this._players[i].playerId;
                const hasSaidUno: boolean = this._players[i].hasSaidUno;
                const playerHand: PlayerHand = playerHands[i];
                this._players[i] = new PlayerImpl(playerId, playerName, playerHand, hasSaidUno)
            }
        }

        if(drawPile !== undefined) {
            this._drawPileDeck = drawPile;
        }

        if(discardPile !== undefined) {
            // Game Rule: Discard Pile may never be empty after Round has started.
            if(discardPile.size === 0) {
                this.rollbackModifications(oldPlayers, oldDrawPileDeck, oldDiscardPileDeck)
                throw new Error("Discard Pile must not be empty. Minimum 1 card must be present.")
            }
            this._discardPileDeck = discardPile;
        }

        if(currentColor !== undefined) {
            // Game Rule: Color must match top card of discard pile.
            if(!hasColor(this._discardPileDeck.top()!, currentColor) || this._discardPileDeck.top()!.type === 'WILD DRAW' || this._discardPileDeck.top()!.type === 'WILD'){
                this.rollbackModifications(oldPlayers, oldDrawPileDeck, oldDiscardPileDeck, oldActiveColor)
                throw new Error("The active color must match the top discard pile card's color - except if top card is WILD or WILD DRAW")
            }
            this._activeCardColor = currentColor;
        }

        if(currentDirection !== undefined) {
            this._playPassDirection = currentDirection
        }

        if(playerInTurn !== undefined) {
            // Game Rule: Active player must be one of the current players in this Round.
            if(playerInTurn >= this.playerCount) {
                this.rollbackModifications(oldPlayers, oldDrawPileDeck, oldDiscardPileDeck, oldActiveColor, oldPlayPassDirection, oldActivePlayer.playerId)
                throw new Error("Invalid active player. Active player must be one of the current players in this round.")
            }
            this._activePlayer = this._players[playerInTurn];
        }
    }

    private rollbackModifications(players?: Player[], drawPile?: Deck, discardPile?: Deck, currentColor?: Color, currentDirection?: 'clockwise' | 'counterclockwise', playerInTurn?: number): void {
        if(players !== undefined) {
            for (let i = 0; i < this.playerCount; i++) {
                this._players[i] = new PlayerImpl(
                    this._players[i].playerId,
                    this._players[i].playerName,
                    this._players[i].hand,
                    this._players[i].hasSaidUno)
            }
        }

        if(drawPile !== undefined)
            this._drawPileDeck = drawPile

        if(discardPile !== undefined)
            this._discardPileDeck = discardPile;

        if(currentColor !== undefined)
            this._activeCardColor = currentColor;

        if(currentDirection !== undefined)
            this._playPassDirection = currentDirection;

        if(playerInTurn !== undefined)
            this._activePlayer = this._players[playerInTurn];
    }

    /**
     * Initializes players. New players by default have empty hands.
     * @param playerNames Initializes a player pr. provided player name
     */
    private initializePlayers(playerNames: string[]): void {
        for (let i = 0; i < playerNames.length; i++) {
            const newPlayerId: number = i
            const newPlayerName: string = playerNames[i]
            this._players.push(new PlayerImpl(newPlayerId, newPlayerName))
        }
    }

    /**
     * Initializes the player hands and returns the remaining deck
     */
    private initializePlayerHands(freshCardDeck: Deck, cardsPerPlayer: number): Deck {
        let dealerDeck: Deck = freshCardDeck
        for (const player of this._players) {
            dealerDeck = this.initializeHand(dealerDeck, player, cardsPerPlayer)
        }
        return dealerDeck
    }

    /**
     * Initializes a single player's hand, returning the remaining Deck.
     */
    private initializeHand(dealerDeck: Deck, player: Player, cardsPerPlayer: number): Deck {
        for (let i: number = 0; i < cardsPerPlayer; i++) {
            const card: Card | undefined = dealerDeck.deal()

            if(card !== undefined) {
                player.hand.addCard(card)
                continue
            }

            throw new Error(`Not enough cards in Deck to initialize player ${player.playerName}'s hand`)
        }
        return dealerDeck
    }

    /**
     * Passes the turn to the next player
     */
    private nextPlayer(): void {
        if(this._playPassDirection === 'counterclockwise') {
            this._activePlayer = this._players[(this._activePlayer.playerId + this.playerCount - 1) % this.playerCount]
        } else {
            this._activePlayer = this._players[(this._activePlayer.playerId + this.playerCount + 1) % this.playerCount]
        }

        // Evaluate if the last player, played a card that skips or forfeits this players turn
        if(this._skipNextPlayer) {
            this._skipNextPlayer = false

            // Game Rule: Skipped player must draw cards, if last player played a DRAW 2 or WILD DRAW 4 card
            if(this._noOfCardsPlayerMustDraw > 1)
                this.drawCards()

            this.nextPlayer()
        } else {
            this._activePlayer.hasDrawnCardInTurn = false
        }
    }

    /**
     * Toggles the direction the play is going in. Can be either LEFT or RIGHT.
     */
    private togglePlayDirection(): void {
        if(this._playPassDirection === 'counterclockwise')
            this._playPassDirection = 'clockwise'
        else
            this._playPassDirection = 'counterclockwise'
    }

    /**
     * Moves all cards, except the top-most, from the discard pile into the draw pile and shuffles the draw pile.
     */
    private redistributeDiscardPile(): void {
        const topCard: Card = this.discardPile().top()!
        this._drawPileDeck = this._discardPileDeck?.filter(card => card !== topCard)
        this._discardPileDeck = new DeckImpl([topCard])
        this._drawPileDeck.shuffle(this._shuffler)
    }

    /**
     * Attempts to play the specified card, either just evaluating the legality of the play (if applySpecialEffects is False) or fully applying the effects of the played card onto the round (if applySpecialEffects is True)
     * @param card The card to attempt to play
     * @param applySpecialEffects True, if the round should be updated with the effects of playing this card. False, to only verify the legality of playing this card on the current rounds internal state.
     * @param namedColor The color named by the player. Signifies which color should be in effect when played with various special cards.
     * @returns True if the card either can be played, otherwise false.
     */
    private playCard(card: Card, applySpecialEffects: boolean, namedColor?: Color): boolean {
        let sameColor: boolean = false
        let sameType: boolean = false
        let sameNumber: boolean = false

        switch (card.type) {
            // Game Rule: DRAW cards are legal to play on top of another card with the same color, or of the same type
            case 'DRAW':
                sameColor = card.color === this._activeCardColor
                sameType = this._discardPileDeck.top()?.type === 'DRAW'

                // Apply Special Card effects
                if(applySpecialEffects && (sameColor || sameType)) {
                    // Game Rule: Next player must draw +2 cards and forfeit their turn
                    this._noOfCardsPlayerMustDraw = 2
                    this._skipNextPlayer = true

                    // Game Rule: Played cards color determines which color next cards must have:
                    this._activeCardColor = card.color
                }
                return sameColor || sameType

            // Game Rule: NUMBERED cards are legal to play on top of another card with the same color, or a card with the same number
            case 'NUMBERED':
                sameColor = card.color === this._activeCardColor
                const topCard: Card = this._discardPileDeck.top()!

                if(topCard.type === 'NUMBERED')
                    sameNumber = topCard.number === card.number

                // Apply Special Card effects:
                if(applySpecialEffects && (sameColor || sameNumber)) {
                    // Game Rule: Played cards color determines which color next cards must have:
                    this._activeCardColor = card.color
                }
                return sameColor || sameNumber

            // Game Rule: REVERSE cards are legal to play on top of another card with the same color or type
            case 'REVERSE':
                sameColor = card.color === this._activeCardColor
                sameType = this._discardPileDeck.top()?.type === 'REVERSE'

                // Apply Special Card effects
                if(applySpecialEffects && sameColor) {
                    // Game Rule: Reverses the direction of play, when more than 2 players:
                    if(this.playerCount > 2) {
                        this.togglePlayDirection();
                    } else {
                        // Game Rule: Skip the next player, if there are only 2 players.
                        this._skipNextPlayer = true
                    }

                    // Game Rule: Played cards color determines which color next cards must have:
                    this._activeCardColor = card.color
                }
                return sameColor || sameType

            // Game Rule: SKIP cards are legal to play on top of another card with the same color or type
            case 'SKIP':
                sameColor = card.color === this._activeCardColor
                sameType = this._discardPileDeck.top()?.type === 'SKIP'

                // Apply Special Card effects
                if(applySpecialEffects && (sameColor || sameType)) {
                    // Game Rule: Skips the next player
                    this._skipNextPlayer = true

                    // Game Rule: Played cards color determines which color next cards must have:
                    this._activeCardColor = card.color
                }
                return sameColor || sameType

            // Game Rule: WILD cards are legal to play, if a color was named by the player
            case 'WILD':
                if(applySpecialEffects) {
                    if(namedColor === undefined)
                        throw new Error("Cannot play a WILD card without naming a color")

                    // Game Rule: Named color determines which color next cards must have:
                    this._activeCardColor = namedColor
                }
                return true

            // Game Rule: WILD DRAW 4 card can be played only if the player doesn't hold any cards
            // that match the color of the card previously played
            case 'WILD DRAW':
                let hasCardWithSameColorOnHand: boolean = false
                for (const card of this._activePlayer.hand.cards) {
                    if('color' in card && card.color === this._activeCardColor) {
                        hasCardWithSameColorOnHand = true
                    }
                }

                if(!hasCardWithSameColorOnHand && applySpecialEffects) {
                    if(namedColor === undefined)
                        throw new Error("Cannot play a WILD DRAW 4 card without naming a color")

                    // Game Rule: Named color determines which color next cards must have:
                    this._activeCardColor = namedColor

                    // Game Rule: If playing a WILD DRAW 4 card, the next player must draw +4 cards from the pile and forfeit his/her turn.
                    this._noOfCardsPlayerMustDraw = 4
                    this._skipNextPlayer = true
                }
                return !hasCardWithSameColorOnHand

            default:
                throw new Error("Invalid card selection")
        }
    }
}