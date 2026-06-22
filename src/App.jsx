import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { bomSources } from "./data/bomSources.js";
import { parseBomParts, sortParts } from "./utils/bomParser.js";
import { criticalParts } from "./data/criticalParts.js";
import { orders } from "./data/orders.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import './App.css'

function App() {
  const [modelNumber, setModelNumber] = useState("");
  const [orderQty, setOrderQty] = useState(0);
  const [bomParts, setBomParts] = useState([]);
  const [prefixFilter, setPrefixFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [monthlyRequirements, setMonthlyRequirements] = useState([]);

  const getBomSourceForModel = (model) => {
    const trimmedModel = model.trim();
    return (
      bomSources[trimmedModel] ||
      bomSources[trimmedModel.replace(/^M/, "")] ||
      bomSources[`M${trimmedModel}`]
    );
  };

  const handleMonthlyRequirements = () => {

  console.log("Starting monthly BOM aggregation...");

  const monthlyData = orders.map((order) => ({
    model: order.model,
    quantity: order.quantity,
    status: bomSources[order.model]
      ? "BOM Found"
      : "BOM Missing",
  }));

  setMonthlyRequirements(monthlyData);
};
  const [orderPeriod, setOrderPeriod] = useState("all");

  const readBomPdf = async () => {
    const selectedBom = getBomSourceForModel(modelNumber);

    if (!selectedBom) {
      alert("Model not found or BOM file not available.");
      return;
    }

    try {
      const response = await fetch(selectedBom);
      if (!response.ok) {
        throw new Error(`BOM file not found: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("pdf")) {
        throw new Error(`Selected BOM file is not a valid PDF (content-type: ${contentType}).`);
      }

      const pdfData = await response.arrayBuffer();
      const header = new TextDecoder().decode(new Uint8Array(pdfData, 0, 5));
      if (!header.startsWith("%PDF-")) {
        throw new Error("Selected BOM file is not a valid PDF.");
      }

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
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
      alert("PDF text read successfully");
    } catch (error) {
      console.error("Failed to load BOM PDF:", error);
      alert("Unable to load the BOM PDF. Check the model and BOM file path.");
    }
  };

  const aCount = bomParts.filter((p) => p.partNumber.startsWith("A-")).length;
  const bCount = bomParts.filter((p) => p.partNumber.startsWith("B-")).length;
  const cCount = bomParts.filter((p) => p.partNumber.startsWith("C-")).length;
  const dCount = bomParts.filter((p) => p.partNumber.startsWith("D-")).length;
  const filteredOrders = orders;
  const totalOrders = filteredOrders.length;
  

  const totalUnits = filteredOrders.reduce(
    (sum, order) => sum + order.quantity,
    0
  );

  const totalModels = new Set(
    filteredOrders.map((order) => order.model)
  ).size;
  const highPriorityOrders = filteredOrders.filter(
  (order) => order.quantity >= 100
).length;

  return (
    <div className="dashboard">
      <header className="hero-section">
        <p className="eyebrow">Manufacturing Control Center</p>
        <h1>Production Planning Assistant</h1>
        <p className="subtitle">
          Enter a model number, order quantity, and generate required BOM parts.
        </p>
      </header>

      <div className="top-grid">
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
            <button
              onClick={() => {
                setPrefixFilter("all");
                setCategoryFilter("All Categories");
              }}
            >
              All ({bomParts.length})
            </button>

            <button
              onClick={() => {
                setPrefixFilter("A-");
                setCategoryFilter("All Categories");
              }}
            >
              A ({aCount})
            </button>

            <button
              onClick={() => {
                setPrefixFilter("B-");
                setCategoryFilter("All Categories");
              }}
            >
              B ({bCount})
            </button>

            <button
              onClick={() => {
                setPrefixFilter("C-");
                setCategoryFilter("All Categories");
              }}
            >
              C ({cCount})
            </button>

            <button
              onClick={() => {
                setPrefixFilter("D-");
                setCategoryFilter("All Categories");
              }}
            >
              D ({dCount})
            </button>
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
        </section>

        <section className="orders-panel">
          <h2>Future Orders</h2>

          <div>
            <button onClick={() => setOrderPeriod("all")}>All Orders</button>
            <button onClick={() => setOrderPeriod("week")}>This Week</button>
            <button onClick={() => setOrderPeriod("month")}>This Month</button>
            <button onClick={() => setOrderPeriod("nextMonth")}>Next Month</button>
          </div>

          <p>Order Period: {orderPeriod}</p>

          <div className="value-cards">
            <div className="card">
              <h3>Total Orders</h3>
              <h2>{totalOrders}</h2>
            </div>

            <div className="card">
              <h3>Total Units</h3>
              <h2>{totalUnits}</h2>
            </div>

            <div className="card">
              <h3>Models Planned</h3>
              <h2>{totalModels}</h2>
            </div>
            <div className="card">
              <h3>High Priority Orders</h3>
              <h2>{highPriorityOrders}</h2>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.model}>
                  <td>{order.model}</td>
                  <td>{order.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Monthly Requirements Preview</h3>

<table>
  <thead>
    <tr>
      <th>Model</th>
      <th>Customer</th>
      <th>Quantity</th>
      <th>Status</th>
      <th>Due Date</th>   
    </tr>
  </thead>
  <tbody>
    {monthlyRequirements.map((item) => (
      <tr key={item.model}>
        <td>{item.model}</td>
        <td> item.Customer</td>
        <td>{item.quantity}</td>
         <td> {order.quantity >= 100 ? "🔴 High" : "🟢 Normal"}</td>
        <td>  {order.duedate}</td>
      </tr>
    ))}
  </tbody>
</table>

          <button onClick={handleMonthlyRequirements}>
            Generate Monthly Requirements
          </button>
        </section>
      </div>

      <section className="report-panel">
        <p>
          Showing {bomParts.filter(
            (part) =>
              (prefixFilter === "all" || part.partNumber.startsWith(prefixFilter)) &&
              (categoryFilter === "All Categories" || part.category === categoryFilter) &&
              (
                part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                part.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
          ).length} of {bomParts.length} parts
        </p>

        <h2>Required Parts Report</h2>

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
                  <td>{criticalParts[part.partNumber] || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
