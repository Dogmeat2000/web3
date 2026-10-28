import {Shuffler } from "../utils/random_utils";
import { Player } from "./player";
import {Card, Color, shuffleCards, TypedCard} from "./deck";
import {createInitialDeck} from "../../__test__/utils/test_adapter";

export type Round = {
    readonly players: Player[],
    readonly dealer: Player,
    readonly drawPile: Card[],
    readonly discardPile: Card[],
    readonly shuffler: Shuffler<Card>,
    readonly activeCardColor: Color,
    readonly activePlayer?: Player,
    readonly playPassDirection: 'counterclockwise' | 'clockwise',
    readonly noOfCardsPlayerMustDraw: number,
    readonly skipNextPlayer: boolean,
    readonly endCallbacks?: ((event: { winner: number}) => void)[]
}

export function createRound(players: string[], dealer: number, shuffler: Shuffler<Card>, cardsPerPlayer: number, initializeFreshRound: boolean = true): Round {
    if(validPlayerCount(players)) {
        return initializeFreshRound ?
            initializeRoundFromEmpty(
                createEmptyRound(players, dealer, shuffler),
                cardsPerPlayer
            ) :
            createEmptyRound(players, dealer, shuffler)

    }
    throw new Error(`Invalid number of players specified. Specified ${players.length} players, expected players to be within 2 and 10 players.`)
}

/**
 * @param round Round to search for the player in.
 * @param playerId The id of player to return.
 * @returns The name of the player with the provided id, or undefined if no player match is found.
 */
export function getPlayerName(round: Round, playerId: number): string | undefined {
    return getPlayerObj(round, playerId)?.playerName
}

/**
 * Returns the player object containing information about this player, from within the specified Round.
 */
export function getPlayerObj(round: Round, playerId: number): Player | undefined {
    if(playerId < 0 || playerId >= round.players.length) {
        throw new Error("Provided PlayerId is outside of index bounds.")
    }
    return round.players.find(p => p.playerId === playerId)
}

/**
 * Plays the card with the provided index position on the active players hand. If the player names a color, this is also applied - which is primarily used for the WILD cards.
 * @param cardIndex Index position of the card to play from the current players hand (array of cards)
 * @param namedColor Optional: The color the player is naming. Is required for WILD cards. Results in an error if provided with non-wild cards.
 * @param round The Round to play
 * @returns A Round type containing the updated Round after playing the specified Card.
 */
export function play(cardIndex: number, round: Round, namedColor?: Color): Round {
    // Game Rule: Cannot play if round has already ended
    if(hasEnded(round)) {
        throw new Error(`Cannot play. Round has already ended. Winner is: ${checkForWinner(round)}`)
    }

    // Game Rule: Player cannot name a color, when playing a colored card
    if('color' in round.players[round.activePlayer!.playerId].hand[cardIndex]) {
        if(namedColor !== undefined) {
            throw new Error(`Can't play. It is illegal to name color on a colored card.`)
        }
    }

    if(canPlay(cardIndex, round)) {
        const roundWithAppliedCardEffects: Round = applyPlayedCardEffects(cardIndex, round, namedColor);
        const playedCard: Card = roundWithAppliedCardEffects.players[roundWithAppliedCardEffects.activePlayer!.playerId].hand[cardIndex]


        const playedRound: Round = {
            ...roundWithAppliedCardEffects,
            discardPile: [...roundWithAppliedCardEffects.discardPile, playedCard], // Game Rule: Place card on top of Discard pile
            activePlayer: {
                ...roundWithAppliedCardEffects.activePlayer!,
                hand: roundWithAppliedCardEffects.activePlayer!.hand.filter(card => card !== playedCard), // Game Rule: Remove card from hand
            },
            players: roundWithAppliedCardEffects.players.map(player => player.playerId === roundWithAppliedCardEffects.activePlayer!.playerId ?
                { ...player, hand: player.hand.filter(card => card !== playedCard)} : player) // Game Rule: Remove card from hand
        }

        // Game Rule: Turn moves to the next player after playing the card
        const nextRound: Round = advanceToNextPlayer(playedRound)

        // Game Rule: The round ends if the player has played their last card.
        return hasEnded(nextRound) ? { ...nextRound, activePlayer: undefined } : nextRound
    } else {
        throw new Error("Can't play card")
    }
}

/**
 * Returns the top card on the discard pile, from the provided Round.
 */
export function topOfDiscard(round: Round): Card {
    return round.discardPile.at(-1)!
}

/**
 * Checks that the card with the provided index on the active players hand in the provided round, can be played.
 */
export function canPlay(cardIndex: number, round: Round): boolean {
    if(cardIndex < 0 || cardIndex >= round.players.length || hasEnded(round)) {
        return false
    }
    return canPlayCard(round.players[round.activePlayer!.playerId].hand[cardIndex], round.players[round.activePlayer!.playerId].hand, topOfDiscard(round), round.activeCardColor)
}

/**
 * @param cardToPlay The Card to check play eligibility for.
 * @param playerHand The hand of the player who is attempting to play a card.
 * @param topCardFromDiscardPile The card to check play eligibility against.
 * @param activeColor The color that is currently active in the Round.
 * @return True if the card on the specified index position in the currently active players hand can be played. Otherwise, returns False.
 */
function canPlayCard(cardToPlay: Card, playerHand: Card[], topCardFromDiscardPile: Card, activeColor: Color): boolean {
    switch(cardToPlay.type){
        case 'NUMBERED':
            return canPlayNumberedCard(cardToPlay, topCardFromDiscardPile, activeColor)

        case 'SKIP':
            return canPlaySkipCard(cardToPlay, topCardFromDiscardPile, activeColor)

        case 'REVERSE':
            return canPlayReverseCard(cardToPlay, topCardFromDiscardPile, activeColor)

        case 'DRAW':
            return canPlayDrawCard(cardToPlay, topCardFromDiscardPile, activeColor)

        case 'WILD':
            return canPlayWildCard()

        case 'WILD DRAW':
            return canPlayWildDrawCard(playerHand, activeColor)

        default:
            throw new Error("Unexpected error. Invalid card. Cannot play.")
    }
}

/**
 * Plays the card at the specified index on the active players hand, applying the effect of the card. Returns the updated Round.
 * This function DOES NOT remove a played card from a players hand, or place it on the discard pile.
 */
function applyPlayedCardEffects(cardIndex: number, round: Round, namedColor?: Color): Round {
    if(!canPlay(cardIndex, round)) {
        throw new Error(`Cannot play card ${round.players[round.activePlayer!.playerId].hand[cardIndex]}.`)
    }

    const playedCard: Card = round.players[round.activePlayer!.playerId].hand[cardIndex]

    switch(playedCard.type){
        case 'NUMBERED':
            return {
                ...round,
                activeCardColor: playedCard.color // Game Rule: Played cards color determines which color next cards must have
            }

        case 'REVERSE':
            // Game Rule: Reverses the direction of play, when more than 2 players:
            if(round.players.length > 2) {
                return reversePlayDirection({
                    ...round,
                    activeCardColor: playedCard.color
                })
            } else {
                // Game Rule: Skip the next player, if there are only 2 players.
                return {
                    ...round,
                    activeCardColor: playedCard.color,
                    skipNextPlayer: true
                }
            }

        case 'SKIP':
            return {
                ...round,
                skipNextPlayer: true, // Game Rule: Skips the next player
                activeCardColor: playedCard.color // Game Rule: Played cards color determines which color next cards must have
            }

        case 'DRAW':
            return {
                ...round,
                noOfCardsPlayerMustDraw: 2, // Game Rule: Next player must draw +2 cards and forfeit their turn
                skipNextPlayer: true,
                activeCardColor: playedCard.color // Game Rule: Played cards color determines which color next cards must have
            }

        case 'WILD':
            if(namedColor === undefined) {
                throw new Error("Cannot play a WILD card without naming a color")
            } else {
                return {
                    ...round,
                    activeCardColor: namedColor // Game Rule: Named color determines which color next cards must have
                }
            }

        case 'WILD DRAW':
            if(namedColor === undefined) {
                throw new Error("Cannot play a WILD DRAW 4 card without naming a color")
            } else {
                return {
                    ...round,
                    activeCardColor: namedColor, // Game Rule: Named color determines which color next cards must have:
                    noOfCardsPlayerMustDraw: 4, // Game Rule: If playing a WILD DRAW 4 card, the next player must draw +4 cards from the pile and forfeit his/her turn.
                    skipNextPlayer: true
                }
            }

        default:
            throw new Error(`Cannot play card ${playedCard}.`)
    }
}

/**
 * Validates if the provided numbered card is valid to play against the provided discardPile card, when the specified color is active.
 */
function canPlayNumberedCard(numberedCard: TypedCard<'NUMBERED'>, discardPileCard: Card, activeColor: Color): boolean {
    // Game Rule: NUMBERED cards are legal to play on top of another card with the same color, or a card with the same number
    return numberedCard.color === activeColor || (discardPileCard.type === 'NUMBERED' && discardPileCard.number === numberedCard.number);
}

/**
 * Validates if the player is eligible to play a Wild Draw card, based on the current hand of the player and the currently active color.
 */
function canPlayWildDrawCard(playerHand: Card[], activeColor: Color): boolean {
    // Game Rule: WILD DRAW 4 card can be played only if the player doesn't hold any cards that match the color of the card previously played
    for(const card of playerHand) {
        if('color' in card && card.color === activeColor) {
            return false
        }
    }
    return true
}

/**
 * Validates if the player is eligible to play a Wild card.
 */
function canPlayWildCard(): boolean {
    // Game Rule: WILD cards are always legal to play, but remember that the player must name a color when actually playing the card
    return true
}

/**
 * Validates if a player is eligible to play the provided skip card, given the provided discard pile Card and active color.
 */
function canPlaySkipCard(skipCard: TypedCard<'SKIP'>, discardPileCard: Card, activeColor: Color): boolean {
    // Game Rule: SKIP cards are legal to play on top of another card with the same color or type
    return skipCard.type === discardPileCard.type || skipCard.color === activeColor;
}

/**
 * Validates if it is valid to play the provided draw card, given the provided discard pile Card and active color.
 */
function canPlayDrawCard(drawCard: TypedCard<'DRAW'>, discardPileCard: Card, activeColor: Color): boolean {
    // Game Rule: DRAW cards are legal to play on top of another card with the same color, or of the same type
    return drawCard.type === discardPileCard.type || drawCard.color === activeColor;
}

/**
 * Validates if it is valid to play the provided reverse card, given the provided discard pile Card and active color.
 */
function canPlayReverseCard(reverseCard: TypedCard<'REVERSE'>, discardPileCard: Card, activeColor: Color): boolean {
    // Game Rule: REVERSE cards are legal to play on top of another card with the same color or type
    return reverseCard.type === discardPileCard.type || reverseCard.color === activeColor;
}

/**
 * @return True if any card on the currently active players hand can be played. Otherwise, returns False.
 */
export function canPlayAny(round: Round): boolean {
    if(hasEnded(round)) {
        return false
    }

    for (let i = 0; i < round.players[round.activePlayer!.playerId].hand.length; i++) {
        if(canPlay(i, round)) {
            return true
        }
    }
    return false;
}

/**
 * Draws one or more cards onto the currently active players hand. Resets the amount of cards the next player should draw to 1.
 * Amount of cards drawn depends on the aggregate number of draw cards played by previous players.
 * Returns the updated Round.
 */
export function draw(round: Round): Round {
    // Game Rule: Cannot draw if round has already ended
    if(hasEnded(round)) {
        throw new Error(`Cannot draw. Round has already ended. Winner is: ${checkForWinner(round)}`)
    }

    // Game Rule: Cannot draw cards, if player already drew cards in this turn:
    if(round.activePlayer!.hasDrawnCardInTurn) {
        throw new Error(`Cannot draw. Player has already drawn cards in this turn. Current payer is: ${round.activePlayer!.playerName}`)
    }

    // Game Rule: Players must play any playable cards. Draws can only be made if no playable card is on hand, or a special card forced the draw.
    if(round.noOfCardsPlayerMustDraw === 1 && canPlayAny(round)) {
        throw new Error("Cannot draw while holding a playable card")
    }
    return drawCards(round.activePlayer!.playerId, round.noOfCardsPlayerMustDraw, round)
}

/**
 * Flags the specified player as having said 'UNO'
 * @param playerId playerID for the player that should be flagged.
 * @param round The round in which to attempt to say Uno.
 */
export function sayUno(playerId: number, round: Round): Round {
    // Game Rule: Players cannot say 'UNO' if round has already ended
    if(hasEnded(round)){
        throw new Error(`Cannot say UNO. Round has already ended. Winner is: ${checkForWinner(round)}`)
    }

    if(playerId < 0 || playerId >= round.players.length) {
        throw new Error("Invalid playerId.")
    }

    // Game Rule: Cannot say 'UNO' if player has more than 2 cards on hand:
    if(round.players[playerId].hand.length > 2) {
        throw new Error(`Cannot say UNO when you have more than 2 cards on hand.`)
    }

    // Game Rule: Cannot say 'UNO' if next player has drawn cards, or has played his/her card:
    const step = round.playPassDirection === 'counterclockwise' ? -1 : 1
    const nextAfterPlayer: number = (playerId + step + round.players.length) % round.players.length
    const isOwnTurn: boolean = round.activePlayer!.playerId === playerId
    const isNextInTurn: boolean = round.activePlayer!.playerId === nextAfterPlayer

    if(!isOwnTurn && !isNextInTurn){
        // Game Rule: Saying Uno outside of your turn, does nothing.
        return round
    }

    if(isNextInTurn && round.players[round.activePlayer!.playerId].hasDrawnCardInTurn) {
        throw new Error(`Cannot say UNO. Next player has already drawn or played a card`)
    }

    return {
        ...round,
        players: round.players.map((player: Player): Player => player.playerId !== playerId ? player : {
            ...player,
            hasSaidUno: true
        }),
    }
}

/**
 * Check if accused player failed to say UNO and applies punishment if caught by another player.
 * @param players An object containing the playerID's for the accuser and the accused.
 * @param round The round in which to attempt the Uno catch.
 * @returns The updated Round.
 */
export function catchUnoFailure(players: { accuser: number, accused: number }, round: Round): Round {
    if(!checkUnoFailure(players, round)) {
        return round
    }

    // Game Rule: Accused player must draw 4 cards as punishment.
    const accusedPlayerDrewRound: Round = drawCards(players.accused, 4, round)

    return {
        ...accusedPlayerDrewRound,
        noOfCardsPlayerMustDraw: round.noOfCardsPlayerMustDraw,
        players: accusedPlayerDrewRound.players.map((player: Player): Player => player.playerId !== players.accused ? player : {
            ...player,
            hasDrawnCardInTurn: false
        })
    }
}

/**
 * Checks if an accusation of failure to say Uno would succeed now, on the specified Round.
 * Returns true if the accused failed to say Uno in time. Otherwise, returns false if there is nothing to catch.
 */
export function checkUnoFailure(players: { accuser: number, accused: number }, round: Round): boolean {
    // Validation: player id's must be valid.
    if(players.accuser < 0 || players.accuser >= round.players.length)
        throw new Error("Invalid playerId for accuser.")

    if(players.accused < 0 || players.accused >= round.players.length)
        throw new Error("Invalid playerId for accused.")

    // Game Rule: If next player has already played, a player cannot be caught for forgetting to say 'UNO'.
    const step = round.playPassDirection === 'counterclockwise' ? -1 : 1
    const nextAfterPlayer: number = (players.accused + step + round.players.length) % round.players.length
    const isNextInTurn: boolean = round.activePlayer!.playerId === nextAfterPlayer

    if(!isNextInTurn) {
        return false
    }

    // Game Rule: If next player has already drawn, the previous player can no longer be caught.
    if(round.players[round.activePlayer!.playerId].hasDrawnCardInTurn) {
        return false
    }

    // Game Rule: If a player fails to announce 'UNO' while only having 1 card on hand (in their turn), they can be caught by another player:
    const accusedPlayer: Player = round.players[players.accused]
    return !accusedPlayer.hasSaidUno && accusedPlayer.hand.length === 1;
}

/**
 * @returns True if the specified round has ended. This is determined by the presence, or absence of a winner.
 */
export function hasEnded(round: Round): boolean {
    return checkForWinner(round) !== undefined;
}

/**
 * @returns The winning playerin this round, if any. Otherwise, undefined.
 */
export function checkForWinner(round: Round): Player | undefined {
    const winningPlayer: Player[] = round.players.filter(player => player.hand.length === 0)

    if(winningPlayer.length === 1){
        return winningPlayer[0]
    } else {
        return undefined
    }
}

/**
 * @returns The score that the winning player gained in this round. Undefined, if the round has not ended yet.
 */
export function score(round: Round): number | undefined {
    // Game Logic: There can be no score before there is a winner and the round has ended
    if(!hasEnded(round)){
        return undefined
    }

    return round.players.reduce(
        (totalScore, player) => totalScore + player.hand.reduce((scoreOnHand, card) => {
            switch(card.type){
                case 'NUMBERED':
                    return scoreOnHand + card.number
                case 'REVERSE':
                case "SKIP":
                case 'DRAW':
                    return scoreOnHand + 20
                case 'WILD':
                case 'WILD DRAW':
                    return scoreOnHand + 50
                default:
                    return scoreOnHand
            }}, 0),
        0)
}

/**
 * Callback function that publishes and event containing the winner, when the round ends.
 */
export function onEnd(callback: (event: { winner: number }) => void): void {
    //TODO
}

/**
 * Validates if the player count is between 2 and 10 players. Returns true if so, otherwise returns false.
 */
function validPlayerCount(players: string[]): boolean {
    // Game Rule: Rounds in UNO must be played by between 2 and 10 players.
    if(players.length > 10 || players.length < 2) {
        throw new Error(`A round must be played by between 2 to 10 players. Round was attempted to be played with ${players.length} players`)
    }

    return true
}

/**
 * Initializes new players based on the provided player names.
 */
function initializePlayers(players: string[]): Player[] {
    return players.map((name, index) => ({
        playerId: index,
        playerName: name,
        hand: [],
        hasSaidUno: false,
        hasDrawnCardInTurn: false
    }))
}

/**
 * Initializes each Player's hand for the players provided, taking cards from the provided fresh card Deck.
 * Returns the initialized Players with their hands and an array of cards that were not distributed to players.
 */
function initializePlayerHands(players: Player[], cardDeck: Card[], cardsPerPlayer: number): { players: Player[], remainingCards: Card[] } {
    if(players.length * cardsPerPlayer > cardDeck.length){
        throw new Error(`Not enough cards in Card Deck to initialize player hands.`)
    }

    return players.reduce(
        (acc, player) => {
            const dealt: Card[] = acc.remainingCards.slice(0, cardsPerPlayer)
            const remaining: Card[] = acc.remainingCards.slice(cardsPerPlayer)

            const updatedPlayer: Player = {
                ...player,
                hand: [...player.hand, ...dealt]
            }

            return {
                players: [...acc.players, updatedPlayer],
                remainingCards: remaining
            }
        },
        { players: [] as Player[], remainingCards: cardDeck}
    )
}

/**
 * Creates a barebones empty Round. Unspecified attributes of the Round are initialized as empty or undefined.
 */
function createEmptyRound(players: string[], dealer: number, shuffler: Shuffler<Card>): Round {
    const newPlayers: Player[] = initializePlayers(players)

    return {
        players: newPlayers,
        dealer: newPlayers[dealer],
        drawPile: [],
        discardPile: [],
        shuffler: shuffler,
        activeCardColor: 'BLUE',
        activePlayer: newPlayers[dealer],
        playPassDirection: 'clockwise',
        noOfCardsPlayerMustDraw: 1,
        skipNextPlayer: false
    }
}

/**
 * Initializes a Round from its empty version into clean fresh Round ready to begin playing with.
 */
function initializeRoundFromEmpty(emptyRound: Round, cardsPerPlayer: number ): Round {
    // Game Rule: Shuffle the deck before dealing:
    const newDeck: Card[] = shuffleCards(createInitialDeck(), emptyRound.shuffler)
    const { players: initializedPlayers, remainingCards: remainingDeck } = initializePlayerHands(emptyRound.players, newDeck, cardsPerPlayer)

    const { startingCard, remainingDeck: drawPile } = pickStartingCard(remainingDeck, emptyRound.shuffler)

    const roundWithPlayers: Round = {
        ...emptyRound,
        players: initializedPlayers
    }

    return applyStartingCard(roundWithPlayers, startingCard, drawPile)
}

/**
 * Picks a valid starting card from the provided deck.
 */
function pickStartingCard(deck: Card[], shuffler: Shuffler<Card>, maxTries = 50): { startingCard: Card, remainingDeck: Card[]} {
    const tryPick = (currentDeck: Card[], attemptsLeft: number): { startingCard: Card, remainingDeck: Card[] } => {
        if ( attemptsLeft <= 0) {
            throw new Error("Initializing Round failed. Could not find a non-wild card for the discard pile")
        }

        if(currentDeck.length === 0) {
            throw new Error("Deck is empty while picking starting card");
        }

        const [topCard, ...rest] = currentDeck

        // Game Rule: If the top card of the Discard Pile is a Wild or Wild Draw 4, return it to the Draw Pile and pick another card.
        if(topCard.type === 'WILD' || topCard.type === 'WILD DRAW') {
            const reshuffledDeck = shuffleCards([topCard, ...rest], shuffler)
            return tryPick(reshuffledDeck, attemptsLeft - 1)
        }

        return {
            startingCard: topCard,
            remainingDeck: rest
        }
    }

    return tryPick(deck, maxTries)
}

function applyStartingCard(round: Round, startingCard: Card, remainingDeck: Card[]): Round {
    const roundWithoutEffectsApplied: Round = {
        ...round,
        drawPile: remainingDeck,
        discardPile: [startingCard],
        activeCardColor: "color" in startingCard ? startingCard.color : round.activeCardColor
    }

    const roundWithEffectsApplied =
        startingCard.type === "REVERSE" ? reversePlayDirection(roundWithoutEffectsApplied) :
            startingCard.type === "SKIP"    ? setSkipNextPlayerFlag(roundWithoutEffectsApplied) :
                startingCard.type === "DRAW"    ? setDrawTwoCardsFlag(roundWithoutEffectsApplied) :
                    roundWithoutEffectsApplied

    return advanceToNextPlayer(roundWithEffectsApplied)
}

/**
 * Returns the provided Round with the play direction reversed.
 */
const reversePlayDirection = (round: Round): Round => ({
    ...round,
    playPassDirection: round.playPassDirection === "clockwise" ? "counterclockwise" : "clockwise"
})

/**
 * Returns the specified Round with the "skipNextPlayer" flag set to true.
 */
const setSkipNextPlayerFlag = (round: Round): Round => ({
    ...round,
    skipNextPlayer: true
})

/**
 * Returns the specified Round with the flag indicating that the next player must draw two cards and forfeit their turn, set.
 */
const setDrawTwoCardsFlag = (round: Round): Round => ({
    ...round,
    noOfCardsPlayerMustDraw: 2,
    skipNextPlayer: true
})

/**
 * Returns a Round where the turn has been moved to the next player in the play direction.
 */
function advanceToNextPlayer(round: Round): Round {
    // Identify the next player, depending on play direction
    const nextPlayer: Player = round.playPassDirection === 'counterclockwise' ?
        round.players[(round.activePlayer!.playerId + round.players.length - 1) % round.players.length] :
        round.players[(round.activePlayer!.playerId + round.players.length + 1) % round.players.length]

    // Evaluate if the last player, played a card that skips or forfeits this players turn
    if (round.skipNextPlayer) {
        if (round.noOfCardsPlayerMustDraw > 1) {
            // Game Rule: Skipped player must draw cards, if last player played a DRAW 2 or WILD DRAW 4 card
            return advanceToNextPlayer({
                    ...drawCards(nextPlayer.playerId, round.noOfCardsPlayerMustDraw, round),
                    activePlayer: nextPlayer,
                    skipNextPlayer: false
                }
            )
        }

        return advanceToNextPlayer({
            ...round,
            activePlayer: nextPlayer,
            skipNextPlayer: false
        })
    } else {
        return {
            ...round,
            activePlayer: {...nextPlayer, hasDrawnCardInTurn: false},
            players: round.players.map((player: Player): Player => ({ ...player, hasDrawnCardInTurn: false }))
        }
    }
}

/**
 * Draws a number of cards from the draw pile on the specified Round. Returns a Round type with the updates piles and player hands.
 */
function drawCards(playerIdForDrawingPlayer: number, numberOfCardsToDraw: number, round: Round): Round {
    if(numberOfCardsToDraw <= 0) {
        return round
    }

    if(playerIdForDrawingPlayer < 0 || playerIdForDrawingPlayer >= round.players.length) {
        throw new Error(`PlayerId must be between 0 and number of players in the round ${round.players.length}`)
    }

    if(round.drawPile.length + round.discardPile.length < numberOfCardsToDraw) {
        throw new Error(`Cannot draw ${numberOfCardsToDraw} cards. Only ${round.drawPile.length + round.discardPile.length} cards are in play`)
    }

    // Game Rule: Reshuffle discard pile into draw pile, if there is not enough cards in Draw pile to draw from.
    const reshuffledRound: Round = round.drawPile.length < numberOfCardsToDraw ? redistributeDiscardPile(round) : round

    const drawnCards: Card[] = reshuffledRound.drawPile.slice(0, numberOfCardsToDraw)
    const remainingCards: Card[] = reshuffledRound.drawPile.slice(numberOfCardsToDraw)

    // Game Rule: If drawn card was not playable, advance to next player.
    if(drawnCards.length === 1 && !canPlayCard(drawnCards[0],
            reshuffledRound.players[playerIdForDrawingPlayer].hand,
            topOfDiscard(reshuffledRound),
            reshuffledRound.activeCardColor)) {

        return advanceToNextPlayer(
            replenishDrawPileIfEmpty({
            ...reshuffledRound,
            noOfCardsPlayerMustDraw: 1,

            // Update the players in the returned Round
            players: reshuffledRound.players.map((player: Player): Player => player.playerId !== playerIdForDrawingPlayer ? player : {
                ...player,
                hand: [...player.hand, ...drawnCards],
                hasSaidUno: false // Resets 'UNO' declaration for this player, whenever new cards are drawn.
            }),

            // Update draw pile
            drawPile: remainingCards
        }))
    }

    //Game Rule: Player must immediately play a drawn card, if that card can legally be played:
    return replenishDrawPileIfEmpty({
        ...reshuffledRound,
        noOfCardsPlayerMustDraw: 1,

        // Update the players in the returned Round
        players: reshuffledRound.players.map((player: Player): Player => player.playerId !== playerIdForDrawingPlayer ? player : {
            ...player,
            hand: [...player.hand, ...drawnCards],
            hasSaidUno: false, // Resets 'UNO' declaration for this player, whenever new cards are drawn.
            hasDrawnCardInTurn: true, // Marks this player as having drawn a card, and that last drawn card is playable immediately!
        }),

        // Update draw pile
        drawPile: remainingCards
    })
}

function replenishDrawPileIfEmpty(round: Round): Round{
    return round.drawPile.length === 0 ? redistributeDiscardPile(round) : round
}

/**
 * Moves all cards, except the top-most, from the discard pile into the draw pile and shuffles the draw pile. Returns the updated Round.
 */
function redistributeDiscardPile(round: Round): Round {
    const topCard: Card = round.discardPile.at(-1)!;

    return {
        ...round,
        drawPile: shuffleCards([...round.discardPile.filter(card => card !== topCard), ...round.drawPile], round.shuffler),
        discardPile: [topCard]
    }
}
