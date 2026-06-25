"""
Phase 2 — taxonomies & dictionaries (grounded in mined candidates.jsonl vocabularies).
Title classes, company product/services classification, location tiers,
and word-boundary keyword scanners for IR / ML / evaluation / deployment evidence.
"""
import re

# ---------------------------------------------------------------- TITLES
CORE_ML_TITLES = {
    "ml engineer", "machine learning engineer", "senior ml engineer", "junior ml engineer",
    "applied ml engineer", "ai engineer", "senior software engineer (ml)",
    "recommendation systems engineer", "search engineer", "nlp engineer",
    "data scientist", "senior data scientist", "ai specialist", "ai research engineer",
    "research engineer", "applied scientist", "machine learning scientist", "ranking engineer",
}
ML_ADJACENT_TITLES = {
    "data engineer", "senior data engineer", "analytics engineer", "data analyst",
    "backend engineer", "ml platform engineer", "mlops engineer",
}
SWE_GENERIC_TITLES = {
    "software engineer", "senior software engineer", "full stack developer", "java developer",
    ".net developer", "cloud engineer", "devops engineer", "mobile developer",
    "frontend engineer", "qa engineer", "sde", "web developer",
}
NON_ENG_TITLES = {
    "business analyst", "hr manager", "mechanical engineer", "accountant", "project manager",
    "customer support", "operations manager", "content writer", "sales executive",
    "civil engineer", "graphic designer", "marketing manager",
}

def classify_title(title: str) -> str:
    """Return one of: core_ml, ml_adjacent, swe_generic, non_eng."""
    t = (title or "").strip().lower()
    if t in CORE_ML_TITLES: return "core_ml"
    if t in ML_ADJACENT_TITLES: return "ml_adjacent"
    if t in SWE_GENERIC_TITLES: return "swe_generic"
    if t in NON_ENG_TITLES: return "non_eng"
    # regex fallback
    if re.search(r"\b(machine learning|ml engineer|data scientist|applied scientist|"
                 r"nlp|recommendation|recommender|search engineer|ranking|llm engineer)\b", t):
        return "core_ml"
    if re.search(r"\b(data engineer|analytics engineer|data analyst|ml platform|mlops)\b", t):
        return "ml_adjacent"
    if re.search(r"\b(developer|software engineer|sde|devops|frontend|backend|full[- ]?stack|qa)\b", t):
        return "swe_generic"
    return "non_eng"

def title_is_research(title: str) -> bool:
    return bool(re.search(r"\bresearch\b", (title or "").lower()))

def title_is_cv(title: str) -> bool:
    return bool(re.search(r"\b(computer vision|cv engineer|vision|image|speech|robotics)\b",
                          (title or "").lower()))

# ---------------------------------------------------------------- COMPANIES
SERVICES_COMPANIES = {
    "infosys", "wipro", "tcs", "tata consultancy services", "hcl", "tech mahindra", "mphasis",
    "cognizant", "capgemini", "accenture", "mindtree", "ltimindtree", "genpact",
    "deloitte", "pwc", "kpmg", "ey", "ibm", "dxc", "hexaware", "birlasoft",
}
PRODUCT_COMPANIES = {
    "swiggy", "zomato", "flipkart", "razorpay", "cred", "meesho", "nykaa", "inmobi", "zoho",
    "ola", "vedantu", "byju's", "byjus", "policybazaar", "paytm", "freshworks", "upgrad",
    "pharmeasy", "phonepe", "dream11", "unacademy", "myntra", "groww", "zepto", "urban company",
    "delhivery", "browserstack", "postman", "chargebee", "druva", "icertis",
}
AI_PRODUCT_COMPANIES = {
    "sarvam ai", "sarvam", "krutrim", "haptik", "verloop.io", "verloop", "niramai", "saarthi.ai",
    "saarthi", "wysa", "mad street den", "rephrase.ai", "rephrase", "aganitha", "glance",
    "genpact ai", "gupshup", "yellow.ai", "observe.ai", "uniphore", "fractal", "mad street",
    "kogo", "sprinklr", "entropik",
}
# fictional placeholders present in dataset -> neutral (cannot infer product/services)
FICTIONAL_COMPANIES = {
    "wayne enterprises", "initech", "pied piper", "acme corp", "globex inc", "hooli",
    "dunder mifflin", "stark industries",
}
SERVICES_INDUSTRIES = {"it services", "consulting"}
PRODUCT_INDUSTRIES = {"software", "fintech", "food delivery", "e-commerce", "edtech", "saas",
                      "adtech", "healthtech", "gaming", "insurance tech", "transportation", "internet"}
AI_INDUSTRIES = {"ai/ml", "ai services", "conversational ai", "voice ai", "healthtech ai"}

def classify_company(name: str, industry: str = "") -> str:
    """Return: services | ai_product | product | neutral."""
    n = (name or "").strip().lower()
    ind = (industry or "").strip().lower()
    if n in AI_PRODUCT_COMPANIES or ind in AI_INDUSTRIES: return "ai_product"
    if n in SERVICES_COMPANIES: return "services"
    if n in PRODUCT_COMPANIES: return "product"
    if n in FICTIONAL_COMPANIES: return "neutral"
    # industry fallback for unknown names
    if ind in SERVICES_INDUSTRIES: return "services"
    if ind in PRODUCT_INDUSTRIES: return "product"
    return "neutral"

# ---------------------------------------------------------------- LOCATIONS
LOC_TIER_A = {"pune", "noida"}
LOC_TIER_B = {"hyderabad", "mumbai", "delhi", "gurgaon", "gurugram"}  # +Noida already A; Delhi NCR
INDIA_CITIES = {
    "bhubaneswar", "noida", "hyderabad", "jaipur", "bangalore", "bengaluru", "kolkata", "indore",
    "pune", "chennai", "delhi", "trivandrum", "thiruvananthapuram", "ahmedabad", "chandigarh",
    "coimbatore", "vizag", "visakhapatnam", "kochi", "mumbai", "gurgaon", "gurugram",
}
def parse_city(location: str) -> str:
    return (location or "").split(",")[0].strip().lower()

def location_tier(location: str, country: str) -> tuple:
    """Return (tier_label, tier_score, is_india)."""
    city = parse_city(location)
    is_india = (country or "").strip().lower() == "india" or city in INDIA_CITIES
    if city in LOC_TIER_A: return ("A", 1.00, is_india)
    if city in LOC_TIER_B: return ("B", 0.85, is_india)
    if is_india: return ("C", 0.60, True)
    return ("D", 0.25, False)  # international: visa caveat in JD

# ---------------------------------------------------------------- EDUCATION
ML_FIELDS = {"data science", "machine learning", "artificial intelligence", "computer science",
             "statistics", "mathematics", "information technology", "computer engineering",
             "electronics"}
TIER_RANK = {"tier_1": 1, "tier_2": 2, "tier_3": 3, "tier_4": 4, "unknown": 5}

# ---------------------------------------------------------------- EVIDENCE KEYWORDS
STRONG_IR = [
    "retrieval", "information retrieval", "ranking", "re-rank", "rerank", "re-ranking",
    "recommendation", "recommender", "recsys", "learning to rank", "ltr", "ndcg", "mrr",
    "bm25", "semantic search", "vector search", "two-tower", "candidate generation",
    "search relevance", "personalization", "personalisation", "matrix factorization",
    "collaborative filtering", "faiss", "pinecone", "weaviate", "qdrant", "milvus",
    "opensearch", "elasticsearch", "approximate nearest neighbor", "ann index", "knn",
]
MED_ML = [
    "embedding", "embeddings", "sentence-transformer", "sentence transformers", "bert", "distilbert",
    "transformer", "transformers", "nlp", "natural language", "fine-tune", "fine-tuning", "fine-tuned",
    "pytorch", "tensorflow", "hugging face", "huggingface", "named entity", "text classification",
    "lora", "qlora", "peft", "xgboost", "lightgbm", "gradient boosted", "scikit-learn", "sklearn",
]
WEAK_HYPE = ["llm", "llms", "rag", "gpt", "openai", "langchain", "llamaindex", "prompt engineering",
             "generative ai", "gen ai"]
EVAL_TERMS = ["ndcg", "mrr", "map@", "mean average precision", "a/b test", "a/b testing", "ab test",
              "offline-online", "offline/online", "recall@", "precision@", "evaluation framework",
              "offline metric", "online metric", "holdout"]
DEPLOY_TERMS = ["shipped", "deployed", "in production", "production", "real users", "serving",
                "model serving", "inference service", "latency", "throughput", "p99", "low-latency",
                "rolled out", "launched"]
SCALE_TERMS = ["at scale", "millions", "billions", "qps", "requests per second", "requests/sec",
               "gb of", "tb of", "petabyte", "high traffic", "daily active", "500gb", "100k", "1m"]
NLP_IR_DOMAIN = ["nlp", "natural language", "text", "retrieval", "search", "recommendation",
                 "ranking", "information retrieval", "embedding", "language model"]
CV_SPEECH_ROBOTICS = ["computer vision", "image", "object detection", "segmentation", "resnet",
                      "opencv", "speech", "asr", "audio", "robotics", "lidar", "pose", "ocr",
                      "video", "vision"]

def _compile(words):
    # word-boundary alternation; longer phrases first so they win
    parts = sorted({re.escape(w) for w in words}, key=len, reverse=True)
    return re.compile(r"(?<![\w])(" + "|".join(parts) + r")(?![\w])", re.IGNORECASE)

RX = {k: _compile(v) for k, v in {
    "strong_ir": STRONG_IR, "med_ml": MED_ML, "weak_hype": WEAK_HYPE, "eval": EVAL_TERMS,
    "deploy": DEPLOY_TERMS, "scale": SCALE_TERMS, "nlp_ir": NLP_IR_DOMAIN, "cv": CV_SPEECH_ROBOTICS,
}.items()}

def scan_text(text: str) -> dict:
    """Return distinct-keyword hit counts per evidence category over the given text."""
    t = (text or "").lower()
    out = {}
    for cat, rx in RX.items():
        hits = set(m.lower() for m in rx.findall(t))
        out[cat] = len(hits)
    return out
