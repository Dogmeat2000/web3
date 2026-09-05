import {Card, Color, Deck, DeckImpl} from "./deck";
import {Shuffler} from "../utils/random_utils";
import {Player, PlayerImpl} from "./player";

export interface Round {
    readonly playerCount: number

    /**
     * @param playerId The id of player to return.
     * @returns The name of the player with the provided id, or undefined if no player match is found.
     */
    player(playerId: number): string | undefined

    /**
     * Plays the card with the provided index position on the current players hand. If the player names a color, this is also applied - which is primarily used for the WILD cards.
     * @param cardIndex Index position of the card to play from the current players hand (array of cards)
     * @param namedColor Optional: The color the player is naming. Is required for WILD cards. Results in an error if provided with non-wild cards.
     * @returns The card that was played.
     */
    play(cardIndex: number, namedColor?: Color): Card

    /**
     * @param playerId The id of a player.
     * @returns The cards that are currently on the specified players' hand.
     */
    playerHand(playerId: number): Card[]

    /**
     * @return A copy of the discard pile deck
     */
    discardPile(): Deck

    /**
     * @return A copy of the draw pile deck
     */
    drawPile(): Deck

    /**
     * @return The playerId of the currently active player.
     */
    playerInTurn(): number

    /**
     * @param cardIndex index number for the card on the players hand to check play eligibility for.
     * @return True if the card on the specified index position in the currently active players hand can be played. Otherwise, returns False.
     */
    canPlay(cardIndex: number): boolean

    /**
     * @return True if any card on the currently active players hand can be played. Otherwise, returns False.
     */
    canPlayAny(): boolean

    /**
     * Draws one or more cards onto the currently active players hand. Resets the amount of cards the next player should draw to 1.
     * Amount of cards drawn depends on the aggregate number of draw cards played by previoys players.
     */
    draw(): void

    /**
     * TODO ADD DESCRIPTION
     */
    //catchUnoFailure({ number: number, accused: number }): void

    /**
     * TODO ADD DESCRIPTION
     */
    sayUno(playerId: number): void
}

export class RoundImpl implements Round {
    private readonly _players: Player[] = []
    private readonly _dealer: Player

    private _drawPileDeck: Deck
    private _discardPileDeck: Deck
    private readonly _shuffler: Shuffler<Card>

    private _activeCardColor: Color
    private _activePlayer: Player

    private _playPassDirection: 'LEFT' | 'RIGHT' = 'LEFT'
    private _noOfCardsPlayerMustDraw: number = 1        // Determines how many cards a player must draw, if they can not legally play any of their cards on their turn
    private _skipNextPlayer: boolean = false            // Determines whether to skip next player, or not.

    /**
     * Constructs a new Round object.
     * @param playerNames A list of player names
     * @param dealer Which of the playerNames should be the _dealer. Provide the index position of the _dealer based on the list of provided playerNames.
     * @param shuffler The shuffler to use, when shuffling cards
     * @param cardsPerPlayer How many cards each player should start the game with.
     */
    constructor(playerNames: string[], dealer: number, shuffler: Shuffler<Card>, cardsPerPlayer: number) {
        this.initializePlayers(playerNames)
        this._dealer = this._players[dealer]
        this._activePlayer = this._dealer
        this._shuffler = shuffler

        // Game Rule: Shuffle the deck before dealing:
        const newDeck: Deck = new DeckImpl()
        newDeck.shuffle(shuffler)

        // Game Rule: Give the players their cards. Leftover cards go to the Draw Pile:
        this._drawPileDeck = this.initializePlayerHands(newDeck, cardsPerPlayer)

        // Game Rule: Move the top card to the discard pile to finish setting up the game:
        let card: Card | undefined = this._drawPileDeck.deal()

        // Game Rule: If the top card of the Discard Pile is a Wild or Wild Draw 4, return it to the Draw Pile and pick another card.
        while (card !== undefined && (card.type === 'WILD' || card.type === 'WILD DRAW')){
            this._drawPileDeck.push(card)
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
        return this._discardPileDeck?.filter((): true => true);
    }

    drawPile(): Deck {
        return this._drawPileDeck?.filter((): true => true);
    }

    play(cardIndex: number, namedColor?: Color): Card {
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
        } else {
            throw new Error("Can't play card")
        }

        return playedCard
    }

    playerInTurn(): number {
        return this._activePlayer.playerId;
    }

    canPlay(cardIndex: number): boolean {
        if(cardIndex > this._activePlayer.hand.cards.length-1 || cardIndex < 0)
            return false

        const card: Card = this._activePlayer.hand.cards[cardIndex]
        return this.playCard(card, false)
    }

    canPlayAny(): boolean {
        for (const card of this._activePlayer.hand.cards) {
            if(this.playCard(card, false))
                return true
        }
        return false;
    }

    draw(): void {
        // Game Rule: Players must play any playable cards. Draws can only be made if no playable card is on hand, or a special card forced the draw.
        if(this._noOfCardsPlayerMustDraw === 1 && this.canPlayAny()) {
            throw new Error("Cannot draw while holding a playable card")
        }

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

        //Game Rule: Player must immediately play a drawn card, if that card can legally be played:
        if(cardsDrawn === 1 && !this.playCard(lastDrawnCard!, false))
            this.nextPlayer()
    }

    /*catchUnoFailure({accuser: number, accused}: { accuser: any; accused: any }): void {
        //TODO: NOT IMPLEMENTED
    }*/

    sayUno(playerId: number): void {
        //TODO: NOT IMPLEMENTED
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
        if(this._playPassDirection === 'LEFT') {
            this._activePlayer = this._players[(this._activePlayer.playerId + this._players.length + 1) % this._players.length]
        } else {
            this._activePlayer = this._players[(this._activePlayer.playerId + this._players.length - 1) % this._players.length]
        }

        // Evaluate if the last player, played a card that skips or forfeits this players turn
        if(this._skipNextPlayer) {
            this._skipNextPlayer = false

            // Game Rule: Skipped player must draw cards, if last player played a DRAW 2 or WILD DRAW 4 card
            if(this._noOfCardsPlayerMustDraw > 1)
                 this.draw()

            this.nextPlayer()
        }
    }

    /**
     * Toggles the direction the play is going in. Can be either LEFT or RIGHT.
     */
    private togglePlayDirection(): void {
        if(this._playPassDirection === 'LEFT')
            this._playPassDirection = 'RIGHT'
        else
            this._playPassDirection = 'LEFT'
    }

    /**
     * Moves all cards, except the top-most, from the discard pile into the draw pile and shuffles the draw pile.
     */
    private redistributeDiscardPile(): void {
        const topCard: Card = this.discardPile().top()
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
                const topCard: Card = this._discardPileDeck.top()

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
                    if(this._players.length > 2) {
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
