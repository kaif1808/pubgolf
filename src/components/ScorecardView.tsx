import type { Course } from "@/lib/course";
import type { TeamRow } from "@/lib/queries";
import { playerStrokeTotalWithPenalties, type ScoresJson } from "@/lib/scoring";

type Props = {
  course: Course;
  team: TeamRow;
  scores: ScoresJson;
  penalties: { p1: number; p2: number; p3: number };
  children?: React.ReactNode;
};

export default function ScorecardView({
  course,
  team,
  scores,
  penalties,
  children,
}: Props) {
  const p1 = playerStrokeTotalWithPenalties(course, scores, "p1", penalties);
  const p2 = playerStrokeTotalWithPenalties(course, scores, "p2", penalties);
  const p3 = playerStrokeTotalWithPenalties(course, scores, "p3", penalties);

  return (
    <div className="pg-card">
      <header className="pg-header">
        <h1 className="pg-title">{course.meta.title}</h1>
        <div className="pg-subtitle">{course.meta.subtitle}</div>
        <div className="pg-course-meta">
          <span>
            Course Par · <strong>{course.meta.coursePar}</strong>
          </span>
          <span>
            Holes · <strong>{course.meta.holesCount}</strong>
          </span>
          <span>
            Distance · <strong>{course.meta.distance}</strong>
          </span>
        </div>
      </header>

      <div className="pg-team">
        <div className="pg-team-field">
          <label>Team Name</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.name}
          </div>
        </div>
        <div className="pg-team-field">
          <label>Player 1</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.player_1}
          </div>
        </div>
        <div className="pg-team-field">
          <label>Player 2</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.player_2}
          </div>
        </div>
        <div className="pg-team-field">
          <label>Player 3</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.player_3}
          </div>
        </div>
      </div>

      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="pg-bar">Bar &amp; Local Rule</th>
              <th>Par Drink</th>
              <th>Par</th>
              <th>P1</th>
              <th>P2</th>
              <th>P3</th>
            </tr>
          </thead>
          <tbody>
            {course.holes.map((h) => {
              const key = String(h.hole);
              const row = scores[key] ?? {};
              return (
                <tr key={h.hole}>
                  <td className="pg-td-hole">{h.hole}</td>
                  <td className="pg-td-bar">
                    <div className="pg-bar-name">{h.barName}</div>
                    <div className="pg-rule">{h.rule}</div>
                  </td>
                  <td className="pg-td-drink">{h.drink}</td>
                  <td className="pg-td-par">{h.par}</td>
                  {(["p1", "p2", "p3"] as const).map((slot) => (
                    <td key={slot} className="pg-td-player">
                      <span className="block text-center font-[family-name:var(--font-playfair)] text-[12pt] font-bold">
                        {row[slot] ?? ""}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}

            <tr className="pg-total">
              <td colSpan={3} className="pg-label">
                Course Total
              </td>
              <td className="pg-par-total">{course.meta.coursePar}</td>
              <td />
              <td />
              <td />
            </tr>
            <tr className="pg-total">
              <td colSpan={3} className="pg-label">
                + Penalties
              </td>
              <td>—</td>
              <td>{penalties.p1}</td>
              <td>{penalties.p2}</td>
              <td>{penalties.p3}</td>
            </tr>
            <tr className="pg-total">
              <td colSpan={3} className="pg-label">
                FINAL SCORE
              </td>
              <td>—</td>
              <td>{p1.final}</td>
              <td>{p2.final}</td>
              <td>{p3.final}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {children}

      <footer className="pg-footer">
        <div className="pg-panel">
          <h3>How to Score</h3>
          <ul>
            <li>
              <strong>1 stroke = 1 gulp.</strong> Lower is better. Finish drink in par or fewer =
              bonus −1.
            </li>
            <li>
              <strong>Each rule breach = +1 stroke penalty.</strong> Caller must witness it.
            </li>
            <li>
              <strong>Refusing a hole = +5.</strong> Substituting drink type without group vote =
              +3.
            </li>
            <li>
              <strong>Lowest aggregate team score wins a loaf of Grace&apos;s focaccia.</strong>
            </li>
          </ul>
        </div>
        <div className="pg-panel">
          <h3>Penalty Tally</h3>
          <p className="text-[8.5pt] leading-relaxed">
            P1: {penalties.p1} · P2: {penalties.p2} · P3: {penalties.p3}
          </p>
          <div className="mt-2 text-center text-[8pt] text-[#424242]">
            Team aggregate: {p1.final + p2.final + p3.final}
          </div>
        </div>
      </footer>
    </div>
  );
}
