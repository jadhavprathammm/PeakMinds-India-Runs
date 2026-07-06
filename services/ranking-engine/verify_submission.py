"""
Stage-3 reproducibility proof: re-run the ranking pipeline and verify the output
is BYTE-IDENTICAL to the committed submission CSV.

    python verify_submission.py          # exit 0 = reproduces exactly, 1 = mismatch

Runs the same build_ranking() the CLI uses, writes to a temp file, and diffs
against submissions/team_redrob.csv. Never touches the committed CSV.
"""
import csv, io, os, sys, time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rank import build_ranking, ART  # noqa: E402

_HERE = Path(__file__).resolve().parent
SUBMITTED = _HERE / "submissions" / "team_redrob.csv"


def main() -> int:
    t0 = time.time()
    top = build_ranking(str(ART / "candidate_features.parquet"),
                        str(ART / "reasoning_facts.parquet"), topk=100)
    buf = io.StringIO()
    import pandas as pd
    out = pd.DataFrame({
        "candidate_id": top["candidate_id"],
        "rank": top["rank"].astype(int),
        "score": top["score"].map(lambda s: f"{s:.6f}"),
        "reasoning": top["reasoning"],
    })
    out.to_csv(buf, index=False, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    reproduced = buf.getvalue().encode("utf-8")
    committed = SUBMITTED.read_bytes()

    dt = time.time() - t0
    if reproduced == committed:
        print(f"[verify] PASS — reproduced CSV is byte-identical to {SUBMITTED.name} "
              f"({len(committed)} bytes, {dt:.2f}s)")
        return 0
    print(f"[verify] FAIL — reproduced CSV differs from {SUBMITTED.name}")
    # show first differing line for fast diagnosis
    for i, (a, b) in enumerate(zip(committed.splitlines(), reproduced.splitlines())):
        if a != b:
            print(f"  first diff at line {i + 1}:")
            print(f"    committed:  {a[:120]!r}")
            print(f"    reproduced: {b[:120]!r}")
            break
    return 1


if __name__ == "__main__":
    sys.exit(main())
