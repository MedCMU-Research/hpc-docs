---
title: Instructor Guide: R on HPC Workshop
---

## Overview

This document guides the instructor through preparing and executing the Day 2 hands-on exercise (Section 7: Precision Health Planning). In this exercise, students will simulate processing massive citizen datasets to calculate BMI, classify age generations, and plan health strategies using **SLURM Array Jobs**, **tidyverse**, and **R Apptainer Containers**.

## 1. Preparation Before the Session

### Prepare the Demo Data (`/common/demo/clinical_data/`)

Students will need clinical datasets and the R script to run the final practice exercise.
As the instructor, you need to prepare the mock data in the shared `/common/demo/` directory so all participants can copy it.

Run the following commands on the HPC login node before the _"13.00-13.45 Parallel Processing with Array Jobs"_ session to prepare the data:

```bash
mkdir -p /common/demo/clinical_data
cd /common/demo/clinical_data

# Create an R script to generate 6 mock CSV files for different provinces across Thailand
cat << 'EOF' > generate_data.R
library(tidyverse)
set.seed(42)

# Define precise demographic characteristics for 6 Thai provinces
cohort_profiles <- list(
  list(prov="Chiang Mai", n=130000, age_mean=55, age_sd=15, bmi_mean=23.5, bmi_sd=3.5, desc="Older population (Baby Boomers/Gen X), lower baseline obesity"),
  list(prov="Bangkok", n=250000, age_mean=35, age_sd=10, bmi_mean=26.5, bmi_sd=4.5, desc="Younger (Gen Y/Z), urban lifestyle, higher obesity rate"),
  list(prov="Phuket", n=115000, age_mean=38, age_sd=12, bmi_mean=24.0, bmi_sd=3.0, desc="Working age, active lifestyle, moderate BMI"),
  list(prov="Khon Kaen", n=160000, age_mean=45, age_sd=14, bmi_mean=25.5, bmi_sd=4.0, desc="Agricultural, mixed diet, leaning overweight"),
  list(prov="Chonburi", n=145000, age_mean=42, age_sd=11, bmi_mean=26.0, bmi_sd=4.8, desc="Industrial hub, sedentary jobs, high variance in obesity"),
  list(prov="Songkhla", n=120000, age_mean=46, age_sd=13, bmi_mean=24.5, bmi_sd=3.8, desc="Southern coastal, mixed demographics")
)

for (i in seq_along(cohort_profiles)) {
  p <- cohort_profiles[[i]]

  # Simulate Age based on province-specific mean/sd
  age_sim <- round(rnorm(p$n, mean = p$age_mean, sd = p$age_sd))
  age_sim <- pmax(pmin(age_sim, 100), 12) # Bound between 12 and 100

  # Calculate Birth Date from simulated Age
  birth_year <- 2026 - age_sim
  birth_month <- sprintf("%02d", sample(1:12, p$n, replace = TRUE))
  BirthDate <- paste0(birth_year, "-", birth_month, "-01")
  CaptureDate <- sprintf("2026-01-%02d", sample(1:31, p$n, replace = TRUE))

  # Simulate Height (Mean 160cm)
  HeightCm <- round(rnorm(p$n, mean = 160, sd = 10), 1)
  HeightCm <- pmax(pmin(HeightCm, 195), 135)

  # Simulate BMI based on province-specific profile
  BMI_sim <- rnorm(p$n, mean = p$bmi_mean, sd = p$bmi_sd)
  BMI_sim <- pmax(pmin(BMI_sim, 45), 15) # Bound extreme BMI outliers

  # Back-calculate weight from the simulated BMI and Height
  WeightKg <- round(BMI_sim * (HeightCm/100)^2, 1)

  patient_id <- sprintf("P-%d-%06d", i, 1:p$n)

  data <- data.frame(
    PatientID = patient_id,
    Province = p$prov,
    BirthDate = BirthDate,
    CaptureDate = CaptureDate,
    HeightCm = HeightCm,
    WeightKg = WeightKg
  )

  write.csv(data, sprintf("cohort_%d.csv", i), row.names=FALSE)
  cat(sprintf("Generated %s - %s (%d citizens)\n", sprintf("cohort_%d.csv", i), p$desc, p$n))
}
EOF

# Load Apptainer and R, then generate the data for the workshop
module load apptainer r
apptainer exec $SIF Rscript generate_data.R

# Create the R script that will process these files
cat << 'EOF' > process_bmi.R
# process_bmi.R
library(tidyverse)

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 2) {
  stop("Usage: Rscript process_bmi.R <input_file> <output_file>")
}
input_file <- args[1]
output_file <- args[2]

data <- read_csv(input_file, show_col_types = FALSE)

# Calculate Age, classify Generation, and calculate Asian BMI cutoff
data_processed <- data %>%
  mutate(
    BirthYear = as.numeric(substr(BirthDate, 1, 4)),
    CaptureYear = as.numeric(substr(CaptureDate, 1, 4)),
    Age = CaptureYear - BirthYear,
    Generation = case_when(
      BirthYear >= 1997 ~ "Gen Z",
      BirthYear >= 1981 ~ "Gen Y",
      BirthYear >= 1965 ~ "Gen X",
      BirthYear >= 1946 ~ "Baby Boomer",
      TRUE ~ "Silent Gen"
    ),
    BMI = WeightKg / (HeightCm/100)^2,
    BMI_Category = case_when(
      BMI < 18.5 ~ "Underweight",
      BMI < 23.0 ~ "Normal",
      BMI < 25.0 ~ "Overweight",
      BMI < 30.0 ~ "Obese I",
      TRUE ~ "Obese II"
    )
  )

# Keep only the summarized output for performance
summary_stats <- data_processed %>%
  group_by(Province, Generation, BMI_Category) %>%
  summarise(Total = n(), Avg_Age = mean(Age), Avg_BMI = mean(BMI), .groups = "drop")

write_csv(summary_stats, output_file)
cat("BMI Analysis complete for", input_file, "-> output saved to", output_file, "\n")
EOF

# Make sure permissions are set for everyone to read
chmod -R a+r /common/demo/clinical_data/
```

## 2. Walkthrough: Hands-on Practice Exercise (Section 7)

During the final session, guide the students through Section 7 in the student manual (`docs/hpc-workshop-r.mdx`).

**Step-by-Step Instructor Guide:**

1. **Explain the Scenario (5 mins):**
   - Introduce the problem: We are the National Precision Health Team targeting specific age demographics with behavioral interventions across 6 provinces.
   - We have over 700,000 citizens' data. Doing this locally crashes the computer.
   - Explain how SLURM array jobs paired with Apptainer containers let us analyze each province simultaneously.

2. **Step 7.1: Workspace Preparation (5 mins):**
   - Ask students to execute the `cp -r` command to copy data into their `~/bmi_practice` folder.
   - Ask them to run `wc -l cohort_1.csv` to prove how huge the data is (>100,000 lines per file).

3. **Step 7.2: Reviewing the R Script (5 mins):**
   - Explain the `tidyverse` pipe (`%>%`) and `case_when()` functions which make up `process_bmi.R`.
   - Point out that instead of writing 100,000 rows back to disk, the `summarise()` function reduces the massive dataset into a tiny table of metrics. This is classic MapReduce strategy!

4. **Step 7.3: The SLURM Array Job (10 mins):**
   - Deep dive into `$SLURM_ARRAY_TASK_ID`. Show how it dynamically processes files `1` through `6`.
   - Remind them why we use `module load apptainer r`.

5. **Step 7.4 & 7.5: Submission and RStudio Strategy Synthesis (15 mins):**
   - Have students submit the job: `sbatch submit_bmi_analysis.sh`.
   - Once jobs complete, guide them to open an Interactive **RStudio** session via the Open OnDemand web portal.
   - Ask them to copy the provided R Markdown script into RStudio and execute. Discuss the result and how data scientists provide actionable strategies (e.g. suggesting Gen X interventions where obesity is highest).

## 3. Anticipated Questions & Troubleshooting

- **Q: My SLURM job failed with "No such file or directory" for `logs/`.**
  **A:** SLURM evaluates `#SBATCH --output` _before_ the script runs. If `logs` doesn't exist, the job fails instantly. Run `mkdir logs` before submitting!

- **Q: I get "SIF: unbound variable" when the batch job runs.**
  **A:** This happens if the user accidentally removed `module load apptainer r`, which sets the `$SIF` container variable.

- **Q: Why are we generating summarized CSVs instead of putting all generations in one file?**
  **A:** In real big data, saving massive processed datasets back to a shared disk is famously slow (disk I/O bottlenecks). Aggregating them on the compute node (via Map/Summarize) and writing a tiny CSV back is substantially faster!
