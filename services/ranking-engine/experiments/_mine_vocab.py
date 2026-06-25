"""Phase 2 prep: mine real vocabularies/distributions from candidates.jsonl to ground taxonomies."""
import json, io, re, os
from collections import Counter
from pathlib import Path
_HERE = Path(__file__).resolve().parent
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent.parent / "data" / "candidates.jsonl")))

cur_title, all_title, companies, locations, countries = Counter(), Counter(), Counter(), Counter(), Counter()
industries, skills, degrees, fields, tiers, workmode = Counter(), Counter(), Counter(), Counter(), Counter(), Counter()
yoe=[]; notice=[]; last_active=[]; signup=[]; n=0
expert_zero_dur=0; total_skill_rows=0
date_min, date_max = "9999", "0000"
sample_desc=[]

def upd_date(d):
    global date_min, date_max
    if d and isinstance(d,str) and len(d)>=7:
        if d<date_min: date_min=d
        if d>date_max: date_max=d

with io.open(PATH, encoding="utf-8") as f:
    for line in f:
        if not line.strip(): continue
        r=json.loads(line); n+=1
        p=r.get("profile",{}); rs=r.get("redrob_signals",{})
        cur_title[p.get("current_title","")]+=1
        companies[p.get("current_company","")]+=1
        locations[p.get("location","")]+=1
        countries[p.get("country","")]+=1
        industries[p.get("current_industry","")]+=1
        if p.get("years_of_experience") is not None: yoe.append(p["years_of_experience"])
        for j in r.get("career_history",[]):
            all_title[j.get("title","")]+=1
            companies[j.get("company","")]+=1
            industries[j.get("industry","")]+=1
            upd_date(j.get("start_date","")); upd_date(j.get("end_date","") or "")
            if len(sample_desc)<40 and j.get("description"): sample_desc.append(j["description"][:160])
        for e in r.get("education",[]):
            degrees[e.get("degree","")]+=1; fields[e.get("field_of_study","")]+=1; tiers[e.get("tier","")]+=1
        for s in r.get("skills",[]):
            skills[s.get("name","")]+=1; total_skill_rows+=1
            if s.get("proficiency") in ("advanced","expert") and (s.get("duration_months") or 0)==0:
                expert_zero_dur+=1
        workmode[rs.get("preferred_work_mode","")]+=1
        if rs.get("notice_period_days") is not None: notice.append(rs["notice_period_days"])
        la=rs.get("last_active_date",""); su=rs.get("signup_date","")
        if la: last_active.append(la); upd_date(la)
        if su: upd_date(su)

def top(c,k=40): return [f"{v}×{repr(t)}" for t,v in c.most_common(k)]
print("N =",n, "| date range:",date_min,"->",date_max)
import numpy as np
print("\nYOE: min%.1f p25%.1f med%.1f p75%.1f max%.1f"%(np.min(yoe),np.percentile(yoe,25),np.median(yoe),np.percentile(yoe,75),np.max(yoe)))
print("Notice: min%d med%d max%d"%(min(notice),int(np.median(notice)),max(notice)))
print("last_active max:",max(last_active),"min:",min(last_active))
print("expert/advanced w/ 0 duration skill-rows: %d / %d (%.1f%%)"%(expert_zero_dur,total_skill_rows,100*expert_zero_dur/total_skill_rows))
print("\n== CURRENT TITLES (top40) ==");  print("\n".join(top(cur_title)))
print("\n== ALL CAREER TITLES (top40) =="); print("\n".join(top(all_title)))
print("\n== COMPANIES (top50) =="); print("\n".join(top(companies,50)))
print("\n== LOCATIONS (top40) =="); print("\n".join(top(locations)))
print("\n== COUNTRIES (top15) =="); print("\n".join(top(countries,15)))
print("\n== INDUSTRIES (top30) =="); print("\n".join(top(industries,30)))
print("\n== SKILLS (top60) =="); print("\n".join(top(skills,60)))
print("\n== DEGREES =="); print("\n".join(top(degrees,20)))
print("\n== FIELDS (top25) =="); print("\n".join(top(fields,25)))
print("\n== TIERS =="); print("\n".join(top(tiers,10)))
print("\n== WORKMODE =="); print("\n".join(top(workmode,8)))
print("\n== SAMPLE DESCRIPTIONS ==")
for d in sample_desc[:25]: print(" -",d)
