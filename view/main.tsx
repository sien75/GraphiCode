import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";

interface WorkspaceInfo {
  stateIds: string[];
  typeIds: string[];
  algorithmIds: string[];
  flowIds: string[];
}

const App = () => {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState("");
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo>({
    stateIds: [],
    typeIds: [],
    algorithmIds: [],
    flowIds: [],
  });

  const handleRefresh = async () => {
    try {
      const response = await fetch("/api/get-workspace-info");
      const data = await response.json();
      setWorkspaceInfo(data);
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // 清空日志和输入框
    setLogs("");
    setInput("");

    try {
      const response = await fetch(`/api/llm-stream?userPrompt=${encodeURIComponent(input)}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        // 追加日志内容
        setLogs((prev) => prev + text);
      }

      // 流式响应完成后，自动刷新 workspace 信息
      await handleRefresh();
    } catch (error) {
      const errorMsg = `Error: ${error}\n`;
      setLogs((prev) => prev + errorMsg);
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="app-container">
      <div className="top-panels">
        <div className="panel-top">
          <h3>States</h3>
          <ul className="item-list">
            {workspaceInfo.stateIds.map((id, index) => (
              <li key={index}>{id}</li>
            ))}
          </ul>
        </div>
        <div className="panel-top">
          <h3>Types</h3>
          <ul className="item-list">
            {workspaceInfo.typeIds.map((id, index) => (
              <li key={index}>{id}</li>
            ))}
          </ul>
        </div>
        <div className="panel-top">
          <h3>Algorithms</h3>
          <ul className="item-list">
            {workspaceInfo.algorithmIds.map((id, index) => (
              <li key={index}>{id}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bottom-panels">
        <div className="panel-bottom-left">
          <h3>Flows</h3>
          <div className="flows-container">
            {workspaceInfo.flowIds.map((flowId, index) => (
              <pre key={Math.random()} className="flow-code">
                <img src={`/${flowId}.svg`} alt={flowId} />
              </pre>
            ))}
          </div>
        </div>
        <div className="panel-bottom-right">
          <h3>Logs</h3>
          <pre className="logs-container">{logs}</pre>
        </div>
      </div>
      <div className="input-container">
        <input
          type="text"
          className="prompt-input"
          placeholder="Enter your prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-submit" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-refresh" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
