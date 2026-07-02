// Deterministic JD ↔ resume matching engine.
// Shared by /api/analyze (single-candidate) and /api/rank-candidates (batch).
//
// Three scoring layers, stacked and additive:
//   1. Exact keyword match   – term literal substring present in resume text
//   2. Lemmatised match      – stem-stripped form catches morphological variants
//                              (organize / organizing / organization → same stem)
//   3. Semantic bonus        – cosine(jd_embedding, resume_embedding) via MiniLM
//      Passed in by the caller; undefined = keyword-only fallback (safe + fast).
//
// Score formula:
//   keywordScore  = (exact / N) × 100  +  (lemmaOnly / N) × 50
//   semanticBonus = max(0, (cosine − 0.40) / 0.60) × 40   [0 … 40 extra points]
//   final         = clamp(28, 88, round(keywordScore + semanticBonus))

// ── Stop words ──────────────────────────────────────────────────────────────────

const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","was","are","be","been","have","has","had","will",
  "would","could","should","may","might","must","do","did","does","not",
  "this","that","these","those","we","you","they","it","our","their","its",
  "what","which","who","how","when","where","why","all","any","such","into",
  "through","during","including","while","role","position","job","candidate",
  "team","company","work","ability","skills","skill","experience","required",
  "preferred","good","strong","excellent","well","knowledge","understanding",
  "able","also","each","about","both","more","most","over","under","above",
  "below","some","other","new","high","level","years","year",
  // Document-structure words that leak into JD skill terms
  "requirements","requirement","responsibilities","responsibility",
  "qualifications","qualification","overview","compensation","benefits",
  "description","summary","objective","mission","culture","vision",
]);

// ── Entity blocklist ─────────────────────────────────────────────────────────────
// Well-known company names and generic corporate tokens to exclude from JD skill
// terms so candidates are never penalised for not listing an employer name.

const ENTITY_BLOCKLIST = new Set([
  // Big tech
  "google","microsoft","amazon","apple","meta","facebook","netflix",
  "twitter","linkedin","salesforce","oracle","ibm","intel","nvidia",
  "adobe","atlassian","slack","zoom","dropbox","stripe","openai",
  // Indian IT
  "infosys","wipro","tcs","hcl","cognizant","accenture",
  "capgemini","mindtree","mphasis","genpact","deloitte","mckinsey",
  "techinfosys","technovate","techinnovate",
  // Corporate-suffix tokens that leach through as "skills"
  "technologies","solutions","consulting","services","systems","ventures",
  "incorporated","corporation","limited","private",
]);

// ── Heuristic NER: mid-sentence capitalised words ───────────────────────────────
// Words that appear capitalised in the middle of a sentence (preceded by a
// lowercase letter, comma, colon, or parenthesis + whitespace) are very likely
// proper nouns (org names, locations). Strip them from JD skill terms.
// Exception: known technical skills that happen to be capitalised in bullet points.

const ENTITY_SKIP = new Set([
  "react", "node.js", "nodejs", "sql", "git", "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "typescript", "javascript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php", "swift", "kotlin", "scala", "html", "css", "sass", "less", "graphql", "rest", "grpc", "protobuf", "tcp", "udp", "http", "https", "ssh", "dns", "ssl", "tls", "ci", "cd", "cicd", "ml", "ai", "nlp", "cv", "llm", "rag", "bert", "gpt", "faiss", "hnsw", "ann", "s3", "ec2", "rds", "iam", "vpc", "ci/cd", "pytorch", "tensorflow", "keras", "jax", "huggingface", "transformers", "openai", "anthropic", "cohere", "llama", "milvus", "pinecone", "weaviate", "qdrant", "chroma", "faiss", "hnsw", "ann", "bm25", "ndcg", "mrr", "solidity", "ethereum", "evm", "web3", "defi", "nft", "dao", "hardhat", "foundry", "forge", "slither", "openzeppelin", "polygon", "arbitrum", "optimism", "base", "zksync", "starknet", "substrate", "polkadot", "cosmos", "near", "avalanche", "solana",
  // Android
  "kotlin", "jetpack", "coroutines", "flow", "room", "retrofit", "dagger", "hilt", "junit", "espresso", "gradle", "flutter", "androidx", "navigation", "viewmodel", "livedata", "databinding", "compose", "workmanager",
  // iOS
  "swiftui", "uikit", "combine", "xcode", "xctest", "xcuitest", "fastlane", "spm", "cocoapods", "realm", "rxswift", "testflight", "objective-c", "alamofire", "kingfisher", "xcodebuild",
  // MLOps
  "mlflow", "kubeflow", "airflow", "prefect", "dagster", "terraform", "prometheus", "grafana", "fastapi", "seldon", "kserve", "pipeline", "ray", "sagemaker",
  // Data Engineer
  "spark", "dbt", "snowflake", "bigquery", "flink", "clickhouse", "datahub", "databricks", "iceberg", "hudi", "etl", "elt",
  // Cyber Security
  "siem", "splunk", "crowdstrike", "sentinelone", "wiz", "orca", "prisma", "burp", "nmap", "metasploit", "nist", "falco", "tetragon", "cilium", "ebpf", "osquery", "iam", "pam", "sentinel", "soar",
  // DevSecOps
  "sast", "dast", "sca", "snyk", "checkmarx", "sonarqube", "trivy", "falco", "kyverno", "opa", "vault", "cosign", "sigstore", "slsa", "sbom", "cspm", "cwpp",
]);

function extractEntityWords(text: string): Set<string> {
  const entities = new Set<string>();
  const re = /(?<=[a-z,;:(]\s)([A-Z][a-zA-Z]{2,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const entity = m[1].toLowerCase();
    if (!ENTITY_SKIP.has(entity)) entities.add(entity);
  }
  return entities;
}

// ── Stemmer ──────────────────────────────────────────────────────────────────────
// Conservative suffix-stripping lemmatiser. Runs a single pass (no recursion).
// Minimum stem length: 4 characters. Catches the most common English inflections
// relevant to professional skills (management/managing, analysis/analytical, etc.).

function stemWord(w: string): string {
  const rules: [string, string][] = [
    ["ization","ize"], ["isation","ize"], ["ations","ate"], ["ation","ate"],
    ["ments",""],      ["ment",""],       ["nesses",""],    ["ness",""],
    ["ities",""],      ["ity",""],        ["ings",""],      ["ing",""],
    ["ated",""],       ["ered",""],       ["ied","y"],
    ["eed","ee"],      ["ed",""],
    ["iers","y"],      ["ier","y"],       ["ers",""],       ["ors",""],
    ["er",""],         ["or",""],
    ["ical",""],       ["ics","ic"],      ["ies","y"],
    ["izes",""],       ["ize",""],        ["ises",""],      ["ise",""],
    ["tly","t"],       ["ally",""],       ["ly",""],
    ["al",""],         ["ant",""],        ["ent",""],
    ["ist",""],        ["ism",""],        ["ful",""],       ["ous",""],
    ["ive",""],        ["able",""],       ["ible",""],
    ["s",""],
  ];
  for (const [suffix, replacement] of rules) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, w.length - suffix.length) + replacement;
      if (stem.length >= 4) return stem;
    }
  }
  return w;
}

/** Stem → frequency map for resume text (used for lemmatised matching). */
function stemFreq(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (const w of words) {
    const s = stemWord(w);
    freq.set(s, (freq.get(s) ?? 0) + 1);
  }
  return freq;
}

// ── Generic hiring words blacklist ─────────────────────────────────────────────────
// These are English words that appear frequently in JDs but are not technical skills.
// They should not outrank actual technology names.

const GENERIC_HIRING_WORDS = new Set([
  "basic", "nice", "good", "excellent", "full", "building", "development",
  "experience", "knowledge", "awareness", "ability", "degree", "equivalent",
  "strong", "solid", "proficient", "expert", "skilled", "familiar",
  "understanding", "background", "exposure", "comfortable", "confident",
  "competent", "capable", "qualified", "eligible", "suitable", "fit",
  "years", "year", "plus", "minimum", "preferred", "required", "must",
  "should", "nice", "have", "bonus", "advantage", "asset", "benefit",
  "looking", "seeking", "hiring", "join", "team", "role", "position",
  "work", "job", "candidate", "person", "individual", "professional",
  "senior", "junior", "mid", "lead", "principal", "staff", "manager",
  "director", "head", "vp", "cto", "ceo", "founder", "owner",
  // Weak English business words that pollute strength/gap explanations
  "working", "better", "highly", "across", "applications", "developers",
  "product", "designing", "building", "creating", "improve", "improving",
  "enhance", "enhancing", "optimize", "optimizing", "scale", "scaling",
  "manage", "managing", "lead", "leading", "drive", "driving", "deliver",
  "delivering", "support", "supporting", "collaborate", "collaborating",
  "communicate", "communicating", "analyze", "analyzing", "design", "develop",
  "implement", "implementing", "build", "building", "create", "creating", "develop", "developing", "maintain", "maintaining", "monitor", "monitoring", "troubleshoot", "troubleshooting", "debug", "debugging", "test", "testing", "deploy", "deploying", "release", "releasing", "ship", "shipping"
]);

// ── Short technical acronyms that should pass the length filter ──────────────────
const SHORT_TECH_ACRONYMS = new Set([
  "sql", "git", "api", "aws", "gcp", "k8s", "ci", "cd", "ci/cd", "cicd",
  "ml", "ai", "nlp", "cv", "llm", "rag", "bm25", "hnsw", "ann", "s3",
  "ec2", "rds", "iam", "vpc", "dns", "ssl", "tls", "ssh", "http", "https",
  "grpc", "soap", "orm", "orm", "crud", "rest", "soap", "json", "yaml",
  "toml", "ini", "env", "dev", "prod", "stg", "qa", "uat", "ci", "cd",
]);

// ── Term frequency ───────────────────────────────────────────────────────────────

export function termFrequency(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\+\#\.\/]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    .filter((w) => (w.length > 3 || SHORT_TECH_ACRONYMS.has(w)) && !STOP.has(w));
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

// ── Technical skill dictionary ────────────────────────────────────────────────────
// Known technologies that should be boosted above generic words.
// Covers the major ecosystems relevant to our candidate pool.

const TECH_SKILLS = new Set([
  // Languages
  "javascript", "typescript", "python", "java", "go", "golang", "rust",
  "c++", "c#", "csharp", "ruby", "php", "swift", "kotlin", "scala",
  "clojure", "haskell", "elixir", "erlang", "dart", "r", "matlab",
  "sql", "nosql", "graphql", "rest", "grpc", "protobuf",
  // Frontend
  "react", "vue", "angular", "svelte", "next.js", "nextjs", "nuxt",
  "remix", "gatsby", "webpack", "vite", "rollup", "esbuild",
  "tailwind", "css", "html", "sass", "less", "styled-components",
  // Backend
  "node.js", "nodejs", "express", "nestjs", "fastify", "koa",
  "django", "flask", "fastapi", "spring", "springboot", "rails",
  "laravel", "gin", "echo", "fiber", "actix", "rocket",
  // Databases
  "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
  "cassandra", "dynamodb", "firebase", "supabase", "planetscale",
  "cockroachdb", "timescaledb", "sqlite", "mariadb", "neo4j",
  // Cloud & DevOps
  "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "helm",
  "terraform", "ansible", "jenkins", "github", "gitlab", "bitbucket",
  "ci/cd", "cicd", "argocd", "flux", "prometheus", "grafana",
  "datadog", "newrelic", "sentry", "cloudflare", "vercel", "netlify",
  // ML/AI
  "pytorch", "tensorflow", "keras", "jax", "huggingface", "transformers",
  "bert", "gpt", "llm", "llms", "rag", "fine-tuning", "lora", "qlora",
  "sentence-transformers", "openai", "anthropic", "cohere", "llama",
  "mlops", "mlflow", "kubeflow", "airflow", "prefect", "dagster",
  "faiss", "hnsw", "ann", "milvus", "pinecone", "weaviate", "qdrant",
  "chroma", "embeddings", "vector", "semantic", "search", "retrieval",
  "ranking", "recommendation", "recsys", "nlp", "cv", "computer-vision",
  // Blockchain
  "solidity", "ethereum", "evm", "web3", "defi", "nft", "dao",
  "hardhat", "foundry", "forge", "slither", "openzeppelin",
  "polygon", "arbitrum", "optimism", "base", "zksync", "starknet",
  "substrate", "polkadot", "cosmos", "near", "avalanche", "solana",
  // Testing & Quality
  "jest", "vitest", "cypress", "playwright", "pytest", "junit",
  "testing-library", "eslint", "prettier", "husky", "lint-staged",
  // Design & UX
  "figma", "design-system", "user-research", "wireframes",
  "prototypes", "prototyping", "usability-testing", "interaction-design",
  "visual-design", "ui-design", "ux-design", "design-tokens",
  // Security
  "siem", "splunk", "zero-trust", "iam", "p-trust", "soc", "incident-response",
  "threat-modeling", "vulnerability-management", "penetration-testing",
  // Other
  "git", "github", "gitlab", "bitbucket", "jira", "confluence",
  "agile", "scrum", "kanban", "microservices", "monolith",
  "api", "apis", "rpc", "grpc", "message-queue", "kafka", "rabbitmq",
  "nginx", "apache", "linux", "bash", "ssh", "vpn",
  // Android
  "kotlin", "jetpack compose", "coroutines", "flow", "room", "retrofit",
  "dagger", "hilt", "junit", "espresso", "gradle", "android sdk",
  "flutter", "jetpack", "multi-module", "androidx", "navigation",
  "viewmodel", "livedata", "databinding", "compose", "workmanager",
  // iOS
  "swift", "swiftui", "uikit", "combine", "core data", "xcode",
  "xctest", "xcuitest", "fastlane", "spm", "cocoapods", "realm",
  "rxswift", "app store connect", "testflight", "objective-c",
  "core animation", "core graphics", "alamofire", "kingfisher",
  "swift package manager", "xcodebuild", "provisioning", "code signing",
  // MLOps
  "mlflow", "kubeflow", "airflow", "prefect", "dagster", "terraform",
  "prometheus", "grafana", "fastapi", "seldon", "kserve", "mlflow tracking",
  "model registry", "feature store", "model monitoring", "drift detection",
  "pipeline", "kubeflow pipelines", "argo workflows", "ray", "sagemaker",
  // Data Engineer
  "spark", "airflow", "dbt", "snowflake", "bigquery", "delta lake", "parquet",
  "flink", "clickhouse", "datahub", "databricks", "kafka streams", "ksql",
  "iceberg", "hudi", "partitioning", "bucketing", "data lake", "lakehouse",
  "etl", "elt", "data pipeline", "data quality", "great expectations",
  // Cyber Security
  "siem", "splunk", "elastic", "crowdstrike", "sentinelone", "wiz", "orca",
  "prisma cloud", "burp suite", "nmap", "metasploit", "mitre att&ck", "nist",
  "soc 2", "iso 27001", "falco", "tetragon", "cilium", "ebpf", "osquery",
  "zero trust", "iam", "pam", "privileged access", "threat hunting",
  "incident response", "forensics", "vulnerability scanning", "penetration testing",
  "sentinel", "soar",
  // DevSecOps
  "sast", "dast", "sca", "snyk", "checkmarx", "sonarqube", "trivy", "falco",
  "kyverno", "opa", "hashicorp vault", "gitlab ci", "github actions",
  "cosign", "sigstore", "slsa", "sbom", "cspm", "cwpp", "admission controller",
  "policy as code", "supply chain security", "container scanning", "image signing",
]);

function isTechnicalSkill(term: string): boolean {
  const lower = term.toLowerCase();
  // Direct match
  if (TECH_SKILLS.has(lower)) return true;
  // Fuzzy: contains known tech as word boundary
  for (const tech of TECH_SKILLS) {
    if (tech.length >= 3 && lower.includes(tech)) {
      // Check word boundaries to avoid false positives
      const idx = lower.indexOf(tech);
      const before = idx === 0 || /[^a-z0-9]/.test(lower[idx - 1]);
      const after = idx + tech.length === lower.length || /[^a-z0-9]/.test(lower[idx + tech.length]);
      if (before && after) return true;
    }
  }
  return false;
}

// ── Section-aware JD term extraction ───────────────────────────────────────────────
// Splits JD into sections, weights by importance, filters generic words,
// boosts technical skills, ensures ≥60% technical in final output.

function splitJdIntoSections(jd: string): Map<string, string> {
  const sections = new Map<string, string>();
  let currentSection = "header";
  const lines = jd.split("\n");

  for (const line of lines) {
    const headerMatch = line.match(/^(requirements?|qualifications?|nice\.to\.have|preferred|skills?|responsibilities?|duties?|about|overview|company|benefits?|compensation|what\.you\.ll\.do|what\.we\.look\.for)\s*:?/i);
    if (headerMatch) {
      currentSection = headerMatch[1].toLowerCase().replace(/\s+/g, ".");
      sections.set(currentSection, "");
    } else {
      const existing = sections.get(currentSection) || "";
      sections.set(currentSection, existing + " " + line);
    }
  }
  return sections;
}

const sectionWeights: Record<string, number> = {
  "requirements": 2.5, "requirement": 2.5,
  "qualifications": 2.5, "qualification": 2.5,
  "skills": 2.0, "skill": 2.0,
  "preferred": 2.0, "nice.to.have": 1.8,
  "responsibilities": 1.5, "duties": 1.5,
  "what.you.ll.do": 1.5, "what.we.look.for": 2.0,
  "header": 0.3, "overview": 0.3, "about": 0.3,
  "company": 0.3, "benefits": 0.3, "compensation": 0.3,
};

export function extractJdTerms(jd: string, limit = 25): string[] {
  const entityWords = extractEntityWords(jd);
  const sections = splitJdIntoSections(jd);

  // Collect weighted frequencies
  const weightedFreq = new Map<string, { weight: number; isTech: boolean }>();

  for (const [section, text] of sections) {
    const weight = sectionWeights[section] ?? 1.0;
    const freq = termFrequency(text);

    for (const [term, count] of freq) {
      if (entityWords.has(term) || ENTITY_BLOCKLIST.has(term) || GENERIC_HIRING_WORDS.has(term)) {
        continue;
      }
      const isTech = isTechnicalSkill(term);
      const boostedWeight = isTech ? weight * 1.5 : weight;
      const existing = weightedFreq.get(term);
      if (existing) {
        existing.weight += count * boostedWeight;
      } else {
        weightedFreq.set(term, { weight: count * boostedWeight, isTech });
      }
    }
  }

  // Sort: tech skills first (by weight), then non-tech (by weight)
  const sorted = [...weightedFreq.entries()]
    .sort((a, b) => {
      // Tech skills rank higher
      if (a[1].isTech !== b[1].isTech) return b[1].isTech ? -1 : 1;
      // Within same category, sort by weight
      return b[1].weight - a[1].weight;
    });

  // Ensure ≥60% technical in final output
  const techTerms = sorted.filter(([, v]) => v.isTech).map(([k]) => k);
  const nonTechTerms = sorted.filter(([, v]) => !v.isTech).map(([k]) => k);
  const minTech = Math.ceil(limit * 0.6);

  const final: string[] = [];
  // Add tech terms first
  for (const t of techTerms) {
    if (final.length >= limit) break;
    final.push(t);
  }
  // Fill remaining with non-tech
  for (const t of nonTechTerms) {
    if (final.length >= limit) break;
    final.push(t);
  }
  // If still short on tech (edge case), pad with top remaining
  if (techTerms.length < minTech && final.length < limit) {
    for (const t of nonTechTerms) {
      if (final.length >= limit) break;
      if (!final.includes(t)) final.push(t);
    }
  }
  // Enforce minimum term count to prevent score inflation on sparse JDs
  const MIN_TERMS = 8;
  if (final.length < MIN_TERMS) {
    for (const t of nonTechTerms) {
      if (final.length >= MIN_TERMS) break;
      if (!final.includes(t)) final.push(t);
    }
  }

  return final.slice(0, limit);
}

// ── Match result ─────────────────────────────────────────────────────────────────

export interface MatchResult {
  score: number;
  matched: string[];   // exact + lemma matched JD terms → shown as Strengths
  missing: string[];   // unmatched JD terms → shown as Gaps
  verdict: string;
}

export function verdictFor(score: number): string {
  if (score >= 75) return "Strong Match";
  if (score >= 60) return "Interview Recommended";
  if (score >= 44) return "Borderline";
  return "Not Yet Competitive";
}

// ── Scoring ──────────────────────────────────────────────────────────────────────

const SEM_THRESHOLD  = 0.25; // cosine below this → no semantic bonus (lowered from 0.40 so sparse profiles still receive proportional credit)
const SEM_SCALE      = 0.75; // effective cosine range: [0.25, 1.0]
const SEM_MAX_BOOST  = 40;   // max points added on top of keyword score

function computeScore(
  exactCount: number,
  lemmaCount: number,
  total: number,
  semanticSim?: number,
  haystackWordCount?: number,
): number {
  // Use the smaller of the JD term count and 2× the haystack word count so that
  // sparse candidate profiles (e.g. 3 skill tags from a CSV with no resume column)
  // are not buried under a 25-term denominator that no short text can overcome.
  // Floor at 12 so that JDs with very few extracted terms don't inflate scores.
  const MIN_EFFECTIVE_TOTAL = 12;
  const effectiveTotal = Math.max(
    MIN_EFFECTIVE_TOTAL,
    haystackWordCount !== undefined ? Math.min(total, haystackWordCount * 2) : total,
    1,
  );
  const keywordScore = (exactCount / effectiveTotal) * 100 + (lemmaCount / effectiveTotal) * 50;
  let semanticBonus = 0;
  if (semanticSim !== undefined) {
    const norm = Math.max(0, (semanticSim - SEM_THRESHOLD) / SEM_SCALE);
    semanticBonus = norm * SEM_MAX_BOOST;
  }
  return Math.min(100, Math.max(0, Math.round(keywordScore + semanticBonus)));
}

/**
 * Score a resume against pre-extracted JD terms.
 * Reuses the same term list across a batch for consistent ranking.
 *
 * @param resume     Combined resume + skills + experience text
 * @param jdTerms    Output of extractJdTerms()
 * @param semanticSim Optional cosine similarity from the embedding model (0–1).
 *                    When provided, adds up to 40 bonus points for conceptual alignment.
 *                    When omitted, falls back to keyword-only scoring (legacy behaviour).
 */
export function scoreResumeAgainstTerms(
  resume: string,
  jdTerms: string[],
  semanticSim?: number,
): MatchResult {
  const resumeLower = resume.toLowerCase();
  const resumeStems = stemFreq(resume);

  const exactMatched: string[] = [];
  const lemmaOnlyMatched: string[] = [];
  const missing: string[] = [];

  for (const term of jdTerms) {
    if (resumeLower.includes(term)) {
      exactMatched.push(term);
    } else {
      const termStem = stemWord(term);
      if (resumeStems.has(termStem)) {
        lemmaOnlyMatched.push(term);
      } else {
        missing.push(term);
      }
    }
  }

  const haystackWordCount = resume.split(/\s+/).filter(Boolean).length;
  const score = computeScore(
    exactMatched.length,
    lemmaOnlyMatched.length,
    jdTerms.length,
    semanticSim,
    haystackWordCount,
  );

  return {
    score,
    matched: [...exactMatched, ...lemmaOnlyMatched],
    missing,
    verdict: verdictFor(score),
  };
}

/** Convenience: extract terms then score (single-candidate path, no embeddings). */
export function scoreCandidateAgainstJd(jd: string, resume: string): MatchResult {
  return scoreResumeAgainstTerms(resume, extractJdTerms(jd));
}

/** Title-case a single matched/missing term for display. */
export function capTerm(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}

// ── Batch ranking ──────────────────────────────────────────────────────────────

export interface RankedCandidate {
  rank: number;
  name: string;
  score: number;
  experience: string;
  verdict: string;
  matched: string[];            // JD terms confirmed present (exact or lemma)
  missing: string[];            // JD terms absent
  note: string;                 // one-line recruiter summary
  semanticEvidence?: string[];  // resume sentences that drove the semantic score
}