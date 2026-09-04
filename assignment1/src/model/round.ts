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
     * TODO ADD DESCRIPTION
     */
    play(cardIndex: number, namedColor?: Color): Card

    /**
     * TODO ADD DESCRIPTION
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
     * TODO ADD DESCRIPTION
     */
    draw(): Card

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
    private readonly _shuffler: Shuffler<Card>

    private _drawPileDeck: Deck
    private _discardPileDeck: Deck

    private _activeCardColor: Color[] = []
    private _activePlayer: Player
    private _playPassDirection: 'LEFT' | 'RIGHT' = 'LEFT'

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

        // Game Rule: Give the players their cards. Leftover cards go to the Draw Pile:
        this._drawPileDeck = this.initializePlayerHands(new DeckImpl(), cardsPerPlayer)

        // Game Rule: Move the top card to the discard pile to finish setting up the game:
        const card: Card | undefined = this.drawPile()?.deal()

        // Game Rule: If the top card of the Discard Pile is a Wild or Wild Draw 4, return it to the Draw Pile and pick another card.
        // TODO: RULE NOT IMPLEMENTED YET

        if (card !== undefined && 'color' in card) {
            this._discardPileDeck = new DeckImpl([card])
            this._activeCardColor.push(card.color)
        } else {
            throw new Error("Was unable to deal card from draw pile. Round can not begin")
        }

        // Game Rule: Player to the left of the dealer starts:
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

        // Game Rule: Remove card from hand
        this._activePlayer.hand.removeCard(playedCard)

        // Game Rule: Place card on top of Discard pile
        this._discardPileDeck.push(playedCard)

        // Game Rule: On REVERSE CARD -> The play direction reverses
        // TODO: RULE NOT IMPLEMENTED YET

        // Game Rule: On REVERSE CARD -> If only 2 players, the next player is just skipped instead
        // TODO: RULE NOT IMPLEMENTED YET

        // Game Rule: Turn moves to the next player
        this.nextPlayer()

        return playedCard

        //TODO: namedColor NOT IMPLEMENTED
        //return undefined;
    }

    playerInTurn(): number {
        return this._activePlayer.playerId;
    }

    canPlay(cardIndex: number): boolean {
        const card: Card = this._activePlayer.hand.cards[cardIndex]

        let sameColor: boolean = false
        let sameType: boolean = false
        let sameNumber: boolean = false

        switch (card.type) {
            // TODO: Consider generalizing these "rules", perhaps in own class - or at least as private generic methods
            case 'DRAW':
                sameColor = card.color in this._activeCardColor
                sameType = this._discardPileDeck.top()?.type === 'DRAW'
                return sameColor || sameType

            case 'NUMBERED':
                sameColor = card.color in this._activeCardColor
                const topCard: Card = this._discardPileDeck.top()
                if(topCard.type === 'NUMBERED')
                    sameNumber = topCard.number === card.number
                return sameColor || sameNumber

            case 'REVERSE':
            case 'SKIP':
                sameColor = card.color in this._activeCardColor
                return sameColor

            case 'WILD':
            case 'WILD DRAW':
                return true

            default:
                return false
        }
    }

    canPlayAny(): boolean {
        //TODO: NOT IMPLEMENTED
        return false;
    }

    draw(): Card {
        //TODO: NOT IMPLEMENTED
        return undefined;
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
        console.debug(`Initialized player ${player.playerName}'s hand with ${player.hand.cards.length} cards`)
        return dealerDeck
    }

    /**
     * Passes the turn to the next player
     */
    private nextPlayer(): void {
        if(this._playPassDirection === 'LEFT') {
            this._activePlayer = this._players[(this._activePlayer.playerId + 1) % this._players.length]
        } else {
            this._activePlayer = this._players[(this._activePlayer.playerId - 1) % this._players.length]
        }
    }
}
