"""
Stage C: Candidate Quality Score (0-100), transparent pillar weighting,
with validation against observed recruiter behaviour.
"""
import numpy as np, pandas as pd, os
from pathlib import Path
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

_HERE = Path(__file__).resolve().parent
_DS   = Path(os.environ.get("DATASETS_DIR", str(_HERE.parent.parent.parent / "data" / "eda")))
CSV   = _DS / "candidate_features.csv"
OUT   = Path(os.environ.get("ANALYSIS_OUT", str(_HERE / "outputs")))

df = pd.read_csv(CSV)
SENT = ['recruiter_response_rate','interview_completion_rate','offer_acceptance_rate','github_activity_score']
for c in SENT: df[c] = df[c].replace(-1, np.nan)
for c in ['verified_email','verified_phone','linkedin_connected']: df[c] = df[c].astype(int)

def pr(col):
    """percentile rank 0..1, NaN -> neutral 0.5 (absence neither rewarded nor punished)."""
    s = df[col]
    r = s.rank(pct=True)
    return r.fillna(0.5)

# ---- pillar definitions: (feature, weight) ; weights sum to 100 ----
PILLARS = {
 'Skills & Expertise (30)': [
    ('total_endorsements', 12), ('advanced_skills_count', 9),
    ('total_skills', 5), ('average_skill_duration', 4)],
 'Market Demand (28)': [
    ('saved_by_recruiters_30d', 11), ('search_appearance_30d', 9),
    ('profile_views_received_30d', 8)],
 'Reliability (20)': [
    ('recruiter_response_rate', 7), ('interview_completion_rate', 7),
    ('offer_acceptance_rate', 6)],
 'Experience & Stability (12)': [
    ('years_of_experience', 7), ('average_job_duration_months', 5)],
 'Profile Trust (10)': [
    ('profile_completeness_score', 4), ('github_activity_score', 2),
    ('verified_email', 1.5), ('verified_phone', 1.5), ('linkedin_connected', 1)],
}

score = np.zeros(len(df))
wsum = 0
contrib = {}
for pillar, feats in PILLARS.items():
    for f, w in feats:
        c = pr(f) * w
        score += c.values
        contrib[f] = c
        wsum += w
assert abs(wsum - 100) < 1e-6, wsum
df['quality_score'] = score.round(2)   # already 0..100 since weights sum 100 and pr in [0,1]

print("Total weight:", wsum)
print("\nQuality score distribution:")
print(df['quality_score'].describe(percentiles=[.05,.25,.5,.75,.95]).round(2).to_string())

# tier banding
bins = [0,40,55,70,85,100]
labels = ['D (<40)','C (40-55)','B (55-70)','A (70-85)','A+ (85-100)']
df['quality_tier'] = pd.cut(df['quality_score'], bins=bins, labels=labels, include_lowest=True)
print("\nTier distribution:")
print(df['quality_tier'].value_counts().sort_index().to_string())

# ---- VALIDATION: does score align with real recruiter behaviour? ----
print("\nVALIDATION -- Spearman of quality_score vs observed outcomes:")
for o in ['saved_by_recruiters_30d','recruiter_response_rate','interview_completion_rate',
          'offer_acceptance_rate','profile_views_received_30d']:
    rho = df[['quality_score', o]].corr(method='spearman').iloc[0,1]
    print(f"  {o:32s} rho = {rho:+.3f}")

# mean outcomes by tier (does higher tier => more recruiter saves?)
print("\nMean observed metrics by quality tier:")
g = df.groupby('quality_tier', observed=True)[
    ['saved_by_recruiters_30d','recruiter_response_rate','interview_completion_rate',
     'total_endorsements','years_of_experience']].mean().round(2)
print(g.to_string())

# ---- plots ----
fig, axs = plt.subplots(1, 2, figsize=(16, 6))
axs[0].hist(df['quality_score'], bins=50, color='#3b7dd8', edgecolor='white', linewidth=.3)
axs[0].axvline(df['quality_score'].median(), color='red', ls='--', label='median')
axs[0].set_title("Candidate Quality Score distribution"); axs[0].set_xlabel("score"); axs[0].legend()
tc = df.groupby('quality_tier', observed=True)['saved_by_recruiters_30d'].mean()
axs[1].bar(range(len(tc)), tc.values, color='#2a9d8f')
axs[1].set_xticks(range(len(tc))); axs[1].set_xticklabels(tc.index, rotation=20, fontsize=8)
axs[1].set_title("Avg recruiter-saves by quality tier (validation)")
plt.tight_layout(); plt.savefig(os.path.join(OUT, "05_quality_score.png"), dpi=110); plt.close()

# pillar contribution stacked for a sample of candidates sorted by score
sample = df.sample(2000, random_state=1).sort_values('quality_score')
fig, ax = plt.subplots(figsize=(14, 6))
bottom = np.zeros(len(sample))
colors = plt.cm.tab20(np.linspace(0,1,len(contrib)))
for (f, c), col in zip(contrib.items(), colors):
    vals = c.loc[sample.index].values
    ax.bar(range(len(sample)), vals, bottom=bottom, width=1, label=f, color=col)
    bottom += vals
ax.set_title("Pillar/feature contribution to quality score (2k candidates sorted by score)")
ax.set_xlabel("candidates (sorted)"); ax.set_ylabel("score points")
ax.legend(ncol=3, fontsize=7, loc='upper left')
plt.tight_layout(); plt.savefig(os.path.join(OUT, "06_score_contributions.png"), dpi=110); plt.close()

out = df[['candidate_id','quality_score','quality_tier']]
out.to_csv(os.path.join(OUT, "candidate_quality_scores.csv"), index=False)
print("\nTop 10 candidates by quality score:")
print(df.nlargest(10, 'quality_score')[
    ['candidate_id','quality_score','total_endorsements','advanced_skills_count',
     'saved_by_recruiters_30d','years_of_experience']].to_string(index=False))
print("\nStage C done. Scores ->", os.path.join(OUT,"candidate_quality_scores.csv"))
