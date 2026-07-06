# Stage-3 reproduction container for the PeakMinds ranking step.
#
#   docker build -t peakminds-rank -f services/ranking-engine/Dockerfile .
#   docker run --rm --network=none peakminds-rank            # verify: byte-identical proof
#   docker run --rm --network=none peakminds-rank python rank.py --out /tmp/out.csv
#
# Installs ONLY the ranking-step dependencies (requirements-rank.txt — numpy/pandas/
# pyarrow, ~200 MB total image). torch / sentence-transformers are deliberately
# excluded: they are needed only for the one-time offline embedding precompute,
# not to reproduce the submission CSV. Committed parquet artifacts are self-
# sufficient, so this container needs no data download and no network.
FROM python:3.13-slim

WORKDIR /app

COPY services/ranking-engine/requirements-rank.txt .
RUN pip install --no-cache-dir -r requirements-rank.txt

COPY services/ranking-engine/src/ src/
COPY services/ranking-engine/artifacts/candidate_features.parquet artifacts/
COPY services/ranking-engine/artifacts/reasoning_facts.parquet artifacts/
COPY services/ranking-engine/submissions/team_redrob.csv submissions/
COPY services/ranking-engine/rank.py services/ranking-engine/verify_submission.py ./

# Default: prove the committed submission reproduces byte-identically.
CMD ["python", "verify_submission.py"]
