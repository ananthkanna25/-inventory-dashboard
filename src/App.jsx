import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { bomSources } from "./data/bomSources.js";
import { parseBomParts, sortParts } from "./utils/bomParser.js";
import { criticalParts } from "./data/criticalParts.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import './App.css'

function App() {
  const [modelNumber, setModelNumber] = useState("");
  const [orderQty, setOrderQty] = useState(0);
  const [bomParts, setBomParts] = useState([]);
  const [prefixFilter, setPrefixFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");

  const readBomPdf = async () => {
    alert("PDF text read successfully");

    const selectedBom = bomSources[modelNumber];

    if (!selectedBom) {
      alert("Model not found");
      return;
    }

    const loadingTask = pdfjsLib.getDocument({
      url: selectedBom,
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
    }

    const extractedBomParts = parseBomParts(fullText, orderQty);
    const sortedBomParts = sortParts(extractedBomParts);

    setBomParts(sortedBomParts);
  };

  const aCount = bomParts.filter((p) => p.partNumber.startsWith("A-")).length;
  const bCount = bomParts.filter((p) => p.partNumber.startsWith("B-")).length;
  const cCount = bomParts.filter((p) => p.partNumber.startsWith("C-")).length;
  const dCount = bomParts.filter((p) => p.partNumber.startsWith("D-")).length;

  return (
    <div className="dashboard">
      <header className="hero-section">
        <p className="eyebrow">Manufacturing Control Center</p>
        <h1>Production Planning Assistant</h1>
        <p className="subtitle">
          Enter a model number, order quantity, and generate required BOM parts.
        </p>
      </header>

      <section className="planning-card">
        <h2>Production Planning</h2>

        <div>
          <label>Model Number:</label>
          <input
            type="text"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
          />
        </div>

        <div>
          <label>Order Quantity:</label>
          <input
            type="number"
            value={orderQty}
            onChange={(e) => setOrderQty(Number(e.target.value))}
          />
        </div>

        <button onClick={readBomPdf}>Generate Requirements</button>

        <div>
          <button onClick={() => {
            setPrefixFilter("all");
            setCategoryFilter("All Categories");
          }}>All ({bomParts.length})</button>

          <button onClick={() => {
            setPrefixFilter("A-");
            setCategoryFilter("All Categories");
          }}>A ({aCount})</button>

          <button onClick={() => {
            setPrefixFilter("B-");
            setCategoryFilter("All Categories");
         }}>B ({bCount})</button>

          <button onClick={() => {
            setPrefixFilter("C-");
            setCategoryFilter("All Categories");
         }}>C ({cCount})</button>

          <button onClick={() => {
            setPrefixFilter("D-");
            setCategoryFilter("All Categories");
         }}>D ({dCount})</button>

        </div>

        <div>
          <button onClick={() => setCategoryFilter("All Categories")}>All Categories</button>
          <button onClick={() => setCategoryFilter("Electrical")}>Electrical</button>
          <button onClick={() => setCategoryFilter("Mechanical")}>Mechanical</button>
          <button onClick={() => setCategoryFilter("Sub Assembly")}>Sub Assembly</button>
          <button onClick={() => setCategoryFilter("Hardware")}>Hardware</button>
          <button onClick={() => setCategoryFilter("Wires")}>Wires</button>
          <button onClick={() => setCategoryFilter("Consumable")}>Consumable</button>
          <button onClick={() => setCategoryFilter("Other")}>Other</button>
        </div>
        
        <p>
          Showing: {prefixFilter === "all" ? "All Prefixes" : prefixFilter}
          {" | "}
            Category: {categoryFilter}
          </p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
  <input
    type="text"
    placeholder="Search part number or description..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <button
    onClick={() => {
      setPrefixFilter("all");
      setCategoryFilter("All Categories");
      setSearchTerm("");
    }}
  >
    Clear
  </button>
</div>
         <p>
  Showing { 
    bomParts.filter(
      (part) =>
        (prefixFilter === "all" || part.partNumber.startsWith(prefixFilter)) &&
        (categoryFilter === "All Categories" || part.category === categoryFilter) &&
        (
          part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ).length
  } of {bomParts.length} parts
  <h3>Required Parts Report</h3>
</p>
        <table>
          <thead>
            <tr>
              <th>Part Number</th>
              <th>Description</th>
              <th>Qty Per Unit</th>
              <th>Required Qty</th>
              <th>Unit</th>
              <th>Category</th>
              <th>Critical Comment</th>
            </tr>
          </thead>
          <tbody>
            {bomParts
              .filter(
  (part) =>
    (prefixFilter === "all" || part.partNumber.startsWith(prefixFilter)) &&
    (categoryFilter === "All Categories" || part.category === categoryFilter) &&
    (
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
)
              .map((part) => (
                <tr key={part.partNumber}>
                  <td>{part.partNumber}</td>
                  <td>{part.description}</td>
                  <td>{part.qtyPerUnit}</td>
                  <td>{part.requiredQty}</td>
                  <td>{part.unit}</td>
                  <td>{part.category}</td>
                  <td> {criticalParts[part.partNumber] || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
