import React, { useState } from "react";
import CodeBlock from '@theme/CodeBlock';

const SCRATCH_ENV = `export TZ="Asia/Bangkok"
export LANG="en_US.UTF-8"
export LC_COLLATE="en_US.UTF-8"
export LC_CTYPE="en_US.UTF-8"
export LC_MESSAGES="en_US.UTF-8"
export LC_MONETARY="en_US.UTF-8"
export LC_NUMERIC="en_US.UTF-8"
export LC_TIME="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
export CPATH=$CPATH:/usr/include/openmpi-x86_64
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
export PATH=/usr/lib/rstudio-server/bin:\${PATH}`;

const SHARED_TEST = `command -v R &>/dev/null || exit 1
command -v rstudio-server &>/dev/null || exit 2
command -v rserver &>/dev/null || exit 3`;

const SHARED_RUN = `exec "$@"`;

export default function ApptainerRStudioGenerator() {
  const [tab, setTab] = useState("scratch");
  const [copied, setCopied] = useState(false);

  const [scratchData, setScratchData] = useState({
    bootstrap: "docker",
    from: "quay.io/rockylinux/rockylinux:8.10",
    environment: SCRATCH_ENV,
    rVersion: "4.5.2",
    rstudioVersion: "2026.01.1+403",
    dnfPackages: [],
    cranPackages: ["tidyverse", "rmarkdown", "knitr", "devtools"],
    biocPackages: [],
    runscript: SHARED_RUN,
    test: SHARED_TEST,
  });

  const [prebuildData, setPrebuildData] = useState({
    bootstrap: "localimage",
    from: "/apps/r/sif/4.5.2-RStudio_Server_2025.09.2-418.sif",
    environment: SCRATCH_ENV,
    rVersion: "", 
    rstudioVersion: "", 
    dnfPackages: [],
    cranPackages: ["tidyverse"],
    biocPackages: ["DESeq2"],
    runscript: SHARED_RUN,
    test: SHARED_TEST,
  });

  const activeData = tab === "scratch" ? scratchData : prebuildData;
  const setActiveData = tab === "scratch" ? setScratchData : setPrebuildData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setActiveData((prev) => ({ ...prev, [name]: value }));
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
    let post = "";
    
    // Scratch needs the full R + OS installation
    if (tab === "scratch") {
      post += `# Setup Environment and Fix Locale
dnf install -y langpacks-en glibc-langpack-en glibc-locale-source glibc-common
localedef --quiet -v -c -i en_US -f UTF-8 en_US.UTF-8 || if [ $? -ne 1 ]; then exit $?; fi

# Install EPEL
dnf install -y epel-release

# Enable Additional Built-In Repos
dnf config-manager --set-enabled powertools

# Upgrade Packages
dnf upgrade -y

# Install Dev Tools
dnf groupinstall -y --with-optional "Development Tools" "Scientific Support"
dnf install -y wget ca-certificates mariadb-connector-c-devel curl-devel openssl-devel llvm llvm-devel llvm-static llvm-toolset libxml2-devel
echo "/usr/lib64/openmpi/lib" > /etc/ld.so.conf.d/openmpi.conf
ldconfig

# Install R (https://docs.rstudio.com/resources/install-r/)
R_VERSION=${activeData.rVersion}
curl -O https://cdn.rstudio.com/r/centos-8/pkgs/R-\${R_VERSION}-1-1.x86_64.rpm
dnf install -y R-\${R_VERSION}-1-1.x86_64.rpm
rm -f R-\${R_VERSION}-1-1.x86_64.rpm
ln -s /opt/R/\${R_VERSION}/bin/R /usr/local/bin/R
ln -s /opt/R/\${R_VERSION}/bin/Rscript /usr/local/bin/Rscript

# Add a default CRAN mirror
echo "options(repos = c(CRAN = 'https://cran.rstudio.com/'), download.file.method = 'libcurl')" >> /opt/R/\${R_VERSION}/lib/R/etc/Rprofile.site

# Add Timezone to R Site Environment File
echo "TZ='$TZ'" >> /opt/R/\${R_VERSION}/lib/R/etc/Renviron

# Adjust Platform and Libs (update on R or OS version change!!)
sed -i '/^R_PLATFORM=/ c\\R_PLATFORM=\\$\\{R_PLATFORM-"el8-x86_64-singularity"\\}' /opt/R/\${R_VERSION}/lib/R/etc/Renviron
sed -i '/^R_LIBS_USER=/ c\\R_LIBS_USER=\\$\\{R_LIBS_USER-"~/R/el8-x86_64-singularity-library/${(activeData.rVersion || "4.4").split(".").slice(0, 2).join(".")}"\\}' /opt/R/\${R_VERSION}/lib/R/etc/Renviron

# Install R devtools
R -e "install.packages('devtools')"

# Install R Studio Server
RSTUDIO_VERSION=${activeData.rstudioVersion}
curl -O https://download2.rstudio.org/server/rhel8/x86_64/rstudio-server-rhel-\${RSTUDIO_VERSION}-x86_64.rpm
dnf install -y rstudio-server-rhel-\${RSTUDIO_VERSION}-x86_64.rpm
rm -f rstudio-server-rhel-\${RSTUDIO_VERSION}-x86_64.rpm

# Node JS and Core Dependencies
dnf module enable -y nodejs:22
dnf install -y wget nodejs nodejs-devel npm openblas java-1.8.0-openjdk-devel zlib-devel libicu-devel libpng-devel libcurl-devel libxml2-devel openssl-devel openmpi-devel python3-numpy python3-matplotlib netcdf4-python3 netcdf-devel netcdf python3-pandas python3-basemap proj-devel gdal-devel monitorix gnuplot ImageMagick librsvg2-devel libsodium-devel libwebp-devel cairo-devel hunspell-devel openssl-devel poppler-cpp-devel protobuf-devel mariadb-devel redland-devel cyrus-sasl-devel libtiff-devel tcl-devel tk-devel xauth mesa-libGLU-devel glpk-devel libXt-devel gsl-devel fftw-devel bzip2-devel geos-devel gtk2-devel gtk3-devel libjpeg-turbo-devel blas-devel lapack-devel mpfr-devel unixODBC-devel libsndfile-devel udunits2-devel postgresql-devel libRmath-devel qt5-devel libdb-devel octave-devel hiredis-devel poppler-glib-devel boost-devel czmq-devel ImageMagick-c++-devel file-devel opencl-headers sqlite-devel

# Install V8
echo "DOWNLOAD_STATIC_LIBV8='1'" >> /opt/R/\${R_VERSION}/lib/R/etc/Renviron
R -e "Sys.setenv(DOWNLOAD_STATIC_LIBV8=1);install.packages('V8')"

`;
    }

    // Dynamic OS Packages
    const validDnf = activeData.dnfPackages.filter(p => p.trim() !== "");
    if (validDnf.length > 0) {
      post += `# Install Additional OS Packages\n`;
      post += `dnf install -y ${validDnf.join(" ")}\n\n`;
    }

    // Dynamic R Packages installation
    const validCran = activeData.cranPackages.filter(p => p.trim() !== "");
    const validBioc = activeData.biocPackages.filter(p => p.trim() !== "");

    if (validCran.length > 0) {
      post += `# Install CRAN Packages\n`;
      const cranStr = validCran.map(pkg => `'${pkg}'`).join(', ');
      post += `R -e "install.packages(c(${cranStr}), dependencies = TRUE)"\n\n`;
    }

    if (validBioc.length > 0) {
      post += `# Install Bioconductor Packages\n`;
      // If installing Bioc packages, make sure BiocManager is present (especially for scratch installs)
      if (tab === "scratch") {
        post += `R -e "if (!requireNamespace('BiocManager', quietly = TRUE)) install.packages('BiocManager')"\n`;
      }
      const biocStr = validBioc.map(pkg => `'${pkg}'`).join(', ');
      post += `R -e "BiocManager::install(c(${biocStr}), ask=FALSE)"\n\n`;
    }

    post += `# cleanup dnf
dnf clean all
rm -rf /var/cache/dnf/*`;

    return post;
  };


  const generateDef = () => {
    let def = `BootStrap: ${activeData.bootstrap}\n`;
    def += `From: ${activeData.from}\n\n`;
    
    if (activeData.environment) {
        def += `%environment\n`;
        def += `${activeData.environment}\n\n`;
    }

    const postContent = generatePost();
    if (postContent) {
        def += `%post\n`;
        def += `${postContent}\n\n`;
    }

    if (activeData.runscript) {
        def += `%runscript\n`;
        def += `${activeData.runscript}\n\n`;
    }

    if (activeData.test) {
        def += `%test\n`;
        def += `${activeData.test}\n`;
    }

    return def.trim();
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
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>1. Header Session</h4>
            
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

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>2. Environment Variables</h4>
            <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Defines environment variables inside '%environment' block.</label>
            <textarea 
              style={{ ...inputStyle, fontFamily: "monospace", height: "150px", resize: "vertical" }} 
              name="environment" 
              value={activeData.environment} 
              onChange={handleChange}
            ></textarea>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>3.1 OS System Setup and Configuration (%post)</h4>
            
            <label style={labelStyle}>Additional OS Packages (dnf install -y)</label>
            {activeData.dnfPackages.map((pkg, idx) => (
              <div key={`dnf_${idx}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input style={{...inputStyle, marginBottom: 0}} type="text" value={pkg} onChange={(e) => handlePackageChange('dnfPackages', idx, e.target.value)} placeholder="e.g. htop or git" />
                <button onClick={() => removePackage('dnfPackages', idx)} style={{ background: "#dc3545", color: "white", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>X</button>
              </div>
            ))}
            <button onClick={() => addPackage('dnfPackages')} style={{ display: "block", background: "var(--ifm-color-emphasis-200)", color: "inherit", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>+ Add OS Package</button>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>3.2 R & RStudio Setup</h4>
            
            {tab === "scratch" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>R Version</label>
                  <input style={inputStyle} type="text" name="rVersion" value={activeData.rVersion} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>RStudio Version</label>
                  <input style={inputStyle} type="text" name="rstudioVersion" value={activeData.rstudioVersion} onChange={handleChange} />
                </div>
              </div>
            )}

            <label style={labelStyle}>CRAN Packages (install.packages)</label>
            {activeData.cranPackages.map((pkg, idx) => (
              <div key={`cran_${idx}`} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input style={{...inputStyle, marginBottom: 0}} type="text" value={pkg} onChange={(e) => handlePackageChange('cranPackages', idx, e.target.value)} placeholder="e.g. tidyverse" />
                <button onClick={() => removePackage('cranPackages', idx)} style={{ background: "#dc3545", color: "white", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>X</button>
              </div>
            ))}
            <button onClick={() => addPackage('cranPackages')} style={{ display: "block", background: "var(--ifm-color-emphasis-200)", color: "inherit", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginBottom: "20px" }}>+ Add CRAN Package</button>

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
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>4. Container Execution (%runscript)</h4>
            <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Defines the default action when the container is executed.</label>
            <textarea 
              style={{ ...inputStyle, fontFamily: "monospace", height: "80px", resize: "vertical", marginBottom: 0 }} 
              name="runscript" 
              value={activeData.runscript} 
              onChange={handleChange}
            ></textarea>
          </div>

          <div style={{ padding: "12px", background: "var(--ifm-color-emphasis-100)", borderRadius: "4px", marginBottom: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "16px" }}>5. Integrity Check (%test)</h4>
            <label style={{...labelStyle, fontWeight: "normal", fontSize: "13px", color: "var(--ifm-color-emphasis-700)"}}>Verify the container's integrity at the end of the build process.</label>
            <textarea 
              style={{ ...inputStyle, fontFamily: "monospace", height: "100px", resize: "vertical", marginBottom: 0 }} 
              name="test" 
              value={activeData.test} 
              onChange={handleChange}
            ></textarea>
          </div>

        </div>

        {/* RIGHT PANEL: SCRIPT PREVIEW */}
        <div style={{ flex: "1 1 400px", minWidth: 0, display: "flex", flexDirection: "column"}}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0 }}>Definition Preveiw (.def)</h3>
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
