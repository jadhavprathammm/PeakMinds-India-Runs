import sys, os
from pathlib import Path
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.scoring import score_dataframe
pd.set_option("display.width", 200)

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
df = pd.read_parquet(ART / "candidate_features.parquet")
d = score_dataframe(df)
ok = d[d["S"] >= 0]   # exclude honeypots/twins

print("S (non-excluded) distribution:")
print(d.loc[d["S"]>=0, "S"].describe(percentiles=[.5,.9,.99,.999]).round(4).to_string())
print("\nS_fit distribution:")
print(d["S_fit"].describe(percentiles=[.5,.9,.99,.999]).round(4).to_string())

print("\nTier pyramid (current cuts):")
print(d["tier"].value_counts().sort_index(ascending=False).to_string())

print("\nReference S percentiles among title=core_ml/ml_adjacent:")
sub = d[d["current_title_class"].isin(["core_ml","ml_adjacent"]) & (d["S"]>=0)]
print(sub["S"].describe(percentiles=[.25,.5,.75,.9,.95,.99]).round(4).to_string())

print("\nTop 15 by S:")
cols = ["candidate_id","current_title","current_company","yoe","applied_ml_years",
        "evid_strong_ir","semantic_fit","S_fit","avail_modifier","S","tier","gate_audit"]
print(d.sort_values("S", ascending=False)[cols].head(15).to_string(index=False))

print("\nSuggested cuts from S percentiles (rankable pool):")
for q in [0.999, 0.997, 0.99, 0.97, 0.93]:
    print(f"  p{q*100:.1f} = {np.quantile(ok['S'], q):.4f}")
