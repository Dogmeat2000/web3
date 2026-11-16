import { ScoreRow } from '@/models/ScoreRow.ts'

type ScoreBoardProps = {
  readonly title: string
  readonly headline: string
  readonly buttonLabel: string
  readonly rows: readonly ScoreRow[]
  readonly winnerId: number
  readonly onClose: () => void
  readonly gained?: number
}

export default function ScoreBoard({ title, headline, buttonLabel, rows, winnerId, onClose, gained }: ScoreBoardProps) {
  return (
    <div className="stage__overlay">
      <section className="modal modal--card" role="dialog" aria-modal="true">
        <h2 className="modal__title">{title}</h2>
        <p className="winner">{headline}</p>
        <div className="scoreboard-wrap">
          <table className="scoreboard">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Player</th>
                <th scope="col">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: ScoreRow, index: number) => (
                <tr key={row.playerId} className={row.playerId === winnerId ? 'scoreboard__row--winner' : undefined}>
                  <td>{index + 1}</td>
                  <td>
                    {row.name}
                    {row.isLocalPlayer && <b> (you)</b>}
                  </td>
                  <td>
                    {row.score}
                    {gained !== undefined && row.playerId === winnerId && <span className="scoreboard__gain">+{gained}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn" type="button" onClick={(): void => onClose()}>
          {buttonLabel}
        </button>
      </section>
    </div>
  )
}
