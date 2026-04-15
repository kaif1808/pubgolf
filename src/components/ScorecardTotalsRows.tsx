import { playerStrokeTotalWithPenalties } from "@/lib/scoring";

type Row = ReturnType<typeof playerStrokeTotalWithPenalties>;

type Props = {
  p1: Row;
  p2: Row;
  p3: Row;
};

export default function ScorecardTotalsRows({ p1, p2, p3 }: Props) {
  return (
    <>
      <tr className="pg-total">
        <td colSpan={3} className="pg-label">
          Strokes (raw)
        </td>
        <td>—</td>
        <td>{p1.raw}</td>
        <td>{p2.raw}</td>
        <td>{p3.raw}</td>
      </tr>
      <tr className="pg-total">
        <td colSpan={3} className="pg-label">
          Par bonus (−)
        </td>
        <td>—</td>
        <td>−{p1.bonus}</td>
        <td>−{p2.bonus}</td>
        <td>−{p3.bonus}</td>
      </tr>
    </>
  );
}
