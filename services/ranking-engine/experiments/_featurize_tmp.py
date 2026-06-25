import json, numpy as np, pandas as pd, os
from pathlib import Path
_HERE = Path(__file__).resolve().parent
_DS  = Path(os.environ.get("DATASETS_DIR",    str(_HERE.parent.parent.parent / "data" / "eda")))
PATH = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent.parent / "data" / "candidates.jsonl")))
candidate = pd.read_json(PATH, lines=True)

DEGREE_RANK = {'B.Sc':1,'B.E.':1,'B.Tech':1,'M.Sc':2,'M.E.':2,'M.Tech':2,'M.S.':2,'Ph.D':3,'Ph.D.':3}
TIER_RANK   = {'tier_1':1,'tier_2':2,'tier_3':3,'tier_4':4}

def smean(xs):
    xs = [x for x in xs if x is not None]
    return float(np.mean(xs)) if xs else np.nan

def featurize(r):
    p, ch, ed = r['profile'], r['career_history'], r['education']
    sk, ce, lg, rs = r['skills'], r['certifications'], r['languages'], r['redrob_signals']
    f = {'candidate_id': r['candidate_id']}

    # PROFILE
    f['years_of_experience']  = p.get('years_of_experience')
    f['current_company_size'] = p.get('current_company_size')
    f['current_industry']     = p.get('current_industry')

    # CAREER
    f['total_jobs'] = len(ch)
    f['average_job_duration_months'] = smean([j.get('duration_months') for j in ch])
    cur = [j.get('duration_months') for j in ch if j.get('is_current')]
    f['current_job_duration_months'] = cur[0] if cur else np.nan
    f['number_of_industries_worked_in'] = len({j.get('industry') for j in ch if j.get('industry')})

    # EDUCATION
    if ed:
        f['highest_degree'] = max(ed, key=lambda e: DEGREE_RANK.get(e.get('degree'), 0)).get('degree')
        f['best_tier_education'] = min((TIER_RANK.get(e.get('tier'), 99) for e in ed))
    else:
        f['highest_degree'] = np.nan
        f['best_tier_education'] = np.nan
    f['education_count'] = len(ed)

    # SKILLS
    f['total_skills'] = len(sk)
    f['advanced_skills_count'] = sum(1 for s in sk if s.get('proficiency') in ('advanced','expert'))
    f['total_endorsements'] = sum((s.get('endorsements') or 0) for s in sk)
    f['average_skill_duration'] = smean([s.get('duration_months') for s in sk])
    top = sorted(sk, key=lambda s: (s.get('endorsements') or 0), reverse=True)[:5]
    f['top_skills'] = ', '.join(s.get('name') for s in top) if top else np.nan

    # CERTIFICATIONS / LANGUAGES
    f['certification_count'] = len(ce)
    f['language_count'] = len(lg)

    # REDROB SIGNALS
    for k in ['profile_completeness_score','recruiter_response_rate','profile_views_received_30d',
              'applications_submitted_30d','interview_completion_rate','offer_acceptance_rate',
              'github_activity_score','search_appearance_30d','saved_by_recruiters_30d',
              'open_to_work_flag','willing_to_relocate','verified_email','verified_phone','linkedin_connected']:
        f[k] = rs.get(k)

    # SALARY
    sal = rs.get('expected_salary_range_inr_lpa') or {}
    f['expected_salary_min_lpa'] = sal.get('min')
    f['expected_salary_max_lpa'] = sal.get('max')
    return f

candidate_features = pd.DataFrame([featurize(r) for r in candidate.to_dict('records')])

# best_tier as readable label too
inv = {1:'tier_1',2:'tier_2',3:'tier_3',4:'tier_4'}
candidate_features['best_tier_education'] = candidate_features['best_tier_education'].map(inv)

print('SHAPE:', candidate_features.shape)
print()
print('DTYPES:')
print(candidate_features.dtypes)
print()
miss = (candidate_features.isna().mean()*100).round(2)
print('MISSING %:')
print(miss[miss>0] if (miss>0).any() else 'No missing values in any column')
print()
print('FULL MISSING TABLE:')
print(miss.to_string())
print()
print()
print('SENTINEL (-1) RATES on numeric signal columns:')
num = candidate_features.select_dtypes('number')
sent = ((num == -1).mean()*100).round(2)
print(sent[sent>0].to_string() if (sent>0).any() else 'none')
candidate_features.to_csv(_DS / "candidate_features.csv", index=False)
print('\nsaved csv')
