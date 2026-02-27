import React, { useState, useRef, useEffect } from "react";

const lessons = [
  {
    id: 1,
    title: "Lesson 1: Basic File and Directory Management",
    steps: [
      { instruction: "Make directory name demo", expected: ["mkdir demo"], output: "" },
      { instruction: "Change directory to demo", expected: ["cd demo"], output: "" },
      { instruction: "Make a file name metadata.txt", expected: ["touch metadata.txt"], output: "" },
      { instruction: "Copy file metadata.txt to sample.txt", expected: ["cp metadata.txt sample.txt"], output: "" },
      { 
        instruction: "List directory contents", 
        expected: ["ls", "ls -l", "ll", "ls -la", "ls -lah", "ls -al"], 
        output: (cmd) => (cmd.includes("l") || cmd.includes("a")) 
          ? "total 8\ndrwxr-xr-x 2 user group 4096 Oct 10 10:00 .\ndrwxr-xr-x 3 user group 4096 Oct 10 09:59 ..\n-rw-r--r-- 1 user group    0 Oct 10 10:00 metadata.txt\n-rw-r--r-- 1 user group    0 Oct 10 10:00 sample.txt" 
          : "metadata.txt  sample.txt" 
      },
      { instruction: "Remove file name metadata.txt", expected: ["rm metadata.txt"], output: "" },
      { instruction: "Check your path working directory", expected: ["pwd"], output: "/home/user/demo" },
      { instruction: "Go to home directory", expected: ["cd ..", "cd", "cd ~"], output: "" },
      { instruction: "Remove directory demo", expected: ["rm -r demo", "rm -rf demo"], output: "" }
    ]
  },
  {
    id: 2,
    title: "Lesson 2: File Editing, Viewing, and Moving",
    steps: [
      { instruction: "Make directory name demo", expected: ["mkdir demo"], output: "" },
      { instruction: "Go to directory demo", expected: ["cd demo"], output: "" },
      { instruction: "Make file name seq.fasta", expected: ["touch seq.fasta"], output: "" },
      { 
        instruction: "Add data into file seq.fasta using nano text editor (Tip: In real life you would add text, press Ctrl + X, type Yes, and Enter to save)", 
        expected: ["nano seq.fasta"], 
        output: "[Simulated nano interaction... Saved seq.fasta]" 
      },
      { instruction: "See first 2 lines of seq.fasta file", expected: ["head -n 2 seq.fasta", "head -n2 seq.fasta"], output: ">Sequence_1\nATGCGTACGTAGCTAGCT" },
      { instruction: "See last 2 lines of seq.fasta file", expected: ["tail -n 2 seq.fasta", "tail -n2 seq.fasta"], output: "CGTAGCTAGCTAGCTG\n>Sequence_End" },
      { instruction: "Move seq.fasta in demo to home directory", expected: ["mv seq.fasta ..", "mv seq.fasta ~", "mv seq.fasta /home/user/"], output: "" },
      { instruction: "Change directory to home", expected: ["cd", "cd ..", "cd ~"], output: "" },
      { instruction: "Remove directory demo and file seq.fasta", expected: ["rm -r demo seq.fasta", "rm -rf demo seq.fasta", "rm -r seq.fasta demo", "rm seq.fasta; rm -r demo", "rm -r demo; rm seq.fasta"], output: "" }
    ]
  }
];

const getFileSystemState = (lessonId, currentStep, completed) => {
  if (completed) return { root: [] };
  if (lessonId === 1) {
    if (currentStep === 0) return { root: [] };
    if (currentStep === 1 || currentStep === 2) return { root: [{ name: "demo", type: "dir", children: [] }] };
    if (currentStep === 3) return { root: [{ name: "demo", type: "dir", children: [{ name: "metadata.txt", type: "file" }] }] };
    if (currentStep === 4 || currentStep === 5) return { root: [{ name: "demo", type: "dir", children: [{ name: "metadata.txt", type: "file" }, { name: "sample.txt", type: "file" }] }] };
    if (currentStep >= 6 && currentStep <= 8) return { root: [{ name: "demo", type: "dir", children: [{ name: "sample.txt", type: "file" }] }] };
  } else if (lessonId === 2) {
    if (currentStep === 0) return { root: [] };
    if (currentStep === 1 || currentStep === 2) return { root: [{ name: "demo", type: "dir", children: [] }] };
    if (currentStep >= 3 && currentStep <= 6) return { root: [{ name: "demo", type: "dir", children: [{ name: "seq.fasta", type: "file" }] }] };
    if (currentStep === 7 || currentStep === 8) return { root: [{ name: "demo", type: "dir", children: [] }, { name: "seq.fasta", type: "file" }] };
  }
  return { root: [] };
};

const FileTree = ({ nodes, level = 0 }) => {
  if (!nodes || nodes.length === 0) {
    if (level === 0) return <div style={{ color: "var(--ifm-color-emphasis-500)", fontStyle: "italic", paddingLeft: "10px", marginTop: "5px" }}>(empty directory)</div>;
    return null;
  }
  return (
    <div style={{ paddingLeft: level > 0 ? "20px" : "10px", marginTop: "5px" }}>
      {nodes.map((node, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0", fontSize: "14px" }}>
            {node.type === "dir" ? "📁" : "📄"} 
            <span style={{ fontWeight: node.type === "dir" ? "bold" : "normal", color: node.type === "dir" ? "var(--ifm-color-primary)" : "var(--ifm-font-color-base)" }}>
              {node.name}
            </span>
          </div>
          {node.type === "dir" && <FileTree nodes={node.children} level={level + 1} />}
        </div>
      ))}
    </div>
  );
};

export default function InteractiveCli() {
  const [activeLesson, setActiveLesson] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [completed, setCompleted] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const lesson = lessons[activeLesson];
  const stepData = lesson.steps[currentStep];

  useEffect(() => {
    // Scroll to bottom whenever history updates
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  useEffect(() => {
    // Focus the terminal input when clicking anywhere on the terminal window
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    document.addEventListener("click", focusInput);
    return () => document.removeEventListener("click", focusInput);
  }, []);

  const handleCommand = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const parts = inputVal.split(" ");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        // Files and directories used in the tutorial
        const autoWords = ["demo", "metadata.txt", "sample.txt", "seq.fasta"];
        const match = autoWords.find(w => w.startsWith(lastPart));
        if (match) {
          parts[parts.length - 1] = match;
          setInputVal(parts.join(" "));
        }
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal("");
      }
      return;
    }

    if (e.key === "Enter") {
      const command = inputVal.trim();
      let newHistory = [...history, { type: "input", text: command, prompt: prompt }];
      
      if (command === "") {
        setHistory(newHistory);
        setInputVal("");
        return;
      }

      setCommandHistory(prev => [...prev, command]);
      setHistoryIndex(-1);

      // Check if command is correct
      if (!completed && stepData.expected.some(exp => command === exp || command.replace(/\s+/g, ' ') === exp)) {
        // Success
        if (stepData.output) {
          const outText = typeof stepData.output === "function" ? stepData.output(command) : stepData.output;
          newHistory.push({ type: "output", text: outText });
        }
        newHistory.push({ type: "success", text: "✓ Correct!" });
        
        if (currentStep + 1 < lesson.steps.length) {
          setCurrentStep(currentStep + 1);
        } else {
          newHistory.push({ type: "success", text: "🎉 Lesson Completed! Great job." });
          setCompleted(true);
        }
      } else if (!completed) {
        // Error
        newHistory.push({ type: "error", text: "Oops! Try again. Expected command might look like: " + stepData.expected[0] });
      } else {
         newHistory.push({ type: "output", text: "Lesson is already complete. Switch to the next lesson to continue!" });
      }

      setHistory(newHistory);
      setInputVal("");
    }
  };

  const switchLesson = (idx) => {
    setActiveLesson(idx);
    setCurrentStep(0);
    setHistory([]);
    setCommandHistory([]);
    setHistoryIndex(-1);
    setInputVal("");
    setCompleted(false);
  };

  const promptPath = (currentStep >= 2 && currentStep <= 7) ? "~/demo" : "~";
  const prompt = `user@medcmu-hpc:${promptPath}$`;

  return (
    <div style={{ padding: "20px 0", maxWidth: "1000px" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        {lessons.map((l, index) => (
          <button
            key={l.id}
            onClick={() => switchLesson(index)}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              border: "None",
              borderBottom: activeLesson === index ? "3px solid var(--ifm-color-primary)" : "3px solid transparent",
              backgroundColor: activeLesson === index ? "var(--ifm-color-emphasis-100)" : "transparent",
              fontWeight: "bold",
              color: activeLesson === index ? "var(--ifm-color-primary)" : "var(--ifm-font-color-base)",
              fontSize: "14px",
              borderRadius: "4px 4px 0 0"
            }}
          >
            {l.title}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* LEFT PANEL: INSTRUCTIONS */}
        <div style={{ flex: "1 1 300px", background: "var(--ifm-background-surface-color)", padding: "20px", borderRadius: "8px", border: "1px solid var(--ifm-color-emphasis-200)" }}>
          <h3 style={{ marginTop: 0 }}>Mission Objective</h3>
          
          <div style={{ marginBottom: "20px", background: "var(--ifm-color-emphasis-100)", padding: "15px", borderRadius: "8px" }}>
             <p style={{ margin: 0, fontWeight: "bold", color: "var(--ifm-color-primary)", fontSize: "18px" }}>
               Step {currentStep + 1} of {lesson.steps.length}
             </p>
             <p style={{ marginTop: "10px", fontSize: "16px", whiteSpace: "pre-wrap" }}>
               {completed ? "✅ Mission Accomplished!" : stepData.instruction}
             </p>
          </div>

          <p style={{ fontSize: "13px", color: "var(--ifm-color-emphasis-600)" }}>
            Type the correct Linux command in the terminal on the right and press Enter to complete the step.
          </p>

          <div style={{ marginTop: "30px" }}>
            <h4>Progress</h4>
            <div style={{ width: "100%", height: "10px", background: "var(--ifm-color-emphasis-200)", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(completed ? 100 : (currentStep / lesson.steps.length) * 100)}%`, background: "var(--ifm-color-primary)", transition: "width 0.3s" }}></div>
            </div>
          </div>

          <div style={{ marginTop: "30px" }}>
            <h4>Virtual File System</h4>
            <div style={{ background: "var(--ifm-color-emphasis-100)", padding: "15px", borderRadius: "8px", minHeight: "100px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px" }}>
                🏠 ~ (Home Directory)
              </div>
              <FileTree nodes={getFileSystemState(lesson.id, currentStep, completed).root} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: TERMINAL */}
        <div style={{ flex: "1 1 450px", minWidth: 0 }}>
          <div style={{ background: "#282c34", color: "#abb2bf", borderRadius: "8px", padding: "15px", fontFamily: "monospace", fontSize: "15px", minHeight: "400px", maxHeight: "500px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }} onClick={() => inputRef.current?.focus()}>
            
            <div style={{ color: "#5c6370", marginBottom: "15px" }}>
              Welcome to the Interactive Linux Terminal.<br/>
              To complete the current step, type the command and press [Enter].
            </div>

            {history.map((line, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                {line.type === "input" && (
                  <div>
                    <span style={{ color: "#98c379" }}>{line.prompt || prompt}</span> <span style={{ color: "#e5c07b" }}>{line.text}</span>
                  </div>
                )}
                {line.type === "output" && (
                  <div style={{ whiteSpace: "pre-wrap" }}>{line.text}</div>
                )}
                {line.type === "error" && (
                  <div style={{ color: "#e06c75" }}>{line.text}</div>
                )}
                {line.type === "success" && (
                  <div style={{ color: "#98c379" }}>{line.text}</div>
                )}
              </div>
            ))}

            {!completed && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#98c379", marginRight: "8px" }}>{prompt}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleCommand}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#e5c07b",
                    fontFamily: "monospace",
                    fontSize: "15px",
                    outline: "none",
                    flex: 1,
                    width: "100%"
                  }}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
