import { describe, it, expect } from '@jest/globals'
import { createRoundFromMemento } from '../utils/test_adapter'

// Player A is in turn with two cards, of which the BLUE 3 can be played.
const memento = {
  players: ['A', 'B', 'C'],
  hands: [
    [
      { type: 'NUMBERED', color: 'BLUE', number: 3 },
      { type: 'NUMBERED', color: 'RED', number: 5 },
    ],
    [
      { type: 'NUMBERED', color: 'GREEN', number: 1 },
      { type: 'NUMBERED', color: 'GREEN', number: 2 },
      { type: 'NUMBERED', color: 'YELLOW', number: 4 },
    ],
    [
      { type: 'NUMBERED', color: 'YELLOW', number: 6 },
      { type: 'NUMBERED', color: 'YELLOW', number: 8 },
      { type: 'NUMBERED', color: 'RED', number: 9 },
    ],
  ],
  drawPile: [
    { type: 'NUMBERED', color: 'BLUE', number: 9 },
    { type: 'NUMBERED', color: 'RED', number: 2 },
    { type: 'NUMBERED', color: 'RED', number: 3 },
    { type: 'NUMBERED', color: 'RED', number: 4 },
    { type: 'NUMBERED', color: 'RED', number: 6 },
    { type: 'NUMBERED', color: 'RED', number: 7 },
  ],
  discardPile: [
    { type: 'NUMBERED', color: 'BLUE', number: 7 },
  ],
  currentColor: 'BLUE',
  currentDirection: 'clockwise',
  dealer: 2,
  playerInTurn: 0
}

// Player A is in turn with two cards, and none of them can be played. The top of the draw pile, the BLUE 9, can.
const mustDrawMemento = {
  ...memento,
  hands: [
    [
      { type: 'NUMBERED', color: 'GREEN', number: 4 },
      { type: 'NUMBERED', color: 'RED', number: 5 },
    ],
    memento.hands[1],
    memento.hands[2],
  ],
}

describe("the players who have said UNO", () => {
  it("are left out of the memento when nobody has", () => {
    const round = createRoundFromMemento(memento)
    expect(round.toMemento()).not.toHaveProperty('saidUno')
    expect(round.toMemento()).toEqual(memento)
  })
  it("are written to the memento", () => {
    const round = createRoundFromMemento(memento)
    round.sayUno(0)
    expect(round.toMemento().saidUno).toEqual([true, false, false])
  })
  it("are read from the memento", () => {
    const round = createRoundFromMemento({ ...memento, saidUno: [true, false, false] })
    expect(round.playerObj(0)?.hasSaidUno).toBeTruthy()
    expect(round.playerObj(1)?.hasSaidUno).toBeFalsy()
    expect(round.playerObj(2)?.hasSaidUno).toBeFalsy()
  })
  it("are nobody when the memento does not have the list", () => {
    const round = createRoundFromMemento(memento)
    expect(round.playerObj(0)?.hasSaidUno).toBeFalsy()
  })
  it("cannot be caught after the Round was recreated from its memento", () => {
    const original = createRoundFromMemento(memento)
    original.sayUno(0)
    const round = createRoundFromMemento(original.toMemento())
    round.play(0)
    expect(round.catchUnoFailure({ accuser: 1, accused: 0 })).toBeFalsy()
    expect(round.playerHand(0).length).toEqual(1)
  })
  it("can be caught after the Round was recreated, when the player did not say UNO", () => {
    const round = createRoundFromMemento(createRoundFromMemento(memento).toMemento())
    round.play(0)
    expect(round.catchUnoFailure({ accuser: 1, accused: 0 })).toBeTruthy()
    expect(round.playerHand(0).length).toEqual(5)
  })
  it("are forgotten again when that player draws", () => {
    const original = createRoundFromMemento(mustDrawMemento)
    original.sayUno(0)
    original.draw()
    expect(original.toMemento()).not.toHaveProperty('saidUno')
  })
})

describe("the players who have drawn cards in their turn", () => {
  it("are left out of the memento when nobody has", () => {
    const round = createRoundFromMemento(mustDrawMemento)
    expect(round.toMemento()).not.toHaveProperty('hasDrawn')
    expect(round.toMemento()).toEqual(mustDrawMemento)
  })
  it("are written to the memento", () => {
    const round = createRoundFromMemento(mustDrawMemento)
    round.draw() // The drawn BLUE 9 can be played, so the turn stays with player A.
    expect(round.playerInTurn()).toEqual(0)
    expect(round.toMemento().hasDrawn).toEqual([true, false, false])
  })
  it("are read from the memento", () => {
    const original = createRoundFromMemento(mustDrawMemento)
    original.draw()
    const round = createRoundFromMemento(original.toMemento())
    expect(round.playerObj(0)?.hasDrawnCardInTurn).toBeTruthy()
    expect(round.playerObj(1)?.hasDrawnCardInTurn).toBeFalsy()
    expect(() => round.draw()).toThrow(/already drawn/)
  })
  it("survive a second trip through the memento", () => {
    const original = createRoundFromMemento(mustDrawMemento)
    original.draw()
    const once = createRoundFromMemento(original.toMemento())
    const twice = createRoundFromMemento(once.toMemento())
    expect(twice.toMemento()).toEqual(original.toMemento())
  })
})
