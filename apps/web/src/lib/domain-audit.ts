import { extractJdTerms } from "./matching";

const domains = [
  {
    name: "Frontend",
    jd: `We are looking for a Senior Frontend Engineer to build modern web applications. Requirements: 5+ years React, TypeScript, Next.js, Tailwind CSS, Redux, GraphQL, REST APIs, Jest, Cypress, Git, CI/CD. Nice to have: Vue, Angular, Webpack, Vite, Storybook, Chromatic.`,
  },
  {
    name: "Backend",
    jd: `Senior Backend Engineer needed for scalable microservices. Requirements: Node.js, TypeScript, PostgreSQL, MongoDB, Redis, Kafka, Docker, Kubernetes, AWS, gRPC, REST, GraphQL, Jest, GitHub Actions. Nice to have: Go, Python, Elasticsearch, Terraform.`,
  },
  {
    name: "Android",
    jd: `Android Developer for consumer mobile app. Requirements: Kotlin, Jetpack Compose, Android SDK, Coroutines, Flow, Room, Retrofit, Dagger/Hilt, JUnit, Espresso, Git, Gradle, CI/CD. Nice to have: Flutter, Multi-module architecture, Jetpack libraries.`,
  },
  {
    name: "MLOps",
    jd: `MLOps Engineer to productionize ML models. Requirements: Python, MLflow, Kubeflow, Kubernetes, Docker, Airflow, Prefect, Terraform, AWS, GCP, Prometheus, Grafana, Git, CI/CD, FastAPI, ML model monitoring. Nice to have: Dagster, Seldon, KServe, MLflow tracking.`,
  },
  {
    name: "Data Engineer",
    jd: `Data Engineer for data platform. Requirements: Python, SQL, Spark, Airflow, dbt, Snowflake, BigQuery, Kafka, Docker, Kubernetes, Terraform, Git, CI/CD, Delta Lake, Parquet, AWS, GCP. Nice to have: Flink, ClickHouse, Dagster, Prefect, DataHub.`,
  },
  {
    name: "iOS",
    jd: `Senior iOS Engineer for consumer app. Requirements: Swift, SwiftUI, UIKit, Combine, Core Data, Xcode, Git, CI/CD, XCTest, XCUITest, Fastlane, SPM, CocoaPods. Nice to have: Objective-C, Realm, RxSwift, App Store Connect, TestFlight.`,
  },
  {
    name: "DevOps",
    jd: `DevOps Engineer for cloud infrastructure. Requirements: AWS, GCP, Azure, Kubernetes, Docker, Terraform, Helm, ArgoCD, Prometheus, Grafana, Loki, ELK, GitLab CI, GitHub Actions, Jenkins, Python, Bash, Linux, Networking. Nice to have: Crossplane, Flux, Istio, Vault, Consul.`,
  },
  {
    name: "DevSecOps",
    jd: `DevSecOps Engineer for secure pipelines. Requirements: SAST, DAST, SCA, SAST, Snyk, Checkmarx, SonarQube, Trivy, Falco, Kyverno, OPA, HashiCorp Vault, AWS, GCP, Azure, Kubernetes, Docker, Terraform, GitLab CI, GitHub Actions. Nice to have: Cosign, Sigstore, SLSA, SBOM, CSPM, CWPP.`,
  },
  {
    name: "Machine Learning",
    jd: `ML Engineer for production ML systems. Requirements: Python, PyTorch, TensorFlow, JAX, Hugging Face, Transformers, LangChain, LlamaIndex, RAG, Vector Databases, Pinecone, Weaviate, MLflow, Kubernetes, Docker, AWS, GCP, CUDA, ONNX. Nice to have: vLLM, TGI, Ray, Horovod, DeepSpeed.`,
  },
  {
    name: "Cyber Security",
    jd: `Security Engineer for cloud security. Requirements: AWS, GCP, Azure, Kubernetes, Docker, Terraform, SIEM, Splunk, Elastic, CrowdStrike, SentinelOne, Wiz, Orca, Prisma Cloud, Burp Suite, Nmap, Metasploit, Python, Go, Bash, MITRE ATT&CK, NIST, SOC 2, ISO 27001. Nice to have: Falco, Tetragon, Cilium, eBPF, OSQuery.`,
  },
];

for (const domain of domains) {
  const terms = extractJdTerms(domain.jd, 25);
  console.log(`${domain.name}: ${terms.join(", ")}`);
}