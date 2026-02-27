import React, { useState } from "react";
import CodeBlock from '@theme/CodeBlock';

const SCRATCH_ENV = `    export TZ="Asia/Bangkok"
    export LANG="en_US.UTF-8"
    export LC_ALL="en_US.UTF-8"
    export PATH="/usr/lib/rstudio-server/bin:\${PATH}"
    export LD_LIBRARY_PATH="/usr/local/lib:\${LD_LIBRARY_PATH}"`;

const PREBUILD_ENV = `    export TZ="Asia/Bangkok"
    export LANG="en_US.UTF-8"
    export LC_ALL="en_US.UTF-8"
    export PATH="/usr/lib/rstudio-server/bin:\${PATH}"
    export LD_LIBRARY_PATH="/usr/local/lib:\${LD_LIBRARY_PATH}"`;

const SHARED_TEST = `    command -v R       || exit 1
    command -v rserver || exit 2
    R --version | head -1
    R -e "BiocManager::version()"`;

const SHARED_RUN = `    exec "$@"`;

export default function ApptainerRStudioGenerator() {
  const [tab, setTab] = useState("scratch");
  const [copied, setCopied] = useState(false);

  const [scratchData, setScratchData] = useState({
    bootstrap: "docker",
    from: "quay.io/rockylinux/rockylinux:8.10",
    environment: SCRATCH_ENV,
    rVersion: "4.5.2",
    biocVersion: "3.22",
    rstudioVersion: "2026.01.1-403",
    dnfPackages: [],
    cranPackages: ["tidyverse", "rmarkdown", "knitr", "devtools"],
    biocPackages: [],
    installBiocManager: true,
    runscript: SHARED_RUN,
    test: SHARED_TEST,
  });

  const [prebuildData, setPrebuildData] = useState({
    bootstrap: "localimage",
    from: "/apps/r/sif/4.5.2-RStudio_Server_2026.01.1-403.sif",
    environment: PREBUILD_ENV,
    rVersion: "",
    biocVersion: "",
    rstudioVersion: "",
    dnfPackages: [],
    cranPackages: ["tidyverse"],
    biocPackages: ["DESeq2"],
    installBiocManager: false,
    runscript: SHARED_RUN,
    test: SHARED_TEST,
  });

  const activeData = tab === "scratch" ? scratchData : prebuildData;
  const setActiveData = tab === "scratch" ? setScratchData : setPrebuildData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActiveData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePackageChange = (type, index, value) => {
    setActiveData(prev => {
      const newList = [...prev[type]];
      newList[index] = value;
      return { ...prev, [type]: newList };
    });
  };

  const addPackage = (type) => {
    setActiveData(prev => ({ ...prev, [type]: [...prev[type], ""] }));
  };

  const removePackage = (type, index) => {
    setActiveData(prev => {
      const newList = [...prev[type]];
      newList.splice(index, 1);
      return { ...prev, [type]: newList };
    });
  };

  const generatePost = () => {
    const R_VERSION = activeData.rVersion;
    const BIOC_VERSION = activeData.biocVersion;
    const RSTUDIO_VERSION = activeData.rstudioVersion;
    const rMajorMinor = (R_VERSION || "4.5").split(".").slice(0, 2).join(".");

    let post = "";

    // Scratch needs the full R + OS installation
    if (tab === "scratch") {
      post += `    set -euo pipefail

    R_VERSION=${R_VERSION}
    BIOC_VERSION=${BIOC_VERSION}
    RSTUDIO_VERSION=${RSTUDIO_VERSION}
    R_ETC=/opt/R/\${R_VERSION}/lib/R/etc
    PPM=https://packagemanager.posit.co

    # ── Locale ────────────────────────────────
    dnf install -y langpacks-en glibc-langpack-en glibc-locale-source
    localedef -c -i en_US -f UTF-8 en_US.UTF-8 || true

    # ── Repos & base upgrade ──────────────────
    dnf install -y epel-release
    dnf config-manager --set-enabled powertools
    dnf upgrade -y

    # ── Build tools & R dependencies ──────────
    dnf groupinstall -y "Development Tools"
    dnf install -y \\
        wget curl ca-certificates \\
        openssl-devel \\
        libxml2-devel \\
        libcurl-devel \\
        zlib-devel \\
        bzip2-devel \\
        java-11-openjdk-devel

    # ── R ─────────────────────────────────────
    curl -fsSL -O https://cdn.rstudio.com/r/centos-8/pkgs/R-\${R_VERSION}-1-1.x86_64.rpm
    dnf install -y R-\${R_VERSION}-1-1.x86_64.rpm
    rm -f R-\${R_VERSION}-1-1.x86_64.rpm

    ln -s /opt/R/\${R_VERSION}/bin/R       /usr/local/bin/R
    ln -s /opt/R/\${R_VERSION}/bin/Rscript /usr/local/bin/Rscript

    # ── R site config ─────────────────────────
    echo "
# CRAN snapshot compatible with Bioconductor \${BIOC_VERSION}
options(repos = c(CRAN = '\${PPM}/cran/__linux__/centos8/latest'))

# BiocManager — use Posit Package Manager as mirror
options(BioC_mirror = '\${PPM}/bioconductor/latest')
options(BIOCONDUCTOR_CONFIG_FILE = '\${PPM}/bioconductor/latest/config.yaml')

# Lock Bioconductor version
Sys.setenv(R_BIOC_VERSION = '\${BIOC_VERSION}')

    " >> \${R_ETC}/Rprofile.site

    echo "TZ='Asia/Bangkok'" >> \${R_ETC}/Renviron
    sed -i '/^R_PLATFORM=/ c\\R_PLATFORM=\${R_PLATFORM-"el8-x86_64-singularity"}'     \${R_ETC}/Renviron
    sed -i '/^R_LIBS_USER=/ c\\R_LIBS_USER=\${R_LIBS_USER-"~/R/el8-x86_64-singularity-library/${rMajorMinor}"}' \\
        \${R_ETC}/Renviron

    # ── RStudio Server ────────────────────────
    curl -fsSL -O https://download2.rstudio.org/server/rhel8/x86_64/rstudio-server-rhel-\${RSTUDIO_VERSION}-x86_64.rpm
    dnf install -y rstudio-server-rhel-\${RSTUDIO_VERSION}-x86_64.rpm
    rm -f rstudio-server-rhel-\${RSTUDIO_VERSION}-x86_64.rpm

    # ── Node.js (required by RStudio Server) ──
    dnf module enable -y nodejs:22
    dnf install -y nodejs

`;
    }

    // Dynamic OS Packages
    const validDnf = activeData.dnfPackages.filter(p => p.trim() !== "");
    if (validDnf.length > 0) {
      post += `    # ── Additional OS Packages ────────────────\n`;
      post += `    dnf install -y ${validDnf.join(" ")}\n\n`;
    }

    // Dynamic R Packages installation
    const validCran = activeData.cranPackages.filter(p => p.trim() !== "");
    const validBioc = activeData.biocPackages.filter(p => p.trim() !== "");

    if (validCran.length > 0 || validBioc.length > 0 || activeData.installBiocManager) {
      post += `    # ── R packages ────────────────────────────\n`;
    }

    if (validCran.length > 0) {
      const cranStr = validCran.map(pkg => `'${pkg}'`).join(', ');
      post += `    R -e "install.packages(c(${cranStr}), dependencies = TRUE)"\n`;
    }

    if (activeData.installBiocManager) {
      post += `    R -e "install.packages('BiocManager', dependencies = TRUE)"\n`;
      post += `    R -e "BiocManager::install(ask = FALSE)"\n`;
    }

    if (validBioc.length > 0) {
      if (!activeData.installBiocManager) {
        post += `    R -e "if (!requireNamespace('BiocManager', quietly = TRUE)) install.packages('BiocManager')"\n`;
      }
      const biocStr = validBioc.map(pkg => `'${pkg}'`).join(', ');
      post += `    R -e "BiocManager::install(c(${biocStr}), ask=FALSE)"\n`;
    }

    if (validCran.length > 0 || validBioc.length > 0 || activeData.installBiocManager) {
      post += `\n`;
    }

    post += `    # ── Cleanup ───────────────────────────────
    dnf clean all
    rm -rf /var/cache/dnf/*`;

    return post;
  };


  const generateDef = () => {
    let def = `BootStrap: ${activeData.bootstrap}\nFrom: ${activeData.from}\n`;

    // Labels section (only for scratch with version info)
    if (tab === "scratch" && (activeData.rVersion || activeData.biocVersion || activeData.rstudioVersion)) {
      def += `\n# ──────────────────────────────────────────────\n`;
      def += `# Versions (update here only)\n`;
      def += `# ──────────────────────────────────────────────\n`;
      def += `%labels\n`;
      if (activeData.rVersion) {
        def += `    R_VERSION          ${activeData.rVersion}\n`;
      }
      if (activeData.biocVersion) {
        def += `    BIOC_VERSION       ${activeData.biocVersion}\n`;
      }
      if (activeData.rstudioVersion) {
        def += `    RSTUDIO_VERSION    ${activeData.rstudioVersion}\n`;
      }
    }

    if (activeData.environment) {
      def += `\n%environment\n`;
      def += `${activeData.environment}\n`;
    }

    const postContent = generatePost();
    if (postContent) {
      def += `\n%post\n`;
      def += `${postContent}\n`;
    }

    if (activeData.runscript) {
      def += `\n%runscript\n`;
      def += `${activeData.runscript}\n`;
    }

    if (activeData.test) {
      def += `\n%test\n`;
      def += `${activeData.test}\n`;
    }

    return def.trimEnd() + "\n";
  };

  const generatedDef = generateDef();

  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDef], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = tab === "scratch" ? "rstudio_scratch.def" : "rstudio_prebuild.def";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const labelStyle = { display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: "14px" };
  const inputStyle = { width: "100%", padding: "8px", marginBottom: "16px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" };
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

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #ddd", marginBottom: "20px" }}>
        <button style={tabBtnStyle(tab === "scratch")} onClick={() => setTab("scratch")}>From Scratch</button>
        <button style={tabBtnStyle(tab === "prebuild")} onClick={() => setTab("prebuild")}>From Pre-build</button>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* LEFT PANEL: FORM */}
        <div style={{ flex: "1 1 300px", background: "var(--ifm-background-surface-color)", padding: "20px", borderRadius: "8px", border: "1px solid var(--ifm-color-emphasis-200)", overflowY: "auto" }}>
          <h3 style={{ marginTop: 0 }}>Definition Configuration</h3>
          
          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>1. Header</h4>
            
            <label style={labelStyle}>Fetch Base (BootStrap)</label>
            <select style={inputStyle} name="bootstrap" value={activeData.bootstrap} onChange={handleChange}>
              <option value="docker">docker</option>
              <option value="localimage">localimage</option>
              <option value="library">library</option>
              <option value="shub">shub</option>
            </select>
  
            <label style={labelStyle}>Source Image (From)</label>
            <input style={inputStyle} type="text" name="from" value={activeData.from} onChange={handleChange} placeholder="e.g. quay.io/rockylinux/rockylinux:8.10" />
          </div>

          {tab === "scratch" && (
            <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "16px" }}>2. Versions (%labels)</h4>
              <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Version metadata stored in the container image labels.</label>
              
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 120px" }}>
                  <label style={labelStyle}>R Version</label>
                  <input style={inputStyle} type="text" name="rVersion" value={activeData.rVersion} onChange={handleChange} placeholder="e.g. 4.5.2" />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <label style={labelStyle}>Bioconductor Version</label>
                  <input style={inputStyle} type="text" name="biocVersion" value={activeData.biocVersion} onChange={handleChange} placeholder="e.g. 3.22" />
                </div>
                <div style={{ flex: "1 1 180px" }}>
                  <label style={labelStyle}>RStudio Version</label>
                  <input style={inputStyle} type="text" name="rstudioVersion" value={activeData.rstudioVersion} onChange={handleChange} placeholder="e.g. 2026.01.1-403" />
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>{tab === "scratch" ? "3" : "2"}. Environment Variables (%environment)</h4>
            <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Defines environment variables available at runtime.</label>
            <textarea 
              style={{ ...inputStyle, fontFamily: "monospace", height: "130px", resize: "vertical" }} 
              name="environment" 
              value={activeData.environment} 
              onChange={handleChange}
            ></textarea>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>{tab === "scratch" ? "4.1" : "3.1"} Additional OS Packages (%post)</h4>
            
            <label style={labelStyle}>Extra OS Packages (dnf install -y)</label>
            {activeData.dnfPackages.map((pkg, idx) => (
              <div key={`dnf_${idx}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input style={{...inputStyle, marginBottom: 0}} type="text" value={pkg} onChange={(e) => handlePackageChange('dnfPackages', idx, e.target.value)} placeholder="e.g. htop or git" />
                <button onClick={() => removePackage('dnfPackages', idx)} style={{ background: "#dc3545", color: "white", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>X</button>
              </div>
            ))}
            <button onClick={() => addPackage('dnfPackages')} style={{ display: "block", background: "var(--ifm-color-emphasis-200)", color: "inherit", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>+ Add OS Package</button>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>{tab === "scratch" ? "4.2" : "3.2"} R Packages (%post)</h4>
            
            <label style={labelStyle}>CRAN Packages (install.packages)</label>
            {activeData.cranPackages.map((pkg, idx) => (
              <div key={`cran_${idx}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input style={{...inputStyle, marginBottom: 0}} type="text" value={pkg} onChange={(e) => handlePackageChange('cranPackages', idx, e.target.value)} placeholder="e.g. tidyverse" />
                <button onClick={() => removePackage('cranPackages', idx)} style={{ background: "#dc3545", color: "white", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>X</button>
              </div>
            ))}
            <button onClick={() => addPackage('cranPackages')} style={{ display: "block", background: "var(--ifm-color-emphasis-200)", color: "inherit", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginBottom: "20px" }}>+ Add CRAN Package</button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <input type="checkbox" id="installBiocManager" name="installBiocManager" checked={activeData.installBiocManager} onChange={handleChange} style={{ width: "auto", margin: 0 }} />
              <label htmlFor="installBiocManager" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>Install BiocManager + bootstrap Bioconductor</label>
            </div>

            <label style={labelStyle}>Bioconductor Packages (BiocManager::install)</label>
            {activeData.biocPackages.map((pkg, idx) => (
              <div key={`bioc_${idx}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input style={{...inputStyle, marginBottom: 0}} type="text" value={pkg} onChange={(e) => handlePackageChange('biocPackages', idx, e.target.value)} placeholder="e.g. DESeq2" />
                <button onClick={() => removePackage('biocPackages', idx)} style={{ background: "#dc3545", color: "white", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>X</button>
              </div>
            ))}
            <button onClick={() => addPackage('biocPackages')} style={{ display: "block", background: "var(--ifm-color-emphasis-200)", color: "inherit", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>+ Add Bioconductor Package</button>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>{tab === "scratch" ? "5" : "4"}. Container Execution (%runscript)</h4>
            <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Defines the default action when the container is executed.</label>
            <textarea 
              style={{ ...inputStyle, fontFamily: "monospace", height: "80px", resize: "vertical", marginBottom: 0 }} 
              name="runscript" 
              value={activeData.runscript} 
              onChange={handleChange}
            ></textarea>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>{tab === "scratch" ? "6" : "5"}. Integrity Check (%test)</h4>
            <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Verify the container's integrity at the end of the build process.</label>
            <textarea 
              style={{ ...inputStyle, fontFamily: "monospace", height: "120px", resize: "vertical", marginBottom: 0 }} 
              name="test" 
              value={activeData.test} 
              onChange={handleChange}
            ></textarea>
          </div>

        </div>

        {/* RIGHT PANEL: SCRIPT PREVIEW */}
        <div style={{ flex: "1 1 400px", minWidth: 0, display: "flex", flexDirection: "column"}}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0 }}>Definition Preview (.def)</h3>
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
              {generatedDef}
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
}
