import { Color } from "@domain/model/deck";

type ColorPickerProps = {
    readonly onChoose: (namedColor: Color) => void
}

/**
 * Renders the Color Picker used to choose a color for special cards.
 */
export default function ColorPicker({ onChoose }: ColorPickerProps) {
    return (
        <div className="stage__overlay">
            <section className="modal modal--walnut" role="dialog">
                <h2 className="modal__title" id="color-title">
                    Choose a Colour
                </h2>
                <div className="color-choices">
                    <button className="color-choice color-choice--red" type="button" onClick={(): void => onChoose('RED')}>
                        RED
                    </button>
                    <button className="color-choice color-choice--yellow" type="button" onClick={(): void => onChoose('YELLOW')}>
                        YELLOW
                    </button>
                    <button className="color-choice color-choice--green" type="button" onClick={(): void => onChoose('GREEN')}>
                        GREEN
                    </button>
                    <button className="color-choice color-choice--blue" type="button" onClick={(): void => onChoose('BLUE')}>
                        BLUE
                    </button>
                </div>
            </section>
        </div>
    )
}
