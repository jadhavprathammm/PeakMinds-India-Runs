"""
Stage B: visualizations, latent quality-factor (PCA), top-10 indicators,
and a transparent 0-100 Candidate Quality Score.
"""
import numpy as np, pandas as pd, os
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

_HERE = Path(__file__).resolve().parent
_DS   = Path(os.environ.get("DATASETS_DIR", str(_HERE.parent.parent.parent / "data" / "eda")))
CSV   = _DS / "candidate_features.csv"
OUT   = Path(os.environ.get("ANALYSIS_OUT", str(_HERE / "outputs")))
os.makedirs(OUT, exist_ok=True)

df = pd.read_csv(CSV)
SENT = ['recruiter_response_rate','interview_completion_rate','offer_acceptance_rate','github_activity_score']
for c in SENT:
    df[c] = df[c].replace(-1, np.nan)
BOOL = ['open_to_work_flag','willing_to_relocate','verified_email','verified_phone','linkedin_connected']
for c in BOOL:
    df[c] = df[c].astype(int)

num = df.select_dtypes(include=[np.number]).copy()
num = num.drop(columns=['language_count'])  # zero variance

# ---------------- VISUALS ----------------
# 1. correlation heatmap
corr = num.corr()
fig, ax = plt.subplots(figsize=(15, 13))
im = ax.imshow(corr.values, cmap='RdBu_r', vmin=-1, vmax=1, aspect='auto')
ax.set_xticks(range(len(corr))); ax.set_xticklabels(corr.columns, rotation=90, fontsize=8)
ax.set_yticks(range(len(corr))); ax.set_yticklabels(corr.columns, fontsize=8)
for i in range(len(corr)):
    for j in range(len(corr)):
        v = corr.values[i, j]
        if pd.notna(v) and abs(v) >= 0.3:
            ax.text(j, i, f"{v:.2f}", ha='center', va='center', fontsize=6,
                    color='white' if abs(v) > 0.6 else 'black')
fig.colorbar(im, fraction=0.046, pad=0.04)
ax.set_title("Pearson correlation matrix (labels shown for |r|>=0.3)")
plt.tight_layout(); plt.savefig(os.path.join(OUT, "01_correlation_heatmap.png"), dpi=110); plt.close()

# 2. distribution grid
key = ['years_of_experience','total_jobs','average_job_duration_months','total_skills',
       'advanced_skills_count','total_endorsements','profile_completeness_score',
       'recruiter_response_rate','profile_views_received_30d','interview_completion_rate',
       'offer_acceptance_rate','github_activity_score','search_appearance_30d',
       'saved_by_recruiters_30d','expected_salary_max_lpa','certification_count']
fig, axes = plt.subplots(4, 4, figsize=(18, 14))
for ax, c in zip(axes.ravel(), key):
    ax.hist(num[c].dropna(), bins=40, color='#3b7dd8', edgecolor='white', linewidth=.3)
    ax.set_title(c, fontsize=9); ax.tick_params(labelsize=7)
plt.suptitle("Distributions of key features", fontsize=14)
plt.tight_layout(); plt.savefig(os.path.join(OUT, "02_distributions.png"), dpi=110); plt.close()

# 3. boxplots for skewed/demand features
skewed = ['total_endorsements','advanced_skills_count','search_appearance_30d',
          'saved_by_recruiters_30d','profile_views_received_30d','current_job_duration_months',
          'expected_salary_max_lpa','average_skill_duration']
fig, ax = plt.subplots(figsize=(13, 7))
data = [num[c].dropna() for c in skewed]
ax.boxplot(data, vert=True, labels=skewed, showfliers=True,
           flierprops=dict(marker='o', markersize=2, alpha=.3))
ax.set_xticklabels(skewed, rotation=30, ha='right', fontsize=8)
ax.set_title("Outlier view (boxplots) for right-skewed demand/skill features")
plt.tight_layout(); plt.savefig(os.path.join(OUT, "03_outlier_boxplots.png"), dpi=110); plt.close()

# ---------------- PCA latent quality factor ----------------
# standardize on median-imputed matrix
X = num.copy()
med = X.median()
Xi = X.fillna(med)
Z = (Xi - Xi.mean()) / Xi.std(ddof=0)
# manual PCA via SVD
U, S, Vt = np.linalg.svd(Z.values, full_matrices=False)
expl = (S**2) / (S**2).sum()
pc1 = Vt[0]
# orient PC1 so demand signals load positive
if np.dot(pc1, (Z.columns == 'total_endorsements').astype(float)) < 0:
    pc1 = -pc1
loadings = pd.Series(pc1, index=Z.columns).sort_values(key=np.abs, ascending=False)

print("PCA explained variance (first 6 PCs):", np.round(expl[:6], 3))
print("\nPC1 loadings (|.| desc):")
print(loadings.round(3).to_string())

# scree + loadings plot
fig, axs = plt.subplots(1, 2, figsize=(16, 6))
axs[0].plot(range(1, len(expl)+1), expl, 'o-'); axs[0].set_title("Scree plot")
axs[0].set_xlabel("PC"); axs[0].set_ylabel("explained var ratio")
lo = loadings.reindex(loadings.abs().sort_values(ascending=True).index)
axs[1].barh(range(len(lo)), lo.values, color=np.where(lo.values>=0,'#2a9d8f','#e76f51'))
axs[1].set_yticks(range(len(lo))); axs[1].set_yticklabels(lo.index, fontsize=7)
axs[1].set_title("PC1 loadings (latent 'recruiter-demand / quality' factor)")
plt.tight_layout(); plt.savefig(os.path.join(OUT, "04_pca.png"), dpi=110); plt.close()

# ---------------- TOP-10 quality indicators ----------------
# tangible recruiter-quality proxy = saved_by_recruiters_30d (recruiters bookmarking)
proxy = 'saved_by_recruiters_30d'
sp = num.corr(method='spearman')[proxy].drop(proxy).sort_values(key=np.abs, ascending=False)
rank = pd.DataFrame({
    'pc1_loading_abs': loadings.abs(),
    'spearman_vs_saves': sp.reindex(loadings.index)
})
rank['combined'] = rank['pc1_loading_abs'].rank() + rank['spearman_vs_saves'].abs().rank()
rank = rank.sort_values('combined', ascending=False)
print("\nTOP 10 candidate-quality indicators (PC1 loading + Spearman vs recruiter-saves):")
print(rank.head(12).round(3).to_string())
rank.round(4).to_csv(os.path.join(OUT, "top_quality_indicators.csv"))

print("\nStage B done.")
