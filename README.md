# MedCMU HPC Documentation

Welcome to the official repository for the **MedCMU HPC Documentation**. This platform provides detailed guides, tutorials, and reference material for users of the **High-Performance Computing (HPC)** infrastructure at the **Faculty of Medicine, Chiang Mai University (MedCMU)**.

This documentation site is built using **Docusaurus**, a modern static website generator optimized for project documentation.

## Overview

MedCMU HPC provides powerful computational resources for medical and health science research. This repository hosts the documentation for setting up and using the HPC system, including details on job scheduling, containerized environments, file management, and more.

Key sections of the documentation include:

- **Getting Started**: Learn how to access the HPC system and register for an account.
- **Software & Tools**: Find details on available software packages, including those for bioinformatics, medical imaging, and deep learning.
- **Job Submission**: Understand how to use SLURM to manage your jobs on the cluster.
- **Containerization**: Guides on using Apptainer containers for consistent and portable environments.
- **Support & Troubleshooting**: Get assistance with common issues and how to contact support.

## Features

- **Easy Navigation**: Docusaurus offers a simple, user-friendly interface for exploring the documentation.
- **Customizable**: The platform can be easily customized to suit the evolving needs of MedCMU HPC.
- **Versioned Documentation**: Keep track of different versions of the documentation and update it as the infrastructure and tools evolve.
- **Searchable Content**: Quickly find information with the built-in search functionality.

## Local Development

To contribute or run the MedCMU HPC documentation locally, follow these steps:

### Prerequisites

- Node.js >= 18.0.0
- NPM
- Python 3 (For parsing software documentation)

### 1. Installation

Clone the repository and install the standard Docusaurus dependencies:

```bash
git clone https://github.com/MedCMU-Research/hpc-docs.git
cd medcmu-hpc
npm install
```

### 2. Updating Software Tables

The **Installed Software & Environments** list is dynamically generated via a Python script. If you need to add or remove software from the cluster's manifest:

1. Update `software_summary.txt`.
2. Run the parser:
   ```bash
   python3 parse_software.py
   ```
   This will automatically re-build `src/components/SoftwareData.js` allowing the React data-table to update universally.

### 3. Start Development Server

You can launch a hot-reloading development server utilizing either your local Node.js environment or isolated inside Docker.

**Option A: Local Node.js**

```bash
npm run start
```

**Option B: Docker Compose (Isolated Dev Environment)**
A separate `docker-compose.dev.yml` is provided for isolated hot-reloading. You can spin it up with:

```bash
docker compose -f docker-compose.dev.yml up
```

Regardless of which option you pick, the site will instantly become accessible at `http://localhost:3000`.

---

## Production Deployment

### Building for Production

To build a static, highly-optimized version of the site for server deployment, run:

```bash
npm run build
```

This command compiles all `.mdx` documents and React components (e.g., `<SlurmGenerator />` and `<ApptainerRStudioGenerator />`) into the `build/` directory.

### Running with Docker (Staging)

You can test the exact production state by running the provided Docker Compose configuration:

```bash
# Build and start the container
docker compose up -d --build
```

Access the staged static production site at `http://localhost:8080`.

To stop the container:

```bash
docker compose down
```

---

## LLM Context

This project includes an `/llms.txt` file to help Large Language Models (LLMs) understand the documentation structure.

- **URL:** `https://medcmu-hpc.netlify.app/llms.txt` (or `/llms.txt` locally)
- **Usage:** Provide this URL to an LLM to give it context about the available documentation and SOPs.
