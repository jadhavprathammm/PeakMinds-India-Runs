// Canonical skill normalisation vocabulary for Stages 3 and 5.
// Maps all known surface forms to a single canonical string.
// "scikit learn", "Sci-Kit Learn", "sklearn" → "scikit-learn"

// Raw form → canonical form.
// Keys should be lower-cased; normalizeSkill() lower-cases before lookup.
export const SKILL_VOCABULARY: Record<string, string> = {
  // ML frameworks
  "sklearn": "scikit-learn",
  "scikit learn": "scikit-learn",
  "sci-kit learn": "scikit-learn",
  "tensorflow 2": "tensorflow",
  "tf": "tensorflow",
  "keras": "keras",
  "pytorch": "pytorch",
  "torch": "pytorch",
  "xgboost": "xgboost",
  "lightgbm": "lightgbm",
  "catboost": "catboost",
  "scipy": "scipy",
  "numpy": "numpy",
  "pandas": "pandas",
  "matplotlib": "matplotlib",
  "seaborn": "seaborn",
  "plotly": "plotly",
  "jupyter": "jupyter",
  "jupyter notebook": "jupyter",
  "colab": "google-colab",
  "google colab": "google-colab",
  // Data
  "sql": "sql",
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "mysql": "mysql",
  "sqlite": "sqlite",
  "bigquery": "bigquery",
  "snowflake": "snowflake",
  "redshift": "redshift",
  "mongodb": "mongodb",
  "redis": "redis",
  "elasticsearch": "elasticsearch",
  "kafka": "kafka",
  "spark": "apache-spark",
  "apache spark": "apache-spark",
  "hadoop": "hadoop",
  "airflow": "airflow",
  "dbt": "dbt",
  "tableau": "tableau",
  "power bi": "power-bi",
  "powerbi": "power-bi",
  "looker": "looker",
  // Cloud
  "aws": "aws",
  "amazon web services": "aws",
  "gcp": "gcp",
  "google cloud": "gcp",
  "google cloud platform": "gcp",
  "azure": "azure",
  "microsoft azure": "azure",
  "docker": "docker",
  "kubernetes": "kubernetes",
  "k8s": "kubernetes",
  "terraform": "terraform",
  "ci/cd": "ci-cd",
  "cicd": "ci-cd",
  "github actions": "github-actions",
  "gitlab ci": "gitlab-ci",
  "jenkins": "jenkins",
  // Languages
  "python": "python",
  "python3": "python",
  "r": "r",
  "javascript": "javascript",
  "typescript": "typescript",
  "java": "java",
  "scala": "scala",
  "go": "go",
  "golang": "go",
  "rust": "rust",
  "c++": "c++",
  "c#": "c#",
  // ML concepts
  "machine learning": "machine-learning",
  "ml": "machine-learning",
  "deep learning": "deep-learning",
  "dl": "deep-learning",
  "nlp": "nlp",
  "natural language processing": "nlp",
  "computer vision": "computer-vision",
  "cv": "computer-vision",
  "reinforcement learning": "reinforcement-learning",
  "rl": "reinforcement-learning",
  "time series": "time-series",
  "forecasting": "forecasting",
  "anomaly detection": "anomaly-detection",
  "recommendation systems": "recommendation-systems",
  "feature engineering": "feature-engineering",
  "hyperparameter tuning": "hyperparameter-tuning",
  "model deployment": "model-deployment",
  "mLOps": "mlops",
  "mlops": "mlops",
};

// Map a raw skill string to its canonical form.
// Returns the canonical string if found; returns the trimmed input otherwise.
export function normalizeSkill(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  return SKILL_VOCABULARY[lower] ?? trimmed;
}

// Remove skills that appear in more than one category.
// A skill may only belong to one category; first occurrence wins.
export function deduplicateAcrossCategories(
  categories: Record<string, string[]>
): Record<string, string[]> {
  const seen = new Set<string>();
  const result: Record<string, string[]> = {};

  for (const [category, skills] of Object.entries(categories)) {
    const filtered = skills.filter((skill) => {
      const normalized = normalizeSkill(skill).toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
    result[category] = filtered;
  }

  return result;
}

// Filter out noise: strings below 2 chars, pure numbers, stopword-only strings.
export function filterNoiseSkills(skills: string[]): string[] {
  const stopwords = new Set([
    "and", "or", "the", "a", "an", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "as", "is", "it", "be", "this", "that", "these", "those",
    "i", "you", "we", "they", "he", "she", "my", "your", "our", "their",
    "me", "us", "him", "her", "them", "but", "not", "so", "if", "then",
    "else", "when", "where", "why", "how", "what", "which", "who", "whom",
    "can", "could", "will", "would", "should", "may", "might", "must",
    "have", "has", "had", "do", "does", "did", "done", "been", "being"
  ]);

  return skills.filter((skill) => {
    const trimmed = skill.trim();
    if (trimmed.length < 2) return false;
    if (/^\d+$/.test(trimmed)) return false;
    const words = trimmed.toLowerCase().split(/\s+/);
    if (words.every((w) => stopwords.has(w))) return false;
    return true;
  });
}