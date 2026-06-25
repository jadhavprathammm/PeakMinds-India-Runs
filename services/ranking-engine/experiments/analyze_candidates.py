"""
Recruiter-ranking analysis of candidate_features.csv
Stage A: load + clean, summary stats, outliers, correlations, redundancy.
"""
import numpy as np, pandas as pd, os, json
from pathlib import Path
pd.set_option('display.width', 200)
pd.set_option('display.max_columns', 60)

_HERE = Path(__file__).resolve().parent
_DS   = Path(os.environ.get("DATASETS_DIR", str(_HERE.parent.parent.parent / "data" / "eda")))
CSV   = _DS / "candidate_features.csv"
OUT   = Path(os.environ.get("ANALYSIS_OUT", str(_HERE / "outputs")))
os.makedirs(OUT, exist_ok=True)

df = pd.read_csv(CSV)
print("SHAPE:", df.shape)

# -1 is a documented missing-sentinel on these signal columns -> NaN
SENTINEL_COLS = ['recruiter_response_rate', 'interview_completion_rate',
                 'offer_acceptance_rate', 'github_activity_score']
for c in SENTINEL_COLS:
    n = int((df[c] == -1).sum())
    df[c] = df[c].replace(-1, np.nan)
    print(f"  sentinel -1 -> NaN in {c}: {n} ({n/len(df)*100:.1f}%)")

# bool -> int for numeric handling
BOOL_COLS = ['open_to_work_flag','willing_to_relocate','verified_email',
             'verified_phone','linkedin_connected']
for c in BOOL_COLS:
    df[c] = df[c].astype(int)

num = df.select_dtypes(include=[np.number]).copy()
NUMCOLS = list(num.columns)
print("\nNUMERIC COLUMNS (%d):" % len(NUMCOLS), NUMCOLS)
print("\nCATEGORICAL/TEXT:", [c for c in df.columns if c not in NUMCOLS])

# ---------- 2. SUMMARY STATISTICS ----------
print("\n" + "="*90)
print("SUMMARY STATISTICS (numeric features)")
print("="*90)
desc = num.describe(percentiles=[.01,.05,.25,.5,.75,.95,.99]).T
desc['missing_%'] = (num.isna().mean()*100).round(2).values
desc['skew'] = num.skew(numeric_only=True).values
desc['kurtosis'] = num.kurtosis(numeric_only=True).values
print(desc.round(3).to_string())
desc.round(4).to_csv(os.path.join(OUT, "summary_statistics.csv"))

# ---------- 3. OUTLIERS & UNUSUAL DISTRIBUTIONS ----------
print("\n" + "="*90)
print("OUTLIERS (IQR rule) & DISTRIBUTION SHAPE")
print("="*90)
rows = []
for c in NUMCOLS:
    s = num[c].dropna()
    if s.nunique() <= 2:   # binary flag
        rows.append((c, 'binary', s.mean(), np.nan, np.nan, 0, 0.0)); continue
    q1, q3 = s.quantile(.25), s.quantile(.75)
    iqr = q3 - q1
    lo, hi = q1 - 1.5*iqr, q3 + 1.5*iqr
    out = ((s < lo) | (s > hi)).sum()
    rows.append((c, 'continuous', round(s.mean(),2), round(s.skew(),2),
                 round(s.kurtosis(),2), int(out), round(out/len(s)*100,2)))
odf = pd.DataFrame(rows, columns=['feature','type','mean','skew','kurtosis','n_outliers','outlier_%'])
print(odf.to_string(index=False))
odf.to_csv(os.path.join(OUT, "outliers.csv"), index=False)

# ---------- 4. CORRELATION MATRIX ----------
print("\n" + "="*90)
print("CORRELATION MATRIX (Pearson) -- saved to csv/png")
print("="*90)
corr = num.corr(method='pearson')
corr.round(3).to_csv(os.path.join(OUT, "correlation_matrix.csv"))
# Spearman too (robust to skew)
scorr = num.corr(method='spearman')
scorr.round(3).to_csv(os.path.join(OUT, "correlation_matrix_spearman.csv"))
print(corr.round(2).to_string())

# ---------- 6. REDUNDANT / HIGHLY CORRELATED PAIRS ----------
print("\n" + "="*90)
print("HIGHLY CORRELATED FEATURE PAIRS (|Pearson| >= 0.6)")
print("="*90)
pairs = []
cols = corr.columns
for i in range(len(cols)):
    for j in range(i+1, len(cols)):
        r = corr.iloc[i, j]
        if pd.notna(r) and abs(r) >= 0.6:
            pairs.append((cols[i], cols[j], round(r,3)))
pairs.sort(key=lambda x: -abs(x[2]))
if pairs:
    for a,b,r in pairs:
        print(f"  {r:+.3f}   {a}  <->  {b}")
else:
    print("  none above 0.6")
pd.DataFrame(pairs, columns=['feat_a','feat_b','pearson']).to_csv(
    os.path.join(OUT, "redundant_pairs.csv"), index=False)

# save cleaned numeric for stage B
num.to_parquet(os.path.join(OUT, "_num_clean.parquet")) if False else \
    num.to_csv(os.path.join(OUT, "_num_clean.csv"), index=False)
print("\nStage A done. Outputs in", OUT)
