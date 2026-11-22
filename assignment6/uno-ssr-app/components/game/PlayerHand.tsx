import { Card } from "@domain/model/deck";
import { CSSProperties } from 'react'
import Image from 'next/image'
import { getCardUrl } from "@/helpers/cardUrlHelper";

type PlayerHandProp = {
    readonly cards: readonly Card[]
    readonly playables: readonly boolean[]
    readonly onPlay: (cardIndex: number) => void
}

/**
 * Renders the cards on the local players hand.
 */
export default function PlayerHand({ cards, playables, onPlay }: PlayerHandProp) {
    const handStyle: CSSProperties = { '--cards': cards.length } as CSSProperties

    return (
        <ul className="hand" aria-label="Your-hand" style={handStyle}>
            {cards.map((card: Card, cardIndex: number) => (
                <li key={cardIndex}>
                    <button className="hand__card" type="button" disabled={!playables[cardIndex]} onClick={(): void => onPlay(cardIndex)}>
                        <Image src={getCardUrl(card)} alt="" width={244} height={364}/>
                    </button>
                </li>
            ))}
        </ul>
    )
}
