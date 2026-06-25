"""
JD intent document + positive exemplars used as the semantic query.
Derived from relevance_rubric.md (the *meaning* of the JD, not its literal text).
"""
JD_INTENT = (
    "Senior AI Engineer for a product company who owns the candidate ranking, retrieval and "
    "matching systems. Ideal background: five to nine years of experience with four to five years "
    "in applied machine learning at product companies, not services or consulting firms. Has "
    "personally built and shipped to production an end to end search, ranking, recommendation or "
    "information retrieval system serving real users at meaningful scale. Deep hands on experience "
    "with embeddings based retrieval, semantic search, vector databases such as FAISS, Pinecone, "
    "Weaviate, Qdrant, Milvus, OpenSearch or Elasticsearch, and hybrid search infrastructure. "
    "Designs rigorous offline evaluation for ranking systems using NDCG, MRR and MAP, with offline "
    "to online correlation and A/B testing. Strong Python engineering and code quality. Understood "
    "retrieval and ranking before large language models became fashionable, with pre 2021 machine "
    "learning production experience. Comfortable with re-ranking, learning to rank, two tower models, "
    "collaborative filtering and personalization. A scrappy product engineer who ships fast rather "
    "than a pure researcher. Located in or willing to relocate to Pune or Noida in India."
)

JD_EXEMPLARS = [
    "Built and deployed recommendation and ranking models for a product's discovery feed and owned "
    "the offline to online evaluation that decided which models shipped.",
    "Implemented semantic search and embeddings based retrieval backed by a vector database serving "
    "production traffic at scale.",
    "Applied machine learning engineer at a product startup who shipped search relevance, re-ranking "
    "and personalization to real users.",
    "Designed the retrieval and ranking layer of a marketplace, matching users to the most relevant "
    "items using learning to rank and embeddings.",
]
