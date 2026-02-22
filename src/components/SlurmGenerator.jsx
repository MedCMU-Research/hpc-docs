import React, { useState } from "react";
import CodeBlock from '@theme/CodeBlock';

const defaultGeneralScript = `echo "Hello from SLURM!"
# Your logic here`;

const defaultArrayScript = `# Load required modules
module load fastqc/0.12.1

# Define our list of samples (0-indexed array)
sampleList=(sampleA.fq.gz sampleB.fq.gz sampleC.fq.gz sampleD.fq.gz sampleE.fq.gz sampleF.fq.gz sampleG.fq.gz sampleH.fq.gz sampleI.fq.gz sampleJ.fq.gz)

# Get the sample for this specific array task
INPUT_FILE=\${sampleList[$SLURM_ARRAY_TASK_ID]}

echo "Processing $INPUT_FILE on $(hostname)"
fastqc $INPUT_FILE -o out_dir/`;

export default function SlurmGenerator() {
  const [tab, setTab] = useState("general");
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    jobName: "my_job",
    account: "demo",
    partition: "short",
    nodes: 1,
    cpus: 1,
    mem: 8,
    gpus: 0,
    timeHours: 1,
    outputLog: "%x_%j.out",
    errorLog: "%x_%j.err",
    email: "",
    mailType: "ALL",
    script: defaultGeneralScript,
    arrayStart: 0,
    arrayEnd: 9,
    arrayMax: 2,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      let newData = { ...prev, [name]: value };
      const part = newData.partition;

      // When partition changes, re-validate fields against new limits
      if (name === "partition") {
        if (part === "compute" || part === "short") newData.gpus = 0;
        if (part === "short" && newData.timeHours > 8) newData.timeHours = 8;
        if (part === "compute" && newData.mem > 1280) newData.mem = 1280;
        if (part === "gpu" && newData.mem > 384) newData.mem = 384;
        if (part === "gpu" && newData.gpus > 2) newData.gpus = 2;
        if (newData.cpus > 94) newData.cpus = 94;
      }

      // Enforce limits as user types
      if (name === "gpus" && value !== "") {
        let val = parseInt(value, 10) || 0;
        if (part === "compute" || part === "short") val = 0;
        else if (part === "gpu" && val > 2) val = 2;
        newData.gpus = val;
      }

      if (name === "mem" && value !== "") {
        let val = parseInt(value, 10) || 0;
        if (part === "compute" && val > 1280) val = 1280;
        else if (part === "gpu" && val > 384) val = 384;
        newData.mem = val;
      }

      if (name === "cpus" && value !== "") {
        let val = parseInt(value, 10) || 0;
        if (val > 94) val = 94; // Max 94 cores per node for Compute and GPU
        newData.cpus = val;
      }

      if (name === "timeHours" && value !== "") {
        let val = parseInt(value, 10) || 0;
        if (part === "short" && val > 8) val = 8;
        newData.timeHours = val;
      }

      if (name === "nodes" && value !== "") {
        let val = parseInt(value, 10) || 1;
        if (val < 1) val = 1;
        newData.nodes = val;
      }

      return newData;
    });
  };

  const handleTabChange = (newTab) => {
    if (tab === newTab) return;
    setTab(newTab);
    
    setFormData((prev) => {
      let currentScript = prev.script;
      if (newTab === "array" && currentScript === defaultGeneralScript) {
        return { ...prev, script: defaultArrayScript };
      } else if (newTab === "general" && currentScript === defaultArrayScript) {
        return { ...prev, script: defaultGeneralScript };
      }
      return prev;
    });
  };

  const generateScript = () => {
    let script = `#!/bin/bash\n`;
    script += `#SBATCH --job-name=${formData.jobName}\n`;
    if (formData.account && /^(?:[oasw]\d{6}|demo)$/.test(formData.account)) {
      script += `#SBATCH -A ${formData.account}\n`;
    }
    script += `#SBATCH --partition=${formData.partition}\n`;
    
    if (formData.nodes) {
      script += `#SBATCH --nodes=${formData.nodes}\n`;
    }

    if (formData.cpus) {
      script += `#SBATCH --cpus-per-task=${formData.cpus}\n`;
    }
    
    if (formData.mem) {
      script += `#SBATCH --mem=${formData.mem}G\n`;
    }
    
    if (parseInt(formData.gpus) > 0 && formData.partition === "gpu") {
      script += `#SBATCH --gres=gpu:${formData.gpus}\n`;
    }

    const hours = parseInt(formData.timeHours) || 0;
    const formattedTime = `${String(hours).padStart(2, '0')}:00:00`;
    script += `#SBATCH --time=${formattedTime}\n`;

    if (formData.outputLog) {
      script += `#SBATCH --output=${formData.outputLog}\n`;
    }
    if (formData.errorLog) {
      script += `#SBATCH --error=${formData.errorLog}\n`;
    }

    if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      script += `#SBATCH --mail-user=${formData.email}\n`;
      script += `#SBATCH --mail-type=${formData.mailType}\n`;
    }

    if (tab === "array") {
      const maxJobs = parseInt(formData.arrayMax) > 0 ? `%${formData.arrayMax}` : '';
      script += `#SBATCH --array=${formData.arrayStart}-${formData.arrayEnd}${maxJobs}\n`;
    }

    script += `\n# --- Your Script Below ---\n`;
    if (tab === "array") {
      script += `# Note: You can use $SLURM_ARRAY_TASK_ID in your script for array logic.\n`;
    }
    script += `${formData.script}\n`;

    return script;
  };

  const generatedScript = generateScript();

  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedScript], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${formData.jobName}.sbatch`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const labelStyle = { display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: "14px" };
  const inputStyle = { width: "100%", padding: "8px", marginBottom: "16px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" };
  const hintStyle = { display: "block", fontSize: "12px", color: "#666", marginTop: "0", marginBottom: "16px" };
  const tabBtnStyle = (active) => ({
    padding: "10px 20px", 
    cursor: "pointer", 
    border: "None",
    borderBottom: active ? "3px solid #2e8555" : "3px solid transparent",
    backgroundColor: "transparent",
    fontWeight: "bold",
    color: active ? "var(--ifm-color-primary)" : "var(--ifm-font-color-base)",
    fontSize: "16px",
    marginRight: "10px"
  });

  const isAccountValid = formData.account === "" || /^(?:[oasw]\d{6}|demo)$/.test(formData.account);
  const isEmailValid = formData.email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #ddd", marginBottom: "20px" }}>
        <button style={tabBtnStyle(tab === "general")} onClick={() => handleTabChange("general")}>General Job</button>
        <button style={tabBtnStyle(tab === "array")} onClick={() => handleTabChange("array")}>Job Array</button>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* LEFT PANEL: FORM */}
        <div style={{ flex: "1 1 300px", background: "var(--ifm-background-surface-color)", padding: "20px", borderRadius: "8px", border: "1px solid var(--ifm-color-emphasis-200)" }}>
          <h3 style={{ marginTop: 0 }}>Job Configuration</h3>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Job Name</label>
              <input style={inputStyle} type="text" name="jobName" value={formData.jobName} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Project Account</label>
              <input 
                style={{ ...inputStyle, marginBottom: isAccountValid ? "16px" : "4px", borderColor: isAccountValid ? "#ccc" : "red" }} 
                type="text" 
                name="account" 
                value={formData.account} 
                onChange={handleChange} 
                placeholder="e.g. demo or o260000" 
              />
              {!isAccountValid && <span style={{ ...hintStyle, color: "red" }}>Invalid format. Use 'demo' or [oasw] + 6 digits.</span>}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Partition</label>
              <select style={inputStyle} name="partition" value={formData.partition} onChange={handleChange}>
                <option value="compute">compute</option>
                <option value="gpu">gpu</option>
                <option value="short">short</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Time (Hours)</label>
              <input 
                style={{ ...inputStyle, marginBottom: "4px" }} 
                type="number" 
                min="1" 
                name="timeHours" 
                value={formData.timeHours} 
                onChange={handleChange} 
              />
              <span style={hintStyle}>
                {formData.partition === "short" ? "Max 8 hours" : "Unlimited time"}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nodes</label>
              <input 
                style={{ ...inputStyle, marginBottom: "4px" }} 
                type="number" 
                min="1" 
                name="nodes" 
                value={formData.nodes} 
                onChange={handleChange} 
              />
              <span style={hintStyle}>Default 1</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>CPUs per Task</label>
              <input 
                style={{ ...inputStyle, marginBottom: "4px" }} 
                type="number" 
                min="1" 
                name="cpus" 
                value={formData.cpus} 
                onChange={handleChange} 
              />
              <span style={hintStyle}>Max 94</span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Memory (GB)</label>
              <input 
                style={{ ...inputStyle, marginBottom: "4px" }} 
                type="number" 
                min="1" 
                name="mem" 
                value={formData.mem} 
                onChange={handleChange} 
              />
              <span style={hintStyle}>
                {formData.partition === "compute" ? "Max 1280 GB" : formData.partition === "gpu" ? "Max 384 GB" : "Enter GB limit"}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>GPUs</label>
              <input 
                style={{ ...inputStyle, marginBottom: "4px", backgroundColor: formData.partition !== "gpu" ? "#f0f0f0" : "white", cursor: formData.partition !== "gpu" ? "not-allowed" : "text" }} 
                type="number" 
                min="0" 
                name="gpus" 
                value={formData.gpus} 
                onChange={handleChange} 
                readOnly={formData.partition !== "gpu"}
                title={formData.partition !== "gpu" ? "GPUs are only available on the gpu partition" : "Max 2 GPUs"}
              />
              <span style={hintStyle}>
                {formData.partition === "gpu" ? "Max 2" : "N/A"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Output Log File</label>
              <input style={inputStyle} type="text" name="outputLog" value={formData.outputLog} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Error Log File</label>
              <input style={inputStyle} type="text" name="errorLog" value={formData.errorLog} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Report Email <span style={{fontSize: "12px", color: "#666", fontWeight: "normal"}}>(Optional)</span></label>
              <input 
                style={{ ...inputStyle, marginBottom: isEmailValid ? "16px" : "4px", borderColor: isEmailValid ? "#ccc" : "red" }} 
                type="email" 
                name="email" 
                placeholder="user@example.com" 
                value={formData.email} 
                onChange={handleChange} 
              />
              {!isEmailValid && <span style={{ ...hintStyle, color: "red" }}>Please enter a valid email.</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Report Event</label>
              <select 
                style={{ ...inputStyle, backgroundColor: formData.email ? "white" : "#f0f0f0", cursor: formData.email ? "pointer" : "not-allowed" }} 
                name="mailType" 
                value={formData.mailType} 
                onChange={handleChange}
                disabled={!formData.email}
              >
                <option value="ALL">ALL</option>
                <option value="BEGIN">BEGIN</option>
                <option value="END">END</option>
                <option value="FAIL">FAIL</option>
                <option value="TIME_LIMIT">TIME_LIMIT</option>
              </select>
            </div>
          </div>

          {tab === "array" && (
            <div style={{ padding: "10px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Array Configuration</h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Start Index</label>
                  <input style={inputStyle} type="number" min="0" name="arrayStart" value={formData.arrayStart} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>End Index</label>
                  <input style={inputStyle} type="number" min="1" name="arrayEnd" value={formData.arrayEnd} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Max Active Jobs</label>
                  <input style={inputStyle} type="number" min="0" name="arrayMax" value={formData.arrayMax} onChange={handleChange} placeholder="Optional" />
                </div>
              </div>
            </div>
          )}

          <label style={labelStyle}>Shell Script Logic</label>
          <textarea 
            style={{ ...inputStyle, fontFamily: "monospace", height: "120px", resize: "vertical" }} 
            name="script" 
            value={formData.script} 
            onChange={handleChange}
          ></textarea>
        </div>

        {/* RIGHT PANEL: SCRIPT PREVIEW */}
        <div style={{ flex: "1 1 400px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0 }}>SLURM Script Preview</h3>
            <div>
              <button 
                onClick={handleCopy} 
                style={{ cursor: "pointer", background: copied ? "#2e8555" : "var(--ifm-color-emphasis-200)", color: copied ? "white" : "inherit", border: "none", padding: "6px 12px", borderRadius: "4px", marginRight: "8px", fontWeight: "bold" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button 
                onClick={handleExport}
                style={{ cursor: "pointer", background: "var(--ifm-color-primary)", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", fontWeight: "bold" }}
              >
                Export Script
              </button>
            </div>
          </div>
          
          <div style={{ flexGrow: 1, minHeight: "0" }}>
            <CodeBlock language="bash" style={{ margin: 0, height: "100%" }}>
              {generatedScript}
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
}
