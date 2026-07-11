# Bilingual Speech Recognition

## Description

This project supports a longitudinal study of bilingual language development in a Russian–Tatar family environment. The goal is to automate transcription, speaker identification, language tagging, and corpus management for researchers working with large collections of family audio recordings. The system is designed to reduce manual transcription effort while providing researchers with tools to explore, search, filter, and analyse multilingual speech data collected over an extended period.

## Documentation and Architecture

### Description

Documents and all artifacts can be found in [docs/ folder](docs/). It contains architecture diagrams and decisions, testing information, development process information, another maintained documents. 

Hosted documentation site can be accessed in [Bilingual Speech Recognition Docs](https://swp-team20.github.io/Bilingual-speech-recognition/).

Customer handover artifact with transition process information can be accessed [here](docs/customer-handover.md).

### Directory tree

```text
docs/
├── architecture/
│   ├── adr/
│   │   ├── ADR-001-audio-confidentiality.md
│   │   ├── ADR-002-frontend-build-quality.md
│   │   └── ADR-003-pull-request-compliance.md
│   │
│   ├── deployment-view/
│   │   └── deployment.md
│   │
│   ├── dynamic-view/
│   │   └── dynamic.md
│   │
│   ├── static-view/
│   │   └── static.md
│   │
│   └── README.md
│
├── extra/
│   ├── db_schema_for_team.md
│   ├── ru_tt_pipeline.md
│   └── storage_and_search.md
│
├── customer-handover.md
├── definition-of-done.md
├── deployment.md
├── development-process.md
├── quality-requirements-tests.md
├── quality-requirements.md
├── roadmap.md
├── testing.md
├── user-acceptance-tests.md
└── user-stories.md
```

## Helpful links

To access deployed app in Innopolis University network go to the https://10.93.26.206:5173.

To run this app read the [Setup & Deployment Guide](docs/deployment.md).

To check releases and latest changes consult with the [Changelog](CHANGELOG.md).

To see the current product status and handover scope read the [Customer Handover](/docs/customer-handover.md).
