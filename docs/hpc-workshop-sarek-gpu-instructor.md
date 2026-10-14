---
title: Instructor Guide -- FASTQ to Variants with GPUs Workshop
draft: true
---

## Overview

This document guides HPC Support through preparing the [FASTQ to Variants with GPUs Workshop](./hpc-workshop-sarek-gpu.mdx). Participants run NVIDIA Clara Parabricks on the `gpu` partition and nf-core/sarek 3.10.0 with `--aligner parabricks`, using shared demo data under `/common/demo/sarek`.

## 1. Prepare the Demo Data and Images

```bash
set -euo pipefail
DEMO=/common/demo/sarek
BASE=https://raw.githubusercontent.com/nf-core/test-datasets/modules/data
G=genomics/homo_sapiens/genome
mkdir -p $DEMO/{fastq,ref,sif-cache} $DEMO/testdata/$G/vcf $DEMO/testdata/$G/chr21/germlineresources

# 1. Test FASTQ (normal + tumour)
for f in test_1 test_2 test2_1 test2_2; do
  wget -q -O $DEMO/fastq/$f.fastq.gz $BASE/genomics/homo_sapiens/illumina/fastq/$f.fastq.gz
done

# 2. Mirror the "testdata.nf-core.sarek" reference bundle (paths must match sarek's igenomes.config)
for f in genome.fasta genome.fasta.fai genome.dict genome.interval_list \
         vcf/dbsnp_146.hg38.vcf.gz vcf/dbsnp_146.hg38.vcf.gz.tbi \
         vcf/mills_and_1000G.indels.vcf.gz vcf/mills_and_1000G.indels.vcf.gz.tbi \
         vcf/gnomAD.r2.1.1.vcf.gz vcf/gnomAD.r2.1.1.vcf.gz.tbi \
         chr21/germlineresources/SNP_GRCh38_hg38_wChr.bed; do
  wget -q -O $DEMO/testdata/$G/$f $BASE/$G/$f
done

# 3. Reference + BWA index + known sites for the standalone Parabricks job (Part 3.2)
cp $DEMO/testdata/$G/genome.fasta* $DEMO/ref/
cp $DEMO/testdata/$G/vcf/mills_and_1000G.indels.vcf.gz* $DEMO/ref/
module load bwa/0.7.18 && bwa index $DEMO/ref/genome.fasta

# 4. Parabricks image — the same version sarek 3.10.0 uses (4.7.1-1)
module load apptainer
mkdir -p /common/sif/clara-parabricks
apptainer pull /common/sif/clara-parabricks/4.7.1-1.sif \
     docker://nvcr.io/nvidia/clara/clara-parabricks:4.7.1-1

# 5. Pre-populate the Nextflow container cache: run Part 5 once as instructor
#    with NXF_APPTAINER_CACHEDIR=$DEMO/sif-cache (pulls Parabricks + all CPU tools)
chmod -R a+rX $DEMO /common/sif/clara-parabricks
```

## 2. Checklist Before the Session

- [ ] Nextflow module **≥ 25.10.4** (the documented `nextflow/24.10.0` is too old).
- [ ] `sbatch -A demo -p gpu --gpus=1 --wrap nvidia-smi` works (GRES configured, `demo` allowed on `gpu`).
- [ ] Dry runs of `02_parabricks.sbatch` and of Part 5 end-to-end; note wall times for the slides.
- [ ] **GPU capacity plan:** 4 H100s total. With ~30 participants use teams of 3–4 (≈ 8 GPU runs × 2 GPU tasks each). For one GPU slice per person, MIG partitioning of the H100s is an option — test Parabricks on MIG slices before relying on it.
- [ ] Reserve the GPU nodes for the session (`scontrol create reservation …`) so production jobs don't block the class.
- [ ] Keep a finished `results/` folder in the instructor account as a fallback.
