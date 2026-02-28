import React, { useState } from 'react';

const commands = [
  { cmd: "ls", desc: "Lists files and directories" },
  { cmd: "pwd", desc: "Print current working directory" },
  { cmd: "man command", desc: "Displays the manual page for a specific command" },
  { cmd: "cd dir", desc: "Changes the working directory to dir" },
  { cmd: "cd ..", desc: "Changes the working directory to parent directory" },
  { cmd: "cd ../..", desc: "Changes the working directory to the parent directory two levels up" },
  { cmd: "touch file", desc: "Creates an empty file named file" },
  { cmd: "cp f1 f2", desc: "Copies file f1 as file f2" },
  { cmd: "mkdir dir", desc: "Creates a directory named dir" },
  { cmd: "rm file", desc: "Removes a file named file" },
  { cmd: "rm -r dir", desc: "Removes a directory named dir and its contents recursively" },
  { cmd: "mv f1 f2", desc: "Renames file f1 to f2" },
  { cmd: "mv f1 dir", desc: "Moves file f1 to a directory named dir" },
  { cmd: "ln -s f1 link", desc: "Creates a symbolic (shortcut) named link that point to f1" },
  { cmd: "wget url", desc: "Downloads a file from the url" },
  { cmd: "gzip file", desc: "Compresses file using GZip" },
  { cmd: "gunzip file.gz", desc: "Decompress the file file.gz" },
  { cmd: "tar xzvf file.tar.gz", desc: "Extracts the file file.tar.gz" },
  { cmd: "cat file", desc: "Prints the entire content of file" },
  { cmd: "head file", desc: "Displays the first 10 lines of file by default" },
  { cmd: "tail file", desc: "Displays the last 10 lines of file by default" },
  { cmd: "grep pattern file", desc: "Searches for lines containing pattern in file and displays" }
];

export default function CommandTable() {
  const [query, setQuery] = useState("");

  const filteredCommands = commands.filter(
    (item) =>
      item.cmd.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="text"
        placeholder="🔍 Search for a command or description..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "6px",
          border: "1px solid var(--ifm-color-emphasis-300)",
          backgroundColor: "var(--ifm-background-surface-color)",
          color: "var(--ifm-font-color-base)",
          fontSize: "16px"
        }}
      />
      
      <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid var(--ifm-color-emphasis-200)", borderRadius: "6px" }}>
        <table style={{ width: "100%", margin: 0, borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--ifm-color-emphasis-100)", zIndex: 1 }}>
            <tr>
              <th style={{ padding: "10px", textAlign: "left", width: "30%", borderBottom: "2px solid var(--ifm-color-emphasis-300)" }}>Command</th>
              <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid var(--ifm-color-emphasis-300)" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommands.length > 0 ? (
              filteredCommands.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--ifm-color-emphasis-200)", backgroundColor: idx % 2 === 0 ? "transparent" : "var(--ifm-color-emphasis-100)" }}>
                  <td style={{ padding: "10px" }}><code style={{ backgroundColor: "var(--ifm-color-emphasis-200)", padding: "2px 6px", borderRadius: "4px" }}>{item.cmd}</code></td>
                  <td style={{ padding: "10px" }}>{item.desc}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ padding: "20px", textAlign: "center", fontStyle: "italic", color: "var(--ifm-color-emphasis-500)" }}>
                  No commands found matching "{query}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
